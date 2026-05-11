/* Living organism network — particles, breathing, procedural */

const { useState, useEffect, useMemo, useRef } = React;

/* — Procedural brand mark — regenerates each load — */
function ProceduralMark({ size = 28, seed }) {
  const s = seed ?? Math.floor(Date.now() / 1000) % 9999;
  const rand = (n) => {
    const x = Math.sin(s * 9301 + n * 49297) * 233280;
    return x - Math.floor(x);
  };
  const branches = useMemo(() => {
    const out = [];
    const count = 5 + Math.floor(rand(1) * 3);
    for (let i = 0; i < count; i++) {
      const a = i / count * Math.PI * 2 + rand(i + 10) * 0.6;
      const len = 8 + rand(i + 20) * 4;
      const x = 14 + Math.cos(a) * len;
      const y = 14 + Math.sin(a) * len;
      const c1x = 14 + Math.cos(a + 0.3) * (len * 0.5);
      const c1y = 14 + Math.sin(a + 0.3) * (len * 0.5);
      out.push({ x, y, c1x, c1y, w: 0.5 + rand(i + 30) * 0.6 });
    }
    return out;
  }, [s]);
  return (
    <svg className="brand-mark" viewBox="0 0 28 28" width={size} height={size} aria-label="Spore">
      <defs>
        <radialGradient id="markCore">
          <stop offset="0%" stopColor="#B6F0AE" />
          <stop offset="100%" stopColor="#2E7A35" />
        </radialGradient>
      </defs>
      {branches.map((b, i) =>
      <path key={i}
      d={`M 14 14 Q ${b.c1x} ${b.c1y}, ${b.x} ${b.y}`}
      stroke="#6BD66F" strokeWidth={b.w}
      fill="none" opacity="0.7" strokeLinecap="round" />

      )}
      {branches.map((b, i) =>
      <circle key={`d${i}`} cx={b.x} cy={b.y} r="1" fill="#B6F0AE" opacity="0.9" />
      )}
      <circle cx="14" cy="14" r="3" fill="url(#markCore)" />
      <circle cx="14" cy="14" r="5" fill="none" stroke="#6BD66F" strokeWidth="0.4" opacity="0.5" />
    </svg>);

}

