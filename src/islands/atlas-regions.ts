// src/islands/atlas-regions.ts
//
// The Atlas's geography, and the honest limits of it.
//
// ── THERE ARE NO COORDINATES IN THE DATABASE ─────────────────────
// herbs.ts holds no latitude, longitude or geometry for any of the 242
// organisms, and none is invented here. What it does hold is coarse,
// recorded geography:
//
//   tradition      100%   NORDIC · TCM · AYURVEDA · EUROPEAN · …
//   native_range    92%   Fennoscandia · Europe · East Asia · …
//   ecology/biome   39%   BOREAL FOREST · MEADOW · BOG · …
//
// So a node on this globe sits at a REGION, never at a collection site.
// The claim being rendered is "Chaga's range is Fennoscandia", which is
// true, rather than "Chaga grows at 64.1°N 21.9°W", which we do not know.
//
// That distinction is the whole design. A pin map would look more
// impressive and would be fiction; the brief forbids fabricating
// geographic data, and this is what obeying that looks like. When the
// Field layer brings real foraging coordinates, they belong on top of
// this as a separate, genuinely point-level stratum — `ORGANISM` below is
// already the zoom tier that would host them.
//
// ── WHY THESE CENTROIDS ARE NOT FABRICATION ──────────────────────
// Placing "East Asia" at roughly 35°N 105°E is labelling a named region
// with its own location, not inventing a fact about a plant. The plant's
// recorded attribute is the region; the centroid is how a region is drawn.

/** A place the Atlas can put things. Coarse on purpose. */
export interface Region {
  id: string;
  label: string;
  /** Degrees. The region's own centre, not any organism's location. */
  lat: number;
  lon: number;
  /** Rough angular radius, used to spread a cluster without implying a site. */
  spread: number;
  /** Which recorded values land here. */
  traditions: string[];
  ranges: string[];
}

// Ordered north-to-south-ish so the legend reads sensibly.
export const REGIONS: Region[] = [
  { id: 'fennoscandia', label: 'Fennoscandia & the Boreal',
    lat: 64.5, lon: 17.0, spread: 11,
    traditions: ['NORDIC'], ranges: ['Fennoscandia', 'Northern Europe'] },

  { id: 'europe', label: 'Europe',
    lat: 49.0, lon: 10.0, spread: 12,
    traditions: ['EUROPEAN'], ranges: ['Europe'] },

  { id: 'mediterranean', label: 'The Mediterranean',
    lat: 38.0, lon: 15.0, spread: 10,
    traditions: ['MEDITERRANEAN'], ranges: ['Mediterranean basin'] },

  { id: 'east-asia', label: 'East Asia',
    lat: 35.0, lon: 105.0, spread: 13,
    traditions: ['TCM'], ranges: ['East Asia'] },

  { id: 'south-asia', label: 'The Indian Subcontinent',
    lat: 22.0, lon: 79.0, spread: 11,
    traditions: ['AYURVEDA'], ranges: ['Indian subcontinent'] },

  { id: 'north-america', label: 'North America',
    lat: 43.0, lon: -100.0, spread: 14,
    traditions: ['NORTH AMERICAN'], ranges: ['North America'] },

  { id: 'mesoamerica', label: 'Mesoamerica',
    lat: 17.0, lon: -95.0, spread: 8,
    traditions: ['MESOAMERICAN'], ranges: ['Central America'] },

  { id: 'south-america', label: 'South America',
    lat: -12.0, lon: -60.0, spread: 14,
    traditions: ['SOUTH AMERICAN'], ranges: ['South America'] },

  { id: 'africa', label: 'Africa',
    lat: 4.0, lon: 20.0, spread: 15,
    traditions: ['AFRICAN'], ranges: ['Africa'] },
];

/**
 * Organisms recorded only as "Global" — cosmopolitan, or simply not
 * pinned down. They are NOT scattered across the map to fill it out.
 * They get their own off-globe tier, because pretending to know where a
 * plant is from is the failure this module exists to avoid.
 */
