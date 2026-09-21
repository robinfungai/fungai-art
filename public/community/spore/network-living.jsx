/* Procedural brand mark.
   The canvas network map that lived here was replaced by the WebGL globe
   in network-globe.jsx (it animated every node pair each frame). */

const { useState, useEffect, useMemo, useRef } = React;

/* — Procedural brand mark — */
function ProceduralMark({ size = 28, seed }) {
  const s = seed ?? Math.floor(Date.now() / 1000) % 9999;
  const rand = (n) => { const x = Math.sin(s * 9301 + n * 49297) * 233280; return x - Math.floor(x); };
  const branches = useMemo(() => {
    const out = [];
    const count = 5 + Math.floor(rand(1) * 3);
    for (let i = 0; i < count; i++) {
      const a = i / count * Math.PI * 2 + rand(i + 10) * 0.6;
      const len = 8 + rand(i + 20) * 4;
      const x = 14 + Math.cos(a) * len, y = 14 + Math.sin(a) * len;
      const c1x = 14 + Math.cos(a + 0.3) * (len * 0.5), c1y = 14 + Math.sin(a + 0.3) * (len * 0.5);
      out.push({ x, y, c1x, c1y, w: 0.5 + rand(i + 30) * 0.6 });
    }
    return out;
  }, [s]);
  return (
    <svg className="brand-mark" viewBox="0 0 28 28" width={size} height={size} aria-label="Spore">
      <defs>
        <radialGradient id="markCore">
          <stop offset="0%" stopColor="#B6F0AE" /><stop offset="100%" stopColor="#2E7A35" />
        </radialGradient>
      </defs>
      {branches.map((b,i) => <path key={i} d={`M 14 14 Q ${b.c1x} ${b.c1y}, ${b.x} ${b.y}`} stroke="#6BD66F" strokeWidth={b.w} fill="none" opacity="0.7" strokeLinecap="round"/>)}
      {branches.map((b,i) => <circle key={`d${i}`} cx={b.x} cy={b.y} r="1" fill="#B6F0AE" opacity="0.9"/>)}
      <circle cx="14" cy="14" r="3" fill="url(#markCore)"/>
      <circle cx="14" cy="14" r="5" fill="none" stroke="#6BD66F" strokeWidth="0.4" opacity="0.5"/>
    </svg>
  );
}

window.ProceduralMark   = ProceduralMark;
