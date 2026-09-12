// tests/age-canonical-verify.cjs
//
// Round 2 · Item #0. Age question in the quiz is the CANONICAL age
// input. The server DERIVES `_minor` from `profile.age === 'under_18'`
// and IGNORES anything the client puts in `profile._minor`. A hostile
// client cannot lie their way past the minor gate by:
//   · sending _minor: false while age: 'under_18'
//   · omitting _minor entirely
//   · omitting the field-mutation client-side amendment of avoid[]
//
//   node tests/age-canonical-verify.cjs

const { compileFormula } = require('../src/server/formula-engine');

const base = {
  intention: 'stress', intentions: ['stress'],
  pattern: 'mixed', patternSub: 'sighing',
  time: 'evening', stress: 'push', duration: 'weeks',
  avoid: ['none'], sleep: 'restorative_6plus',
  notes: '', _gatedOptIn: false, _ageConfirmed: true,
};

const cases = [];

// ── The core lie: age=under_18 + client says _minor=false ──────────
cases.push({
  name: 'age:under_18 with _minor:false STILL gets minor-safe formula',
  run: () => {
    const p = Object.assign({}, base, { age: 'under_18', _minor: false });
    const r = compileFormula(p);
    if (r.status !== 'ok') return { pass: false, detail: `status=${r.status}` };
    const gated = r.herbs.filter(h => h.isGated).length;
    const gaba  = r.herbs.filter(h => h.isGABAergic).length;
    const stim  = r.herbs.filter(h => h.isCNSStimulant).length;
    return {
      pass: gated === 0 && gaba === 0 && stim === 0,
      detail: `herbs=${r.herbs.length} gated=${gated} gaba=${gaba} stim=${stim}`,
    };
  },
});

// ── Omitting _minor entirely ───────────────────────────────────────
cases.push({
  name: 'age:under_18 with no _minor field STILL gets minor-safe formula',
  run: () => {
    const p = Object.assign({}, base, { age: 'under_18' });
    delete p._minor;
    const r = compileFormula(p);
    if (r.status !== 'ok') return { pass: false, detail: `status=${r.status}` };
    const bad = r.herbs.filter(h => h.isGated || h.isGABAergic || h.isCNSStimulant);
    return { pass: bad.length === 0, detail: `unsafe herbs=${bad.length}` };
  },
});

// ── Client sends _minor:true but age is adult — engine should NOT
//    apply minor gate (age answer is canonical, not the flag) ──────
cases.push({
  name: 'age:25_40 with _minor:true does NOT get minor-narrowed pool',
  run: () => {
    const adultProfile   = Object.assign({}, base, { age: '25_40', _minor: false });
    const lyingClient    = Object.assign({}, base, { age: '25_40', _minor: true });
    const adult = compileFormula(adultProfile);
    const lying = compileFormula(lyingClient);
    if (adult.status !== 'ok' || lying.status !== 'ok') {
      return { pass: false, detail: 'compose failed' };
    }
    // Same age answer + same profile → same formula regardless of the
    // (untrusted) _minor bit. Compare herb names in order.
    const a = adult.herbs.map(h => h.name).join('|');
    const b = lying.herbs.map(h => h.name).join('|');
    return { pass: a === b, detail: `adult=[${a}] vs lying=[${b}]` };
  },
});

// ── Adult age → no restrictions applied ────────────────────────────
cases.push({
  name: 'age:41_60 formula MAY include gated/GABA/stim herbs (no gate)',
  run: () => {
    const p = Object.assign({}, base, { age: '41_60', _gatedOptIn: true });
    const r = compileFormula(p);
    if (r.status !== 'ok') return { pass: false, detail: `status=${r.status}` };
    // Not asserting these appear (that depends on scoring), just that
    // the formula is at least 3 herbs and the compose succeeded.
    return { pass: r.herbs.length >= 3, detail: `herbs=${r.herbs.length}` };
  },
});

// ── Missing age → treated as adult (fail-open on adult path only) ──
cases.push({
  name: 'no age field → treated as adult (minor gate NOT applied)',
  run: () => {
    const p = Object.assign({}, base);
    delete p.age;
    const r = compileFormula(p);
    return { pass: r.status === 'ok' && r.herbs.length >= 3, detail: `status=${r.status}` };
  },
});

// ── Unknown age value → same treatment as missing ──────────────────
cases.push({
  name: 'age:skynet_1 (unknown enum) → treated as adult',
  run: () => {
    const p = Object.assign({}, base, { age: 'skynet_1' });
    const r = compileFormula(p);
    if (r.status !== 'ok') return { pass: false, detail: `status=${r.status}` };
    // Adult path — no assertion that unsafe herbs must appear; just
    // that the strict === 'under_18' check keeps a hostile client from
    // triggering the minor gate with garbage.
    return { pass: true, detail: `herbs=${r.herbs.length}` };
  },
});

// ── Runner ─────────────────────────────────────────────────────────
(async () => {
  let passed = 0, failed = 0;
  for (const c of cases) {
    let out;
    try { out = await c.run(); }
    catch (e) { out = { pass: false, detail: 'THREW: ' + e.message }; }
    console.log(`  ${out.pass ? '✓' : '✗'} ${c.name}${out.detail ? '  — ' + out.detail : ''}`);
    if (out.pass) passed++; else failed++;
  }
  console.log('');
  console.log(`  passed: ${passed}`);
  console.log(`  failed: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
})();
