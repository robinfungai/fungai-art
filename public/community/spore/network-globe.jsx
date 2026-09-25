/* The network — a WebGL globe (cobe 2).
   Replaces LivingNetworkMap, which animated particles along every pair of
   nodes on a 2D canvas each frame and got slow as the network grew.

   cobe is a local copy (/community/vendor/cobe.esm.js, refreshed from
   node_modules by scripts/build-community.cjs). A module tag in
   community/index.html sets window.createGlobe and fires `cobe:ready`;
   this classic script waits for it. Same rendering and drag physics as
   src/components/ui/cobe-globe.tsx, which the portal can't import. */

const { useState, useEffect, useMemo, useRef } = React;

function ngWhenCobe() {
  if (window.createGlobe) return Promise.resolve(window.createGlobe);
  return new Promise((resolve) => {
    window.addEventListener('cobe:ready', () => resolve(window.createGlobe), { once: true });
  });
}

// Node colours are deep greens chosen for the old beige map. Lift them
// toward white so they read as points of light on a dark globe.
function ngHexToRgb(hex, lift) {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return [0.62, 0.83, 0.22];
  return [0, 2, 4].map((i) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return Math.min(1, v + (1 - v) * (lift || 0));
  });
}

// cobe's phi that turns a longitude to face the viewer.
function ngPhiFor(lon) { return Math.PI - (lon * Math.PI / 180 - Math.PI / 2); }

// One label per crowded spot: skip a node near a higher-ranked one, so
// Europe's cluster (Berlin + Festival, Sweden + Riga) stays readable.
// Equal ranks keep data order (the sort is stable), so Sweden wins over
// Riga. The selected node always gets its label.
const NG_RANK = { live: 3, seasonal: 3, travelling: 1, proposed: 0 };
function ngLabelled(nodes, selected) {
  const rank = (n) => (n.id === selected ? 9 : (NG_RANK[n.activity] ?? 1));
  const shown = new Set();
  const placed = [];
  nodes.slice().sort((a, b) => rank(b) - rank(a)).forEach((n) => {
    const lat = n.latlon[0], lon = n.latlon[1];
    const crowded = placed.some((p) => Math.abs(p[0] - lat) < 5.5 && Math.abs(p[1] - lon) < 8);
    if (crowded && n.id !== selected) return;
    shown.add(n.id);
    placed.push([lat, lon]);
  });
  return shown;
}

// The anchor element cobe keeps at each marker's screen position, by
// marker id. cobe appends them to the canvas's parent: markers first,
// in marker order, then arcs. Where anchor-name is supported the name
// says which is which; where it is not (Firefox) the order does.
function ngMarkerAnchors(wrap, markers) {
  const divs = Array.from(wrap.children).filter((el) => el.tagName === 'DIV' && el.style.width === '1px');
  const out = new Map();
  if (divs.some((el) => el.style.getPropertyValue('anchor-name'))) {
    divs.forEach((el) => {
      const n = el.style.getPropertyValue('anchor-name');
      if (n.indexOf('--cobe-ng-') === 0) out.set(n.slice('--cobe-'.length), el);
    });
  } else {
    markers.forEach((m, i) => { if (divs[i]) out.set(m.id, divs[i]); });
  }
  return out;
}

