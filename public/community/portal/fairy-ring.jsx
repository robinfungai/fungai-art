/* ────────────────────────────────────────────────────────────────
   portal/fairy-ring.jsx — the fairy ring, which IS the portal nav
   ────────────────────────────────────────────────────────────────
   A fairy ring is mycelium growing outward from one point and
   fruiting in a circle at its living edge. The Organism breathes in
   the middle, the sections fruit around it, and a hypha runs from the
   centre out to each of them.

   TWO SIZES, ONE INSTANCE (2026-09-25)
   On the portal home the ring is full size and drifts. Step into a
   section and the same component shrinks into the header, where the
   tab row and the HEALTH / FLOW / ACTIVITY strip used to be, with the
   open section turned to the front. It is one instance on purpose:
   the stage's height is a CSS transition, the ResizeObserver follows
   it frame by frame, and the radius follows the observer — so the
   ring visibly shrinks into place instead of being swapped for a
   different widget.

   ── STILL TRUE FROM PHASE 1 ──────────────────────────────────────
   a) ONE rAF loop, angle in a ref, transforms written straight to the
      node elements. React rerenders on hover, navigation and resize,
      never per animation frame. The loop stops itself when nothing
      moves.
   b) The angle is tweened, the short way round, so nodes travel
      along the ring rather than across it.
   c) No side effects inside state updaters.
   d) Block-bodied ref callbacks — React 19 reads a returned value as
      a cleanup function.
   e) Compare to null, never truthiness.
   f) Real <button>s.

   FIXED 2026-09-25: Phase 1 turned the focused node to -90°, the TOP
   of the ellipse, while the depth maths drew the top as the BACK —
   smallest and dimmest. So the node you picked shrank away from you.
   The front is +90°, the bottom of the ellipse, where depth is 1.
   ──────────────────────────────────────────────────────────────── */
