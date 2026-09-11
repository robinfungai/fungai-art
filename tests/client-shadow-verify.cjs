// tests/client-shadow-verify.cjs
//
// Unit tests for the CLIENT-side shadow function
// (shadowComposeToServer) in public/find-your-formula/index.html.
//
// The function is extracted at runtime via regex (its body is
// self-contained) and evaluated in a Node sandbox with mocked
// globals (fetch, sessionStorage, AbortController, console). Each
// test drives it with a specific server response shape and asserts
// the classification logs and side effects.
//
// Coverage per Step 3 constraint:
//    · 200 with matching formula      → PASS log
//    · 200 with different herbs       → UNEXPECTED_DIVERGENCE
//    · 400 SAFETY_QUESTION_NOT_ANSWERED for avoid:[]
//                                     → EXPECTED_SECURITY_DIVERGENCE
//    · 400 unknown code               → UNEXPECTED_DIVERGENCE
//    · 429 rate-limited               → soft log, no diverge
//    · 500 server error               → soft log, no diverge
//    · fetch throws (network fail)    → soft log, no diverge
//    · abort/timeout                  → soft log, no diverge
//    · X-FYF-Mode: shadow header IS sent on every request
//    · full profile IS sent (engine needs notes/gate for parity)
//    · no IP / geo / fingerprint fields added client-side
//    · dedupe: 2 identical calls in a row → only ONE fetch fires

const fs   = require('fs');
const path = require('path');

// ── Extract the shadow function block from the client file ──────
const clientPath = path.join(__dirname, '..', 'public', 'find-your-formula', 'index.html');
const src        = fs.readFileSync(clientPath, 'utf8');
const scriptSection = src.slice(
  src.indexOf('function _fyfShadowHash'),
  src.indexOf('// ── Render the result screen')
);
if (!scriptSection || scriptSection.length < 500) {
  console.error('Could not extract shadow block — did the client file change shape?');
  process.exit(2);
}

// ── Build a sandbox that mimics the browser globals used ────────
function buildSandbox({ fetchImpl, sessionStore }) {
  const capturedLogs = [];
  const log = (...args) => capturedLogs.push({ level: 'log',  text: args.join(' ') });
  const warn = (...args) => capturedLogs.push({ level: 'warn', text: args.join(' ') });
  const sandbox = {
    console: { log, warn },
    sessionStorage: {
      getItem: (k) => sessionStore.get(k) || null,
      setItem: (k, v) => sessionStore.set(k, String(v)),
    },
    fetch: fetchImpl,
    AbortController: class {
      constructor() { this.signal = { aborted: false }; }
      abort() { this.signal.aborted = true; }
    },
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
    assignPercentages: (herbs) => {
      // Mock: even-split among herbs; last herb absorbs drift.
      if (!herbs || !herbs.length) return [];
      const base = Math.floor(100 / herbs.length);
      const arr = herbs.map(() => base);
      arr[arr.length - 1] += 100 - arr.reduce((a, b) => a + b, 0);
      return arr;
    },
  };
  // Evaluate the extracted client code in the sandbox context.
  const vm = require('vm');
  vm.createContext(sandbox);
  vm.runInContext(scriptSection, sandbox);
  return { sandbox, logs: capturedLogs };
}

const VALID_PROFILE = () => ({
  intention: 'stress', intentions: ['stress'],
  pattern: 'mixed', patternSub: 'sighing',
  time: 'evening', stress: 'push', duration: 'weeks',
  avoid: ['none'], age: '25_40', sleep: 'restorative_6plus',
  notes: '',
  _gatedOptIn: false, _ageConfirmed: true,
});

const SAMPLE_HERBS = [
  { name: 'Ashwagandha' },
  { name: 'Reishi' },
  { name: 'Cordyceps' },
  { name: 'Rose Petals' },
  { name: 'Damiana' },
];

