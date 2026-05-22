import React, { useState, useCallback, useRef } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ECO_NODES, HABITAT_COLORS, HABITAT_LABELS, SEASON_PROBABILITY } from '../data/ecoNodes';
import { EcoNode, Season, HabitatType } from '../types/EcoNode';
import NodePanel from './NodePanel';

// Free tile style — CARTO Dark Matter via MapLibre. No account or token needed.
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

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

function NodeMarker({ node, isSelected, isHovered, season, onClick, onHover, onLeave }: {
  node: EcoNode; isSelected: boolean; isHovered: boolean; season: Season;
  onClick: () => void; onHover: () => void; onLeave: () => void;
}) {
  const color = HABITAT_COLORS[node.nodeType] || '#6BD66F';
  const inSeason = node.best_season.includes(season);
  const topSpecies = node.species[0];
  const adjProb = topSpecies ? (inSeason ? Math.min(1, topSpecies.probability * 1.25) : topSpecies.probability * 0.4) : 0;
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

export default function ForagingApp() {
  const [selectedNode, setSelectedNode] = useState<EcoNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [season, setSeason] = useState<Season>(getCurrentSeason);
  const [habitatFilter, setHabitatFilter] = useState<HabitatType | 'all'>('all');
  const [popupNode, setPopupNode] = useState<EcoNode | null>(null);

  const mapRef = useRef<any>(null);

  const filteredNodes = ECO_NODES.filter(n =>
    habitatFilter === 'all' || n.nodeType === habitatFilter
  );

  const handleNodeClick = useCallback((node: EcoNode) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
    setPopupNode(null);
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

        {/* Season filter */}
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 7.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4d5a52', marginRight: 2 }}>Season</div>
          {SEASONS.map(s => (
            <button key={s} onClick={() => setSeason(s)} style={{
              fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '4px 10px', borderRadius: 5, cursor: 'pointer', transition: 'all 0.15s',
              background: season === s ? 'rgba(107,214,111,0.12)' : 'none',
              border: season === s ? '0.5px solid rgba(107,214,111,0.4)' : '0.5px solid rgba(255,255,255,0.1)',
              color: season === s ? '#B6F0AE' : '#8B7E62',
            }}>
              {SEASON_ICONS[s]} {s}
            </button>
          ))}
        </div>

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

        {/* Node count */}
        <div style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 9, color: '#4d5a52', flexShrink: 0 }}>
          {filteredNodes.length} nodes · {filteredNodes.filter(n => n.best_season.includes(season)).length} active now
        </div>
      </div>

      {/* Map */}
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 25, latitude: 38, zoom: 2.5 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
      >
        <NavigationControl position="bottom-right" style={{ marginBottom: 80 }} />

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
              season={season}
              onClick={() => handleNodeClick(node)}
              onHover={() => setHoveredNode(node.id)}
              onLeave={() => setHoveredNode(null)}
            />
          </Marker>
        ))}
      </Map>

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
            <span style={{ fontFamily: 'monospace', fontSize: 8, color: '#4d5a52', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Off-season</span>
          </div>
        </div>
      </div>

      {/* Bottom nav links */}
      <div style={{
        position: 'absolute', bottom: 20, left: 20, zIndex: 10,
        display: 'flex', gap: 8,
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
      </div>

      {/* Node panel — slides in from right */}
      {selectedNode && (
        <NodePanel
          node={selectedNode}
          currentSeason={season}
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
          {filteredNodes.filter(n => n.best_season.includes(season)).length} nodes active · tap any to explore
        </div>
      )}
    </div>
  );
}
