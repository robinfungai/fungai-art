/* ────────────────────────────────────────────────────────────────
   portal/sections.jsx — portalSections, the one config
   ────────────────────────────────────────────────────────────────
   The fairy ring IS the portal's navigation (2026-09-25). Every label
   the ring shows, full size on the home view or shrunk into the header
   inside a section, comes from here. Renaming happens once.

   ⚠ `id` IS NOT A LABEL. Ids are load-bearing: app-living.jsx
   switches on them and they appear in the URL hash (#calendar).
   Rename `label` freely; never touch `id`. A retired id goes in
   LEGACY so an old bookmark still lands somewhere sensible.

   THE RING, per Robin 2026-09-25
     centre     Dashboard — Fungai Art as a whole; the portal home
     Network    the globe, and what each node is
     Calendar   the Mycelium Calendar, Experiences merged in, and who is coming
     Apothecary a choice: Members shop, or the Official shop
     Hyphae     the members, and DMs to any of them
     Academy    its own page, opened in a new tab
     Root       keepers only

   Retired: Fruiting (merged into Calendar), Larder (now the Members
   shop door of Apothecary), Almanac and Alchemy (renamed). HEALTH,
   ACTIVITY, FLOW and Pulse stay gone — nothing real behind them.
   ──────────────────────────────────────────────────────────────── */
(function () {

  // The centre of the ring. Not a ring node — the ring turns around it.
  // Stepping in means going home: the full ring with the dashboard under it.
  const ORGANISM = {
    id:       'home',
    label:    'Dashboard',
    subtitle: 'the whole body at once',
    line:     'Fungai Art as one living thing — the numbers, the season, what is growing.',
    icon:     'dashboard',
  };

  // Ring nodes, in ring order. `related` drives the hyphal threads.
  const RING = [
    {
      id:       'network',
      label:    'Network',
      subtitle: 'the globe and its nodes',
      line:     'Every place the mycelium has reached. Tap a node on the globe to meet it.',
      related:  ['members', 'calendar'],
      icon:     'network',
    },
    {
      id:       'calendar',
      label:    'Calendar',
      subtitle: 'gatherings, dinners, experiences',
      line:     'The Mycelium Calendar — every gathering and experience, and who is coming.',
      related:  ['network', 'shop', 'members'],
      icon:     'calendar',
    },
    {
      id:       'shop',
      label:    'Apothecary',
      subtitle: 'members shop · official shop',
      line:     'Two doors into the apothecary. Choose one.',
      related:  ['calendar', 'academy'],
      icon:     'apothecary',
      // Pressing the node opens this choice instead of stepping in.
      choices: [
        { id: 'shop',     label: 'Members shop',  sub: 'editions kept for the network' },
        { id: 'official', label: 'Official shop', sub: 'fungai.art/shop', href: '/shop' },
      ],
    },
    {
      id:       'members',
      label:    'Hyphae',
      subtitle: "who's tending",
      line:     'Every member of the network, and a direct line to each of them.',
      related:  ['network', 'calendar', 'academy'],
      icon:     'hyphae',
    },
    {
      id:       'academy',
      label:    'Academy',
      subtitle: 'Alchemy Academy',
      line:     'The devotional practice of meeting the plants and yourself.',
      related:  ['members', 'shop'],
      icon:     'academy',
      // Its own page, not a tab, and it opens in a new tab.
      href:     '/community/academy/',
      external: true,
    },
  ];

  // Keepers only. Hiding it is courtesy; RLS is the real gate
  // (supabase-rbac-tiers.sql).
  const ROOT = {
    id:           'admin',
    label:        'Root',
    subtitle:     'admin · keepers only',
    line:         'Underground, where the keepers work.',
    related:      [],
    icon:         'root',
    requiresRole: 'admin',
  };

  // Retired ids → where they live now.
  const LEGACY = { exp: 'calendar', dashboard: 'home' };

  /* ── Rank gates (2026-09-25) ─────────────────────────────────────
     Add `minRank: 'Patron'` to any ring node, or to an Apothecary
     choice, to open it only from that rank up. The ladder is RANKS in
     spore/data.jsx — Palawan · Patron · Facilitator · Alchemist ·
     Founder — set by keepers on the Admin page (profiles.rank). Nothing
     is gated yet. Keepers (admins) pass every gate. A locked node still
     shows, marked with the rank that opens it.
     The database mirrors rank as profiles.access_tier (5–9) for RLS. */
  function rankIndex(r) {
    const k = String(r || '').toLowerCase();
    const ranks = (window.SporeData && window.SporeData.RANKS) || [];
    return ranks.findIndex(x => x.id === k || x.label.toLowerCase() === k);
  }
  function allows(minRank, rank) {
    if (!minRank) return true;
    const need = rankIndex(minRank);
    if (need === -1) return true;                 // unknown gate name: do not lock anyone out
    return rankIndex(rank || 'palawan') >= need;
  }
  // The rank a tab needs — from its node, or from the choice that opens it.
  function minRankForTab(tabId) {
    for (const s of [ORGANISM, ...RING, ROOT]) {
      if (s.id === tabId && s.minRank) return s.minRank;
      for (const c of s.choices || []) if (c.id === tabId && c.minRank) return c.minRank;
    }
    return null;
  }

  const ALL = [ORGANISM, ...RING, ROOT];

  function byId(id) {
    return ALL.find(s => s.id === id) || null;
  }

  // Display label for an id, falling back to the id so a missing entry
  // is visible in the UI rather than rendering as blank.
  function labelOf(id) {
    const s = byId(id);
    return s ? s.label : String(id || '');
  }

  // Map any id — current, retired, or junk from a URL hash — to a tab
  // the portal can render, or null.
  function resolve(id) {
    if (!id) return null;
    const real = LEGACY[id] || id;
    const s = byId(real);
    return s && !s.external ? s.id : null;
  }

  // The ring a given viewer sees. Root joins the ring for keepers.
  function visibleFor(role) {
    const keeper = role === 'admin';
    return { organism: ORGANISM, ring: keeper ? [...RING, ROOT] : RING };
  }

  // Threads are declared on both ends or they are not threads. A
  // relation naming a section that does not exist is a typo, and one
  // declared in only one direction draws a thread from one node and not
  // the other — so both are checked, here and in tests/fairy-ring-verify.cjs.
  function relationProblems() {
    const ids = new Set(ALL.map(s => s.id));
    const problems = [];
    for (const s of ALL) {
      for (const r of s.related || []) {
        if (!ids.has(r)) { problems.push(s.id + ' → ' + r + ' (no such section)'); continue; }
        if (!(byId(r).related || []).includes(s.id)) problems.push(s.id + ' → ' + r + ' is one-way');
      }
    }
    return problems;
  }

  window.PortalSections = {
    ORGANISM, RING, ROOT, ALL, LEGACY,
    byId, labelOf, resolve, visibleFor, relationProblems,
    allows, minRankForTab,
  };
})();