async function run(name, mockFetch, profileMod, herbsMod, checks) {
  const store = new Map();
  const calls = [];
  const wrappedFetch = async (url, opts) => {
    calls.push({ url, opts });
    return mockFetch(url, opts);
  };
  const { sandbox, logs } = buildSandbox({ fetchImpl: wrappedFetch, sessionStore: store });
  const profile = profileMod ? profileMod(VALID_PROFILE()) : VALID_PROFILE();
  const herbs   = herbsMod   ? herbsMod(SAMPLE_HERBS.slice())     : SAMPLE_HERBS.slice();
  await sandbox.shadowComposeToServer(profile, herbs);
  const ok = checks({ logs, calls, sandbox, store });
  console.log((ok ? '  ✓ ' : '  ✗ ') + name);
  if (!ok) console.log('     logs:', JSON.stringify(logs, null, 2));
  return !!ok;
}

const okResponse = (body) => async () => new Response(JSON.stringify(body), { status: 200 });
const errResponse = (status, body) => async () => new Response(JSON.stringify(body), { status });
const throwResponse = (err) => async () => { throw err; };

(async () => {
  console.log('── CLIENT-SHADOW SUITE — 11 scenarios ──');
  let pass = 0, fail = 0;

  // 1. 200 match — expect a PASS log + one fetch called.
  const p1 = await run('200 match → PASS log',
    okResponse({
      status: 'ok', engineVersion: '2.0.0-server',
      formula: { size: 5, totalPercentage: 100, herbs: SAMPLE_HERBS.map((h) => ({ name: h.name, percentage: 20 })) },
    }),
    null, null,
    ({ logs, calls }) => calls.length === 1 && logs.some(l => l.level === 'log' && l.text.startsWith('[fyf-shadow] PASS'))
  ); p1 ? pass++ : fail++;

  // 2. 200 with different herbs — expect UNEXPECTED_DIVERGENCE warn.
  const p2 = await run('200 herbs differ → UNEXPECTED_DIVERGENCE warn',
    okResponse({
      status: 'ok', engineVersion: '2.0.0-server',
      formula: { size: 5, totalPercentage: 100, herbs: [
        { name: 'Different Herb', percentage: 100 },
      ]},
    }),
    null, null,
    ({ logs }) => logs.some(l => l.level === 'warn' && /UNEXPECTED_DIVERGENCE/.test(l.text))
  ); p2 ? pass++ : fail++;

  // 3. 400 SAFETY_QUESTION_NOT_ANSWERED with avoid:[] → EXPECTED_SECURITY_DIVERGENCE.
  const p3 = await run('400 SAFETY (avoid:[]) → EXPECTED_SECURITY_DIVERGENCE',
    errResponse(400, { status: 'rejected', code: 'SAFETY_QUESTION_NOT_ANSWERED' }),
    (p) => { p.avoid = []; return p; },
    null,
    ({ logs }) => logs.some(l => l.level === 'log' && /EXPECTED_SECURITY_DIVERGENCE/.test(l.text))
  ); p3 ? pass++ : fail++;

  // 4. 400 with unknown code → UNEXPECTED_DIVERGENCE warn.
  const p4 = await run('400 unknown code → UNEXPECTED_DIVERGENCE warn',
    errResponse(400, { status: 'rejected', code: 'MYSTERY_CODE' }),
    null, null,
    ({ logs }) => logs.some(l => l.level === 'warn' && /UNEXPECTED_DIVERGENCE/.test(l.text))
  ); p4 ? pass++ : fail++;

  // 5. 429 → soft rate-limit log, not counted as diverge.
  const p5 = await run('429 rate-limited → soft log',
    errResponse(429, { status: 'error', code: 'RATE_LIMITED' }),
    null, null,
    ({ logs }) => logs.some(l => /rate-limited/.test(l.text)) && !logs.some(l => l.level === 'warn')
  ); p5 ? pass++ : fail++;

  // 6. 500 → soft server-error log.
  const p6 = await run('500 → soft log, no diverge',
    errResponse(500, { status: 'error', code: 'INTERNAL_ERROR' }),
    null, null,
    ({ logs }) => logs.some(l => /server 500/.test(l.text)) && !logs.some(l => l.level === 'warn')
  ); p6 ? pass++ : fail++;

  // 7. fetch throws (network fail) → soft log.
  const p7 = await run('fetch throws → soft log',
    throwResponse(new Error('network offline')),
    null, null,
    ({ logs }) => logs.some(l => /server unreachable/.test(l.text)) && !logs.some(l => l.level === 'warn')
  ); p7 ? pass++ : fail++;

  // 8. AbortError → soft "timeout" log.
  const p8 = await run('AbortError → soft timeout log',
    throwResponse(Object.assign(new Error('aborted'), { name: 'AbortError' })),
    null, null,
    ({ logs }) => logs.some(l => /timeout/.test(l.text))
  ); p8 ? pass++ : fail++;

  // 9. X-FYF-Mode: shadow header IS sent on every request.
  const p9 = await run('X-FYF-Mode: shadow header sent',
    okResponse({ status: 'ok', engineVersion: '2.0.0-server',
      formula: { size: 5, totalPercentage: 100, herbs: SAMPLE_HERBS.map(h => ({ name: h.name, percentage: 20 })) } }),
    null, null,
    ({ calls }) => calls.length === 1 && calls[0].opts.headers['X-FYF-Mode'] === 'shadow'
  ); p9 ? pass++ : fail++;

  // 10. Payload includes profile only — never selectedHerbs / IP / geo / fingerprint.
  const p10 = await run('body contains ONLY { profile: ... }; no IP/geo/fingerprint fields added',
    okResponse({ status: 'ok', engineVersion: '2.0.0-server',
      formula: { size: 5, totalPercentage: 100, herbs: SAMPLE_HERBS.map(h => ({ name: h.name, percentage: 20 })) } }),
    null, null,
    ({ calls }) => {
      const body = JSON.parse(calls[0].opts.body);
      const keys = Object.keys(body).sort();
      // Only 'profile' at top level. No IP, no geolocation, no user-agent
      // (browser adds UA automatically but nothing WE inject).
      if (keys.length !== 1 || keys[0] !== 'profile') return false;
      const forbidden = ['ip','ipAddress','geo','geolocation','lat','lon','longitude','latitude','fingerprint','userAgent','deviceId','selectedHerbs','percentages','formulaId','shortlist','formula'];
      const bodyStr = JSON.stringify(body);
      return !forbidden.some(k => bodyStr.includes(k));
    }
  ); p10 ? pass++ : fail++;

  // 11. Dedupe — two identical profile calls in same session → only ONE fetch fires.
  const p11 = await (async () => {
    const store = new Map();
    let fetchCount = 0;
    const wrappedFetch = async () => {
      fetchCount++;
      return new Response(JSON.stringify({ status: 'ok', engineVersion: '2.0.0-server',
        formula: { size: 5, totalPercentage: 100, herbs: SAMPLE_HERBS.map(h => ({ name: h.name, percentage: 20 })) } }), { status: 200 });
    };
    const { sandbox } = buildSandbox({ fetchImpl: wrappedFetch, sessionStore: store });
    const p = VALID_PROFILE();
    await sandbox.shadowComposeToServer(p, SAMPLE_HERBS.slice());
    await sandbox.shadowComposeToServer(p, SAMPLE_HERBS.slice()); // identical → should be deduped
    const ok = fetchCount === 1;
    console.log((ok ? '  ✓ ' : '  ✗ ') + 'dedupe: identical profile calls twice → 1 fetch');
    return ok;
  })(); p11 ? pass++ : fail++;

  console.log('');
  console.log('passed: ' + pass);
  console.log('failed: ' + fail);
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('FATAL:', e && e.stack); process.exit(2); });
