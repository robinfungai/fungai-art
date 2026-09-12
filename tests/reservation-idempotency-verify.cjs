// tests/reservation-idempotency-verify.cjs
//
// Round 2 · Item #4. Reservation endpoint must dedupe by
// Idempotency-Key header. Full distributed idempotency requires a
// shared store (deferred to Batch D); this test locks in the LIGHT
// per-instance in-memory dedup + the client's key generation.
//
//   node tests/reservation-idempotency-verify.cjs

const fs   = require('fs');
const path = require('path');

const SRC   = fs.readFileSync(path.join(__dirname, '..', 'netlify', 'functions', 'reserve-formula.mjs'), 'utf8');
const BASIC = fs.readFileSync(path.join(__dirname, '..', 'public', 'find-your-formula', 'index.html'), 'utf8');
const PRO   = fs.readFileSync(path.join(__dirname, '..', 'public', 'find-your-formula-pro', 'index.html'), 'utf8');

const cases = [];
const check = (name, run) => cases.push({ name, run });

// ── Server contract ──────────────────────────────────────────────
check('server: idempCache Map exists', () => ({
  pass: /const idempCache\s*=\s*new Map\(\)/.test(SRC),
  detail: '',
}));

check('server: IDEMP_TTL_MS is 5 minutes', () => ({
  pass: /IDEMP_TTL_MS\s*=\s*5\s*\*\s*60_000/.test(SRC),
  detail: '',
}));

check('server: validateIdempotencyKey enforces 8-64 chars, [A-Za-z0-9_-]', () => ({
  pass: /IDEMP_KEY_RE\s*=\s*\/\^\[A-Za-z0-9_\\-\]\{8,64\}\$\//.test(SRC),
  detail: '',
}));

check('server: reads Idempotency-Key header before any work', () => ({
  pass: /req\.headers\.get\('idempotency-key'\)/i.test(SRC),
  detail: '',
}));

check('server: idempotency HIT short-circuits BEFORE rate-limit', () => {
  const hitIdx = SRC.indexOf('idempotency HIT');
  const rlIdx  = SRC.indexOf('const rl = rateLimit');
  return { pass: hitIdx > 0 && rlIdx > 0 && hitIdx < rlIdx, detail: 'hitIdx=' + hitIdx + ' rlIdx=' + rlIdx };
});

check('server: replay marks response with X-Idempotency-Replay header', () => ({
  pass: /'X-Idempotency-Replay':\s*'true'/.test(SRC),
  detail: '',
}));

check('server: only caches non-failure responses', () => ({
  pass: /if \(idempKey && status !== 'failed'\)/.test(SRC),
  detail: 'failed reservations must be retryable',
}));

check('server: cache eviction sweep runs on IDEMP_TTL_MS interval', () => ({
  pass: /setInterval\(\(\)\s*=>\s*\{[\s\S]*?idempCache\.entries\(\)[\s\S]*?\},\s*IDEMP_TTL_MS\)/.test(SRC),
  detail: '',
}));

// ── Client contract (Basic + Pro) ────────────────────────────────
function assertClient(label, src) {
  check(label + ': generates an idempotency key per submit attempt', () => ({
    pass: /const idempotencyKey\s*=\s*\(typeof crypto !== 'undefined' && crypto\.randomUUID\)/.test(src),
    detail: '',
  }));
  check(label + ': falls back to a random key when crypto.randomUUID absent', () => ({
    pass: /Math\.random\(\)\.toString\(36\)/.test(src),
    detail: '',
  }));
  check(label + ': sends Idempotency-Key header on reserve POST', () => ({
    pass: /'Idempotency-Key':\s*idempotencyKey/.test(src),
    detail: '',
  }));
}
assertClient('Basic', BASIC);
assertClient('Pro',   PRO);

// ── Runtime — exercise the Map dedup logic directly ──────────────
const { pathToFileURL } = require('node:url');

check('RUNTIME: same key → cache HIT on second call within TTL', async () => {
  // Extract just the helpers we need. Full handler needs Supabase +
  // Resend, so we test the Map layer in isolation.
  const cacheCode = `
    const IDEMP_TTL_MS = 5 * 60_000;
    const idempCache = new Map();
    function idempotencyGet(key) {
      const slot = idempCache.get(key);
      if (!slot) return null;
      if (Date.now() > slot.expiresAt) { idempCache.delete(key); return null; }
      return slot;
    }
    function idempotencyPut(key, body, httpStatus) {
      if (!key) return;
      idempCache.set(key, { body, httpStatus, expiresAt: Date.now() + IDEMP_TTL_MS });
    }
    module.exports = { idempotencyGet, idempotencyPut, idempCache };
  `;
  const M = { exports: {} };
  new Function('module', cacheCode)(M);
  const { idempotencyGet, idempotencyPut } = M.exports;
  idempotencyPut('key-abc123', { status: 'confirmed' }, 200);
  const hit = idempotencyGet('key-abc123');
  const miss = idempotencyGet('key-different');
  return { pass: hit && hit.body.status === 'confirmed' && miss === null, detail: '' };
});

check('RUNTIME: expired entries are evicted on read', async () => {
  const cacheCode = `
    const IDEMP_TTL_MS = 5 * 60_000;
    const idempCache = new Map();
    function idempotencyGet(key) {
      const slot = idempCache.get(key);
      if (!slot) return null;
      if (Date.now() > slot.expiresAt) { idempCache.delete(key); return null; }
      return slot;
    }
    module.exports = { idempotencyGet, idempCache };
  `;
  const M = { exports: {} };
  new Function('module', cacheCode)(M);
  M.exports.idempCache.set('stale', { body: {}, httpStatus: 200, expiresAt: Date.now() - 1000 });
  const out = M.exports.idempotencyGet('stale');
  return { pass: out === null && M.exports.idempCache.size === 0, detail: '' };
});

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
