/* ────────────────────────────────────────────────────────────────
   MYCO · context collector
   ────────────────────────────────────────────────────────────────
   Called before each API request. Snapshots the small, useful bits
   of local state so MYCO can answer "when's my next event?" or
   "what's my current focus?" without needing the full DB in its
   prompt.

   IMPORTANT: this data goes to the server, then into the model
   prompt. Only include what THIS caller is entitled to see and what
   the model needs to answer well. Never include: other members'
   emails, balances, private notes.
   ──────────────────────────────────────────────────────────────── */
(function () {
  function pickMember(m) {
    if (!m) return null;
    return {
      name:    m.name || m.character_name || null,
      role:    m.role || null,
      node:    m.node || m.location || null,
      tier:    (m.rep >= 300) ? 'root_node'
             : (m.rep >= 100) ? 'forager'
             : (m.rep >= 40)  ? 'mycelium'
             : (m.rep >= 10)  ? 'palawan' : 'spore',
      admin:   !!m.admin,
      founding:!!m.founding,
    };
  }

  function nextEvents(n = 3) {
    try {
      const events = (window.SporeData?.EVENTS || []);
      const now = Date.now();
      return events
        .filter(e => new Date(e.date).getTime() > now)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, n)
        .map(e => ({
          title:    e.title,
          subtitle: e.subtitle,
          date:     e.date,
          time:     e.time,
          node:     e.node,
          capacity: e.capacity,
          url:      e.url || null,
        }));
    } catch (_) { return []; }
  }

  function currentTab() {
    try {
      const el = document.querySelector('[data-active-tab]');
      return el?.getAttribute('data-active-tab') || 'network';
    } catch (_) { return 'network'; }
  }

  function todayCET() {
    return new Date().toLocaleString('en-GB', { timeZone: 'Europe/Berlin' });
  }

  window.MycoContext = {
    build(currentMember, extra) {
      return {
        now:     todayCET(),
        tab:     currentTab(),
        member:  pickMember(currentMember),
        upcoming: nextEvents(5),
        ...(extra || {}),
      };
    },
  };
})();
