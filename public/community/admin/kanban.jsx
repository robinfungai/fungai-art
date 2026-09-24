/* ────────────────────────────────────────────────────────────────
   admin/kanban.jsx — the admin planning board
   ────────────────────────────────────────────────────────────────
   Four columns, drag to move or reorder, drag to the barrel to
   delete. Backed by public.board_cards (supabase-admin-board.sql),
   admin-only at the RLS layer via fa_is_admin().

   WHY IT LIVES HERE and not in src/components/ui/
   ------------------------------------------------
   The reference component this is modelled on is a shadcn/Tailwind
   TSX component, and this repo does have shadcn, Tailwind and TS —
   but the admin panel is not in that app. It is AdminPage inside
   spore/app-living.jsx, on a static page where React is a UMD global
   and no Tailwind stylesheet is loaded. A Tailwind component dropped
   there renders unstyled, and an esbuild island would bundle a
   second copy of React (~130 KB) into a page that already has one.

   So this follows the portal's own pattern, the one myco/agent.jsx
   established: an IIFE that declares nothing on the global scope and
   hands back a single component on window. app-living.jsx picks it
   up with a defensive shim, exactly as it does for MycoAgent.

   Styling is admin/kanban.css, in the portal's own tokens. framer-
   motion and react-icons are not dependencies of this repo, so the
   animation is CSS transitions and the icons are inline SVG.

   POSITION IS FRACTIONAL, on purpose. Dropping a card between two
   others averages its neighbours' positions, so one move writes one
   row rather than renumbering a column. After ~50 drops into the
   same gap the doubles get tight; renormalise() spreads a column
   back out to 1,2,3… and is called when a gap gets too small to
   halve safely.
   ──────────────────────────────────────────────────────────────── */
