// netlify/functions/reverse-geocode.mjs
//
// AUDIT_FIX (Foraging audit · C-04, P0 · ship-blocking).
//
// Prior state: public/foraging client called BigDataCloud's
// reverse-geocode endpoint DIRECTLY from the browser, passing raw
// GPS coordinates:
//   https://api.bigdatacloud.net/data/reverse-geocode-client
//     ?latitude=59.32937501&longitude=18.06712384
//
// Two problems the audit called out:
//   1. Precise coords (5-decimal ≈ 1m accuracy) reach a third party
//      that has no relationship with the user — this is a privacy
//      leak the S-03 acknowledgement modal cannot cover because it
//      never named BigDataCloud as a processor.
//   2. No proxy layer means we can never swap the geocode provider,
//      change rounding policy, cache responses, or rate-limit abuse
//      without a client redeploy.
//
// This proxy fixes both:
//   · client hits /api/reverse-geocode?lat=…&lng=…
//   · server rounds coords to 2 decimals (~1 km granularity) BEFORE
//     forwarding to BigDataCloud — defence-in-depth even if the
//     client forgets to round
//   · server returns only { city, region, country } — nothing else
//     from the BigDataCloud payload leaks to the browser
//   · CORS locked to Fungai origins (matches reserve-formula pattern)
//   · request budget: 30 per IP per minute

const ALLOWED_ORIGINS = [
  'https://www.fungai.art',
  'https://fungai.art',
  'https://fungai-art.netlify.app',
  'http://localhost:5173',
  'http://localhost:8888',
  'http://127.0.0.1:5173',
];
function corsFor(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin':  allow,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Vary': 'Origin',
    'Cache-Control': 'public, max-age=3600', // 1h — city rarely changes at 1km granularity
  };
}

// Per-IP rate limit — 30/min. Same in-memory pattern as reserve-formula.
const RATE_WINDOW_MS      = 60_000;
const RATE_MAX_PER_WINDOW = 30;
const rateState = new Map();
function rateLimit(ip) {
  const now  = Date.now();
  const slot = rateState.get(ip);
  if (!slot || now - slot.windowStart > RATE_WINDOW_MS) {
    rateState.set(ip, { count: 1, windowStart: now });
    return { ok: true };
  }
  if (slot.count >= RATE_MAX_PER_WINDOW) {
    return { ok: false, retryAfter: Math.ceil((RATE_WINDOW_MS - (now - slot.windowStart)) / 1000) };
  }
  slot.count++;
  return { ok: true };
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, slot] of rateState.entries()) {
    if (now - slot.windowStart > RATE_WINDOW_MS * 2) rateState.delete(ip);
  }
}, RATE_WINDOW_MS).unref?.();

// Round to 2 decimals — ≈ 1.1 km at the equator, less at higher latitudes.
// Enough granularity to resolve city + region + country; not enough to
// identify a specific building or trailhead.
export function roundCoord(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  if (v < -180 || v > 180) return null;
  return Math.round(v * 100) / 100;
}

export default async function handler(req) {
  const origin = req.headers.get('origin') || '';
  const cors   = corsFor(origin);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'GET') return json({ error: 'GET only' }, 405, cors);

  const ip = (req.headers.get('x-nf-client-connection-ip')
           || (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim()
           || 'unknown').slice(0, 64);
  const rl = rateLimit(ip);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: 'Too many geocode requests.' }), {
      status: 429,
      headers: { ...cors, 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter || 60) },
    });
  }

  const url = new URL(req.url);
  const lat = roundCoord(url.searchParams.get('lat'));
  const lng = roundCoord(url.searchParams.get('lng'));
  if (lat === null || lng === null) {
    return json({ error: 'Invalid or missing lat/lng.' }, 400, cors);
  }

  try {
    const upstream = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client`
      + `?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { headers: { 'User-Agent': 'FungaiArt/foraging-map (contact: robin@fungai.art)' } },
    );
    if (!upstream.ok) {
      console.error('[reverse-geocode] upstream ' + upstream.status);
      return json({ city: null, region: null, country: null }, 200, cors);
    }
    const data = await upstream.json();
    // Return ONLY the minimum: city, region, country. Everything else
    // BigDataCloud sent (localityInfo tree, timezone, etc.) stays on
    // the server. Truncate to bounded lengths.
    const s = (v) => (typeof v === 'string' && v ? v.slice(0, 120) : null);
    return json({
      city:    s(data.city || data.locality
                || (data.localityInfo && data.localityInfo.administrative
                    && data.localityInfo.administrative[3]
                    && data.localityInfo.administrative[3].name)),
      region:  s(data.principalSubdivision),
      country: s(data.countryName),
      // Echo the rounded coords back so clients can display the
      // granularity honestly if they want to (e.g. "approx. 59.33°N, 18.07°E").
      approxLat: lat,
      approxLng: lng,
    }, 200, cors);
  } catch (e) {
    console.error('[reverse-geocode] fetch failed:', e && e.message || e);
    return json({ city: null, region: null, country: null }, 200, cors);
  }
}

function json(body, status = 200, cors = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
