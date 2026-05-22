import { useState, useCallback, useRef, useEffect } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ECO_NODES, HABITAT_COLORS, HABITAT_LABELS } from '../data/ecoNodes';
import { SKOGSSKAFFERIET_OBS } from '../data/skogsskafferietObs';
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

function NodeMarker({ node, isSelected, isHovered, seasons, onClick, onHover, onLeave }: {
  node: EcoNode; isSelected: boolean; isHovered: boolean; seasons: Season[];
  onClick: () => void; onHover: () => void; onLeave: () => void;
}) {
  const color = HABITAT_COLORS[node.nodeType] || '#6BD66F';
  const inSeason = node.best_season.some(s => seasons.includes(s));
  const size = isSelected ? 22 : isHovered ? 18 : 14;
  const opacity = inSeason ? 1 : 0.5;

  return (
    <div
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{ cursor: 'pointer', position: 'relative', opacity }}
    >
      {/* Outer pulse ring — active season only */}
      {inSeason && (
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
        boxShadow: `0 0 ${isSelected ? 20 : isHovered ? 14 : 8}px ${color}${isSelected ? 'BB' : isHovered ? '88' : '55'}`,
        transition: 'all 0.2s',
        border: `1px solid ${color}`,
      }} />
      <style>{`
        @keyframes nodeRipple {
          0%   { transform: translate(-50%,-50%) scale(1); opacity: 0.4; }
          100% { transform: translate(-50%,-50%) scale(1.8); opacity: 0; }
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
  const [gbifObs, setGbifObs] = useState<GBIFObs[]>([]);
  const [gbifLoading, setGbifLoading] = useState(false);
  const [gbifSpecies, setGbifSpecies] = useState<string>('');
  const [hoveredObs, setHoveredObs] = useState<GBIFObs | null>(null);
  const [conditions, setConditions] = useState<ForageConditions | null>(null);
  const [conditionsLoading, setConditionsLoading] = useState(false);
  const [showSkogsObs, setShowSkogsObs] = useState(true);
  const [hoveredSkogsHerb, setHoveredSkogsHerb] = useState<string | null>(null);
  const [showHarvest, setShowHarvest] = useState(false);
  const currentMonth = new Date().getMonth() + 1;
  const harvestNow = (HARVEST_BY_MONTH[currentMonth] || []).map(sv => HARVEST_PLANTS[sv]).filter(Boolean);

  const mapRef = useRef<any>(null);

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

        {/* Skogsskafferiet toggle */}
        <button
          onClick={() => setShowSkogsObs(s => !s)}
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

      {/* Map */}
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 14, latitude: 58, zoom: 4.2 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapMode === 'satellite' ? SATELLITE_STYLE : MAP_STYLE}
      >
        <NavigationControl position="bottom-right" style={{ marginBottom: 80 }} />

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
            <span style={{ fontFamily: 'monospace', fontSize: 7.5, color: '#4d5a52', marginLeft: 8, letterSpacing: '0.1em' }}>skogsskafferiet.se</span>
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

        {/* Curated eco-nodes */}
        {filteredNodes.map(node => (
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
              seasons={seasons}
              onClick={() => handleNodeClick(node)}
              onHover={() => setHoveredNode(node.id)}
              onLeave={() => setHoveredNode(null)}
            />
          </Marker>
        ))}
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

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 80, left: 20, zIndex: 10,
        background: 'rgba(7,17,13,0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '0.5px solid rgba(255,255,255,0.1)',
        borderRadius: 8, padding: '10px 14px',
      }}>
        <div style={{ fontFamily: 'monospace', fontSize: 7, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4d5a52', marginBottom: 7 }}>Habitats</div>
        {Object.entries(HABITAT_LABELS).filter(([h]) => ALL_HABITATS.includes(h as HabitatType)).map(([h, label]) => (
          <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: HABITAT_COLORS[h], boxShadow: `0 0 5px ${HABITAT_COLORS[h]}77`, flexShrink: 0 }} />
            <span style={{ fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8B7E62' }}>{label}</span>
          </div>
        ))}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(180,230,150,0.6)', border: '0.5px solid rgba(180,230,150,0.9)' }} />
            <span style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(180,230,150,0.65)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Skogsskafferiet</span>
          </div>
        </div>
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
              <div style={{ fontFamily: 'monospace', fontSize: 7, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4d5a52' }}>skogsskafferiet.se</div>
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

      {/* Bottom nav links */}
      <div style={{
        position: 'absolute', bottom: 20, left: 20, zIndex: 10,
        display: 'flex', gap: 8, flexWrap: 'wrap',
      }}>
        {[
          { href: '/', label: '← Home' },
          { href: '/extraction', label: '⚗ Extraction' },
          { href: '/mixology', label: 'Herbal Engine' },
          { href: '/community', label: 'Community ✦' },
        ].map(({ href, label }) => (
          <a key={href} href={href} style={{
            fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.14em', textTransform: 'uppercase',
            padding: '5px 12px', borderRadius: 4, textDecoration: 'none',
            background: 'rgba(7,17,13,0.88)', border: '0.5px solid rgba(255,255,255,0.1)', color: '#8B7E62',
            transition: 'all 0.15s',
          }}>{label}</a>
        ))}
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
