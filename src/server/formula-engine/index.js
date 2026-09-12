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

const { pickFormula, targetHerbCount, buildScoredCandidates } = require('./picker');
const { assignPercentages } = require('./percentages');
const { checkFormulaPairs } = require('./interactions');
const { validateAndNormalizeAvoid, countFilteredOut } = require('./safety');
const { isTrace } = require('./traces');
const { isGABAergic, isCNSStimulant } = require('./pharmacology');
const { pickName } = require('./naming');
const { askMyco } = require('./myco');
const { validateMycoProposal } = require('./myco-validator');
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

// ════════════════════════════════════════════════════════════════
// STEP 5.5 · composeFormulaWithMyco — audit-compliant MYCO path
// ────────────────────────────────────────────────────────────────
// The audit's constraint #11 architecture:
//
//   Formula Engine   → candidate formula (deterministic pick, baseline)
//   ↓
//   MYCO             → proposal (herbs + percentages + reasoning)
//   ↓
//   Deterministic validator  → accept or reject the proposal
//   ↓
//   FINAL FORMULA
//
// The baseline deterministic formula is ALWAYS computed first — that's
// the safety net. MYCO runs only if the deterministic composition
// succeeded. If MYCO returns anything the validator can't accept, we
// return the deterministic baseline (with mycoUsed:false + a fallback
// reason logged) — never MYCO's raw output, never a mix, never silent
// substitution.
//
// tests/compare-fixtures.cjs continues to use compileFormula (the
// sync deterministic-only entry point) so the Step 0 regression
// baseline stays deterministic and reproducible.
async function composeFormulaWithMyco(profile, opts = {}) {
  // Baseline compose. This throws only if compileFormula itself throws
  // (which returns 'rejected' for SAFETY_QUESTION_NOT_ANSWERED).
  const baseline = compileFormula(profile);
  if (baseline.status !== 'ok') return baseline;

  // Build the candidate set MYCO is bounded to. Uses the same safety
  // filter + scorer + dedup pipeline as pickFormula, but returns the
  // top 20 (broader than pickFormula's cap-limited final pick).
  const normalisedProfile = Object.assign({}, profile, {
    avoid: baseline.filteredOut && Array.isArray(profile.avoid) ? profile.avoid : profile.avoid,
  });
  const candidates = buildScoredCandidates(normalisedProfile, 20);

  // Ask MYCO. Returns null on any failure (no api key, network, bad
  // JSON, empty picks). Fully swallowed → baseline used.
  const proposal = await askMyco(candidates, normalisedProfile, opts);
  if (!proposal) {
    // eslint-disable-next-line no-console
    console.log('[compose] MYCO returned null — falling back to deterministic (MYCO_UNAVAILABLE)');
    return { ...baseline, mycoUsed: false, mycoFallbackReason: 'MYCO_UNAVAILABLE' };
  }

  // Deterministic veto. Every rule the pickFormula pipeline applies
  // is re-checked against MYCO's proposal here.
  const validation = validateMycoProposal({
    mycoResponse: proposal.picks,
    candidateSet: candidates,
    gatedOptIn:   !!profile._gatedOptIn,
  });
  if (!validation.ok) {
    // Log the specific rule MYCO broke so we can spot systematic
    // MYCO-prompting issues without silently falling through.
    // eslint-disable-next-line no-console
    console.warn('[compose] MYCO proposal rejected:', validation.reason, '·', validation.detail);
    return { ...baseline, mycoUsed: false, mycoFallbackReason: validation.reason };
  }

  // Validation passed — MYCO's picks become the final formula.
  const finalHerbs = validation.herbs;
  const finalPcts  = validation.percentages;
  const pairs      = checkFormulaPairs(finalHerbs);

  return {
    ...baseline,
    formulaSize:     finalHerbs.length,
    herbs: finalHerbs.map((h, i) => ({
      id:              h.id,
      name:            h.name,
      botanical:       h.botanical,
      category:        h._cat,
      score:           Math.round((h._score || 0) * 100) / 100,
      percentage:      finalPcts[i],
      isTrace:         isTrace(h),
      isGABAergic:     isGABAergic(h),
      isCNSStimulant:  isCNSStimulant(h),
      isGated:         !!h.gated,
      mycoReason:      String(validation.reasons[i] || '').slice(0, 300),
    })),
    percentageTotal:  finalPcts.reduce((a, b) => a + b, 0),
    synergies:        pairs.synergies,
    cautions:         pairs.cautions,
    mycoUsed:         true,
    mycoOverall:      String(proposal.overall || '').slice(0, 1200),
  };
}

module.exports = {
  compileFormula,
  composeFormulaWithMyco,
  VERSION,
};
