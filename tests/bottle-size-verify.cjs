// tests/bottle-size-verify.cjs
//
// Round 2 · Item #5. Bottle size must come from a server-side allow-
// list; a hostile client cannot dictate the pour spec that lands in
// Robin's admin email.
//
//   node tests/bottle-size-verify.cjs

const path = require('path');
const { pathToFileURL } = require('node:url');

(async () => {
  const mod = await import(pathToFileURL(path.join(__dirname, '..', 'netlify', 'functions', 'reserve-formula.mjs')).href);
  const { ALLOWED_BOTTLE_SIZES, DEFAULT_BOTTLE_ML, normaliseBottleMl } = mod;

  const cases = [
    // Allowed sizes
    { in: 15,           want: 15,  name: '15  → 15  (allowed SKU)' },
    { in: 30,           want: 30,  name: '30  → 30  (allowed SKU)' },
    // Invalid → snap to default (30)
    { in: 0,            want: 30,  name: '0            → 30 (rejected)' },
    { in: -30,          want: 30,  name: '-30          → 30 (rejected)' },
    { in: -1,           want: 30,  name: '-1           → 30 (rejected)' },
    { in: 1.5,          want: 30,  name: '1.5          → 30 (non-integer rejected)' },
    { in: 29.9,         want: 30,  name: '29.9         → 30 (non-integer rejected)' },
    { in: 1000,         want: 30,  name: '1000         → 30 (not on allowlist)' },
    { in: 20,           want: 30,  name: '20           → 30 (not on allowlist, close)' },
    { in: '30',         want: 30,  name: '"30" string  → 30 (coerced then allowed)' },
    { in: '15',         want: 15,  name: '"15" string  → 15 (coerced then allowed)' },
    { in: '30ml',       want: 30,  name: '"30ml" str   → 30 (rejected, snap)' },
    { in: 'thirty',     want: 30,  name: '"thirty"     → 30 (rejected, snap)' },
    { in: NaN,          want: 30,  name: 'NaN          → 30 (rejected)' },
    { in: Infinity,     want: 30,  name: 'Infinity     → 30 (rejected)' },
    { in: -Infinity,    want: 30,  name: '-Infinity    → 30 (rejected)' },
    { in: null,         want: 30,  name: 'null         → 30 (default)' },
    { in: undefined,    want: 30,  name: 'undefined    → 30 (default, no value sent)' },
    { in: true,         want: 30,  name: 'true         → 30 (Number(true)=1 not on list)' },
    { in: false,        want: 30,  name: 'false        → 30 (Number(false)=0 not on list)' },
    { in: {},           want: 30,  name: '{}           → 30 (rejected)' },
    { in: [30],         want: 30,  name: '[30] array   → 30 (Number([30])=30, allowed)' },
    { in: '15\n\n',     want: 15,  name: '"15\\n\\n"      → 15 (coerces to 15)' },
    { in: '1e2',        want: 30,  name: '"1e2"        → 30 (Number(1e2)=100 not on list)' },
  ];

  // Constants exposed as expected
  const constOk =
    Array.isArray(ALLOWED_BOTTLE_SIZES) &&
    ALLOWED_BOTTLE_SIZES.includes(15) &&
    ALLOWED_BOTTLE_SIZES.includes(30) &&
    DEFAULT_BOTTLE_ML === 30;

  console.log(`  ${constOk ? '✓' : '✗'} exports ALLOWED_BOTTLE_SIZES=[15,30] and DEFAULT_BOTTLE_ML=30`);

  let passed = constOk ? 1 : 0;
  let failed = constOk ? 0 : 1;

  for (const c of cases) {
    const got = normaliseBottleMl(c.in);
    const pass = got === c.want;
    console.log(`  ${pass ? '✓' : '✗'} ${c.name}  — got=${got}`);
    if (pass) passed++; else failed++;
  }

  console.log('');
  console.log(`  passed: ${passed}`);
  console.log(`  failed: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
})();
