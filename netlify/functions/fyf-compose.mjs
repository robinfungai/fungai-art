// ════════════════════════════════════════════════════════════════
// Fungai Art · /api/fyf/compose — SHADOW ENDPOINT (Step 2 of P0)
// ════════════════════════════════════════════════════════════════
//
// Server-authoritative formula composition. Accepts a normalised
// quiz profile, runs the private server-side Formula Engine, persists
// the deterministic formula under an opaque cryptographic id, and
// returns a minimum-necessary display-safe payload.
//
// STATUS: SHADOW. Deployed but not yet called by /find-your-formula
// or /find-your-formula-pro. The client continues to run its own
// local engine + download /herbs-data.js during Steps 3–7.
//
// Consumed inputs:
//   { profile: {…state.answers-shaped…}, requestId?: string }
//
// Never accepted (silently discarded, never used):
//   selectedHerbs · formula · percentages · shortlist · formulaId
//   — every one of these would be a signal the client is trying to
//   pre-compute or forge a formula. The server does not consult them.
//
// Never returned:
//   raw herb records · pharmacology · contraindications · drug
//   interactions · scoring weights · _ax internal axes · category
//   classifier · isTrace / isGABAergic / isCNSStimulant flags ·
//   filtered-out herb lists · numeric database ids (would reveal
//   catalogue structure).
//
// Env vars:
//   SUPABASE_URL              (or VITE_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY
//   FYF_MYCO_DAILY_LIMIT      MYCO calls allowed per day, counted in the
//                             database across every instance (default
//                             100 — supabase-myco-budget.sql). Past it,
//                             formulas are composed without MYCO.
//
// Retention (D6): rows are written with retention_tracked = true, and a
// nightly job in the database deletes unreserved ones after 30 days
// (supabase-fyf-retention.sql). reserve-formula marks reserved_at.
//
// See supabase/migrations/20260911_fyf_formulas.sql for the schema
// this endpoint writes to (id + engine versions + profile jsonb +
// formula jsonb + created_at). No IP, no lat/long, no fingerprinting.

import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { compileFormula, composeFormulaWithMyco, explainForPro } from '../../src/server/formula-engine/index.js';
import { buildDisplayBundle } from '../../src/server/formula-engine/display.js';
import { sanitiseNarrative }  from '../../src/server/formula-engine/narrative-sanitiser.js';
import { verifyPractitioner } from '../../src/server/practitioner.mjs';

