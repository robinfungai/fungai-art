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

/* — Simplified continent polygons [lon, lat] —
   Per recent design pass: Australia + New Zealand + far-east Indonesia
   shapes (Borneo, New Guinea, Philippines, Sumatra, Bali) removed since
   we have no active nodes there and they cluttered the negative space.
   Polygons subdivided with more intermediate points for smoother edges
   when rendered as connected lineTo segments. */
const LAND = [
  // Europe — denser outline along the Atlantic / Med / Baltic
  [[-10,35],[-7,36.5],[-3,36],[2,36],[6,37],[10,36],[14,37.5],[18,38],[22,38.5],[26,37.5],[30,37],[33,36.5],[37,38],[40,38],[38,40],[36,42],[34,43],[31,44],[28,44],[26,46],[26,48],[25,50],[24,52],[22,54],[18,55],[14,55],[10,55],[6,56],[3,58],[6,60],[10,62],[14,64],[18,66],[22,68],[26,69],[30,70],[28,67],[26,64],[22,60],[18,58],[14,56],[10,55],[6,54],[2,52],[-1,51],[-4,49],[-6,46],[-8,42],[-9,38],[-10,35]],
  // UK + Ireland
  [[-5,50],[-2,50.5],[0,51],[2,52],[2,55],[1,57],[-2,58],[-5,57],[-6,54],[-5,50]],
  // Africa
  [[-18,37],[-15,36],[-10,35.5],[-5,36],[0,36],[5,37],[10,37],[15,37],[20,37],[25,37],[30,37],[34,37],[38,37],[42,16],[46,12],[50,12],[51,8],[48,2],[44,-2],[42,-8],[38,-15],[34,-22],[30,-30],[24,-34],[18,-35],[12,-36],[6,-35],[0,-22],[-6,-12],[-12,-2],[-15,5],[-17,12],[-18,18],[-18,25],[-18,30],[-18,37]],
  // Asia mainland
  [[25,42],[28,44],[32,42],[36,40],[40,38],[46,36],[52,28],[58,24],[64,22],[68,18],[72,12],[76,8],[80,10],[84,12],[88,10],[92,6],[96,4],[100,2],[104,4],[108,8],[112,14],[116,20],[120,24],[124,28],[128,32],[132,38],[136,42],[140,45],[145,48],[148,52],[145,56],[138,60],[120,68],[100,72],[80,74],[60,72],[45,71],[36,68],[30,65],[26,58],[24,52],[25,46],[25,42]],
  // Indian subcontinent
  [[68,22],[72,18],[76,12],[78,8],[80,10],[82,14],[80,20],[76,26],[72,24],[68,22]],
  // South America
  [[-80,10],[-76,8],[-70,6],[-62,4],[-54,2],[-46,0],[-38,-4],[-34,-10],[-36,-20],[-42,-30],[-50,-42],[-58,-52],[-66,-55],[-70,-50],[-72,-42],[-72,-32],[-68,-22],[-64,-12],[-60,-4],[-66,2],[-74,6],[-80,10]],
  // Central America narrow bridge — keeps Nosara / Atitlán nodes anchored
  [[-92,16],[-86,15],[-83,12],[-80,8],[-78,8],[-84,12],[-89,15],[-92,16]],
  // Greenland tip (only the southern coast pokes into wider zoom)
  [[-55,60],[-44,60],[-42,64],[-50,64],[-55,60]],
  // Iceland
  [[-24,63],[-14,63],[-13,66],[-24,66],[-24,63]],
  // Japan Honshu
  [[130,30],[133,32],[136,34],[140,38],[141,40],[143,42],[145,44],[140,45],[136,42],[132,38],[130,34],[130,30]],
  // Hokkaido
  [[140,41],[143,42],[145,44],[141,45],[140,43],[140,41]],
  // Madagascar
  [[44,-12],[48,-14],[50,-18],[50,-25],[44,-25],[43,-20],[44,-12]],
  // Sri Lanka
  [[80,7],[82,7],[81,10],[80,10],[80,7]],
];

/* — Global canvas network map —
   New optional props (defaulted so existing callers keep working):
     viewBox   — lon/lat bounds of the visible window; defaults to full world.
                 e.g. { lonMin:-95, lonMax:145, latMin:-38, latMax:70 } crops
                 out North America's bulk and Australia entirely.
     speed     — particle speed multiplier (default 1, 0.5 = half-speed).
*/
function LivingNetworkMap({
  nodes,
  selected,
  onSelect,
  flowIntensity = 1,
  viewBox = { lonMin: -180, lonMax: 180, latMin: -90, latMax: 90 },
  speed = 1,
}) {
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
        particles.push({
          ci,
          t: k / count,
          // Per-particle base speed × speed prop. Lower base than before
          // (0.0010 vs 0.0018) so the network feels slower / more meditative.
          speed: (0.0008 + Math.random() * 0.0008) * speed,
          color: conn.a.color,
          r: 1.2 + Math.random() * 1,
        });
      }
    });
    stateRef.current = { connections, particles };
  }, [nodes, flowIntensity, speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let start = performance.now();

    // Projection respects viewBox so the same map can be cropped/zoomed.
    function xy(lat, lon) {
      const W = canvas.width, H = canvas.height;
      const { lonMin, lonMax, latMin, latMax } = viewBox;
      return {
        x: (lon - lonMin) / (lonMax - lonMin) * W,
        y: (latMax - lat) / (latMax - latMin) * H,
      };
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

      // ── Land masses — antialiased, round-joined for smoother edges ──
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
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
        ctx.strokeStyle = 'rgba(40,80,50,0.55)';
        ctx.lineWidth = 0.8;
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
    const { lonMin, lonMax, latMin, latMax } = viewBox;
    let closest = null, closestD = Infinity;
    nodes.forEach(node => {
      if (!node.latlon) return;
      // Use same projection as draw() so clicks line up with zoomed map.
      const nx = (node.latlon[1] - lonMin) / (lonMax - lonMin) * W;
      const ny = (latMax - node.latlon[0]) / (latMax - latMin) * H;
      const d  = Math.hypot(cx - nx, cy - ny);
      if (d < closestD) { closest = node; closestD = d; }
    });
    if (closest && closestD < 45) onSelect(closest.id);
  }

  // Canvas is sized to roughly match the viewBox aspect at high resolution so it
  // renders crisply when the frame stretches to the desktop's wider container.
  return (
    <canvas
      ref={canvasRef}
      width={1280}
      height={540}
      style={{ width:'100%', height:'100%', display:'block', cursor:'pointer' }}
      onClick={handleClick}
    />
  );
}

window.LivingNetworkMap = LivingNetworkMap;
window.ProceduralMark   = ProceduralMark;
