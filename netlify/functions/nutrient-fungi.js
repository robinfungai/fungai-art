// nutrient-fungi.js
//
// Precise layer for the Foraging Map's "💩 Nutrient-rich · dung & compost"
// habitat. Instead of a handful of curated nodes, this returns REAL,
// community-verified sightings of the fungi that live in nutrient-rich
// habitats — dung, manured grass, compost, wood chips and mulch — inside
// the visible map bbox, so the map shows where those habitats actually
// are, down to the field or park bed.
//
// Every observation is tagged with its habitat and, crucially, its danger:
// the deadly residents of these habitats (Pholiotina, Galerina) are shown,
// never hidden. Psilocybin-containing taxa are excluded by design — the map
// is a habitat and safety tool, not a finder for controlled substances.
//
// SOURCES (free, no key): iNaturalist research-grade + GBIF occurrences.
// Reached at /api/nutrient-fungi?minLat=&maxLat=&minLng=&maxLng=

import { createGuard } from "../../src/server/proxy-guard.mjs";

// Fungai-only CORS + per-IP rate limit (see src/server/proxy-guard.mjs).
const guard = createGuard({ name: "nutrient-fungi" });

const GBIF_BASE = 'https://api.gbif.org/v1/occurrence/search';
const INAT_BASE = 'https://api.inaturalist.org/v1/observations';
const UA = { 'User-Agent': 'Fungai-Art-Foraging/1.0 (robin@fungai.art)' };

// Taxa verified against the iNaturalist taxa API + GBIF species match.
// habitat: where it fruits · danger: 'lethal' | 'toxic' | 'caution' | null
const GROUPS = [
  { name: 'Pholiotina',              inat: 118269, gbif: 2529710, habitat: 'wood chips, mulch & manured lawns', danger: 'lethal',  note: 'Some species (e.g. Pholiotina rugosa) carry amatoxins — the death-cap toxins.' },
  { name: 'Galerina',                inat: 118297, gbif: 9570632, habitat: 'buried wood & wood chips',           danger: 'lethal',  note: 'Deadly Galerina carries amatoxins; mistaken for edible brown clusters.' },
  { name: 'Conocybe',                inat: 117228, gbif: 2529714, habitat: 'manured grass & lawns',              danger: 'caution', note: 'Little brown mushrooms — several close relatives are deadly.' },
  { name: 'Leucocoprinus',           inat: 85399,  gbif: 2535536, habitat: 'compost, raised beds & greenhouses', danger: 'toxic',   note: 'Poisonous.' },
  { name: 'Coprinopsis',             inat: 48522,  gbif: 2534316, habitat: 'compost-rich soil & buried wood',    danger: 'toxic',   note: 'Common ink cap contains coprine — dangerous with alcohol.' },
  { name: 'Coprinus',                inat: 47393,  gbif: 2526779, habitat: 'disturbed, manured ground',          danger: 'caution', note: 'Shaggy ink cap is edible only when young; confusable with toxic ink caps.' },
  { name: 'Parasola',                inat: 56311,  gbif: 2534499, habitat: 'grass & dung',                       danger: null,      note: 'Tiny, short-lived; not edible.' },
  { name: 'Protostropharia',         inat: 499759, gbif: 7625102, habitat: 'cow & horse dung',                   danger: null,      note: 'Dung roundhead — the signature dung fungus. Not edible.' },
  { name: 'Bolbitius',               inat: 55473,  gbif: 2529626, habitat: 'dung, manure & wood chips',          danger: null,      note: 'Collapses within a day. Not edible.' },
  { name: 'Panaeolus semiovatus',    inat: 124539, gbif: 3317006, habitat: 'old horse & cow dung',               danger: null,      note: 'Egghead mottlegill. Not edible.' },
  { name: 'Panaeolus papilionaceus', inat: 118263, gbif: 3317061, habitat: 'dung & manured grass',               danger: null,      note: 'Petticoat mottlegill. Not edible.' },
  { name: 'Stropharia',              inat: 53283,  gbif: 11159309, habitat: 'wood-chip beds & mulch',            danger: 'caution', note: 'Wine cap grows among deadly small brown species in the same chips.' },
  { name: 'Agaricus',                inat: 49548,  gbif: 2518646, habitat: 'grazed pasture & field edges',       danger: 'caution', note: 'White field mushrooms have lethal white Amanita lookalikes.' },
  { name: 'Marasmius oreades',       inat: 118240, gbif: 2537250, habitat: 'grazed & mown grass (fairy rings)',  danger: 'caution', note: 'Grows beside its toxic lookalike Clitocybe rivulosa.' },
  { name: 'Cyathus',                 inat: 68301,  gbif: 7413707, habitat: 'wood chips & mulch',                 danger: null,      note: "Bird's nest fungi. Not edible." },
];

// Psilocybin-containing taxa that can sit inside the genera above — dropped.
const EXCLUDE = /psilocybe|deconica|copelandia|panaeolus (cinctulus|cyanescens|subbalteatus|olivaceus|fimicola|tropicalis|africanus|bisporus)|conocybe (smithii|siligineoides)|pholiotina cyanopus|gymnopilus|pluteus salicinus|inocybe aeruginascens/i;

