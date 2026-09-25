/* ────────────────────────────────────────────────────────────────
   portal/organism.jsx — The Organism, the centre of the fairy ring
   ────────────────────────────────────────────────────────────────
   Built rather than reused. The audit looked for a mycelium sphere in
   this repo and there isn't one: mycelium-field.js is the drifting
   particle field behind the portal, and network-globe is a WebGL
   earth. So this is a purpose-built SVG, which is lighter than either
   and needs no WebGL context on a page that already runs one.

   SVG rather than canvas on purpose: the whole thing is ~40 nodes and
   a few dozen paths, it scales to any radius without a redraw, it
   inherits the portal's CSS variables, and it costs nothing when
   offscreen. A canvas would need its own rAF loop competing with the
   ring's.

   ── WHAT IS NOT HERE ────────────────────────────────────────────
   The brief has the glow follow HEALTH and the breathing speed follow
   ACTIVITY. Neither exists as real data — the economy that would
   drive them is localStorage-only and forgeable (COMMUNITY-AUDIT §5).
   Robin's call on 2026-09-25 was to hide them rather than fake them,
   so the organism breathes at ONE fixed rate and glows at ONE fixed
   strength. The props are accepted and ignored, with a comment at
   each, so Phase 2 wiring is obvious and nothing invents a number in
   the meantime.
   ──────────────────────────────────────────────────────────────── */
(function () {
  const { useMemo, useRef, useEffect } = React;

  // Deterministic pseudo-random. The organism must look identical on
  // every render and every reload — a body that rearranged itself each
  // time you opened the page would read as decoration, not as a thing
  // that is there.
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Hyphae radiating from the core: each a short cubic curve with a
  // couple of branch points, so it reads as growth rather than as a
  // starburst. Generated once, from a fixed seed.
  function growHyphae(count, rInner, rOuter, seed) {
    const rnd = mulberry32(seed);
    const strands = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + (rnd() - 0.5) * 0.18;
      const len = rOuter * (0.62 + rnd() * 0.38);
      const sway = (rnd() - 0.5) * 0.9;

      const x0 = Math.cos(a) * rInner, y0 = Math.sin(a) * rInner;
      const x1 = Math.cos(a + sway * 0.25) * (len * 0.55);
      const y1 = Math.sin(a + sway * 0.25) * (len * 0.55);
      const x2 = Math.cos(a + sway * 0.5) * len;
      const y2 = Math.sin(a + sway * 0.5) * len;

      strands.push({
        d: 'M' + x0.toFixed(1) + ',' + y0.toFixed(1) +
           ' Q' + x1.toFixed(1) + ',' + y1.toFixed(1) +
           ' ' + x2.toFixed(1) + ',' + y2.toFixed(1),
        // Tips are where the hyphae are actively growing, so they get
        // the light. Varying it keeps the edge from reading as a ring.
        tip: { x: x2, y: y2, r: 0.9 + rnd() * 1.5 },
        dim: 0.25 + rnd() * 0.55,
        // Stagger so the whole body does not pulse in unison.
        delay: (rnd() * 6).toFixed(2),
      });
    }
    return strands;
  }

  function Organism({
    size = 220,
    // ── Phase 2 props, accepted and deliberately ignored ──────────
    // health:   would drive glow strength. No real source yet.
    // activity: would drive breathing rate. No real source yet.
    // Passing them changes nothing today, on purpose.
    health,
    activity,
    label = 'Dashboard',
    onOpen,
    focused = false,
  }) {
    const reduced = useRef(false);
    useEffect(() => {
      const mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
      reduced.current = !!(mq && mq.matches);
    }, []);

    // Drawn once at a fixed internal size and scaled by CSS. The ring
    // animates `size` while it shrinks into the header; regrowing 34
    // strands on every frame of that would be wasted work, and the
    // strokes are non-scaling (fairy-ring.css) so they stay crisp small.
    const R = 110;
    const strands = useMemo(() => growHyphae(34, R * 0.20, R * 0.92, 20260925), []);

    return (
      <button
        type="button"
        className={'fr-organism' + (focused ? ' is-focused' : '')}
        style={{ width: size, height: size }}
        onClick={onOpen}
        aria-label={label + ' — the portal home'}
      >
        <svg viewBox={[-R, -R, R * 2, R * 2].join(' ')} aria-hidden="true" focusable="false">
          <defs>
            <radialGradient id="fr-core">
              <stop offset="0%"   stopColor="var(--spore-l)"  stopOpacity="0.95" />
              <stop offset="45%"  stopColor="var(--spore)"    stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--spore-d)"  stopOpacity="0" />
            </radialGradient>
            <radialGradient id="fr-halo">
              <stop offset="60%"  stopColor="var(--spore)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--spore)" stopOpacity="0.16" />
            </radialGradient>
          </defs>

          {/* Halo. One fixed strength — see the header. */}
          <circle r={R * 0.98} fill="url(#fr-halo)" className="fr-halo" />

          {/* The mycelium itself */}
          <g className="fr-hyphae">
            {strands.map((s, i) => (
              <g key={i} style={{ '--d': s.delay + 's' }}>
                <path d={s.d} className="fr-strand" style={{ opacity: s.dim }} />
                <circle cx={s.tip.x} cy={s.tip.y} r={s.tip.r}
                        className="fr-tip" style={{ opacity: s.dim }} />
              </g>
            ))}
          </g>

          {/* Core, breathing at one fixed rate */}
          <circle r={R * 0.30} fill="url(#fr-core)" className="fr-core" />
          <circle r={R * 0.115} className="fr-nucleus" />
        </svg>
      </button>
    );
  }

  window.PortalOrganism = Organism;
})();
