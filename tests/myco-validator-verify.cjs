// tests/myco-validator-verify.cjs
//
// Step 5.5 tests — validateMycoProposal.
//
// The validator is the deterministic authority per audit constraint
// #11. MYCO is untrusted creative input; this function catches every
// possible way MYCO could return something unsafe or out-of-bounds,
// then either accepts the proposal or rejects with a stable reason
// code the compose orchestrator uses to fall back to deterministic.
//
// Covers each rejection reason enum + the happy-path accept.
//
// Since 2026-09-28 (D2, option C) MYCO chooses herbs and the engine sets
// the percentages: a `pct` on a pick is ignored, so the old MYCO_PCT_*
// and MYCO_TRACE_PCT_EXCEEDED rejections are gone and their cases now
// prove the engine's own shares come back instead.

const { validateMycoProposal, MIN_HERBS, MAX_HERBS } = require('../src/server/formula-engine/myco-validator');
const { assignPercentages } = require('../src/server/formula-engine/percentages');
const sum = a => (a || []).reduce((x, y) => x + y, 0);

// Minimal candidate herbs. Fields the validator reads:
//   id, name, primary_functions, energetics, pharmacology,
//   herb_to_herb_synergy, herb_to_herb_caution, gated
// Categories, GABAergic, CNS-stimulant, trace are DERIVED from the
// text — so we construct herbs whose text makes categoryOf/isTrace/
// isGABAergic/isCNSStimulant return the intended value.
const CANDIDATES = [
  { id: 210, name: 'Ashwagandha', primary_functions: ['adaptogen · HPA · cortisol'], energetics: ['Warm'], pharmacology: '', gated: false },
  { id: 250, name: 'Reishi',      primary_functions: ['mushroom · Shen · spiritual'], energetics: ['Neutral'], pharmacology: '', gated: false },
  { id: 260, name: 'Cordyceps',   primary_functions: ['mushroom · CNS stimulant · cordyceps'], energetics: ['Warm'], pharmacology: '', gated: false },
  { id: 220, name: 'Rose Petals', primary_functions: ['nervine · GABA · calm'], energetics: ['Cool'], pharmacology: '', gated: false },
  { id: 230, name: 'Nettle',      primary_functions: ['nutritive · mineral-rich · deeply nourishing'], energetics: ['Cool'], pharmacology: '', gated: false },
  { id: 240, name: 'Damiana',     primary_functions: ['tonic · nourishing'], energetics: ['Warm'], pharmacology: '', gated: false },
  { id: 500, name: 'Lavender',    primary_functions: ['aromatic · essential-oil · carminative'], energetics: ['Cool'], pharmacology: '', gated: false, trace_class: 'aromatic' }, // trace — recorded, as in herbs.ts since 2026-09-29
  { id: 510, name: 'Ginger',      primary_functions: ['aromatic · essential-oil'], energetics: ['Warm'], pharmacology: '', gated: false, trace_class: 'pungent' }, // trace — recorded
  { id: 520, name: 'Valerian',    primary_functions: ['nervine · GABA · sedative valerian'], energetics: ['Warm'], pharmacology: '', gated: false }, // GABAergic
  { id: 530, name: 'Passionflower', primary_functions: ['nervine · GABA · passionflower'], energetics: ['Cool'], pharmacology: '', gated: false }, // GABAergic
  { id: 540, name: 'Hops',        primary_functions: ['nervine · GABA · hops'], energetics: ['Cool'], pharmacology: '', gated: false }, // GABAergic
  { id: 550, name: 'Rhodiola',    primary_functions: ['adaptogen · caffeine.rich · rhodiola'], energetics: ['Warm'], pharmacology: '', gated: false }, // CNS stimulant
  { id: 560, name: 'Guarana',     primary_functions: ['stimulant · caffeine.rich · guarana'], energetics: ['Warm'], pharmacology: '', gated: false }, // CNS stimulant
  { id: 580, name: "St. John's Wort", primary_functions: ['mood · hypericum'], energetics: ['Cool'], pharmacology: '', gated: false, serotonergic: true },
  { id: 590, name: 'Kanna',       primary_functions: ['mood · mesembrine'], energetics: ['Warm'], pharmacology: '', gated: false, serotonergic: true },
  { id: 570, name: 'Amanita',     primary_functions: ['mushroom · amanita · ceremonial'], energetics: ['Neutral'], pharmacology: '', gated: true }, // gated
];

