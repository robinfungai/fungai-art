// tests/visits-minimisation-verify.cjs
//
// Holds the visitor counter to the same line as the checkout.
//
// reserve-formula.mjs was cut back to COUNTRY ONLY under GDPR
// minimisation, and tests/geo-minimisation-verify.cjs keeps it there.
// Analytics collecting more than the checkout does would make that policy
// a fiction, so this file fails the build if the beacon, the collector or
// the schema starts gathering a person rather than a page.
//
//   node tests/visits-minimisation-verify.cjs

const fs   = require('fs');
const path = require('path');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
// Absence checks run against CODE, not comments. These files explain at
// length what they refuse to collect, and naming a thing in a comment is
// not collecting it — the first version of this test failed on its own
// documentation.
const codeOnly = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
const COLLECT = R('netlify/functions/collect-visit.mjs');
const BEACON  = R('public/visit.js');
const SQL     = R('supabase-visits.sql');
const DIGEST  = R('netlify/functions/visitor-digest.mjs');

let passed = 0, failed = 0;
const ok   = (n, d) => { passed++; console.log('  ✓ ' + n + (d ? '  — ' + d : '')); };
const bad  = (n, d) => { failed++; console.log('  ✗ ' + n + (d ? '  — ' + d : '')); };
const test = (n, cond, d) => (cond ? ok(n, d) : bad(n, d));

console.log('\n── NO PERSON IS COLLECTED ──');
// The column list is the contract. Anything not here cannot be stored.
const ALLOWED = ['id', 'created_at', 'path', 'country', 'device', 'os', 'browser', 'referrer', 'lang', 'is_bot'];
const declared = [...SQL.matchAll(/^\s{2}([a-z_]+)\s+(?:bigserial|timestamptz|text|boolean)/gm)].map(m => m[1]);
const extra = declared.filter(c => !ALLOWED.includes(c));
test('page_views declares only the agreed columns', extra.length === 0, extra.length ? 'unexpected: ' + extra.join(', ') : declared.length + ' columns');

for (const forbidden of ['ip', 'ip_address', 'city', 'latitude', 'longitude', 'lat', 'lng', 'subdivision', 'timezone', 'visitor_id', 'session_id', 'fingerprint', 'user_agent']) {
  test('no `' + forbidden + '` column', !declared.includes(forbidden));
}

console.log('\n── THE COLLECTOR ──');
test('reads country and nothing else from x-nf-geo',
  COLLECT.includes('countryOnly') && !/parsed\.(city|latitude|longitude|subdivision|timezone)/.test(COLLECT));
test('never stores the raw User-Agent',
  !/user_agent|ua:\s*s\b|row\.ua/.test(COLLECT) && COLLECT.includes('classifyUA'));
test('never reads a client IP header',
  !/x-forwarded-for|x-nf-client-connection-ip|client-ip/i.test(codeOnly(COLLECT)));
test('strips query string and fragment from the path',
  COLLECT.includes("split('?')[0]") && COLLECT.includes("split('#')[0]"));
test('returns no body to the caller', /status:\s*204/.test(COLLECT) && !/JSON\.stringify\(\s*row/.test(COLLECT.split('return new Response')[1] || ''));

console.log('\n── THE BEACON ──');
test('sets no cookie', !/document\.cookie/.test(codeOnly(BEACON)));
test('writes no localStorage or sessionStorage', !/localStorage|sessionStorage|indexedDB/.test(codeOnly(BEACON)));
test('generates no visitor id', !/random|uuid|crypto\./i.test(codeOnly(BEACON)));
test('honours Do Not Track', /doNotTrack/.test(BEACON));
test('sends no credentials', /credentials:\s*'omit'/.test(BEACON));
test('skips localhost and previews', /localhost/.test(BEACON) && /deploy-preview/.test(BEACON));

console.log('\n── THE DATABASE GUARDS THE PATH TOO ──');
test('CHECK rejects a path holding a query string', /path NOT LIKE '%\?%'/.test(SQL));
test('CHECK rejects a path holding a fragment', /path NOT LIKE '%#%'/.test(SQL));
test('anon may INSERT', /FOR INSERT\s*\n\s*TO anon/.test(SQL));
test('anon may NOT SELECT — traffic is not public',
  !/FOR SELECT[\s\S]{0,80}TO anon/.test(SQL) && /DROP POLICY IF EXISTS "page_views_anon_select"/.test(SQL));
test('rows are pruned, not kept forever', /prune_page_views/.test(SQL) && /90 days/.test(SQL));

console.log('\n── THE REPORT IS HONEST ──');
test('digest reads with the service role, not anon', /SERVICE_KEY/.test(DIGEST) && !/SUPABASE_ANON/.test(DIGEST));
test('digest never claims unique visitors', !/unique visitor/i.test(codeOnly(DIGEST).replace(/not unique visitors/gi, '')));
test('digest says views, not visitors, in the email body', /PAGE VIEWS, not unique visitors/.test(DIGEST));
test('bots are separated rather than dropped', /is_bot/.test(DIGEST) && /crawlers/.test(DIGEST));
test('runs twice a month', /schedule:\s*'0 9 1,15 \* \*'/.test(DIGEST));

console.log('\n  passed: ' + passed);
console.log('  failed: ' + failed);
process.exit(failed ? 1 : 0);