function NetworkGlobe({ nodes, selected = null, onSelect, hub = 'berlin', speed = 0.002, maxSize = 560 }) {
  const canvasRef = useRef(null);
  const wrapRef   = useRef(null);
  const tapRef    = useRef(null);   // where and when the pointer went down
  const focusRef  = useRef(null);   // target phi while turning to a node
  const offset    = useRef({ phi: 0, theta: 0 });
  const drag      = useRef({ active: false, x: 0, y: 0, last: null, phi: 0, theta: 0, vPhi: 0, vTheta: 0 });
  const [failed, setFailed] = useState(false);

  const reduceMotion = useMemo(
    () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches), []);

  const placed = useMemo(() => (nodes || []).filter((n) => Array.isArray(n.latlon)), [nodes]);

  const markers = useMemo(() => placed.map((n) => ({
    id: 'ng-' + n.id,
    location: [n.latlon[0], n.latlon[1]],
    size: n.id === selected ? 0.07 : (n.activity === 'proposed' ? 0.03 : 0.045),
    color: n.activity === 'proposed' ? [0.91, 0.69, 0.29] : ngHexToRgb(n.color, 0.45),
  })), [placed, selected]);
  const markersRef = useRef(markers);
  markersRef.current = markers;          // the render loop reads the latest without rebuilding

  // Threads from the hub (the Berlin lab) to every node that isn't proposed.
  const arcs = useMemo(() => {
    const h = placed.find((n) => n.id === hub);
    if (!h) return [];
    return placed
      .filter((n) => n.id !== hub && n.activity !== 'proposed')
      .map((n) => ({ id: 'ng-arc-' + n.id, from: h.latlon, to: n.latlon }));
  }, [placed, hub]);

  const labelled = useMemo(() => ngLabelled(placed, selected), [placed, selected]);

  // Turn to the selected node.
  useEffect(() => {
    const n = placed.find((x) => x.id === selected);
    focusRef.current = n ? ngPhiFor(n.latlon[1]) : null;
  }, [selected, placed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    // Open facing the hub, so the European cluster is front-on, not on the rim.
    const hubNode = placed.find((n) => n.id === hub);
    const startPhi = hubNode ? ngPhiFor(hubNode.latlon[1]) : 0;
    let globe = null, raf = 0, phi = startPhi, alive = true, visible = true, io = null, ro = null;

    function frame() {
      raf = 0;
      if (!alive || !globe || !visible) return;
      const d = drag.current, o = offset.current;
      if (!d.active) {
        if (focusRef.current != null) {
          // Ease the total rotation onto the target, the short way round.
          let delta = (focusRef.current - (phi + o.phi)) % (Math.PI * 2);
          if (delta > Math.PI) delta -= Math.PI * 2;
          if (delta < -Math.PI) delta += Math.PI * 2;
          o.phi += delta * (reduceMotion ? 1 : 0.06);
        } else if (!reduceMotion) {
          phi += speed;
        }
        if (Math.abs(d.vPhi) > 0.0001 || Math.abs(d.vTheta) > 0.0001) {   // flick inertia
          o.phi += d.vPhi; o.theta += d.vTheta;
          d.vPhi *= 0.95; d.vTheta *= 0.95;
        }
        if (o.theta < -0.4) o.theta += (-0.4 - o.theta) * 0.1;            // soft tilt limits
        else if (o.theta > 0.4) o.theta += (0.4 - o.theta) * 0.1;
      }
      globe.update({
        phi: phi + o.phi + d.phi,
        theta: 0.28 + o.theta + d.theta,
        markers: markersRef.current,
      });
      raf = requestAnimationFrame(frame);
    }
    const start = () => { if (!raf && alive) raf = requestAnimationFrame(frame); };

    ngWhenCobe().then((createGlobe) => {
      if (!alive) return;
      const init = () => {
        const width = canvas.offsetWidth;
        if (!width || globe) return;
        try {
          globe = createGlobe(canvas, {
            devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
            width, height: width,
            phi: startPhi, theta: 0.28,
            dark: 1, diffuse: 1.2, mapSamples: 16000, mapBrightness: 5.5,
            baseColor: [0.32, 0.36, 0.3],
            markerColor: [0.62, 0.83, 0.22],
            glowColor: [0.12, 0.16, 0.1],
            markerElevation: 0.02,
            markers: markersRef.current,
            arcs, arcColor: [0.62, 0.83, 0.22], arcWidth: 0.45, arcHeight: 0.22,
            opacity: 0.85,
          });
        } catch (e) {
          console.warn('[network] globe unavailable (WebGL?):', e);
          setFailed(true);
          return;
        }
        canvas.style.opacity = '1';
        start();
      };
      if (canvas.offsetWidth) init();
      else {
        ro = new ResizeObserver(() => { if (canvas.offsetWidth) { ro.disconnect(); init(); } });
        ro.observe(canvas);
      }
    });

    // Stop drawing while scrolled out of view — the portal page is long.
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start(); });
      io.observe(canvas);
    }
    return () => {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      if (io) io.disconnect();
      if (ro) ro.disconnect();
      if (globe) globe.destroy();
    };
  }, [arcs, speed, reduceMotion, placed, hub]);

  // The node nearest a tap, if it is on the visible face of the globe
  // and within reach of a fingertip. Every node is tappable this way,
  // including the ones whose label is hidden to keep Europe readable.
  function pickAt(cx, cy) {
    const wrap = wrapRef.current;
    if (!wrap) return null;
    const box = wrap.getBoundingClientRect();
    const root = getComputedStyle(document.documentElement);
    const anchors = ngMarkerAnchors(wrap, markersRef.current);
    let best = null, bestD = 30;
    markersRef.current.forEach((m) => {
      const a = anchors.get(m.id);
      if (!a || !root.getPropertyValue('--cobe-visible-' + m.id)) return;   // round the back
      const x = box.left + (parseFloat(a.style.left) / 100) * box.width;
      const y = box.top + (parseFloat(a.style.top) / 100) * box.height;
      const dist = Math.hypot(cx - x, cy - y);
      if (dist < bestD) { bestD = dist; best = m.id.replace(/^ng-/, ''); }
    });
    return best;
  }

  function onPointerDown(e) {
    tapRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    const d = drag.current;
    d.active = true; d.x = e.clientX; d.y = e.clientY; d.vPhi = 0; d.vTheta = 0;
    d.last = { x: e.clientX, y: e.clientY, t: performance.now() };
    focusRef.current = null;                        // the visitor takes over
    e.currentTarget.style.cursor = 'grabbing';
    if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e) {
    const d = drag.current;
    if (!d.active) return;
    d.phi = (e.clientX - d.x) / 300;
    d.theta = (e.clientY - d.y) / 1000;
    const now = performance.now();
    if (d.last) {
      const dt = Math.max(now - d.last.t, 1), max = 0.15;
      d.vPhi = Math.max(-max, Math.min(max, ((e.clientX - d.last.x) / dt) * 0.3));
      d.vTheta = Math.max(-max, Math.min(max, ((e.clientY - d.last.y) / dt) * 0.08));
    }
    d.last = { x: e.clientX, y: e.clientY, t: now };
  }
  function onPointerUp(e) {
    const d = drag.current;
    if (!d.active) return;
    const tap = tapRef.current;
    tapRef.current = null;
    // A tap, not a drag: pick the node under it and turn to face it.
    if (tap && e.type === 'pointerup'
        && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 6
        && performance.now() - tap.t < 450) {
      d.phi = 0; d.theta = 0; d.vPhi = 0; d.vTheta = 0; d.active = false; d.last = null;
      e.currentTarget.style.cursor = 'grab';
      const id = pickAt(e.clientX, e.clientY);
      const n = id && placed.find((x) => x.id === id);
      if (n) {
        focusRef.current = ngPhiFor(n.latlon[1]);   // also when it was already selected
        if (onSelect) onSelect(n.id);
      }
      return;
    }
    offset.current.phi += d.phi;
    offset.current.theta += d.theta;
    d.phi = 0; d.theta = 0; d.active = false; d.last = null;
    e.currentTarget.style.cursor = 'grab';
  }

  if (failed) {
    return (
      <div className="ng-fallback" style={{ maxWidth: maxSize }}>
        {placed.map((n) => (
          <button key={n.id} type="button" className={'ng-chip' + (n.id === selected ? ' is-selected' : '')}
            onClick={() => onSelect && onSelect(n.id)}>{n.name}</button>
        ))}
      </div>
    );
  }

  return (
    <div className="ng-wrap" ref={wrapRef} style={{ maxWidth: maxSize }}>
      <canvas
        ref={canvasRef}
        className="ng-canvas"
        role="img"
        aria-label={'Globe of the Fungai network: ' + placed.map((n) => n.name).join(', ')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      {placed.filter((n) => labelled.has(n.id)).map((n) => (
        <button
          key={n.id}
          type="button"
          tabIndex={-1}
          className={'ng-label' + (n.id === selected ? ' is-selected' : '') + (n.activity === 'proposed' ? ' is-proposed' : '')}
          style={{
            positionAnchor: '--cobe-ng-' + n.id,
            opacity: 'var(--cobe-visible-ng-' + n.id + ', 0)',
            filter: 'blur(calc((1 - var(--cobe-visible-ng-' + n.id + ', 0)) * 8px))',
          }}
          onClick={() => onSelect && onSelect(n.id)}
        >
          {n.name}
        </button>
      ))}
    </div>
  );
}

window.NetworkGlobe = NetworkGlobe;
