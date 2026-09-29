// src/server/formula-engine/rules.js
//
// The bottle's composition rules, in ONE place (external audits
// 2026-09-28: "one rule engine for picker + validator"). The picker's
// walk and the MYCO validator both seat herbs through seatBlocker /
// seat, and the pro analysis reads the same numbers, so a rule cannot
// hold in one path and not in another. Change a rule here and every
// path changes with it; tests/invariants-verify.cjs checks the bottles.

const { isTrace } = require('./traces');
const P = require('./pharmacology');
const { TRACE_PCT_CAP, MAX_SHARE_PCT, AMANITA_PCT_CAP, smallShareCap } = require('./percentages');
const { pairBlocker } = require('./pair-rules');

const RULES = {
  MAX_PER_CATEGORY: 2,
  MAX_TRACE:        1,
  MAX_GABAERGIC:    2,      // recorded class 'sedative'
  MAX_STIMULANT:    2,      // 'stimulant' + 'activating'
  MAX_SEROTONERGIC: P.MAX_SEROTONERGIC,
  MAX_LAXATIVE:     P.MAX_LAXATIVE,
  // Genus rule (2026-09-28): the two Amanitas are both recorded
  // 'sedative', so the sedative cap alone let both into one bottle.
  // Taxonomy matters more than function class here. Robin, 2026-09-29
  // (third audit): at most 10% of the bottle (percentages.js), and never
  // beside St John's Wort.
  MAX_AMANITA:      1,
  AMANITA_PCT_CAP,
  TRACE_PCT_CAP,
  MAX_SHARE_PCT,
  MIN_MAIN_HERBS:   3,      // herbs at the full 40% ceiling; fewer → NO_MATCH / NO_SAFE_MATCH
};

const isAmanita = P.isAmanita;

// A herb held to a small share (trace ≤ 5%, Amanita ≤ 10%, a recorded
// max_share_pct like Saffron's 7%). A bottle needs three herbs that are
// NOT, so no herb has to go above 40%.
const isSmallShare = h => smallShareCap(h) > 0;

// `avoid` = the safety answers the bottle is built under (ticked plus
// any the note named) — CONDITIONAL pair rules read them.
function newLoad(avoid) {
  return { cat: {}, trace: 0, gaba: 0, stim: 0, strong: 0, sero: 0, lax: 0, amanita: 0, sjw: 0, ids: [], avoid: Array.isArray(avoid) ? avoid : [] };
}

// null when the herb may take a seat, otherwise the rule it would break.
// The order is the order the validator reports them in.
function seatBlocker(load, h) {
  if (isTrace(h) && load.trace >= RULES.MAX_TRACE) return 'TRACE_COUNT';
  if (P.isGABAergic(h) && load.gaba >= RULES.MAX_GABAERGIC) return 'GABA_LOAD';
  if ((P.isGABAergic(h) && load.strong) || (P.isStrongStimulant(h) && load.gaba)) return 'SEDATIVE_WITH_STIMULANT';
  if (P.isCNSStimulant(h) && load.stim >= RULES.MAX_STIMULANT) return 'STIMULANT_LOAD';
  if (P.isSerotonergic(h) && load.sero >= RULES.MAX_SEROTONERGIC) return 'SEROTONERGIC_LOAD';
  if (P.isLaxative(h) && load.lax >= RULES.MAX_LAXATIVE) return 'LAXATIVE_LOAD';
  if (isAmanita(h) && load.amanita >= RULES.MAX_AMANITA) return 'AMANITA_LIMIT';
  if ((isAmanita(h) && load.sjw) || (P.isStJohnsWort(h) && load.amanita)) return 'AMANITA_WITH_ST_JOHNS_WORT';
  // Herb pairs Robin ruled out (pair-rules.js, 2026-09-29).
  const pair = pairBlocker(h.id, load.ids, load.avoid);
  if (pair) return pair.cls === 'BLOCK' ? 'PAIR_BLOCK' : 'PAIR_CONDITIONAL';
  if ((load.cat[P.categoryOf(h)] || 0) >= RULES.MAX_PER_CATEGORY) return 'CATEGORY_CAP';
  return null;
}

function seat(load, h) {
  const cat = P.categoryOf(h);
  load.cat[cat] = (load.cat[cat] || 0) + 1;
  if (isTrace(h)) load.trace += 1;
  if (P.isGABAergic(h)) load.gaba += 1;
  if (P.isCNSStimulant(h)) load.stim += 1;
  if (P.isStrongStimulant(h)) load.strong += 1;
  if (P.isSerotonergic(h)) load.sero += 1;
  if (P.isLaxative(h)) load.lax += 1;
  if (isAmanita(h)) load.amanita += 1;
  if (P.isStJohnsWort(h)) load.sjw += 1;
  load.ids.push(String(h.id));
  return load;
}

module.exports = { RULES, isAmanita, isSmallShare, newLoad, seatBlocker, seat };
