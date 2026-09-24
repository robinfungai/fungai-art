/* ────────────────────────────────────────────────────────────────
   portal/sections.jsx — portalSections, the one config
   ────────────────────────────────────────────────────────────────
   Every display label in the portal comes from here: the fairy ring,
   the section nav, and the page headings. Renaming happens once.

   Before this file the labels lived in TWO hand-synced arrays —
   TopBar and QuickNav in app-living.jsx — with QuickNav carrying a
   comment asking whoever edits one to remember the other. That is the
   duplication this removes.

   ⚠ `id` IS NOT A LABEL. Ids are load-bearing: app-living.jsx
   switches on them, they are written to localStorage, and QuickNav
   and TopBar both dispatch on them. Rename `label` freely; never
   touch `id`.

   MYTHIC SKIN, RIGOROUS DATA
   Nothing here carries a number. Metrics arrive in Phase 2 from real
   sources, and a section whose metric has no source shows none —
   `metric: null` means the element hides, not that it shows a zero.

   HEALTH, ACTIVITY, FLOW and Pulse are deliberately absent. The
   economy that would drive them is localStorage-only and forgeable
   from the console (docs/COMMUNITY-AUDIT.md §5), so per Robin's
   decision on 2026-09-25 they are hidden rather than faked.
   ──────────────────────────────────────────────────────────────── */
(function () {

  // The centre of the ring. Not a ring node — the ring turns around it.
  const ORGANISM = {
    id:       'network',            // unchanged: app-living switches on this
    label:    'The Organism',
    subtitle: 'the whole body at once',
    line:     'One body, many threads. Everything here is one living thing.',
    metric:   null,                 // no honest health or activity signal yet
  };

  // Ring nodes, in ring order. `related` drives the hyphal threads.
  const RING = [
    {
      id:       'members',
      label:    'Hyphae',
      subtitle: "who's tending",
      line:     'Each hypha brings a different thread to the mycelium.',
      related:  ['academy', 'exp'],
      metric:   { source: 'profiles', label: 'tending' },
      icon:     'hyphae',
    },
    {
      id:       'exp',
      label:    'Fruiting',
      subtitle: 'ceremonies, dinners, activations',
      line:     'What the mycelium pushes up when the season turns.',
      related:  ['calendar', 'shop', 'members'],
      // The one ring node with nothing real behind it: SporeData.EXPERIENCES
      // is a constant and its unlocks live in localStorage. Shows no number.
      metric:   null,
      icon:     'fruiting',
    },
    {
      id:       'calendar',
      label:    'Almanac',
      subtitle: 'seasons, harvests, gatherings',
      line:     'The year read as a body — what wakes, what fruits, what rests.',
      related:  ['exp', 'shop'],
      metric:   { source: 'event_rsvps', label: 'upcoming' },
      icon:     'almanac',
    },
    {
      id:       'shop',
      label:    'Larder',
      subtitle: 'the members shop',
      line:     'What the bench has made, kept for the people who tend it.',
      related:  ['calendar', 'academy', 'exp'],
      metric:   { source: 'product_inventory', label: 'in stock' },
      icon:     'larder',
    },
    {
      id:       'academy',
      label:    'Alchemy',
      subtitle: 'Alchemy Academy',
      line:     'The devotional practice of meeting the plants and yourself is the alchemy.',
      related:  ['members', 'shop'],
      metric:   { source: 'lab_notes', label: 'notes' },
      icon:     'alchemy',
      // The Academy is its own page, not a tab. `href` wins over `id`
      // dispatch wherever a section is opened.
      href:     '/community/academy/',
      external: true,
    },
  ];

  // Root sits UNDER the organism, not on the ring — roots are
  // underground. Rendered only for keepers. Hiding it is courtesy;
  // RLS is the real gate (supabase-rbac-tiers.sql).
  const ROOT = {
    id:         'admin',
    label:      'Root',
    subtitle:   'keepers only',
    line:       'Underground, where the keepers work.',
    related:    ['network'],
    metric:     { source: 'board_cards', label: 'on the board' },
    icon:       'root',
    requiresRole: 'admin',
  };

  // Grower's words for time, replacing complete / in progress / pending.
  const STATUS = {
    pinning:  { label: 'Pinning',  hint: 'coming up' },
    inflush:  { label: 'In flush', hint: 'open now' },
    spored:   { label: 'Spored',   hint: 'past' },
  };

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

  // The ring a given viewer sees. Root is appended for keepers, and
  // never sits in the ring array itself.
  function visibleFor(role) {
    const keeper = role === 'admin';
    return { organism: ORGANISM, ring: RING, root: keeper ? ROOT : null };
  }

  // Threads are declared on both ends or they are not threads. A
  // relation naming a section that does not exist is a typo, and one
  // declared in only one direction draws a thread that appears from
  // one node and not the other — so both are checked, here and in
  // tests/fairy-ring-verify.cjs.
  //
  // ONE EXEMPTION, and it is deliberate: a role-gated section may
  // point at an open one without the open one pointing back. Root →
  // The Organism is the case. Declaring it symmetrically would put
  // `admin` in the config every member downloads, and the ring would
  // have to filter a thread pointing at a node that is not there.
  // Root's single thread is drawn by .fr-root-thread instead, which is
  // rendered only for keepers.
  function relationProblems() {
    const ids = new Set(ALL.map(s => s.id));
    const problems = [];
    for (const s of ALL) {
      for (const r of s.related || []) {
        if (!ids.has(r)) { problems.push(s.id + ' → ' + r + ' (no such section)'); continue; }
        const other = byId(r);
        const gated = !!s.requiresRole && !other.requiresRole;
        if (!gated && !(other.related || []).includes(s.id)) {
          problems.push(s.id + ' → ' + r + ' is one-way');
        }
      }
    }
    return problems;
  }

  window.PortalSections = {
    ORGANISM, RING, ROOT, ALL, STATUS,
    byId, labelOf, visibleFor, relationProblems,
  };
})();
