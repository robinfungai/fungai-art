// tests/compare-fixtures.cjs
//
// Runs the 20 fixture profiles through the NEW server-side Formula
// Engine (src/server/formula-engine) and diffs the output against
// tests/fixtures/expected/*.json (the Step 0 baseline).
//
//   node tests/compare-fixtures.cjs
//
// Every fixture ends in one of three categories:
//
//   PASS
//     — server engine produced byte-equivalent output to the client
//       snapshot. Behaviour preserved.
//
//   SECURITY_FIX  (expected divergence)
//     — server engine intentionally returns a different result
//       because the old client behaviour was unsafe. Only fixture
//       20 is on this list today (client accepted avoid:[] and
//       composed from the unfiltered pool; server rejects with
//       SAFETY_QUESTION_NOT_ANSWERED).
//
//   UNEXPECTED
//     — anything else. This should be zero after Step 1 lands.

const fs = require('fs');
const path = require('path');

const PROFILES = require('./fixtures/profiles.cjs');
const { compileFormula } = require('../src/server/formula-engine');

// Profiles where a divergence from the Step 0 baseline is intentional.
// Each entry lists the fixture id + the specific code we expect the
// server engine to return.
const SECURITY_FIX_EXPECTATIONS = {
  '20-adversarial-empty-avoid': {
    expectedCode: 'SAFETY_QUESTION_NOT_ANSWERED',
    rationale: 'Client accepted avoid:[] and composed from the unfiltered pool; server now requires an explicit safety-question answer.',
  },
};

// Profiles whose output changed because of a DELIBERATE methodology
// change after the Step 0 baseline. The Step 0 files stay frozen; the
// new output is pinned here instead, so the fixture still regression-
// locks the engine rather than getting a free pass.
const METHODOLOGY_CHANGE_EXPECTATIONS = {
  '18-pro-fields-carried': {
    herbs: '271:Oatstraw@21|103:Ashwagandha@19|300:Red Dates@17|279:Schisandra (Five-Flavour Fruit)@15|413:Longan@14|316:Fu Ling@14',
    rationale: 'Engine 2.1: nervous (wired+tired), energy_curve and the hard_onset sleep pattern now score herbs.',
  },
};

const expectedDir = path.join(__dirname, 'fixtures', 'expected');

// The Step 0 baseline was captured against a 198-herb catalogue. Every
// herb added since can only ever RAISE the "filtered out by safety" count
// for a profile with safety flags — that is the filter working, not a
// regression. So the count is allowed to drift by at most the number of
// herbs added, while the composed formula itself must still match exactly.
const BASELINE_POOL_SIZE = 198;
// Counted on the raw catalogue, not ensurePool() — the pool already has
// the legally-restricted entries stripped, so it is smaller than 198.
const currentPoolSize = (() => {
  try { return require('../src/server/herb-data').getAllHerbs().length; }
  catch (_) { return BASELINE_POOL_SIZE; }
})();
const CATALOGUE_GROWTH = Math.max(0, currentPoolSize - BASELINE_POOL_SIZE);

function diffOutputs(expected, actual) {
  const diffs = [];
  if (expected.formulaSize !== actual.formulaSize) {
    diffs.push('formulaSize: ' + expected.formulaSize + ' → ' + actual.formulaSize);
  }
  if (expected.targetHerbCount !== actual.targetHerbCount) {
    diffs.push('targetHerbCount: ' + expected.targetHerbCount + ' → ' + actual.targetHerbCount);
  }
  const removedDrift = actual.filteredOut.removed - expected.filteredOut.removed;
  if (removedDrift < 0 || removedDrift > CATALOGUE_GROWTH) {
    diffs.push('filteredOut.removed: ' + expected.filteredOut.removed + ' → ' + actual.filteredOut.removed +
      ' (catalogue grew by ' + CATALOGUE_GROWTH + '; drift beyond that is a real change)');
  }
  if (expected.percentageTotal !== actual.percentageTotal) {
    diffs.push('percentageTotal: ' + expected.percentageTotal + ' → ' + actual.percentageTotal);
  }
  const eHerbs = (expected.herbs || []).map(h => h.id + ':' + h.name + '@' + h.percentage);
  const aHerbs = (actual.herbs   || []).map(h => h.id + ':' + h.name + '@' + h.percentage);
  if (eHerbs.join('|') !== aHerbs.join('|')) {
    diffs.push('herbs mismatch:\n      expected: ' + eHerbs.join(', ') + '\n      actual  : ' + aHerbs.join(', '));
  }
  return diffs;
}

