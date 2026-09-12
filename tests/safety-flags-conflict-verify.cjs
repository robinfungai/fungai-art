// tests/safety-flags-conflict-verify.cjs
//
// AUDIT_FIX (Finding #8): "none" is mutually exclusive with every
// other safety flag. Pre-fix, a malformed/hostile client that sent
// avoid:["none", "pregnancy"] passed validateAndNormalizeAvoid
// (because both are known flags) and then hit safetyFilter, which
// short-circuits on .includes("none") and DISABLES all filtering.
// Net effect: the pregnancy filter was silently dropped and a
// pregnant user could have received uterine stimulants.
//
// These tests lock in the fix — every ["none", <other>] combination
// is now rejected upstream with SAFETY_FLAGS_CONFLICT before the
// picker ever runs.
//
//   node tests/safety-flags-conflict-verify.cjs

const { validateAndNormalizeAvoid } = require('../src/server/formula-engine/safety');
const { compileFormula } = require('../src/server/formula-engine');

const base = {
  intention: 'stress', intentions: ['stress'],
  pattern: 'mixed', patternSub: 'sighing',
  time: 'evening', stress: 'push', duration: 'weeks',
  age: '25_40', sleep: 'restorative_6plus',
  notes: '', _gatedOptIn: false, _ageConfirmed: true,
};

const cases = [];

// ── validateAndNormalizeAvoid contract ─────────────────────────────
function expectReject(name, avoid, expectedCode) {
  cases.push({
    name,
    run: () => {
      try {
        validateAndNormalizeAvoid(avoid);
        return { pass: false, detail: 'did not throw' };
      } catch (e) {
        return {
          pass: e && e.code === expectedCode,
          detail: `code=${e && e.code || 'no-code'}`,
        };
      }
    },
  });
}

function expectAccept(name, avoid, expected) {
  cases.push({
    name,
    run: () => {
      try {
        const out = validateAndNormalizeAvoid(avoid);
        const match = JSON.stringify(out) === JSON.stringify(expected);
        return { pass: match, detail: `got=${JSON.stringify(out)}` };
      } catch (e) {
        return { pass: false, detail: `threw: ${e && e.code || e.message}` };
      }
    },
  });
}

// The specific adversarial combinations the audit named
expectReject('["none", "pregnancy"] rejected',      ['none', 'pregnancy'],   'SAFETY_FLAGS_CONFLICT');
expectReject('["pregnancy", "none"] rejected',      ['pregnancy', 'none'],   'SAFETY_FLAGS_CONFLICT');
expectReject('["none", "psych_meds"] rejected',     ['none', 'psych_meds'],  'SAFETY_FLAGS_CONFLICT');
expectReject('["none", "cardio_meds"] rejected',    ['none', 'cardio_meds'], 'SAFETY_FLAGS_CONFLICT');
expectReject('["none", "sedatives"] rejected',      ['none', 'sedatives'],   'SAFETY_FLAGS_CONFLICT');
expectReject('["cardio_meds", "none"] rejected',    ['cardio_meds', 'none'], 'SAFETY_FLAGS_CONFLICT');
expectReject('multiple flags + "none" rejected',    ['none', 'pregnancy', 'sedatives'], 'SAFETY_FLAGS_CONFLICT');

// Duplicate "none" is still a single conceptual entry — accept
// (cleaned array will be ['none','none'] but that's not a conflict
// with another flag; this is not adversarial and shouldn't error).
// EDIT: actually the cleaned length > 1 rule will trip on ["none","none"] too.
// That's fine — treat as a client shape bug, reject with same code.
expectReject('["none", "none"] rejected as conflict', ['none', 'none'], 'SAFETY_FLAGS_CONFLICT');

// Legitimate shapes still accepted
expectAccept('["none"] accepted (sole entry)',            ['none'],                       ['none']);
expectAccept('["pregnancy"] accepted',                    ['pregnancy'],                  ['pregnancy']);
expectAccept('["pregnancy","psych_meds"] accepted',       ['pregnancy', 'psych_meds'],    ['pregnancy', 'psych_meds']);
expectAccept('["cardio_meds","sedatives","thyroid"] ok',  ['cardio_meds','sedatives','thyroid'], ['cardio_meds','sedatives','thyroid']);

// Unknown flag mixed with none — the unknown gets stripped, but the
// remaining ["none"] is a valid sole entry. Also expressly test that
// an unknown flag alone leaves the empty-after-cleaning path.
expectAccept('["none","bogus_flag"] → ["none"] ok',       ['none', 'bogus_flag'],         ['none']);
expectReject('["bogus_only"] rejected (nothing valid)',   ['bogus_only'],                 'SAFETY_QUESTION_NOT_ANSWERED');

// ── End-to-end compileFormula path ─────────────────────────────────
cases.push({
  name: 'compileFormula rejects ["none","pregnancy"] with SAFETY_FLAGS_CONFLICT',
  run: () => {
    const r = compileFormula(Object.assign({}, base, { avoid: ['none', 'pregnancy'] }));
    return {
      pass: r.status === 'rejected' && r.code === 'SAFETY_FLAGS_CONFLICT',
      detail: `status=${r.status} code=${r.code}`,
    };
  },
});

cases.push({
  name: 'compileFormula rejects ["none","psych_meds"] with SAFETY_FLAGS_CONFLICT',
  run: () => {
    const r = compileFormula(Object.assign({}, base, { avoid: ['none', 'psych_meds'] }));
    return {
      pass: r.status === 'rejected' && r.code === 'SAFETY_FLAGS_CONFLICT',
      detail: `status=${r.status} code=${r.code}`,
    };
  },
});

cases.push({
  name: 'compileFormula still accepts ["none"] alone',
  run: () => {
    const r = compileFormula(Object.assign({}, base, { avoid: ['none'] }));
    return { pass: r.status === 'ok', detail: `status=${r.status}` };
  },
});

cases.push({
  name: 'compileFormula still accepts ["pregnancy","psych_meds"]',
  run: () => {
    const r = compileFormula(Object.assign({}, base, { avoid: ['pregnancy', 'psych_meds'] }));
    return { pass: r.status === 'ok', detail: `status=${r.status}` };
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