(function () {
  const { useState, useEffect, useRef, useCallback } = React;

  const TAU      = Math.PI * 2;
  const FRONT    = Math.PI / 2;  // bottom of the ellipse: nearest, largest
  const LAP_MS   = 120000;       // one lap every two minutes — breathing, not spinning
  const TWEEN_MS = 620;
  const MAX_R    = 290;
  const MIN_R    = 92;

  // `tilt` squashes the circle into a ring seen lying in grass. The
  // compact ring is flatter so it fits the header.
  const MODES = {
    full:    { tilt: 0.46, glyph: 46, pad: 110 },
    compact: { tilt: 0.40, glyph: 32, pad: 96  },
  };

  const prefersReducedMotion = () =>
    !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function shortestDelta(from, to) {
    let d = (to - from) % TAU;
    if (d >  Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    return d;
  }

  const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // The radius comes from the stage, never from the mode, so it moves
  // continuously while the stage height animates between the two sizes.
  function radiusFor(size, mode) {
    if (!size.w) return MIN_R;
    const byW = (size.w - mode.pad) / 2;
    const byH = (size.h - mode.glyph - 34) / (2 * mode.tilt);
    return Math.max(MIN_R, Math.min(MAX_R, byW, byH));
  }

  /* ── useOrbit ────────────────────────────────────────────────────
     The whole motion system: the rAF loop, the angle, the tween to
     the front, and the hyphae from the centre. Positions are written
     to the DOM directly.
     ──────────────────────────────────────────────────────────────── */
  function useOrbit({ count, radius, tilt, drift, focusIndex, threadsRef }) {
    const angle   = useRef(FRONT);
    const nodes   = useRef(new Map());   // index → element
    const tween   = useRef(null);
    const rafId   = useRef(0);
    const lastTs  = useRef(0);
    const reduced = useRef(prefersReducedMotion());

    const register = useCallback((index, el) => {
      if (el) { nodes.current.set(index, el); }
      else    { nodes.current.delete(index); }
    }, []);

    const place = useCallback(() => {
      if (!count) return;
      const threads = threadsRef.current;
      for (let i = 0; i < count; i++) {
        const a = angle.current + (i / count) * TAU;
        const x = Math.cos(a) * radius;
        const y = Math.sin(a) * radius * tilt;
        // sin runs -1 (back) → 1 (front). The back of the ring sits
        // smaller and dimmer, which is what makes it read as a ring
        // lying in grass rather than a flat circle of dots.
        const depth = (Math.sin(a) + 1) / 2;
        const el = nodes.current.get(i);
        if (el) {
          el.style.transform =
            'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) scale(' + (0.74 + depth * 0.34).toFixed(3) + ')';
          el.style.opacity = (0.5 + depth * 0.5).toFixed(3);
          el.style.zIndex  = String(10 + Math.round(depth * 20));
        }
        const th = threads[i];
        if (th) {
          // A hypha from the organism to the node, bowed sideways so it
          // reads as growth rather than as a spoke.
          const mx = x * 0.5 - y * 0.35;
          const my = y * 0.5 + x * 0.35 * tilt;
          th.setAttribute('d', 'M0,0 Q' + mx.toFixed(1) + ',' + my.toFixed(1) + ' ' + x.toFixed(1) + ',' + y.toFixed(1));
          th.style.setProperty('--depth', depth.toFixed(3));
        }
      }
    }, [count, radius, tilt, threadsRef]);

    const placeRef = useRef(place);
    placeRef.current = place;

    // Bring `focusIndex` to the front. `place` is read through a ref:
    // with it in the deps, every frame of the shrink animation would
    // restart the tween and it would never land.
    useEffect(() => {
      if (focusIndex === null || !count) { tween.current = null; return; }
      const target = FRONT - (focusIndex / count) * TAU;
      if (reduced.current) { angle.current = target; placeRef.current(); return; }
      tween.current = {
        from: angle.current,
        delta: shortestDelta(angle.current, target),
        start: performance.now(),
      };
    }, [focusIndex, count]);

    useEffect(() => {
      const drifting = drift && focusIndex === null && !reduced.current;
      function frame(ts) {
        rafId.current = 0;
        const dt = lastTs.current ? Math.min(100, ts - lastTs.current) : 0;
        lastTs.current = ts;
        let more = false;
        if (tween.current) {
          const t = Math.min(1, (ts - tween.current.start) / TWEEN_MS);
          angle.current = tween.current.from + tween.current.delta * easeInOutCubic(t);
          if (t >= 1) tween.current = null;
          more = true;
        } else if (drifting) {
          angle.current = (angle.current + (dt / LAP_MS) * TAU) % TAU;
          more = true;
        }
        place();
        // Nothing moving → no loop. The next hover, resize or
        // navigation starts it again through this effect.
        if (more) rafId.current = requestAnimationFrame(frame);
      }
      lastTs.current = 0;
      place();
      rafId.current = requestAnimationFrame(frame);
      return () => { if (rafId.current) cancelAnimationFrame(rafId.current); };
    }, [drift, focusIndex, place]);

    // Don't jump a lap's worth on return from a background tab.
    useEffect(() => {
      const onVis = () => { lastTs.current = 0; };
      document.addEventListener('visibilitychange', onVis);
      return () => document.removeEventListener('visibilitychange', onVis);
    }, []);

    return { register };
  }

  /* ── Glyphs · one line icon per section ─────────────────────── */
  const GLYPHS = {
    network:    <><circle cx="12" cy="12" r="8" /><ellipse cx="12" cy="12" rx="3.6" ry="8" /><path d="M4 12h16" /></>,
    calendar:   <><rect x="4.5" y="6" width="15" height="13.5" rx="2" /><path d="M4.5 10.5h15M9 4v4M15 4v4" /></>,
    apothecary: <><path d="M10 3.5h4M10.6 3.5v3.3L7 11.6v7a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-7l-3.6-4.8V3.5" /><path d="M7.2 14.2h9.6" /></>,
    hyphae:     <><circle cx="12" cy="6.5" r="2.2" /><circle cx="6" cy="17" r="2.2" /><circle cx="18" cy="17" r="2.2" /><path d="M11 8.4 7.1 15M13 8.4l3.9 6.6M8.2 17h7.6" /></>,
    academy:    <><path d="M12 7.5c-2-1.6-4.8-2-7.5-1.6v11.6c2.7-.4 5.5 0 7.5 1.6 2-1.6 4.8-2 7.5-1.6V5.9c-2.7-.4-5.5 0-7.5 1.6zM12 7.5v11.6" /></>,
    root:       <><path d="M12 3v7M12 10c0 3-3 4-5 7M12 10c0 3 3 4 5 7M12 13v7.5M7 17l-1.5 3M17 17l1.5 3" /></>,
  };
  function Glyph({ name }) {
    return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{GLYPHS[name] || GLYPHS.network}</svg>;
  }

  /* ── FairyRing ──────────────────────────────────────────────────
     role        'admin' adds Root to the ring and passes every rank gate
     active      the open tab id ('home' on the portal home)
     compact     shrunk into the header
     onNavigate  (tabId) → void
     rank        the member's rank id (palawan…founder), for `minRank` gates
     badges      { [sectionId]: count } — Root's alerts, Hyphae's unread
     ──────────────────────────────────────────────────────────────── */
  function FairyRing({ role, active = null, compact = false, onNavigate, rank = 'palawan', badges = null }) {
    const PS = window.PortalSections;
    const Organism = window.PortalOrganism;
    const { organism, ring } = PS ? PS.visibleFor(role) : { organism: null, ring: [] };
    const mode = compact ? MODES.compact : MODES.full;

    const [size, setSize]           = useState({ w: 0, h: 0 });
    const [hoverId, setHoverId]     = useState(null);
    const [choiceFor, setChoiceFor] = useState(null);   // node whose choices are open
    const [pointerIn, setPointerIn] = useState(false);
    const stageRef   = useRef(null);
    const threadsRef = useRef([]);

    const radius = radiusFor(size, mode);

    // What sits at the front: an open choice, else (compact only) the
    // section you are in. The full ring drifts freely.
    const frontId = choiceFor !== null ? choiceFor : (compact ? active : null);
    const frontIndex = frontId === null ? -1 : ring.findIndex(s => s.id === frontId);
    const focusIndex = frontIndex === -1 ? null : frontIndex;

    const { register } = useOrbit({
      count: ring.length,
      radius,
      tilt: mode.tilt,
      drift: !compact && !pointerIn,   // hold still under the pointer: easier to hit
      focusIndex,
      threadsRef,
    });

    useEffect(() => {
      const el = stageRef.current;
      if (!el || typeof ResizeObserver === 'undefined') return;
      const ro = new ResizeObserver(entries => {
        for (const e of entries) setSize({ w: e.contentRect.width, h: e.contentRect.height });
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    // An open choice closes on Escape or on a press anywhere outside the ring's nodes.
    useEffect(() => {
      if (choiceFor === null) return;
      const onDown = (e) => {
        if (!(e.target && e.target.closest && e.target.closest('.fr-node-slot'))) setChoiceFor(null);
      };
      const onKey = (e) => { if (e.key === 'Escape') setChoiceFor(null); };
      document.addEventListener('pointerdown', onDown);
      document.addEventListener('keydown', onKey);
      return () => {
        document.removeEventListener('pointerdown', onDown);
        document.removeEventListener('keydown', onKey);
      };
    }, [choiceFor]);

    const go = useCallback((id) => {
      if (typeof onNavigate === 'function') onNavigate(id);
    }, [onNavigate]);

    // A rank gate this viewer has not reached. Keepers pass them all.
    const lockedBy = useCallback((minRank) => (
      minRank && role !== 'admin' && PS && !PS.allows(minRank, rank) ? minRank : null
    ), [role, rank, PS]);
    const sayLocked = (label, minRank) => {
      window.dispatchEvent(new CustomEvent('spore:toast', {
        detail: { msg: label + ' opens at ' + minRank + '. A keeper sets ranks.' },
      }));
    };

    const activate = useCallback((s) => {
      const gate = lockedBy(s.minRank);
      if (gate) { sayLocked(s.label, gate); return; }
      if (s.choices) {
        const next = choiceFor === s.id ? null : s.id;
        setChoiceFor(next);
        return;
      }
      setChoiceFor(null);
      if (s.external && s.href) { window.open(s.href, '_blank', 'noopener'); return; }
      go(s.id);
    }, [choiceFor, go, lockedBy]);

    const choose = useCallback((c) => {
      const gate = lockedBy(c.minRank);
      if (gate) { sayLocked(c.label, gate); return; }
      setChoiceFor(null);
      if (c.href) { window.open(c.href, '_blank', 'noopener'); return; }
      go(c.id);
    }, [go, lockedBy]);

    // Arrow keys walk the ring when a node has focus.
    const onKeyDown = useCallback((e) => {
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
                : e.key === 'ArrowLeft'  || e.key === 'ArrowUp'   ? -1 : 0;
      if (!dir || !ring.length) return;
      const focusedId = String((document.activeElement && document.activeElement.id) || '').replace(/^fr-node-/, '');
      const cur = ring.findIndex(s => s.id === focusedId);
      if (cur === -1) return;
      e.preventDefault();
      const next = ring[(cur + dir + ring.length) % ring.length];
      const el = document.getElementById('fr-node-' + next.id);
      if (el) el.focus();
    }, [ring]);

    if (!PS) return null;

    const isActive = (s) => active === s.id || (!!s.choices && s.choices.some(c => c.id === active));
    const hovered  = hoverId === null ? null : ring.find(s => s.id === hoverId) || null;
    const related  = hovered ? (hovered.related || []) : [];
    const shown    = hovered || organism;
    const orgSize  = compact
      ? Math.max(40, Math.min(56, radius * 0.4))
      : Math.max(110, Math.min(200, radius * 0.62));

    return (
      <nav className={'fr-wrap ' + (compact ? 'is-compact' : 'is-full')} aria-label="Portal sections">
        <div
          className="fr-stage"
          ref={stageRef}
          onKeyDown={onKeyDown}
          onPointerEnter={() => setPointerIn(true)}
          onPointerLeave={() => { setPointerIn(false); setHoverId(null); }}
        >
          {/* The ring itself, and one hypha per node. Paths are written
              by useOrbit every frame the ring moves. */}
          <svg className="fr-threads" width="1" height="1" aria-hidden="true" focusable="false">
            <ellipse className="fr-ring-glow" rx={radius} ry={radius * mode.tilt} />
            <ellipse className="fr-ring" rx={radius} ry={radius * mode.tilt} />
            {ring.map((s, i) => (
              <path
                key={s.id}
                ref={(el) => { threadsRef.current[i] = el; }}
                className={'fr-thread' + (s.id === hoverId || isActive(s) ? ' is-on' : '')}
              />
            ))}
          </svg>

          <div className="fr-centre">
            {Organism ? (
              <Organism
                size={orgSize}
                label={organism.label}
                focused={active === organism.id}
                onOpen={() => { setChoiceFor(null); go(organism.id); }}
              />
            ) : null}
          </div>

          <ul className="fr-nodes">
            {ring.map((s, i) => {
              const on = isActive(s);
              const gate = lockedBy(s.minRank);
              const badge = badges && badges[s.id] ? badges[s.id] : 0;
              return (
                <li key={s.id} className="fr-node-slot" ref={(el) => { register(i, el); }}>
                  <button
                    type="button"
                    id={'fr-node-' + s.id}
                    className={'fr-node' +
                      (on ? ' is-active' : '') +
                      (gate ? ' is-locked' : '') +
                      (related.indexOf(s.id) !== -1 ? ' is-related' : '') +
                      (s.requiresRole ? ' is-root' : '')}
                    aria-current={on ? 'page' : undefined}
                    aria-haspopup={s.choices && !gate ? 'menu' : undefined}
                    aria-expanded={s.choices && !gate ? choiceFor === s.id : undefined}
                    aria-label={s.label + (s.external ? ' (opens in a new tab)' : '') + ' — ' + s.subtitle +
                      (gate ? ' — opens at ' + gate : '') + (badge ? ' — ' + badge + ' new' : '')}
                    onClick={() => activate(s)}
                    onPointerEnter={() => setHoverId(s.id)}
                    onFocus={() => setHoverId(s.id)}
                  >
                    <span className="fr-node-glyph"><Glyph name={s.icon} /></span>
                    {badge ? <span className="fr-badge" aria-hidden="true">{badge > 9 ? '9+' : badge}</span> : null}
                    <span className="fr-node-label" aria-hidden="true">
                      {s.label}{s.external ? <span className="fr-ext"> ↗</span> : null}
                      {gate ? <span className="fr-lock"> · {gate}</span> : null}
                    </span>
                  </button>
                  {s.choices && choiceFor === s.id ? (
                    <div className="fr-choices" role="menu" aria-label={s.label}>
                      {s.choices.map(c => {
                        const cGate = lockedBy(c.minRank);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            role="menuitem"
                            className={'fr-choice' + (active === c.id ? ' is-active' : '') + (cGate ? ' is-locked' : '')}
                            onClick={() => choose(c)}
                          >
                            <span className="fr-choice-label">{c.label}{c.href ? ' ↗' : ''}</span>
                            <span className="fr-choice-sub">{cGate ? 'opens at ' + cGate : c.sub}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>

        {!compact ? (
          <div className="fr-caption" aria-live="polite">
            <p className="fr-caption-kicker">{shown.subtitle}</p>
            <h3 className="fr-caption-title">{shown.label}</h3>
            <p className="fr-caption-line">{shown.line}</p>
          </div>
        ) : null}
      </nav>
    );
  }

  window.FairyRing = FairyRing;
})();
