// tests/client-server-synergy-consistency-verify.cjs
//
// Round 2 · Item #16. The server is authoritative for herb-to-herb
// synergy + caution intelligence. The client MUST NOT independently
// recompute proprietary interaction logic from raw herb metadata —
// it renders `serverFormula.synergies` / `serverFormula.cautions`
// directly.
//
// This locks in commit 584b13b: the paint path in both quiz clients
// no longer calls checkFormulaPairs(enrichedHerbs). If someone
// re-introduces the client recomputation, this test fails.
//
//   node tests/client-server-synergy-consistency-verify.cjs

const fs   = require('fs');
const path = require('path');

const BASIC = fs.readFileSync(path.join(__dirname, '..', 'public', 'find-your-formula', 'index.html'), 'utf8');
const PRO   = fs.readFileSync(path.join(__dirname, '..', 'public', 'find-your-formula-pro', 'index.html'), 'utf8');

// Extract the _fyfPaintServerReveal function body (the paint path).
// Brace-counting would mis-parse the HTML/CSS strings inside the fn;
// simpler: slice up to the next top-level `function ` / `async function `
// declaration in the file. These clients are ES5-style top-level fns.
function extractPaintFn(src, label) {
  const start = src.indexOf('function _fyfPaintServerReveal');
  if (start < 0) throw new Error(label + ': _fyfPaintServerReveal not found');
  const rest = src.slice(start + 1);
  const nextFnRe = /\n(function |async function )/;
  const m = rest.match(nextFnRe);
  const end = m ? start + 1 + m.index : src.length;
  return src.slice(start, end);
}

const paintBasic = extractPaintFn(BASIC, 'Basic');
const paintPro   = extractPaintFn(PRO, 'Pro');

const cases = [];

function assertPaint(label, paintBody) {
  cases.push({
    name: label + ': paint path reads serverFormula.synergies (authoritative)',
    run: () => ({ pass: paintBody.includes('serverFormula.synergies'), detail: '' }),
  });
  cases.push({
    name: label + ': paint path reads serverFormula.cautions (authoritative)',
    run: () => ({ pass: paintBody.includes('serverFormula.cautions'), detail: '' }),
  });
  // Strip line comments before checking for calls — the paint fn has
  // explanatory comments naming the deprecated symbols; only actual
  // code references count as violations.
  const codeOnly = paintBody
    .split('\n')
    .map(line => {
      const commentIdx = line.indexOf('//');
      return commentIdx >= 0 ? line.slice(0, commentIdx) : line;
    })
    .join('\n');
  cases.push({
    name: label + ': paint path does NOT call checkFormulaPairs()',
    run: () => ({
      pass: !/checkFormulaPairs\s*\(/.test(codeOnly),
      detail: 'client recomputation of synergies is forbidden — server is authoritative',
    }),
  });
  cases.push({
    name: label + ': paint path does NOT read h.herb_to_herb_synergy',
    run: () => ({
      pass: !/\.herb_to_herb_synergy\b/.test(codeOnly),
      detail: 'raw synergy metadata should not reach the paint path',
    }),
  });
  cases.push({
    name: label + ': paint path does NOT read h.herb_to_herb_caution',
    run: () => ({
      pass: !/\.herb_to_herb_caution\b/.test(codeOnly),
      detail: 'raw caution metadata should not reach the paint path',
    }),
  });
}
assertPaint('Basic', paintBasic);
assertPaint('Pro',   paintPro);

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
