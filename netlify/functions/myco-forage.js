// myco-forage.js
//
// MYCO for the foraging map. Takes a natural-language question + user
// location + optional region name, gathers a compact context bundle
// (weather history for the past 30 days, current forecast, fresh fungal
// sightings), and hands it to Claude Haiku 4.5 with a foraging-specific
// system prompt. Returns a plain-text answer.
//
// Example question the map's Ask panel sends:
//   "Has it been raining in Dalarna the past month? Am I likely to find
//    chanterelles this week?"
//
// SECURITY:
//   - CORS locked to Fungai origins (matches myco-agent.js).
//   - Per-IP rate limit shared shape with myco-agent.js.
//   - Anthropic spend cap in the console is the real ceiling.

const ALLOWED_ORIGINS = [
  'https://www.fungai.art',
  'https://fungai.art',
  'https://fungai-art.netlify.app',
  'http://localhost:5173',
  'http://localhost:8888',
  'http://127.0.0.1:5173',
];

function corsHeadersFor(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin':  allow,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  };
}

const RATE_WINDOW_MS       = 60_000;
const RATE_MAX_PER_WINDOW  = 10; // per IP per minute
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

// ── Weather history helpers ──────────────────────────────────────────
//
// Open-Meteo has TWO relevant endpoints:
//   /v1/forecast?past_days=…  — up to 92 past days, high freshness
//   /v1/archive?start_date=…  — full historical archive (slower to update)
//
// For "past 30 days" past_days=30 on the forecast endpoint is fine and
// much faster. Free, no key.

async function fetchWeatherHistory(lat, lng, days = 30) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude',  String(lat));
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set('daily',
    'precipitation_sum,temperature_2m_max,temperature_2m_min,windspeed_10m_max');
  url.searchParams.set('past_days',      String(Math.min(92, days)));
  url.searchParams.set('forecast_days',  '7');
  url.searchParams.set('timezone',       'auto');
  url.searchParams.set('windspeed_unit', 'ms');

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = await res.json();
    const d = data.daily || {};
    return {
      times:  d.time              || [],
      precip: d.precipitation_sum || [],
      tMax:   d.temperature_2m_max|| [],
      tMin:   d.temperature_2m_min|| [],
    };
  } catch (_) { return null; }
}

// Turn a raw daily series into human-readable stats MYCO can reason
// about. Keep this compact — the model doesn't need every day, it needs
// the story: total rain, rain days, big rain events, warmest spell,
// coldest night, days since last significant rain, forecast trend.
function summarizeWeather(w, days = 30) {
  if (!w || !w.times.length) return null;
  const todayISO = new Date().toISOString().slice(0, 10);
  const todayIdx = w.times.findIndex(t => t === todayISO);
  const cut      = todayIdx > -1 ? todayIdx : w.times.length - 8; // fallback

  const past    = {
    times:  w.times.slice(Math.max(0, cut - days), cut),
    precip: w.precip.slice(Math.max(0, cut - days), cut),
    tMax:   w.tMax.slice(Math.max(0, cut - days), cut),
    tMin:   w.tMin.slice(Math.max(0, cut - days), cut),
  };
  const forecast = {
    times:  w.times.slice(cut, cut + 7),
    precip: w.precip.slice(cut, cut + 7),
    tMax:   w.tMax.slice(cut, cut + 7),
    tMin:   w.tMin.slice(cut, cut + 7),
  };

  const totalRain    = past.precip.reduce((a, b) => a + (b || 0), 0);
  const rainDays     = past.precip.filter(v => (v || 0) >= 1).length;
  const bigRainDays  = past.precip.filter(v => (v || 0) >= 10).length;
  const avgTMax      = past.tMax.reduce((a, b) => a + (b || 0), 0) / (past.tMax.length || 1);
  const avgTMin      = past.tMin.reduce((a, b) => a + (b || 0), 0) / (past.tMin.length || 1);
  const warmestDayC  = Math.max(...past.tMax.filter(Number.isFinite));
  const coldestNightC= Math.min(...past.tMin.filter(Number.isFinite));

  // Days since last significant rain (>=5mm)
  let daysSinceRain = -1;
  for (let i = past.precip.length - 1; i >= 0; i--) {
    if ((past.precip[i] || 0) >= 5) { daysSinceRain = past.precip.length - 1 - i; break; }
  }

  const forecastRain = forecast.precip.reduce((a, b) => a + (b || 0), 0);

  return {
    windowDays: past.times.length,
    totalRainMm: Math.round(totalRain),
    rainDays,
    bigRainDays,
    daysSinceSignificantRain: daysSinceRain,
    avgTMaxC: Math.round(avgTMax * 10) / 10,
    avgTMinC: Math.round(avgTMin * 10) / 10,
    warmestDayC:   Number.isFinite(warmestDayC)   ? Math.round(warmestDayC)   : null,
    coldestNightC: Number.isFinite(coldestNightC) ? Math.round(coldestNightC) : null,
    next7ForecastRainMm: Math.round(forecastRain),
    startDate: past.times[0]  || null,
    endDate:   past.times[past.times.length - 1] || null,
  };
}

