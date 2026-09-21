// tests/forage-proxies-verify.cjs
//
// The four public data proxies behind the foraging map must only answer
// Fungai: CORS never `*`, a foreign Origin refused before any upstream
// call is made, same-origin calls (no Origin header) allowed, and bulk
// callers rate-limited. See src/server/proxy-guard.mjs.
//
// Each function is bundled with esbuild the way Netlify bundles it, then
// called with fake events / Requests. Upstream APIs are stubbed — no
// network, no quota.
//
//   node tests/forage-proxies-verify.cjs

const path = require('path');
const os   = require('os');
const fs   = require('fs');
const { pathToFileURL } = require('url');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');
const OUT  = fs.mkdtempSync(path.join(os.tmpdir(), 'forage-proxies-'));

const FUNCTIONS = [
  { name: 'mushroom-observations', style: 'v1', query: 'minLat=59&maxLat=60&minLng=15&maxLng=16' },
  { name: 'nutrient-fungi',        style: 'v1', query: 'minLat=59&maxLat=60&minLng=15&maxLng=16' },
  { name: 'gbif-observations',     style: 'v2', query: 'taxon=chanterelle&lat=59.3&lng=18.1' },
  { name: 'forage-conditions',     style: 'v2', query: 'lat=59.3&lng=18.1' },
];

// Upstream stub: counts calls, answers with an empty-but-valid payload.
let upstreamCalls = 0;
const days = Array.from({ length: 17 }, (_, i) => new Date(Date.UTC(2026, 8, 5 + i)).toISOString().slice(0, 10));
const OPEN_METEO = {
  daily: { time: days, precipitation_sum: days.map((_, i) => i % 3), temperature_2m_max: days.map(() => 16), temperature_2m_min: days.map(() => 8), windspeed_10m_max: days.map(() => 12) },
  hourly: { time: days.flatMap(d => Array.from({ length: 24 }, (_, h) => d + 'T' + String(h).padStart(2, '0') + ':00')), relativehumidity_2m: Array(17 * 24).fill(80) },
};
globalThis.fetch = async (url) => {
  upstreamCalls++;
  const body = String(url).includes('open-meteo') ? OPEN_METEO : { results: [], count: 0 };
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

let ipSeq = 0;
function call(mod, fn, { origin, ip, method = 'GET' } = {}) {
  ip = ip || `203.0.113.${++ipSeq % 250}`;
  const headers = { 'x-nf-client-connection-ip': ip };
  if (origin) headers.origin = origin;
  if (fn.style === 'v1') {
    const qs = Object.fromEntries(new URLSearchParams(fn.query));
    return Promise.resolve(mod.handler({ httpMethod: method, headers, queryStringParameters: qs })).then(r => ({
      status: r.statusCode, header: (k) => r.headers?.[k] ?? r.headers?.[k.toLowerCase()],
    }));
  }
  const req = new Request(`https://www.fungai.art/api/${fn.name}?${fn.query}`, { method, headers });
  return Promise.resolve(mod.default(req, {})).then(r => ({ status: r.status, header: (k) => r.headers.get(k) }));
}

const cases = [];
const t = (name, run) => cases.push({ name, run });

(async () => {
  const mods = {};
  for (const fn of FUNCTIONS) {
    const outfile = path.join(OUT, fn.name + '.mjs');
    await esbuild.build({
      entryPoints: [path.join(ROOT, 'netlify', 'functions', fn.name + '.js')],
      bundle: true, platform: 'node', format: 'esm', target: 'node18', outfile, logLevel: 'silent',
    });
    mods[fn.name] = await import(pathToFileURL(outfile).href);
  }

  for (const fn of FUNCTIONS) {
    const mod = mods[fn.name];

    t(`${fn.name}: same-origin call (no Origin header) is answered`, async () => {
      const r = await call(mod, fn);
      return { pass: r.status === 200, detail: 'status ' + r.status };
    });

    t(`${fn.name}: CORS names the Fungai origin, never *`, async () => {
      const r = await call(mod, fn, { origin: 'https://www.fungai.art' });
      const acao = r.header('Access-Control-Allow-Origin');
      return { pass: acao === 'https://www.fungai.art', detail: 'Access-Control-Allow-Origin: ' + acao };
    });

    t(`${fn.name}: foreign origin refused before any upstream call`, async () => {
      const before = upstreamCalls;
      const r = await call(mod, fn, { origin: 'https://evil.example' });
      const cache = r.header('Cache-Control');
      return { pass: r.status === 403 && upstreamCalls === before && cache === 'no-store',
               detail: `status ${r.status}, upstream calls ${upstreamCalls - before}, Cache-Control ${cache}` };
    });

    t(`${fn.name}: preflight answered without upstream call`, async () => {
      const before = upstreamCalls;
      const r = await call(mod, fn, { origin: 'https://www.fungai.art', method: 'OPTIONS' });
      return { pass: r.status === 204 && upstreamCalls === before, detail: 'status ' + r.status };
    });

    t(`${fn.name}: one IP is rate-limited after 120 calls in a minute`, async () => {
      const ip = '198.51.100.' + FUNCTIONS.indexOf(fn);
      let first429 = null;
      for (let i = 1; i <= 125; i++) {
        const r = await call(mod, fn, { ip });
        if (r.status === 429) { first429 = i; if (!r.header('Retry-After')) return { pass: false, detail: '429 without Retry-After' }; break; }
      }
      return { pass: first429 === 121, detail: first429 ? `first 429 on call ${first429}` : 'never limited' };
    });

    t(`${fn.name}: another IP is unaffected by that limit`, async () => {
      const r = await call(mod, fn, { ip: '192.0.2.77' });
      return { pass: r.status !== 429, detail: 'status ' + r.status };
    });
  }

  let passed = 0, failed = 0;
  console.log('\n  FORAGE PROXIES — Fungai-only, rate-limited\n');
  for (const c of cases) {
    let r;
    try { r = await c.run(); } catch (e) { r = { pass: false, detail: e.message }; }
    if (r.pass) { passed++; console.log('  ✓ ' + c.name + (r.detail ? '  — ' + r.detail : '')); }
    else        { failed++; console.log('  ✗ ' + c.name + (r.detail ? '  — ' + r.detail : '')); }
  }
  console.log('\n  passed: ' + passed + '\n  failed: ' + failed);
  fs.rmSync(OUT, { recursive: true, force: true });
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
