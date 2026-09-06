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

// ── Location extraction from free-text question ──────────────────────
//
// The region-name input is sticky — if the user first asks "what's at
// Lago di Garda?" and then types "and what about Säter, Sweden?", the
// input still says Lago di Garda. Server should notice the new mention
// in the question and jump.
//
// Two extraction passes:
//   1. Coordinates: "61.5°N, 15.6°E" / "45.734, 10.582" — high-
//      precision regex, unambiguous.
//   2. Named place: after prepositions (in / at / near / around /
//      about / for) grab the next capitalised chunk + optional
//      ", country" tail. Case-insensitive so lowercase "sweden" is
//      still picked up.
//
// The extracted string is then passed to Nominatim; if geocoding
// succeeds the question's mention wins over the region field. If not,
// we fall back gracefully.
function extractLocationFromQuestion(question) {
  if (!question) return null;
  const q = question.trim();

  // ── Coordinates ──
  // With hemispheres: "61.5°N, 15.6°E"
  const dmsMatch = q.match(/(-?\d{1,3}(?:\.\d+)?)\s*°?\s*([NS])[\s,°]+(-?\d{1,3}(?:\.\d+)?)\s*°?\s*([EW])/i);
  if (dmsMatch) {
    let lat = parseFloat(dmsMatch[1]);
    let lng = parseFloat(dmsMatch[3]);
    if (dmsMatch[2].toUpperCase() === 'S') lat = -lat;
    if (dmsMatch[4].toUpperCase() === 'W') lng = -lng;
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { type: 'coords', lat, lng, source: 'question-coords' };
    }
  }
  // Plain "lat, lng"
  const plain = q.match(/(-?\d{1,2}\.\d{2,})\s*,\s*(-?\d{1,3}\.\d{2,})/);
  if (plain) {
    const lat = parseFloat(plain[1]);
    const lng = parseFloat(plain[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { type: 'coords', lat, lng, source: 'question-coords' };
    }
  }

  // ── Named place after preposition ──
  // Support diacritics (Säter, Örebro, Åre) and simple hyphens
  // (Stratford-upon-Avon). Case-insensitive on the trigger word so
  // "in Säter" and "In Säter" both match; the extracted place is
  // used verbatim so Nominatim keeps case for its own scoring.
  const prep = q.match(/\b(?:in|at|near|around|about|for)\s+([A-Za-zÀ-ÖØ-öø-ÿ][\w\-''\s]{1,60}?)(?=\s+(?:right now|today|this|now|during|in the|is|are|has|have|been|was|were|be|going|please|thanks|thank you|for the|for a|for me|to be|\?|\.|!)|\s*(?:,\s*)?(?:sweden|norway|denmark|finland|germany|deutschland|italy|italia|france|spain|espana|portugal|greece|austria|switzerland|schweiz|netherlands|belgium|ireland|scotland|england|wales|uk|usa|us|canada|mexico|japan|india|thailand|indonesia|vietnam|china|russia|brazil|argentina|australia|new zealand)\b|$)/i);
  if (prep) {
    let name = prep[1].trim().replace(/\s+/g, ' ');
    // Look for a ", country" tail immediately after the match
    const rest = q.slice((prep.index || 0) + prep[0].length);
    const countryTail = rest.match(/^\s*,?\s*([A-Za-zÀ-ÖØ-öø-ÿ][\w\s]{1,30}?)(?:[\?\.!,]|$|\s+(?:right now|today|this|now))/i);
    if (countryTail && countryTail[1].length < 30 && !/^(right now|today|this|now|for|please)$/i.test(countryTail[1].trim())) {
      name += ', ' + countryTail[1].trim();
    }
    // Reject 1-char / all-lowercase noise
    if (name.length >= 3 && /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(name)) {
      return { type: 'name', name, source: 'question-name' };
    }
  }
  return null;
}

