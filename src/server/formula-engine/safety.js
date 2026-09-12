// src/server/formula-engine/safety.js
//
// Server-side safety filter + input validation. This is the module
// where the client bypass documented in fixture 20 gets closed.
//
// The client-side safetyFilter (public/find-your-formula/index.html
// line 2201) treats an empty `avoid` array or a missing `avoid` field
// as "no filters requested" and returns true for every herb. That's a
// bypass — a modified frontend can compose a formula from the full
// pool including contraindicated herbs without ever answering the
// safety question.
//
// The server-side version REJECTS empty/missing `avoid` before any
// scoring runs. Every legitimate profile that reaches this module has
// either:
//   · `avoid: ['none']`  — the user explicitly declared "nothing applies"
//   · `avoid: ['pregnancy', 'psych_meds', ...]`  — the user picked flags
//
// The filter logic ITSELF (per-herb, per-flag matching) is preserved
// verbatim from the client — no methodology change.
//
// See tests/fixtures/expected/20-adversarial-empty-avoid.json — the
// baseline captures the OLD client behaviour (composes a formula from
// avoid:[]). The new server engine returns rejected:
// SAFETY_QUESTION_NOT_ANSWERED for that same profile, and the
// compare-fixtures runner flags this as SECURITY_FIX (allowed drift).

const { ensurePool } = require('./axes');
const { isGABAergic, isCNSStimulant } = require('./pharmacology');

// Whitelist of safety-flag values the client is allowed to send. Any
// other string is dropped. Matches the `options.v` list in the
// QUESTIONS[avoid] block of public/find-your-formula/index.html.
const KNOWN_AVOID_FLAGS = new Set([
  'none',
  'pregnancy', 'cardio_meds', 'psych_meds', 'autoimmune',
  'liver_kidney', 'thyroid', 'hypertension', 'contraceptive',
  'sedatives', 'allergy',
]);

/**
 * SECURITY_FIX. Server-side input validation for the `avoid` field.
 * The client cannot be trusted to guarantee the safety question was
 * answered; this function enforces it independently.
 *
 * Returns a cleaned array of known flags, or throws with a stable
 * error `code` the API layer can respond with.
 *
 * @throws {Error & {code: 'SAFETY_QUESTION_NOT_ANSWERED'}}
 */
function validateAndNormalizeAvoid(avoid) {
  if (!Array.isArray(avoid) || avoid.length === 0) {
    const err = new Error(
      'The safety question is required. Send avoid:["none"] to explicitly ' +
      'declare no flags apply, or list applicable flags.'
    );
    err.code = 'SAFETY_QUESTION_NOT_ANSWERED';
    throw err;
  }
  const cleaned = avoid.filter(f => typeof f === 'string' && KNOWN_AVOID_FLAGS.has(f));
  if (cleaned.length === 0) {
    const err = new Error(
      'No recognised safety flags in avoid[]. Send avoid:["none"] or ' +
      'valid flag names.'
    );
    err.code = 'SAFETY_QUESTION_NOT_ANSWERED';
    throw err;
  }
  return cleaned;
}

/**
 * Per-herb safety filter — preserved verbatim from the client.
 * Returns true if the herb is safe to include given the user's flags.
 * `avoid:['none']` and `avoid:[]` both pass through as no-filter here;
 * the empty case is caught upstream by validateAndNormalizeAvoid.
 */
function safetyFilter(h, avoid) {
  if (!avoid || !avoid.length || avoid.includes('none')) return true;
  for (const f of avoid) if ((h._ax.flags || []).includes(f)) return false;
  return true;
}

// ─────────────────────────────────────────────────────────────────
// Under-18 hard gate (defense-in-depth)
// ─────────────────────────────────────────────────────────────────
// When `profile._minor === true`, the compose engine MUST return a
// gentle, non-psychoactive, non-sedating formula. The client already
// amends avoid[] with sedatives/psych_meds/contraceptive before it
// posts the profile, but the client cannot be trusted — a modified
// or old frontend could omit that step.
//
// This module runs an INDEPENDENT server-side gate that filters the
// same categories regardless of what the client did to avoid[]:
//   · gated herbs (Amanita muscaria etc — ceremonial allies)
//   · anything flagged 'sedatives' in the derived _ax.flags
//     (kava, benzo-adjacent CNS depressants)
//   · anything flagged 'psych_meds' (SSRI/MAOI-interacting; usually
//     serotonergic or dopaminergic actives)
//   · anything flagged 'contraceptive' (CYP3A4 / estrogen-binding)
//   · strong GABAergic actives (valerian, hops, magnolia, blue lotus)
//   · strong CNS stimulants (ginseng, cordyceps, rhodiola, guarana)
//
// The result is a conservative herbal blend suitable for a minor —
// which Robin also personally confirms before shipping (the _minor
// flag surfaces on the reservation email so he can review).

const MINOR_BANNED_FLAGS = new Set(['sedatives', 'psych_meds', 'contraceptive']);

function passesMinorGate(h) {
  if (h && h.gated) return false;
  const flags = (h && h._ax && h._ax.flags) || [];
  for (const f of flags) if (MINOR_BANNED_FLAGS.has(f)) return false;
  if (isGABAergic(h))    return false;
  if (isCNSStimulant(h)) return false;
  return true;
}

/**
 * Apply the minor gate ON TOP of the user's own safety filter.
 * When `profile._minor` is truthy the pool is additionally narrowed
 * to herbs that pass passesMinorGate. When false/absent this is a
 * no-op — the picker sees the user's normal filtered pool.
 */
function applyMinorGate(pool, profile) {
  if (!profile || !profile._minor) return pool;
  return pool.filter(passesMinorGate);
}

/**
 * Count of herbs REMOVED by the user's active safety filters — used
 * by the reveal to acknowledge that filtering ran. Preserved verbatim
 * from the client (line 2210).
 */
function countFilteredOut(a) {
  const pool = ensurePool();
  if (!pool) return { removed: 0, total: 0, byFlag: {}, examples: [] };
  const total = pool.length;
  const filters = (a.avoid || []).filter(x => x !== 'none');
  if (!filters.length) return { removed: 0, total, byFlag: {}, examples: [] };
  const removed = [];
  const byFlag = {};
  for (const h of pool) {
    for (const f of filters) {
      if ((h._ax.flags || []).includes(f)) {
        removed.push({ name: h.name, flag: f });
        byFlag[f] = (byFlag[f] || 0) + 1;
        break;
      }
    }
  }
  return { removed: removed.length, total, byFlag, examples: removed.slice(0, 8).map(r => r.name) };
}

module.exports = {
  KNOWN_AVOID_FLAGS,
  MINOR_BANNED_FLAGS,
  validateAndNormalizeAvoid,
  safetyFilter,
  passesMinorGate,
  applyMinorGate,
  countFilteredOut,
};
