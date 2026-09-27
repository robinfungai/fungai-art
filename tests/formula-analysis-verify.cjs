// tests/formula-analysis-verify.cjs — npm run test:formula-analysis
//
// The standard formula analysis (src/server/formula-engine/analyze.js):
// names from every page resolve, percentages behave, the swap diff is
// right, and the sedative / stimulant labels come from each herb's
// recorded cns_action — the old word search called Lavender a stimulant
// ("glutamate" contains "mate"); nothing may repeat that.

const { analyzeFormula, diffAnalyses, resolveHerb, cleanPercentages } = require('../src/server/formula-engine/analyze.js');
const P = require('../src/server/formula-engine/pharmacology.js');
const { getAllHerbs } = require('../src/server/herb-data');

let passed = 0, failed = 0;
const ok  = m => { passed++; console.log('  ✓ ' + m); };
const bad = m => { failed++; console.log('  ✗ ' + m); };
const check = (cond, m) => (cond ? ok(m) : bad(m));

console.log('\n── resolving names from every page ──');
const expect = {
  'Tulsi': 'Holy Basil (Tulsi)', 'schizandra': 'Schisandra (Five-Flavour Fruit)', 'Verbena': 'Vervain',
  'Agaricus Blazei': 'Royal Sun Mushroom', 'Goji': 'Goji Berry', 'lions_mane': "Lion's Mane",
  '252': 'Lemon Balm', 'Amla': 'Amla / Amalaki', 'Kalmegh': 'Kalmegh / Andrographis',
};
for (const [q, want] of Object.entries(expect)) {
  const h = resolveHerb(q);
  check(h && h.name === want, JSON.stringify(q) + ' → ' + want + (h ? '' : ' (got nothing)'));
}
check(resolveHerb('Cramp Bark') === null, 'a plant outside the catalogue resolves to nothing');

console.log('\n── percentages ──');
const p = cleanPercentages([30, 30, 20], 3);
check(p && p.reduce((a, b) => a + b, 0) === 100, 'maker shares are scaled to 100 (' + (p || []).join('/') + ')');
check(cleanPercentages([10, -1], 2) === null, 'a negative share is refused');
const eng = analyzeFormula({ herbs: ['Reishi', 'Lemon Balm', 'Lavender', 'Chamomile'] });
check(eng.percentagesFrom === 'engine', 'no shares given → the engine balances');
const lav = eng.herbs.find(h => h.name === 'Lavender');
check(lav && lav.isTrace && lav.percentage <= 5, 'the engine keeps a trace herb at or under 5% (' + (lav && lav.percentage) + '%)');
check(eng.herbs.reduce((a, h) => a + h.percentage, 0) === 100, 'engine shares sum to 100');

console.log('\n── labels are true ──');
const lavender = getAllHerbs().find(h => h.name === 'Lavender');
check(P.isCNSStimulant(lavender) === false, 'the engine no longer calls Lavender a stimulant');
check(P.cnsAction(lavender) === 'calming', 'Lavender is recorded as calming');
check(lav && lav.isStimulant === false, 'the analysis does not label Lavender a stimulant');
const guarana = analyzeFormula({ herbs: ['Guarana', 'Rhodiola', 'Yerba Mate'] });
check(guarana.herbs.every(h => h.isStimulant), 'real stimulants are still labelled (Guarana, Rhodiola, Yerba Mate)');
check(guarana.checks.find(c => c.id === 'stim').ok === false, 'three stimulants break the engine’s cap of two');
const eph = analyzeFormula({ herbs: ['Ephedra', 'Chamomile', 'Reishi'] });
check(eph.checks.find(c => c.id === 'pro-only').ok === false, 'Ephedra is flagged as pro-only');
check(eph.herbs.find(h => /Ephedra/.test(h.name)).cns === 'stimulant', 'Ephedra is a stimulant (the word search never caught it)');
check(eph.pregnancyAvoid.includes('Reishi'), 'unknown pregnancy safety (Reishi) is listed as not-in-pregnancy');

console.log('\n── the swap ──');
const base = analyzeFormula({ herbs: ['Reishi', 'Ashwagandha', 'Lemon Balm', 'Tulsi', 'Lavender'], percentages: [30, 25, 25, 15, 5] });
const next = analyzeFormula({ herbs: ['Reishi', 'Ashwagandha', 'Passionflower', 'Tulsi', 'Lavender'], percentages: [30, 25, 25, 15, 5] });
const d = diffAnalyses(base, next);
check(d.added.join() === 'Passionflower' && d.removed.join() === 'Lemon Balm', 'lemon balm → passionflower shows as one out, one in');
check(Array.isArray(d.synergiesGained) && Array.isArray(d.synergiesLost), 'synergy gained/lost is reported');
check(d.ratio.length === 0, 'shares that did not move are not reported as moved');

console.log('\n── restricted plants ──');
const r = analyzeFormula({ herbs: ['Kratom', 'Chamomile'] });
check(r.checks.find(c => c.id === 'restricted').ok === false, 'a restricted plant is flagged, never analysed as bottle-ready');

console.log('\n  passed: ' + passed + '   failed: ' + failed + '\n');
process.exit(failed ? 1 : 0);
