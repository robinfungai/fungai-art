/* ────────────────────────────────────────────────────────────────
   portal/fairy-ring.jsx — the portal home as a fairy ring
   ────────────────────────────────────────────────────────────────
   A fairy ring is mycelium growing outward from one point and
   fruiting in a circle at its living edge. The Organism breathes in
   the middle, sections fruit around it, hyphal threads run between
   related ones.

   Ported from the 21st.dev Radial Orbital Timeline as a BEHAVIOUR
   SPEC, not a dependency. No shadcn, no Tailwind, no animation
   library — /community is static HTML with React as a UMD global and
   one shared script scope, and the reference's globals.css would have
   restyled this page and eight other static ones.

   ── THE SIX FIXES, since the reference ships with them ───────────
   a) It setState()s every 50ms, so the whole ring rerenders 20×/sec
      while each node's 700ms CSS transition fights the updates. Here:
      ONE rAF loop, the angle in a ref, transforms written straight to
      the node elements. React rerenders only when focus or pause
      changes — a handful of times per session, not 20 times a second.
   b) On focus its nodes slide in straight lines across the circle.
      Here the ANGLE is tweened, and by the short way round, so they
      travel along the ring like things attached to it.
   c) toggleItem ran side effects inside a state updater, which React
      calls twice in StrictMode. Here the next state is computed first,
      then applied.
   d) Its ref callback implicitly returns the element; React 19 reads a
      ref callback's return value as a cleanup function. Block bodies
      throughout.
   e) isRelatedToActive used a truthiness check, so an id of 0 breaks
      it. Everything here compares to null.
   f) Its nodes are clickable divs. Here they are <button>, and an
      external section is an <a>.

   ── WHAT IS NOT DRAWN ────────────────────────────────────────────
   Pulse, HEALTH, ACTIVITY and FLOW. None has a real data source; the
   economy that would drive them is localStorage-only and forgeable
   (docs/COMMUNITY-AUDIT.md §5). Robin's call on 2026-09-25: hide them
   rather than show a number that isn't real. Streaming runs at one
   fixed rate, and the detail card has no Pulse bar until Phase 2.
   ──────────────────────────────────────────────────────────────── */
