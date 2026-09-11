// tests/shadow-verify.cjs
//
// Verifies /api/fyf/compose end-to-end by invoking the netlify
// function handler directly with mock Requests. This is what actually
// happens in production: Netlify parses the incoming HTTP request,
// constructs a Fetch API Request, and calls the exported handler.
//
// Two suites run:
//
//   1. Fixture regression — 20 profiles from Step 0. Expected:
//        19 PASS + 1 EXPECTED SECURITY DIVERGENCE + 0 UNEXPECTED
//
//   2. Adversarial — forged bodies, oversized payloads, malformed
//      JSON, missing avoid, avoid:[], forged selectedHerbs/
//      percentages/formulaId. Each has an expected HTTP status and
//      error code.
//
//   node tests/shadow-verify.cjs

const path = require('path');
const fs   = require('fs');
const { pathToFileURL } = require('node:url');

// The handler is ESM (export default). Load it via dynamic import.
// On Windows, dynamic-imported paths must be file:// URLs, not raw
// absolute paths — pathToFileURL() handles that portably.
async function loadHandler() {
  const abs = path.join(__dirname, '..', 'netlify', 'functions', 'fyf-compose.mjs');
  const mod = await import(pathToFileURL(abs).href);
  return mod.default;
}

// Each test request gets a synthetic unique X-Forwarded-For so the
// per-IP rate limiter (8 rpm per IP) doesn't trip across the 20-
// fixture + 9-adversarial suite. Real Netlify sets X-Forwarded-For
// per incoming request from the CDN edge.
let _testIpCounter = 0;
function nextTestIp() {
  _testIpCounter++;
  return '10.0.' + Math.floor(_testIpCounter / 256) + '.' + (_testIpCounter % 256);
}

async function invokeHandler(handler, body, extraHeaders = {}) {
  const req = new Request('http://localhost:8888/api/fyf/compose', {
    method:  'POST',
    headers: {
      'Content-Type':    'application/json',
      'Origin':          'http://localhost:5173',
      'X-Forwarded-For': nextTestIp(),
      ...extraHeaders,
    },
    body:    typeof body === 'string' ? body : JSON.stringify(body),
  });
  const res = await handler(req);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}
  return { status: res.status, headers: Object.fromEntries(res.headers), body: json, text };
}

const PROFILES = require('./fixtures/profiles.cjs');
const expectedDir = path.join(__dirname, 'fixtures', 'expected');
const SECURITY_FIX_EXPECTATIONS = {
  '20-adversarial-empty-avoid': {
    expectedStatus: 400,
    expectedCode:   'SAFETY_QUESTION_NOT_ANSWERED',
    rationale:      'Client accepted avoid:[] and composed unfiltered; server rejects.',
  },
};

function diffCoreFormula(expected, actual) {
  // Compare display-safe fields. The endpoint sanitises the engine's
  // rich output down to { name, botanical, percentage } per herb, so
  // that's what we can diff against the baseline's herb entries.
  const diffs = [];
  if (expected.formulaSize !== actual.formula.size) {
    diffs.push('formulaSize: ' + expected.formulaSize + ' → ' + actual.formula.size);
  }
  if (expected.percentageTotal !== actual.formula.totalPercentage) {
    diffs.push('percentageTotal: ' + expected.percentageTotal + ' → ' + actual.formula.totalPercentage);
  }
  const e = (expected.herbs || []).map(h => h.name + '@' + h.percentage);
  const a = (actual.formula.herbs || []).map(h => h.name + '@' + h.percentage);
  if (e.join('|') !== a.join('|')) {
    diffs.push('herbs mismatch:\n      expected: ' + e.join(', ') + '\n      actual  : ' + a.join(', '));
  }
  return diffs;
}

async function runFixtureSuite(handler) {
  console.log('── FIXTURE SUITE — 20 profiles over HTTP handler ──');
  let pass = 0, secFix = 0, unexpected = 0;
  for (const p of PROFILES) {
    const expected = JSON.parse(fs.readFileSync(path.join(expectedDir, p.id + '.json'), 'utf8')).output;
    const secExpectation = SECURITY_FIX_EXPECTATIONS[p.id];
    const r = await invokeHandler(handler, { profile: p.input, requestId: 'test-' + p.id });

    if (secExpectation) {
      if (r.status === secExpectation.expectedStatus && r.body && r.body.code === secExpectation.expectedCode) {
        secFix++;
        console.log('  ⚠ ' + p.id.padEnd(40) + '  ' + r.status + ' EXPECTED_SECURITY_DIVERGENCE (' + r.body.code + ')');
      } else {
        unexpected++;
        console.log('  ✗ ' + p.id.padEnd(40) + '  expected ' + secExpectation.expectedStatus + ' ' + secExpectation.expectedCode + ' — got ' + r.status + ' ' + JSON.stringify(r.body));
      }
      continue;
    }

    if (r.status !== 200) {
      unexpected++;
      console.log('  ✗ ' + p.id.padEnd(40) + '  UNEXPECTED ' + r.status + ' ' + JSON.stringify(r.body));
      continue;
    }
    const diffs = diffCoreFormula(expected, r.body);
    if (diffs.length === 0) {
      pass++;
      console.log('  ✓ ' + p.id.padEnd(40) + '  200 PASS · id=' + r.body.formulaId + '  persisted=' + r.body.persisted);
    } else {
      unexpected++;
      console.log('  ✗ ' + p.id.padEnd(40) + '  UNEXPECTED diff:');
      for (const d of diffs) console.log('      ' + d);
    }
  }
  console.log('');
  console.log('  PASS                            : ' + pass);
  console.log('  EXPECTED_SECURITY_DIVERGENCE    : ' + secFix);
  console.log('  UNEXPECTED                      : ' + unexpected);
  console.log('');
  return { pass, secFix, unexpected };
}

