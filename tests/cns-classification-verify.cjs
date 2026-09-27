// tests/cns-classification-verify.cjs — npm run test:cns-classification
//
// The stimulant / sedative judgement is recorded in herbs.ts
// (cns_action + cns_evidence), not guessed from words. This keeps it so:
//   · every herb the old word search would flag carries an explicit class,
//     so a new herb that reads as sedating or stimulating fails the build
//     until someone classifies it;
//   · every class has its evidence written down;
//   · the known answers stay true (the "glutamate" mistakes stay fixed);
//   · the engine rules built on the classes hold for every intention:
//     pro-only herbs, pregnancy, under-18s, evening formulas, the caps.

const { getAllHerbs } = require('../src/server/herb-data');
const P = require('../src/server/formula-engine/pharmacology');
const { compileFormula } = require('../src/server/formula-engine');
const { buildScoredCandidates } = require('../src/server/formula-engine/picker');
const { ensurePool } = require('../src/server/formula-engine/axes');

let passed = 0, failed = 0;
const check = (cond, m) => { if (cond) { passed++; console.log('  ✓ ' + m); } else { failed++; console.log('  ✗ ' + m); } };

const all = getAllHerbs();
const byName = n => all.find(h => h.name.toLowerCase().startsWith(n.toLowerCase()));

console.log('\n── the data ──');
const unclassified = all.filter(h => !h.cns_action && (P.guessGABAergic(h) || P.guessCNSStimulant(h)));
check(!unclassified.length, 'every herb the word search would flag has a cns_action' +
  (unclassified.length ? ' — classify: ' + unclassified.map(h => h.name).join(', ') : ''));
const badClass = all.filter(h => h.cns_action && !P.CNS_ACTIONS.includes(h.cns_action));
check(!badClass.length, 'every cns_action is one of ' + P.CNS_ACTIONS.join(' / ') + (badClass.length ? ' — ' + badClass.map(h => h.name).join(', ') : ''));
const noEvidence = all.filter(h => h.cns_action && !(h.cns_evidence && h.cns_evidence.length > 30));
check(!noEvidence.length, 'every cns_action carries its evidence' + (noEvidence.length ? ' — ' + noEvidence.map(h => h.name).join(', ') : ''));
const nonNeutral = all.filter(h => h.cns_action && h.cns_action !== 'neutral');
const unsourced = nonNeutral.filter(h => !/PMID \d{5,9}|No study in PubMed|no controlled human|No human CNS trial/i.test(h.cns_evidence || ''));
check(!unsourced.length, 'every non-neutral class cites a PMID or says plainly that none exists' + (unsourced.length ? ' — ' + unsourced.map(h => h.name).join(', ') : ''));

console.log('\n── known answers ──');
const expect = {
  'Ephedra': 'stimulant', 'Yohimbe': 'stimulant', 'Citrus Aurantium': 'stimulant', 'Guarana': 'stimulant',
  'Valerian': 'sedative', 'Kava': 'sedative', 'Passionflower': 'sedative', 'Amanita Muscaria': 'sedative',
  'Rhodiola': 'activating', 'Cordyceps': 'activating', 'Mucuna': 'activating',
  'Lavender': 'calming', "St. John's Wort": 'calming', 'Chamomile': 'calming', 'Skullcap': 'calming',
  'He Shou Wu': 'neutral', 'Barley': 'neutral', 'Rowan Berry': 'neutral', 'Jiaogulan': 'neutral', 'Jasmine': 'neutral',
  'Calea': 'psychoactive', 'African Dream Root': 'psychoactive',
};
for (const [n, want] of Object.entries(expect)) {
  const h = byName(n);
  check(h && P.cnsAction(h) === want, n + ' is ' + want + (h ? '' : ' (not found)') + (h && P.cnsAction(h) !== want ? ' — got ' + P.cnsAction(h) : ''));
}
check(!P.isCNSStimulant(byName('Lavender')) && !P.isCNSStimulant(byName("St. John's Wort")), '"glutamate" no longer makes Lavender or St John\'s Wort stimulants');
check(P.isCNSStimulant(byName('Rhodiola')) && !P.isStrongStimulant(byName('Rhodiola')), 'activating herbs share the stimulant cap but are not true stimulants');

