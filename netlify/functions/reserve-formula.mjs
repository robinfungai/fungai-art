// ════════════════════════════════════════════════════════════════
// Fungai Art · Find-your-formula reservation intake
// ════════════════════════════════════════════════════════════════
// Receives a POST from /find-your-formula/ with the customer's
// contact + quiz answers + resolved formula. Sends TWO emails via
// Resend:
//   1. To Robin (or NEWSLETTER_REPLY_TO) — the full reservation so
//      he can start the extract and follow up with a Stripe link.
//   2. To the customer — a warm confirmation with the formula name,
//      the herbs, and the "next step" copy.
//
// Required Netlify env vars:
//   RESEND_API_KEY   — the Resend API key (re_...)
// Optional env vars:
//   FORMULA_FROM     — default 'Fungai Art <noreply@fungai.art>'
//   FORMULA_INBOX    — default 'robin@fungai.art' (Robin's inbox)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — enables formulaId lookup
//                                              (Step 5 dual-mode)
//
// The subscribe-newsletter function silently dropped everything
// except `email`, which is why reservations were vanishing before
// this endpoint existed.
//
// STEP 7 · formulaId-only (server-authoritative reservation):
//   Every reservation MUST carry a `formulaId` (opaque fyf_<32-hex>).
//   The endpoint looks the formula up in the private fyf_formulas
//   store and uses the STORED formula/profile as the source of truth.
//   Any `formula`/`percentages`/`synergies`/`quiz`/`formulaName`
//   fields the client also sends are IGNORED — a client cannot forge
//   a formula and have the reservation email carry it. See
//   resolveAuthoritativeFormula() below.
//
//   Requests without a formulaId are REJECTED with FORMULA_ID_REQUIRED
//   (Step 7 removed the pre-Step-5 legacy path where the client body
//   supplied the formula shape directly).
// ════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

// ── Origin gate ──────────────────────────────────────────────────
// Locked to Fungai origins so a random site can't POST here and
// force Resend-branded emails to arbitrary addresses under our name.
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
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

// ── Per-IP rate limit ────────────────────────────────────────────
// 3 reservations per IP per minute. Real humans reserve once, then
// wait for the confirmation email. Any client hitting this ceiling
// is either testing or abusing; hard cap regardless.
const RATE_WINDOW_MS      = 60_000;
const RATE_MAX_PER_WINDOW = 3;
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
  slot.count++;
  return { ok: true };
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, slot] of rateState.entries()) {
    if (now - slot.windowStart > RATE_WINDOW_MS * 2) rateState.delete(ip);
  }
}, RATE_WINDOW_MS).unref?.();

// ── Round 2 · Item #4 · idempotency (light, in-memory) ──────────
// Full distributed idempotency needs a shared store (Supabase table
// with unique constraint, or Redis) — see Batch D. For now, a per-
// instance Map keyed by the client's Idempotency-Key header. Catches
// double-clicks and rapid retries within the same Netlify container.
//
// Cross-container replays (rare — Netlify's warm containers usually
// serve for minutes) will still slip through until Batch D lands the
// durable table. Documented; not a regression from the previous
// behaviour (which had zero idempotency).
const IDEMP_TTL_MS = 5 * 60_000;         // 5 minutes
const idempCache   = new Map();          // key → { body, httpStatus, expiresAt }

function idempotencyGet(key) {
  const slot = idempCache.get(key);
  if (!slot) return null;
  if (Date.now() > slot.expiresAt) { idempCache.delete(key); return null; }
  return slot;
}
function idempotencyPut(key, body, httpStatus) {
  if (!key) return;
  idempCache.set(key, { body, httpStatus, expiresAt: Date.now() + IDEMP_TTL_MS });
}
setInterval(() => {
  const now = Date.now();
  for (const [key, slot] of idempCache.entries()) {
    if (now > slot.expiresAt) idempCache.delete(key);
  }
}, IDEMP_TTL_MS).unref?.();

// Validate the client-supplied Idempotency-Key header. Optional — if
// missing/malformed we log + continue without dedup (backwards compat
// with old clients pre-Round-2). RFC-ish shape: 8-64 chars, printable
// ASCII, no whitespace. A UUID v4 (36 chars) fits comfortably.
const IDEMP_KEY_RE = /^[A-Za-z0-9_\-]{8,64}$/;
function validateIdempotencyKey(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  return IDEMP_KEY_RE.test(s) ? s : null;
}

// ─────────────────────────────────────────────────────────────────
// STEP 5 · Authoritative-formula resolver
// ─────────────────────────────────────────────────────────────────
// When the client sends `formulaId`, we look it up in the private
// fyf_formulas store and USE THE STORED FORMULA as the source of
// truth — client-supplied `formula`/`percentages`/`synergies`/`quiz`
// fields are IGNORED entirely in that path. This closes the tampering
// gap where the client could pre-compute a formula and post whatever
// they wanted at reservation time.
//
// The formulaId format is enforced (opaque `fyf_<32-hex>` from Step 2)
// so a malformed id is rejected before any DB lookup runs.
//
// Extracted into a named export so tests can drive it with a stub
// Supabase client — the module-level `handler` uses it with a real
// client from env vars.
export const FORMULA_ID_RE = /^fyf_[a-f0-9]{32}$/;

