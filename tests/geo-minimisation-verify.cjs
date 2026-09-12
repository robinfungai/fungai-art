// tests/geo-minimisation-verify.cjs
//
// Round 2 · Item #2. GDPR minimisation regression: verify the
// reservation flow no longer collects, transmits, persists, emails,
// or echoes back precise geolocation.
//
// What this test locks in:
//   · Server-side reserve-formula.mjs captures ONLY `country` from
//     Netlify Edge headers. lat/lng/city/subdivision/timezone/IP are
//     not captured, not emailed, not returned to the client.
//   · Client-side archiveFormulaToAcademy writes NULL for every
//     origin_* Supabase column except origin_country (the Supabase
//     schema itself still has the columns — dropping them is a
//     separate migration).
//   · The old `x-nf-geo` full-payload capture is not re-introduced.
//
//   node tests/geo-minimisation-verify.cjs

const fs   = require('fs');
const path = require('path');

const RESERVE_SRC   = fs.readFileSync(path.join(__dirname, '..', 'netlify', 'functions', 'reserve-formula.mjs'), 'utf8');
const BASIC_CLIENT  = fs.readFileSync(path.join(__dirname, '..', 'public', 'find-your-formula', 'index.html'), 'utf8');
const PRO_CLIENT    = fs.readFileSync(path.join(__dirname, '..', 'public', 'find-your-formula-pro', 'index.html'), 'utf8');

const cases = [];

// ── Server side ────────────────────────────────────────────────────
cases.push({
  name: 'reserve-formula.mjs does NOT parse parsed.latitude from x-nf-geo',
  run: () => ({ pass: !RESERVE_SRC.includes('parsed.latitude'), detail: '' }),
});
cases.push({
  name: 'reserve-formula.mjs does NOT parse parsed.longitude from x-nf-geo',
  run: () => ({ pass: !RESERVE_SRC.includes('parsed.longitude'), detail: '' }),
});
cases.push({
  name: 'reserve-formula.mjs does NOT parse parsed.city from x-nf-geo',
  run: () => ({ pass: !RESERVE_SRC.includes('parsed.city'), detail: '' }),
});
cases.push({
  name: 'reserve-formula.mjs does NOT parse parsed.subdivision from x-nf-geo',
  run: () => ({ pass: !RESERVE_SRC.includes('parsed.subdivision'), detail: '' }),
});
cases.push({
  name: 'reserve-formula.mjs does NOT parse parsed.timezone from x-nf-geo',
  run: () => ({ pass: !RESERVE_SRC.includes('parsed.timezone'), detail: '' }),
});
cases.push({
  name: 'reserve-formula.mjs does NOT read x-nf-client-connection-ip for geo capture',
  run: () => ({
    // The rate-limiter still reads x-nf-client-connection-ip transiently
    // — that's fine; the assertion is only that the geo-capture block
    // no longer writes it into the geo object shipped downstream.
    pass: !/geo\.ip\s*=/.test(RESERVE_SRC),
    detail: '',
  }),
});
cases.push({
  name: 'reserve-formula.mjs geo object exposes ONLY country',
  run: () => {
    const match = RESERVE_SRC.match(/let geo\s*=\s*\{([^}]*)\}/);
    if (!match) return { pass: false, detail: 'no `let geo = {...}` declaration found' };
    const inner = match[1];
    // Should contain country: null and nothing else meaningful.
    const hasCountry = /country\s*:/.test(inner);
    const forbidden = ['city', 'subdivision', 'timezone', 'ip', 'latitude', 'longitude'];
    const leak = forbidden.filter(f => new RegExp('\\b' + f + '\\s*:').test(inner));
    return {
      pass: hasCountry && leak.length === 0,
      detail: `country=${hasCountry}, leaked=${JSON.stringify(leak)}`,
    };
  },
});

// ── Robin email template (HTML + text) ─────────────────────────────
cases.push({
  name: 'reserve-formula.mjs Robin HTML template does not render lat/lng/IP/timezone/subdivision/city',
  run: () => {
    // The old table had rows for each. Now only country renders.
    const forbidden = ['geo.city', 'geo.subdivision', 'geo.timezone', 'geo.ip', 'geo.latitude', 'geo.longitude'];
    const leak = forbidden.filter(f => RESERVE_SRC.includes(f));
    return { pass: leak.length === 0, detail: `leaked refs: ${JSON.stringify(leak)}` };
  },
});

// ── Response echo back to client ───────────────────────────────────
cases.push({
  name: 'reserve response geo echo is capped to { country } shape',
  run: () => {
    // The handler returns { geo: geo, ... } where geo is now the
    // minimised object. The prior shape leaked lat/lng/ip back to the
    // browser; that MUST NOT be reintroduced.
    const forbidden = ['latitude:', 'longitude:', 'origin_lat:', 'origin_lng:', 'origin_ip:', 'origin_city:', 'origin_subdivision:', 'origin_timezone:'];
    const leak = forbidden.filter(f => RESERVE_SRC.includes(f));
    return { pass: leak.length === 0, detail: `leaked field keys: ${JSON.stringify(leak)}` };
  },
});

// ── Client-side Supabase insert ────────────────────────────────────
function assertClientOnlyCountry(name, src) {
  cases.push({
    name,
    run: () => {
      // origin_country reads geo?.country (allowed). Every other
      // origin_* column MUST be a literal null — no geo? read.
      // Post-fix: origin_country: geo?.country || null,
      //          origin_city: null, origin_subdivision: null, etc.
      const patterns = [
        { key: 'origin_city',        forbidden: /origin_city\s*:\s*geo/ },
        { key: 'origin_subdivision', forbidden: /origin_subdivision\s*:\s*geo/ },
        { key: 'origin_timezone',    forbidden: /origin_timezone\s*:\s*geo/ },
        { key: 'origin_ip',          forbidden: /origin_ip\s*:\s*geo/ },
        { key: 'origin_lat',         forbidden: /origin_lat\s*:\s*geo/ },
        { key: 'origin_lng',         forbidden: /origin_lng\s*:\s*geo/ },
      ];
      const leaks = patterns.filter(p => p.forbidden.test(src)).map(p => p.key);
      return { pass: leaks.length === 0, detail: `still reads geo? for: ${JSON.stringify(leaks)}` };
    },
  });
}
assertClientOnlyCountry('Basic client archiveFormulaToAcademy writes only origin_country', BASIC_CLIENT);
assertClientOnlyCountry('Pro   client archiveFormulaToAcademy writes only origin_country', PRO_CLIENT);

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