console.log('\n── Ephedra is pro-only ──');
const eph = ensurePool().find(h => /Ephedra/.test(h.name));
check(eph && eph.proOnly === true, 'Ephedra carries proOnly in the pool');
const energy = { intention: 'energy', intentions: ['energy'], pattern: 'depleted', time: 'morning', stress: 'push',
  duration: 'weeks', avoid: ['none'], age: '25_40', sleep: 'restorative_6plus', notes: 'exhausted, need energy', _gatedOptIn: false, _ageConfirmed: true };
const consumerCands = buildScoredCandidates(energy, 400).map(h => h.name);
check(!consumerCands.some(n => /Ephedra/.test(n)), 'a consumer never sees Ephedra, even among 400 candidates');
const proCands = buildScoredCandidates(Object.assign({}, energy, { _pro: true }), 400).map(h => h.name);
check(proCands.some(n => /Ephedra/.test(n)), 'the pro composer can consider Ephedra');
const minorPro = buildScoredCandidates(Object.assign({}, energy, { _pro: true, _minor: true }), 400).map(h => h.name);
check(!minorPro.some(n => /Ephedra/.test(n)), 'an under-18 profile never gets Ephedra, pro or not');

console.log('\n── every intention, three customers ──');
const INT = ['stress', 'anxiety', 'sleep', 'energy', 'mood', 'cognitive', 'hormones', 'digestion', 'immunity', 'pain', 'detox', 'beauty'];
const TIMES = ['morning', 'evening'];
const base = { pattern: 'mixed', patternSub: 'sighing', stress: 'push', duration: 'weeks', avoid: ['none'], age: '25_40',
  sleep: 'restorative_6plus', notes: '', _gatedOptIn: false, _ageConfirmed: true };
const herbOf = new Map(all.map(h => [h.id, h]));
const problems = { pro: [], preg: [], minor: [], night: [], caps: [], pushpull: [], failed: [] };
for (const time of TIMES) for (const i of INT) {
  const variants = {
    adult: {}, pregnant: { avoid: ['pregnancy'] }, minor: { age: 'under_18' },
  };
  for (const [who, extra] of Object.entries(variants)) {
    const r = compileFormula(Object.assign({}, base, { intention: i, intentions: [i], time }, extra));
    const tag = who + '/' + time + '/' + i;
    if (r.status !== 'ok' || r.herbs.length < 3) { problems.failed.push(tag); continue; }
    const hs = r.herbs.map(x => herbOf.get(x.id));
    if (hs.some(h => h.formula_access === 'pro')) problems.pro.push(tag);
    if (who === 'pregnant' && hs.some(h => h.safe_pregnancy !== true)) problems.preg.push(tag);
    if (who === 'minor' && hs.some(h => /^(HIGH|VERY HIGH)$/.test(h.caution_level) || ['stimulant', 'activating', 'sedative', 'psychoactive'].includes(P.cnsAction(h)) || (P.cnsAction(h) === 'calming' && h.caution_level !== 'LOW'))) problems.minor.push(tag);
    if ((time === 'evening' || i === 'sleep') && hs.some(h => P.isCNSStimulant(h))) problems.night.push(tag);
    if (hs.filter(P.isGABAergic).length > 2 || hs.filter(P.isCNSStimulant).length > 2) problems.caps.push(tag);
    if (hs.some(P.isGABAergic) && hs.some(P.isStrongStimulant)) problems.pushpull.push(tag);
  }
}
check(!problems.failed.length, 'every intention composes for adults, pregnant customers and under-18s, morning and evening' + (problems.failed.length ? ' — failed: ' + problems.failed.join(', ') : ''));
check(!problems.pro.length, 'no consumer formula holds a pro-only herb' + (problems.pro.length ? ' — ' + problems.pro.join(', ') : ''));
check(!problems.preg.length, 'a pregnant customer only ever gets herbs recorded safe in pregnancy' + (problems.preg.length ? ' — ' + problems.preg.join(', ') : ''));
check(!problems.minor.length, 'an under-18 formula holds nothing HIGH-caution, stimulating, sedating, psychoactive, or calming above LOW' + (problems.minor.length ? ' — ' + problems.minor.join(', ') : ''));
check(!problems.night.length, 'nothing stimulating or activating in an evening or sleep formula' + (problems.night.length ? ' — ' + problems.night.join(', ') : ''));
check(!problems.caps.length, 'at most 2 sedatives and 2 stimulating herbs per bottle' + (problems.caps.length ? ' — ' + problems.caps.join(', ') : ''));
check(!problems.pushpull.length, 'never a sedative beside a true stimulant' + (problems.pushpull.length ? ' — ' + problems.pushpull.join(', ') : ''));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