export const UNPLACED = {
  id: 'unplaced',
  label: 'Cosmopolitan & unrecorded',
} as const;

/** Zoom tiers. What changes with zoom is INFORMATION DENSITY, not size. */
export const TIERS = ['WORLD', 'REGION', 'BIOME', 'ORGANISM'] as const;
export type Tier = typeof TIERS[number];

/**
 * Camera distance → tier. The globe's radius is 1, the camera runs from
 * about 1.6 (close) to 3.4 (far), so these are the three places the
 * information model changes rather than arbitrary numbers.
 */
export function tierForDistance(d: number): Tier {
  if (d > 2.9) return 'WORLD';
  if (d > 2.25) return 'REGION';
  if (d > 1.85) return 'BIOME';
  return 'ORGANISM';
}

export interface Placeable {
  slug: string;
  tradition?: string;
  native_range?: string[];
  ecology?: string[];
}

/**
 * Which region an organism belongs to.
 *
 * native_range is tried FIRST because it is a statement about the plant;
 * tradition is a statement about the people who use it, which is a good
 * proxy and a slightly different claim. Both are recorded, neither is
 * guessed, and anything that resolves to neither is left unplaced rather
 * than dropped somewhere plausible.
 */
export function regionOf(o: Placeable): Region | null {
  const ranges = o.native_range || [];
  if (ranges.length) {
    const byRange = REGIONS.find(r => r.ranges.some(x => ranges.includes(x)));
    if (byRange) return byRange;
  }
  if (o.tradition) {
    const byTradition = REGIONS.find(r => r.traditions.includes(o.tradition!));
    if (byTradition) return byTradition;
  }
  return null;
}

/** lat/lon in degrees → a point on a unit sphere. */
export function latLonToVec3(lat: number, lon: number, radius = 1): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

/**
 * A stable pseudo-random offset inside a region, from the slug.
 *
 * Deterministic on purpose: an organism must not move between renders, or
 * the globe stops being a place. It is a LAYOUT offset for legibility
 * within a cluster and carries no geographic meaning — which is why the
 * tooltip names the region, never a coordinate.
 */
export function offsetFor(slug: string, spread: number): { dLat: number; dLon: number } {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const a = (h % 3600) / 3600 * Math.PI * 2;
  const r = ((h >>> 12) % 1000) / 1000;
  const mag = Math.sqrt(r) * spread;          // sqrt for even area coverage
  return { dLat: Math.sin(a) * mag * 0.6, dLon: Math.cos(a) * mag };
}

export interface PlacedNode<T extends Placeable = Placeable> {
  organism: T;
  region: Region;
  lat: number;
  lon: number;
  position: [number, number, number];
}

/** Place every organism that has recorded geography. Returns the rest too. */
export function placeAll<T extends Placeable>(
  organisms: T[],
  radius = 1.008,
): { placed: PlacedNode<T>[]; unplaced: T[] } {
  const placed: PlacedNode<T>[] = [];
  const unplaced: T[] = [];
  for (const o of organisms) {
    const region = regionOf(o);
    if (!region) { unplaced.push(o); continue; }
    const { dLat, dLon } = offsetFor(o.slug, region.spread);
    const lat = Math.max(-84, Math.min(84, region.lat + dLat));
    const lon = region.lon + dLon;
    placed.push({ organism: o, region, lat, lon, position: latLonToVec3(lat, lon, radius) });
  }
  return { placed, unplaced };
}

/** Per-region counts, for the world-scale tier and the legend. */
export function regionCounts<T extends Placeable>(placed: PlacedNode<T>[]) {
  const m = new Map<string, { region: Region; count: number }>();
  for (const p of placed) {
    const e = m.get(p.region.id);
    if (e) e.count++;
    else m.set(p.region.id, { region: p.region, count: 1 });
  }
  return [...m.values()].sort((a, b) => b.count - a.count);
}
