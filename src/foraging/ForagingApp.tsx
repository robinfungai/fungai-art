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

// GBIF observation type
interface GBIFObs { id: number; lat: number; lng: number; species: string; date: string | null; region: string | null; }

// Foraging conditions type
interface ForageConditions {
  score: number; label: string; color: string; detail: string;
  tAvg: number; tMax: number; tMin: number;
  totalRain10d: number; totalRain3to7: number; todayRain: number;
  forecast: { date: string; rain: number; tMax: number; tMin: number }[];
}

// Organic earthy map style — CARTO Voyager (warm/natural tones, no account needed).
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

// Free satellite imagery — ESRI World Imagery (no account or token needed).
const SATELLITE_STYLE = {
  version: 8 as const,
  sources: {
    satellite: {
      type: 'raster' as const,
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256 as const,
      attribution: '© Esri, Earthstar Geographics',
    },
  },
  layers: [{ id: 'satellite-layer', type: 'raster' as const, source: 'satellite' }],
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
  }, [userLocation]);

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
    // Dedupe by species name, keep highest-probability entry
    const bestByName = new Map<string, Scored>();
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
        {/* Brand */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <img src="/abc12345.png" alt="Fungai Art" style={{ height: 32, width: 'auto', objectFit: 'contain' }} onError={e => (e.currentTarget.style.display = 'none')} />
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 17, color: '#E6D9B5', lineHeight: 1 }}>
              Foraging Map
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 7.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#8B7E62', marginTop: 2 }}>
              Fungai Art · ecological intelligence
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

        {/* Database toggles — each open foraging database is a separately toggleable
            layer. Lets you compare what each citizen-science source claims about
            the same region. */}
        <button
          onClick={() => setShowSkogsObs(s => !s)}
          title="skogsskafferiet.se — Swedish foraging community"
          style={{
            marginLeft: 'auto',
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
        initialViewState={{ longitude: 14, latitude: 58, zoom: 4.2 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapMode === 'satellite' ? SATELLITE_STYLE : MAP_STYLE}
      >
        <NavigationControl position="bottom-right" style={{ marginBottom: 80 }} />

        {/* "You are here" marker — soft amber pulse so the user always
            knows where they're standing in the ecological field. */}
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <div style={{ position: 'relative', width: 14, height: 14 }} title="You are here">
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
      </div>

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