const VALID_BASE_PROFILE = () => ({
  intention: 'stress',
  intentions: ['stress'],
  pattern: 'mixed', patternSub: 'sighing',
  time: 'evening', stress: 'push', duration: 'weeks',
  avoid: ['none'], age: '25_40', sleep: 'restorative_6plus',
  notes: '',
  _gatedOptIn: false, _ageConfirmed: true,
});

async function runAdversarialSuite(handler) {
  console.log('── ADVERSARIAL SUITE — 9 forged/malformed requests ──');
  const cases = [
    {
      name: 'A · body forges selectedHerbs (must be ignored)',
      body: {
        profile: VALID_BASE_PROFILE(),
        selectedHerbs: [ { id: 1, name: 'Attacker Herb', percentage: 100 } ],
      },
      expect: (r) => r.status === 200 && !JSON.stringify(r.body).includes('Attacker Herb'),
    },
    {
      name: 'B · body forges percentages array (must be ignored)',
      body: {
        profile: VALID_BASE_PROFILE(),
        percentages: [ 99, 1 ],
      },
      expect: (r) => r.status === 200 && r.body.formula.totalPercentage === 100,
    },
    {
      name: 'C · body forges formulaId (must be replaced with fresh server id)',
      body: {
        profile: VALID_BASE_PROFILE(),
        formulaId: 'fyf_attacker_choice',
      },
      expect: (r) => r.status === 200 && r.body.formulaId && r.body.formulaId !== 'fyf_attacker_choice' && r.body.formulaId.startsWith('fyf_'),
    },
    {
      name: 'D · body forges shortlist (must be ignored)',
      body: {
        profile: VALID_BASE_PROFILE(),
        shortlist: [ { id: 999, name: 'Attacker Choice' } ],
      },
      expect: (r) => r.status === 200 && !JSON.stringify(r.body).includes('Attacker Choice'),
    },
    {
      name: 'E · avoid missing entirely (must reject SAFETY_QUESTION_NOT_ANSWERED)',
      body: {
        profile: (() => { const p = VALID_BASE_PROFILE(); delete p.avoid; return p; })(),
      },
      expect: (r) => r.status === 400 && r.body.code === 'SAFETY_QUESTION_NOT_ANSWERED',
    },
    {
      name: 'F · avoid: [] (must reject SAFETY_QUESTION_NOT_ANSWERED)',
      body: {
        profile: Object.assign(VALID_BASE_PROFILE(), { avoid: [] }),
      },
      expect: (r) => r.status === 400 && r.body.code === 'SAFETY_QUESTION_NOT_ANSWERED',
    },
    {
      name: 'G · malformed profile (intention not in enum)',
      body: {
        profile: Object.assign(VALID_BASE_PROFILE(), { intention: 'ATTACKER_INJECTION' }),
      },
      expect: (r) => r.status === 400 && r.body.code === 'PROFILE_INVALID',
    },
    {
      name: 'H · oversized payload (>32 KB)',
      body: (() => {
        const p = VALID_BASE_PROFILE();
        p.notes = 'x'.repeat(64 * 1024);
        return { profile: p };
      })(),
      expect: (r) => r.status === 413 && r.body.code === 'PAYLOAD_TOO_LARGE',
    },
    {
      name: 'I · malformed JSON',
      body: '{ "profile": {broken',
      raw:  true,
      expect: (r) => r.status === 400 && r.body.code === 'MALFORMED_JSON',
    },
    {
      name: 'J · X-FYF-Mode: shadow → response says persisted:false regardless of env',
      body: { profile: VALID_BASE_PROFILE() },
      extraHeaders: { 'X-FYF-Mode': 'shadow' },
      expect: (r) => r.status === 200 && r.body.persisted === false,
    },
  ];

  let passed = 0, failed = 0;
  for (const c of cases) {
    const r = await invokeHandler(handler, c.raw ? c.body : c.body, c.extraHeaders || {});
    const ok = c.expect(r);
    if (ok) {
      passed++;
      console.log('  ✓ ' + c.name);
    } else {
      failed++;
      console.log('  ✗ ' + c.name + '  →  actual: ' + r.status + ' ' + JSON.stringify(r.body).slice(0, 200));
    }
  }
  console.log('');
  console.log('  passed: ' + passed);
  console.log('  failed: ' + failed);
  console.log('');
  return { passed, failed };
}

(async () => {
  const handler = await loadHandler();
  const fx = await runFixtureSuite(handler);
  const adv = await runAdversarialSuite(handler);

  const totalFails = fx.unexpected + adv.failed;
  console.log('══════════════════════════════════════════════════════════');
  console.log('  Overall: ' + (totalFails === 0 ? '✓ ALL GREEN' : ('✗ ' + totalFails + ' failure(s)')));
  console.log('══════════════════════════════════════════════════════════');
  process.exit(totalFails === 0 ? 0 : 1);
})().catch(e => {
  console.error('FATAL:', e && e.stack ? e.stack : e);
  process.exit(2);
});
