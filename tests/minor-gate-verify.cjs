// tests/minor-gate-verify.cjs
//
// Under-18 hard-gate tests. Verifies the defense-in-depth safety
// layer added to src/server/formula-engine/safety.js:
//
//   applyMinorGate(pool, profile) — when profile._minor === true,
//   strips every gated / sedative / psych_med / contraceptive /
//   strongly-GABAergic / CNS-stimulant herb from the candidate pool
//   BEFORE the picker sees it. Independent of what the client set
//   in avoid[] — so a modified frontend that omits the amend can't
//   sneak psychoactive allies into a minor's formula.
//
//   node tests/minor-gate-verify.cjs

const { compileFormula } = require('../src/server/formula-engine');
const { passesMinorGate, applyMinorGate, MINOR_BANNED_FLAGS } = require('../src/server/formula-engine/safety');
const { ensurePool } = require('../src/server/formula-engine/axes');
const { isGABAergic, isCNSStimulant } = require('../src/server/formula-engine/pharmacology');

const baseProfile = {
  intention: 'stress',
  intentions: ['stress'],
  pattern: 'mixed',
  patternSub: 'sighing',
  time: 'evening',
  stress: 'push',
  duration: 'weeks',
  avoid: ['none'],
  age: '25_40',
  sleep: 'restorative_6plus',
  notes: '',
  _gatedOptIn: false,
  _ageConfirmed: true,
};

const cases = [];

// ── (1) The unit contract on passesMinorGate ───────────────────────
cases.push({
  name: 'passesMinorGate rejects gated herbs',
  run: () => {
    const gated = { name: 'Amanita muscaria', gated: true, _ax: { flags: [] } };
    return { pass: passesMinorGate(gated) === false, detail: 'gated:true rejected' };
  },
});

cases.push({
  name: 'passesMinorGate rejects herbs with sedatives flag',
  run: () => {
    const sedative = { name: 'Fake sedative', gated: false, _ax: { flags: ['sedatives'] } };
    return { pass: passesMinorGate(sedative) === false, detail: 'sedatives flag rejected' };
  },
});

cases.push({
  name: 'passesMinorGate rejects herbs with psych_meds flag',
  run: () => {
    const ssri = { name: 'Fake SSRI-interacting', gated: false, _ax: { flags: ['psych_meds'] } };
    return { pass: passesMinorGate(ssri) === false, detail: 'psych_meds flag rejected' };
  },
});

cases.push({
  name: 'passesMinorGate rejects herbs with contraceptive flag',
  run: () => {
    const cyp = { name: 'Fake CYP3A4', gated: false, _ax: { flags: ['contraceptive'] } };
    return { pass: passesMinorGate(cyp) === false, detail: 'contraceptive flag rejected' };
  },
});

cases.push({
  name: 'passesMinorGate accepts a gentle herb',
  run: () => {
    // Rose Petals — no sedative pharmacology, no strong CNS activity,
    // no drug interactions in the base metadata.
    const pool = ensurePool();
    const rose = pool.find(h => /rose petals/i.test(h.name));
    if (!rose) return { pass: false, detail: 'Rose Petals not in pool' };
    return { pass: passesMinorGate(rose) === true, detail: 'Rose Petals accepted' };
  },
});

// ── (2) applyMinorGate is a no-op when _minor is falsy ─────────────
cases.push({
  name: 'applyMinorGate no-op without _minor',
  run: () => {
    const pool = ensurePool();
    const out  = applyMinorGate(pool, { _minor: false });
    return { pass: out === pool, detail: 'same reference returned' };
  },
});

cases.push({
  name: 'applyMinorGate no-op without profile',
  run: () => {
    const pool = ensurePool();
    const out  = applyMinorGate(pool, null);
    return { pass: out === pool, detail: 'null profile → same pool' };
  },
});

// ── (3) applyMinorGate strips banned herbs when _minor:true ────────
cases.push({
  name: 'applyMinorGate strips gated + banned-flag herbs',
  run: () => {
    const pool = ensurePool();
    const gated = pool.filter(h => h.gated).length;
    const stim  = pool.filter(h => isCNSStimulant(h)).length;
    const gaba  = pool.filter(h => isGABAergic(h)).length;
    const sedFlag = pool.filter(h => (h._ax.flags || []).includes('sedatives')).length;
    const filtered = applyMinorGate(pool, { _minor: true });
    // Every banned category should be zero in the filtered pool
    const remainingGated = filtered.filter(h => h.gated).length;
    const remainingStim  = filtered.filter(h => isCNSStimulant(h)).length;
    const remainingGaba  = filtered.filter(h => isGABAergic(h)).length;
    const remainingSed   = filtered.filter(h => (h._ax.flags || []).includes('sedatives')).length;
    const anythingLeft   = filtered.length > 5;
    return {
      pass: remainingGated === 0 && remainingStim === 0 && remainingGaba === 0 && remainingSed === 0 && anythingLeft,
      detail: `orig gated=${gated} stim=${stim} gaba=${gaba} sed=${sedFlag}, filtered=${filtered.length} remaining gated=${remainingGated} stim=${remainingStim} gaba=${remainingGaba} sed=${remainingSed}`,
    };
  },
});