(function () {
  const { useState, useEffect, useCallback, useRef } = React;

  const COLUMNS = [
    { id: 'backlog', title: 'Backlog',     accent: 'var(--mycelium-d)' },
    { id: 'todo',    title: 'To do',       accent: 'var(--nutrient)'   },
    { id: 'doing',   title: 'In progress', accent: 'var(--fungal)'     },
    { id: 'done',    title: 'Complete',    accent: 'var(--spore)'      },
  ];

  // Below this gap between neighbours, stop halving and renormalise.
  const MIN_GAP = 1e-6;

  /* ── icons (react-icons is not a dependency) ─────────────────── */
  function IconPlus() {
    return (
      <svg className="kb-ico" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.3"
              strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  function IconTrash() {
    return (
      <svg className="kb-ico-lg" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16M9.5 7V4.8h5V7M6.5 7l1 12.2h9l1-12.2M10.5 10.5v6M13.5 10.5v6"
              stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  function IconFlame() {
    return (
      <svg className="kb-ico-lg kb-flame" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.5c3.4 3.6 6.5 6.3 6.5 10.4a6.5 6.5 0 1 1-13 0C5.5 8.8 8.6 6.1 12 2.5Z"
              fill="currentColor" opacity="0.22" />
        <path d="M12 2.5c3.4 3.6 6.5 6.3 6.5 10.4a6.5 6.5 0 1 1-13 0C5.5 8.8 8.6 6.1 12 2.5Z"
              stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="M12 10c1.7 1.9 3 3.1 3 5.1a3 3 0 1 1-6 0c0-2 1.3-3.2 3-5.1Z"
              fill="currentColor" opacity="0.65" />
      </svg>
    );
  }

  /* ── data access ─────────────────────────────────────────────── */
  // Every call funnels through here so a missing client, a dropped
  // session and an RLS denial each produce one recognisable shape
  // instead of an exception somewhere in a render.
  async function sb() {
    if (!window.SBclient) throw new Error('OFFLINE');
    if (window.SBready) { try { await window.SBready; } catch (_) {} }
    return window.SBclient;
  }

  async function loadCards() {
    const c = await sb();
    const { data, error } = await c
      .from('board_cards')
      .select('id,column_id,title,position')
      .order('column_id', { ascending: true })
      .order('position',  { ascending: true });
    if (error) throw error;
    return data || [];
  }

  /* ── the board ───────────────────────────────────────────────── */
  function AdminKanban({ onToast }) {
    const [cards,   setCards]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [problem, setProblem] = useState(null);   // 'offline' | 'denied' | string
    const [dragId,  setDragId]  = useState(null);
    const mounted = useRef(true);

    useEffect(() => () => { mounted.current = false; }, []);

    const notify = useCallback((msg, kind) => {
      if (typeof onToast === 'function') onToast(msg, kind);
    }, [onToast]);

    const refresh = useCallback(async () => {
      try {
        const rows = await loadCards();
        if (!mounted.current) return;
        setCards(rows);
        setProblem(null);
      } catch (err) {
        if (!mounted.current) return;
        if (err && err.message === 'OFFLINE') setProblem('offline');
        // 42501 is Postgres insufficient_privilege; PostgREST also
        // returns an empty set for a denied SELECT, which is why the
        // empty board carries its own hint rather than this branch.
        else if (err && (err.code === '42501' || /permission|policy|RLS/i.test(err.message || ''))) setProblem('denied');
        else setProblem((err && err.message) || 'Could not load the board.');
      } finally {
        if (mounted.current) setLoading(false);
      }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const inColumn = useCallback(
      (colId) => cards.filter(c => c.column_id === colId)
                      .sort((a, b) => a.position - b.position),
      [cards]
    );

    /* ── add ───────────────────────────────────────────────────── */
    async function addCard(colId, title) {
      const col  = inColumn(colId);
      const last = col.length ? col[col.length - 1].position : 0;
      const row  = { column_id: colId, title, position: last + 1 };

      // Optimistic, with a temporary id. The insert returns the real
      // row and we swap it in, so a failed insert cannot leave a
      // phantom card that vanishes on the next reload.
      const tempId = 'tmp-' + Math.random().toString(36).slice(2);
      setCards(prev => [...prev, { ...row, id: tempId }]);

      try {
        const c = await sb();
        const user = window.SBauth ? await window.SBauth.getUser() : null;
        const { data, error } = await c
          .from('board_cards')
          .insert({ ...row, created_by: user ? user.id : null })
          .select('id,column_id,title,position')
          .single();
        if (error) throw error;
        if (!mounted.current) return;
        setCards(prev => prev.map(x => (x.id === tempId ? data : x)));
      } catch (err) {
        if (mounted.current) setCards(prev => prev.filter(x => x.id !== tempId));
        notify('Could not add the card — ' + ((err && err.message) || 'unknown error'), 'error');
      }
    }

    /* ── delete ────────────────────────────────────────────────── */
    async function removeCard(id) {
      const snapshot = cards;
      setCards(prev => prev.filter(x => x.id !== id));
      try {
        const c = await sb();
        const { error } = await c.from('board_cards').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        if (mounted.current) setCards(snapshot);   // put it back
        notify('Could not delete the card — ' + ((err && err.message) || 'unknown error'), 'error');
      }
    }

    /* ── move / reorder ────────────────────────────────────────── */
    // `beforeId` is the card the dragged one should land above, or
    // null for the end of the column.
    async function moveCard(id, colId, beforeId) {
      const card = cards.find(c => c.id === id);
      if (!card) return;

      // Neighbours, with the dragged card taken out — otherwise a
      // move within the same column averages against itself.
      const siblings = cards
        .filter(c => c.column_id === colId && c.id !== id)
        .sort((a, b) => a.position - b.position);

      let position;
      let needsRenormalise = false;

      if (!beforeId) {
        position = siblings.length ? siblings[siblings.length - 1].position + 1 : 1;
      } else {
        const i = siblings.findIndex(c => c.id === beforeId);
        if (i === -1) {
          position = siblings.length ? siblings[siblings.length - 1].position + 1 : 1;
        } else if (i === 0) {
          position = siblings[0].position - 1;
        } else {
          const lo = siblings[i - 1].position, hi = siblings[i].position;
          position = (lo + hi) / 2;
          if (hi - lo < MIN_GAP) needsRenormalise = true;
        }
      }

      if (card.column_id === colId && card.position === position) return;

      const snapshot = cards;
      setCards(prev => prev.map(x => (x.id === id ? { ...x, column_id: colId, position } : x)));

      try {
        const c = await sb();
        const { error } = await c
          .from('board_cards')
          .update({ column_id: colId, position })
          .eq('id', id);
        if (error) throw error;
        if (needsRenormalise) await renormalise(colId);
      } catch (err) {
        if (mounted.current) setCards(snapshot);
        notify('Could not move the card — ' + ((err && err.message) || 'unknown error'), 'error');
      }
    }

    // Spread one column back out to 1,2,3… Only runs when halving a
    // gap would stop being representable, which takes ~50 drops into
    // the identical spot — so in practice, never.
    async function renormalise(colId) {
      const col = cards.filter(c => c.column_id === colId)
                       .sort((a, b) => a.position - b.position);
      const c = await sb();
      for (let i = 0; i < col.length; i++) {
        await c.from('board_cards').update({ position: i + 1 }).eq('id', col[i].id);
      }
      await refresh();
    }

    /* ── drag plumbing ─────────────────────────────────────────── */
    // Indicators are DOM nodes carrying data-before / data-column, so
    // "which gap is the pointer nearest" is one getBoundingClientRect
    // pass and no React state per mousemove.
    function indicatorsFor(colId) {
      return Array.from(document.querySelectorAll('[data-kb-column="' + colId + '"]'));
    }
    function clearIndicators(els) {
      (els || document.querySelectorAll('[data-kb-column]')).forEach(el => { el.style.opacity = '0'; });
    }
    function nearestIndicator(e, els) {
      const OFFSET = 50;
      return els.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = e.clientY - (box.top + OFFSET);
        if (offset < 0 && offset > closest.offset) return { offset, element: child };
        return closest;
      }, { offset: Number.NEGATIVE_INFINITY, element: els[els.length - 1] });
    }

    function onCardDragStart(e, card) {
      e.dataTransfer.setData('text/kb-card', card.id);
      e.dataTransfer.effectAllowed = 'move';
      setDragId(card.id);
    }
    function onCardDragEnd() {
      setDragId(null);
      clearIndicators();
    }

    /* ── render ────────────────────────────────────────────────── */
    if (loading) {
      return (
        <div className="kb-wrap">
          <div className="kb-state">Loading the board…</div>
        </div>
      );
    }

    if (problem === 'offline') {
      return (
        <div className="kb-wrap">
          <div className="kb-state kb-state-warn">
            Not connected to Supabase, so the board can't load. It saves to
            <code> board_cards</code>, not this browser.
          </div>
        </div>
      );
    }
    if (problem === 'denied') {
      return (
        <div className="kb-wrap">
          <div className="kb-state kb-state-warn">
            The board is admin-only at the database layer. Sign in with an
            account whose profile has <code>is_admin = true</code>.
          </div>
        </div>
      );
    }
    if (problem) {
      return (
        <div className="kb-wrap">
          <div className="kb-state kb-state-warn">
            {problem}
            <button className="kb-retry" onClick={refresh}>Retry</button>
          </div>
        </div>
      );
    }

    return (
      <div className="kb-wrap">
        <div className="kb-board">
          {COLUMNS.map(col => (
            <Column
              key={col.id}
              col={col}
              cards={inColumn(col.id)}
              dragId={dragId}
              onDragStartCard={onCardDragStart}
              onDragEndCard={onCardDragEnd}
              onDropCard={moveCard}
              onAdd={addCard}
              indicatorsFor={indicatorsFor}
              clearIndicators={clearIndicators}
              nearestIndicator={nearestIndicator}
            />
          ))}
          <Barrel onBurn={removeCard} clearIndicators={clearIndicators} />
        </div>
        {cards.length === 0 && (
          <p className="kb-empty-hint">
            Nothing on the board yet. If you expected cards and see none, the
            SELECT may be denied rather than empty — check
            <code> profiles.is_admin</code> on your row.
          </p>
        )}
      </div>
    );
  }

  /* ── column ──────────────────────────────────────────────────── */
  function Column({ col, cards, dragId, onDragStartCard, onDragEndCard, onDropCard,
                    onAdd, indicatorsFor, clearIndicators, nearestIndicator }) {
    const [active, setActive] = useState(false);

    function handleDragOver(e) {
      if (!e.dataTransfer.types.includes('text/kb-card')) return;
      e.preventDefault();
      const els = indicatorsFor(col.id);
      clearIndicators(els);
      const nearest = nearestIndicator(e, els);
      if (nearest.element) nearest.element.style.opacity = '1';
      setActive(true);
    }
    function handleDragLeave() {
      clearIndicators(indicatorsFor(col.id));
      setActive(false);
    }
    function handleDrop(e) {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/kb-card');
      const els = indicatorsFor(col.id);
      const nearest = nearestIndicator(e, els);
      const before = nearest.element ? nearest.element.dataset.kbBefore : '';
      clearIndicators(els);
      setActive(false);
      onDragEndCard();
      if (id) onDropCard(id, col.id, before || null);
    }

    return (
      <section className="kb-col" aria-label={col.title}>
        <header className="kb-col-head">
          <h4 className="kb-col-title" style={{ color: col.accent }}>{col.title}</h4>
          <span className="kb-col-count">{cards.length}</span>
        </header>
        <div
          className={'kb-col-body' + (active ? ' is-active' : '')}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {cards.map(c => (
            <React.Fragment key={c.id}>
              <Indicator beforeId={c.id} column={col.id} />
              <article
                className={'kb-card' + (dragId === c.id ? ' is-dragging' : '')}
                draggable="true"
                onDragStart={e => onDragStartCard(e, c)}
                onDragEnd={onDragEndCard}
              >
                <p className="kb-card-text">{c.title}</p>
              </article>
            </React.Fragment>
          ))}
          <Indicator beforeId={null} column={col.id} />
          <AddCard column={col.id} onAdd={onAdd} />
        </div>
      </section>
    );
  }

  // A drop target between two cards. `data-kb-before` is the id of the
  // card it sits above, or '' for the end of the column.
  function Indicator({ beforeId, column }) {
    return (
      <div className="kb-indicator"
           data-kb-before={beforeId || ''}
           data-kb-column={column} />
    );
  }

  /* ── burn barrel ─────────────────────────────────────────────── */
  function Barrel({ onBurn, clearIndicators }) {
    const [hot, setHot] = useState(false);

    return (
      <div
        className={'kb-barrel' + (hot ? ' is-hot' : '')}
        onDragOver={e => {
          if (!e.dataTransfer.types.includes('text/kb-card')) return;
          e.preventDefault();
          setHot(true);
        }}
        onDragLeave={() => setHot(false)}
        onDrop={e => {
          e.preventDefault();
          const id = e.dataTransfer.getData('text/kb-card');
          setHot(false);
          clearIndicators();
          if (id) onBurn(id);
        }}
        title="Drag a card here to delete it"
      >
        {hot ? <IconFlame /> : <IconTrash />}
        <span className="kb-barrel-label">{hot ? 'Release to delete' : 'Drag here to delete'}</span>
      </div>
    );
  }

  /* ── add-card form ───────────────────────────────────────────── */
  function AddCard({ column, onAdd }) {
    const [adding, setAdding] = useState(false);
    const [text, setText]     = useState('');
    const ref = useRef(null);

    useEffect(() => { if (adding && ref.current) ref.current.focus(); }, [adding]);

    function submit(e) {
      e.preventDefault();
      const title = text.trim();
      if (!title) return;
      onAdd(column, title.slice(0, 500));
      setText('');
      setAdding(false);
    }

    if (!adding) {
      return (
        <button className="kb-add-open" onClick={() => setAdding(true)}>
          <IconPlus /><span>Add card</span>
        </button>
      );
    }

    return (
      <form className="kb-add-form" onSubmit={submit}>
        <textarea
          ref={ref}
          value={text}
          maxLength={500}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') { setAdding(false); setText(''); }
            // Enter submits, Shift+Enter makes a new line — the board is
            // for one-line notes, so the common case should be one key.
            if (e.key === 'Enter' && !e.shiftKey) submit(e);
          }}
          placeholder="What needs doing?"
          className="kb-add-input"
        />
        <div className="kb-add-actions">
          <button type="button" className="kb-add-cancel"
                  onClick={() => { setAdding(false); setText(''); }}>Close</button>
          <button type="submit" className="kb-add-submit">
            <span>Add</span><IconPlus />
          </button>
        </div>
      </form>
    );
  }

  window.AdminKanban = AdminKanban;
})();
