import React from 'react';
import { EcoNode, Season } from '../types/EcoNode';
import { HABITAT_COLORS, HABITAT_LABELS } from '../data/ecoNodes';

interface NodePanelProps {
  node: EcoNode | null;
  currentSeason: Season;
  onClose: () => void;
}

const SEASON_LABEL: Record<Season, string> = {
  spring: 'Spring',
  summer: 'Summer',
  autumn: 'Autumn',
  winter: 'Winter',
};

const MOISTURE_LABEL = (m: number) => {
  if (m > 0.8) return 'Very wet';
  if (m > 0.6) return 'Moist';
  if (m > 0.4) return 'Moderate';
  if (m > 0.2) return 'Dry';
  return 'Arid';
};

function ProbBar({ value, season_match }: { value: number; season_match: boolean }) {
  const pct = Math.round(value * 100);
  const color = season_match
    ? value > 0.7 ? '#6BD66F' : value > 0.4 ? '#C48838' : '#8B7E62'
    : '#3d4a43';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <div style={{ flex: 1, height: 3, background: '#1a2228', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontFamily: 'var(--fm, monospace)', fontSize: 10, color, width: 32, textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  );
}

export default function NodePanel({ node, currentSeason, onClose }: NodePanelProps) {
  if (!node) return null;

  const color = HABITAT_COLORS[node.nodeType] || '#6BD66F';
  const habitatLabel = HABITAT_LABELS[node.nodeType] || node.nodeType;
  const isGoodSeason = node.best_season.includes(currentSeason);

  const sortedSpecies = [...node.species].sort((a, b) => b.probability - a.probability);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      width: 'min(400px, 100vw)',
      background: 'rgba(7,17,13,0.97)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderLeft: `0.5px solid ${color}33`,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      zIndex: 20,
      animation: 'slideIn 0.25s ease-out',
    }}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(32px); opacity: 0; } to { transform: none; opacity: 1; } }
        .np-scroll::-webkit-scrollbar { width: 3px; }
        .np-scroll::-webkit-scrollbar-track { background: transparent; }
        .np-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div style={{ padding: '18px 20px 14px', borderBottom: `0.5px solid ${color}22`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--fm, monospace)', fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#8B7E62', marginBottom: 4 }}>
              {node.region} · {habitatLabel}
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: 22, color: '#E6D9B5', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
              {node.location}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8B7E62', fontSize: 18, cursor: 'pointer', flexShrink: 0, padding: '2px 0' }}>
            ×
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          <div style={{ background: `${color}14`, border: `0.5px solid ${color}33`, borderRadius: 5, padding: '4px 10px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 7, letterSpacing: '0.18em', textTransform: 'uppercase', color: color, marginBottom: 2 }}>Moisture</div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#E6D9B5' }}>{MOISTURE_LABEL(node.moisture)}</div>
          </div>
          {node.altitude !== undefined && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '4px 10px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 7, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8B7E62', marginBottom: 2 }}>Altitude</div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#E6D9B5' }}>{node.altitude}m</div>
            </div>
          )}
          <div style={{ background: isGoodSeason ? 'rgba(107,214,111,0.08)' : 'rgba(255,255,255,0.04)', border: isGoodSeason ? '0.5px solid rgba(107,214,111,0.3)' : '0.5px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '4px 10px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 7, letterSpacing: '0.18em', textTransform: 'uppercase', color: isGoodSeason ? '#6BD66F' : '#8B7E62', marginBottom: 2 }}>Now</div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: isGoodSeason ? '#B6F0AE' : '#8B7E62' }}>
              {isGoodSeason ? '✓ Active' : '○ Off-season'}
            </div>
          </div>
        </div>

        {/* Best seasons */}
        <div style={{ display: 'flex', gap: 5, marginTop: 10, flexWrap: 'wrap' }}>
          {node.best_season.map(s => (
            <span key={s} style={{
              fontFamily: 'monospace', fontSize: 7.5, letterSpacing: '0.14em', textTransform: 'uppercase',
              padding: '2px 8px', borderRadius: 3,
              background: s === currentSeason ? `${color}20` : 'transparent',
              border: s === currentSeason ? `0.5px solid ${color}55` : '0.5px solid rgba(255,255,255,0.1)',
              color: s === currentSeason ? color : '#8B7E62',
            }}>
              {SEASON_LABEL[s]}
            </span>
          ))}
        </div>
      </div>

      <div className="np-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {/* Species */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 7.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8B7E62', marginBottom: 10 }}>
            Species Intelligence · {sortedSpecies.length} plants
          </div>
          {sortedSpecies.map(sp => {
            const inSeason = sp.peak_season.includes(currentSeason);
            const adjProb = inSeason ? Math.min(1, sp.probability * 1.25) : sp.probability * 0.45;
            return (
              <div key={sp.name} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 16, color: '#E6D9B5', flex: 1 }}>
                    {sp.name}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {sp.medicinal && <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: 'rgba(107,214,111,0.1)', color: '#6BD66F', border: '0.5px solid rgba(107,214,111,0.25)' }}>medicinal</span>}
                    {sp.edible && <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: 'rgba(232,177,75,0.1)', color: '#E8B14B', border: '0.5px solid rgba(232,177,75,0.25)' }}>edible</span>}
                    {inSeason && <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: 'rgba(107,214,111,0.06)', color: '#6BD66F' }}>now ✓</span>}
                  </div>
                </div>
                <ProbBar value={adjProb} season_match={inSeason} />
                {sp.note && (
                  <div style={{ fontSize: 10.5, color: '#8B7E62', lineHeight: 1.5, marginTop: 5 }}>{sp.note}</div>
                )}
                <div style={{ fontFamily: 'monospace', fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4d5a52', marginTop: 4 }}>
                  Peak: {sp.peak_season.map(s => SEASON_LABEL[s]).join(' · ')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Medicinal uses */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 7.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8B7E62', marginBottom: 8 }}>Medicinal Intelligence</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {node.medicinal.map(m => (
              <span key={m} style={{ fontSize: 10, padding: '3px 9px', borderRadius: 5, background: 'rgba(107,214,111,0.07)', color: '#B6F0AE', border: '0.5px solid rgba(107,214,111,0.2)' }}>
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Extraction notes */}
        {node.extraction_notes && (
          <div style={{ marginBottom: 18, padding: '12px 14px', background: 'rgba(232,177,75,0.05)', border: '0.5px solid rgba(232,177,75,0.18)', borderRadius: 8 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 7.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(232,177,75,0.7)', marginBottom: 6 }}>⚗ Extraction</div>
            <div style={{ fontSize: 12, color: '#C9B894', lineHeight: 1.65 }}>{node.extraction_notes}</div>
            <a href="/extraction" target="_blank" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(232,177,75,0.6)', textDecoration: 'none' }}>
              Full protocols → fungai.art/extraction
            </a>
          </div>
        )}

        {/* Folklore */}
        {node.folklore.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 7.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8B7E62', marginBottom: 10 }}>Folklore & tradition</div>
            {node.folklore.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 9, marginBottom: 8, paddingBottom: 8, borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: 3, background: `${color}55`, borderRadius: 2, flexShrink: 0, marginTop: 3, minHeight: 14 }} />
                <div style={{ fontSize: 12, color: '#C9B894', lineHeight: 1.65, opacity: 0.85 }}>{f}</div>
              </div>
            ))}
          </div>
        )}

        {/* Lore */}
        {node.lore && (
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13.5, color: '#8B7E62', lineHeight: 1.7, padding: '12px 14px', background: `${color}08`, border: `0.5px solid ${color}20`, borderRadius: 7 }}>
            {node.lore}
          </div>
        )}

        {/* Links to materia medica */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '0.5px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 7.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8B7E62', marginBottom: 8 }}>Explore in Materia Medica</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <a href="/app.html" style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.14em', textTransform: 'uppercase', padding: '5px 12px', border: '0.5px solid rgba(107,214,111,0.3)', borderRadius: 4, color: '#6BD66F', textDecoration: 'none', background: 'rgba(107,214,111,0.05)' }}>
              Herb Engine →
            </a>
            <a href="/mixology" style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.14em', textTransform: 'uppercase', padding: '5px 12px', border: '0.5px solid rgba(232,177,75,0.3)', borderRadius: 4, color: '#C48838', textDecoration: 'none', background: 'rgba(232,177,75,0.04)' }}>
              Mixology →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
