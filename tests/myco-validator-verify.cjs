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

const { validateMycoProposal, MIN_HERBS, MAX_HERBS } = require('../src/server/formula-engine/myco-validator');

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
  { id: 500, name: 'Lavender',    primary_functions: ['aromatic · essential-oil · carminative'], energetics: ['Cool'], pharmacology: '', gated: false }, // trace via TRACE_IDS name
  { id: 510, name: 'Ginger',      primary_functions: ['aromatic · essential-oil'], energetics: ['Warm'], pharmacology: '', gated: false }, // trace
  { id: 520, name: 'Valerian',    primary_functions: ['nervine · GABA · sedative valerian'], energetics: ['Warm'], pharmacology: '', gated: false }, // GABAergic
  { id: 530, name: 'Passionflower', primary_functions: ['nervine · GABA · passionflower'], energetics: ['Cool'], pharmacology: '', gated: false }, // GABAergic
  { id: 540, name: 'Hops',        primary_functions: ['nervine · GABA · hops'], energetics: ['Cool'], pharmacology: '', gated: false }, // GABAergic
  { id: 550, name: 'Rhodiola',    primary_functions: ['adaptogen · caffeine.rich · rhodiola'], energetics: ['Warm'], pharmacology: '', gated: false }, // CNS stimulant
  { id: 560, name: 'Guarana',     primary_functions: ['stimulant · caffeine.rich · guarana'], energetics: ['Warm'], pharmacology: '', gated: false }, // CNS stimulant
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

check('trace herb >5% → MYCO_TRACE_PCT_EXCEEDED', () => {
  const p = [
    { id: 500, pct: 20, reason: 'lavender heavy' }, // trace > 5%
    { id: 210, pct: 30, reason: 'a' }, { id: 250, pct: 20, reason: 'b' },
    { id: 220, pct: 20, reason: 'c' }, { id: 230, pct: 10, reason: 'd' },
  ];
  const r = validateMycoProposal({ mycoResponse: p, candidateSet: CANDIDATES, gatedOptIn: false });
  return { pass: r.ok === false && r.reason === 'MYCO_TRACE_PCT_EXCEEDED', detail: r.reason };
});

check('two trace herbs → MYCO_TRACE_COUNT_EXCEEDED', () => {
  const p = [
    { id: 500, pct: 5, reason: 'lav' }, { id: 510, pct: 5, reason: 'ginger' },
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

check('three of same category → MYCO_CATEGORY_CAP_EXCEEDED', () => {
  const p = [
    { id: 250, pct: 20, reason: 'reishi' }, { id: 260, pct: 20, reason: 'cord' }, { id: 570, pct: 20, reason: 'amanita' }, // 3 mushrooms
    { id: 210, pct: 30, reason: 'a' }, { id: 220, pct: 10, reason: 'b' },
  ];
  const r = validateMycoProposal({ mycoResponse: p, candidateSet: CANDIDATES, gatedOptIn: true });
  return { pass: r.ok === false && r.reason === 'MYCO_CATEGORY_CAP_EXCEEDED', detail: r.reason };
});

check('pct 0 → MYCO_PCT_INVALID', () => {
  const p = [...VALID_PROPOSAL];
  p[0] = { id: 210, pct: 0, reason: 'zero' };
  const r = validateMycoProposal({ mycoResponse: p, candidateSet: CANDIDATES, gatedOptIn: false });
  return { pass: r.ok === false && r.reason === 'MYCO_PCT_INVALID', detail: r.reason };
});

check('pct > 100 → MYCO_PCT_INVALID', () => {
  const p = [...VALID_PROPOSAL];
  p[0] = { id: 210, pct: 150, reason: 'over' };
  const r = validateMycoProposal({ mycoResponse: p, candidateSet: CANDIDATES, gatedOptIn: false });
  return { pass: r.ok === false && r.reason === 'MYCO_PCT_INVALID', detail: r.reason };
});

check('pct sum wildly off (~60) → MYCO_PCT_SUM_INVALID', () => {
  const p = [
    { id: 210, pct: 20, reason: 'a' }, { id: 250, pct: 10, reason: 'b' }, { id: 220, pct: 10, reason: 'c' },
    { id: 230, pct: 10, reason: 'd' }, { id: 240, pct: 10, reason: 'e' },
  ];
  const r = validateMycoProposal({ mycoResponse: p, candidateSet: CANDIDATES, gatedOptIn: false });
  return { pass: r.ok === false && r.reason === 'MYCO_PCT_SUM_INVALID', detail: r.reason };
});

check('pct sum off by 1 (rounding drift) → accepted + drift adjusted', () => {
  const p = [
    { id: 210, pct: 33, reason: 'a' }, { id: 250, pct: 33, reason: 'b' }, { id: 220, pct: 17, reason: 'c' },
    { id: 230, pct: 10, reason: 'd' }, { id: 240, pct: 6, reason: 'e' },
  ]; // sum = 99
  const r = validateMycoProposal({ mycoResponse: p, candidateSet: CANDIDATES, gatedOptIn: false });
  return { pass: r.ok === true && r.percentages.reduce((a,b)=>a+b,0) === 100, detail: 'sum=' + (r.percentages && r.percentages.reduce((a,b)=>a+b,0)) };
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