// ── Origin gate ──────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://www.fungai.art',
  'https://fungai.art',
  'https://fungai-art.netlify.app',
  'http://localhost:5173',
  'http://localhost:8888',
  'http://127.0.0.1:5173',
];
function corsFor(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin':  allow,
    // X-FYF-Mode allows the browser preflight to permit the shadow-mode
    // header the Step 3 client sets. Content-Type is the standard one.
    'Access-Control-Allow-Headers': 'Content-Type, X-FYF-Mode, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

// ── Per-IP rate limit ────────────────────────────────────────────
// The compose endpoint is expensive relative to a static page: it
// scans the herb pool + scores every entry + writes to Supabase.
// 8 requests per minute per IP is far above a real user's cadence.
// Netlify functions can run on multiple instances so this is best-
// effort per-instance. MYCO spend is capped separately, across all
// instances, by the daily budget in the database (mycoSkipReason).
const RATE_WINDOW_MS      = 60_000;
const RATE_MAX_PER_WINDOW = 8;
const rateState = new Map();
function rateLimit(ip) {
  const now  = Date.now();
  const slot = rateState.get(ip);
  if (!slot || now - slot.windowStart > RATE_WINDOW_MS) {
    rateState.set(ip, { count: 1, windowStart: now });
    return { ok: true };
  }
  if (slot.count >= RATE_MAX_PER_WINDOW) {
    return { ok: false, retryAfter: Math.ceil((RATE_WINDOW_MS - (now - slot.windowStart)) / 1000) };
  }
  slot.count += 1;
  return { ok: true };
}

// ── Payload cap ──────────────────────────────────────────────────
// A legitimate profile fits comfortably in ~2 KB. 32 KB is generous
// headroom (e.g. a 1 KB notes field × pathological unicode expansion).
// Anything larger is either accidental or hostile — reject with 413.
const MAX_BODY_BYTES = 32 * 1024;

// ── Profile schema validator ─────────────────────────────────────
// The client is untrusted. Every field is either an enum from a
// closed list or a length-bounded string. Unknown fields on the
// profile are silently dropped (not returned). Structural failures
// return PROFILE_INVALID with a stable code the caller can render.

const ENUMS = {
  intention:  new Set(['stress','anxiety','sleep','energy','mood','cognitive','hormones','digestion','immunity','pain','detox','beauty']),
  pattern:    new Set(['hot','cold','mixed','depleted']),
  time:       new Set(['morning','midday','evening','night','any']),
  stress:     new Set(['push','collapse','numb','ride','off']),
  duration:   new Set(['weeks','months','year_plus','lifelong']),
  // under_18 must be accepted here — the engine derives the minor gate
  // from it. Leaving it out rejected every under-18 profile outright.
  age:        new Set(['under_18','under_25','25_40','41_60','60_plus']),
  // sleep accepts BOTH the current 4-option client values AND the new
  // 7-pattern architecture values (Pro's expanded sleep question) —
  // the engine tolerates both, and Step 2 must not restrict either.
  sleep:      new Set([
    'restorative_6plus','not_restorative_6plus','under_6','very_broken',
    'restorative','hard_onset','wakes_middle','early_wake','sleeps_no_rest','vivid_restless',
  ]),
};

// The quiz's sub-answers per body pattern (public/find-your-formula
// Q2 stage B; display.js SUB_COPY holds their copy).
const PATTERN_SUBS = {
  hot:      ['anger', 'flushed', 'inflamed', 'hot_night'],
  cold:     ['cold_hands', 'heavy', 'pale', 'low_drive'],
  mixed:    ['stuck', 'up_down', 'tension', 'sighing'],
  depleted: ['purposeless', 'dry', 'overworked', 'anxious_empty'],
};
const ALL_SUBS = new Set(Object.values(PATTERN_SUBS).flat());

const NOTES_MAX_LEN     = 1000;
const INTENTIONS_MAX    = 3;

function validateProfile(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, code: 'PROFILE_INVALID', reason: 'profile must be a non-array object' };
  }
  const p = {};

  // intention — required, enum
  if (!ENUMS.intention.has(raw.intention)) {
    return { ok: false, code: 'PROFILE_INVALID', reason: 'intention is required and must be one of the 12 intentions' };
  }
  p.intention = raw.intention;

  // intentions — optional ranked array (up to 3), all must be intention enums
  if (raw.intentions !== undefined) {
    if (!Array.isArray(raw.intentions)) {
      return { ok: false, code: 'PROFILE_INVALID', reason: 'intentions must be an array' };
    }
    if (raw.intentions.length > INTENTIONS_MAX) {
      return { ok: false, code: 'PROFILE_INVALID', reason: 'intentions capped at 3 entries' };
    }
    for (const v of raw.intentions) if (!ENUMS.intention.has(v)) {
      return { ok: false, code: 'PROFILE_INVALID', reason: 'intentions contains an unknown value' };
    }
    // The ranking the scorer reads must be a real one: `intention` is
    // first and no goal counts twice — ['stress','stress','stress'] was
    // three scoring events for one goal (external audit 2026-09-29).
    // Normalised rather than refused: the quiz always sends this shape,
    // and an old saved quiz should still compose.
    p.intentions = [...new Set([p.intention, ...raw.intentions])].slice(0, INTENTIONS_MAX);
  } else {
    p.intentions = [p.intention];
  }

  // pattern — required, enum
  if (!ENUMS.pattern.has(raw.pattern)) {
    return { ok: false, code: 'PROFILE_INVALID', reason: 'pattern is required and must be one of hot/cold/mixed/depleted' };
  }
  p.pattern = raw.pattern;

  // patternSub — optional, one of the four sub-answers of the chosen
  // pattern (the quiz's Q2 stage B). Any other string is refused: it was
  // written into the reveal's HTML (external audit 2026-09-29, XSS). The
  // quiz sends '' when no sub-answer was picked; a real sub-answer of a
  // different pattern (changed answer) is dropped, not refused.
  if (raw.patternSub !== undefined && raw.patternSub !== '') {
    if (typeof raw.patternSub !== 'string' || !ALL_SUBS.has(raw.patternSub)) {
      return { ok: false, code: 'PROFILE_INVALID', reason: 'patternSub must be one of the sub-answers of the chosen pattern' };
    }
    if (PATTERN_SUBS[p.pattern].includes(raw.patternSub)) p.patternSub = raw.patternSub;
  }

  // remaining single-value enums
  for (const [key, allowed] of Object.entries(ENUMS)) {
    if (key === 'intention' || key === 'pattern') continue;
    if (raw[key] === undefined) continue;
    if (!allowed.has(raw[key])) {
      return { ok: false, code: 'PROFILE_INVALID', reason: key + ' has an unknown value' };
    }
    p[key] = raw[key];
  }

  // avoid — validated in depth by the engine (SECURITY_FIX path).
  // Here we only check it's an array shape; empty/missing/unknown
  // flag membership is caught downstream by validateAndNormalizeAvoid,
  // which returns SAFETY_QUESTION_NOT_ANSWERED.
  if (raw.avoid !== undefined && !Array.isArray(raw.avoid)) {
    return { ok: false, code: 'PROFILE_INVALID', reason: 'avoid must be an array (["none"] to explicitly declare no flags)' };
  }
  p.avoid = Array.isArray(raw.avoid) ? raw.avoid.filter(x => typeof x === 'string').slice(0, 20) : raw.avoid;

  // notes — optional free text, length-capped
  if (raw.notes !== undefined) {
    if (typeof raw.notes !== 'string') {
      return { ok: false, code: 'PROFILE_INVALID', reason: 'notes must be a string' };
    }
    p.notes = raw.notes.slice(0, NOTES_MAX_LEN);
  }

  // _gatedOptIn — required boolean if ceremonial herbs are to be considered.
  p._gatedOptIn = !!raw._gatedOptIn;

  // _pro — sent only by /find-your-formula-pro. It lets the engine
  // consider pro-only herbs (herbs.ts formula_access: 'pro'). Since
  // 2026-09-28 it is honoured only for a verified practitioner (the
  // handler checks the caller's token — src/server/practitioner.mjs);
  // the engine never honours it for an under-18 profile.
  p._pro = raw._pro === true;

  // _ageConfirmed — required boolean; the entry gate sets this at the
  // start of the flow. Not authoritative on its own (any client can
  // forge it) but its presence means the client acknowledged 18+.
  p._ageConfirmed = !!raw._ageConfirmed;

  // Pro-quiz fields — validated as short strings or short-string arrays.
  // Since engine 2.4 (2026-09-28) the engine reads all of them: scoring
  // nudges in scoring.js, and cycle 'trying_conceive' / prior_herbs
  // 'stimulants_sensitive' | 'bad_reaction' as hard exclusions in
  // safety.js passesProfileSafety.
  const PRO_STRING_FIELDS = ['nervous','energy_curve','digestion','emotional','cycle','support'];
  for (const k of PRO_STRING_FIELDS) {
    if (raw[k] !== undefined) {
      if (typeof raw[k] !== 'string' || raw[k].length > 40) {
        return { ok: false, code: 'PROFILE_INVALID', reason: k + ' must be a short string' };
      }
      p[k] = raw[k];
    }
  }
  const PRO_ARRAY_FIELDS = ['somatic','prior_herbs'];
  for (const k of PRO_ARRAY_FIELDS) {
    if (raw[k] !== undefined) {
      if (!Array.isArray(raw[k]) || raw[k].some(v => typeof v !== 'string' || v.length > 40)) {
        return { ok: false, code: 'PROFILE_INVALID', reason: k + ' must be an array of short strings' };
      }
      p[k] = raw[k].slice(0, 20);
    }
  }

  return { ok: true, profile: p };
}

