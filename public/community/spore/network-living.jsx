/* Living organism network — global canvas map */

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

/* — Simplified continent polygons [lon, lat] — */
const LAND = [
  // Europe
  [[-10,35],[10,36],[20,38],[28,37],[37,38],[40,38],[36,44],[28,44],[26,48],[24,54],[10,55],[8,58],[15,70],[30,70],[28,65],[22,58],[14,55],[8,55],[5,58],[0,51],[-5,48],[-9,37],[-10,35]],
  // UK
  [[-5,50],[2,51],[2,57],[-2,58],[-5,57],[-5,50]],
  // Scandinavia
  [[5,57],[8,62],[15,70],[28,71],[32,65],[26,58],[15,55],[8,55],[5,57]],
  // Africa
  [[-18,37],[-5,36],[10,37],[20,37],[30,37],[38,37],[42,12],[50,12],[42,-2],[40,-11],[35,-35],[25,-35],[15,-36],[0,-15],[-15,0],[-18,12],[-18,25],[-18,37]],
  // Asia (mainland)
  [[25,42],[40,38],[55,22],[65,22],[75,8],[80,10],[92,5],[100,2],[110,0],[120,22],[125,30],[130,32],[135,40],[140,45],[148,50],[140,58],[105,75],[85,75],[60,70],[45,70],[38,68],[30,65],[25,55],[25,42]],
  // Indian subcontinent
  [[68,22],[78,8],[80,10],[80,14],[80,20],[76,28],[72,22],[68,22]],
  // North America
  [[-168,70],[-140,60],[-130,52],[-124,47],[-120,37],[-115,30],[-100,22],[-85,12],[-78,10],[-75,12],[-65,12],[-62,16],[-55,47],[-53,55],[-60,65],[-80,75],[-110,75],[-140,75],[-168,70]],
  // South America
  [[-80,10],[-75,8],[-52,5],[-35,-5],[-36,-20],[-50,-53],[-65,-55],[-70,-38],[-65,-25],[-55,-15],[-50,-5],[-65,0],[-80,8]],
  // Australia
  [[114,-22],[120,-20],[130,-15],[138,-12],[148,-20],[155,-30],[152,-38],[140,-38],[128,-35],[115,-28],[114,-22]],
  // Greenland
  [[-55,76],[-22,76],[-18,78],[-20,82],[-44,84],[-55,82],[-55,76]],
  // Iceland
  [[-24,63],[-14,63],[-13,66],[-24,66],[-24,63]],
  // Japan Honshu
  [[130,30],[136,34],[141,40],[145,44],[140,45],[133,42],[130,34],[130,30]],
  // Hokkaido
  [[140,41],[145,44],[141,45],[140,43],[140,41]],
  // Malay Peninsula
  [[100,5],[104,1],[103,-1],[105,-5],[104,-4],[100,4],[100,5]],
  // Borneo
  [[108,2],[118,4],[117,8],[115,6],[108,4],[108,2]],
  // Sumatra
  [[96,5],[105,0],[108,-4],[104,-5],[96,4],[96,5]],
  // Philippines
  [[118,8],[122,10],[126,8],[124,6],[118,7],[118,8]],
  // New Guinea
  [[132,-2],[142,-4],[148,-8],[142,-9],[132,-5],[132,-2]],
  // Madagascar
  [[44,-12],[50,-15],[50,-25],[44,-25],[44,-12]],
  // Bali/Java hint
  [[106,-6],[111,-7],[115,-9],[119,-8],[115,-7],[106,-5],[106,-6]],
  // Sri Lanka
  [[80,7],[82,7],[81,10],[80,10],[80,7]],
  // New Zealand N
  [[174,-37],[178,-38],[176,-41],[172,-41],[172,-37],[174,-37]],
];

