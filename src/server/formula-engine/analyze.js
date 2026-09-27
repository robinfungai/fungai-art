// src/server/formula-engine/analyze.js
//
// THE STANDARD FORMULA ANALYSIS (Robin, 2026-09-27).
//
// One analysis for every formula, wherever it was made — Mixology, Find
// your formula, the formula book — so a formula can be opened again,
// read in depth, and adjusted ("swap lemon balm for passionflower: what
// happens to the ratio and the synergy?").
//
// It is built ONLY from the engine's own parts, never re-implemented:
//   · herbs            the Herb Knowledge Base (../herb-data)
//   · ratios           assignPercentages — the engine's balance
//   · synergy/caution  checkFormulaPairs — the pair checker the engine uses
//   · sedative/stimulant/trace flags, restricted/gated lists
//   · the composition caps myco-validator enforces on every bottle the
//     engine makes (5–7 herbs, ≤2 per category, ≤1 trace at ≤5%,
//     ≤2 GABAergic, ≤2 CNS stimulants)
//
// Deterministic and free: no model is called here. MYCO's reading is a
// separate, optional step in netlify/functions/formula-analysis.mjs, and
// it is handed THIS object to reason from.
//
// SERVER-ONLY.

const { getAllHerbs } = require('../herb-data');
const { assignPercentages } = require('./percentages');
const { checkFormulaPairs } = require('./interactions');
const { isTrace } = require('./traces');
// The *Strict flags: the engine's own isCNSStimulant over-matches (see the
// note in pharmacology.js) and would label Lavender a stimulant here.
const { isGABAergicStrict: isGABAergic, isCNSStimulantStrict: isCNSStimulant, categoryOf } = require('./pharmacology');
const { isRestricted, isGated } = require('./axes');

const MAX_HERBS = 12;          // what one analysis will take
const RULES = {                // mirrored from myco-validator.js
  MIN_HERBS: 5, MAX_HERBS: 7, MAX_PER_CATEGORY: 2,
  MAX_TRACE: 1, TRACE_PCT_CAP: 5, MAX_GABAERGIC: 2, MAX_STIMULANT: 2,
};
const HOUSE_RATIO = '1:3';     // plant : solvent — the Fungai Art standard

// ── Resolving what the page sends ──────────────────────────────────
// Formulas arrive as names from three places that never agreed on ids
// (Mixology's camelCase ids, Engine 2 slugs, herbs.ts numbers), so a
// herb is resolved by number, then name, alias, slash-part, compact
// contains, and finally Latin binomial.
function norm(s) {
  return String(s == null ? '' : s).toLowerCase()
    .replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
}
function compact(s) { return norm(s).replace(/ /g, ''); }
// Keeps what is in brackets: "Holy Basil (Tulsi)" → "holybasiltulsi".
function compactAll(s) { return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]/g, ''); }

// Spellings the pages use that the catalogue spells differently — the
// same list Mixology uses to meet the atlas (mixology/index.html).
const SPELLINGS = {
  schizandra: 'schisandra', verbena: 'vervain', agaricusblazei: 'royal sun mushroom',
  caleazacatechichi: 'calea zacatachichi', goji: 'goji berry',
};

function resolveHerb(q) {
  const all = getAllHerbs();
  let raw = String(q == null ? '' : q).trim().slice(0, 120);
  if (!raw) return null;
  if (/^\d+$/.test(raw)) {
    const byId = all.find(h => h.id === Number(raw));
    if (byId) return byId;
  }
  if (SPELLINGS[compact(raw)]) raw = SPELLINGS[compact(raw)];
  const k = norm(raw), kc = compact(raw);
  if (!kc) return null;
  return all.find(h => norm(h.name) === k)
      || all.find(h => compactAll(h.name) === compactAll(raw))
      || all.find(h => (h.aliases || []).some(a => norm(a) === k))
      || all.find(h => String(h.name).split('/').some(p => norm(p) === k))
      || all.find(h => {
           const n = compact(h.name);
           return kc.length >= 4 && n.length >= 4 && (n.indexOf(kc) >= 0 || kc.indexOf(n) >= 0);
         })
      || (kc.length >= 4 ? all.find(h => compactAll(h.name).indexOf(kc) >= 0) : null)
      || (k.split(' ').length >= 2 ? all.find(h => norm(h.botanical).indexOf(k) === 0) : null)
      || null;
}

// Percentages the maker chose, cleaned to whole numbers summing to 100
// (largest remainder), or null when they did not choose any.
function cleanPercentages(pcts, n) {
  if (!Array.isArray(pcts) || pcts.length !== n) return null;
  const v = pcts.map(x => Number(x));
  if (v.some(x => !Number.isFinite(x) || x < 0 || x > 100)) return null;
  const sum = v.reduce((a, b) => a + b, 0);
  if (sum <= 0) return null;
  const raw = v.map(x => (x / sum) * 100);
  const out = raw.map(Math.floor);
  let left = 100 - out.reduce((a, b) => a + b, 0);
  raw.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0])
    .forEach(([, i]) => { if (left > 0) { out[i]++; left--; } });
  return out;
}

