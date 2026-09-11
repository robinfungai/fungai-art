// src/server/formula-engine/index.js
//
// Public entry point for the private Formula Engine. Consumed by
// netlify/functions/* (Step 2+) and by tests/compare-fixtures.cjs
// (Step 1 regression proof).
//
// Return shape is a discriminated union:
//
//   { status: 'ok',       ...formula fields }
//   { status: 'rejected', reason: string, code: string }
//
// The 'rejected' path is what closes the fixture-20 security bypass:
// if the client submits an empty `avoid` array, we do NOT compose a
// formula from the full pool — we reject the request with a stable
// code the caller can surface to the user or the reserve-formula
// endpoint.

const { pickFormula, targetHerbCount } = require('./picker');
const { assignPercentages } = require('./percentages');
const { checkFormulaPairs } = require('./interactions');
const { validateAndNormalizeAvoid, countFilteredOut } = require('./safety');
const { isTrace } = require('./traces');
const { isGABAergic, isCNSStimulant } = require('./pharmacology');
const { pickName } = require('./naming');
const VERSION = require('./version');

/**
 * Compile a formula from a normalised profile.
 *
 * The profile is treated as untrusted input. This function does its
 * own safety validation (validateAndNormalizeAvoid) before any
 * scoring runs — a client that skipped the safety question gets a
 * 'rejected' result, never a formula built from the unfiltered pool.
 *
 * @param {object} profile — state.answers-shaped object from the
 *   quiz. See tests/fixtures/profiles/*.json for canonical examples.
 * @returns {object} discriminated union — see file header.
 */
function compileFormula(profile) {
  // ── Step 1: Safety validation (SECURITY_FIX for fixture 20) ────
  let normalisedAvoid;
  try {
    normalisedAvoid = validateAndNormalizeAvoid(profile.avoid);
  } catch (e) {
    if (e && e.code === 'SAFETY_QUESTION_NOT_ANSWERED') {
      return {
        status: 'rejected',
        code:   e.code,
        reason: e.message,
        ...VERSION,
      };
    }
    throw e;
  }
  // Downstream code uses the normalised copy; the original client
  // input is not trusted past this point.
  const profileForEngine = Object.assign({}, profile, { avoid: normalisedAvoid });

  // ── Step 2: Deterministic pick + percentages ───────────────────
  const herbs = pickFormula(profileForEngine);
  const percentages = assignPercentages(herbs);
  const pairs = checkFormulaPairs(herbs);
  const filtered = countFilteredOut(profileForEngine);
  const target = targetHerbCount(profileForEngine);

  return {
    status:           'ok',
    engineVersion:    VERSION.engineVersion,
    herbDbVersion:    VERSION.herbDbVersion,
    safetyRulesVersion: VERSION.safetyRulesVersion,
    capturedAt:       new Date().toISOString(),
    name:             pickName(profileForEngine),
    targetHerbCount:  target,
    formulaSize:      herbs.length,
    filteredOut:      filtered,
    herbs: herbs.map((h, i) => ({
      id:              h.id,
      name:            h.name,
      botanical:       h.botanical,
      category:        h._cat,
      score:           Math.round((h._score || 0) * 100) / 100,
      percentage:      percentages[i],
      isTrace:         isTrace(h),
      isGABAergic:     isGABAergic(h),
      isCNSStimulant:  isCNSStimulant(h),
      isGated:         !!h.gated,
    })),
    percentageTotal:  percentages.reduce((a, b) => a + b, 0),
    synergies:        pairs.synergies,
    cautions:         pairs.cautions,
  };
}

module.exports = {
  compileFormula,
  VERSION,
};
