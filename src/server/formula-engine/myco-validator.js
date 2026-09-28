// src/server/formula-engine/myco-validator.js
//
// The deterministic veto per audit constraint #11:
//
//   Formula Engine → candidate formula → MYCO → MYCO proposal
//                                        → deterministic validator
//                                        → FINAL FORMULA
//
// MYCO is untrusted creative input. This module checks that every
// picked herb id is in the candidate set the picker produced, that no
// pool cap is broken (categories, trace count, GABAergic load, CNS
// stimulant load, serotonergic, laxative), and that gated herbs are
// only present when the user opted in.
//
// Percentages (D2 option C, 2026-09-28): MYCO no longer sets them. Any
// `pct` it still sends is ignored; the accepted herbs get the engine's
// own percentages (percentages.js — score-weighted, trace ≤ 5%, any
// other herb ≤ 40%), the same rule as the deterministic bottle.
//
// Returns a discriminated union:
//   { ok: true,  herbs: [...], percentages: [...], reasons: [...] }
//   { ok: false, reason: 'HUMAN_READABLE_CODE', detail: '...' }
//
// The FINAL_FORMULA authority hierarchy:
//   · candidate set boundary is set by the deterministic picker
//     (safety-filtered pool + score-ranked shortlist).
//   · If MYCO's picks pass validation, they become the final formula.
//   · If they don't, we fall back to the deterministic pick — the
//     validator NEVER accepts a partial or "corrected" MYCO output.
//
// This preserves audit constraints:
//   #4  MYCO is not authoritative (validator is)
//   #11 MYCO can never introduce an herb outside the candidate set
//   #12 Age eligibility / gating is respected regardless of MYCO
//
// SERVER-ONLY. Never imported by any client code.

const { isTrace } = require('./traces');
const { isGABAergic, isCNSStimulant, isStrongStimulant, isSerotonergic, MAX_SEROTONERGIC, isLaxative, MAX_LAXATIVE, categoryOf } = require('./pharmacology');
const { assignPercentages, TRACE_PCT_CAP, MAX_SHARE_PCT } = require('./percentages');

// Constants must match picker.js exactly (per audit constraint #8:
// no methodology drift). Sourced from the same load-cap block.
const MAX_PER_CATEGORY = 2;
const MAX_TRACE        = 1;
const MAX_GABAERGIC    = 2;
const MAX_STIMULANT    = 2;
const MIN_HERBS        = 5;
const MAX_HERBS        = 7;

/**
 * @param {object} params
 * @param {Array<{id, reason}>} params.mycoResponse
 *   The herbs MYCO picked. A `pct` on a pick is ignored. Any missing or
 *   malformed field is caught below.
 * @param {Array<object>} params.candidateSet
 *   The scored + safety-filtered herb set the picker produced. This
 *   defines the bounded universe MYCO is allowed to pick from.
 * @param {boolean} params.gatedOptIn
 *   Whether the user opted into ceremonial allies (Amanita etc).
 * @param {boolean} [params.pro]
 *   Whether the request came from the pro composer — the only place a
 *   pro-only herb (herbs.ts formula_access: 'pro', e.g. Ephedra) may go.
 * @returns {object} discriminated union — see file header.
 */