const VALID_PROPOSAL = [
  { id: 210, pct: 30, reason: 'adaptogen backbone' },
  { id: 250, pct: 25, reason: 'shen anchor' },
  { id: 220, pct: 20, reason: 'nervine cool' },
  { id: 230, pct: 15, reason: 'mineral base' },
  { id: 240, pct: 10, reason: 'tonic support' },
];

const cases = [];

function check(name, run) { cases.push({ name, run }); }

check('happy path — 5 herbs, sums to 100, no cap violations → accepted', () => {
  const r = validateMycoProposal({ mycoResponse: VALID_PROPOSAL, candidateSet: CANDIDATES, gatedOptIn: false });
  return { pass: r.ok === true && r.herbs.length === 5 && r.percentages.reduce((a,b)=>a+b,0) === 100, detail: JSON.stringify(r).slice(0,300) };
});

check('too few herbs (4) → MYCO_HERB_COUNT_OUT_OF_RANGE', () => {
  const r = validateMycoProposal({ mycoResponse: VALID_PROPOSAL.slice(0,4), candidateSet: CANDIDATES, gatedOptIn: false });
  return { pass: r.ok === false && r.reason === 'MYCO_HERB_COUNT_OUT_OF_RANGE', detail: r.reason };
});

check('too many herbs (8) → MYCO_HERB_COUNT_OUT_OF_RANGE', () => {
  const p = [...VALID_PROPOSAL, {id:500,pct:5,reason:'x'}, {id:510,pct:3,reason:'y'}, {id:520,pct:2,reason:'z'}];
  const r = validateMycoProposal({ mycoResponse: p, candidateSet: CANDIDATES, gatedOptIn: false });
  return { pass: r.ok === false && r.reason === 'MYCO_HERB_COUNT_OUT_OF_RANGE', detail: r.reason };
});

check('picked herb NOT in candidate set → MYCO_HERB_OUTSIDE_CANDIDATE_SET', () => {
  const p = [...VALID_PROPOSAL];
  p[0] = { id: 9999, pct: 30, reason: 'attacker' };
  const r = validateMycoProposal({ mycoResponse: p, candidateSet: CANDIDATES, gatedOptIn: false });
  return { pass: r.ok === false && r.reason === 'MYCO_HERB_OUTSIDE_CANDIDATE_SET', detail: r.reason };
});

check('duplicate herb → MYCO_DUPLICATE_HERB', () => {
  const p = [
    { id: 210, pct: 30, reason: 'a' }, { id: 210, pct: 20, reason: 'b' },
    { id: 250, pct: 20, reason: 'c' }, { id: 220, pct: 20, reason: 'd' }, { id: 230, pct: 10, reason: 'e' },
  ];
  const r = validateMycoProposal({ mycoResponse: p, candidateSet: CANDIDATES, gatedOptIn: false });
  return { pass: r.ok === false && r.reason === 'MYCO_DUPLICATE_HERB', detail: r.reason };
});

check('gated herb without opt-in → MYCO_GATED_WITHOUT_OPT_IN', () => {
  const p = [
    { id: 570, pct: 30, reason: 'amanita' }, // gated
    { id: 210, pct: 20, reason: 'a' }, { id: 250, pct: 20, reason: 'b' },
    { id: 220, pct: 20, reason: 'c' }, { id: 230, pct: 10, reason: 'd' },
  ];
  const r = validateMycoProposal({ mycoResponse: p, candidateSet: CANDIDATES, gatedOptIn: false });
  return { pass: r.ok === false && r.reason === 'MYCO_GATED_WITHOUT_OPT_IN', detail: r.reason };
});

check('gated herb WITH opt-in → accepted', () => {
  const p = [
    { id: 570, pct: 25, reason: 'amanita' },
    { id: 210, pct: 25, reason: 'a' }, { id: 250, pct: 20, reason: 'b' },
    { id: 220, pct: 20, reason: 'c' }, { id: 230, pct: 10, reason: 'd' },
  ];
  const r = validateMycoProposal({ mycoResponse: p, candidateSet: CANDIDATES, gatedOptIn: true });
  return { pass: r.ok === true, detail: JSON.stringify(r).slice(0,200) };
});