// ── Forward geocoder ─────────────────────────────────────────────────
//
// The user's `regionName` field ("Lago di Garda, Italy", "Östersund",
// "Dalarna", "Sinai peninsula") should be authoritative — MYCO should
// answer about THAT place, not about wherever the user's GPS happens
// to be. Free geocoders:
//   - Nominatim (OpenStreetMap) — best fuzzy named-place resolver,
//     handles multiple languages, no API key. Terms of use: set a
//     descriptive User-Agent, respect ~1 req/sec.
//   - BigDataCloud — CORS-enabled, no key, reverse-geocode is great
//     but forward-geocode is weaker for arbitrary named places.
//
// Nominatim it is. Best-effort — if it fails we fall back to whatever
// coords the client sent.
async function forwardGeocode(name) {
  if (!name) return null;
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', name);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '1');
  try {
    const res = await fetch(url.toString(), {
      headers: {
        // Nominatim requires a descriptive UA identifying the app +
        // contact address so they can email if the app misbehaves.
        'User-Agent': 'Fungai-Art-Foraging/1.0 (robin@fungai.art)',
        'Accept-Language': 'en',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return null;
    const hit = data[0];
    return {
      lat:          parseFloat(hit.lat),
      lng:          parseFloat(hit.lon),
      // The canonical name from the geocoder — often more precise
      // than what the user typed ("Lake Garda, Italy" vs their
      // "Lago di Garda in Italy"). We use this in the model context
      // and return it to the client for its own display.
      canonicalName: hit.display_name || name,
      type:          hit.type || null,
      // BoundingBox format from Nominatim: [south, north, west, east].
      // We rewrap to the shape mushroom-observations expects.
      bbox:          Array.isArray(hit.boundingbox) && hit.boundingbox.length === 4 ? {
        minLat: parseFloat(hit.boundingbox[0]),
        maxLat: parseFloat(hit.boundingbox[1]),
        minLng: parseFloat(hit.boundingbox[2]),
        maxLng: parseFloat(hit.boundingbox[3]),
      } : null,
    };
  } catch (_) { return null; }
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

// ── Nearby PLANTS (iNaturalist, last 12 months, research-grade) ──────
//
// Symmetric to fetchNearbyFungi but for Kingdom Plantae. iNat's
// iconic_taxa=Plantae filter covers all plants; the topSpecies
// aggregation surfaces the most-reported ones, which tends to
// correlate with "notable / forageable" — garden ornamentals rarely
// dominate a wild-area feed, while nettles, elderflower, chanterelle,
// wild garlic, bilberry, wild raspberry, meadowsweet, etc. do.
async function fetchNearbyPlants(lat, lng, radiusKm = 100) {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
  const bbox = {
    minLat: lat - latDelta, maxLat: lat + latDelta,
    minLng: lng - lngDelta, maxLng: lng + lngDelta,
  };
  try {
    const url = new URL('https://api.inaturalist.org/v1/observations');
    url.searchParams.set('iconic_taxa',  'Plantae');
    url.searchParams.set('quality_grade','research');
    url.searchParams.set('swlat',        String(bbox.minLat));
    url.searchParams.set('swlng',        String(bbox.minLng));
    url.searchParams.set('nelat',        String(bbox.maxLat));
    url.searchParams.set('nelng',        String(bbox.maxLng));
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
    const commonNames = new Map();
    for (const o of obs) {
      const s = o.taxon?.name || o.species_guess || 'Plantae sp.';
      bySpecies.set(s, (bySpecies.get(s) || 0) + 1);
      if (o.taxon?.preferred_common_name && !commonNames.has(s)) {
        commonNames.set(s, o.taxon.preferred_common_name);
      }
    }
    const topSpecies = [...bySpecies.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([species, count]) => ({
        species,
        commonName: commonNames.get(species) || null,
        count,
      }));

    return {
      count:      obs.length,
      totalHits:  data.total_results ?? obs.length,
      topSpecies,
      mostRecent: {
        species:    obs[0]?.taxon?.name || obs[0]?.species_guess || null,
        commonName: obs[0]?.taxon?.preferred_common_name || null,
        date:       obs[0]?.observed_on || null,
        region:     obs[0]?.place_guess || null,
      },
    };
  } catch (_) { return null; }
}

// ── Seasonal historical baseline (GBIF) ──────────────────────────────
//
// "What is typically fruiting here in September?" is a different
// question than "what's been reported in the last month." This queries
// GBIF's full historical archive of Kingdom Fungi observations for the
// SAME MONTH across the last N years in the bbox, giving MYCO a
// seasonal-baseline read that the recent-data query alone can't give.
async function fetchSeasonalBaseline(lat, lng, radiusKm = 100, yearsBack = 3) {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const yearFrom = now.getFullYear() - yearsBack;
  const yearTo   = now.getFullYear() - 1; // exclude the current year (that's what fetchNearbyFungi covers)

  const url = new URL('https://api.gbif.org/v1/occurrence/search');
  url.searchParams.set('hasCoordinate',      'true');
  url.searchParams.set('hasGeospatialIssue', 'false');
  url.searchParams.set('taxonKey',           '5'); // Kingdom Fungi
  url.searchParams.set('decimalLatitude',    `${lat - latDelta},${lat + latDelta}`);
  url.searchParams.set('decimalLongitude',   `${lng - lngDelta},${lng + lngDelta}`);
  url.searchParams.set('year',               `${yearFrom},${yearTo}`);
  url.searchParams.set('month',              String(thisMonth));
  url.searchParams.set('limit',              '300');

  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'Fungai-Art-Foraging/1.0 (robin@fungai.art)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const obs  = data.results || [];
    if (!obs.length) return { yearsBack, month: thisMonth, count: 0, topSpecies: [] };

    const bySpecies = new Map();
    for (const o of obs) {
      const s = o.species || o.scientificName || 'Fungi sp.';
      bySpecies.set(s, (bySpecies.get(s) || 0) + 1);
    }
    const topSpecies = [...bySpecies.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([species, count]) => ({ species, count }));

    return {
      yearsBack,
      month:     thisMonth,
      count:     obs.length,
      totalHits: data.count ?? obs.length,
      topSpecies,
    };
  } catch (_) { return null; }
}

// Seasonal baseline for PLANTS (GBIF Kingdom Plantae, taxonKey=6).
// Same shape as the fungi baseline. Kingdom Plantae is broader than
// Fungi and includes trees / grasses / ornamentals; the topSpecies
// aggregation still surfaces what people actually observe, which
// heavily biases toward wild / notable species in wilder bboxes.
async function fetchSeasonalBaselinePlants(lat, lng, radiusKm = 100, yearsBack = 3) {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const yearFrom = now.getFullYear() - yearsBack;
  const yearTo   = now.getFullYear() - 1;

  const url = new URL('https://api.gbif.org/v1/occurrence/search');
  url.searchParams.set('hasCoordinate',      'true');
  url.searchParams.set('hasGeospatialIssue', 'false');
  url.searchParams.set('taxonKey',           '6'); // Kingdom Plantae
  url.searchParams.set('decimalLatitude',    `${lat - latDelta},${lat + latDelta}`);
  url.searchParams.set('decimalLongitude',   `${lng - lngDelta},${lng + lngDelta}`);
  url.searchParams.set('year',               `${yearFrom},${yearTo}`);
  url.searchParams.set('month',              String(thisMonth));
  url.searchParams.set('limit',              '300');

  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'Fungai-Art-Foraging/1.0 (robin@fungai.art)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const obs  = data.results || [];
    if (!obs.length) return { yearsBack, month: thisMonth, count: 0, topSpecies: [] };

    const bySpecies = new Map();
    for (const o of obs) {
      const s = o.species || o.scientificName || 'Plantae sp.';
      bySpecies.set(s, (bySpecies.get(s) || 0) + 1);
    }
    const topSpecies = [...bySpecies.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([species, count]) => ({ species, count }));

    return {
      yearsBack,
      month:     thisMonth,
      count:     obs.length,
      totalHits: data.count ?? obs.length,
      topSpecies,
    };
  } catch (_) { return null; }
}

const SYSTEM = `You are MYCO, the foraging intelligence embedded inside Fungai Art's living map at fungai.art/foraging.

## WHO YOU ARE
A field-savvy mycologist AND botanist who reads weather and citizen-science data the way an experienced forager does — mushrooms and wild herbs, medicinal plants and edibles, all equally your beat. You care about substance, not marketing. You cite the numbers you were given, in the units you were given. When the data is thin, you say so.

## LOCATION AWARENESS
The context bundle names the exact place you are reasoning about — location.resolvedName is the canonical name. location.resolvedFrom tells you HOW the location was picked for this turn:
  - 'question-name'   — a place mention in the CURRENT question ("in Säter, Sweden") became the location. The user jumped locations mid-conversation. The data below is fresh for that new place.
  - 'question-coords' — explicit coordinates in the current question set the location.
  - 'region-field'    — the user's typed region field above the chat.
  - 'coords'          — their GPS / map center.

If resolvedFrom is 'question-*' the user has just moved somewhere new. DO NOT complain about a mismatch or ask them to re-submit — the data you are reading is already for the newly named place. Say once, briefly, "Reading for <resolvedName> now" and answer.

ALWAYS use resolvedName in your reply. If the resolved name is a canonical form of what the user typed ("Lake Garda, Italy" vs their "Lago di Garda"), acknowledge that lightly so they know you're on the right spot.

## WHAT YOU CAN DO — five data layers, use them together
1. **weather** — 30 days of daily rain + temperature at the resolved coordinates, plus a 7-day forecast. Interpret into fruiting/growing-window language.
2. **fungiSightings.recent** — iNaturalist research-grade Kingdom Fungi, last 12 months around the resolved point (~100km). What mushroom people are ACTIVELY reporting.
3. **fungiSightings.seasonalBaseline** — GBIF Kingdom Fungi from the SAME MONTH over the previous 3 years, ~100km. What mushrooms typically fruit here in this season across years.
4. **plantSightings.recent** — iNaturalist research-grade Kingdom Plantae, last 12 months, ~100km. What plants/herbs people are ACTIVELY reporting. Includes common names when iNat provided them.
5. **plantSightings.seasonalBaseline** — GBIF Kingdom Plantae from the SAME MONTH over the previous 3 years, ~100km. What plants are typically observable here at this time of year.

**Answer whatever the user asked about — mushrooms, herbs, or both.** If they ask about herbs at Lago di Garda, work the plant layers. If they ask about mushrooms, work the fungi layers. If they ask "what's forageable here right now," weave both. Do NOT tell the user herbs are outside your expertise — they aren't.

Cross-reference the layers: if the seasonal baseline lists Sambucus nigra (elderflower) as the #1 September plant here, AND weather shows steady warmth without heat spikes, AND recent iNat has 4 elderflower reports this month — that's a strong signal. If the plant baseline shows something notable but no recent iNat hits, note that recent data is thin but the historical pattern is consistent.

Plant/herb note: Kingdom Plantae in citizen-science databases includes trees, ornamentals, grasses, mosses. The topSpecies aggregation surfaces what people actually record, which usually skews to notable / recognisable / forageable species in wild bboxes — nettles, elderflower, wild garlic, meadowsweet, yarrow, bilberry, etc. Trust the counts but bring your botanist eye — if the top hit is *Quercus robur* (an oak), don't recommend "foraging oak", contextualise it as a habitat marker.

## HOW YOU RESPOND
- Direct, precise, warm. Two to three short paragraphs weaving weather + relevant sighting layers.
- Numbers first, interpretation second: "42mm over 30 days, 5 rain days, last 6mm event 4 days ago. Fungi (recent iNat + 3-yr Sept baseline): Boletus edulis dominates here, 8 reports this month; Amanita muscaria as secondary. Herbs (recent iNat + 3-yr Sept baseline): Sambucus nigra elderflower fruiting now, Urtica dioica nettles peak, Achillea millefolium yarrow flowering."
- Prefer common names alongside Latin: "Chanterelle (Cantharellus cibarius)", "Yarrow (Achillea millefolium)".
- If the user asked about a species that's neither in recent nor baseline layers of the relevant kingdom, say the data doesn't show it here at this time and give general seasonal guidance.
- Never guarantee a find. Say "likely", "close to the window", "unlikely right now", never "you will find".

## HARD RAILS
- No medical claims. No dosing advice. No identification for consumption — always end with "cross-check every find with an expert or a trusted field guide before eating."
- Do not identify a mushroom from a photo (you cannot see photos here anyway).
- If asked about a specific rare / protected species, add a foraging-ethics note ("do not harvest fewer than three mature fruiting bodies from a stand; leave the mycelium intact").
- Sensitive locations (protected areas, private land) — remind the user to check local law.
- LEGAL NOTE for Sweden: Amanita muscaria's active compounds (muscimol, ibotenic acid) are scheduled as narcotics under Swedish law (LVFS 2011:10). If the resolved location is in Sweden and the user asks about picking Amanita, add a clear note that possessing extracts or preparations is illegal there — even though the mushroom itself is present in the ecology. Do NOT provide this warning for Germany, most other EU, or the US (Louisiana excepted) where the compounds are not scheduled.`;

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
    let   lat        = Number.isFinite(body.lat) ? body.lat : null;
    let   lng        = Number.isFinite(body.lng) ? body.lng : null;
    // Sanitize trailing / leading punctuation that would break the
    // geocoder — Robin's Örebro attempt failed because the input was
    // "Örebro, Sweden)" with a stray closing paren. Strip bracket
    // punctuation and terminal periods; keep commas inside the string.
    const regionName = String(body.regionName || '')
      .slice(0, 120)
      .replace(/^[\s()\[\]{}.,!?;:]+/, '')
      .replace(/[\s()\[\]{}.!?;:]+$/, '')  // note: comma NOT included here — "Örebro, Sweden" is valid
      .trim();
    const history    = Array.isArray(body.history) ? body.history.slice(-6) : [];

    if (!question) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Empty question.' }) };

    // Location precedence, high → low:
    //   1. Coordinates or named place mentioned INSIDE the question
    //      itself. If the user pivots mid-conversation ("and what
    //      about Säter, Sweden?") MYCO jumps immediately — the
    //      region-name field doesn't have to be manually updated.
    //   2. Region-name field (what the user typed above the chat).
    //   3. Client coordinates (GPS / node / map center).
    //
    // Whichever wins is echoed back on the response so the client
    // can update the region field for continuity on subsequent turns.
    let geocoded = null;
    let resolvedFrom = 'coords';
    const extracted = extractLocationFromQuestion(question);

    // A short list of vague / country-only extractions we should NOT
    // let override an explicit regionName. Robin's "Örebro, Sweden"
    // input was being clobbered when the question happened to
    // mention "in Sweden" — the extractor grabbed "Sweden" and
    // geocoded to the country centroid instead of Örebro.
    const VAGUE_EXTRACTIONS = new Set([
      'sweden', 'norway', 'denmark', 'finland', 'germany', 'italy',
      'france', 'spain', 'portugal', 'greece', 'austria', 'switzerland',
      'netherlands', 'belgium', 'ireland', 'scotland', 'england',
      'wales', 'uk', 'usa', 'us', 'canada', 'mexico', 'here', 'there',
    ]);
    const extractedIsVague = extracted?.type === 'name'
      && VAGUE_EXTRACTIONS.has(extracted.name.trim().toLowerCase());

    if (extracted?.type === 'coords') {
      lat = extracted.lat;
      lng = extracted.lng;
      resolvedFrom = 'question-coords';
    } else if (extracted?.type === 'name' && !extractedIsVague) {
      const g = await forwardGeocode(extracted.name);
      if (g) {
        lat = g.lat;
        lng = g.lng;
        geocoded = g;
        resolvedFrom = 'question-name';
      }
    }
    // Fall back to the region-name field if the question didn't
    // yield a usable specific location. Country-only extractions
    // (VAGUE_EXTRACTIONS above) also fall through so a persistent
    // "Örebro, Sweden" in the region field wins over a passing
    // "in Sweden" in the question text.
    if (resolvedFrom === 'coords' && regionName) {
      const g = await forwardGeocode(regionName);
      if (g) {
        lat = g.lat;
        lng = g.lng;
        geocoded = g;
        resolvedFrom = 'region-field';
      }
    }

    if (lat === null || lng === null) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Need a place name or coordinates — type a region (e.g. "Lago di Garda, Italy") or share location.' }) };
    }

    // Parallel context gathering — five layers, all best-effort, we
    // still answer if any fail. Two kingdoms × recent-vs-seasonal
    // gives MYCO real symmetric coverage of both mushrooms and
    // plants/herbs.
    const [
      weatherRaw,
      fungiRecent, fungiBaseline,
      plantsRecent, plantsBaseline,
    ] = await Promise.all([
      fetchWeatherHistory(lat, lng, 30),
      fetchNearbyFungi(lat, lng, 100),
      fetchSeasonalBaseline(lat, lng, 100, 3),
      fetchNearbyPlants(lat, lng, 100),
      fetchSeasonalBaselinePlants(lat, lng, 100, 3),
    ]);
    const weather = summarizeWeather(weatherRaw, 30);

    const contextBlock = {
      location: {
        lat: Math.round(lat * 1000) / 1000,
        lng: Math.round(lng * 1000) / 1000,
        regionNameRequested: regionName || null,
        resolvedName:        geocoded?.canonicalName || regionName || null,
        resolvedFrom, // 'geocoded' | 'coords' — tell MYCO where the location came from
      },
      today:   new Date().toISOString().slice(0, 10),
      weather: weather || 'unavailable',
      fungiSightings: {
        recent:           fungiRecent   || 'unavailable',
        seasonalBaseline: fungiBaseline || 'unavailable',
      },
      plantSightings: {
        recent:           plantsRecent   || 'unavailable',
        seasonalBaseline: plantsBaseline || 'unavailable',
      },
    };

    const userPrompt =
      'FIELD CONTEXT (freshly gathered for this question):\n' +
      '```json\n' + JSON.stringify(contextBlock, null, 2) + '\n```\n\n' +
      'The user is asking:\n' + question;

    const safeHistory = history.map(h => ({
      role: h?.role === 'assistant' ? 'assistant' : 'user',
      content: String(h?.content || '').slice(0, 1500),
    }));

    // Workspace-scoped ("identity-linked") API keys require an
    // anthropic-workspace-id header pointing at the workspace the
    // request acts in. Only added when the env var is present so
    // legacy user-scoped keys keep working unchanged.
    const anthropicHeaders = {
      'x-api-key':         process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    };
    if (process.env.ANTHROPIC_WORKSPACE_ID) {
      anthropicHeaders['anthropic-workspace-id'] = process.env.ANTHROPIC_WORKSPACE_ID;
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: anthropicHeaders,
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 900,
        // Prompt caching — the SYSTEM prompt is ~1300 tokens and
        // stable across every query. Marking it cache_control:
        // ephemeral lets Anthropic keep it warm for ~5 min per
        // instance. Cache write costs 1.25x normal input; cache
        // read costs 0.1x. Break-even is ~2 queries per window.
        // Bursty traffic (multiple users hitting MYCO within a
        // few minutes) saves ~90% of input cost; isolated queries
        // pay a tiny write penalty (~$0.0004 extra one-time).
        // Per-query total goes from ~$0.005-0.01 to ~$0.001-0.003
        // in the cached case.
        system: [
          { type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } },
        ],
        messages: [...safeHistory, { role: 'user', content: userPrompt }],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      // Log the raw upstream error for the Netlify function log, but
      // give the user a friendly message instead of an API stack trace.
      console.error('myco-forage upstream error:', res.status, data.error);
      const friendly =
        /workspace/i.test(data.error?.message || '')
          ? "MYCO isn't authenticated for this deployment — ANTHROPIC_WORKSPACE_ID needs to be set in Netlify env. Ping Robin."
          : res.status === 429
            ? "MYCO is rate-limited right now — try again in a minute."
          : res.status === 401 || res.status === 403
            ? "MYCO isn't authenticated — the API key may need refreshing."
          : "MYCO couldn't reach the model — try again shortly.";
      return { statusCode: res.status, headers: cors, body: JSON.stringify({ error: friendly }) };
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
