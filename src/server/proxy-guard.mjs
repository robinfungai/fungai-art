// src/server/proxy-guard.mjs
//
// One guard for the public data proxies behind the foraging map:
// mushroom-observations, nutrient-fungi, gbif-observations and
// forage-conditions. Before this, all four answered any caller with
// `Access-Control-Allow-Origin: *` and no rate limit, so any site or
// script could run GBIF / iNaturalist / Open-Meteo lookups on Fungai's
// Netlify function quota.
//
// Same rules the MYCO and reverse-geocode functions already use:
//   · CORS names only Fungai origins (never `*`)
//   · a request that carries a foreign Origin header is refused (403)
//   · a request with NO Origin header is allowed — browsers omit it on
//     same-origin GETs, which is exactly how the map calls these
//   · per-IP rate limit, in memory per warm function instance
//   · refusals are `no-store`, so the CDN never caches a 403 or 429
//
// The limit is deliberately generous (120/min). A full event room can sit
// behind one venue Wi-Fi IP, and a real person panning the map fires one
// request per pan. The limit exists to stop scripted bulk use.
//
// Works with both Netlify handler styles:
//   v1  export const handler = async (event) => { const g = guard.event(event); if (g.response) return g.response; … }
//   v2  export default async (req) => { const g = guard.request(req); if (g.response) return g.response; … }

export const ALLOWED_ORIGINS = [
  'https://www.fungai.art',
  'https://fungai.art',
  'https://fungai-art.netlify.app',
  'http://localhost:5173',
  'http://localhost:8888',
  'http://127.0.0.1:5173',
];

const WINDOW_MS = 60_000;

export function corsHeaders(origin, methods = 'GET, OPTIONS') {
  return {
    'Access-Control-Allow-Origin':  ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': methods,
    'Vary': 'Origin',
  };
}

export function createGuard({ name = 'proxy', maxPerMinute = 120, methods = 'GET, OPTIONS' } = {}) {
  const hits = new Map();
  let sweptAt = 0;

  function withinLimit(ip, now) {
    // Lazy sweep instead of setInterval: no timer keeps the instance busy.
    if (now - sweptAt > WINDOW_MS) {
      for (const [k, slot] of hits) if (now - slot.start > WINDOW_MS) hits.delete(k);
      sweptAt = now;
    }
    const slot = hits.get(ip);
    if (!slot || now - slot.start > WINDOW_MS) { hits.set(ip, { start: now, count: 1 }); return { ok: true }; }
    if (slot.count >= maxPerMinute) return { ok: false, retryAfter: Math.max(1, Math.ceil((WINDOW_MS - (now - slot.start)) / 1000)) };
    slot.count++;
    return { ok: true };
  }

  // → { cors, deny } where deny is null or { status, body, extra }
  function decide(method, origin, ip) {
    const cors = corsHeaders(origin, methods);
    if (method === 'OPTIONS') return { cors, deny: { status: 204, body: '' } };
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return { cors, deny: { status: 403, body: JSON.stringify({ error: 'Origin not allowed.' }) } };
    }
    const rl = withinLimit(ip || 'unknown', Date.now());
    if (!rl.ok) {
      console.warn(`[${name}] rate limit hit for ${String(ip).slice(0, 24)}`);
      return { cors, deny: { status: 429, body: JSON.stringify({ error: 'Too many requests. Try again in a minute.' }), extra: { 'Retry-After': String(rl.retryAfter) } } };
    }
    return { cors, deny: null };
  }

  const denyHeaders = (cors, deny) => ({
    ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...(deny.extra || {}),
  });

  return {
    // Netlify v1 — event.headers keys arrive lower-cased, but don't rely on it.
    event(event) {
      const h = {};
      for (const [k, v] of Object.entries(event?.headers || {})) h[k.toLowerCase()] = v;
      const ip = h['x-nf-client-connection-ip'] || (h['x-forwarded-for'] || '').split(',')[0].trim();
      const { cors, deny } = decide(event?.httpMethod || 'GET', h.origin || '', ip);
      return { cors, response: deny ? { statusCode: deny.status, headers: denyHeaders(cors, deny), body: deny.body } : null };
    },
    // Netlify v2 — a Fetch API Request.
    request(req) {
      const ip = req.headers.get('x-nf-client-connection-ip') || (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
      const { cors, deny } = decide(req.method || 'GET', req.headers.get('origin') || '', ip);
      return { cors, response: deny ? new Response(deny.body || null, { status: deny.status, headers: denyHeaders(cors, deny) }) : null };
    },
  };
}