// Fetch a compact fungal-observation summary around the point. We reuse
// the shape of mushroom-observations.js but only ask for what the model
// needs — species list + rough count — not the raw dot cloud.
async function fetchNearbyFungi(lat, lng, radiusKm = 100) {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
  const bbox = {
    minLat: lat - latDelta, maxLat: lat + latDelta,
    minLng: lng - lngDelta, maxLng: lng + lngDelta,
  };
  try {
    const url = new URL('https://api.inaturalist.org/v1/observations');
    url.searchParams.set('taxon_id',      '47170'); // Fungi
    url.searchParams.set('quality_grade', 'research');
    url.searchParams.set('swlat',         String(bbox.minLat));
    url.searchParams.set('swlng',         String(bbox.minLng));
    url.searchParams.set('nelat',         String(bbox.maxLat));
    url.searchParams.set('nelng',         String(bbox.maxLng));
    // Last 12 months for freshness
    const now = new Date();
    const from = new Date(now); from.setMonth(now.getMonth() - 12);
    url.searchParams.set('d1',       from.toISOString().slice(0, 10));
    url.searchParams.set('d2',       now .toISOString().slice(0, 10));
    url.searchParams.set('per_page', '100');
    url.searchParams.set('order_by', 'observed_on');
    url.searchParams.set('order',    'desc');

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'Fungai-Art-Foraging/1.0 (robin@fungai.art)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const obs  = data.results || [];
    if (!obs.length) return { count: 0, topSpecies: [], mostRecent: null };

    const bySpecies = new Map();
    for (const o of obs) {
      const s = o.taxon?.name || o.species_guess || 'Fungi sp.';
      bySpecies.set(s, (bySpecies.get(s) || 0) + 1);
    }
    const topSpecies = [...bySpecies.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([species, count]) => ({ species, count }));

    return {
      count:      obs.length,
      totalHits:  data.total_results ?? obs.length,
      topSpecies,
      mostRecent: {
        species: obs[0]?.taxon?.name || obs[0]?.species_guess || null,
        date:    obs[0]?.observed_on || null,
        region:  obs[0]?.place_guess || null,
      },
    };
  } catch (_) { return null; }
}