// Round 2 · Item #5 — bottle-size validation. Exported so tests can
// drive the same allowlist the handler uses without duplication.
export const ALLOWED_BOTTLE_SIZES = [15, 30];
export const DEFAULT_BOTTLE_ML    = 30;
export function normaliseBottleMl(raw) {
  if (raw === undefined || raw === null) return DEFAULT_BOTTLE_ML;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return DEFAULT_BOTTLE_ML;
  if (!ALLOWED_BOTTLE_SIZES.includes(n)) return DEFAULT_BOTTLE_ML;
  return n;
}

export async function resolveAuthoritativeFormula({ rawFormulaId, sbClient }) {
  const id = String(rawFormulaId || '').trim();
  // Step 7: formulaId is REQUIRED. Absent id → missing_id (handler
  // rejects with 400 FORMULA_ID_REQUIRED). The pre-Step-5 legacy
  // branch that accepted client-supplied formula/percentages/quiz was
  // removed as part of Step 7 — the client cannot forge a formula.
  if (!id) return { source: 'missing_id' };
  if (!FORMULA_ID_RE.test(id)) return { source: 'invalid_id' };
  if (!sbClient) return { source: 'lookup_unavailable' };
  try {
    const { data, error } = await sbClient
      .from('fyf_formulas')
      .select('id, engine_version, herb_db_version, safety_rules_version, profile, formula, created_at')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { source: 'not_found' };
    return { source: 'authoritative', row: data };
  } catch (e) {
    return { source: 'lookup_error', error: e };
  }
}