/* — Global canvas network map — */
function LivingNetworkMap({ nodes, selected, onSelect, flowIntensity = 1 }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef({ particles: [], connections: [] });
  const animRef   = useRef(null);

  // Build connections + particles once nodes change
  useEffect(() => {
    const liveNodes = nodes.filter(n => n.latlon && n.activity !== 'proposed');
    const connections = [];
    liveNodes.forEach((a, i) => {
      liveNodes.forEach((b, j) => {
        if (i >= j) return;
        connections.push({ a, b });
      });
    });
    const particles = [];
    connections.forEach((conn, ci) => {
      const count = Math.max(1, Math.round(flowIntensity * 1.5));
      for (let k = 0; k < count; k++) {
        particles.push({ ci, t: k / count, speed: 0.0018 + Math.random() * 0.0012, color: conn.a.color, r: 1.2 + Math.random() * 1 });
      }
    });
    stateRef.current = { connections, particles };
  }, [nodes, flowIntensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let start = performance.now();

    function xy(lat, lon) {
      const W = canvas.width, H = canvas.height;
      return { x: (lon + 180) / 360 * W, y: (90 - lat) / 180 * H };
    }

    function qPoint(pa, pb, t) {
      const W = canvas.width, H = canvas.height;
      const mx = (pa.x + pb.x) / 2;
      const my = (pa.y + pb.y) / 2 - Math.hypot(pb.x - pa.x, pb.y - pa.y) * 0.14;
      return {
        x: (1-t)*(1-t)*pa.x + 2*(1-t)*t*mx + t*t*pb.x,
        y: (1-t)*(1-t)*pa.y + 2*(1-t)*t*my + t*t*pb.y,
        mx, my,
      };
    }

    function draw(now) {
      const elapsed = (now - start) / 1000;
      const W = canvas.width, H = canvas.height;
      const ctx = canvas.getContext('2d');
      const { connections, particles } = stateRef.current;

      ctx.clearRect(0, 0, W, H);

      // ── Ocean background ──
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#030507');
      bg.addColorStop(0.5, '#050A0C');
      bg.addColorStop(1, '#030507');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Centre atmospheric glow
      const atm = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.5);
      atm.addColorStop(0, 'rgba(20,50,35,0.3)');
      atm.addColorStop(1, 'rgba(20,50,35,0)');
      ctx.fillStyle = atm;
      ctx.fillRect(0, 0, W, H);

      // ── Graticule ──
      for (let lat = -60; lat <= 90; lat += 30) {
        const { y } = xy(lat, 0);
        ctx.strokeStyle = lat === 0 ? 'rgba(232,177,75,0.22)' : 'rgba(107,214,111,0.055)';
        ctx.lineWidth   = lat === 0 ? 1 : 0.4;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      ctx.setLineDash([3, 9]);
      ctx.strokeStyle = 'rgba(232,177,75,0.08)';
      ctx.lineWidth = 0.5;
      [23.5, -23.5].forEach(lat => {
        const { y } = xy(lat, 0);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      });
      ctx.setLineDash([]);
      for (let lon = -150; lon <= 180; lon += 30) {
        const { x } = xy(0, lon);
        ctx.strokeStyle = 'rgba(107,214,111,0.04)';
        ctx.lineWidth = 0.4;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }

      // ── Land masses ──
      LAND.forEach(poly => {
        if (!poly.length) return;
        ctx.beginPath();
        poly.forEach(([lon, lat], i) => {
          const { x, y } = xy(lat, lon);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = '#0C1F14';
        ctx.fill();
        ctx.strokeStyle = 'rgba(40,80,50,0.7)';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      });

      // ── Connections ──
      connections.forEach(({ a, b }) => {
        if (!a.latlon || !b.latlon) return;
        const pa = xy(a.latlon[0], a.latlon[1]);
        const pb = xy(b.latlon[0], b.latlon[1]);
        const { mx, my } = qPoint(pa, pb, 0.5);
        const grad = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y);
        grad.addColorStop(0, a.color + '28'); grad.addColorStop(0.5, a.color + '14'); grad.addColorStop(1, b.color + '28');
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.quadraticCurveTo(mx, my, pb.x, pb.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.9;
        ctx.stroke();
      });

      // ── Particles ──
      particles.forEach(p => {
        p.t = (p.t + p.speed * flowIntensity) % 1;
        const { a, b } = connections[p.ci] || {};
        if (!a?.latlon || !b?.latlon) return;
        const pa = xy(a.latlon[0], a.latlon[1]);
        const pb = xy(b.latlon[0], b.latlon[1]);
        const pt = qPoint(pa, pb, p.t);
        const alpha = Math.sin(p.t * Math.PI);
        const glow = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, p.r * 5);
        glow.addColorStop(0, p.color + 'BB'); glow.addColorStop(1, p.color + '00');
        ctx.globalAlpha = alpha * 0.5;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, p.r * 5, 0, Math.PI * 2);
        ctx.fillStyle = glow; ctx.fill();
        ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.fill();
        ctx.globalAlpha = 1;
      });

      // ── Nodes ──
      nodes.forEach((node, i) => {
        if (!node.latlon) return;
        const { x, y } = xy(node.latlon[0], node.latlon[1]);
        const isSel     = selected === node.id;
        const isProposed= node.activity === 'proposed';
        const isLive    = node.activity === 'live';
        const pulse     = Math.sin(elapsed * 1.6 + i * 1.1) * 0.5 + 0.5;

        // Outer halo
        if (!isProposed) {
          const r = 28 + pulse * 12;
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, node.color + '50'); g.addColorStop(1, node.color + '00');
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = g; ctx.fill();
        }

        // Ripple ring (live nodes)
        if (isLive) {
          const rr = 12 + pulse * 18;
          const alpha = (1 - pulse) * 0.7;
          ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2);
          ctx.strokeStyle = node.color + Math.round(alpha * 255).toString(16).padStart(2,'0');
          ctx.lineWidth = 1.2; ctx.stroke();
        }

        // Selection ring
        if (isSel) {
          ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2);
          ctx.strokeStyle = node.color + 'CC'; ctx.lineWidth = 1.5; ctx.stroke();
        }

        // Node body
        ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fillStyle = '#040608'; ctx.fill();
        ctx.strokeStyle = node.color;
        ctx.lineWidth = isSel ? 2 : 1;
        if (isProposed) ctx.setLineDash([2,2]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Inner dot
        if (!isProposed) {
          ctx.shadowColor = node.color; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = node.color; ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Region label above
        ctx.fillStyle = node.color + 'CC';
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.region, x, y - 14);

        // Name below
        ctx.fillStyle = '#DDD0AA';
        ctx.font = 'italic 10.5px "Zodiak","Cormorant Garamond",serif';
        ctx.fillText(node.name, x, y + 22);
      });

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [nodes, selected, flowIntensity]);

  function handleClick(e) {
    if (!onSelect) return;
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top)  * scaleY;
    const W  = canvas.width, H = canvas.height;
    let closest = null, closestD = Infinity;
    nodes.forEach(node => {
      if (!node.latlon) return;
      const nx = (node.latlon[1] + 180) / 360 * W;
      const ny = (90 - node.latlon[0]) / 180 * H;
      const d  = Math.hypot(cx - nx, cy - ny);
      if (d < closestD) { closest = node; closestD = d; }
    });
    if (closest && closestD < 45) onSelect(closest.id);
  }

  return (
    <canvas
      ref={canvasRef}
      width={900}
      height={400}
      style={{ width:'100%', height:'auto', display:'block', cursor:'pointer' }}
      onClick={handleClick}
    />
  );
}

window.LivingNetworkMap = LivingNetworkMap;
window.ProceduralMark   = ProceduralMark;
