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
const { isGABAergic, isCNSStimulant, cnsAction } = require('./pharmacology');

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
  // Audit 2026-09-28: an unknown value used to be DROPPED, so
  // ["pregnacy", "thyroid"] quietly became ["thyroid"] — a misspelt
  // pregnancy flag vanished and the formula was composed as if it had
  // never been ticked. For a safety field an unknown value is an error,
  // never something to tidy away: the whole request is refused.
  const unknown = avoid.filter(f => !(typeof f === 'string' && KNOWN_AVOID_FLAGS.has(f)));
  if (unknown.length) {
    const err = new Error(
      'Unknown value(s) in avoid[]: ' + unknown.slice(0, 5).map(v => JSON.stringify(v)).join(', ') +
      '. Send only the known safety flags, or ["none"].'
    );
    err.code = 'SAFETY_FLAG_UNKNOWN';
    throw err;
  }
  const cleaned = avoid.slice();
  if (cleaned.length === 0) {
    const err = new Error(
      'No recognised safety flags in avoid[]. Send avoid:["none"] or ' +
      'valid flag names.'
    );
    err.code = 'SAFETY_QUESTION_NOT_ANSWERED';
    throw err;
  }
  // AUDIT_FIX (Finding #8): "none" is mutually exclusive with every
  // other flag. A malformed/hostile client that sends
  // avoid:["none", "pregnancy"] previously reached safetyFilter,
  // which short-circuits on .includes("none") and DISABLES all
  // filtering — the pregnancy flag was silently dropped, and the
  // formula composed from the unfiltered pool including uterine
  // stimulants. Rejecting the combination closes that bypass; the
  // client already sends one form or the other, never both.
  if (cleaned.includes('none') && cleaned.length > 1) {
    const err = new Error(
      '"none" must be the sole entry in avoid[]. Do not combine it ' +
      'with any other flag — this is a mutually-exclusive sentinel.'
    );
    err.code = 'SAFETY_FLAGS_CONFLICT';
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

// 2026-09-27 · The gate reads the recorded CNS class (herbs.ts
// cns_action) instead of the old word search, which had kept some herbs
// away from minors only by accident: He Shou Wu counted as a stimulant
// because "glutamate" contains "mate". With the labels true, two rules
// keep the gate at least as tight as it was:
//   · calming herbs pass only at caution LOW (chamomile, lemon balm,
//     linden, rose, oatstraw — the classic children's herbs), and
//     psychoactive ones never pass;
//   · nothing at caution HIGH or VERY HIGH passes, whatever its class.
//     Adults still get those herbs (Robin, 2026-09-27); a minor's
//     formula is meant to be the gentle one.
const MINOR_BANNED_CAUTION = new Set(['HIGH', 'VERY HIGH']);

function passesMinorGate(h) {
  // Both checks, deliberately. `minorBanned` is the standing under-18
  // ban; `gated` is still honoured so anything gated in future is also
  // withheld from minors by default.
  if (h && (h.minorBanned || h.gated || h.proOnly)) return false;
  const flags = (h && h._ax && h._ax.flags) || [];
  for (const f of flags) if (MINOR_BANNED_FLAGS.has(f)) return false;
  if (isGABAergic(h))    return false;
  if (isCNSStimulant(h)) return false;
  const cns = cnsAction(h);
  if (cns === 'psychoactive') return false;
  if (cns === 'calming' && h.caution_level !== 'LOW') return false;
  if (h && MINOR_BANNED_CAUTION.has(h.caution_level)) return false;
  return true;
}

// Pro-only herbs (herbs.ts formula_access: 'pro') reach a bottle only
// when the profile came from the pro composer. fyf-compose sets _pro
// from the request; a minor is never pro.
function passesAccess(h, profile) {
  if (!h || !h.proOnly) return true;
  return !!(profile && profile._pro === true && !profile._minor);
}

// ─────────────────────────────────────────────────────────────────
// Safety from the pro quiz's own answers (2026-09-28)
// ─────────────────────────────────────────────────────────────────
// The pro composer asks about the cycle and about past reactions to
// herbs, and until now the engine ignored both. Three answers are
// safety, not preference, so they EXCLUDE rather than nudge:
//   · cycle 'trying_conceive'          → the pregnancy rule: only a
//     herb recorded safe_pregnancy: true (the same rule as avoid
//     'pregnancy'; unknown counts as avoid)
//   · prior_herbs 'stimulants_sensitive' → no stimulant or activating
//     herb (the CNS classes that count toward the stimulant cap)
//   · prior_herbs 'bad_reaction'       → nothing at caution HIGH or
//     VERY HIGH; a first formula after a bad reaction is a gentle one
// The consumer quiz never sends these fields, so this is a no-op there.
const PROFILE_HIGH_CAUTION = new Set(['HIGH', 'VERY HIGH']);
function passesProfileSafety(h, profile) {
  if (!h || !profile) return true;
  // A herb the person's note says to avoid ("allergic to chamomile",
  // "valerian made me groggy") — set server-side by index.js
  // prepareProfile from note-safety.js, 2026-09-28.
  // Compared as strings: herbs.ts ids are numbers, MYCO's are text.
  if (Array.isArray(profile._avoidHerbIds) && profile._avoidHerbIds.some(id => String(id) === String(h.id))) return false;
  if (profile.cycle === 'trying_conceive' && h.safe_pregnancy !== true) return false;
  const prior = Array.isArray(profile.prior_herbs) ? profile.prior_herbs : [];
  if (prior.includes('stimulants_sensitive') && isCNSStimulant(h)) return false;
  if (prior.includes('bad_reaction') && PROFILE_HIGH_CAUTION.has(h.caution_level)) return false;
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
  MINOR_BANNED_CAUTION,
  validateAndNormalizeAvoid,
  safetyFilter,
  passesMinorGate,
  passesAccess,
  passesProfileSafety,
  applyMinorGate,
  countFilteredOut,
};
