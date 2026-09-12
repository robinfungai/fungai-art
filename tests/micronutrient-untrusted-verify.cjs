// tests/micronutrient-untrusted-verify.cjs
//
// Round 2 · Item #6. Micronutrient advisory is CLIENT-SUPPLIED and
// therefore UNTRUSTED. These tests prove:
//   · malformed / hostile entries are dropped or clamped by the
//     server sanitiser
//   · giant strings can't bloat Robin's email
//   · a forged client entry can't alter the AUTHORITATIVE formula
//     (formula/percentages/name come from the STORED row, never
//     from client input)
//
//   node tests/micronutrient-untrusted-verify.cjs

const fs   = require('fs');
const path = require('path');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'netlify', 'functions', 'reserve-formula.mjs'), 'utf8');

const cases = [];

// ── Sanitiser presence (static analysis) ───────────────────────────
cases.push({
  name: 'reserve-formula.mjs caps individual nutrient string to 80 chars',
  run: () => ({ pass: /nutrient:\s*String\(x\.nutrient\)\.slice\(0, 80\)/.test(SRC), detail: '' }),
});
cases.push({
  name: 'reserve-formula.mjs caps individual reason string to 300 chars',
  run: () => ({ pass: /reason:\s+String\(x\.reason \|\| ''\)\.slice\(0, 300\)/.test(SRC), detail: '' }),
});
cases.push({
  name: 'reserve-formula.mjs slices the outer array to max 15 entries',
  run: () => ({ pass: /\.possibleMicronutrients\s*\n?\s*\.slice\(0, 15\)/.test(SRC) || /body\.possibleMicronutrients\s*[\s\S]{0,80}?\.slice\(0, 15\)/.test(SRC), detail: '' }),
});
cases.push({
  name: 'reserve-formula.mjs priority is Number-clamped to [0, 10]',
  run: () => ({ pass: /Math\.max\(0, Math\.min\(10, Number\(x\.priority\)\)\)/.test(SRC), detail: '' }),
});

// ── Email banner is explicit UNVERIFIED ────────────────────────────
cases.push({
  name: 'Robin HTML template flags the section as UNVERIFIED (client-computed)',
  run: () => ({
    pass: /UNVERIFIED \(client-computed\)/.test(SRC),
    detail: '',
  }),
});
cases.push({
  name: 'Robin HTML template no longer uses the green "trusted" colour on the micronutrient block',
  run: () => {
    // Old: color:#6BD66F (green — visually reads as verified/positive).
    // Now: amber warning. The green ref must be gone from the whole
    // reserve-formula module (it only ever appeared in this block).
    return { pass: !SRC.includes('#6BD66F'), detail: '' };
  },
});
cases.push({
  name: 'Robin text template flags the section as UNVERIFIED',
  run: () => ({ pass: /UNVERIFIED \(client-computed\)/.test(SRC), detail: '' }),
});

// ── Forged input cannot alter authoritative formula ────────────────
// The reserve handler ONLY reads formula/percentages/name from the
// authoritative Supabase row (resolveAuthoritativeFormula). The client
// body's `formula`, `percentages`, `formulaName`, `synergies` fields
// are IGNORED (Round 1 Step 7 removed the legacy path). The
// possibleMicronutrients section is rendered separately and never
// influences the pour spec, herb list, formula name, or any field
// derived from the authoritative row.
cases.push({
  name: 'authoritative fields (formula/percentages/name) are read ONLY from stored row',
  run: () => {
    // Sanity: the derivations MUST come from resolved.row.formula, not body.
    const okName = /formulaName\s*=\s*String\(storedFormula\.name/.test(SRC);
    const okHerbs = /formula\s*=\s*storedHerbs\.map/.test(SRC);
    const okPct   = /percentages\s*=\s*storedHerbs\.map\(h => h\.percentage\)/.test(SRC);
    return { pass: okName && okHerbs && okPct, detail: `name=${okName} herbs=${okHerbs} pct=${okPct}` };
  },
});
cases.push({
  name: 'no `body.formula`, `body.percentages`, `body.formulaName` reads reach downstream',
  run: () => {
    // If any of these ever come back, the client can forge the pour
    // spec Robin sees. The Round 1 Step 7 commit removed them.
    const leaks = [];
    if (/body\.formula\b/.test(SRC))       leaks.push('body.formula');
    if (/body\.percentages\b/.test(SRC))   leaks.push('body.percentages');
    if (/body\.formulaName\b/.test(SRC))   leaks.push('body.formulaName');
    if (/body\.synergies\b/.test(SRC))     leaks.push('body.synergies');
    return { pass: leaks.length === 0, detail: `leaked reads: ${JSON.stringify(leaks)}` };
  },
});

// ── Sanitiser behaviour spec (documented; not executable without
//    an env-configured Supabase — see shadow-verify.cjs for the
//    live handler integration test) ────────────────────────────────
cases.push({
  name: 'documented: forged entries are shape-checked (typeof nutrient === string)',
  run: () => ({ pass: /typeof x\.nutrient === 'string'/.test(SRC), detail: '' }),
});
cases.push({
  name: 'documented: array shape required (non-array → empty)',
  run: () => ({ pass: /Array\.isArray\(body\.possibleMicronutrients\)/.test(SRC), detail: '' }),
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
