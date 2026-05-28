// Fungai Art Foraging Map — Service Worker
// v3 — fixes the "only works in incognito" bug: navigation/HTML is now network-first
// so a fresh deploy can never get masked by a stale cached shell. Hashed Vite assets
// stay cache-first (URL changes per build, so this is safe).
const VERSION = 'v3';
const CACHE = `fungai-forage-${VERSION}`;
const TILE_CACHE = `fungai-tiles-${VERSION}`;
const API_CACHE = `fungai-api-${VERSION}`;

const SHELL = [
  '/fungai-art-logo.png',
  '/fonts/TAN-PARADISO.ttf',
  '/fonts/Kiona-Regular.ttf',
];

const TILE_ORIGINS = [
  'basemaps.cartocdn.com',
  'server.arcgisonline.com',
  'a.tile.openstreetmap.org',
  'b.tile.openstreetmap.org',
  'c.tile.openstreetmap.org',
];

const API_PATHS = ['/api/forage-conditions', '/api/gbif-observations'];

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
  const url = new URL(request.url);

  // 1. Tiles → cache-first (URL is the cache key, tiles never change)
  if (TILE_ORIGINS.some(o => url.hostname.includes(o))) {
    e.respondWith(tileStrategy(request));
    return;
  }

  // 2. API → network-first (we want fresh seasonal/observation data)
  if (API_PATHS.some(p => url.pathname.startsWith(p))) {
    e.respondWith(networkFirst(request, API_CACHE, 5000));
    return;
  }

  // 3. Navigation / HTML → NETWORK-FIRST. This is the critical fix:
  //    a cached shell would otherwise pin the user to an old bundle forever.
  if (request.mode === 'navigate' || (request.destination === 'document')) {
    e.respondWith(networkFirst(request, CACHE, 4000));
    return;
  }

  // 4. Same-origin hashed assets (/assets/*, fonts, images) → cache-first.
  //    Safe because Vite hashes filenames — a new build means a new URL.
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
    if (response.ok) cache.put(request, response.clone());
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