const SYSTEM = `You are MYCO, the foraging intelligence embedded inside Fungai Art's living map at fungai.art/foraging.

## WHO YOU ARE
A field-savvy mycologist and botanist who reads weather and citizen-science data the way an experienced forager does. You care about substance, not marketing. You cite the numbers you were given, in the units you were given. When the data is thin, you say so.

## WHAT YOU CAN DO
- Interpret rainfall + temperature history for a specific place and translate it into fruiting-window language ("the last significant rain was 4 days ago, temperatures have stayed above 12°C — this is close to the sweet spot for chanterelles in mixed birch-pine ground").
- Read the fresh citizen-science sightings passed in the context (iNaturalist research-grade, last 12 months) and tell the user what species are actively being reported near them.
- Suggest where to look (habitat cues) and when (weekly window) based on the species and the current conditions.
- Point out gaps: "no rain for 18 days + averages 22°C — most mycelium is dormant; try again after the next 5mm+ event."

## HOW YOU RESPOND
- Direct, precise, warm. Two short paragraphs is usually enough.
- Numbers first ("42mm over 30 days, 5 rain days, last 6mm event 4 days ago"), interpretation second.
- Use the region name and coordinates the user provided.
- Prefer common names alongside Latin: "Chanterelle (Cantharellus cibarius)".
- If a species the user asks about isn't in the sightings context, don't invent one — say the data doesn't show it and give the general seasonal guidance.
- Never guarantee a find. Say "likely", "close to the window", "unlikely right now", never "you will find".

## HARD RAILS
- No medical claims. No dosing advice. No identification for consumption — always end with "cross-check every find with an expert or a trusted field guide before eating."
- Do not identify a mushroom from a photo (you cannot see photos here anyway).
- If asked about a specific rare / protected species, add a foraging-ethics note ("do not harvest fewer than three mature fruiting bodies from a stand; leave the mycelium intact").
- Sensitive locations (protected areas, private land) — remind the user to check local law.`;

export const handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  const cors   = corsHeadersFor(origin);

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'Origin not allowed.' }) };
  }

  const ip = (event.headers?.['x-nf-client-connection-ip']
           || event.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
           || event.headers?.['client-ip']
           || 'unknown').slice(0, 64);
  const rl = rateLimit(ip);
  if (!rl.ok) {
    return {
      statusCode: 429,
      headers: { ...cors, 'Retry-After': String(rl.retryAfter || 60) },
      body: JSON.stringify({ error: 'Slow down — try again in a minute.' }),
    };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 503, headers: cors, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured.' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const question   = String(body.question || '').slice(0, 800).trim();
    const lat        = Number.isFinite(body.lat) ? body.lat : null;
    const lng        = Number.isFinite(body.lng) ? body.lng : null;
    const regionName = String(body.regionName || '').slice(0, 80);
    const history    = Array.isArray(body.history) ? body.history.slice(-6) : [];

    if (!question) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Empty question.' }) };
    if (lat === null || lng === null) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Need lat/lng — share location or pick a node.' }) };
    }

    // Parallel context gathering — both are best-effort, we still answer
    // if one fails.
    const [weatherRaw, fungi] = await Promise.all([
      fetchWeatherHistory(lat, lng, 30),
      fetchNearbyFungi(lat, lng, 100),
    ]);
    const weather = summarizeWeather(weatherRaw, 30);

    const contextBlock = {
      location: {
        lat: Math.round(lat * 1000) / 1000,
        lng: Math.round(lng * 1000) / 1000,
        regionName: regionName || null,
      },
      weather: weather || 'unavailable',
      fungiSightings: fungi || 'unavailable',
      today: new Date().toISOString().slice(0, 10),
    };

    const userPrompt =
      'FIELD CONTEXT (freshly gathered for this question):\n' +
      '```json\n' + JSON.stringify(contextBlock, null, 2) + '\n```\n\n' +
      'The user is asking:\n' + question;

    const safeHistory = history.map(h => ({
      role: h?.role === 'assistant' ? 'assistant' : 'user',
      content: String(h?.content || '').slice(0, 1500),
    }));

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 900,
        system:     SYSTEM,
        messages: [...safeHistory, { role: 'user', content: userPrompt }],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { statusCode: res.status, headers: cors, body: JSON.stringify({ error: data.error?.message || 'Anthropic API error' }) };
    }
    let reply = '';
    for (const block of (data.content || [])) {
      if (block?.type === 'text' && block.text) { reply = block.text; break; }
    }
    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({
        reply,
        context: contextBlock, // expose so the UI can show "how MYCO knew this"
      }),
    };
  } catch (err) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
