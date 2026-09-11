// tests/compare-fixtures.cjs
//
// Runs the 20 fixture profiles through a NEW engine implementation
// and diffs the output against tests/fixtures/expected/*.json.
//
// This is the regression gate for Step 1+ of the P0 migration.
//
//   node tests/compare-fixtures.cjs
//
// STEP 0 STATE: this script compares the frozen client-engine
// snapshot AGAINST ITSELF, so all 20 profiles should pass. That
// proves the plumbing works.
//
// STEP 1 will change `runNewFormula` below to import the server
// engine (src/server/formula-engine/index.js) instead of the
// snapshot. That's the byte-equivalence proof of the migration.

const fs = require('fs');
const path = require('path');

const PROFILES = require('./fixtures/profiles.cjs');

// ── The engine under test ────────────────────────────────────
// Step 0 baseline: snapshot vs snapshot (should be a no-op diff).
// Step 1+: swap this import for the new server engine.
const { runFormula: runNewFormula } = require('./engine-snapshot.cjs');

const expectedDir = path.join(__dirname, 'fixtures', 'expected');

function diffOutputs(expected, actual) {
  const diffs = [];
  // Compare the deterministic parts of the output. capturedAt +
  // engineVersion are allowed to differ — everything else must match.
  if (expected.formulaSize !== actual.formulaSize) {
    diffs.push('formulaSize: ' + expected.formulaSize + ' → ' + actual.formulaSize);
  }
  if (expected.targetHerbCount !== actual.targetHerbCount) {
    diffs.push('targetHerbCount: ' + expected.targetHerbCount + ' → ' + actual.targetHerbCount);
  }
  if (expected.filteredOut.removed !== actual.filteredOut.removed) {
    diffs.push('filteredOut.removed: ' + expected.filteredOut.removed + ' → ' + actual.filteredOut.removed);
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

let passed = 0, failed = 0, missing = 0;
const failures = [];

for (const p of PROFILES) {
  const file = path.join(expectedDir, p.id + '.json');
  if (!fs.existsSync(file)) {
    missing++;
    console.log('  ? ' + p.id + ' — expected file missing (run capture-fixtures.cjs first)');
    continue;
  }
  const expected = JSON.parse(fs.readFileSync(file, 'utf8')).output;
  const actual = runNewFormula(p.input);
  const diffs = diffOutputs(expected, actual);
  if (diffs.length === 0) {
    passed++;
    process.stdout.write('  ✓ ' + p.id + '\n');
  } else {
    failed++;
    failures.push({ id: p.id, diffs });
    process.stdout.write('  ✗ ' + p.id + '\n');
    for (const d of diffs) process.stdout.write('      ' + d + '\n');
  }
}

console.log('');
console.log('passed  : ' + passed);
console.log('failed  : ' + failed);
console.log('missing : ' + missing);

if (failed > 0 || missing > 0) process.exit(1);
