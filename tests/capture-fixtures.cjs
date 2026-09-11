// tests/capture-fixtures.cjs
//
// Runs the 20 fixture profiles through the frozen client-engine
// snapshot and writes each profile's expected output to
// tests/fixtures/expected/*.json.
//
//   node tests/capture-fixtures.cjs           — refuses to overwrite existing
//   node tests/capture-fixtures.cjs --overwrite — regenerates the baseline
//
// The baseline is the reference the Step 1+ server engine gets
// compared against. Do NOT regenerate casually; see tests/README.md.

const fs = require('fs');
const path = require('path');

const overwrite = process.argv.includes('--overwrite');

const { runFormula } = require('./engine-snapshot.cjs');
const PROFILES = require('./fixtures/profiles.cjs');

const outDir = path.join(__dirname, 'fixtures', 'expected');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

let written = 0, skipped = 0, errored = 0;

for (const p of PROFILES) {
  const outFile = path.join(outDir, p.id + '.json');
  if (fs.existsSync(outFile) && !overwrite) {
    skipped++;
    continue;
  }
  try {
    const output = runFormula(p.input);
    const record = {
      profileId:   p.id,
      description: p.description,
      input:       p.input,
      output:      output,
    };
    fs.writeFileSync(outFile, JSON.stringify(record, null, 2));
    written++;
    process.stdout.write(
      '  ✓ ' + p.id.padEnd(38) +
      ' size=' + String(output.formulaSize).padStart(2) +
      ' target=' + String(output.targetHerbCount).padStart(2) +
      ' filtered=' + String(output.filteredOut.removed).padStart(3) +
      ' herbs=' + output.herbs.slice(0, 3).map(h => h.name).join(' · ') +
      (output.herbs.length > 3 ? ' …' : '') +
      '\n'
    );
  } catch (e) {
    errored++;
    console.error('  ✗ ' + p.id + ' — ' + e.message);
  }
}

console.log('');
console.log('written : ' + written);
console.log('skipped : ' + skipped + (skipped ? '  (re-run with --overwrite to regenerate)' : ''));
console.log('errored : ' + errored);
process.exit(errored ? 1 : 0);
