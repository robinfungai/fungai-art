/* Organic mycelium network map */

const { useState, useMemo, useRef, useEffect } = React;

function MycelialPath({ x1, y1, x2, y2, color, dash, animate, delay = 0 }) {
  // organic curved path with a couple of tangents to mimic hyphae
  const dx = x2 - x1, dy = y2 - y1;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  // perpendicular wobble
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const wobble = Math.min(40, len * 0.18);
  const c1x = mx + nx * wobble + dx * -0.05;
  const c1y = my + ny * wobble + dy * -0.05;
  const c2x = mx - nx * wobble * 0.6;
  const c2y = my - ny * wobble * 0.6;
  const d = `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
  return (
    <path
      d={d}
      stroke={color}
      strokeWidth="0.8"
      fill="none"
      strokeDasharray={dash || 'none'}
      opacity={dash ? 0.5 : 0.7}
      strokeLinecap="round"
      style={animate ? {
        strokeDasharray: 400,
        strokeDashoffset: 400,
        animation: `dash-grow 1.4s ease-out ${delay}s forwards`,
      } : undefined}
    />
  );
}

function NetworkMap({ nodes, selected, onSelect, style = 'mycelial' }) {
  const W = 480, H = 360;
  const points = useMemo(() => nodes.map(n => ({
    ...n,
    x: 24 + n.coord.x * (W - 48),
    y: 24 + n.coord.y * (H - 48),
  })), [nodes]);

  // edges: connect each active node to two nearest others
  const edges = useMemo(() => {
    const out = [];
    points.forEach((p, i) => {
      const others = points
        .map((q, j) => ({ q, j, d: i === j ? Infinity : Math.hypot(q.x - p.x, q.y - p.y) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      others.forEach(o => {
        const key = i < o.j ? `${i}-${o.j}` : `${o.j}-${i}`;
        if (!out.find(e => e.key === key)) {
          out.push({ key, a: p, b: o.q, dashed: p.activity === 'proposed' || o.q.activity === 'proposed' });
        }
      });
    });
    return out;
  }, [points]);

  // little spore filaments coming off each node
  const filaments = useMemo(() => {
    const out = [];
    points.forEach((p) => {
      if (p.activity === 'proposed') return;
      const seed = p.id.charCodeAt(0) + p.id.charCodeAt(1);
      for (let k = 0; k < 5; k++) {
        const angle = ((seed + k * 73) % 360) * (Math.PI / 180);
        const len = 14 + ((seed + k * 17) % 14);
        const x2 = p.x + Math.cos(angle) * len;
        const y2 = p.y + Math.sin(angle) * len;
        out.push({ x1: p.x, y1: p.y, x2, y2, color: p.color });
      }
    });
    return out;
  }, [points]);

  if (style === 'grid') {
    return (
      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {nodes.map(n => (
          <button
            key={n.id}
            onClick={() => onSelect(n.id)}
            className="card"
            style={{
              textAlign: 'left',
              cursor: 'pointer',
              borderColor: selected === n.id ? n.color : undefined,
              borderWidth: selected === n.id ? 1 : 0.5,
              background: 'var(--bg-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="legend-dot" style={{ background: n.color }} />
              <span className="card-title" style={{ fontSize: 16 }}>{n.name}</span>
            </div>
            <div className="contrib-sub" style={{ marginTop: 6 }}>{n.sub}</div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Mycelial network map">
      <defs>
        <radialGradient id="mapBg" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="rgba(99,153,34,0.06)" />
          <stop offset="100%" stopColor="rgba(99,153,34,0)" />
        </radialGradient>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <rect width={W} height={H} fill="url(#mapBg)" />

      {/* faint grid lines */}
      {[0.25, 0.5, 0.75].map((p, i) => (
        <line key={`h${i}`} x1={0} y1={H * p} x2={W} y2={H * p} stroke="var(--rule-soft)" strokeWidth="0.4" strokeDasharray="2 4" />
      ))}
      {[0.25, 0.5, 0.75].map((p, i) => (
        <line key={`v${i}`} x1={W * p} y1={0} x2={W * p} y2={H} stroke="var(--rule-soft)" strokeWidth="0.4" strokeDasharray="2 4" />
      ))}

      {/* edges (mycelial paths) */}
      {edges.map((e, i) => (
        <MycelialPath
          key={e.key}
          x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y}
          color={e.dashed ? 'var(--ink-4)' : e.a.color}
          dash={e.dashed ? '3 4' : null}
          animate={true}
          delay={i * 0.08}
        />
      ))}

      {/* filaments */}
      {filaments.map((f, i) => (
        <line key={`f${i}`} x1={f.x1} y1={f.y1} x2={f.x2} y2={f.y2}
          stroke={f.color} strokeWidth="0.5" opacity="0.4" strokeLinecap="round" />
      ))}

      {/* nodes */}
      {points.map((p) => {
        const isSelected = selected === p.id;
        const isProposed = p.activity === 'proposed';
        return (
          <g
            key={p.id}
            transform={`translate(${p.x}, ${p.y})`}
            style={{ cursor: 'pointer' }}
            onClick={() => onSelect(p.id)}
          >
            {isSelected && (
              <circle r="22" fill={p.color} opacity="0.12" />
            )}
            <circle r="14" fill="var(--bg)" stroke={p.color}
              strokeWidth={isSelected ? 1.5 : 0.8}
              strokeDasharray={isProposed ? '2 2' : null}
            />
            <circle r="6" fill={isProposed ? 'transparent' : p.color}
              stroke={isProposed ? p.color : 'none'}
              strokeWidth={isProposed ? 0.8 : 0}
              strokeDasharray={isProposed ? '1 1' : null}
            />
            {p.activity === 'live' && (
              <circle r="4" fill={p.color}>
                <animate attributeName="r" from="4" to="18" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="2.5s" repeatCount="indefinite" />
              </circle>
            )}
            <text
              x="0" y="32"
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="9"
              letterSpacing="1"
              fill="var(--ink-2)"
              style={{ textTransform: 'uppercase' }}
            >
              {p.region}
            </text>
            <text
              x="0" y="46"
              textAnchor="middle"
              fontFamily="var(--font-serif)"
              fontStyle="italic"
              fontSize="13"
              fill="var(--ink)"
            >
              {p.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

window.NetworkMap = NetworkMap;
