// Fungai Art Foraging Map — Service Worker
//
// v4 (2026-09-19) — live data is live again.
//   v3 sent every same-origin request it didn't recognise to cache-first,
//   and only two API paths were listed as network-first. So fungal
//   sightings, the nutrient layer and place names were served from the
//   first response a device ever saw, forever — and so were unhashed
//   site scripts like /cookie-banner.js. v4:
//     · every /api/* GET is network-first; the cache is only the offline fallback
//     · cache-first only for files whose URL changes when they do
//       (Vite's hashed /assets/*) and the fonts
//     · everything else same-origin: stale-while-revalidate
//     · non-GET requests (MYCO's POST) pass straight through, never cached
//     · tile + API caches are capped so storage can't grow without bound
//     · on localhost the worker steps aside so it never pins dev modules
//   Bumping VERSION makes `activate` delete every v3 cache, stale data included.
//
// v3 — navigation/HTML network-first, so a fresh deploy can never get
//   masked by a stale cached shell (the "only works in incognito" bug).
const VERSION = 'v4';
const CACHE = `fungai-forage-${VERSION}`;
const TILE_CACHE = `fungai-tiles-${VERSION}`;
const API_CACHE = `fungai-api-${VERSION}`;

// Caps are entry counts, trimmed oldest-first. ~1500 raster tiles is
// roughly 30–60 MB — enough for the areas someone actually forages.
const MAX_TILES = 1500;
const MAX_API_RESPONSES = 200;
// Trim after every ~10% of the cap in new entries (cache.keys() is not
// free), so a cache overshoots its cap by at most 10% between trims.

const SHELL = [
  '/fungai-art-logo.png',
  '/fonts/TAN-PARADISO.ttf',
  '/fonts/Kiona-Regular.ttf',
];

// Raster tile hosts cached for offline use. The licensed ArcGIS Basemap
// Styles hosts are deliberately NOT listed: their terms govern caching,
// so they stay on the browser's normal HTTP cache.
const TILE_ORIGINS = [
  'basemaps.cartocdn.com',
  'server.arcgisonline.com',
  'a.tile.openstreetmap.org',
  'b.tile.openstreetmap.org',
  'c.tile.openstreetmap.org',
];

// Files whose content never changes under the same URL.
const IMMUTABLE = /^\/(assets|fonts)\//;

const IS_DEV = ['localhost', '127.0.0.1'].includes(self.location.hostname);

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE && k !== TILE_CACHE && k !== API_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Allow the page to nudge the SW to skipWaiting on demand (used by a tiny inline updater)
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const { request } = e;

  // Vite dev serves unhashed modules that change on every save — caching
  // them is how "my fix doesn't show up locally" happens. Step aside.
  if (IS_DEV) return;

  // Only GETs are cacheable. MYCO's POST and anything else go straight out.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. Map tiles → cache-first (tile URLs are stable), capped.
  if (TILE_ORIGINS.some(o => url.hostname.includes(o))) {
    e.respondWith(tileStrategy(request, e));
    return;
  }

  // Other third parties (fonts, Supabase, Stripe, ArcGIS) → browser default.
  if (url.origin !== self.location.origin) return;

  // 2. Our API → network-first. Fresh sightings, conditions and places;
  //    the last good response only answers when the network can't.
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(networkFirst(request, API_CACHE, 5000, e));
    return;
  }

  // 3. Navigation / HTML → network-first, so a deploy is never masked.
  if (request.mode === 'navigate' || request.destination === 'document') {
    e.respondWith(networkFirst(request, CACHE, 4000, e));
    return;
  }

  // 4. Hashed build assets + fonts → cache-first (new build = new URL).
  if (IMMUTABLE.test(url.pathname)) {
    e.respondWith(cacheFirst(request, CACHE));
    return;
  }

  // 5. Everything else same-origin (logo, manifest, /cookie-banner.js …)
  //    → serve the cached copy instantly, refresh it in the background.
  e.respondWith(staleWhileRevalidate(request, CACHE, e));
});

// ── Strategies ────────────────────────────────────────────────────────────

// Always called inside event.waitUntil(), so the worker stays alive
// until the put (and any trim) finishes.
const putCounts = {};
async function putAndMaybeTrim(cacheName, request, response, max) {
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
  putCounts[cacheName] = (putCounts[cacheName] || 0) + 1;
  if (max && putCounts[cacheName] % Math.max(10, Math.round(max / 10)) === 0) await trimCache(cacheName, max);
}

// Oldest entries first — Cache Storage keeps insertion order.
async function trimCache(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function tileStrategy(request, event) {
  const cache = await caches.open(TILE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) event.waitUntil(putAndMaybeTrim(TILE_CACHE, request, response.clone(), MAX_TILES));
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName, event) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then(response => {
      if (response.ok) return cache.put(request, response.clone()).then(() => response);
      return response;
    })
    .catch(() => null);
  if (cached) {
    event.waitUntil(refresh);
    return cached;
  }
  return (await refresh) || new Response('', { status: 503 });
}

async function networkFirst(request, cacheName, timeoutMs, event) {
  const cache = await caches.open(cacheName);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeout);
    if (response.ok) {
      const max = cacheName === API_CACHE ? MAX_API_RESPONSES : 0;
      event.waitUntil(putAndMaybeTrim(cacheName, request, response.clone(), max));
    }
    return response;
  } catch {
    clearTimeout(timeout);
    const cached = await cache.match(request);
    return cached || new Response(
      request.mode === 'navigate'
        ? '<!doctype html><meta charset=utf-8><title>Fungai Art · Offline</title><body style="background:#070d0b;color:#cfd6c5;font-family:Georgia,serif;padding:48px;text-align:center"><h1 style="font-style:italic">Offline.</h1><p>The forest is quiet. Reconnect and refresh.</p>'
        : JSON.stringify({ offline: true, cached: false }),
      {
        status: 503,
        headers: { 'Content-Type': request.mode === 'navigate' ? 'text/html' : 'application/json' },
      }
    );
  }
}