// ── Opaque formula id ────────────────────────────────────────────
// UUID v4 via node:crypto — 122 bits of entropy. Never sequential,
// never derived from anything about the request, so a caller who
// discovers one formulaId cannot enumerate others by increment. The
// `fyf_` prefix disambiguates from other id types in logs.
function newFormulaId() {
  return 'fyf_' + crypto.randomUUID().replace(/-/g, '');
}

// ── Sanitised response builder ───────────────────────────────────
// Filters the engine's rich output down to the display-safe subset.
//
// AUDIT_FIX (Finding #7): the previous version shipped the raw herb
// metadata (primary_functions, secondary_benefits, energetics,
// spiritual_layer, pharmacology, tcm_element, herb_to_herb_synergy,
// herb_to_herb_caution) to the browser so the client could compute
// display strings. That was a meaningful IP leak — a scraper hitting
// /api/fyf/compose could harvest a substantial subset of the herb DB.
//
// This version pre-computes ALL customer-facing display strings on the
// server (storyText, whyText, per-herb shortNote, synergy/caution
// pairs with their notes) and ships ONLY strings the client needs to
// render. The raw source arrays never leave the server.
//
// Per herb the wire carries: { name, botanical, percentage, shortNote, isTrace }
// Per formula the wire carries: { synergies, cautions, storyText, whyText }
// Everything else stays inside `_engineHerbs` which sanitisedResponse
// receives via engineResult but never puts on the response.
function sanitisedResponse({ formulaId, engineResult, profile, persisted, upgradeEligible }) {
  // engineResult._engineHerbs is the internal-only full-metadata array
  // that display.buildDisplayBundle needs. Fallback empty means the
  // display bundle collapses to empty strings — safe, never crashes.
  const engineHerbs = Array.isArray(engineResult._engineHerbs) ? engineResult._engineHerbs : [];
  const percentages = engineResult.herbs.map(h => h.percentage);
  const display     = buildDisplayBundle({
    profile,
    enrichedHerbs: engineHerbs,
    percentages,
  });

  // Round 2 · Item #7 — sanitise the MYCO narrative once here so both
  // the customer-facing string and the observability field stay in sync.
  const narrativeIn  = engineResult.mycoUsed === true ? engineResult.mycoOverall : '';
  const narrativeOut = engineResult.mycoUsed === true
    ? sanitiseNarrative(narrativeIn, profile)
    : { text: '', action: null, hits: [] };

  return {
    status:              'ok',
    formulaId,                                              // opaque
    engineVersion:       engineResult.engineVersion,
    herbDbVersion:       engineResult.herbDbVersion,
    safetyRulesVersion:  engineResult.safetyRulesVersion,
    createdAt:           engineResult.capturedAt,
    persisted,
    formula: {
      name:              engineResult.name,
      size:              engineResult.formulaSize,
      totalPercentage:   engineResult.percentageTotal,
      herbs: engineResult.herbs.map((h, i) => ({
        // Display-safe fields only. Internal ids, categories, scores,
        // load-cap flags, gated flag — all OMITTED. The reserve-formula
        // lookup uses formulaId to fetch the stored formula server-side;
        // the client never needs internal metadata.
        name:       h.name,
        botanical:  h.botanical,
        percentage: h.percentage,
        // AUDIT_FIX (Finding #7): pre-computed 140-char summary — the
        // SINGLE pharma-derived string per herb that reaches the wire.
        // Raw primary_functions / secondary_benefits / energetics /
        // spiritual_layer / pharmacology / tcm_element / synergy /
        // caution arrays are NEVER shipped.
        shortNote:  display.herbLines[i] ? display.herbLines[i].shortNote : '',
        isTrace:    !!h.isTrace,
      })),
      // Pre-computed formula-level display strings.
      synergies:  display.synergies,
      cautions:   display.cautions,
      storyText:  display.storyText,
      whyText:    display.whyText,
    },
    safetyReport: {
      // Only the flags the bottle was built under — the ones the user
      // ticked plus any their note named — not the count of filtered-out
      // herbs, not their names, not the byFlag breakdown. These would let
      // a scraper reverse-engineer the safety ontology.
      flagsApplied:      (engineResult.safetyFlags || []).filter(f => f !== 'none'),
    },
    // D1 (2026-09-28): safety flags the NOTE named, and the word that named
    // each — so the reveal can say "you mentioned sertraline, so we applied
    // the antidepressant filter". The words are the person's own.
    noteSafety:          noteSafetyForWire(engineResult),
    // Observability fields — tells the caller (and the stored formula
    // used by reserve-formula's admin email) whether MYCO was used or
    // whether we fell back to deterministic. mycoUsed absent (undefined)
    // means shadow-mode compose (deterministic-only by design).
    // mycoFallbackReason is a stable enum from myco-validator.js —
    // safe to expose; contains no proprietary rules or herb data.
    //
    // AUDIT_FIX (Round 2 · Item #7) — mycoOverall now passes through
    // sanitiseNarrative() before hitting the wire. MYCO stays clever
    // internally; the CUSTOMER-facing sentence has HIGH-severity
    // medical claims replaced with a safe deterministic template and
    // LOW-severity phrases (repair X / prescription / absolute claims)
    // soft-rewritten. mycoNarrativeAction lets Robin see what
    // happened in his admin email downstream.
    mycoUsed:            typeof engineResult.mycoUsed === 'boolean' ? engineResult.mycoUsed : null,
    mycoFallbackReason:  engineResult.mycoFallbackReason || null,
    mycoOverall:         engineResult.mycoUsed === true ? narrativeOut.text.slice(0, 1200) : null,
    mycoNarrativeAction: narrativeOut.action,     // 'passed' | 'rewritten' | 'replaced' | null
    mycoUpgradePending:  !!upgradeEligible,
  };
}

