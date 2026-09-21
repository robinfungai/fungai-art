// tests/sw-forage-verify.cjs
//
// The foraging service worker must keep live data live. v3 served fungal
// sightings, the nutrient layer and place names from the first response a
// device ever saw, forever. These tests run public/sw-forage.js in a
// sandbox with fake Cache Storage and a fake network, and check each
// route's strategy, the caps, and that a version bump clears old caches.
//
//   node tests/sw-forage-verify.cjs

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'public', 'sw-forage.js'), 'utf8');

// ── Fakes ────────────────────────────────────────────────────────
class FakeCache {
  constructor() { this.map = new Map(); }
  async match(req) { const r = this.map.get(req.url); return r ? r.clone() : undefined; }
  async put(req, res) { this.map.delete(req.url); this.map.set(req.url, res); }
  async keys() { return [...this.map.keys()].map(url => ({ url })); }
  async delete(req) { return this.map.delete(req.url); }
  async addAll(reqs) { for (const r of reqs) this.map.set(r.url, new Response('shell')); }
}

function makeWorker(hostname = 'www.fungai.art') {
  const stores = new Map();
  const listeners = {};
  const net = { calls: [], offline: false, n: 0 };
  const caches = {
    async open(name) { if (!stores.has(name)) stores.set(name, new FakeCache()); return stores.get(name); },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
  const fetch = async (req) => {
    const url = typeof req === 'string' ? req : req.url;
    net.calls.push(url);
    if (net.offline) throw new TypeError('Failed to fetch');
    return new Response('body #' + (++net.n), { status: 200 });
  };
  const self = {
    location: new URL(`https://${hostname}/foraging/`),
    addEventListener: (type, fn) => { listeners[type] = fn; },
    skipWaiting: () => {},
    clients: { claim: async () => {} },
  };
  const sandbox = { self, caches, fetch, Request: class { constructor(url) { this.url = new URL(url, self.location).href; } },
    Response, URL, AbortController, setTimeout, clearTimeout, console };
  vm.runInNewContext(SRC, sandbox, { filename: 'sw-forage.js' });

  // Dispatch a fetch event → { handled, text }
  async function request(url, { method = 'GET', mode = 'cors', destination = '' } = {}) {
    const pending = [];
    let responded = null;
    const ev = {
      request: { url: new URL(url, self.location).href, method, mode, destination },
      respondWith(p) { responded = p; },
      waitUntil(p) { pending.push(p); },
    };
    listeners.fetch(ev);
    if (!responded) return { handled: false };
    const res = await responded;
    await Promise.all(pending);
    // A waitUntil can be added while another settles (trim after put).
    await Promise.all(pending);
    return { handled: true, text: await res.text(), status: res.status };
  }
  async function lifecycle(type) {
    const pending = [];
    listeners[type]({ waitUntil(p) { pending.push(p); } });
    await Promise.all(pending);
  }
  return { request, lifecycle, net, stores, caches };
}

const cases = [];
const t = (name, run) => cases.push({ name, run });
const calls = (w, part) => w.net.calls.filter(u => u.includes(part)).length;

// ── Live data ────────────────────────────────────────────────────
for (const api of ['/api/mushroom-observations?minLat=59&maxLat=60&minLng=15&maxLng=16', '/api/nutrient-fungi?minLat=59', '/api/reverse-geocode?lat=59.33&lng=18.07', '/api/forage-conditions?lat=59&lng=18']) {
  const name = api.split('?')[0];
  t(`${name}: a repeat request goes to the network, not the cache`, async () => {
    const w = makeWorker();
    const a = await w.request(api), b = await w.request(api);
    return { pass: a.handled && calls(w, name) === 2 && a.text !== b.text, detail: `network calls ${calls(w, name)}` };
  });
}

t('/api/*: offline falls back to the last good response', async () => {
  const w = makeWorker();
  const api = '/api/mushroom-observations?minLat=1';
  const online = await w.request(api);
  w.net.offline = true;
  const offline = await w.request(api);
  return { pass: offline.status === 200 && offline.text === online.text, detail: `offline → ${offline.status} "${offline.text}"` };
});

t('/api/*: offline with nothing cached answers 503 JSON, not a crash', async () => {
  const w = makeWorker(); w.net.offline = true;
  const r = await w.request('/api/gbif-observations?taxon=x');
  return { pass: r.status === 503 && /offline/.test(r.text), detail: `${r.status} ${r.text}` };
});

t('POST (MYCO) passes straight through, never cached', async () => {
  const w = makeWorker();
  const r = await w.request('/api/myco-forage', { method: 'POST' });
  return { pass: !r.handled, detail: r.handled ? 'intercepted' : 'not intercepted' };
});

// ── Static files ─────────────────────────────────────────────────
t('hashed /assets/* are cache-first', async () => {
  const w = makeWorker();
  await w.request('/assets/foraging-CIlq2IsS.js'); await w.request('/assets/foraging-CIlq2IsS.js');
  return { pass: calls(w, '/assets/') === 1, detail: `network calls ${calls(w, '/assets/')}` };
});

t('unhashed scripts (cookie banner) refresh in the background', async () => {
  const w = makeWorker();
  const a = await w.request('/cookie-banner.js');
  const b = await w.request('/cookie-banner.js');   // instant from cache, refresh fired
  const c = await w.request('/cookie-banner.js');   // now sees the refreshed copy
  return { pass: b.text === a.text && c.text !== a.text && calls(w, 'cookie-banner') === 3,
           detail: `served ${a.text} → ${b.text} → ${c.text}` };
});

t('page navigations are network-first', async () => {
  const w = makeWorker();
  const a = await w.request('/foraging/', { mode: 'navigate', destination: 'document' });
  const b = await w.request('/foraging/', { mode: 'navigate', destination: 'document' });
  return { pass: a.text !== b.text, detail: `${a.text} → ${b.text}` };
});

t('third-party requests (fonts, Supabase) are left to the browser', async () => {
  const w = makeWorker();
  const r = await w.request('https://fonts.googleapis.com/css2?family=Cormorant');
  return { pass: !r.handled, detail: r.handled ? 'intercepted' : 'not intercepted' };
});

// ── Tiles ────────────────────────────────────────────────────────
t('tiles are cache-first', async () => {
  const w = makeWorker();
  const tile = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/10/17';
  await w.request(tile); await w.request(tile);
  return { pass: calls(w, 'arcgisonline') === 1, detail: `network calls ${calls(w, 'arcgisonline')}` };
});

t('the tile cache is capped at 1500 (+10% between trims)', async () => {
  const w = makeWorker();
  for (let i = 0; i < 1700; i++) await w.request(`https://a.basemaps.cartocdn.com/dark_only_labels/9/${i}/1.png`);
  const store = [...w.stores.entries()].find(([k]) => k.startsWith('fungai-tiles-'));
  const n = store ? store[1].map.size : 0;
  return { pass: n >= 1500 && n <= 1650, detail: `${n} tiles kept after 1700 fetched (cap 1500, +10% between trims)` };
});

t('the API cache is capped at 200 (+10% between trims)', async () => {
  const w = makeWorker();
  for (let i = 0; i < 350; i++) await w.request(`/api/mushroom-observations?minLat=${i}`);
  const store = [...w.stores.entries()].find(([k]) => k.startsWith('fungai-api-'));
  const n = store ? store[1].map.size : 0;
  return { pass: n >= 200 && n <= 220, detail: `${n} responses kept after 350 fetched (cap 200, +10% between trims)` };
});

// ── Lifecycle + dev ──────────────────────────────────────────────
t('activating v4 deletes every v3 cache', async () => {
  const w = makeWorker();
  for (const old of ['fungai-forage-v3', 'fungai-api-v3', 'fungai-tiles-v3']) await w.caches.open(old);
  await w.lifecycle('install'); await w.lifecycle('activate');
  const left = [...w.stores.keys()].filter(k => k.endsWith('-v3'));
  return { pass: left.length === 0, detail: left.length ? 'left: ' + left.join(', ') : 'all v3 caches gone' };
});

t('on localhost the worker intercepts nothing (Vite dev modules stay fresh)', async () => {
  const w = makeWorker('localhost');
  const r1 = await w.request('/src/foraging/ForagingApp.tsx');
  const r2 = await w.request('/api/mushroom-observations?minLat=1');
  return { pass: !r1.handled && !r2.handled, detail: 'dev passthrough' };
});

// ── Run ──────────────────────────────────────────────────────────
(async () => {
  let passed = 0, failed = 0;
  console.log('\n  SW-FORAGE — live data stays live\n');
  for (const c of cases) {
    let r;
    try { r = await c.run(); } catch (e) { r = { pass: false, detail: e.stack || e.message }; }
    if (r.pass) { passed++; console.log('  ✓ ' + c.name + (r.detail ? '  — ' + r.detail : '')); }
    else        { failed++; console.log('  ✗ ' + c.name + (r.detail ? '  — ' + r.detail : '')); }
  }
  console.log('\n  passed: ' + passed + '\n  failed: ' + failed);
  process.exit(failed ? 1 : 0);
})();