/* — Living network with particle flow — */
function LivingNetworkMap({ nodes, selected, onSelect, flowIntensity = 1 }) {
  const W = 480,H = 380;
  const svgRef = useRef(null);
  const [tick, setTick] = useState(0);

  // breathing animation
  useEffect(() => {
    let raf;
    let last = performance.now();
    const loop = (now) => {
      if (now - last > 50) {setTick((t) => (t + 1) % 1000);last = now;}
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const points = useMemo(() => nodes.map((n) => ({
    ...n,
    x: 30 + n.coord.x * (W - 60),
    y: 30 + n.coord.y * (H - 60)
  })), [nodes]);

  const edges = useMemo(() => {
    const out = [];
    points.forEach((p, i) => {
      const others = points.
      map((q, j) => ({ q, j, d: i === j ? Infinity : Math.hypot(q.x - p.x, q.y - p.y) })).
      sort((a, b) => a.d - b.d).
      slice(0, 2);
      others.forEach((o) => {
        const key = i < o.j ? `${i}-${o.j}` : `${o.j}-${i}`;
        if (!out.find((e) => e.key === key)) {
          const dashed = p.activity === 'proposed' || o.q.activity === 'proposed';
          out.push({ key, a: p, b: o.q, dashed });
        }
      });
    });
    return out;
  }, [points]);

  // generate organic curved path between points
  const edgePath = (a, b) => {
    const dx = b.x - a.x,dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len,ny = dx / len;
    const wob = Math.min(35, len * 0.18);
    const c1x = (a.x + b.x) / 2 + nx * wob;
    const c1y = (a.y + b.y) / 2 + ny * wob;
    const c2x = (a.x + b.x) / 2 - nx * wob * 0.5;
    const c2y = (a.y + b.y) / 2 - ny * wob * 0.5;
    return { d: `M ${a.x} ${a.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${b.x} ${b.y}`, c1x, c1y, c2x, c2y };
  };

  // tendrils growing from each node
  const filaments = useMemo(() => {
    const out = [];
    points.forEach((p) => {
      if (p.activity === 'proposed') return;
      const seed = p.id.charCodeAt(0) + p.id.charCodeAt(1);
      const count = 7;
      for (let k = 0; k < count; k++) {
        const angle = (seed + k * 73) % 360 * (Math.PI / 180);
        const len = 16 + (seed + k * 17) % 14;
        const x2 = p.x + Math.cos(angle) * len;
        const y2 = p.y + Math.sin(angle) * len;
        const cx = p.x + Math.cos(angle + 0.3) * (len * 0.6);
        const cy = p.y + Math.sin(angle + 0.3) * (len * 0.6);
        out.push({ x1: p.x, y1: p.y, cx, cy, x2, y2, color: p.color, id: `${p.id}-${k}` });
      }
    });
    return out;
  }, [points]);

  // particles flowing along edges
  const particleEdges = useMemo(() => edges.filter((e) => !e.dashed), [edges]);
  const particles = useMemo(() => {
    const out = [];
    particleEdges.forEach((e, ei) => {
      const path = edgePath(e.a, e.b);
      const count = Math.max(1, Math.round(2 * flowIntensity));
      for (let i = 0; i < count; i++) {
        out.push({ key: `${e.key}-${i}`, path, offset: i / count, color: e.a.color });
      }
    });
    return out;
  }, [particleEdges, flowIntensity]);

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} aria-label="Living mycelial network">
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(107,214,111,0.08)" />
          <stop offset="100%" stopColor="rgba(107,214,111,0)" />
        </radialGradient>
        {points.map((p) =>
        <radialGradient key={`g-${p.id}`} id={`glow-${p.id}`}>
            <stop offset="0%" stopColor={p.color} stopOpacity="0.7" />
            <stop offset="100%" stopColor={p.color} stopOpacity="0" />
          </radialGradient>
        )}
        <filter id="softBlur">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      <rect width={W} height={H} fill="url(#bgGlow)" />

      {/* faint coordinate hints */}
      {[0.33, 0.66].map((p, i) =>
      <line key={`h${i}`} x1={0} y1={H * p} x2={W} y2={H * p}
      stroke="rgba(201,184,148,0.05)" strokeWidth="0.5" strokeDasharray="2 6" />
      )}
      {[0.33, 0.66].map((p, i) =>
      <line key={`v${i}`} x1={W * p} y1={0} x2={W * p} y2={H}
      stroke="rgba(201,184,148,0.05)" strokeWidth="0.5" strokeDasharray="2 6" />
      )}

      {/* edges with growing/breathing dash */}
      {edges.map((e, i) => {
        const path = edgePath(e.a, e.b);
        return (
          <g key={e.key}>
            {!e.dashed &&
            <path d={path.d}
            stroke={e.a.color} strokeWidth="2.5"
            fill="none" opacity="0.08"
            filter="url(#softBlur)" />

            }
            <path
              d={path.d}
              stroke={e.dashed ? 'rgba(201,184,148,0.3)' : e.a.color}
              strokeWidth={e.dashed ? 0.7 : 1}
              fill="none"
              opacity={e.dashed ? 0.45 : 0.55}
              strokeDasharray={e.dashed ? '3 4' : null}
              strokeLinecap="round"
              style={{
                strokeDasharray: e.dashed ? '3 4' : 800,
                strokeDashoffset: e.dashed ? 0 : 800,
                animation: e.dashed ? null : `grow-line 1.8s ease-out ${i * 0.1}s forwards`
              }} />
            
          </g>);

      })}

      {/* flowing particles */}
      {particles.map((p) =>
      <circle key={p.key} r="1.6" fill={p.color}
      style={{
        filter: 'drop-shadow(0 0 3px currentColor)',
        color: p.color
      }}>
        
          <animateMotion
          dur={`${4 / flowIntensity}s`}
          repeatCount="indefinite"
          begin={`${-p.offset * 4}s`}
          path={p.path.d} />
        
          <animate attributeName="opacity"
        values="0;1;1;0"
        dur={`${4 / flowIntensity}s`}
        repeatCount="indefinite"
        begin={`${-p.offset * 4}s`} />
        
        </circle>
      )}

      {/* filaments */}
      {filaments.map((f) =>
      <path key={f.id}
      d={`M ${f.x1} ${f.y1} Q ${f.cx} ${f.cy}, ${f.x2} ${f.y2}`}
      stroke={f.color} strokeWidth="0.5" fill="none"
      opacity="0.35" strokeLinecap="round" />

      )}

      {/* nodes with breathing */}
      {points.map((p, i) => {
        const isSelected = selected === p.id;
        const isProposed = p.activity === 'proposed';
        const breath = 1 + Math.sin((tick + i * 8) * 0.06) * 0.08;
        return (
          <g key={p.id}
          transform={`translate(${p.x}, ${p.y})`}
          style={{ cursor: 'pointer' }}
          onClick={() => onSelect(p.id)}>
            
            {/* halo */}
            {!isProposed &&
            <circle r="28" fill={`url(#glow-${p.id})`} opacity={isSelected ? 0.8 : 0.45}
            style={{ transform: `scale(${breath})`, transformOrigin: 'center', transformBox: 'fill-box' }} />

            }
            {isSelected &&
            <circle r="18" fill="none" stroke={p.color} strokeWidth="0.5" opacity="0.6">
                <animate attributeName="r" from="14" to="22" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
              </circle>
            }
            <circle r="11" fill="#0A0908"
            stroke={p.color}
            strokeWidth={isSelected ? 1.5 : 0.8}
            strokeDasharray={isProposed ? '2 2' : null} />
            
            <circle r="4.5" fill={isProposed ? 'transparent' : p.color}
            stroke={isProposed ? p.color : 'none'}
            strokeWidth={isProposed ? 0.8 : 0}
            strokeDasharray={isProposed ? '1 1' : null}
            style={{ filter: !isProposed ? `drop-shadow(0 0 4px ${p.color})` : 'none' }} />
            
            {p.activity === 'live' &&
            <circle r="3" fill={p.color}>
                <animate attributeName="r" from="3" to="18" dur="2.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.7" to="0" dur="2.6s" repeatCount="indefinite" />
              </circle>
            }
            <text x="0" y="-18" textAnchor="middle"
            fontFamily="var(--font-mono)" fontSize="8" letterSpacing="1.5"
            fill="rgba(201,184,148,0.5)" style={{ textTransform: 'uppercase' }}>
              {p.region}
            </text>
            <text x="0" y="32" textAnchor="middle"
            fontFamily="var(--font-display)" fontStyle="italic" fontSize="13"
            fill="#E6D9B5" style={{ fill: "rgb(214, 172, 58)" }}>
              {p.name}
            </text>
          </g>);

      })}
    </svg>);

}

window.LivingNetworkMap = LivingNetworkMap;
window.ProceduralMark = ProceduralMark;