function noteSafetyForWire(engineResult) {
  const ns = engineResult && engineResult.noteSafety;
  const hits = ns && Array.isArray(ns.hits) ? ns.hits : [];
  const herbs = ns && Array.isArray(ns.herbsAvoided) ? ns.herbsAvoided : [];
  return {
    flagsAdded:   hits.map(h => h.flag),
    hits:         hits.map(h => ({ flag: h.flag, word: String(h.word || '').slice(0, 40) })),
    // Herbs the note named to avoid, left out of the pool — names the
    // person wrote themselves.
    herbsAvoided: herbs.map(h => ({ name: String(h.name || '').slice(0, 80), word: String(h.word || '').slice(0, 60) })),
  };
}

// ── Response helper ──────────────────────────────────────────────
function jsonResponse(status, cors, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

// ── Storage ──────────────────────────────────────────────────────
// One Supabase client per request; null in dev without the env vars.
// Tests hand in a stand-in so the storage paths run without a network.
let testSupabase = null;
export function _setSupabaseForTests(client) { testSupabase = client; }
function getSupabase() {
  if (testSupabase) return testSupabase;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// ── D8 · Daily MYCO budget ───────────────────────────────────────
// Counted in the database (myco_budget_take), so it holds across every
// Netlify instance, unlike the per-instance rate limit. Returns null to
// go ahead, or the reason MYCO is skipped. It fails CLOSED: if the
// budget cannot be checked, no MYCO call — the person still gets the
// deterministic formula, and the reason is stored with it.
const MYCO_DAILY_LIMIT_DEFAULT = 100;
function mycoDailyLimit() {
  const n = parseInt(process.env.FYF_MYCO_DAILY_LIMIT, 10);
  return Number.isFinite(n) && n >= 0 ? n : MYCO_DAILY_LIMIT_DEFAULT;
}
async function mycoSkipReason(sb) {
  if (!process.env.ANTHROPIC_API_KEY) return null;  // no key: MYCO cannot run, nothing to count
  if (!sb) return null;                              // dev without a database: no shared counter
  try {
    const { data, error } = await sb.rpc('myco_budget_take', { p_limit: mycoDailyLimit() });
    if (error) throw error;
    return data === true ? null : 'MYCO_DAILY_BUDGET_REACHED';
  } catch (e) {
    console.error('[fyf-compose] MYCO budget check failed (run supabase-myco-budget.sql?) — composing without MYCO:', e && e.message ? e.message : e);
    return 'MYCO_BUDGET_UNAVAILABLE';
  }
}

// ── P0 #11 · One formula per request ─────────────────────────────
// The page sends a requestId per visit. The key is that id plus the
// exact answers, so the same answers again (double click, retry after a
// dropped connection) return the stored formula — no second row, no
// second MYCO call — while changed answers compose afresh.
const REQUEST_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;
function stableJson(v) {
  if (Array.isArray(v)) return '[' + v.map(stableJson).join(',') + ']';
  if (v && typeof v === 'object') {
    return '{' + Object.keys(v).sort().filter(k => v[k] !== undefined)
      .map(k => JSON.stringify(k) + ':' + stableJson(v[k])).join(',') + '}';
  }
  return JSON.stringify(v);
}
function requestKey(requestId, profile) {
  if (typeof requestId !== 'string' || !REQUEST_ID_RE.test(requestId)) return null;
  return crypto.createHash('sha256').update(requestId + '|' + stableJson(profile)).digest('hex');
}
async function findByRequestKey(sb, key) {
  try {
    const { data, error } = await sb.from('fyf_formulas')
      .select('id, profile, formula').eq('request_key', key).maybeSingle();
    if (error) throw error;
    return data || null;
  } catch (e) {
    // Most likely the column is not there yet (SQL not run). Compose
    // normally; idempotency simply does not apply.
    console.warn('[fyf-compose] request_key lookup failed:', e && e.message ? e.message : e);
    return null;
  }
}

// findByRequestKey only helps once the first formula is stored: two
// copies of one request arriving together both found nothing and both
// called MYCO (external audit 2026-09-29, #2). So before MYCO a request
// claims its key — one statement in the database, only one copy wins —
// and a copy that finds the key taken waits for that formula instead.
const CLAIM_WAIT_MS = 26_000;   // MYCO's own timeout is 25 s (formula-engine/myco.js)
const CLAIM_POLL_MS = 1_500;
async function claimRequest(sb, key) {
  try {
    const { data, error } = await sb.rpc('fyf_claim_request', { p_key: key });
    if (error) throw error;
    return data === true;
  } catch (e) {
    // Most likely supabase-fyf-claims.sql not run yet: compose as before.
    console.warn('[fyf-compose] request claim unavailable (run supabase-fyf-claims.sql?):', e && e.message ? e.message : e);
    return null;
  }
}
async function releaseRequest(sb, key) {
  try { await sb.rpc('fyf_release_request', { p_key: key }); } catch (_) {}
}
async function waitForFormula(sb, key) {
  for (const until = Date.now() + CLAIM_WAIT_MS; Date.now() < until;) {
    await new Promise(r => setTimeout(r, CLAIM_POLL_MS));
    const row = await findByRequestKey(sb, key);
    if (row) return row;
  }
  return null;
}

// Store a formula. If the database does not have the D6/D8 columns yet
// (the SQL files not run), store it without them rather than failing
// the reveal.
const NEW_COLUMNS = { retention_tracked: 'supabase-fyf-retention.sql', request_key: 'supabase-myco-budget.sql' };
async function insertFormula(sb, payload) {
  let row = payload;
  for (;;) {
    const { error } = await sb.from('fyf_formulas').insert(row);
    const missing = error && Object.keys(NEW_COLUMNS).find(c => c in row && String(error.message || '').includes(c));
    if (!missing) return error || null;
    console.warn('[fyf-compose] column ' + missing + ' missing — run ' + NEW_COLUMNS[missing] + '; storing without it');
    const { [missing]: _dropped, ...rest } = row;
    row = rest;
  }
}

// Practitioner-only: the points behind each herb and the best unseated
// alternatives. The public response deliberately hides scores and ids
// (AUDIT_FIX Finding #7); a verified practitioner gets them because the
// pro tools — "why this herb", swapping — are built on them.
function attachPro(out, profile, engineResult, practitioner) {
  if (!(practitioner && practitioner.ok)) return out;
  try {
    const ids = (engineResult.herbs || []).map(h => h.id);
    out.pro = explainForPro(profile, ids);
    if (out.pro) out.pro.herbIds = ids;
  } catch (e) {
    console.warn('[fyf-compose] pro explanation failed:', e && e.message ? e.message : e);
  }
  return out;
}

// The response for a formula already stored under this request.
function replayResponse(row, profile, practitioner) {
  const out = sanitisedResponse({ formulaId: row.id, engineResult: row.formula, profile: row.profile || profile, persisted: true, upgradeEligible: false });
  out.replayed = true;
  return attachPro(out, profile, row.formula, practitioner);
}

// ── Handler ──────────────────────────────────────────────────────
export default async function handler(req) {
  const origin = req.headers.get('origin') || '';
  const cors   = corsFor(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, cors, { status: 'error', code: 'METHOD_NOT_ALLOWED' });
  }

  // Origin gate — matches the reserve-formula pattern. Requests from
  // an origin that isn't in the allow-list are rejected. Requests with
  // NO origin header still pass through (curl / Postman / native
  // clients) — a full lock would break local dev + testing. If the
  // paid-ad launch reveals cost-abuse from headless scrapers hitting
  // this endpoint, tighten to `require an allowed origin` here.
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return jsonResponse(403, cors, { status: 'error', code: 'ORIGIN_NOT_ALLOWED' });
  }

  // Rate limit BEFORE parsing so a flood of oversized bodies can't
  // burn function-second cost.
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('client-ip') || 'unknown';
  const firstIp = String(ip).split(',')[0].trim();
  const rl = rateLimit(firstIp);
  if (!rl.ok) {
    return jsonResponse(429, { ...cors, 'Retry-After': String(rl.retryAfter) },
      { status: 'error', code: 'RATE_LIMITED', message: 'Too many requests. Try again in a minute.' });
  }

  // Payload cap
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return jsonResponse(413, cors, { status: 'error', code: 'PAYLOAD_TOO_LARGE' });
  }

  let body;
  try { body = JSON.parse(raw); }
  catch (_) {
    return jsonResponse(400, cors, { status: 'error', code: 'MALFORMED_JSON' });
  }

  // Validate the profile schema. Extraneous fields on the body (e.g.
  // an attacker sending `selectedHerbs` / `percentages` / `formulaId`
  // / `shortlist`) are silently DROPPED — validateProfile only reads
  // known keys from body.profile.
  const vp = validateProfile(body && body.profile);
  if (!vp.ok) {
    return jsonResponse(400, cors, { status: 'rejected', code: vp.code, message: vp.reason });
  }

  // Age acknowledgement is a soft requirement — the profile carries
  // _ageConfirmed which the client sets when the 18+ gate is ticked.
  // We do NOT trust it as an actual age assertion (any client can set
  // it to true), but its ABSENCE means the client explicitly did not
  // pass through the gate.
  if (!vp.profile._ageConfirmed) {
    return jsonResponse(400, cors, {
      status: 'rejected',
      code: 'AGE_GATE_NOT_ACKNOWLEDGED',
      message: '_ageConfirmed must be true on the profile.',
    });
  }

  // The pro composer is for verified practitioners (Robin, 2026-09-28).
  // A request that asks for it without a practitioner's token is refused
  // outright — not silently downgraded — so the page can show the
  // sign-in wall instead of a formula built under a different rule.
  let practitioner = null;
  if (vp.profile._pro) {
    try { practitioner = await verifyPractitioner(req); }
    catch (_) { practitioner = { ok: false, reason: 'IDENTITY_UNAVAILABLE' }; }
    if (!practitioner.ok) {
      return jsonResponse(403, cors, {
        status:  'rejected',
        code:    'PRACTITIONER_REQUIRED',
        reason:  practitioner.reason,
        message: 'The pro composer is for Fungai Art practitioners. Sign in with a practitioner account.',
      });
    }
  }

  // Shadow requests (X-FYF-Mode: shadow) are comparison calls: no
  // MYCO, no storage, no budget, no idempotency.
  const isShadow = String(req.headers.get('x-fyf-mode') || '').toLowerCase() === 'shadow';
  const sb  = isShadow ? null : getSupabase();
  const key = sb ? requestKey(body && body.requestId, vp.profile) : null;

  // P0 #11 — the same request again: hand back the formula already
  // stored instead of composing (and paying for MYCO) twice.
  if (key) {
    const prior = await findByRequestKey(sb, key);
    if (prior) return jsonResponse(200, cors, replayResponse(prior, vp.profile, practitioner));
  }

  // Compose. The engine internally validates avoid via
  // validateAndNormalizeAvoid — SAFETY_QUESTION_NOT_ANSWERED gets
  // surfaced as a rejected response here.
  //
  // Step 5.5f · Single-reveal blocking architecture. Robin's product
  // call — the 10-15s wait is intentional UX (growing-plant loader
  // builds anticipation). Compose awaits MYCO + validator +
  // deterministic fallback. The deterministic baseline is computed
  // first, so a rejected profile never takes a call from the daily
  // MYCO budget.
  let engineResult;
  let claimed = false;
  // A request that claimed its key and then fails hands it back, so a
  // retry composes instead of waiting for a formula that never comes.
  const release = async () => { if (claimed) { claimed = false; await releaseRequest(sb, key); } };
  try {
    const baseline = compileFormula(vp.profile);
    if (isShadow || baseline.status !== 'ok') {
      engineResult = baseline;
    } else {
      if (key) {
        const claim = await claimRequest(sb, key);
        if (claim === false) {
          const row = await waitForFormula(sb, key);
          if (row) return jsonResponse(200, cors, replayResponse(row, vp.profile, practitioner));
          // 503 → the page's "Please retry" state, with a Retry button.
          return jsonResponse(503, { ...cors, 'Retry-After': '5' }, {
            status: 'error', code: 'COMPOSE_IN_PROGRESS',
            message: 'Your formula is still being composed. Try again in a moment.',
          });
        }
        claimed = claim === true;
      }
      engineResult = await composeFormulaWithMyco(vp.profile, { baseline, skipMyco: await mycoSkipReason(sb) });
    }
  } catch (e) {
    console.error('[fyf-compose] engine threw:', e && e.stack ? e.stack : e);
    await release();
    return jsonResponse(500, cors, { status: 'error', code: 'INTERNAL_ERROR' });
  }
  const upgradeEligible = false; // legacy field; upgrade endpoint retired

  if (engineResult.status === 'rejected') {
    await release();
    return jsonResponse(400, cors, {
      status:  'rejected',
      code:    engineResult.code,
      message: engineResult.reason,
    });
  }

  // Too few herbs for a bottle (engine 2.5): NO_SAFE_MATCH when the
  // person's safety answers are what emptied it, NO_MATCH when their
  // answers point nowhere. NO_VIABLE_FORMULA stays as the catch-all.
  if (engineResult.status === 'no_match' || !Array.isArray(engineResult.herbs) || engineResult.herbs.length === 0) {
    await release();
    return jsonResponse(422, cors, {
      status:     'rejected',
      code:       engineResult.code || 'NO_VIABLE_FORMULA',
      message:    engineResult.reason || 'No herbs matched the profile after safety filtering.',
      noteSafety: noteSafetyForWire(engineResult),
    });
  }

  // Persist. Ephemeral fallback if Supabase is unconfigured (dev/
  // local). In production Robin's env vars are set and persistence
  // is required for reservation to work later. Shadow calls are never
  // stored.
  const formulaId = newFormulaId();
  const persistPayload = {
    id:                  formulaId,
    engine_version:      engineResult.engineVersion,
    herb_db_version:     engineResult.herbDbVersion,
    safety_rules_version:engineResult.safetyRulesVersion,
    profile:             vp.profile,             // untrusted → normalised copy
    formula:             engineResult,           // full internal snapshot; reserve-formula reads this
    created_at:          engineResult.capturedAt,
    // D6 — this code marks reservations, so the nightly purge may
    // delete this row after 30 days if it is never reserved.
    retention_tracked:   true,
    ...(key ? { request_key: key } : {}),
  };

  let persisted = false;
  if (sb) {
    const error = await insertFormula(sb, persistPayload);
    if (error && error.code === '23505' && key) {
      // The same request arrived twice at once and the other one stored
      // first: return that formula, so there is still only one.
      const prior = await findByRequestKey(sb, key);
      if (prior) return jsonResponse(200, cors, replayResponse(prior, vp.profile, practitioner));
    }
    if (error) {
      // Persistence failure is a real error path — surface as 500
      // rather than silently returning an ephemeral id in production.
      console.error('[fyf-compose] persist failed:', error.message || error);
      await release();
      return jsonResponse(500, cors, {
        status: 'error',
        code:   'PERSIST_FAILED',
        message: 'Formula computed but could not be stored. Please retry.',
      });
    }
    persisted = true;
  } else if (!isShadow) {
    // Dev/test path — no Supabase configured. Return the formula with
    // persisted:false so the caller knows reservation won't work.
    console.warn('[fyf-compose] Supabase not configured — returning ephemeral formulaId');
  }

  const out = sanitisedResponse({ formulaId, engineResult, profile: vp.profile, persisted, upgradeEligible });
  return jsonResponse(200, cors, attachPro(out, vp.profile, engineResult, practitioner));
}
