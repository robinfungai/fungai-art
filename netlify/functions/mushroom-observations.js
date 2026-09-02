// mushroom-observations.js
//
// Sporecast-style aggregator. The existing per-node gbif-observations.js
// pulls ONE species at a time (Cantharellus cibarius, Boletus edulis, …)
// inside a small radius — the map looks empty at wide zoom because most
// of the year most of the world has no observations of that one species.
//
// This endpoint answers a different question: "show me ANY mushroom
// sighting in this bounding box, from ANY of the open citizen-science
// sources, from the last 12 months." That's the dense layer that makes
// the map feel alive at continental zoom.
//
// SOURCES (all free, no API key):
//   1. GBIF — Kingdom Fungi (taxonKey=5). Aggregates museum, herbarium,
//      and citizen-science records. Multi-year, high coverage, lower
//      freshness (many records are 2-3 years old).
//   2. iNaturalist — /v1/observations with taxon_id=47170 (Fungi Kingdom),
//      quality_grade=research. Fresh hobbyist sightings, community-verified.
//      This is Sporecast's dominant public source.
//
// Merged, deduplicated by lat/lng rounded to 4 decimals (~11m).
// Cached aggressively — bbox tiles change slowly.

const GBIF_BASE   = 'https://api.gbif.org/v1/occurrence/search';
const INAT_BASE   = 'https://api.inaturalist.org/v1/observations';
const KINGDOM_FUNGI_GBIF_KEY = 5;
const KINGDOM_FUNGI_INAT_KEY = 47170;

function clampBbox(minLat, maxLat, minLng, maxLng) {
  return {
    minLat: Math.max(-85,  Math.min(85, minLat)),
    maxLat: Math.max(-85,  Math.min(85, maxLat)),
    minLng: Math.max(-180, Math.min(180, minLng)),
    maxLng: Math.max(-180, Math.min(180, maxLng)),
  };
}

async function fetchGBIF(bbox, monthsBack, limit) {
  const now = new Date();
  const from = new Date(now); from.setMonth(now.getMonth() - monthsBack);
  const yearFrom = from.getFullYear();
  const yearTo   = now.getFullYear();

  const params = new URLSearchParams({
    hasCoordinate:       'true',
    hasGeospatialIssue:  'false',
    taxonKey:            String(KINGDOM_FUNGI_GBIF_KEY),
    decimalLatitude:     `${bbox.minLat},${bbox.maxLat}`,
    decimalLongitude:    `${bbox.minLng},${bbox.maxLng}`,
    year:                `${yearFrom},${yearTo}`,
    limit:               String(Math.min(limit, 300)),
  });
  try {
    const res = await fetch(`${GBIF_BASE}?${params.toString()}`, {
      headers: { 'User-Agent': 'Fungai-Art-Foraging/1.0 (robin@fungai.art)' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || [])
      .filter(o => o.decimalLatitude && o.decimalLongitude)
      .map(o => ({
        id: `gbif-${o.key}`,
        lat: o.decimalLatitude,
        lng: o.decimalLongitude,
        species: o.species || o.scientificName || 'Fungi sp.',
        date: o.eventDate ? o.eventDate.slice(0, 10) : null,
        region: o.stateProvince || o.country || null,
        source: 'GBIF',
      }));
  } catch (_) { return []; }
}

async function fetchINat(bbox, monthsBack, limit) {
  // iNaturalist takes swlat/swlng/nelat/nelng (south-west + north-east
  // corners) — different naming than GBIF. Research grade only so we
  // don't pollute the map with unverified sightings.
  const now = new Date();
  const from = new Date(now); from.setMonth(now.getMonth() - monthsBack);
  const iso = (d) => d.toISOString().slice(0, 10);

  const params = new URLSearchParams({
    taxon_id:      String(KINGDOM_FUNGI_INAT_KEY),
    quality_grade: 'research',
    geoprivacy:    'open',
    swlat:         String(bbox.minLat),
    swlng:         String(bbox.minLng),
    nelat:         String(bbox.maxLat),
    nelng:         String(bbox.maxLng),
    d1:            iso(from),
    d2:            iso(now),
    per_page:      String(Math.min(limit, 200)),
    order_by:      'observed_on',
    order:         'desc',
  });
  try {
    const res = await fetch(`${INAT_BASE}?${params.toString()}`, {
      headers: { 'User-Agent': 'Fungai-Art-Foraging/1.0 (robin@fungai.art)' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || [])
      .filter(o => o.geojson?.coordinates)
      .map(o => ({
        id: `inat-${o.id}`,
        lat: o.geojson.coordinates[1],
        lng: o.geojson.coordinates[0],
        species: o.taxon?.name || o.species_guess || 'Fungi sp.',
        commonName: o.taxon?.preferred_common_name || null,
        date: o.observed_on || null,
        region: o.place_guess || null,
        source: 'iNaturalist',
        url: `https://www.inaturalist.org/observations/${o.id}`,
      }));
  } catch (_) { return []; }
}

export const handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' };

  const qs = event.queryStringParameters || {};
  const bbox = clampBbox(
    parseFloat(qs.minLat ?? '55'),
    parseFloat(qs.maxLat ?? '69'),
    parseFloat(qs.minLng ?? '10'),
    parseFloat(qs.maxLng ?? '25'),
  );
  const monthsBack = Math.max(1, Math.min(24, parseInt(qs.months || '12', 10)));
  const limit      = Math.max(20, Math.min(500, parseInt(qs.limit || '250', 10)));
  const sources    = (qs.sources || 'gbif,inat').toLowerCase().split(',').map(s => s.trim());

  const jobs = [];
  if (sources.includes('gbif')) jobs.push(fetchGBIF(bbox, monthsBack, limit));
  if (sources.includes('inat')) jobs.push(fetchINat(bbox, monthsBack, limit));

  const results = (await Promise.all(jobs)).flat();

  // Dedupe by rounded lat/lng — the same sighting frequently exists in
  // both GBIF (research pipeline) and iNaturalist (user upload); when a
  // duplicate is found, prefer iNat (fresher metadata + species name).
  const bucket = new Map();
  for (const r of results) {
    const key = `${r.lat.toFixed(4)}_${r.lng.toFixed(4)}_${(r.species || '').toLowerCase()}`;
    const prev = bucket.get(key);
    if (!prev || (prev.source === 'GBIF' && r.source === 'iNaturalist')) {
      bucket.set(key, r);
    }
  }
  const merged = [...bucket.values()];

  // Species counts — MYCO uses this to summarise "what's out there right now"
  const bySpecies = new Map();
  for (const r of merged) {
    const k = r.species || 'Fungi sp.';
    bySpecies.set(k, (bySpecies.get(k) || 0) + 1);
  }
  const topSpecies = [...bySpecies.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([species, count]) => ({ species, count }));

  return {
    statusCode: 200,
    headers: {
      ...cors,
      // 1-hour cache — bbox tiles change slowly, protects the upstream
      // free APIs from thrashing under repeated pans / zooms.
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
    body: JSON.stringify({
      bbox,
      monthsBack,
      count: merged.length,
      observations: merged,
      topSpecies,
      credits: [
        'GBIF.org — CC0 1.0 Universal Public Domain',
        'iNaturalist — CC BY-NC 4.0 (research-grade observations)',
      ],
    }),
  };
};