const firstClause = s => String(s || '').split(/\s+[—–-]\s+/)[0].trim();
const clip = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };

function temperature(h) {
  const e = (h.energetics || []).join(' ').toLowerCase();
  if (/\b(hot|warm)/.test(e)) return 'warming';
  if (/\b(cold|cool)/.test(e)) return 'cooling';
  return 'neutral';
}

// Where each herb goes in the lab, at the house ratio.
function extractionArm(h) {
  if (categoryOf(h) === 'mushroom') return 'dual';
  const p = String(h.best_preparation || '').toLowerCase();
  if (/dual|double extract/.test(p)) return 'dual';
  if (/decoct|simmer|boil/.test(p) && !/cold extract|maceration|tincture/.test(p)) return 'decoction';
  return 'maceration';
}

/**
 * Analyse one formula.
 * @param {{ herbs: string[], percentages?: number[], name?: string }} input
 */
function analyzeFormula(input) {
  const asked = (Array.isArray(input && input.herbs) ? input.herbs : []).slice(0, MAX_HERBS);
  const herbs = [], unresolved = [], seen = new Set();
  const keepIdx = [];
  asked.forEach((q, i) => {
    const h = resolveHerb(q);
    if (!h) { unresolved.push(String(q).slice(0, 80)); return; }
    if (seen.has(h.id)) return;              // the same plant twice counts once
    seen.add(h.id); herbs.push(h); keepIdx.push(i);
  });

  const given = Array.isArray(input && input.percentages)
    ? cleanPercentages(keepIdx.map(i => input.percentages[i]), herbs.length) : null;
  const engine = assignPercentages(herbs);
  const pct = given || engine;

  const pairs = checkFormulaPairs(herbs);

  const rows = herbs.map((h, i) => ({
    id:            h.id,
    name:          h.name,
    botanical:     h.botanical,
    percentage:    pct[i],
    enginePercentage: engine[i],
    category:      categoryOf(h),
    temperature:   temperature(h),
    caution:       h.caution_level || null,
    safePregnancy: h.safe_pregnancy === undefined ? null : h.safe_pregnancy,
    grade:         h.evidence_grade || null,
    isTrace:       isTrace(h),
    isGABAergic:   isGABAergic(h),
    isStimulant:   isCNSStimulant(h),
    restricted:    isRestricted(h),
    gated:         isGated(h),
    actions:       (h.primary_functions || []).slice(0, 3).map(firstClause).filter(Boolean),
    energetics:    (h.energetics || []).slice(0, 5),
    meridians:     h.tcm_meridians || [],
    element:       h.tcm_element || null,
    preparation:   clip(h.best_preparation, 420),
    drugInteractions: (h.herb_to_drug_interactions || []).slice(0, 4).map(s => clip(s, 200)),
    contraindications: (h.contraindications || []).slice(0, 3).map(s => clip(s, 200)),
    arm:           extractionArm(h),
  }));

  // ── The engine's own composition rules ──
  const catCount = {};
  rows.forEach(r => { catCount[r.category] = (catCount[r.category] || 0) + 1; });
  const traces = rows.filter(r => r.isTrace);
  const gaba = rows.filter(r => r.isGABAergic);
  const stim = rows.filter(r => r.isStimulant);
  const over = Object.keys(catCount).filter(c => c !== 'other' && catCount[c] > RULES.MAX_PER_CATEGORY);
  const checks = [
    { id: 'size', ok: rows.length >= RULES.MIN_HERBS && rows.length <= RULES.MAX_HERBS,
      label: 'Formula size', detail: rows.length + ' herbs — the engine composes ' + RULES.MIN_HERBS + '–' + RULES.MAX_HERBS + '.' },
    { id: 'category', ok: !over.length,
      label: 'Category balance', detail: over.length ? 'More than ' + RULES.MAX_PER_CATEGORY + ' ' + over.join(', ') + ' herbs — they tend to say the same thing twice.' : 'No category crowds the bottle.' },
    { id: 'trace', ok: traces.length <= RULES.MAX_TRACE && traces.every(r => r.percentage <= RULES.TRACE_PCT_CAP),
      label: 'Trace herbs', detail: traces.length ? traces.map(r => r.name + ' ' + r.percentage + '%').join(', ') + ' — potent aromatics stay at or under ' + RULES.TRACE_PCT_CAP + '%, one per bottle.' : 'None.' },
    { id: 'gaba', ok: gaba.length <= RULES.MAX_GABAERGIC,
      label: 'Sedative load', detail: gaba.length ? gaba.map(r => r.name).join(', ') + (gaba.length > RULES.MAX_GABAERGIC ? ' — more than ' + RULES.MAX_GABAERGIC + ' GABA-acting herbs stack.' : '') : 'No GABA-acting herbs.' },
    { id: 'stim', ok: stim.length <= RULES.MAX_STIMULANT,
      label: 'Stimulant load', detail: stim.length ? stim.map(r => r.name).join(', ') + (stim.length > RULES.MAX_STIMULANT ? ' — more than ' + RULES.MAX_STIMULANT + ' stimulants stack.' : '') : 'No CNS stimulants.' },
    { id: 'push-pull', ok: !(gaba.length && stim.length),
      label: 'Sedative with stimulant', detail: gaba.length && stim.length ? 'Sedating and stimulating herbs pull against each other — intended?' : 'No tug-of-war.' },
    { id: 'restricted', ok: !rows.some(r => r.restricted),
      label: 'Restricted plants', detail: rows.some(r => r.restricted) ? rows.filter(r => r.restricted).map(r => r.name).join(', ') + ' — catalogue only; the engine never puts these in a bottle.' : 'None.' },
  ];

  // ── Pictures of the whole ──
  const temp = { warming: 0, cooling: 0, neutral: 0 };
  rows.forEach(r => { temp[r.temperature] += r.percentage; });
  const meridianW = {};
  rows.forEach(r => r.meridians.forEach(m => { meridianW[m] = (meridianW[m] || 0) + r.percentage; }));
  const meridians = Object.entries(meridianW).sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([name, weight]) => ({ name, weight: Math.round(weight) }));

  const arms = { dual: [], decoction: [], maceration: [] };
  rows.forEach(r => arms[r.arm].push(r.name));
  const plan = [];
  if (arms.dual.length) plan.push({ arm: 'Double extraction', herbs: arms.dual,
    how: 'Hot-water decoction for the water-soluble fraction; alcohol at ' + HOUSE_RATIO + ' for the rest; combine 1:1.' });
  if (arms.decoction.length) plan.push({ arm: 'Decoction', herbs: arms.decoction,
    how: 'Simmer the hard material; preserve with alcohol so the final strength stays at 20–25% or more.' });
  if (arms.maceration.length) plan.push({ arm: 'Cold extract', herbs: arms.maceration,
    how: 'Macerate at ' + HOUSE_RATIO + ' in the ethanol strength each herb asks for (see /extraction), 4–6 weeks.' });

  const pregnancyAvoid = rows.filter(r => r.safePregnancy === false).map(r => r.name);
  const highCaution = rows.filter(r => /HIGH/.test(String(r.caution || ''))).map(r => r.name);

  return {
    name: String((input && input.name) || '').slice(0, 80) || null,
    houseRatio: HOUSE_RATIO,
    percentagesFrom: given ? 'maker' : 'engine',
    herbs: rows,
    unresolved,
    synergies: pairs.synergies.map(s => ({ a: s.a, b: s.b, note: clip(s.note, 260) })),
    cautions:  pairs.cautions.map(s => ({ a: s.a, b: s.b, note: clip(s.note, 260) })),
    checks,
    temperature: temp,
    meridians,
    extraction: plan,
    pregnancyAvoid,
    highCaution,
    rules: RULES,
  };
}

