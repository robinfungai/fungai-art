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

const { categoryOf } = require('./pharmacology');
const { assignPercentages } = require('./percentages');
const { RULES, newLoad, seatBlocker, seat } = require('./rules');

// The seating rules are rules.js — the same code the picker walks with
// (audit 2026-09-28: one rule engine for picker and validator). Only the
// herb count is MYCO's own: it is asked for 5–7.
const { MAX_PER_CATEGORY, MAX_TRACE, MAX_GABAERGIC, MAX_STIMULANT, TRACE_PCT_CAP, MAX_SHARE_PCT } = RULES;
const MIN_HERBS        = 5;
const MAX_HERBS        = 7;

// rules.js reason → the validator's stable code and a line for the log.
const BLOCKED = {
  TRACE_COUNT:             ['MYCO_TRACE_COUNT_EXCEEDED',       () => 'more than ' + RULES.MAX_TRACE + ' trace herb'],
  GABA_LOAD:               ['MYCO_GABA_LOAD_EXCEEDED',         () => 'more than ' + RULES.MAX_GABAERGIC + ' GABAergics'],
  SEDATIVE_WITH_STIMULANT: ['MYCO_SEDATIVE_WITH_STIMULANT',    () => 'a sedative and a stimulant pull against each other in one bottle'],
  STIMULANT_LOAD:          ['MYCO_STIMULANT_LOAD_EXCEEDED',    () => 'more than ' + RULES.MAX_STIMULANT + ' CNS stimulants'],
  SEROTONERGIC_LOAD:       ['MYCO_SEROTONERGIC_LOAD_EXCEEDED', () => 'more than ' + RULES.MAX_SEROTONERGIC + ' serotonergic herb'],
  LAXATIVE_LOAD:           ['MYCO_LAXATIVE_LOAD_EXCEEDED',     () => 'more than ' + RULES.MAX_LAXATIVE + ' laxative herb'],
  AMANITA_LIMIT:           ['MYCO_AMANITA_LIMIT_EXCEEDED',     () => 'more than ' + RULES.MAX_AMANITA + ' Amanita'],
  AMANITA_WITH_ST_JOHNS_WORT: ['MYCO_AMANITA_WITH_ST_JOHNS_WORT', () => "an Amanita beside St John's Wort"],
  CATEGORY_CAP:            ['MYCO_CATEGORY_CAP_EXCEEDED',      h => 'more than ' + RULES.MAX_PER_CATEGORY + ' of category ' + categoryOf(h)],
};

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
  const load          = newLoad();

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

    // Every seating rule — trace count, sedative / stimulant /
    // serotonergic / laxative loads, sedative beside stimulant, one
    // Amanita, category balance — is rules.js, shared with the picker.
    const blocked = seatBlocker(load, herb);
    if (blocked) {
      const [code, explain] = BLOCKED[blocked];
      return { ok: false, reason: code, detail: explain(herb) };
    }
    seat(load, herb);

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