export default async function handler(req) {
  const origin = req.headers.get('origin') || '';
  const cors   = corsFor(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405, cors);

  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return json({ error: 'Origin not allowed.' }, 403, cors);
  }

  // Round 2 · Item #4 — idempotency short-circuit. If we've seen this
  // Idempotency-Key in the last 5 min, replay the cached response
  // instead of processing (and re-sending emails, re-creating reservation
  // rows). Rate limiter runs AFTER this — a cached replay doesn't consume
  // a rate-limit slot because no real work is done.
  const idempKey = validateIdempotencyKey(req.headers.get('idempotency-key'));
  if (idempKey) {
    const cached = idempotencyGet(idempKey);
    if (cached) {
      console.log('[reserve-formula] idempotency HIT key=' + idempKey.slice(0, 8) + '…');
      return json(cached.body, cached.httpStatus, { ...cors, 'X-Idempotency-Replay': 'true' });
    }
  }

  const ip = (req.headers.get('x-nf-client-connection-ip')
           || (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim()
           || 'unknown').slice(0, 64);
  const rl = rateLimit(ip);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: 'Too many reservations from this address — try again in a minute.' }), {
      status: 429,
      headers: { ...cors, 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter || 60) },
    });
  }

  let body;
  try { body = await req.json(); }
  catch { return json({ error: 'Bad JSON body' }, 400, cors); }

  // ── Geo capture — MINIMIZED (Round 2 · Item #2) ───────────────
  // The questionnaire touches health-adjacent selections (pregnancy,
  // medications, mental-health flags). Collecting precise geo alongside
  // that data is over-collection under GDPR minimisation. Retained
  // fields, with documented rationale:
  //
  //   country — operationally useful. Robin needs to know the ship-to
  //             country upfront (EU vs US vs other → different shipping
  //             + import + herbal-import rules), and country is also
  //             one of the required form fields the customer types.
  //             The Netlify-derived value is a sanity cross-check only,
  //             never persisted separately.
  //
  // Explicitly DROPPED (were captured pre-Round 2):
  //   city         — no operational use in the reservation flow
  //   subdivision  — no operational use
  //   timezone     — no operational use
  //   latitude     — precise coords have no bearing on formula
  //   longitude    — precise coords have no bearing on formula
  //   ip           — not needed for reservation; rate-limiting reads
  //                  x-forwarded-for at request time but does not store it
  //
  // Nothing in the reservation flow needs a coord/city/IP. If shipping
  // logistics ever needs city, the customer types it into the form —
  // no need for silent header capture.
  let geo = { country: null };
  try {
    const rawGeo = req.headers.get('x-nf-geo');
    if (rawGeo) {
      const parsed = JSON.parse(rawGeo);
      geo.country = parsed.country?.name || parsed.country?.code || null;
    }
    if (!geo.country) geo.country = req.headers.get('x-country') || null;
  } catch (_) { /* headers missing / malformed — leave geo blank */ }

  const email   = String(body.email   || '').trim().toLowerCase();
  const name    = String(body.name    || '').trim().slice(0, 100);
  const city    = String(body.city    || '').trim().slice(0, 80);
  const country = String(body.country || '').trim().slice(0, 80);
  const notes   = String(body.notes   || '').trim().slice(0, 1000);
  // Round 2 · Item #5 — bottle size allowlist. See normaliseBottleMl
  // at the top of this file. Client cannot dictate the pour spec that
  // lands in Robin's admin email. Silent snap-to-default (with log) on
  // invalid input; we don't reject the whole reservation over an ml bug.
  const bottleMlSnappedFrom = body.bottleMl;
  const bottleMl            = normaliseBottleMl(body.bottleMl);
  if (bottleMlSnappedFrom !== undefined && bottleMlSnappedFrom !== null && bottleMl !== Number(bottleMlSnappedFrom)) {
    console.warn('[reserve-formula] rejected bottleMl=' + JSON.stringify(bottleMlSnappedFrom) + ' → snapping to ' + bottleMl);
  }

  // ── STEP 7 · Authoritative-formula resolution ─────────────────
  // formulaId is REQUIRED. We look it up in the private fyf_formulas
  // store and use the STORED formula as the source of truth. Any
  // `formula` / `percentages` / `synergies` / `quiz` / `formulaName`
  // fields the client also sent are IGNORED — a client cannot forge
  // a formula and have the reservation email carry it.
  const rawFormulaId = String(body.formulaId || '').trim();
  const SUPABASE_URL_LOCAL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_SRV_LOCAL = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const sbClient = (SUPABASE_URL_LOCAL && SUPABASE_SRV_LOCAL)
    ? createClient(SUPABASE_URL_LOCAL, SUPABASE_SRV_LOCAL, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;
  const resolved = await resolveAuthoritativeFormula({ rawFormulaId, sbClient });

  // Explicit routing on the resolver outcome. Only 'authoritative'
  // is allowed to proceed; every other value is a hard reject.
  if (resolved.source === 'missing_id') {
    return json({
      status: 'rejected', code: 'FORMULA_ID_REQUIRED',
      message: 'Please complete the reading first so a formula can be reserved.',
    }, 400, cors);
  }
  if (resolved.source === 'invalid_id') {
    return json({ status: 'rejected', code: 'FORMULA_ID_INVALID' }, 400, cors);
  }
  if (resolved.source === 'lookup_unavailable') {
    // formulaId was sent but this deployment can't verify it. Do NOT
    // silently accept — that would defeat the point.
    console.error('[reserve-formula] formulaId sent but Supabase unconfigured');
    return json({ status: 'error', code: 'FORMULA_LOOKUP_UNAVAILABLE' }, 503, cors);
  }
  if (resolved.source === 'not_found') {
    return json({
      status: 'rejected', code: 'FORMULA_NOT_FOUND',
      message: 'This reading is no longer available. Please retake the quiz.',
    }, 404, cors);
  }
  if (resolved.source === 'lookup_error') {
    console.error('[reserve-formula] formulaId lookup failed:', resolved.error && resolved.error.message);
    return json({ status: 'error', code: 'FORMULA_LOOKUP_FAILED' }, 500, cors);
  }

  // Only 'authoritative' reaches here. Derive the fields the rest of
  // this function uses from the STORED row (never from client body).
  const row           = resolved.row;
  const storedFormula = row.formula || {};
  const storedHerbs   = Array.isArray(storedFormula.herbs) ? storedFormula.herbs : [];
  const formulaName   = String(storedFormula.name || '').slice(0, 80);
  const quiz          = (row.profile && typeof row.profile === 'object') ? row.profile : {};
  const formula       = storedHerbs.map(h => ({ id: h.id, name: h.name, botanical: h.botanical || '' }));
  const percentages   = storedHerbs.map(h => h.percentage);
  const synergies     = Array.isArray(storedFormula.synergies) ? storedFormula.synergies : [];
  const engineVersion = row.engine_version || '';

  // Non-PII log line — just the formulaId (opaque, non-enumerable)
  // and engine version.
  console.log('[reserve-formula] source=authoritative',
    'formulaId=' + rawFormulaId,
    'engine=' + (engineVersion || '-'));
  // ── Micronutrient allies · UNTRUSTED CLIENT INPUT (Round 2 · #6) ──
  // The client currently computes possibleMicronutrients from the quiz
  // and passes them through for Robin's admin-only email. Post-audit
  // this is treated as UNTRUSTED — a hostile client could forge the
  // list to plant misleading advisories in Robin's inbox.
  //
  // Two guards until the compute moves server-side (deferred):
  //  1. Hard length + shape sanitisation (was already partial — now
  //     also caps individual field lengths so a giant string can't
  //     bloat the email).
  //  2. Rendered under a bold "UNVERIFIED / client-computed" banner
  //     in Robin's email so he knows this section is NOT authoritative
  //     and should be sanity-checked. Removed entirely if the client
  //     didn't send it; never fabricated server-side.
  //
  // Follow-up: move computeMicronutrients() to the server so the
  // authoritative flag can flip and this banner comes off.
  const possibleMicronutrients = Array.isArray(body.possibleMicronutrients)
    ? body.possibleMicronutrients
        .slice(0, 15)
        .filter(x => x && typeof x.nutrient === 'string')
        .map(x => ({
          nutrient: String(x.nutrient).slice(0, 80),
          reason:   String(x.reason || '').slice(0, 300),
          priority: Number.isFinite(Number(x.priority)) ? Math.max(0, Math.min(10, Number(x.priority))) : 0,
        }))
    : [];

  // Rich customer-email content — the story + per-herb one-liners
  // the in-app reveal shows. Rendered into the confirmation email so
  // the reveal continues in the inbox (Robin's ask: "they need to
  // reveal more on email"). Strip any HTML tags — the client-side
  // story generator wraps some phrases in <em>/<strong>; keep the
  // text, drop the markup so email clients render safely.
  const stripHtml = s => String(s || '').replace(/<[^>]*>/g, '').slice(0, 1200);
  const storyText = stripHtml(body.storyText);
  const herbNotes = Array.isArray(body.herbNotes)
    ? body.herbNotes.slice(0, 10).map(n => stripHtml(n).slice(0, 200))
    : [];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Invalid email address' }, 400, cors);
  if (!name || !city || !country) return json({ error: 'Missing name / city / country' }, 400, cors);

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    // Log intentionally omits PII (was logging email + name + city +
    // country before). Robin sees the config problem in the function
    // log without customer data hanging around in a plaintext log
    // stream — matches PII-hygiene practice for the newsletter fn.
    console.error('[reserve-formula] RESEND_API_KEY not set — reservation email skipped');
    // Return success so the customer sees a positive UI.
    return json({ ok: true, sent: false, note: 'Reservation received. Confirmation email pending — Resend key missing on server.' }, 200, cors);
  }

  const from  = process.env.FORMULA_FROM  || 'Fungai Art <noreply@fungai.art>';
  const inbox = process.env.FORMULA_INBOX || 'robin@fungai.art';

  // Build a rich herb-line array Robin can pour from directly. Each
  // entry is { name, pct, ml } so the admin email carries the mixing
  // spec — no manual math at the bench.
  const herbLines = formula.map((f, i) => {
    const pct = Number(percentages[i]) || 0;
    const ml  = Math.round(bottleMl * pct) / 100; // rounds to 0.01 ml
    return { name: (f.name || f.id || ''), id: f.id || '', pct, ml };
  }).filter(h => h.name);
  const herbList = herbLines.map(h => h.name);

  // ── 1. Notify Robin ────────────────────────────────────────────
  const robinSubject = `✦ Formula reservation · ${formulaName || 'unnamed'} · ${name}${geo.country ? ' · ' + geo.country : ''}`;
  const robinHtml = buildRobinHtml({ email, name, city, country, notes, formulaName, quiz, herbLines, synergies, bottleMl, geo, possibleMicronutrients, formulaId: rawFormulaId, engineVersion });
  const robinText = buildRobinText({ email, name, city, country, notes, formulaName, quiz, herbLines, synergies, bottleMl, geo, possibleMicronutrients, formulaId: rawFormulaId, engineVersion });

  // ── 2. Confirm to customer ─────────────────────────────────────
  const customerSubject = `Your formula is reserved · ${formulaName || 'Fungai Art'}`;
  const customerHtml = buildCustomerHtml({ name, formulaName, herbList, herbLines, storyText, herbNotes, synergies, quiz });
  const customerText = buildCustomerText({ name, formulaName, herbList, herbLines, storyText, herbNotes, synergies, quiz });

  const results = await Promise.allSettled([
    sendResend(RESEND_API_KEY, { from, to: [inbox], reply_to: email,  subject: robinSubject,    html: robinHtml,    text: robinText }),
    sendResend(RESEND_API_KEY, { from, to: [email], reply_to: inbox,  subject: customerSubject, html: customerHtml, text: customerText }),
  ]);
  const robinOk    = results[0].status === 'fulfilled' && results[0].value.ok;
  const customerOk = results[1].status === 'fulfilled' && results[1].value.ok;
  if (!robinOk || !customerOk) {
    console.error('[reserve-formula] partial Resend failure', {
      robinOk, customerOk,
      robinErr:    results[0].status === 'rejected' ? String(results[0].reason)                   : (results[0].value?.detail || null),
      customerErr: results[1].status === 'rejected' ? String(results[1].reason)                   : (results[1].value?.detail || null),
    });
  }
  // ── Round 2 · Item #3 · explicit reservation semantics ──────
  // Three tri-state outcomes the client MUST branch on (never on
  // res.ok alone):
  //
  //   confirmed → both emails sent. Show "Your formula is reserved.
  //               Robin will be in touch." Full-confidence copy.
  //   partial   → one email failed. Reservation is durable (Robin
  //               got the notification OR would get retried by
  //               follow-up flow), but customer confirmation
  //               didn't reach the inbox. UI should say "Reservation
  //               received. Confirmation email delayed — check spam
  //               or reach Robin directly at robin@fungai.art."
  //   failed    → nothing landed. UI must NOT claim reservation;
  //               show the error state + retry.
  //
  // Semantic HTTP mapping:
  //   200 → confirmed
  //   202 → partial (accepted for follow-up)
  //   500 → failed (nothing durable landed)
  let status, httpStatus;
  if (robinOk && customerOk)      { status = 'confirmed'; httpStatus = 200; }
  else if (robinOk || customerOk) { status = 'partial';   httpStatus = 202; }
  else                            { status = 'failed';    httpStatus = 500; }

  const responseBody = {
    status,                              // ← the semantic field the client reads
    ok: robinOk && customerOk,           // legacy field for stale clients
    sent: robinOk && customerOk,         // legacy field
    partial: !robinOk || !customerOk,    // legacy field
    robinOk, customerOk,
    // Echo the (minimised, country-only per Item #2) geo back so
    // the client can include it in the Supabase Formula Book insert.
    geo: geo,
  };

  // Round 2 · Item #4 — cache the response under the idempotency key
  // so a repeat POST within 5 min replays instead of re-sending emails.
  // ONLY cache non-failure outcomes; a 'failed' reservation should be
  // retryable (network flake, transient Resend outage, etc). Caching
  // the failure would trap the customer in a permanent failed state.
  if (idempKey && status !== 'failed') {
    idempotencyPut(idempKey, responseBody, httpStatus);
  }

  return json(responseBody, httpStatus, cors);
}