// What changed between two analyses — the "swap lemon balm for
// passionflower" view.
function diffAnalyses(base, next) {
  const names = a => a.herbs.map(h => h.name);
  const pairKey = p => [p.a, p.b].sort().join(' + ');
  const setOf = list => new Set(list.map(pairKey));
  const bS = setOf(base.synergies), nS = setOf(next.synergies);
  const bC = setOf(base.cautions),  nC = setOf(next.cautions);
  const pctOf = a => Object.fromEntries(a.herbs.map(h => [h.name, h.percentage]));
  const bp = pctOf(base), np = pctOf(next);
  return {
    added:   names(next).filter(n => !(n in bp)),
    removed: names(base).filter(n => !(n in np)),
    ratio:   names(next).filter(n => n in bp && bp[n] !== np[n]).map(n => ({ name: n, from: bp[n], to: np[n] })),
    synergiesGained: next.synergies.filter(p => !bS.has(pairKey(p))),
    synergiesLost:   base.synergies.filter(p => !nS.has(pairKey(p))),
    cautionsGained:  next.cautions.filter(p => !bC.has(pairKey(p))),
    cautionsLost:    base.cautions.filter(p => !nC.has(pairKey(p))),
    checksChanged:   next.checks.filter(c => { const o = base.checks.find(x => x.id === c.id); return o && o.ok !== c.ok; })
                       .map(c => ({ id: c.id, label: c.label, now: c.ok ? 'passes' : 'flags', detail: c.detail })),
    temperature: { from: base.temperature, to: next.temperature },
  };
}

module.exports = { analyzeFormula, diffAnalyses, resolveHerb, cleanPercentages, RULES, HOUSE_RATIO };