function groupFor(species) {
  const s = String(species || '');
  // Most specific first: species-level entries win over their genus.
  return GROUPS.filter(g => s.startsWith(g.name)).sort((a, b) => b.name.length - a.name.length)[0] || null;
}

function clampBbox(minLat, maxLat, minLng, maxLng) {
  return {
    minLat: Math.max(-85, Math.min(85, minLat)),
    maxLat: Math.max(-85, Math.min(85, maxLat)),
    minLng: Math.max(-180, Math.min(180, minLng)),
    maxLng: Math.max(-180, Math.min(180, maxLng)),
  };
}

async function fetchINat(bbox, monthsBack, limit) {
  const now = new Date(); const from = new Date(now); from.setMonth(now.getMonth() - monthsBack);
  const params = new URLSearchParams({
    taxon_id: GROUPS.map(g => g.inat).join(','),
    quality_grade: 'research', geoprivacy: 'open',
    swlat: String(bbox.minLat), swlng: String(bbox.minLng), nelat: String(bbox.maxLat), nelng: String(bbox.maxLng),
    d1: from.toISOString().slice(0, 10), d2: now.toISOString().slice(0, 10),
    per_page: String(Math.min(limit, 200)), order_by: 'observed_on', order: 'desc',
  });
  try {
    const res = await fetch(`${INAT_BASE}?${params}`, { headers: UA });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).filter(o => o.geojson?.coordinates).map(o => ({
      id: `inat-${o.id}`, lat: o.geojson.coordinates[1], lng: o.geojson.coordinates[0],
      species: o.taxon?.name || o.species_guess || '', commonName: o.taxon?.preferred_common_name || null,
      date: o.observed_on || null, region: o.place_guess || null, source: 'iNaturalist',
      url: `https://www.inaturalist.org/observations/${o.id}`,
    }));
  } catch (_) { return []; }
}

async function fetchGBIF(bbox, monthsBack, limit) {
  const now = new Date(); const from = new Date(now); from.setMonth(now.getMonth() - monthsBack);
  const params = new URLSearchParams({
    hasCoordinate: 'true', hasGeospatialIssue: 'false',
    decimalLatitude: `${bbox.minLat},${bbox.maxLat}`, decimalLongitude: `${bbox.minLng},${bbox.maxLng}`,
    year: `${from.getFullYear()},${now.getFullYear()}`, limit: String(Math.min(limit, 300)),
  });
  GROUPS.forEach(g => params.append('taxonKey', String(g.gbif)));
  try {
    const res = await fetch(`${GBIF_BASE}?${params}`, { headers: UA });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).filter(o => o.decimalLatitude && o.decimalLongitude).map(o => ({
      id: `gbif-${o.key}`, lat: o.decimalLatitude, lng: o.decimalLongitude,
      species: o.species || o.scientificName || '', commonName: null,
      date: o.eventDate ? o.eventDate.slice(0, 10) : null, region: o.stateProvince || o.country || null,
      source: 'GBIF', url: `https://www.gbif.org/occurrence/${o.key}`,
    }));
  } catch (_) { return []; }
}

export async function collectNutrientObservations(bbox, { monthsBack = 36, limit = 250 } = {}) {
  const results = (await Promise.all([fetchINat(bbox, monthsBack, limit), fetchGBIF(bbox, monthsBack, limit)])).flat();
  const bucket = new Map();
  for (const r of results) {
    if (!r.species || EXCLUDE.test(r.species)) continue;
    const g = groupFor(r.species);
    if (!g) continue;
    const obs = { ...r, habitat: g.habitat, danger: g.danger, note: g.note, group: g.name };
    const key = `${r.lat.toFixed(4)}_${r.lng.toFixed(4)}_${r.species.toLowerCase()}`;
    const prev = bucket.get(key);
    if (!prev || (prev.source === 'GBIF' && r.source === 'iNaturalist')) bucket.set(key, obs);
  }
  return [...bucket.values()];
}

export const handler = async (event) => {
  const gate = guard.event(event);
  if (gate.response) return gate.response;
  const cors = { ...gate.cors, 'Content-Type': 'application/json' };

  const qs = event.queryStringParameters || {};
  const bbox = clampBbox(parseFloat(qs.minLat ?? '55'), parseFloat(qs.maxLat ?? '56'), parseFloat(qs.minLng ?? '13'), parseFloat(qs.maxLng ?? '14.5'));
  if (bbox.maxLat - bbox.minLat > 30 || bbox.maxLng - bbox.minLng > 45) {
    return { statusCode: 200, headers: cors, body: JSON.stringify({ bbox, count: 0, observations: [], tooWide: true }) };
  }
  const observations = await collectNutrientObservations(bbox, {
    monthsBack: Math.max(6, Math.min(60, parseInt(qs.months || '36', 10))),
    limit: Math.max(50, Math.min(300, parseInt(qs.limit || '250', 10))),
  });
  const byHabitat = {};
  observations.forEach(o => { byHabitat[o.habitat] = (byHabitat[o.habitat] || 0) + 1; });
  return {
    statusCode: 200,
    headers: { ...cors, 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
    body: JSON.stringify({
      bbox, count: observations.length, observations,
      deadlyCount: observations.filter(o => o.danger === 'lethal').length,
      byHabitat,
      credits: ['iNaturalist — CC BY-NC 4.0 (research-grade observations)', 'GBIF.org — CC0 1.0'],
    }),
  };
};