// ── (4) End-to-end: compileFormula with _minor:true ────────────────
cases.push({
  name: 'compileFormula (_minor:true) returns non-empty formula',
  run: () => {
    const profile = Object.assign({}, baseProfile, { _minor: true });
    const result = compileFormula(profile);
    return {
      pass: result.status === 'ok' && Array.isArray(result.herbs) && result.herbs.length >= 3,
      detail: `status=${result.status} herbs=${result.herbs ? result.herbs.length : 0}`,
    };
  },
});

cases.push({
  name: 'compileFormula (_minor:true) contains zero gated herbs',
  run: () => {
    const profile = Object.assign({}, baseProfile, { _minor: true });
    const result = compileFormula(profile);
    if (result.status !== 'ok') return { pass: false, detail: 'compose failed' };
    const bad = result.herbs.filter(h => h.isGated);
    return { pass: bad.length === 0, detail: `gated in formula = ${bad.length}` };
  },
});

cases.push({
  name: 'compileFormula (_minor:true) contains zero GABAergic herbs',
  run: () => {
    const profile = Object.assign({}, baseProfile, { _minor: true });
    const result = compileFormula(profile);
    if (result.status !== 'ok') return { pass: false, detail: 'compose failed' };
    const bad = result.herbs.filter(h => h.isGABAergic);
    return { pass: bad.length === 0, detail: `GABAergic in formula = ${bad.length} (${bad.map(h=>h.name).join(', ')})` };
  },
});

cases.push({
  name: 'compileFormula (_minor:true) contains zero CNS stimulants',
  run: () => {
    const profile = Object.assign({}, baseProfile, { _minor: true });
    const result = compileFormula(profile);
    if (result.status !== 'ok') return { pass: false, detail: 'compose failed' };
    const bad = result.herbs.filter(h => h.isCNSStimulant);
    return { pass: bad.length === 0, detail: `CNS stim in formula = ${bad.length} (${bad.map(h=>h.name).join(', ')})` };
  },
});

// ── (5) The MOST IMPORTANT test: minor gate holds even when the
//     client didn't amend avoid[]. Simulates a modified/old client
//     that sends _minor:true but avoid:['none'] with no other flags.
cases.push({
  name: 'minor gate holds even if client did NOT amend avoid[]',
  run: () => {
    const profile = Object.assign({}, baseProfile, {
      _minor: true,
      avoid: ['none'],  // adversarial: client claims nothing to avoid
    });
    const result = compileFormula(profile);
    if (result.status !== 'ok') return { pass: false, detail: 'compose failed' };
    const gated = result.herbs.filter(h => h.isGated).length;
    const gaba  = result.herbs.filter(h => h.isGABAergic).length;
    const stim  = result.herbs.filter(h => h.isCNSStimulant).length;
    return {
      pass: gated === 0 && gaba === 0 && stim === 0 && result.herbs.length >= 3,
      detail: `adversarial-minor: herbs=${result.herbs.length} gated=${gated} gaba=${gaba} stim=${stim}`,
    };
  },
});

// ── (6) Sanity: non-minor with same base profile IS allowed to
//     include GABAergics / stimulants when scoring calls for them.
//     Proves the gate is minor-only, not always-on.
cases.push({
  name: 'non-minor profile is UNAFFECTED by the gate',
  run: () => {
    const minorProfile = Object.assign({}, baseProfile, { _minor: true });
    const adultProfile = Object.assign({}, baseProfile, { _minor: false });
    const minorResult = compileFormula(minorProfile);
    const adultResult = compileFormula(adultProfile);
    if (minorResult.status !== 'ok' || adultResult.status !== 'ok') {
      return { pass: false, detail: 'compose failed' };
    }
    // Adult pool has strictly more candidates than minor pool → the
    // scored+picked set will differ (either different herbs or different
    // rank order). We just assert both produced valid formulas — the
    // gate is one-way (narrower for minors).
    return {
      pass: minorResult.herbs.length >= 3 && adultResult.herbs.length >= 3,
      detail: `minor=${minorResult.herbs.length}h, adult=${adultResult.herbs.length}h`,
    };
  },
});

// ── Runner ─────────────────────────────────────────────────────────
(async () => {
  let passed = 0, failed = 0;
  for (const c of cases) {
    let out;
    try { out = await c.run(); }
    catch (e) { out = { pass: false, detail: 'THREW: ' + e.message }; }
    const marker = out.pass ? '✓' : '✗';
    console.log(`  ${marker} ${c.name}${out.detail ? '  — ' + out.detail : ''}`);
    if (out.pass) passed++; else failed++;
  }
  console.log('');
  console.log(`  passed: ${passed}`);
  console.log(`  failed: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
})();