let passed = 0, securityFix = 0, methodologyChange = 0, unexpected = 0, missing = 0;
const failures = [];

for (const p of PROFILES) {
  const file = path.join(expectedDir, p.id + '.json');
  if (!fs.existsSync(file)) {
    missing++;
    console.log('  ? ' + p.id + ' — expected file missing (run capture-fixtures.cjs first)');
    continue;
  }
  const expected = JSON.parse(fs.readFileSync(file, 'utf8')).output;
  const actual = compileFormula(p.input);
  const secFix = SECURITY_FIX_EXPECTATIONS[p.id];

  if (actual.status === 'rejected') {
    if (secFix && actual.code === secFix.expectedCode) {
      securityFix++;
      process.stdout.write('  ⚠ ' + p.id + '  SECURITY_FIX (' + actual.code + ')\n');
      process.stdout.write('      rationale: ' + secFix.rationale + '\n');
    } else {
      unexpected++;
      failures.push({ id: p.id, kind: 'unexpected-rejection', code: actual.code, reason: actual.reason });
      process.stdout.write('  ✗ ' + p.id + '  UNEXPECTED rejection: ' + actual.code + '\n');
      process.stdout.write('      reason: ' + actual.reason + '\n');
    }
    continue;
  }

  // status === 'ok' from here
  if (secFix) {
    unexpected++;
    failures.push({ id: p.id, kind: 'security-fix-expected-but-passed', expectedCode: secFix.expectedCode });
    process.stdout.write('  ✗ ' + p.id + '  expected SECURITY_FIX (' + secFix.expectedCode + ') but engine produced a formula\n');
    continue;
  }

  const change = METHODOLOGY_CHANGE_EXPECTATIONS[p.id];
  if (change) {
    const got = (actual.herbs || []).map(h => h.id + ':' + h.name + '@' + h.percentage).join('|');
    if (got === change.herbs) {
      methodologyChange++;
      process.stdout.write('  ◇ ' + p.id + '  METHODOLOGY_CHANGE (pinned)\n');
      process.stdout.write('      rationale: ' + change.rationale + '\n');
    } else {
      unexpected++;
      failures.push({ id: p.id, kind: 'methodology-pin-diff' });
      process.stdout.write('  ✗ ' + p.id + '  UNEXPECTED diff against pinned methodology output:\n');
      process.stdout.write('      pinned: ' + change.herbs + '\n      actual: ' + got + '\n');
    }
    continue;
  }

  const diffs = diffOutputs(expected, actual);
  if (diffs.length === 0) {
    passed++;
    process.stdout.write('  ✓ ' + p.id + '\n');
  } else {
    unexpected++;
    failures.push({ id: p.id, kind: 'diff', diffs });
    process.stdout.write('  ✗ ' + p.id + '  UNEXPECTED diff:\n');
    for (const d of diffs) process.stdout.write('      ' + d + '\n');
  }
}

console.log('');
console.log('PASS              : ' + passed);
console.log('SECURITY_FIX      : ' + securityFix);
console.log('METHODOLOGY_CHANGE: ' + methodologyChange);
console.log('UNEXPECTED        : ' + unexpected);
console.log('missing baseline  : ' + missing);

if (unexpected > 0 || missing > 0) process.exit(1);
