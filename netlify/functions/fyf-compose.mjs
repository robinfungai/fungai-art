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
//   FYF_FORMULA_RETENTION_DAYS  optional, informational only; enforced
//                                by a separate scheduled cleanup, not
//                                by this endpoint. 0 = retain forever.
//
// See supabase/migrations/20260911_fyf_formulas.sql for the schema
// this endpoint writes to (id + engine versions + profile jsonb +
// formula jsonb + created_at). No IP, no lat/long, no fingerprinting.

import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { compileFormula } from '../../src/server/formula-engine/index.js';

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
    'Access-Control-Allow-Headers': 'Content-Type, X-FYF-Mode',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

// ── Per-IP rate limit ────────────────────────────────────────────
// The compose endpoint is expensive relative to a static page: it
// scans the herb pool + scores every entry + writes to Supabase.
// 8 requests per minute per IP is far above a real user's cadence.
// Netlify functions can run on multiple instances so this is best-
// effort per-instance; the Anthropic-adjacent spend cap does not
// apply here (no MYCO in this endpoint), but Supabase-write cost +
// function invocation cost still matter.
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
  age:        new Set(['under_25','25_40','41_60','60_plus']),
  // sleep accepts BOTH the current 4-option client values AND the new
  // 7-pattern architecture values (Pro's expanded sleep question) —
  // the engine tolerates both, and Step 2 must not restrict either.
  sleep:      new Set([
    'restorative_6plus','not_restorative_6plus','under_6','very_broken',
    'restorative','hard_onset','wakes_middle','early_wake','sleeps_no_rest','vivid_restless',
  ]),
};

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
    p.intentions = raw.intentions.slice(0, INTENTIONS_MAX);
  } else {
    p.intentions = [p.intention];
  }

  // pattern — required, enum
  if (!ENUMS.pattern.has(raw.pattern)) {
    return { ok: false, code: 'PROFILE_INVALID', reason: 'pattern is required and must be one of hot/cold/mixed/depleted' };
  }
  p.pattern = raw.pattern;

  // patternSub — optional short string (the sub-key like 'anger', 'inflamed', …)
  if (raw.patternSub !== undefined) {
    if (typeof raw.patternSub !== 'string' || raw.patternSub.length > 32) {
      return { ok: false, code: 'PROFILE_INVALID', reason: 'patternSub must be a short string' };
    }
    p.patternSub = raw.patternSub;
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

  // _ageConfirmed — required boolean; the entry gate sets this at the
  // start of the flow. Not authoritative on its own (any client can
  // forge it) but its presence means the client acknowledged 18+.
  p._ageConfirmed = !!raw._ageConfirmed;

  // Pro-only fields — accepted as pass-through, validated as short
  // strings or short-string arrays. Currently NOT consumed by the
  // engine per Step 2 constraint #7 — they'll influence formulation
  // in a later separately-approved step.
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
// Everything the audit's constraint #5 forbids is stripped here.
function sanitisedResponse({ formulaId, engineResult, persisted }) {
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
      herbs: engineResult.herbs.map(h => ({
        // Only display-safe fields. Herb.id (numeric catalogue id),
        // category, score, isGABAergic/isCNSStimulant/isTrace, gated
        // flag — all OMITTED. The reserve-formula lookup uses
        // formulaId to fetch the stored formula server-side; the
        // client never needs the internal id.
        name:            h.name,
        botanical:       h.botanical,
        percentage:      h.percentage,
      })),
    },
    safetyReport: {
      // Only the flags the user themselves set — not the count of
      // filtered-out herbs, not their names, not the byFlag breakdown.
      // These would let a scraper reverse-engineer the safety ontology.
      flagsApplied:      (engineResult.filteredOut && Object.keys(engineResult.filteredOut.byFlag || {})) || [],
    },
  };
}

// ── Response helper ──────────────────────────────────────────────
function jsonResponse(status, cors, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
  });
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

  // Compose. The engine internally validates avoid via
  // validateAndNormalizeAvoid — SAFETY_QUESTION_NOT_ANSWERED gets
  // surfaced as a rejected response here.
  let engineResult;
  try {
    engineResult = compileFormula(vp.profile);
  } catch (e) {
    console.error('[fyf-compose] engine threw:', e && e.stack ? e.stack : e);
    return jsonResponse(500, cors, { status: 'error', code: 'INTERNAL_ERROR' });
  }

  if (engineResult.status === 'rejected') {
    return jsonResponse(400, cors, {
      status:  'rejected',
      code:    engineResult.code,
      message: engineResult.reason,
    });
  }

  if (!Array.isArray(engineResult.herbs) || engineResult.herbs.length === 0) {
    return jsonResponse(422, cors, {
      status: 'rejected',
      code:   'NO_VIABLE_FORMULA',
      message: 'No herbs matched the profile after safety filtering.',
    });
  }

  // Persist. Ephemeral fallback if Supabase is unconfigured (dev/
  // local). In production Robin's env vars are set and persistence
  // is required for reservation to work later.
  //
  // SHADOW MODE (Step 3 of P0): if the caller sends
  // `X-FYF-Mode: shadow`, this request is a parallel comparison call
  // from the client (not a real reveal — the client's own engine is
  // still authoritative). We SKIP persistence for shadow calls so
  // real-user reveals don't create thousands of orphan rows during
  // the shadow-testing window. Everything else — validation, engine
  // execution, safety enforcement, response shape — is identical.
  const mode = String(req.headers.get('x-fyf-mode') || '').toLowerCase();
  const isShadow = mode === 'shadow';

  const formulaId = newFormulaId();
  const persistPayload = {
    id:                  formulaId,
    engine_version:      engineResult.engineVersion,
    herb_db_version:     engineResult.herbDbVersion,
    safety_rules_version:engineResult.safetyRulesVersion,
    profile:             vp.profile,             // untrusted → normalised copy
    formula:             engineResult,           // full internal snapshot; reserve-formula reads this
    created_at:          engineResult.capturedAt,
  };

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_SRV = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let persisted = false;
  if (isShadow) {
    // Shadow request — do not persist. Client uses response only for
    // client-side comparison against its own engine output.
  } else if (SUPABASE_URL && SUPABASE_SRV) {
    try {
      const sb = createClient(SUPABASE_URL, SUPABASE_SRV, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error } = await sb.from('fyf_formulas').insert(persistPayload);
      if (error) throw error;
      persisted = true;
    } catch (e) {
      // Persistence failure is a real error path — surface as 500
      // rather than silently returning an ephemeral id in production.
      // (In dev without Supabase configured, we fall through to the
      // ephemeral path below.)
      console.error('[fyf-compose] persist failed:', e && e.message ? e.message : e);
      return jsonResponse(500, cors, {
        status: 'error',
        code:   'PERSIST_FAILED',
        message: 'Formula computed but could not be stored. Please retry.',
      });
    }
  } else {
    // Dev/test path — no Supabase configured. Return the formula with
    // persisted:false so the caller knows reservation won't work.
    console.warn('[fyf-compose] Supabase not configured — returning ephemeral formulaId');
  }

  return jsonResponse(200, cors,
    sanitisedResponse({ formulaId, engineResult, persisted })
  );
}