check('MYCO asks 20% for a trace herb → the engine gives it at most 5%', () => {
  const p = [
    { id: 500, pct: 20, reason: 'lavender heavy' }, // trace
    { id: 210, pct: 30, reason: 'a' }, { id: 250, pct: 20, reason: 'b' },
    { id: 220, pct: 20, reason: 'c' }, { id: 230, pct: 10, reason: 'd' },
  ];
  const r = validateMycoProposal({ mycoResponse: p, candidateSet: CANDIDATES, gatedOptIn: false });
  return { pass: r.ok === true && r.percentages[0] <= 5 && sum(r.percentages) === 100, detail: r.ok ? r.percentages.join('/') : r.reason };
});

check('three trace herbs → MYCO_TRACE_COUNT_EXCEEDED (two are allowed since 2026-09-29)', () => {
  const third = CANDIDATES.find(h => ![500, 510].includes(h.id) && /lavender|ginger|clove|cinnamon|cardamom|pepper|fennel|thyme|sage|rosemary/i.test(h.name));
  if (!third) return { pass: true, detail: 'no third trace candidate in the stand-in set' };
  const p = [
    { id: 500, pct: 5, reason: 'lav' }, { id: 510, pct: 5, reason: 'ginger' }, { id: third.id, pct: 5, reason: 'third' },
    { id: 210, pct: 40, reason: 'a' }, { id: 250, pct: 30, reason: 'b' }, { id: 220, pct: 20, reason: 'c' },
  ];
  const r = validateMycoProposal({ mycoResponse: p, candidateSet: CANDIDATES, gatedOptIn: false });
  return { pass: r.ok === false && r.reason === 'MYCO_TRACE_COUNT_EXCEEDED', detail: r.reason };
});

check('three GABAergics → MYCO_GABA_LOAD_EXCEEDED', () => {
  const p = [
    { id: 520, pct: 20, reason: 'val' }, { id: 530, pct: 20, reason: 'pass' }, { id: 540, pct: 20, reason: 'hops' },
    { id: 210, pct: 30, reason: 'a' }, { id: 250, pct: 10, reason: 'b' },
  ];
  const r = validateMycoProposal({ mycoResponse: p, candidateSet: CANDIDATES, gatedOptIn: false });
  return { pass: r.ok === false && r.reason === 'MYCO_GABA_LOAD_EXCEEDED', detail: r.reason };
});

check('three CNS stimulants → MYCO_STIMULANT_LOAD_EXCEEDED', () => {
  const p = [
    { id: 260, pct: 20, reason: 'cord' }, { id: 550, pct: 20, reason: 'rhod' }, { id: 560, pct: 20, reason: 'guar' },
    { id: 210, pct: 30, reason: 'a' }, { id: 220, pct: 10, reason: 'b' },
  ];
  const r = validateMycoProposal({ mycoResponse: p, candidateSet: CANDIDATES, gatedOptIn: false });
  return { pass: r.ok === false && r.reason === 'MYCO_STIMULANT_LOAD_EXCEEDED', detail: r.reason };
});

check("St John's Wort + Kanna → MYCO_SEROTONERGIC_LOAD_EXCEEDED", () => {
  const p = [
    { id: 580, pct: 20, reason: 'sjw' }, { id: 590, pct: 20, reason: 'kanna' },
    { id: 210, pct: 30, reason: 'a' }, { id: 250, pct: 20, reason: 'b' }, { id: 230, pct: 10, reason: 'c' },
  ];
  const r = validateMycoProposal({ mycoResponse: p, candidateSet: CANDIDATES, gatedOptIn: false });
  return { pass: r.ok === false && r.reason === 'MYCO_SEROTONERGIC_LOAD_EXCEEDED', detail: r.reason };
});

