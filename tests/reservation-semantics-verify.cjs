// tests/reservation-semantics-verify.cjs
//
// Round 2 · Item #3. Reservation flow must have explicit tri-state
// semantics — not `res.ok`. Verifies:
//   · server returns status:'confirmed'|'partial'|'failed' + matching
//     HTTP code (200/202/500)
//   · client branches on the semantic field, not res.ok
//   · UI surfaces the partial note honestly (not "reserved" silent)
//
//   node tests/reservation-semantics-verify.cjs

const fs   = require('fs');
const path = require('path');

const SRC   = fs.readFileSync(path.join(__dirname, '..', 'netlify', 'functions', 'reserve-formula.mjs'), 'utf8');
const BASIC = fs.readFileSync(path.join(__dirname, '..', 'public', 'find-your-formula', 'index.html'), 'utf8');
const PRO   = fs.readFileSync(path.join(__dirname, '..', 'public', 'find-your-formula-pro', 'index.html'), 'utf8');

const cases = [];
const check = (name, run) => cases.push({ name, run });

// ── Server contract ──────────────────────────────────────────────
check('server: response body carries `status` field', () => ({
  pass: /status,\s*\/\/\s*←/.test(SRC) || /status,\s*\n.*\/\/ the semantic/.test(SRC) || /status,\s*[^;]*\/\/ ←/.test(SRC) || /status,\s+\/\/.*semantic/.test(SRC),
  detail: '',
}));

check('server: confirmed → 200', () => ({
  pass: /status\s*=\s*'confirmed';\s*httpStatus\s*=\s*200/.test(SRC),
  detail: '',
}));

check('server: partial → 202', () => ({
  pass: /status\s*=\s*'partial';\s*httpStatus\s*=\s*202/.test(SRC),
  detail: '',
}));

check('server: failed → 500', () => ({
  pass: /status\s*=\s*'failed';\s*httpStatus\s*=\s*500/.test(SRC),
  detail: '',
}));

check('server: `confirmed` iff both emails ok', () => ({
  pass: /if \(robinOk && customerOk\)\s*\{ status = 'confirmed'/.test(SRC),
  detail: '',
}));

check('server: `partial` iff exactly one email ok', () => ({
  pass: /else if \(robinOk \|\| customerOk\)\s*\{ status = 'partial'/.test(SRC),
  detail: '',
}));

check('server: `failed` iff both emails failed', () => ({
  pass: /else\s*\{\s*status = 'failed'/.test(SRC),
  detail: '',
}));

check('server: returns the semantic httpStatus (not always 200)', () => ({
  // The response builder uses `httpStatus` (200/202/500) rather than a
  // hard-coded 200. Post-Item-#4 refactor uses a `responseBody` var.
  pass: /json\(responseBody, httpStatus, cors\)/.test(SRC),
  detail: '',
}));

// ── Missing RESEND_API_KEY must not fake a reservation ───────
// Regression guard. This branch used to return 200 {ok:true,sent:false}
// with the note "Reservation received." — nothing was received, and
// Robin got no email. Silent lost orders.
const noKeyBranch = (() => {
  const i = SRC.indexOf('RESEND_API_KEY not set');
  if (i < 0) return '';
  // Stop at the end of this branch's return statement so the window
  // can't bleed into the normal-path response below.
  const rest = SRC.slice(i);
  const end  = rest.indexOf('cors);');
  return end < 0 ? rest.slice(0, 1400) : rest.slice(0, end + 6);
})();

check('server: no-RESEND branch exists', () => ({
  pass: noKeyBranch.length > 0,
  detail: '',
}));

check('server: no-RESEND branch never returns 200', () => ({
  pass: noKeyBranch.length > 0 && !/\}, 200, cors\)/.test(noKeyBranch),
  detail: '',
}));

check('server: no-RESEND branch returns 503', () => ({
  pass: /\}, 503, cors\)/.test(noKeyBranch),
  detail: '',
}));

check('server: no-RESEND branch reports status failed', () => ({
  pass: /status:\s*'failed'/.test(noKeyBranch),
  detail: '',
}));

check('server: no-RESEND branch does not claim ok/sent', () => ({
  pass: /ok:\s*false/.test(noKeyBranch) && /sent:\s*false/.test(noKeyBranch)
     && !/ok:\s*true/.test(noKeyBranch),
  detail: '',
}));

check('server: no-RESEND branch carries EMAIL_UNAVAILABLE code', () => ({
  pass: /code:\s*'EMAIL_UNAVAILABLE'/.test(noKeyBranch),
  detail: '',
}));

// ── Client contract (Basic + Pro) ────────────────────────────────
function assertClient(label, src) {
  check(label + ': reads bodyJson.status as the semantic field', () => ({
    pass: /const explicit = bodyJson && typeof bodyJson\.status === 'string' \? bodyJson\.status : null/.test(src),
    detail: '',
  }));
  check(label + ': treats "confirmed"/"partial"/"failed" as canonical states', () => ({
    pass:
      /explicit === 'confirmed'\s*\|\|\s*explicit === 'partial'\s*\|\|\s*explicit === 'failed'/.test(src),
    detail: '',
  }));
  check(label + ': falls back to HTTP code when server doesn\'t send status field', () => ({
    pass:
      /res\.status === 200/.test(src) &&
      /res\.status === 202/.test(src),
    detail: '',
  }));
  check(label + ': surfaces partialNote in reserveThanks when reservationStatus === partial', () => ({
    pass:
      /reservationStatus === 'partial' && partialNote/.test(src) &&
      /reservePartialNote/.test(src),
    detail: '',
  }));
  check(label + ': has customer-facing copy for EMAIL_UNAVAILABLE', () => ({
    pass: /EMAIL_UNAVAILABLE:/.test(src),
    detail: '',
  }));
  check(label + ': error branch is entered on reservationStatus === failed (not !res.ok)', () => ({
    pass:
      /if \(reservationStatus === 'failed'\)\s*\{/.test(src),
    detail: '',
  }));
  check(label + ': never mints "Your formula is reserved" copy on failure path', () => {
    // The failure branch shows the error card, never the thanks card.
    // Assert reservedEmail assignment lives AFTER the reservationStatus
    // guard, not before.
    const failIdx = src.indexOf("if (reservationStatus === 'failed')");
    const thanksIdx = src.indexOf("'reservedEmail'");
    return { pass: failIdx >= 0 && thanksIdx > failIdx, detail: 'guard before thanks' };
  });
}
assertClient('Basic', BASIC);
assertClient('Pro',   PRO);

// ── Runner ────────────────────────────────────────────────────────
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
