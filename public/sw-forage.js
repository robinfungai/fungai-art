// Fungai Art Foraging Map — Service Worker
// Offline-first strategy: cache map tiles + app shell, network-first for live APIs
const CACHE = 'fungai-forage-v2';
const TILE_CACHE = 'fungai-tiles-v2';
const API_CACHE = 'fungai-api-v2';

// App shell — pre-cache on install
const SHELL = [
  '/foraging',
  '/foraging/',
  '/fungai-art-logo.png',
  '/fonts/TAN-PARADISO.ttf',
  '/fonts/Kiona-Regular.ttf',
];

// Tile hosts to cache aggressively (map rendering offline)
const TILE_ORIGINS = [
  'basemaps.cartocdn.com',
  'server.arcgisonline.com',
  'a.tile.openstreetmap.org',
  'b.tile.openstreetmap.org',
  'c.tile.openstreetmap.org',
];

// API routes — network-first, fall back to cache
const API_PATHS = ['/api/forage-conditions', '/api/gbif-observations'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()) // don't block install if shell fetch fails
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

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Map tiles — cache-first, 7-day TTL
  if (TILE_ORIGINS.some(o => url.hostname.includes(o))) {
    e.respondWith(tileStrategy(request));
    return;
  }

  // API calls — network-first with 5s timeout, fallback to cache
  if (API_PATHS.some(p => url.pathname.startsWith(p))) {
    e.respondWith(networkFirst(request, API_CACHE, 5000));
    return;
  }

  // App shell / assets — cache-first
  if (url.origin === self.location.origin) {
    e.respondWith(cacheFirst(request, CACHE));
    return;
  }
});

// ── Strategies ────────────────────────────────────────────────────────────

async function tileStrategy(request) {
  const cache = await caches.open(TILE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      cache.put(request, clone);
    }
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
    return new Response(
      JSON.stringify({ offline: true }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function networkFirst(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeout);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    clearTimeout(timeout);
    const cached = await cache.match(request);
    return cached || new Response(
      JSON.stringify({ offline: true, cached: false }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