async function sendResend(key, payload){
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, detail: data };
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, detail: String(e) };
  }
}

function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function json(body, status = 200, cors = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

// ── Email bodies ─────────────────────────────────────────────────

function buildRobinHtml({ email, name, city, country, notes, formulaName, quiz, herbLines, synergies, bottleMl, geo, possibleMicronutrients, formulaId, engineVersion }){
  geo = geo || {};
  possibleMicronutrients = Array.isArray(possibleMicronutrients) ? possibleMicronutrients : [];
  const q = quiz || {};
  const totalPct = herbLines.reduce((s, h) => s + (h.pct || 0), 0);
  const totalMl  = herbLines.reduce((s, h) => s + (h.ml  || 0), 0);
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#060809;color:#C9B894;font-family:Georgia,serif;">
    <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
      <div style="background:#0F1014;border:0.5px solid rgba(232,177,75,.22);border-radius:12px;padding:32px 28px;">
        <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:.32em;text-transform:uppercase;color:#E8B14B;margin-bottom:14px;">✦ New formula reservation</div>
        <h1 style="font-family:Georgia,serif;font-style:italic;font-weight:400;font-size:26px;color:#E6D9B5;margin:0 0 8px;line-height:1.15;">${esc(formulaName || 'Unnamed formula')}</h1>
        <p style="font-size:14px;color:#8B7E62;margin:0 0 22px;">for <strong style="color:#EDE5D8;">${esc(name)}</strong> · ${esc(city)}, ${esc(country)} · <strong style="color:#F5D689;">${bottleMl} ml</strong> bottle</p>

        <!-- Source badge — server-authoritative (Step 7: only mode) -->
        <div style="margin:0 0 18px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:.16em;color:#7bd4a1;">
          ◇ server-authoritative · id ${esc(formulaId)} · engine ${esc(engineVersion || '-')}
        </div>

        <!-- POUR SPEC — table Robin can work from directly at the bench -->
        <div style="margin:0 0 6px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#E8B14B;">Pour spec · ${bottleMl} ml total</div>
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#141821;border:0.5px solid rgba(232,177,75,.14);border-radius:8px;overflow:hidden;margin:0 0 16px;">
          <thead>
            <tr style="background:#1A1E24;">
              <th align="left"  style="padding:8px 12px;font-family:'Courier New',monospace;font-size:9.5px;letter-spacing:.16em;color:#8B7E62;text-transform:uppercase;font-weight:normal;">Herb</th>
              <th align="right" style="padding:8px 12px;font-family:'Courier New',monospace;font-size:9.5px;letter-spacing:.16em;color:#8B7E62;text-transform:uppercase;font-weight:normal;">%</th>
              <th align="right" style="padding:8px 12px;font-family:'Courier New',monospace;font-size:9.5px;letter-spacing:.16em;color:#8B7E62;text-transform:uppercase;font-weight:normal;">ml</th>
            </tr>
          </thead>
          <tbody>
            ${herbLines.map(h => `<tr>
              <td style="padding:9px 12px;border-top:0.5px solid rgba(232,177,75,.08);font-size:14px;color:#EDE5D8;">${esc(h.name)}</td>
              <td align="right" style="padding:9px 12px;border-top:0.5px solid rgba(232,177,75,.08);font-family:'Courier New',monospace;font-size:13px;color:#F5D689;">${h.pct}%</td>
              <td align="right" style="padding:9px 12px;border-top:0.5px solid rgba(232,177,75,.08);font-family:'Courier New',monospace;font-size:13px;color:#F5D689;">${h.ml.toFixed(2)}</td>
            </tr>`).join('')}
            <tr>
              <td style="padding:9px 12px;border-top:0.5px solid rgba(232,177,75,.28);font-family:'Courier New',monospace;font-size:10px;letter-spacing:.14em;color:#8B7E62;text-transform:uppercase;">Total</td>
              <td align="right" style="padding:9px 12px;border-top:0.5px solid rgba(232,177,75,.28);font-family:'Courier New',monospace;font-size:12px;color:#8B7E62;">${totalPct}%</td>
              <td align="right" style="padding:9px 12px;border-top:0.5px solid rgba(232,177,75,.28);font-family:'Courier New',monospace;font-size:12px;color:#8B7E62;">${totalMl.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        ${synergies && synergies.length ? `
        <div style="margin:0 0 6px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#A88FE0;">Woven synergies</div>
        <ul style="font-size:13px;line-height:1.75;color:#C9B894;padding-left:18px;margin:0 0 16px;">
          ${synergies.map(s => `<li><strong style="color:#EDE5D8;">${esc(s.a)} + ${esc(s.b)}</strong> &mdash; <em>${esc((s.note || '').replace(/^[^—:]*[—:]\\s*/, ''))}</em></li>`).join('')}
        </ul>` : ''}

        <!-- CUSTOMER READING -->
        <div style="margin:0 0 6px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#E8B14B;">Their reading</div>
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:13px;color:#C9B894;">
          <tr><td style="padding:6px 0;color:#8B7E62;width:120px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;">Email</td><td style="padding:6px 0;"><a href="mailto:${esc(email)}" style="color:#F5D689;text-decoration:none;">${esc(email)}</a></td></tr>
          <tr><td style="padding:6px 0;color:#8B7E62;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;">Intention</td><td style="padding:6px 0;">${esc(q.intention || '—')}</td></tr>
          <tr><td style="padding:6px 0;color:#8B7E62;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;">Body</td><td style="padding:6px 0;">${esc(q.pattern || '—')}${q.patternSub ? ' &middot; ' + esc(q.patternSub) : ''}</td></tr>
          <tr><td style="padding:6px 0;color:#8B7E62;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;">Rhythm</td><td style="padding:6px 0;">${esc(q.time || '—')} hardest</td></tr>
          <tr><td style="padding:6px 0;color:#8B7E62;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;">Stress</td><td style="padding:6px 0;">${esc(q.stress || '—')}</td></tr>
          <tr><td style="padding:6px 0;color:#8B7E62;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;">Filters</td><td style="padding:6px 0;">${esc(Array.isArray(q.avoid) ? q.avoid.join(', ') : (q.avoid || '—'))}</td></tr>
          ${q.duration ? `<tr><td style="padding:6px 0;color:#8B7E62;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;">Duration</td><td style="padding:6px 0;">${esc(q.duration)}</td></tr>` : ''}
          ${q.age      ? `<tr><td style="padding:6px 0;color:#8B7E62;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;">Age</td><td style="padding:6px 0;">${esc(q.age)}</td></tr>` : ''}
          ${q.sleep    ? `<tr><td style="padding:6px 0;color:#8B7E62;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;">Sleep</td><td style="padding:6px 0;">${esc(q.sleep)}</td></tr>` : ''}
        </table>

        ${notes ? `<div style="margin-top:20px;padding:14px 16px;background:#1A1E24;border-left:2px solid #E8B14B;border-radius:4px;"><div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#8B7E62;margin-bottom:6px;">Priority + prior herb experience</div><div style="font-family:Georgia,serif;font-style:italic;font-size:14px;color:#EDE5D8;line-height:1.7;">"${esc(notes)}"</div></div>` : ''}

        ${possibleMicronutrients.length ? `
        <!-- MICRONUTRIENT ALLIES · UNVERIFIED (client-computed).
             Round 2 · Item #6: this section is CLIENT-SUPPLIED and
             NOT authoritative until computeMicronutrients moves
             server-side. A hostile client could forge entries. Robin
             should sanity-check every row before mentioning any of
             them to the customer. Amber-warning colour reflects this. -->
        <div style="margin-top:20px;padding:16px 18px;background:#241a0f;border:0.5px solid rgba(232,177,75,.35);border-radius:8px;">
          <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#E8B14B;margin-bottom:6px;">⚠ Possible micronutrient allies · UNVERIFIED (client-computed)</div>
          <div style="font-family:Georgia,serif;font-style:italic;font-size:11.5px;color:#C9B894;line-height:1.55;margin-bottom:12px;">These entries were computed in the customer's browser and shipped as-is. Treat as directional only — a modified frontend could forge entries. Do not repeat verbatim to the customer without your own clinical read. Server-side compute is a follow-up.</div>
          <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:13px;color:#C9B894;">
            ${possibleMicronutrients.map(m => `<tr>
              <td style="padding:6px 8px 6px 0;vertical-align:top;color:#F5D689;font-family:'Courier New',monospace;font-size:12px;letter-spacing:.04em;white-space:nowrap;width:170px;">${esc(m.nutrient)}</td>
              <td style="padding:6px 0;color:#8B7E62;font-family:Georgia,serif;font-style:italic;font-size:12.5px;line-height:1.5;">${esc(m.reason || '')}</td>
            </tr>`).join('')}
          </table>
        </div>` : ''}

        ${geo.country ? `
        <div style="margin-top:20px;padding:12px 16px;background:#141821;border:0.5px solid rgba(232,177,75,.12);border-radius:6px;">
          <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#8B7E62;">◉ Edge-detected country: <span style="color:#C9B894;">${esc(geo.country)}</span></div>
          <div style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:#8B7E62;margin-top:6px;">Sanity check vs. the form's country field. VPN bypasses this — treat as directional.</div>
        </div>` : ''}

        <p style="margin:24px 0 0;font-size:12px;color:#8B7E62;line-height:1.7;">Reply to this email to reach <strong style="color:#EDE5D8;">${esc(name)}</strong> — the reply-to is set to their address. Confirm the formula together with them first, then send the Stripe link.</p>
      </div>
    </div>
  </body></html>`;
}

function buildRobinText({ email, name, city, country, notes, formulaName, quiz, herbLines, synergies, bottleMl, geo, possibleMicronutrients, formulaId, engineVersion }){
  geo = geo || {};
  possibleMicronutrients = Array.isArray(possibleMicronutrients) ? possibleMicronutrients : [];
  const q = quiz || {};
  const totalPct = herbLines.reduce((s, h) => s + (h.pct || 0), 0);
  const totalMl  = herbLines.reduce((s, h) => s + (h.ml  || 0), 0);
  const pad = (s, n) => (s + '                    ').slice(0, n);
  return `NEW FORMULA RESERVATION — ${bottleMl} ML BOTTLE

Formula: ${formulaName || 'Unnamed'}
For:     ${name} · ${city}, ${country}
Email:   ${email}
Source:  server-authoritative · id ${formulaId} · engine ${engineVersion || '-'}

POUR SPEC:
  ${pad('Herb', 32)}${pad('%', 6)}${pad('ml', 8)}
  ${'─'.repeat(46)}
${herbLines.map(h => '  ' + pad(h.name, 32) + pad(h.pct + '%', 6) + pad(h.ml.toFixed(2), 8)).join('\n')}
  ${'─'.repeat(46)}
  ${pad('TOTAL', 32)}${pad(totalPct + '%', 6)}${pad(totalMl.toFixed(2), 8)}

${synergies && synergies.length ? 'SYNERGIES:\n' + synergies.map(s => '  • ' + s.a + ' + ' + s.b + ' — ' + (s.note || '').replace(/^[^—:]*[—:]\s*/, '')).join('\n') + '\n\n' : ''}THEIR READING:
  Intention: ${q.intention || '—'}
  Body:      ${q.pattern || '—'}${q.patternSub ? ' · ' + q.patternSub : ''}
  Rhythm:    ${q.time || '—'} hardest
  Stress:    ${q.stress || '—'}
  Filters:   ${Array.isArray(q.avoid) ? q.avoid.join(', ') : (q.avoid || '—')}
  ${q.duration ? 'Duration:  ' + q.duration + '\n  ' : ''}${q.age ? 'Age:       ' + q.age + '\n  ' : ''}${q.sleep ? 'Sleep:     ' + q.sleep : ''}

${notes ? 'Priority + prior herb experience:\n  "' + notes + '"\n\n' : ''}${possibleMicronutrients.length ? '⚠ POSSIBLE MICRONUTRIENT ALLIES · UNVERIFIED (client-computed):\n  Treat as directional only — computed in the customer browser and\n  shipped as-is; a modified frontend could forge entries. Do not repeat\n  verbatim to the customer without your own clinical read.\n\n' + possibleMicronutrients.map(m => '  · ' + m.nutrient + ' — ' + (m.reason || '')).join('\n') + '\n\n' : ''}${geo.country ? 'EDGE-DETECTED COUNTRY: ' + geo.country + ' (sanity check vs. form; VPN bypasses)\n\n' : ''}Reply to this email to reach the customer. Confirm the formula together first, then send the Stripe link.
`;
}

function buildCustomerHtml({ name, formulaName, herbList, herbLines, storyText, herbNotes, synergies, quiz }){
  const lines = (herbLines && herbLines.length) ? herbLines : herbList.map(n => ({ name: n, pct: 0 }));
  herbNotes = Array.isArray(herbNotes) ? herbNotes : [];
  synergies = Array.isArray(synergies) ? synergies : [];
  quiz      = quiz && typeof quiz === 'object' ? quiz : {};

  // The in-app reveal calls the pattern archetype in TCM-poetic
  // language ("A lit match", "A cold stone" etc.) and pairs it with
  // a sub-pattern in even denser TCM ("Liver-heat lift", "Yin-
  // deficient dryness"). For an email that a customer may forward
  // to family or a herbalist, we translate those to plain English
  // adjacent — same meaning, less coded. This mirrors Robin's
  // request: "when we speak of TCM medicine and terminology, we
  // need to right after mentioning a tcm herb or feeling we need
  // to write adjacent in an easy language."
  const PATTERN_PLAIN = {
    hot:      { poetic: 'A lit match',        plain: 'warm, reactive, tends to inflammation' },
    cold:     { poetic: 'A cold stone',       plain: 'cool extremities, sluggish digestion, slow to warm up' },
    mixed:    { poetic: 'A flickering flame', plain: 'variable — some days hot, others stuck; often "wired-and-tired"' },
    depleted: { poetic: 'An empty cup',       plain: 'chronically tired, dry, over-drawn on reserves' },
  };
  const SUB_PLAIN = {
    anger:'irritability driven by inner heat', flushed:'blood-heat coming up to the face',
    inflamed:'heat pooling in tissues (skin, gut, joints)', hot_night:'heat rising after dark; night sweats',
    cold_hands:'circulation weak at the extremities', heavy:'body feels dense; hard to get moving',
    pale:'digestive fire low; complexion pale', low_drive:'internal drive dimmed at its source',
    stuck:'energy/emotion not flowing forward', up_down:'moods oscillate quickly',
    tension:'muscular tension that migrates', sighing:'chest holds; breath needs a bigger exhale',
    purposeless:'the spirit-anchor feels loose', dry:'fluids and lubrication have thinned',
    overworked:'foundational reserves drawn low', anxious_empty:'wired at rest, exhausted at effort',
  };
  const patternKey = quiz.pattern;
  const subKey     = quiz.patternSub;
  const patternPlain = PATTERN_PLAIN[patternKey] || null;
  const subPlain     = SUB_PLAIN[subKey] || null;
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#060809;color:#C9B894;font-family:Georgia,serif;">
    <div style="max-width:580px;margin:0 auto;padding:48px 24px;">
      <div style="background:#0F1014;border:0.5px solid rgba(232,177,75,.22);border-radius:14px;padding:40px 32px;">
        <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:.32em;text-transform:uppercase;color:#E8B14B;margin-bottom:16px;">✦ Your formula is reserved</div>
        <h1 style="font-family:Georgia,serif;font-style:italic;font-weight:400;font-size:32px;color:#E6D9B5;margin:0 0 12px;line-height:1.1;letter-spacing:-.005em;">${esc(formulaName || 'Your formula')}</h1>

        <p style="font-size:15px;line-height:1.75;color:#C9B894;margin:0 0 16px;">
          ${esc(name)}, thank you for taking the reading. This blend was composed <strong style="color:#EDE5D8;">just for you</strong> from what your answers described — nothing shelf-stocked, nothing pre-mixed.
        </p>

        <p style="font-size:15px;line-height:1.75;color:#C9B894;margin:0 0 20px;">
          Robin will follow up personally to <strong style="color:#F5D689;">confirm the formula together with you first</strong> — a short exchange to make sure this blend is genuinely matched to what you're bringing. The payment link comes <em>after</em> that confirmation, once we're both sure the composition is right. Only then does the pour begin.
        </p>

        ${storyText ? `
        <div style="margin:24px 0 10px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#E8B14B;">✦ The reading</div>
        <p style="font-family:Georgia,serif;font-style:italic;font-size:15.5px;line-height:1.75;color:#E6D9B5;margin:0 0 20px;">${esc(storyText)}</p>` : ''}

        ${patternPlain || subPlain ? `
        <div style="margin:22px 0 8px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#E8B14B;">Body reading · plain language</div>
        <div style="padding:14px 16px;background:#141821;border:0.5px solid rgba(232,177,75,.14);border-radius:8px;margin:0 0 22px;font-size:13.5px;color:#C9B894;line-height:1.7;">
          ${patternPlain ? `<div style="margin-bottom:${subPlain ? '8px' : '0'}"><span style="font-family:Georgia,serif;font-style:italic;color:#EDE5D8;">${esc(patternPlain.poetic)}</span> &mdash; <span style="color:#C9B894;">${esc(patternPlain.plain)}</span></div>` : ''}
          ${subPlain ? `<div><span style="font-family:'Courier New',monospace;font-size:11px;color:#8B7E62;">Specifically</span> &mdash; ${esc(subPlain)}</div>` : ''}
        </div>` : ''}

        <div style="margin:24px 0 8px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#E8B14B;">Your allies (proposed)</div>
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 22px;">
          ${lines.map((h, i) => `<tr>
            <td valign="top" style="padding:9px 10px 9px 0;vertical-align:top;font-family:'Courier New',monospace;font-size:12px;color:#F5D689;width:52px;white-space:nowrap;">${h.pct ? h.pct + '%' : ''}</td>
            <td style="padding:9px 0;border-bottom:0.5px solid rgba(232,177,75,.08);">
              <div style="font-size:15px;color:#EDE5D8;font-weight:500;">${esc(h.name)}</div>
              ${herbNotes[i] ? `<div style="font-family:Georgia,serif;font-style:italic;font-size:12.5px;color:#8B7E62;line-height:1.55;margin-top:3px;">${esc(herbNotes[i])}</div>` : ''}
            </td>
          </tr>`).join('')}
        </table>

        ${synergies.length ? `
        <div style="margin:22px 0 8px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#A88FE0;">Woven synergies</div>
        <ul style="padding-left:18px;margin:0 0 22px;font-size:13.5px;line-height:1.75;color:#C9B894;">
          ${synergies.map(s => `<li style="margin-bottom:6px;"><strong style="color:#EDE5D8;">${esc(s.a)} + ${esc(s.b)}</strong> &mdash; <em>${esc((s.note || '').replace(/^[^—:]*[—:]\s*/, ''))}</em></li>`).join('')}
        </ul>` : ''}

        <div style="padding:18px 20px;background:#1A1E24;border:0.5px solid rgba(232,177,75,.18);border-radius:10px;margin:20px 0;">
          <div style="font-family:'Courier New',monospace;font-size:9.5px;letter-spacing:.24em;text-transform:uppercase;color:#E8B14B;margin-bottom:10px;">◈ Fully tailored · 30 ml amber-glass</div>
          <p style="font-size:13.5px;color:#EDE5D8;line-height:1.7;margin:0 0 8px;">Every bottle is <strong>full-spectrum spagyric</strong> — each herb separated into its three principles (sulfur / mercury / salt), purified individually over weeks, then recombined so nothing living gets lost in translation. Not a simple maceration. The plant's complete alchemical signature — alkaloids, essential oils, mineral salts — in balance.</p>
          <p style="font-size:13.5px;color:#C9B894;line-height:1.7;margin:0;">Hand-poured in the Berlin lab. Small-batch, single-pour, from scratch for you.</p>
        </div>

        <p style="font-size:13px;color:#8B7E62;line-height:1.7;margin:22px 0 0;font-style:italic;">Traditional herbal support only. Not a treatment or replacement for medical care.</p>

        <div style="margin-top:32px;padding-top:20px;border-top:0.5px solid rgba(232,177,75,.15);font-family:Georgia,serif;font-style:italic;color:#8B7E62;font-size:13px;">— Robin<br/>fungai.art</div>
      </div>
    </div>
  </body></html>`;
}

function buildCustomerText({ name, formulaName, herbList, herbLines, storyText, herbNotes, synergies, quiz }){
  const lines = (herbLines && herbLines.length) ? herbLines : herbList.map(n => ({ name: n, pct: 0 }));
  herbNotes = Array.isArray(herbNotes) ? herbNotes : [];
  synergies = Array.isArray(synergies) ? synergies : [];
  return `YOUR FORMULA IS RESERVED

${name}, thank you for taking the reading. This blend was composed just for you from what your answers described — nothing shelf-stocked, nothing pre-mixed.

Formula: ${formulaName || 'Your formula'}

${storyText ? 'THE READING\n' + storyText + '\n\n' : ''}Your allies (proposed):
${lines.map((h, i) => (h.pct ? h.pct.toString().padStart(3) + '%  ' : '     ') + h.name + (herbNotes[i] ? '\n         ' + herbNotes[i] : '')).join('\n')}

${synergies.length ? 'WOVEN SYNERGIES:\n' + synergies.map(s => '  · ' + s.a + ' + ' + s.b + ' — ' + (s.note || '').replace(/^[^—:]*[—:]\s*/, '')).join('\n') + '\n\n' : ''}Robin will follow up personally to confirm the formula together with you first — a short exchange to make sure this blend is genuinely matched to what you're bringing. The payment link comes AFTER that confirmation, once we're both sure the composition is right. Only then does the pour begin.

Fully tailored · 30 ml amber-glass:
Every bottle is a full-spectrum spagyric — each herb separated into its three principles (sulfur / mercury / salt), purified individually over weeks, then recombined so nothing living gets lost in translation. Not a simple maceration. The plant's complete alchemical signature — alkaloids, essential oils, mineral salts — in balance. Hand-poured in the Berlin lab. Small-batch, single-pour, from scratch for you.

Traditional herbal support only. Not a treatment or replacement for medical care.

— Robin
fungai.art
`;
}
