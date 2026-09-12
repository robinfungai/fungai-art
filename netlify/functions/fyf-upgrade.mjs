// ════════════════════════════════════════════════════════════════
// Fungai Art · /api/fyf/upgrade — MYCO upgrade for a stored formula
// ════════════════════════════════════════════════════════════════
//
// Step 5.5e · Second half of the async-upgrade pattern.
//
// Flow:
//   1. Client POSTs to /api/fyf/compose → server runs deterministic
//      pick + persists row + returns fast (~200ms).
//   2. Client renders the deterministic reveal immediately.
//   3. Client POSTs to /api/fyf/upgrade with { formulaId } → server
//      loads the stored profile, calls Claude Opus 5 through the
//      MYCO validator (~10-15s), and if MYCO passes, UPDATES the
//      same fyf_formulas row with the upgraded herbs + percentages
//      + reasoning.
//   4. Client re-renders the herb list when the upgrade response
//      lands (with a growing-plant loader in the meantime).
//
// The upgrade is idempotent: calling it twice on the same formulaId
// runs MYCO twice and updates the row twice. In practice the client
// only calls once per reveal. Multiple calls just waste Anthropic
// tokens; they don't corrupt anything.
//
// Env vars:
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY  (required for persistence)
//   ANTHROPIC_API_KEY                          (required for MYCO)
//   ANTHROPIC_WORKSPACE_ID                     (optional)
//
// Never returned to the client:
//   raw herb records · pharmacology · contraindications · drug
//   interactions · internal scoring · category classifier · load-cap
//   flags · gated flag · numeric database ids. Same sanitisation
//   contract as /api/fyf/compose.

import { createClient } from '@supabase/supabase-js';
import { composeFormulaWithMyco } from '../../src/server/formula-engine/index.js';

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
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

// ── Per-IP rate limit ────────────────────────────────────────────
// 6 upgrades / 60s / IP. Slightly stricter than compose (8) because
// each upgrade call spends an Anthropic token. Real users trigger
// exactly one upgrade per reveal.
const RATE_WINDOW_MS      = 60_000;
const RATE_MAX_PER_WINDOW = 6;
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

const FORMULA_ID_RE = /^fyf_[a-f0-9]{32}$/;

function jsonResponse(status, cors, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export default async function handler(req) {
  const origin = req.headers.get('origin') || '';
  const cors   = corsFor(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, cors, { status: 'error', code: 'METHOD_NOT_ALLOWED' });
  }

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('client-ip') || 'unknown';
  const firstIp = String(ip).split(',')[0].trim();
  const rl = rateLimit(firstIp);
  if (!rl.ok) {
    return jsonResponse(429, { ...cors, 'Retry-After': String(rl.retryAfter) },
      { status: 'error', code: 'RATE_LIMITED' });
  }

  const raw = await req.text();
  if (raw.length > 4 * 1024) {
    return jsonResponse(413, cors, { status: 'error', code: 'PAYLOAD_TOO_LARGE' });
  }
  let body;
  try { body = JSON.parse(raw); }
  catch (_) { return jsonResponse(400, cors, { status: 'error', code: 'MALFORMED_JSON' }); }

  const formulaId = String((body && body.formulaId) || '').trim();
  if (!FORMULA_ID_RE.test(formulaId)) {
    return jsonResponse(400, cors, { status: 'rejected', code: 'FORMULA_ID_INVALID' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_SRV = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SRV) {
    console.error('[fyf-upgrade] Supabase unconfigured');
    return jsonResponse(503, cors, { status: 'error', code: 'STORAGE_UNAVAILABLE' });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SRV, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Load the stored formula. If not found, either the compose failed
  // to persist OR the retention prune ran. Client re-uses whatever it
  // rendered from the compose response.
  let row;
  try {
    const { data, error } = await sb.from('fyf_formulas')
      .select('id, engine_version, herb_db_version, safety_rules_version, profile, formula, created_at')
      .eq('id', formulaId)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return jsonResponse(404, cors, { status: 'rejected', code: 'FORMULA_NOT_FOUND' });
    }
    row = data;
  } catch (e) {
    console.error('[fyf-upgrade] Supabase lookup failed:', e && e.message);
    return jsonResponse(500, cors, { status: 'error', code: 'STORAGE_LOOKUP_FAILED' });
  }

  // Run the full MYCO+validator pipeline against the STORED profile.
  // Server engine's own SECURITY_FIX (empty avoid → SAFETY_QUESTION_
  // NOT_ANSWERED) can't fire here because the stored profile already
  // passed compose validation; carrying it here is defensive only.
  let upgraded;
  try {
    upgraded = await composeFormulaWithMyco(row.profile);
  } catch (e) {
    console.error('[fyf-upgrade] engine threw:', e && e.stack ? e.stack : e);
    return jsonResponse(500, cors, { status: 'error', code: 'INTERNAL_ERROR' });
  }

  if (upgraded.status !== 'ok') {
    // Stored profile somehow now fails validation. Very unlikely —
    // profile is stored post-validation — but return the failure code
    // so the client at least knows the upgrade attempt didn't run.
    return jsonResponse(400, cors, {
      status: 'rejected',
      code:    upgraded.code,
      message: upgraded.reason,
    });
  }

  // Persist the upgrade — only if MYCO actually contributed. If MYCO
  // fell back (validator rejection, timeout, no API key), the row
  // already holds the deterministic formula from compose; nothing
  // to update.
  let persistedUpgrade = false;
  if (upgraded.mycoUsed === true) {
    try {
      const { error: updateErr } = await sb.from('fyf_formulas')
        .update({ formula: upgraded })
        .eq('id', formulaId);
      if (updateErr) throw updateErr;
      persistedUpgrade = true;
    } catch (e) {
      // Row update failure isn't fatal — client still gets the
      // upgraded formula in the response. Reservation may see the
      // stale (deterministic) formula but the customer email will
      // still be sane.
      console.error('[fyf-upgrade] Supabase update failed:', e && e.message);
    }
  }

  // Sanitised response — same shape and safety contract as compose.
  return jsonResponse(200, cors, {
    status:             'ok',
    formulaId,
    engineVersion:      upgraded.engineVersion,
    herbDbVersion:      upgraded.herbDbVersion,
    safetyRulesVersion: upgraded.safetyRulesVersion,
    createdAt:          upgraded.capturedAt,
    persisted:          persistedUpgrade,
    formula: {
      name:            upgraded.name,
      size:            upgraded.formulaSize,
      totalPercentage: upgraded.percentageTotal,
      herbs: upgraded.herbs.map(h => ({
        name:       h.name,
        botanical:  h.botanical,
        percentage: h.percentage,
      })),
    },
    safetyReport: {
      flagsApplied: (upgraded.filteredOut && Object.keys(upgraded.filteredOut.byFlag || {})) || [],
    },
    mycoUsed:           typeof upgraded.mycoUsed === 'boolean' ? upgraded.mycoUsed : null,
    mycoFallbackReason: upgraded.mycoFallbackReason || null,
    mycoOverall:        upgraded.mycoUsed === true ? String(upgraded.mycoOverall || '').slice(0, 1200) : null,
    // upgraded response — client should re-render only if this differs
    // from what it already showed.
    isUpgrade: true,
  });
}