(function () {
  const { useState, useEffect, useRef, useCallback, useMemo } = React;

  const TAU        = Math.PI * 2;
  const LAP_MS     = 120000;   // one lap every two minutes — breathing, not spinning
  const TWEEN_MS   = 620;      // focus tween
  const TILT       = 0.42;     // ellipse squash: looking down at a ring in the grass
  const MIN_R      = 96;
  const MAX_R      = 250;

  const prefersReducedMotion = () =>
    !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Shortest signed distance between two angles. Fix (b): without
  // this, focusing a node on the far side sends everything the long
  // way round, or straight across the middle.
  function shortestDelta(from, to) {
    let d = (to - from) % TAU;
    if (d >  Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    return d;
  }

  const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /* ── useOrbit ────────────────────────────────────────────────────
     The whole motion system. Owns the rAF loop, the angle, the focus
     tween and every reason to stop moving. Returns an imperative
     `register` so nodes can be positioned without React re-rendering.
     ──────────────────────────────────────────────────────────────── */
  function useOrbit({ count, radius, paused, focusIndex, onFrame }) {
    const angle    = useRef(0);
    const nodes    = useRef(new Map());   // index → element
    const tween    = useRef(null);
    const rafId    = useRef(0);
    const lastTs   = useRef(0);
    const visible  = useRef(true);
    const reduced  = useRef(false);

    useEffect(() => { reduced.current = prefersReducedMotion(); }, []);

    // Fix (d): block body, so nothing is returned. React 19 would read
    // a returned element as this ref's cleanup function.
    const register = useCallback((index, el) => {
      if (el) { nodes.current.set(index, el); }
      else    { nodes.current.delete(index); }
    }, []);

    // Write positions straight to the DOM. This is fix (a): the
    // expensive part of the reference was making React do this.
    const place = useCallback(() => {
      const n = count;
      if (!n) return;
      for (let i = 0; i < n; i++) {
        const el = nodes.current.get(i);
        if (!el) continue;
        const a = angle.current + (i / n) * TAU;
        const x = Math.cos(a) * radius;
        const y = Math.sin(a) * radius * TILT;
        // sin runs -1 (back) → 1 (front). Nodes at the back sit
        // smaller and dimmer, which is what makes it read as a ring
        // lying in grass rather than a flat circle of dots.
        const depth = (Math.sin(a) + 1) / 2;
        const scale = 0.72 + depth * 0.38;
        el.style.transform =
          'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) scale(' + scale.toFixed(3) + ')';
        el.style.opacity = (0.45 + depth * 0.55).toFixed(3);
        el.style.zIndex = String(10 + Math.round(depth * 20));
      }
      if (typeof onFrame === 'function') onFrame(angle.current);
    }, [count, radius, onFrame]);

    // Start a tween that brings `focusIndex` to the front of the ring.
    // Front is -90° (top of the ellipse, nearest the viewer).
    useEffect(() => {
      if (focusIndex === null || !count) { tween.current = null; return; }
      const target = -Math.PI / 2 - (focusIndex / count) * TAU;
      if (reduced.current) {
        angle.current = target;   // no tween under reduced motion
        place();
        return;
      }
      tween.current = {
        from: angle.current,
        delta: shortestDelta(angle.current, target),
        start: performance.now(),
      };
    }, [focusIndex, count, place]);

    useEffect(() => {
      const onVis = () => {
        visible.current = !document.hidden;
        lastTs.current = 0;               // don't jump on resume
      };
      document.addEventListener('visibilitychange', onVis);
      return () => document.removeEventListener('visibilitychange', onVis);
    }, []);

    useEffect(() => {
      function frame(ts) {
        rafId.current = requestAnimationFrame(frame);
        if (!visible.current) { lastTs.current = ts; return; }

        const dt = lastTs.current ? ts - lastTs.current : 0;
        lastTs.current = ts;

        if (tween.current) {
          const t = Math.min(1, (ts - tween.current.start) / TWEEN_MS);
          angle.current = tween.current.from + tween.current.delta * easeInOutCubic(t);
          if (t >= 1) tween.current = null;
          place();
          return;
        }

        // Drift stops while something is focused, and under reduced
        // motion, and while the user has pressed pause.
        if (!paused && focusIndex === null && !reduced.current && dt) {
          angle.current = (angle.current + (dt / LAP_MS) * TAU) % TAU;
        }
        place();
      }
      rafId.current = requestAnimationFrame(frame);
      return () => cancelAnimationFrame(rafId.current);
    }, [paused, focusIndex, place]);

    return { register, place };
  }

  /* ── DetailCard ─────────────────────────────────────────────── */
  function DetailCard({ section, onClose, onStepIn, threads }) {
    if (!section) return null;
    return (
      <aside className="fr-card" role="dialog" aria-label={section.label}>
        <header className="fr-card-head">
          <div>
            <p className="fr-card-kicker">{section.subtitle}</p>
            <h3 className="fr-card-title">{section.label}</h3>
          </div>
          <button type="button" className="fr-card-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <p className="fr-card-line">{section.line}</p>

        {/* No Pulse bar. It would need a real activity signal and there
            isn't one — see the header of this file. */}

        {threads.length > 0 && (
          <div className="fr-card-threads">
            <p className="fr-card-label">Threads</p>
            <ul>
              {threads.map(t => (
                <li key={t.id}><span className="fr-thread-dot" aria-hidden="true" />{t.label}</li>
              ))}
            </ul>
          </div>
        )}

        {section.external ? (
          <a className="fr-step-in" href={section.href}>Step in</a>
        ) : (
          <button type="button" className="fr-step-in" onClick={onStepIn}>Step in</button>
        )}
      </aside>
    );
  }

  /* ── FairyRing ──────────────────────────────────────────────── */
  function FairyRing({ role, onOpenSection }) {
    const PS = window.PortalSections;
    const Organism = window.PortalOrganism;
    if (!PS) return null;

    const { organism, ring, root } = PS.visibleFor(role);

    const [focusId, setFocusId] = useState(null);   // fix (e): null, never falsy-checked
    const [paused, setPaused]   = useState(false);
    const [radius, setRadius]   = useState(180);
    const stageRef = useRef(null);

    const focusIndex = useMemo(() => {
      if (focusId === null) return null;
      const i = ring.findIndex(s => s.id === focusId);
      return i === -1 ? null : i;
    }, [focusId, ring]);

    const { register } = useOrbit({ count: ring.length, radius, paused, focusIndex });

    // Radius from the stage, clamped. The reference hardcodes 200px,
    // which overflows a 360px phone and looks lost at 1440.
    useEffect(() => {
      const el = stageRef.current;
      if (!el || typeof ResizeObserver === 'undefined') return;
      const ro = new ResizeObserver(entries => {
        for (const e of entries) {
          const w = e.contentRect.width, h = e.contentRect.height;
          const r = Math.min(w * 0.38, h * 0.62);
          setRadius(Math.max(MIN_R, Math.min(MAX_R, r)));
        }
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    const focused = focusId === null ? null : PS.byId(focusId);
    const relatedIds = focused ? (focused.related || []) : [];

    // Fix (c): compute, then apply. No side effects inside an updater.
    const toggle = useCallback((id) => {
      const next = (focusId === id) ? null : id;
      setFocusId(next);
    }, [focusId]);

    const stepIn = useCallback((section) => {
      if (!section) return;
      if (section.external && section.href) { window.location.href = section.href; return; }
      if (typeof onOpenSection === 'function') onOpenSection(section.id);
    }, [onOpenSection]);

    // Arrow keys move around the ring and bring the node to the front.
    const onKeyDown = useCallback((e) => {
      if (!ring.length) return;
      if (e.key === 'Escape') { setFocusId(null); return; }
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
                : e.key === 'ArrowLeft'  || e.key === 'ArrowUp'   ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      const cur = focusIndex === null ? -1 : focusIndex;
      const next = ((cur + dir) % ring.length + ring.length) % ring.length;
      setFocusId(ring[next].id);
      const el = document.getElementById('fr-node-' + ring[next].id);
      if (el) el.focus();
    }, [ring, focusIndex]);

    return (
      <section className="fr-wrap">
        <nav
          className="fr-stage"
          ref={stageRef}
          aria-label="Portal sections"
          onKeyDown={onKeyDown}
          onClick={(e) => { if (e.target === e.currentTarget) setFocusId(null); }}
        >
          <div className="fr-centre">
            {Organism ? (
              <Organism
                size={Math.max(120, radius * 0.95)}
                label={organism.label}
                focused={focusId === organism.id}
                onOpen={() => stepIn(organism)}
              />
            ) : null}
          </div>

          <ul className="fr-nodes">
            {ring.map((s, i) => {
              const isFocused = focusId === s.id;
              const isRelated = focusId !== null && relatedIds.indexOf(s.id) !== -1;
              return (
                <li
                  key={s.id}
                  className="fr-node-slot"
                  ref={(el) => { register(i, el); }}   /* fix (d): block body */
                >
                  <button
                    type="button"
                    id={'fr-node-' + s.id}
                    className={'fr-node' +
                      (isFocused ? ' is-focused' : '') +
                      (isRelated ? ' is-related' : '')}
                    aria-pressed={isFocused}
                    aria-describedby={isFocused ? 'fr-card-live' : undefined}
                    onClick={() => (isFocused ? stepIn(s) : toggle(s.id))}
                  >
                    <span className="fr-node-glyph" aria-hidden="true" />
                    <span className="fr-node-label">{s.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {root ? (
            <div className="fr-root">
              <span className="fr-root-thread" aria-hidden="true" />
              <button
                type="button"
                id={'fr-node-' + root.id}
                className={'fr-node fr-node-root' + (focusId === root.id ? ' is-focused' : '')}
                aria-pressed={focusId === root.id}
                onClick={() => (focusId === root.id ? stepIn(root) : toggle(root.id))}
              >
                <span className="fr-node-glyph" aria-hidden="true" />
                <span className="fr-node-label">{root.label}</span>
              </button>
            </div>
          ) : null}
        </nav>

        <div className="fr-side">
          <div id="fr-card-live" aria-live="polite">
            <DetailCard
              section={focused}
              threads={relatedIds.map(id => PS.byId(id)).filter(Boolean)}
              onClose={() => setFocusId(null)}
              onStepIn={() => stepIn(focused)}
            />
          </div>
          <button
            type="button"
            className="fr-pause"
            aria-pressed={paused}
            onClick={() => setPaused(p => !p)}
          >
            {paused ? 'Resume drift' : 'Pause drift'}
          </button>
        </div>
      </section>
    );
  }

  window.FairyRing = FairyRing;
})();
