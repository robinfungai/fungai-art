import { useState, useCallback, useRef, useEffect } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ECO_NODES, HABITAT_COLORS, HABITAT_LABELS } from '../data/ecoNodes';
import { SKOGSSKAFFERIET_OBS } from '../data/skogsskafferietObs';
import { VILDMAD_OBS } from '../data/vildMadObs';
import { HARVEST_BY_MONTH, HARVEST_PLANTS, MONTH_SV } from '../data/harvestCalendar';
import { EcoNode, Season, HabitatType } from '../types/EcoNode';
import NodePanel from './NodePanel';

// Moon phase calculation (pure JS, no API)
function getMoonPhase() {
  const knownNew = new Date('2000-01-06T18:14:00Z').getTime();
  const cycle = 29.53058867;
  const elapsed = (Date.now() - knownNew) / 86400000; // days
  const d = ((elapsed % cycle) + cycle) % cycle;
  if (d < 1.85)  return { emoji: '🌑', name: 'New Moon', day: Math.round(d) };
  if (d < 7.38)  return { emoji: '🌒', name: 'Waxing Crescent', day: Math.round(d) };
  if (d < 9.22)  return { emoji: '🌓', name: 'First Quarter', day: Math.round(d) };
  if (d < 14.77) return { emoji: '🌔', name: 'Waxing Gibbous', day: Math.round(d) };
  if (d < 16.61) return { emoji: '🌕', name: 'Full Moon', day: Math.round(d) };
  if (d < 22.15) return { emoji: '🌖', name: 'Waning Gibbous', day: Math.round(d) };
  if (d < 23.99) return { emoji: '🌗', name: 'Last Quarter', day: Math.round(d) };
  return { emoji: '🌘', name: 'Waning Crescent', day: Math.round(d) };
}

// GBIF observation type (existing per-species-per-node loader)
interface GBIFObs { id: number; lat: number; lng: number; species: string; date: string | null; region: string | null; }

// Sporecast-style aggregated fungal observation (Kingdom Fungi across
// GBIF + iNaturalist, fetched for the current map viewport). Denser
// than the per-species per-node loader because it asks the sources for
// EVERY mushroom in the bbox, not just the primary species of one node.
interface FungalObs {
  id: string;
  lat: number;
  lng: number;
  species: string;
  commonName?: string | null;
  date: string | null;
  region: string | null;
  source: 'GBIF' | 'iNaturalist';
  url?: string;
}

// MYCO chat message
interface MycoMsg { role: 'user' | 'assistant'; content: string; }

// Location the server actually reasoned about — echoed back on every
// MYCO response so we can fly the map to a geocoded named place
// (user types "Lago di Garda, Italy" → server resolves + answers about
// that spot; client jumps the map there).
interface MycoResolvedLocation {
  lat: number;
  lng: number;
  regionNameRequested: string | null;
  resolvedName: string | null;
  // 'question-coords' — coordinates were parsed from the question text
  // 'question-name'   — a place name was extracted from the question text
  // 'region-field'    — the user's region-name input was used
  // 'coords'          — fallback to whatever coords the client sent
  resolvedFrom: 'question-coords' | 'question-name' | 'region-field' | 'coords';
}

// Foraging conditions type
interface ForageConditions {
  score: number; label: string; color: string; detail: string;
  tAvg: number; tMax: number; tMin: number;
  totalRain10d: number; totalRain3to7: number; todayRain: number;
  forecast: { date: string; rain: number; tMax: number; tMin: number }[];
}

// Organic earthy map style — CARTO Voyager (warm/natural tones, no account needed).
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

// Free satellite imagery — ESRI World Imagery + CARTO dark_only_labels
// overlay so country / region / city names still read at every zoom.
// Bare satellite imagery has no place labels; the labels-only tileset
// is a transparent PNG so it composites cleanly on top.
const SATELLITE_STYLE = {
  version: 8 as const,
  sources: {
    satellite: {
      type: 'raster' as const,
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256 as const,
      attribution: '© Esri, Earthstar Geographics',
    },
    labels: {
      type: 'raster' as const,
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png',
      ],
      tileSize: 256 as const,
      attribution: '© OpenStreetMap contributors, © CARTO',
    },
  },
  layers: [
    { id: 'satellite-layer', type: 'raster' as const, source: 'satellite' },
    { id: 'labels-layer',    type: 'raster' as const, source: 'labels'    },
  ],
};

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];
const SEASON_ICONS: Record<Season, string> = {
  spring: '🌱', summer: '☀', autumn: '🍂', winter: '❄',
};

function getCurrentSeason(): Season {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5)  return 'spring';
  if (m >= 6 && m <= 8)  return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

const ALL_HABITATS = [...new Set(ECO_NODES.map(n => n.nodeType))];

function NodeMarker({ node, isSelected, isHovered, isHighlighted, isDimmed, seasons, onClick, onHover, onLeave }: {
  node: EcoNode; isSelected: boolean; isHovered: boolean;
  isHighlighted?: boolean; isDimmed?: boolean;
  seasons: Season[];
  onClick: () => void; onHover: () => void; onLeave: () => void;
}) {
  const color = HABITAT_COLORS[node.nodeType] || '#6BD66F';
  const inSeason = node.best_season.some(s => seasons.includes(s));
  const size = isSelected ? 22 : isHighlighted ? 20 : isHovered ? 18 : 14;
  const baseOpacity = inSeason ? 1 : 0.5;
  const opacity = isDimmed ? 0.16 : baseOpacity;

  return (
    <div
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{ cursor: 'pointer', position: 'relative', opacity, transition: 'opacity 0.25s ease' }}
    >
      {/* Habitat-filter spotlight — large halo around matching nodes when a habitat is selected */}
      {isHighlighted && !isSelected && (
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: size + 56, height: size + 56,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}33 0%, ${color}11 55%, transparent 75%)`,
          pointerEvents: 'none',
          animation: 'habitatHalo 2.8s ease-in-out infinite',
        }} />
      )}
      {/* Outer pulse ring — active season only */}
      {inSeason && !isDimmed && (
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: size + 16, height: size + 16,
          borderRadius: '50%',
          border: `1px solid ${color}`,
          opacity: 0.3,
          animation: 'nodeRipple 2.4s ease-out infinite',
          pointerEvents: 'none',
        }} />
      )}
      {/* Highlight ring — when habitat filter matches */}
      {isHighlighted && (
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: size + 24, height: size + 24,
          borderRadius: '50%',
          border: `1px solid ${color}`,
          opacity: 0.7,
          pointerEvents: 'none',
        }} />
      )}
      {/* Selected ring */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: size + 10, height: size + 10,
          borderRadius: '50%',
          border: `1.5px solid ${color}`,
          opacity: 0.8,
          pointerEvents: 'none',
        }} />
      )}
      {/* Core dot */}
      <div style={{
        width: size, height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${color}, ${color}88)`,
        boxShadow: `0 0 ${isSelected ? 20 : isHighlighted ? 18 : isHovered ? 14 : 8}px ${color}${isSelected ? 'BB' : isHighlighted ? 'AA' : isHovered ? '88' : '55'}`,
        transition: 'all 0.2s',
        border: `1px solid ${color}`,
      }} />
      <style>{`
        @keyframes nodeRipple {
          0%   { transform: translate(-50%,-50%) scale(1); opacity: 0.4; }
          100% { transform: translate(-50%,-50%) scale(1.8); opacity: 0; }
        }
        @keyframes habitatHalo {
          0%, 100% { opacity: 0.7; transform: translate(-50%,-50%) scale(1); }
          50%      { opacity: 1;   transform: translate(-50%,-50%) scale(1.12); }
        }
      `}</style>
    </div>
  );
}

function InstallButton() {
  const [prompt, setPrompt] = useState<any>(null);
  useEffect(() => {
    const handler = () => setPrompt((window as any).__foragePWAPrompt ?? null);
    window.addEventListener('forage-installable', handler);
    // check if already waiting
    if ((window as any).__foragePWAPrompt) handler();
    return () => window.removeEventListener('forage-installable', handler);
  }, []);
  if (!prompt) return null;
  return (
    <button
      onClick={() => { prompt.prompt(); prompt.userChoice.then(() => setPrompt(null)); }}
      style={{
        fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase',
        background: 'rgba(107,214,111,0.1)', border: '0.5px solid rgba(107,214,111,0.4)',
        color: '#6BD66F', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', flexShrink: 0,
      }}
    >
      ↓ Install app
    </button>
  );
}