check('three of same category → MYCO_CATEGORY_CAP_EXCEEDED', () => {
  const p = [
    { id: 250, pct: 20, reason: 'reishi' }, { id: 260, pct: 20, reason: 'cord' }, { id: 570, pct: 20, reason: 'amanita' }, // 3 mushrooms
    { id: 210, pct: 30, reason: 'a' }, { id: 220, pct: 10, reason: 'b' },
  ];
  const r = validateMycoProposal({ mycoResponse: p, candidateSet: CANDIDATES, gatedOptIn: true });
  return { pass: r.ok === false && r.reason === 'MYCO_CATEGORY_CAP_EXCEEDED', detail: r.reason };
});

check('MYCO sends pct 150 / 0 → ignored, the engine percentages come back', () => {
  const p = VALID_PROPOSAL.map((x, i) => Object.assign({}, x, { pct: i === 0 ? 150 : 0 }));
  const r = validateMycoProposal({ mycoResponse: p, candidateSet: CANDIDATES, gatedOptIn: false });
  return { pass: r.ok === true && JSON.stringify(r.percentages) === JSON.stringify(assignPercentages(r.herbs)), detail: r.ok ? r.percentages.join('/') : r.reason };
});

check('picks with no pct at all → accepted, percentages sum to 100', () => {
  const p = VALID_PROPOSAL.map(({ id, reason }) => ({ id, reason }));
  const r = validateMycoProposal({ mycoResponse: p, candidateSet: CANDIDATES, gatedOptIn: false });
  return { pass: r.ok === true && sum(r.percentages) === 100 && r.percentages.every(x => x >= 1), detail: r.ok ? r.percentages.join('/') : r.reason };
});

check('MYCO asks 70% for one herb → no herb above 40%, shares follow the scores', () => {
  const scored = CANDIDATES.map((h, i) => Object.assign({}, h, { _score: i === 0 ? 60 : 8 }));
  const p = [{ id: 210, pct: 70, reason: 'hero' }, ...VALID_PROPOSAL.slice(1).map(({ id, reason }) => ({ id, pct: 7, reason }))];
  const r = validateMycoProposal({ mycoResponse: p, candidateSet: scored, gatedOptIn: false });
  return { pass: r.ok === true && r.percentages[0] === 40 && Math.max(...r.percentages) === 40 && sum(r.percentages) === 100, detail: r.ok ? r.percentages.join('/') : r.reason };
});

check('malformed response (not array) → MYCO_MALFORMED', () => {
  const r = validateMycoProposal({ mycoResponse: 'not an array', candidateSet: CANDIDATES, gatedOptIn: false });
  return { pass: r.ok === false && r.reason === 'MYCO_MALFORMED', detail: r.reason };
});

check('pick entry is null → MYCO_PICK_INVALID', () => {
  const p = [null, ...VALID_PROPOSAL.slice(1), { id: 240, pct: 30, reason: 'x' }];
  const r = validateMycoProposal({ mycoResponse: p, candidateSet: CANDIDATES, gatedOptIn: false });
  return { pass: r.ok === false && r.reason === 'MYCO_PICK_INVALID', detail: r.reason };
});

check('MYCO returns id as name string (fallback name match) → accepted', () => {
  const p = [
    { id: 'Ashwagandha', pct: 30, reason: 'a' },  // matched by name
    { id: 250, pct: 25, reason: 'b' }, { id: 220, pct: 20, reason: 'c' },
    { id: 230, pct: 15, reason: 'd' }, { id: 240, pct: 10, reason: 'e' },
  ];
  const r = validateMycoProposal({ mycoResponse: p, candidateSet: CANDIDATES, gatedOptIn: false });
  return { pass: r.ok === true && r.herbs[0].name === 'Ashwagandha', detail: r.ok ? 'names=' + r.herbs.map(h => h.name).join(',') : r.reason };
});

(async () => {
  console.log('── STEP 5.5 · MYCO validator — ' + cases.length + ' scenarios ──');
  let pass = 0, fail = 0;
  for (const c of cases) {
    try {
      const r = c.run();
      if (r.pass) { pass++; console.log('  ✓ ' + c.name); }
      else { fail++; console.log('  ✗ ' + c.name); console.log('      ' + r.detail); }
    } catch (e) {
      fail++;
      console.log('  ✗ ' + c.name + '  THREW: ' + (e && e.message));
    }
  }
  console.log('');
  console.log('passed: ' + pass);
  console.log('failed: ' + fail);
  process.exit(fail === 0 ? 0 : 1);
})();