function validateMycoProposal({ mycoResponse, candidateSet, gatedOptIn, pro = false }) {
  if (!mycoResponse || !Array.isArray(mycoResponse)) {
    return { ok: false, reason: 'MYCO_MALFORMED', detail: 'response is not an array of picks' };
  }
  if (mycoResponse.length < MIN_HERBS || mycoResponse.length > MAX_HERBS) {
    return {
      ok: false, reason: 'MYCO_HERB_COUNT_OUT_OF_RANGE',
      detail: 'expected ' + MIN_HERBS + '-' + MAX_HERBS + ' herbs, got ' + mycoResponse.length,
    };
  }

  // Build a lookup for the candidate set — id is the primary match key.
  // We also accept name matching as a fallback since MYCO occasionally
  // returns the name in `id` field instead of the numeric id (the
  // prompt gives it both). NAME match still constrains to candidate set.
  const byId   = new Map();
  const byName = new Map();
  for (const h of candidateSet) {
    const idKey = String(h.id).toLowerCase();
    byId.set(idKey, h);
    if (h.name) byName.set(String(h.name).toLowerCase(), h);
  }

  const acceptedHerbs = [];
  const acceptedReasons = [];
  const seenIds       = new Set();
  let traceUsed = 0, gabaUsed = 0, stimUsed = 0, strongUsed = 0, seroUsed = 0, laxUsed = 0;
  const catCount = {};

  for (const pick of mycoResponse) {
    if (!pick || typeof pick !== 'object') {
      return { ok: false, reason: 'MYCO_PICK_INVALID', detail: 'pick entry is not an object' };
    }
    const rawId = pick.id != null ? String(pick.id).toLowerCase() : '';
    const rawName = typeof pick.name === 'string' ? pick.name.toLowerCase() : rawId;
    const reason = String(pick.reason || '').slice(0, 300);

    // Boundary check: herb MUST be in the deterministic candidate set.
    let herb = byId.get(rawId) || byName.get(rawName);
    if (!herb) {
      return {
        ok: false, reason: 'MYCO_HERB_OUTSIDE_CANDIDATE_SET',
        detail: 'picked ' + (rawId || rawName) + ' — not in candidate set',
      };
    }

    // Dedup check — MYCO shouldn't list the same herb twice.
    const canonicalId = String(herb.id).toLowerCase();
    if (seenIds.has(canonicalId)) {
      return {
        ok: false, reason: 'MYCO_DUPLICATE_HERB',
        detail: 'picked ' + herb.name + ' twice',
      };
    }
    seenIds.add(canonicalId);

    // Gate check — ceremonial herbs only if user opted in.
    if (herb.gated && !gatedOptIn) {
      return {
        ok: false, reason: 'MYCO_GATED_WITHOUT_OPT_IN',
        detail: herb.name + ' is gated and user did not opt in',
      };
    }

    // Pro-only check — the candidate set already excludes these for a
    // consumer; this is the second lock.
    if ((herb.proOnly || herb.formula_access === 'pro') && !pro) {
      return {
        ok: false, reason: 'MYCO_PRO_ONLY_HERB',
        detail: herb.name + ' is for the pro composer only',
      };
    }

    // Trace count — one potent essential-oil herb per bottle (its ≤5%
    // share is set by assignPercentages below).
    if (isTrace(herb)) {
      traceUsed += 1;
      if (traceUsed > MAX_TRACE) {
        return {
          ok: false, reason: 'MYCO_TRACE_COUNT_EXCEEDED',
          detail: 'more than ' + MAX_TRACE + ' trace herb',
        };
      }
    }

    // Pharmacological load caps.
    if (isGABAergic(herb)) {
      gabaUsed += 1;
      if (gabaUsed > MAX_GABAERGIC) {
        return {
          ok: false, reason: 'MYCO_GABA_LOAD_EXCEEDED',
          detail: 'more than ' + MAX_GABAERGIC + ' GABAergics',
        };
      }
    }
    if (isStrongStimulant(herb)) strongUsed += 1;
    if (gabaUsed && strongUsed) {
      return {
        ok: false, reason: 'MYCO_SEDATIVE_WITH_STIMULANT',
        detail: 'a sedative and a stimulant pull against each other in one bottle',
      };
    }
    if (isCNSStimulant(herb)) {
      stimUsed += 1;
      if (stimUsed > MAX_STIMULANT) {
        return {
          ok: false, reason: 'MYCO_STIMULANT_LOAD_EXCEEDED',
          detail: 'more than ' + MAX_STIMULANT + ' CNS stimulants',
        };
      }
    }

    if (isSerotonergic(herb)) {
      seroUsed += 1;
      if (seroUsed > MAX_SEROTONERGIC) {
        return {
          ok: false, reason: 'MYCO_SEROTONERGIC_LOAD_EXCEEDED',
          detail: 'more than ' + MAX_SEROTONERGIC + ' serotonergic herb',
        };
      }
    }

    if (isLaxative(herb)) {
      laxUsed += 1;
      if (laxUsed > MAX_LAXATIVE) {
        return {
          ok: false, reason: 'MYCO_LAXATIVE_LOAD_EXCEEDED',
          detail: 'more than ' + MAX_LAXATIVE + ' laxative herb',
        };
      }
    }

    // Category balance.
    const cat = categoryOf(herb);
    catCount[cat] = (catCount[cat] || 0) + 1;
    if (catCount[cat] > MAX_PER_CATEGORY) {
      return {
        ok: false, reason: 'MYCO_CATEGORY_CAP_EXCEEDED',
        detail: 'more than ' + MAX_PER_CATEGORY + ' of category ' + cat,
      };
    }

    acceptedHerbs.push(herb);
    acceptedReasons.push(reason);
  }

  return {
    ok:          true,
    herbs:       acceptedHerbs,
    // The engine's percentages for MYCO's herbs — scores come from the
    // candidate set, so the same herb weighs the same in either path.
    percentages: assignPercentages(acceptedHerbs),
    reasons:     acceptedReasons,
  };
}

module.exports = {
  validateMycoProposal,
  MAX_PER_CATEGORY, MAX_TRACE, MAX_GABAERGIC, MAX_STIMULANT,
  MIN_HERBS, MAX_HERBS, TRACE_PCT_CAP, MAX_SHARE_PCT,
};