export default function ForagingApp() {
  const [selectedNode, setSelectedNode] = useState<EcoNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([getCurrentSeason()]);
  const [mapMode, setMapMode] = useState<'dark' | 'satellite'>('dark');
  const [habitatFilter, setHabitatFilter] = useState<HabitatType | 'all'>('all');
  // Mobile legend collapse state — desktop ignores this (CSS shows the body always).
  const [legendOpen, setLegendOpen] = useState(false);
  const [gbifObs, setGbifObs] = useState<GBIFObs[]>([]);
  const [gbifLoading, setGbifLoading] = useState(false);
  const [gbifSpecies, setGbifSpecies] = useState<string>('');
  const [hoveredObs, setHoveredObs] = useState<GBIFObs | null>(null);
  const [conditions, setConditions] = useState<ForageConditions | null>(null);
  const [conditionsLoading, setConditionsLoading] = useState(false);
  const [showSkogsObs, setShowSkogsObs] = useState(true);
  const [showVildMad, setShowVildMad] = useState(true);
  const [hoveredSkogsHerb, setHoveredSkogsHerb] = useState<string | null>(null);
  const [hoveredVildMadHerb, setHoveredVildMadHerb] = useState<string | null>(null);
  const [showHarvest, setShowHarvest] = useState(false);
  const currentMonth = new Date().getMonth() + 1;
  const harvestNow = (HARVEST_BY_MONTH[currentMonth] || []).map(sv => HARVEST_PLANTS[sv]).filter(Boolean);

  // ── ECOLOGICAL INTELLIGENCE LANDING FLOW ──────────────────────────
  //   "The forest is alive around you" hook.
  //   On mount: ask for geolocation → fly map to user → fetch weather
  //   for that point → derive nearest EcoNodes → compose a "Growing
  //   Around You" species list + a Current Ecological Zone label.
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'>('idle');
  const [userConditions, setUserConditions] = useState<ForageConditions | null>(null);
  const [growingPanelOpen, setGrowingPanelOpen] = useState(true);
  // Reverse-geocoded place name for the user's location — used both as
  // a floating chip on the map and to auto-populate the MYCO Ask
  // region field so users don't have to type "Dalarna, Sweden" every
  // time.
  const [userPlace, setUserPlace] = useState<{
    city: string | null; region: string | null; country: string | null;
  } | null>(null);

  // ── Sporecast-style fungal layer (broad Kingdom-Fungi bbox query) ──
  //   Renders always-on across the current viewport once the map settles.
  //   Sourced from GBIF Kingdom Fungi + iNaturalist research-grade so the
  //   map has real dot density even at continental zoom.
  const [fungalObs, setFungalObs] = useState<FungalObs[]>([]);
  const [fungalLoading, setFungalLoading] = useState(false);
  const [showFungalLayer, setShowFungalLayer] = useState(true);
  const [hoveredFungal, setHoveredFungal] = useState<FungalObs | null>(null);
  const lastFungalBboxRef = useRef<{ minLat: number; maxLat: number; minLng: number; maxLng: number } | null>(null);

  // ── MYCO Ask panel state ────────────────────────────────────────────
  const [mycoOpen, setMycoOpen] = useState(false);
  const [mycoMessages, setMycoMessages] = useState<MycoMsg[]>([]);
  const [mycoInput, setMycoInput] = useState('');
  const [mycoLoading, setMycoLoading] = useState(false);
  const [mycoRegionName, setMycoRegionName] = useState('');
  // The last resolved location MYCO reasoned about (from geocoding).
  // Used to render "Reading from: Lake Garda, Italy" in the panel and
  // to fly the map when different from where it currently sits.
  const [mycoResolvedLoc, setMycoResolvedLoc] = useState<MycoResolvedLocation | null>(null);

  const mapRef = useRef<any>(null);

  // 1. Ask for geolocation on first mount
  useEffect(() => {
    if (!('geolocation' in navigator)) { setGeoStatus('unavailable'); return; }
    setGeoStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus('granted');
      },
      () => { setGeoStatus('denied'); },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  // 2. When we have user location, fly the map there + fetch weather for
  //    that point. Independent of selectedNode so the two panels can coexist.
  useEffect(() => {
    if (!userLocation) return;
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 8, duration: 1800, essential: true });
    }
    fetch(`/api/forage-conditions?lat=${userLocation.lat}&lng=${userLocation.lng}`)
      .then(r => r.json())
      .then(data => { if (data.score) setUserConditions(data); })
      .catch(() => {});

    // Reverse geocode → city, region, country. Uses BigDataCloud's
    // client-side reverse-geocode endpoint (free, no API key, CORS-
    // enabled, ~5m accuracy). Best-effort — failure is silent, the
    // rest of the app doesn't depend on it.
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${userLocation.lat}&longitude=${userLocation.lng}&localityLanguage=en`)
      .then(r => r.json())
      .then(data => {
        setUserPlace({
          city:    data.city || data.locality || data.localityInfo?.administrative?.[3]?.name || null,
          region:  data.principalSubdivision || null,
          country: data.countryName || null,
        });
      })
      .catch(() => {});
  }, [userLocation]);

  // Auto-populate the MYCO region name field the first time the
  // reverse-geocode lands, so a Swedish user in Dalarna doesn't have
  // to type "Dalarna, Sweden" — it's already there. Only fills in if
  // the user hasn't typed anything themselves.
  useEffect(() => {
    if (!userPlace) return;
    setMycoRegionName(prev => {
      if (prev && prev.trim()) return prev;
      const parts = [userPlace.region, userPlace.country].filter(Boolean);
      return parts.join(', ');
    });
  }, [userPlace]);

  // 3. Derive: nearest EcoNodes (up to 3 within ~250km), the dominant
  //    habitat, a poetic zone label, and an aggregated species list
  //    weighted by base probability × season match × weather context.
  const userInsight = (() => {
    if (!userLocation) return null;
    // Haversine distance (km) — quick & dirty
    const dist = (a: [number, number], b: [number, number]) => {
      const toRad = (d: number) => d * Math.PI / 180;
      const R = 6371;
      const dLat = toRad(b[1] - a[1]); const dLng = toRad(b[0] - a[0]);
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(h));
    };
    const userPt: [number, number] = [userLocation.lng, userLocation.lat];
    const ranked = ECO_NODES
      .map(n => ({ node: n, km: dist(userPt, n.coordinates) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 3);
    if (!ranked.length) return null;
    // Dominant habitat = nearest. Poetic zone names per habitat type.
    const ZONE_NAMES: Record<HabitatType, string> = {
      birch_edge: 'Birch-Pine Medicinal Corridor',
      pine_heath: 'Pine Heath Resin Belt',
      wetland: 'Wetland Aromatic Zone',
      deadwood_zone: 'Deadwood Fungal Corridor',
      boreal_forest: 'Boreal Mycelial Field',
      meadow: 'Nitrogen Spring Tonic Meadow',
      coastal: 'Saline Edge Botanical Strip',
      tropical_forest: 'Equatorial Plant Cathedral',
      mountain_forest: 'Alpine Conifer Cradle',
      mediterranean: 'Aromatic Sun-Cured Garrigue',
      ancient_forest: 'Old-Growth Lichen Sanctum',
      jungle_edge: 'Jungle Margin Bioactive Belt',
    };
    const zoneName = ZONE_NAMES[ranked[0].node.nodeType] || 'Living Ecological Zone';

    // Aggregate species across the 3 nearest nodes, deduped + scored
    const seasonNow = getCurrentSeason();
    const rain10d = userConditions?.totalRain10d ?? 0;
    const rainBoost = rain10d > 25 ? 0.25 : rain10d > 10 ? 0.1 : 0;

    type Scored = {
      name: string; probability: number; distKm: number; node: EcoNode;
      inSeason: boolean; medicinal?: boolean; edible?: boolean;
      isFungal: boolean;
    };
    const FUNGAL_HINTS = ['mycelium', 'mushroom', 'fung', 'chag', 'reishi', 'porc', 'morch', 'plurot', 'oyst', 'cantharel', 'chant', 'maitak', 'wood ear', 'birch poly'];
    const isFungal = (name: string) => FUNGAL_HINTS.some(h => name.toLowerCase().includes(h));

    const scored: Scored[] = [];
    for (const { node, km } of ranked) {
      for (const sp of node.species) {
        const inSeason = sp.peak_season.includes(seasonNow);
        const fungal = isFungal(sp.name);
        const base = sp.probability;
        const seasonMult = inSeason ? 1.2 : 0.55;
        const distPenalty = Math.max(0.5, 1 - km / 250);
        const weatherBonus = fungal ? rainBoost : 0;
        const probability = Math.min(1, base * seasonMult * distPenalty + weatherBonus);
        scored.push({
          name: sp.name, probability, distKm: km, node,
          inSeason, medicinal: sp.medicinal, edible: sp.edible,
          isFungal: fungal,
        });
      }
    }
    // Dedupe by species name, keep highest-probability entry.
    // Explicit global reference because MapLibre's <Map> component is
    // imported into scope at the top of this file and shadows the built-in.
    const bestByName = new (globalThis as any).Map() as globalThis.Map<string, Scored>;
    for (const s of scored) {
      const prev = bestByName.get(s.name);
      if (!prev || s.probability > prev.probability) bestByName.set(s.name, s);
    }
    const all = [...bestByName.values()].sort((a, b) => b.probability - a.probability);

    return {
      zoneName,
      dominantHabitat: ranked[0].node.nodeType,
      nearestKm: ranked[0].km,
      highProbability: all.filter(s => s.probability >= 0.6 && s.inSeason && !s.isFungal).slice(0, 6),
      emergingAfterRain: rainBoost > 0 ? all.filter(s => s.isFungal).slice(0, 5) : [],
      peakMedicinal: all.filter(s => s.medicinal && s.inSeason).slice(0, 4),
      allSeasonal: all.filter(s => s.inSeason).slice(0, 12),
    };
  })();

  // Conditions string for the "Growing Around You" panel header
  const conditionsString = userConditions
    ? `${userConditions.totalRain10d > 25 ? 'Excellent moisture' : userConditions.totalRain10d > 10 ? 'Good moisture' : 'Dry conditions'} · ${Math.round(userConditions.totalRain10d)}mm rain (10d) · ${Math.round(userConditions.tAvg)}°C avg`
    : geoStatus === 'requesting' ? 'Reading your ecological surroundings…'
    : geoStatus === 'denied' ? 'Location declined — pick a node manually'
    : geoStatus === 'unavailable' ? 'Geolocation not available'
    : '';

  // When a habitat filter is active we render ALL nodes (so the user can see what
  // they're filtering against) but visually dim the non-matching ones and add a
  // highlight halo to matching ones. The numeric counts still use the matching set.
  const filteredNodes = ECO_NODES.filter(n =>
    habitatFilter === 'all' || n.nodeType === habitatFilter
  );

  // Fetch GBIF observations + foraging conditions when a node is selected
  useEffect(() => {
    if (!selectedNode) {
      setGbifObs([]); setGbifSpecies('');
      setConditions(null);
      return;
    }
    const primarySpecies = selectedNode.species[0]?.name || '';
    const [lng, lat] = selectedNode.coordinates;

    // GBIF
    if (primarySpecies) {
      setGbifLoading(true);
      setGbifObs([]);
      setGbifSpecies(primarySpecies);
      fetch(`/api/gbif-observations?taxon=${encodeURIComponent(primarySpecies)}&lat=${lat}&lng=${lng}&radius=200&limit=80`)
        .then(r => r.json())
        .then(data => { if (data.observations) setGbifObs(data.observations); })
        .catch(() => {})
        .finally(() => setGbifLoading(false));
    }

    // Weather / foraging conditions
    setConditionsLoading(true);
    setConditions(null);
    fetch(`/api/forage-conditions?lat=${lat}&lng=${lng}`)
      .then(r => r.json())
      .then(data => { if (data.score) setConditions(data); })
      .catch(() => {})
      .finally(() => setConditionsLoading(false));
  }, [selectedNode?.id]);

  // ── Sporecast-style bbox fungal loader ─────────────────────────────
  //   Debounced. Fires whenever the map settles (moveend/zoomend) and
  //   the current bbox has drifted meaningfully from the last fetched
  //   one. Skips very-wide-zoom queries that would timeout.
  const fetchFungalForBbox = useCallback((bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number }, zoom: number) => {
    // Skip huge bboxes — pulling >100 deg lat/lng would time out and
    // wouldn't render anything useful anyway. iNat/GBIF caps at 300pts.
    const latSpan = bbox.maxLat - bbox.minLat;
    const lngSpan = bbox.maxLng - bbox.minLng;
    if (latSpan > 60 || lngSpan > 90) return;
    // Skip if bbox hasn't drifted more than ~25% of previous span.
    const prev = lastFungalBboxRef.current;
    if (prev) {
      const prevLatSpan = prev.maxLat - prev.minLat;
      const prevLngSpan = prev.maxLng - prev.minLng;
      const drift = Math.max(
        Math.abs(bbox.minLat - prev.minLat) / prevLatSpan,
        Math.abs(bbox.maxLat - prev.maxLat) / prevLatSpan,
        Math.abs(bbox.minLng - prev.minLng) / prevLngSpan,
        Math.abs(bbox.maxLng - prev.maxLng) / prevLngSpan,
      );
      if (drift < 0.25 && fungalObs.length > 0) return;
    }
    lastFungalBboxRef.current = bbox;
    setFungalLoading(true);
    // Denser dots at higher zoom, thinner at wide zoom
    const limit = zoom >= 8 ? 250 : zoom >= 5 ? 180 : 120;
    fetch(`/api/mushroom-observations?minLat=${bbox.minLat.toFixed(3)}&maxLat=${bbox.maxLat.toFixed(3)}&minLng=${bbox.minLng.toFixed(3)}&maxLng=${bbox.maxLng.toFixed(3)}&months=12&limit=${limit}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.observations)) setFungalObs(data.observations);
      })
      .catch(() => {})
      .finally(() => setFungalLoading(false));
  }, [fungalObs.length]);

  // Debounced map settle handler
  const settleTimerRef = useRef<any>(null);
  const handleMapSettle = useCallback(() => {
    if (!showFungalLayer) return;
    if (!mapRef.current) return;
    const map = mapRef.current.getMap ? mapRef.current.getMap() : mapRef.current;
    if (!map || !map.getBounds) return;
    clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => {
      const b = map.getBounds();
      const zoom = map.getZoom ? map.getZoom() : 5;
      fetchFungalForBbox({
        minLat: b.getSouth(), maxLat: b.getNorth(),
        minLng: b.getWest(),  maxLng: b.getEast(),
      }, zoom);
    }, 500);
  }, [fetchFungalForBbox, showFungalLayer]);

  // Kick a first fetch once map + viewport are ready (200ms after mount)
  useEffect(() => {
    if (!showFungalLayer) return;
    const t = setTimeout(() => handleMapSettle(), 700);
    return () => clearTimeout(t);
  }, [handleMapSettle, showFungalLayer]);

  // ── Ask MYCO — send a question with location + region context ──────
  //
  // Location precedence:
  //   1. If the user typed a region name → send it, let the server
  //      geocode. This is authoritative — the user can ask about
  //      Lago di Garda while physically sitting in Berlin.
  //   2. Else user's GPS coords.
  //   3. Else selected map node.
  //   4. Else map center.
  //
  // When MYCO returns with a geocoded location, fly the map there
  // so the visual matches what MYCO is talking about.
  const askMyco = useCallback(async (question: string) => {
    const q = question.trim();
    if (!q || mycoLoading) return;

    // Collect a fallback lat/lng in case regionName is empty
    let lat: number | null = userLocation?.lat ?? null;
    let lng: number | null = userLocation?.lng ?? null;
    if (lat === null && selectedNode) {
      [lng, lat] = selectedNode.coordinates;
    }
    if ((lat === null || lng === null) && mapRef.current) {
      const map = mapRef.current.getMap ? mapRef.current.getMap() : mapRef.current;
      const c = map?.getCenter ? map.getCenter() : null;
      if (c) { lat = c.lat; lng = c.lng; }
    }
    // Only refuse if we have NEITHER a region name NOR coords —
    // typed region name alone is now a valid submission.
    if (!mycoRegionName.trim() && (lat === null || lng === null)) {
      setMycoMessages(m => [...m, { role: 'user', content: q }, { role: 'assistant', content: 'Type a place name (e.g. "Lago di Garda, Italy" or "Dalarna, Sweden") or share your location, then ask again.' }]);
      setMycoInput('');
      return;
    }
    const nextMessages: MycoMsg[] = [...mycoMessages, { role: 'user', content: q }];
    setMycoMessages(nextMessages);
    setMycoInput('');
    setMycoLoading(true);
    try {
      const res = await fetch('/api/myco-forage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          lat, lng,
          regionName: mycoRegionName.trim() || undefined,
          history: mycoMessages.slice(-6),
        }),
      });
      const data = await res.json();
      const reply = data.reply || data.error || 'MYCO is quiet right now — try again shortly.';
      setMycoMessages(m => [...m, { role: 'assistant', content: reply }]);

      // If the server resolved a location, record it, fly the map,
      // and — critically — update the region-name field when MYCO
      // jumped locations because of a mention IN THE QUESTION.
      // Otherwise the stale region field would keep overriding the
      // user's next turn.
      const resolved = data?.context?.location as MycoResolvedLocation | undefined;
      if (resolved && Number.isFinite(resolved.lat) && Number.isFinite(resolved.lng)) {
        setMycoResolvedLoc(resolved);
        const jumped =
          resolved.resolvedFrom === 'question-name' ||
          resolved.resolvedFrom === 'question-coords' ||
          resolved.resolvedFrom === 'region-field';
        if (jumped && mapRef.current) {
          mapRef.current.flyTo({
            center: [resolved.lng, resolved.lat],
            zoom: 8,
            duration: 1500,
            essential: true,
          });
        }
        // Sync the region field to the resolved place — makes the
        // next turn's default location match what MYCO just answered
        // about, unless the next turn itself names another place.
        if ((resolved.resolvedFrom === 'question-name' || resolved.resolvedFrom === 'question-coords') && resolved.resolvedName) {
          const short = resolved.resolvedName.split(',').slice(0, 2).join(',').trim();
          setMycoRegionName(short);
        }
      }
    } catch (_) {
      setMycoMessages(m => [...m, { role: 'assistant', content: 'Network hiccup — try again.' }]);
    } finally {
      setMycoLoading(false);
    }
  }, [mycoMessages, mycoLoading, userLocation, selectedNode, mycoRegionName]);

  const handleNodeClick = useCallback((node: EcoNode) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
    // Fly to node
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: node.coordinates,
        zoom: 10,
        duration: 1200,
        essential: true,
      });
    }
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#07110d', overflow: 'hidden' }}>

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        background: 'rgba(7,17,13,0.92)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '0.5px solid rgba(107,214,111,0.12)',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        {/* Brand — title now reads as the page header rather than a small chip,
            so the map page announces itself with the same weight as the home hero. */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', flexShrink: 0 }}>
          <img src="/fungi.png" alt="Fungai Art" style={{ height: 38, width: 38, objectFit: 'cover', borderRadius: '50%', border: '1px solid rgba(232,177,75,0.55)', boxShadow: '0 0 10px rgba(232,177,75,0.4)' }} onError={e => (e.currentTarget.style.display = 'none')} />
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 26, color: '#E6D9B5', lineHeight: 1, letterSpacing: '0.005em' }}>
              The Foraging Map
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 8.5, letterSpacing: '0.26em', textTransform: 'uppercase', color: '#B6F0AE', marginTop: 4 }}>
              Fungai Art &middot; Ecological Intelligence
            </div>
          </div>
        </a>

        <div style={{ width: '0.5px', height: 32, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

        {/* Season filter (multi-select) */}
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 7.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4d5a52', marginRight: 2 }}>Season</div>
          {SEASONS.map(s => {
            const active = seasons.includes(s);
            return (
              <button key={s} onClick={() => {
                setSeasons(prev => {
                  if (prev.includes(s)) {
                    // Don't allow removing the last active season
                    if (prev.length === 1) return prev;
                    return prev.filter(x => x !== s);
                  }
                  return [...prev, s];
                });
              }} style={{
                fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '4px 10px', borderRadius: 5, cursor: 'pointer', transition: 'all 0.15s',
                background: active ? 'rgba(107,214,111,0.12)' : 'none',
                border: active ? '0.5px solid rgba(107,214,111,0.4)' : '0.5px solid rgba(255,255,255,0.1)',
                color: active ? '#B6F0AE' : '#8B7E62',
              }}>
                {SEASON_ICONS[s]} {s}
              </button>
            );
          })}
        </div>

        <div style={{ width: '0.5px', height: 32, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

        {/* Map mode toggle */}
        <button onClick={() => setMapMode(m => m === 'dark' ? 'satellite' : 'dark')} style={{
          fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase',
          padding: '4px 10px', borderRadius: 5, cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
          background: mapMode === 'satellite' ? 'rgba(79,168,224,0.14)' : 'none',
          border: mapMode === 'satellite' ? '0.5px solid rgba(79,168,224,0.45)' : '0.5px solid rgba(255,255,255,0.1)',
          color: mapMode === 'satellite' ? '#7EC8E8' : '#8B7E62',
        }}>
          {mapMode === 'satellite' ? '🛰 Satellite' : '🌑 Dark'}
        </button>

        <div style={{ width: '0.5px', height: 32, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

        {/* Habitat filter */}
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 7.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4d5a52', marginRight: 2 }}>Habitat</div>
          <button onClick={() => setHabitatFilter('all')} style={{
            fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '4px 10px', borderRadius: 5, cursor: 'pointer',
            background: habitatFilter === 'all' ? 'rgba(255,255,255,0.08)' : 'none',
            border: habitatFilter === 'all' ? '0.5px solid rgba(255,255,255,0.25)' : '0.5px solid rgba(255,255,255,0.1)',
            color: habitatFilter === 'all' ? '#E6D9B5' : '#8B7E62',
          }}>All</button>
          {ALL_HABITATS.map(h => {
            const c = HABITAT_COLORS[h] || '#6BD66F';
            const on = habitatFilter === h;
            return (
              <button key={h} onClick={() => setHabitatFilter(on ? 'all' : h as HabitatType)} style={{
                fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '4px 10px', borderRadius: 5, cursor: 'pointer', transition: 'all 0.15s',
                background: on ? `${c}18` : 'none',
                border: on ? `0.5px solid ${c}55` : '0.5px solid rgba(255,255,255,0.1)',
                color: on ? c : '#8B7E62',
              }}>
                {HABITAT_LABELS[h] || h}
              </button>
            );
          })}
        </div>

        {/* Database toggles — Skogsskafferiet / Vild Mad / GBIF. These are
            advanced controls that ate too much of the mobile topbar, so the
            wrapper has class "forage-sources" which is hidden by CSS at
            ≤768px. The toggles can still be reached via the legend at the
            bottom of the page. */}
        <div className="forage-sources" style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Sporecast-style fungal layer — the always-on Kingdom Fungi
              overlay from GBIF + iNaturalist. Distinct amber tone. */}
          <button
            onClick={() => setShowFungalLayer(v => !v)}
            title="Sporecast-style layer: all Kingdom Fungi observations in view (GBIF + iNaturalist research-grade, last 12 months)"
            style={{
              fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase',
              background: showFungalLayer ? 'rgba(200,150,90,0.14)' : 'transparent',
              border: `0.5px solid ${showFungalLayer ? 'rgba(200,150,90,0.55)' : 'rgba(255,255,255,0.12)'}`,
              color: showFungalLayer ? 'rgba(232,192,120,0.95)' : '#4d5a52',
              borderRadius: 4, padding: '4px 10px', cursor: 'pointer', flexShrink: 0,
              transition: 'all 0.18s',
            }}
          >
            {showFungalLayer ? (fungalLoading ? '◐' : '◉') : '○'} Fungi · Live
          </button>
          <button
            onClick={() => setShowSkogsObs(s => !s)}
            title="skogsskafferiet.se — Swedish foraging community"
            style={{
              fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase',
              background: showSkogsObs ? 'rgba(180,230,150,0.12)' : 'transparent',
              border: `0.5px solid ${showSkogsObs ? 'rgba(180,230,150,0.45)' : 'rgba(255,255,255,0.12)'}`,
              color: showSkogsObs ? 'rgba(180,230,150,0.85)' : '#4d5a52',
              borderRadius: 4, padding: '4px 10px', cursor: 'pointer', flexShrink: 0,
              transition: 'all 0.18s',
            }}
          >
            {showSkogsObs ? '◉' : '○'} Skogsskafferiet
          </button>
          <button
            onClick={() => setShowVildMad(v => !v)}
            title="vildmad.dk — Danish open foraging atlas"
            style={{
              fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase',
              background: showVildMad ? 'rgba(220,150,90,0.12)' : 'transparent',
              border: `0.5px solid ${showVildMad ? 'rgba(220,150,90,0.5)' : 'rgba(255,255,255,0.12)'}`,
              color: showVildMad ? 'rgba(232,180,120,0.9)' : '#4d5a52',
              borderRadius: 4, padding: '4px 10px', cursor: 'pointer', flexShrink: 0,
              transition: 'all 0.18s',
            }}
          >
            {showVildMad ? '◉' : '○'} Vild Mad
          </button>
          <a
            href="https://www.gbif.org/"
            target="_blank"
            rel="noopener noreferrer"
            title="Global Biodiversity Information Facility — the official open biodiversity database that powers the per-node sightings"
            style={{
              fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase',
              background: 'rgba(245,215,105,0.06)',
              border: '0.5px solid rgba(245,215,105,0.25)',
              color: 'rgba(245,215,105,0.7)',
              borderRadius: 4, padding: '4px 10px', textDecoration: 'none', flexShrink: 0,
              transition: 'all 0.18s',
            }}
          >
            ◎ GBIF
          </a>
        </div>
        <style>{`@media (max-width: 768px){ .forage-sources { display: none !important; } }`}</style>

        {/* Moon phase */}
        {(() => { const m = getMoonPhase(); return (
          <div title={`${m.name} · day ${m.day} of lunar cycle`} style={{
            fontFamily: 'monospace', fontSize: 8, color: '#8B7E62', flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 5, cursor: 'default',
            padding: '4px 8px', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 4,
          }}>
            <span style={{ fontSize: 14 }}>{m.emoji}</span>
            <span style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>{m.name}</span>
          </div>
        ); })()}

        {/* PWA install button — only shown when browser fires beforeinstallprompt */}
        <InstallButton />

        {/* Node count */}
        <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#4d5a52', flexShrink: 0 }}>
          {filteredNodes.length} nodes · {filteredNodes.filter(n => n.best_season.some(s => seasons.includes(s))).length} active now
        </div>
      </div>

      {/* "Growing Around You" — ecological intelligence overlay.
          Renders only when user has shared location AND the panel is open.
          Floats over the map, top-right on desktop / collapsible on mobile. */}
      {userLocation && growingPanelOpen && userInsight && (
        <div style={{
          position: 'absolute', top: 76, right: 16, zIndex: 9,
          width: 'min(360px, calc(100vw - 32px))',
          maxHeight: 'calc(100vh - 110px)',
          overflowY: 'auto',
          background: 'rgba(7,17,13,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '0.5px solid rgba(107,214,111,0.25)',
          borderRadius: 14,
          padding: '16px 16px 14px',
          boxShadow: '0 12px 48px rgba(0,0,0,0.55)',
          color: '#E6D9B5',
          fontFamily: "'Cormorant Garamond', serif",
        }}>
          {/* Close handle */}
          <button
            onClick={() => setGrowingPanelOpen(false)}
            style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', color: '#8B7E62', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
            title="Hide panel"
          >×</button>

          <div style={{ fontFamily: 'monospace', fontSize: 8.5, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#6BD66F', marginBottom: 6 }}>
            ✦ Growing around you · right now
          </div>
          {/* Reverse-geocoded place — makes the "around you" feel literal.
              Renders before the zone name so the reader sees where they
              are, then the ecological read of that place. */}
          {userPlace && (userPlace.city || userPlace.region || userPlace.country) && (
            <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#E8B14B', marginBottom: 4 }}>
              📍 {[userPlace.city, userPlace.region, userPlace.country].filter(Boolean).join(' · ')}
            </div>
          )}
          <div style={{ fontStyle: 'italic', fontSize: 19, lineHeight: 1.15, color: '#E6D9B5' }}>
            {userInsight.zoneName}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 9.5, letterSpacing: '0.06em', color: '#8B7E62', marginTop: 6, lineHeight: 1.55 }}>
            {conditionsString}
          </div>

          {/* High probability — leafy plants in season */}
          {userInsight.highProbability.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6BD66F', marginBottom: 6 }}>
                High probability
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {userInsight.highProbability.map(s => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '6px 10px', background: 'rgba(107,214,111,0.05)', border: '0.5px solid rgba(107,214,111,0.18)', borderRadius: 6 }}>
                    <span style={{ fontSize: 13, color: '#E6D9B5', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#6BD66F', flexShrink: 0 }}>{Math.round(s.probability * 100)}%</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 8.5, color: '#4d5a52', flexShrink: 0 }}>{s.distKm < 10 ? '<10' : Math.round(s.distKm)}km</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emerging after rain — fungal flush */}
          {userInsight.emergingAfterRain.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C48838', marginBottom: 6 }}>
                Emerging after rain
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {userInsight.emergingAfterRain.map(s => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '6px 10px', background: 'rgba(196,136,56,0.06)', border: '0.5px solid rgba(196,136,56,0.22)', borderRadius: 6 }}>
                    <span style={{ fontSize: 13, color: '#E6D9B5', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#E8B14B', flexShrink: 0 }}>{Math.round(s.probability * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Peak medicinal window */}
          {userInsight.peakMedicinal.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#A88FE0', marginBottom: 6 }}>
                Peak medicinal window
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {userInsight.peakMedicinal.map(s => (
                  <span key={s.name} style={{ fontSize: 11, padding: '4px 9px', borderRadius: 99, background: 'rgba(168,143,224,0.08)', border: '0.5px solid rgba(168,143,224,0.3)', color: '#C5B5F5', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}>
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Distance hint */}
          <div style={{ marginTop: 16, paddingTop: 10, borderTop: '0.5px solid rgba(255,255,255,0.06)', fontFamily: 'monospace', fontSize: 8.5, color: '#4d5a52', lineHeight: 1.6 }}>
            Nearest ecological node {Math.round(userInsight.nearestKm)}km away.
            Tap any pin on the map for full habitat detail.
          </div>
        </div>
      )}

      {/* Reopen-panel handle when closed */}
      {userLocation && !growingPanelOpen && userInsight && (
        <button
          onClick={() => setGrowingPanelOpen(true)}
          style={{
            position: 'absolute', top: 76, right: 16, zIndex: 9,
            background: 'rgba(7,17,13,0.92)', backdropFilter: 'blur(14px)',
            border: '0.5px solid rgba(107,214,111,0.35)', borderRadius: 99,
            padding: '8px 16px', color: '#6BD66F', cursor: 'pointer',
            fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
          }}
        >
          ✦ Growing around you
        </button>
      )}

      {/* Geolocation status pill — small unobtrusive feedback while requesting */}
      {geoStatus === 'requesting' && (
        <div style={{
          position: 'absolute', top: 76, right: 16, zIndex: 9,
          background: 'rgba(7,17,13,0.92)', backdropFilter: 'blur(14px)',
          border: '0.5px solid rgba(107,214,111,0.25)', borderRadius: 99,
          padding: '8px 16px', color: '#8B7E62',
          fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
        }}>
          ✦ Reading ecological surroundings…
        </div>
      )}

      {/* Map */}
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 18, latitude: 50, zoom: 3.6 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapMode === 'satellite' ? SATELLITE_STYLE : MAP_STYLE}
        onLoad={handleMapSettle}
        onMoveEnd={handleMapSettle}
      >
        <NavigationControl position="bottom-right" style={{ marginBottom: 80 }} />

        {/* Sporecast-style fungal observation layer — always-on across
            the current viewport once the map settles. Amber-brown tone so
            it's distinct from GBIF-per-node yellow, Skogs green,
            Vild Mad orange. Sourced from GBIF Kingdom Fungi +
            iNaturalist research-grade, last 12 months. */}
        {showFungalLayer && fungalObs.map(obs => (
          <Marker key={`fungal-${obs.id}`} longitude={obs.lng} latitude={obs.lat} anchor="center">
            <div
              onMouseEnter={() => setHoveredFungal(obs)}
              onMouseLeave={() => setHoveredFungal(null)}
              title={`${obs.species}${obs.date ? ' · ' + obs.date : ''} · ${obs.source}`}
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: obs.source === 'iNaturalist' ? 'rgba(155,110,60,0.65)' : 'rgba(120,90,50,0.55)',
                border: `0.5px solid ${obs.source === 'iNaturalist' ? 'rgba(200,150,90,0.9)' : 'rgba(160,120,80,0.8)'}`,
                cursor: 'pointer',
                boxShadow: '0 0 3px rgba(120,90,50,0.35)',
              }}
            />
          </Marker>
        ))}

        {/* Fungal hover tooltip */}
        {hoveredFungal && (
          <Marker longitude={hoveredFungal.lng} latitude={hoveredFungal.lat} anchor="bottom" offset={[0, -6]}>
            <div style={{
              background: 'rgba(7,17,13,0.95)', border: '0.5px solid rgba(200,150,90,0.35)',
              borderRadius: 6, padding: '5px 10px', pointerEvents: 'none', whiteSpace: 'nowrap',
            }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 12, color: '#E8C078' }}>
                {hoveredFungal.species}
              </div>
              {hoveredFungal.commonName && (
                <div style={{ fontFamily: 'monospace', fontSize: 8, color: '#C9B894', marginTop: 1 }}>
                  {hoveredFungal.commonName}
                </div>
              )}
              {hoveredFungal.date && (
                <div style={{ fontFamily: 'monospace', fontSize: 7.5, color: '#8B7E62', marginTop: 2 }}>
                  {hoveredFungal.date}{hoveredFungal.region ? ` · ${hoveredFungal.region}` : ''}
                </div>
              )}
              <div style={{ fontFamily: 'monospace', fontSize: 7, color: '#4d5a52', marginTop: 2, letterSpacing: '0.1em' }}>
                {hoveredFungal.source}
              </div>
            </div>
          </Marker>
        )}

        {/* "You are here" marker — soft amber pulse so the user always
            knows where they're standing in the ecological field. When
            the reverse-geocode has resolved, a small city/region label
            sits below the dot so the map itself names the location. */}
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <div style={{ position: 'relative', width: 14, height: 14 }} title={userPlace ? [userPlace.city, userPlace.region, userPlace.country].filter(Boolean).join(', ') : 'You are here'}>
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: 36, height: 36, borderRadius: '50%',
                border: '1px solid #E8B14B', opacity: 0.5,
                animation: 'youHerePulse 2.6s ease-out infinite',
                pointerEvents: 'none',
              }} />
              <div style={{
                width: 14, height: 14, borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #FFD680, #E8B14B 70%)',
                boxShadow: '0 0 14px rgba(232,177,75,0.65)',
                border: '1px solid rgba(255,255,255,0.4)',
              }} />
              {/* Place-name chip below the dot. Only renders once the
                  reverse-geocode has returned so the map isn't showing
                  an empty ghost label during the ~200ms lookup. */}
              {userPlace && (userPlace.city || userPlace.region) && (
                <div style={{
                  position: 'absolute',
                  top: 22, left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(7,17,13,0.9)',
                  border: '0.5px solid rgba(232,177,75,0.4)',
                  borderRadius: 4, padding: '3px 8px',
                  fontFamily: 'monospace', fontSize: 8.5,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: '#E8B14B', whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                }}>
                  {userPlace.city || userPlace.region}
                  {userPlace.city && userPlace.region && ` · ${userPlace.region}`}
                </div>
              )}
              <style>{`
                @keyframes youHerePulse {
                  0%   { transform: translate(-50%,-50%) scale(1);   opacity: 0.55; }
                  100% { transform: translate(-50%,-50%) scale(2.4); opacity: 0;    }
                }
              `}</style>
            </div>
          </Marker>
        )}

        {/* Skogsskafferiet community observation dots — always visible layer */}
        {showSkogsObs && SKOGSSKAFFERIET_OBS.map(entry =>
          entry.points.map((pt, i) => (
            <Marker key={`skogs-${entry.latin}-${i}`} longitude={pt[0]} latitude={pt[1]} anchor="center">
              <div
                onMouseEnter={() => setHoveredSkogsHerb(`${entry.herb} (${entry.latin}) · ${entry.county}`)}
                onMouseLeave={() => setHoveredSkogsHerb(null)}
                title={`${entry.herb} — ${entry.latin} · skogsskafferiet.se`}
                style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: 'rgba(180,230,150,0.6)',
                  border: '0.5px solid rgba(180,230,150,0.9)',
                  cursor: 'default',
                  boxShadow: '0 0 3px rgba(180,230,150,0.25)',
                }}
              />
            </Marker>
          ))
        )}

        {/* Skogsskafferiet hover tooltip */}
        {hoveredSkogsHerb && (
          <div style={{
            position: 'absolute', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 15,
            background: 'rgba(7,17,13,0.95)', border: '0.5px solid rgba(180,230,150,0.3)',
            borderRadius: 6, padding: '5px 12px', pointerEvents: 'none', whiteSpace: 'nowrap',
          }}>
            <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(180,230,150,0.85)', letterSpacing: '0.1em', fontStyle: 'italic' }}>{hoveredSkogsHerb}</span>
            <span style={{ fontFamily: 'monospace', fontSize: 7.5, color: '#4d5a52', marginLeft: 8, letterSpacing: '0.1em' }}>citizen observation · skogsskafferiet.se</span>
          </div>
        )}

        {/* Vild Mad — Danish foraging atlas observation dots (vildmad.dk) */}
        {showVildMad && VILDMAD_OBS.map(entry =>
          entry.points.map((pt, i) => (
            <Marker key={`vildmad-${entry.latin}-${i}`} longitude={pt[0]} latitude={pt[1]} anchor="center">
              <div
                onMouseEnter={() => setHoveredVildMadHerb(`${entry.herb} (${entry.latin}) · ${entry.region}`)}
                onMouseLeave={() => setHoveredVildMadHerb(null)}
                title={`${entry.herb} — ${entry.latin} · vildmad.dk`}
                style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: 'rgba(220,150,90,0.6)',
                  border: '0.5px solid rgba(220,150,90,0.95)',
                  cursor: 'default',
                  boxShadow: '0 0 3px rgba(220,150,90,0.3)',
                }}
              />
            </Marker>
          ))
        )}

        {/* Vild Mad hover tooltip */}
        {hoveredVildMadHerb && (
          <div style={{
            position: 'absolute', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 15,
            background: 'rgba(7,17,13,0.95)', border: '0.5px solid rgba(220,150,90,0.35)',
            borderRadius: 6, padding: '5px 12px', pointerEvents: 'none', whiteSpace: 'nowrap',
          }}>
            <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(232,180,120,0.9)', letterSpacing: '0.1em', fontStyle: 'italic' }}>{hoveredVildMadHerb}</span>
            <span style={{ fontFamily: 'monospace', fontSize: 7.5, color: '#4d5a52', marginLeft: 8, letterSpacing: '0.1em' }}>vild mad · vildmad.dk</span>
          </div>
        )}

        {/* GBIF community observation dots */}
        {gbifObs.map(obs => (
          <Marker key={`gbif-${obs.id}`} longitude={obs.lng} latitude={obs.lat} anchor="center">
            <div
              onMouseEnter={() => setHoveredObs(obs)}
              onMouseLeave={() => setHoveredObs(null)}
              title={`${obs.species}${obs.date ? ' · ' + obs.date : ''}${obs.region ? ' · ' + obs.region : ''}`}
              style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'rgba(245,215,105,0.55)',
                border: '0.5px solid rgba(245,215,105,0.8)',
                cursor: 'default',
                transition: 'transform 0.15s',
                boxShadow: '0 0 4px rgba(245,215,105,0.3)',
              }}
            />
          </Marker>
        ))}

        {/* Hovered GBIF obs tooltip */}
        {hoveredObs && (
          <Marker longitude={hoveredObs.lng} latitude={hoveredObs.lat} anchor="bottom" offset={[0, -6]}>
            <div style={{
              background: 'rgba(7,17,13,0.95)', border: '0.5px solid rgba(245,215,105,0.35)',
              borderRadius: 6, padding: '5px 10px', pointerEvents: 'none', whiteSpace: 'nowrap',
            }}>
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#F5D769', letterSpacing: '0.1em', fontStyle: 'italic' }}>{hoveredObs.species}</div>
              {hoveredObs.date && <div style={{ fontFamily: 'monospace', fontSize: 8, color: '#8B7E62', marginTop: 2 }}>{hoveredObs.date}{hoveredObs.region ? ` · ${hoveredObs.region}` : ''}</div>}
              <div style={{ fontFamily: 'monospace', fontSize: 7, color: '#4d5a52', marginTop: 2, letterSpacing: '0.1em' }}>GBIF · CC0</div>
            </div>
          </Marker>
        )}

        {/* Curated eco-nodes — render ALL so the habitat filter visually fades
            non-matching pins rather than removing them. A matching pin gets a
            big colored halo so the area really stands out. */}
        {ECO_NODES.map(node => {
          const matches = habitatFilter === 'all' || node.nodeType === habitatFilter;
          const dimmed  = habitatFilter !== 'all' && !matches;
          const highlight = habitatFilter !== 'all' && matches;
          return (
            <Marker
              key={node.id}
              longitude={node.coordinates[0]}
              latitude={node.coordinates[1]}
              anchor="center"
            >
              <NodeMarker
                node={node}
                isSelected={selectedNode?.id === node.id}
                isHovered={hoveredNode === node.id}
                isHighlighted={highlight}
                isDimmed={dimmed}
                seasons={seasons}
                onClick={() => handleNodeClick(node)}
                onHover={() => setHoveredNode(node.id)}
                onLeave={() => setHoveredNode(null)}
              />
            </Marker>
          );
        })}
      </Map>

      {/* GBIF loading pill */}
      {gbifLoading && (
        <div style={{
          position: 'absolute', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 15,
          background: 'rgba(7,17,13,0.92)', border: '0.5px solid rgba(245,215,105,0.3)',
          borderRadius: 20, padding: '5px 14px',
          fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'rgba(245,215,105,0.7)',
          animation: 'pulse 1.2s ease-in-out infinite',
        }}>
          ◎ Loading GBIF observations for {gbifSpecies}…
        </div>
      )}

      {/* GBIF count badge when loaded */}
      {!gbifLoading && gbifObs.length > 0 && (
        <div style={{
          position: 'absolute', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 15,
          background: 'rgba(7,17,13,0.88)', border: '0.5px solid rgba(245,215,105,0.2)',
          borderRadius: 20, padding: '5px 14px',
          fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'rgba(245,215,105,0.55)',
        }}>
          {gbifObs.length} community sightings · GBIF · CC0
        </div>
      )}

      {/* Legend — full habitat checklist on desktop. On mobile (≤640px) this
          collapses to a single "Habitats ▾" pill that expands inline so it
          stops eating half the map. The collapsible state lives on a CSS
          class triggered by the .legend-mobile-toggle button. */}
      <div className="forage-legend" style={{
        position: 'absolute', bottom: 80, left: 20, zIndex: 10,
        background: 'rgba(7,17,13,0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '0.5px solid rgba(255,255,255,0.1)',
        borderRadius: 8, padding: '10px 14px',
      }}>
        <button
          className="forage-legend-toggle"
          onClick={() => setLegendOpen(o => !o)}
          aria-expanded={legendOpen}
          style={{
            display: 'none',
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: '#8B7E62', fontFamily: 'monospace', fontSize: 8,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            width: '100%', textAlign: 'left',
          }}
        >
          <span>Habitats {habitatFilter !== 'all' ? `· ${HABITAT_LABELS[habitatFilter as HabitatType]}` : '· tap to filter'}</span>
          <span style={{ float: 'right', color: '#6BD66F' }}>{legendOpen ? '▴' : '▾'}</span>
        </button>
        <div className={`forage-legend-body${legendOpen ? ' open' : ''}`}>
          <div style={{ fontFamily: 'monospace', fontSize: 7, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4d5a52', marginBottom: 7, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span>Habitats · tap to filter</span>
            {habitatFilter !== 'all' && (
              <button onClick={() => setHabitatFilter('all')} style={{ background: 'none', border: 'none', color: '#6BD66F', fontSize: 7, fontFamily: 'monospace', letterSpacing: '0.14em', cursor: 'pointer', padding: 0 }}>clear ×</button>
            )}
          </div>
          {Object.entries(HABITAT_LABELS).filter(([h]) => ALL_HABITATS.includes(h as HabitatType)).map(([h, label]) => {
            const active = habitatFilter === h;
            return (
              <button
                key={h}
                onClick={() => setHabitatFilter(active ? 'all' : (h as HabitatType))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3,
                  background: active ? `${HABITAT_COLORS[h]}1f` : 'none',
                  border: active ? `0.5px solid ${HABITAT_COLORS[h]}88` : '0.5px solid transparent',
                  borderRadius: 4, padding: '3px 6px', cursor: 'pointer',
                  width: '100%', textAlign: 'left',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
              >
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: HABITAT_COLORS[h], boxShadow: `0 0 5px ${HABITAT_COLORS[h]}77`, flexShrink: 0 }} />
                <span style={{ fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: active ? '#E6D9B5' : '#8B7E62' }}>{label}</span>
              </button>
            );
          })}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(107,214,111,0.6)', boxShadow: '0 0 6px rgba(107,214,111,0.5)' }} />
              <span style={{ fontFamily: 'monospace', fontSize: 8, color: '#6BD66F', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Active this season</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
              <span style={{ fontFamily: 'monospace', fontSize: 8, color: '#4d5a52', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Off-season</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(245,215,105,0.55)', border: '0.5px solid rgba(245,215,105,0.8)' }} />
              <span style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(245,215,105,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>GBIF sighting</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(155,110,60,0.65)', border: '0.5px solid rgba(200,150,90,0.9)' }} />
              <span style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(232,192,120,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Fungi · Live (bbox)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(180,230,150,0.6)', border: '0.5px solid rgba(180,230,150,0.9)' }} />
              <span style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(180,230,150,0.65)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Skogsskafferiet · SE</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(220,150,90,0.6)', border: '0.5px solid rgba(220,150,90,0.95)' }} />
              <span style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(232,180,120,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Vild Mad · DK</span>
            </div>
          </div>
        </div>
        <style>{`
          @media (max-width: 640px) {
            .forage-legend {
              left: 12px !important;
              right: 12px !important;
              bottom: 70px !important;
              padding: 8px 12px !important;
              max-width: 220px;
            }
            .forage-legend-toggle { display: block !important; }
            .forage-legend-body { display: none; margin-top: 8px; }
            .forage-legend-body.open { display: block; }
          }
        `}</style>
      </div>

      {/* Harvest Now panel */}
      {showHarvest && (
        <div style={{
          position: 'absolute', bottom: 60, right: 20, zIndex: 15,
          width: 260, maxHeight: '55vh', overflowY: 'auto',
          background: 'rgba(7,17,13,0.97)', backdropFilter: 'blur(16px)',
          border: '0.5px solid rgba(107,214,111,0.2)', borderRadius: 10, padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: 7, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4d5a52' }}>Multi-source · live</div>
              <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6BD66F', marginTop: 2 }}>
                Harvest — {MONTH_SV[currentMonth]}
              </div>
            </div>
            <button onClick={() => setShowHarvest(false)} style={{ background: 'none', border: 'none', color: '#4d5a52', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {harvestNow.map(p => (
              <div key={p.sv} title={`${p.latin || ''} · ${p.parts || ''}`} style={{
                padding: '3px 8px', borderRadius: 4, cursor: 'default',
                background: p.type === 'fungi' ? 'rgba(79,168,224,0.1)' : p.type === 'berry' ? 'rgba(232,177,75,0.1)' : p.type === 'tree' ? 'rgba(107,214,111,0.07)' : 'rgba(255,255,255,0.04)',
                border: `0.5px solid ${p.type === 'fungi' ? 'rgba(79,168,224,0.35)' : p.type === 'berry' ? 'rgba(232,177,75,0.35)' : p.type === 'tree' ? 'rgba(107,214,111,0.25)' : 'rgba(255,255,255,0.1)'}`,
              }}>
                <div style={{ fontFamily: 'monospace', fontSize: 8.5, color: p.type === 'fungi' ? '#A6D5F2' : p.type === 'berry' ? '#F5D689' : p.type === 'tree' ? '#B6F0AE' : '#C9B894', letterSpacing: '0.06em' }}>{p.en}</div>
                {p.parts && <div style={{ fontFamily: 'monospace', fontSize: 6.5, color: '#4d5a52', letterSpacing: '0.06em', marginTop: 1 }}>{p.parts.split(',')[0]}</div>}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: '0.5px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(107,214,111,0.5)' }} /><span style={{ fontFamily: 'monospace', fontSize: 7, color: '#4d5a52', letterSpacing: '0.08em' }}>Tree</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(79,168,224,0.5)' }} /><span style={{ fontFamily: 'monospace', fontSize: 7, color: '#4d5a52', letterSpacing: '0.08em' }}>Fungi</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(232,177,75,0.5)' }} /><span style={{ fontFamily: 'monospace', fontSize: 7, color: '#4d5a52', letterSpacing: '0.08em' }}>Berry</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} /><span style={{ fontFamily: 'monospace', fontSize: 7, color: '#4d5a52', letterSpacing: '0.08em' }}>Plant</span></div>
          </div>
        </div>
      )}

      {/* Bottom nav links — "← Home" button removed per design call. The
          nav at the top of the page already covers going back. */}
      <div style={{
        position: 'absolute', bottom: 20, left: 20, zIndex: 10,
        display: 'flex', gap: 8, flexWrap: 'wrap',
      }}>
        <button onClick={() => setShowHarvest(h => !h)} style={{
          fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.14em', textTransform: 'uppercase',
          padding: '5px 12px', borderRadius: 4, cursor: 'pointer',
          background: showHarvest ? 'rgba(107,214,111,0.12)' : 'rgba(7,17,13,0.88)',
          border: showHarvest ? '0.5px solid rgba(107,214,111,0.4)' : '0.5px solid rgba(255,255,255,0.1)',
          color: showHarvest ? '#6BD66F' : '#8B7E62',
        }}>
          🌿 Harvest {MONTH_SV[currentMonth]}
        </button>
        <button
          onClick={() => setMycoOpen(o => !o)}
          title="Ask MYCO — the foraging intelligence. Uses your location + 30 days of weather + fresh fungi sightings."
          style={{
            fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.14em', textTransform: 'uppercase',
            padding: '5px 12px', borderRadius: 4, cursor: 'pointer',
            background: mycoOpen ? 'rgba(168,143,224,0.16)' : 'rgba(7,17,13,0.88)',
            border: mycoOpen ? '0.5px solid rgba(168,143,224,0.55)' : '0.5px solid rgba(168,143,224,0.35)',
            color: mycoOpen ? '#C5B5F5' : '#A88FE0',
          }}
        >
          ✦ Ask MYCO
        </button>
      </div>

      {/* MYCO Ask panel — floating chat overlay. Opens from the "Ask MYCO"
          button. Bottom-left on desktop, full-width bottom on mobile. */}
      {mycoOpen && (
        <div
          className="myco-forage-panel"
          style={{
            position: 'absolute', bottom: 60, left: 20, zIndex: 20,
            width: 'min(400px, calc(100vw - 40px))',
            maxHeight: 'min(560px, calc(100vh - 140px))',
            display: 'flex', flexDirection: 'column',
            background: 'rgba(7,17,13,0.96)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: '0.5px solid rgba(168,143,224,0.35)',
            borderRadius: 12,
            boxShadow: '0 16px 56px rgba(0,0,0,0.6), 0 0 32px rgba(168,143,224,0.08)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 14px 10px',
            borderBottom: '0.5px solid rgba(168,143,224,0.15)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #C5B5F5, #7B5FBA)',
              boxShadow: '0 0 10px rgba(168,143,224,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'monospace', fontSize: 12, color: '#0A0619',
              flexShrink: 0,
            }}>✦</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 15, color: '#E6D9B5', lineHeight: 1 }}>
                Ask MYCO
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 7.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8B7E62', marginTop: 3 }}>
                Foraging intelligence · Live weather + sightings
              </div>
            </div>
            <button
              onClick={() => setMycoOpen(false)}
              style={{ background: 'none', border: 'none', color: '#8B7E62', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}
              title="Close"
            >×</button>
          </div>

          {/* Location context row */}
          <div style={{
            padding: '8px 14px',
            borderBottom: '0.5px solid rgba(255,255,255,0.05)',
            fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.12em', color: '#4d5a52',
            display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
          }}>
            <span style={{ color: '#6BD66F' }}>●</span>
            <span style={{ textTransform: 'uppercase' }}>
              {mycoResolvedLoc?.resolvedName && (
                mycoResolvedLoc.resolvedFrom === 'question-name' ||
                mycoResolvedLoc.resolvedFrom === 'question-coords' ||
                mycoResolvedLoc.resolvedFrom === 'region-field'
              )
                ? `Reading · ${mycoResolvedLoc.resolvedName.split(',').slice(0, 2).join(',')}`
                : userLocation
                ? (userPlace && (userPlace.city || userPlace.region)
                    ? `You · ${userPlace.city || userPlace.region}${userPlace.country ? ', ' + userPlace.country : ''}`
                    : 'Your location')
                : selectedNode ? `Node · ${selectedNode.location}`
                : 'Map center'}
            </span>
            <div style={{ flex: 1, minWidth: 140, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                value={mycoRegionName}
                onChange={e => setMycoRegionName(e.target.value.slice(0, 120))}
                placeholder="Name any place, or mention it in your question…"
                style={{
                  flex: 1, minWidth: 0,
                  background: 'transparent', border: 'none',
                  borderBottom: '0.5px solid rgba(255,255,255,0.1)',
                  color: '#E6D9B5', fontFamily: 'monospace', fontSize: 9,
                  padding: '3px 20px 3px 4px', outline: 'none',
                }}
              />
              {mycoRegionName && (
                <button
                  onClick={() => { setMycoRegionName(''); setMycoResolvedLoc(null); }}
                  title="Clear location — MYCO will use your GPS or map center"
                  style={{
                    position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#8B7E62',
                    fontSize: 12, lineHeight: 1, cursor: 'pointer', padding: '2px 4px',
                  }}
                >×</button>
              )}
            </div>
          </div>

          {/* Message list — scroll */}
          <div style={{
            flex: 1, minHeight: 120, overflowY: 'auto',
            padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {mycoMessages.length === 0 && (
              <div style={{
                padding: 12, borderRadius: 8,
                background: 'rgba(168,143,224,0.06)', border: '0.5px solid rgba(168,143,224,0.18)',
                fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: '#C5B5F5', lineHeight: 1.5,
              }}>
                Ask about your region and the mycelial field will answer.
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[
                    'What is most likely fruiting here right now?',
                    'Has it rained enough for chanterelles in the last month?',
                    'What species typically fruit here at this time of year?',
                    'When is the next good foraging window in the forecast?',
                  ].map(s => (
                    <button
                      key={s}
                      onClick={() => askMyco(s)}
                      style={{
                        textAlign: 'left', background: 'rgba(7,17,13,0.4)',
                        border: '0.5px solid rgba(168,143,224,0.2)', borderRadius: 5,
                        padding: '6px 9px', color: '#C5B5F5', cursor: 'pointer',
                        fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.04em',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,143,224,0.12)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(7,17,13,0.4)'}
                    >
                      → {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {mycoMessages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  padding: '9px 12px', borderRadius: 8,
                  background: m.role === 'user'
                    ? 'rgba(107,214,111,0.09)'
                    : 'rgba(168,143,224,0.08)',
                  border: m.role === 'user'
                    ? '0.5px solid rgba(107,214,111,0.25)'
                    : '0.5px solid rgba(168,143,224,0.22)',
                  color: '#E6D9B5',
                  fontFamily: m.role === 'user' ? 'monospace' : "'Cormorant Garamond', serif",
                  fontSize: m.role === 'user' ? 11 : 13.5,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}
              >
                {m.content}
              </div>
            ))}
            {mycoLoading && (
              <div style={{
                alignSelf: 'flex-start',
                padding: '8px 12px', borderRadius: 8,
                background: 'rgba(168,143,224,0.08)', border: '0.5px solid rgba(168,143,224,0.22)',
                fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.14em', color: '#C5B5F5',
                animation: 'pulse 1.4s ease-in-out infinite',
              }}>
                ✦ Reading the field…
              </div>
            )}
          </div>

          {/* Input row */}
          <div style={{
            padding: '10px 14px 12px',
            borderTop: '0.5px solid rgba(168,143,224,0.15)',
            display: 'flex', gap: 6, alignItems: 'flex-end',
          }}>
            <textarea
              value={mycoInput}
              onChange={e => setMycoInput(e.target.value.slice(0, 800))}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  askMyco(mycoInput);
                }
              }}
              placeholder="Ask about weather, sightings, timing…"
              rows={2}
              style={{
                flex: 1,
                background: 'rgba(7,17,13,0.6)',
                border: '0.5px solid rgba(168,143,224,0.25)',
                borderRadius: 6, padding: '8px 10px',
                color: '#E6D9B5', fontFamily: "'Cormorant Garamond', serif", fontSize: 14,
                resize: 'none', outline: 'none', lineHeight: 1.35,
              }}
              disabled={mycoLoading}
            />
            <button
              onClick={() => askMyco(mycoInput)}
              disabled={mycoLoading || !mycoInput.trim()}
              style={{
                padding: '8px 14px',
                background: mycoLoading || !mycoInput.trim() ? 'rgba(168,143,224,0.1)' : 'rgba(168,143,224,0.25)',
                border: '0.5px solid rgba(168,143,224,0.55)',
                borderRadius: 6, color: '#C5B5F5',
                fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase',
                cursor: mycoLoading || !mycoInput.trim() ? 'default' : 'pointer',
                opacity: mycoLoading || !mycoInput.trim() ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
            >
              Ask
            </button>
          </div>
          <style>{`
            @media (max-width: 640px) {
              .myco-forage-panel {
                left: 12px !important;
                right: 12px !important;
                bottom: 12px !important;
                width: auto !important;
                max-height: 70vh !important;
              }
            }
            @keyframes pulse {
              0%, 100% { opacity: 0.55; }
              50%      { opacity: 1;    }
            }
          `}</style>
        </div>
      )}

      {/* Conditions widget — bottom-left when node selected */}
      {selectedNode && (
        <div style={{
          position: 'absolute', bottom: 60, left: 20, zIndex: 15,
          background: 'rgba(7,17,13,0.96)', backdropFilter: 'blur(14px)',
          border: `0.5px solid ${conditions ? conditions.color + '55' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 10, padding: '10px 14px', minWidth: 200,
          transition: 'border-color 0.4s',
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: 7, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4d5a52', marginBottom: 5 }}>Foraging conditions</div>
          {conditionsLoading && <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#4d5a52' }}>Fetching weather…</div>}
          {conditions && !conditionsLoading && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                {/* Score dial */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: `conic-gradient(${conditions.color} ${conditions.score * 36}deg, rgba(255,255,255,0.06) 0deg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: '#07110d',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'monospace', fontSize: 11, color: conditions.color, fontWeight: 'bold',
                  }}>{conditions.score}</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: 11, color: conditions.color, letterSpacing: '0.08em' }}>{conditions.label}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 7.5, color: '#8B7E62', marginTop: 1 }}>{conditions.tAvg}°C · {conditions.totalRain10d}mm / 10d</div>
                </div>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 8, color: '#8B7E62', lineHeight: 1.5, marginBottom: 5 }}>{conditions.detail}</div>
              {/* 3-day forecast mini-bar */}
              <div style={{ display: 'flex', gap: 5 }}>
                {conditions.forecast.map(f => (
                  <div key={f.date} style={{ flex: 1, textAlign: 'center', padding: '4px 2px', background: 'rgba(255,255,255,0.03)', borderRadius: 4, border: '0.5px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 7, color: '#4d5a52', letterSpacing: '0.06em' }}>{new Date(f.date).toLocaleDateString('en', { weekday: 'short' })}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 8.5, color: f.rain > 5 ? '#A6D5F2' : '#8B7E62', marginTop: 2 }}>{f.rain > 0 ? `${Math.round(f.rain)}mm` : '—'}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 7.5, color: '#E6D9B5', marginTop: 1 }}>{Math.round(f.tMax)}°</div>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 6.5, color: '#2d3a32', marginTop: 5, letterSpacing: '0.06em' }}>Open-Meteo · CC BY 4.0</div>
            </>
          )}
        </div>
      )}

      {/* Node panel — slides in from right */}
      {selectedNode && (
        <NodePanel
          node={selectedNode}
          activeSeason={seasons}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {/* Node count badge when no node selected */}
      {!selectedNode && (
        <div style={{
          position: 'absolute', top: 90, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(7,17,13,0.85)',
          backdropFilter: 'blur(8px)',
          border: '0.5px solid rgba(107,214,111,0.2)',
          borderRadius: 999, padding: '6px 16px',
          fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase',
          color: '#6BD66F', zIndex: 10, pointerEvents: 'none',
        }}>
          {filteredNodes.filter(n => n.best_season.some(s => seasons.includes(s))).length} nodes active · tap any to explore
        </div>
      )}
    </div>
  );
}
