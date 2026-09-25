/* ────────────────────────────────────────────────────────────────
   portal/dashboard.jsx — the Dashboard ("the board"), the portal home
   ────────────────────────────────────────────────────────────────
   Fungai Art as a whole, under the full-size ring. The centre of the
   ring opens this, because the Organism is "the whole body at once".

   ── FIGURES ──────────────────────────────────────────────────────
   Edited on the Admin page (admin/keeper.jsx → FiguresEditor), stored
   in public.site_figures (supabase-dashboard-admin.sql). A figure with
   a `source` is counted live here; otherwise its value is shown.
   `draft` figures are keepers-only — enforced by RLS, and again here.
   Until that SQL has run, FIGURES below is what the Dashboard shows.

   ANNOUNCEMENTS — public.announcements, posted from the Admin page,
   shown at the top of the Dashboard to every member.
   ──────────────────────────────────────────────────────────────── */
(function () {
  const { useMemo, useState, useEffect } = React;

  // The built-in fallback, and the seed in supabase-dashboard-admin.sql.
  const FIGURES = [
    { id: 'members',   label: 'Hyphae in the network',        source: 'members', note: 'members with a profile' },
    { id: 'herbs',     label: 'Plants in the materia medica', value: 243,        note: 'as of September 2026' },
    { id: 'nodes',     label: 'Network nodes',                source: 'nodes',   note: 'live on the globe' },
    { id: 'ahead',     label: 'Gatherings ahead',             source: 'ahead',   note: 'on the calendar' },
    { id: 'dinners',   label: 'Dinners hosted',               value: 24,  draft: true },
    { id: 'litres',    label: 'Litres extracted',             value: 180, unit: 'L',  draft: true },
    { id: 'foraged',   label: 'Kilos foraged this season',    value: 96,  unit: 'kg', draft: true },
    { id: 'countries', label: 'Countries shipped to',         value: 14,  draft: true },
  ];

  /* ── the board store: figures + announcements, shared with the
        Admin page's editors so a save shows up everywhere at once ── */
  const board = { figures: null, figuresMissing: false, announcements: [], announcementsMissing: false };
  const subs = new Set();
  const emit = () => subs.forEach(fn => fn());
  let started = false;
  const missing = err => !!err && (err.code === '42P01' || err.code === 'PGRST205' || /does not exist|schema cache/i.test(err.message || ''));

  async function loadFigures() {
    try {
      if (window.SBready) await window.SBready;
      if (!window.SBclient) return;
      const { data, error } = await window.SBclient
        .from('site_figures').select('id, label, value, source, unit, note, draft, sort').order('sort');
      board.figuresMissing = missing(error);
      board.figures = error ? null : (data || []);
    } catch (_) { board.figures = null; }
    emit();
  }

  async function loadAnnouncements() {
    try {
      if (window.SBready) await window.SBready;
      if (!window.SBclient) return;
      const { data, error } = await window.SBclient
        .from('announcements').select('id, title, body, created_at, expires_at')
        .order('created_at', { ascending: false }).limit(20);
      board.announcementsMissing = missing(error);
      board.announcements = error ? [] : (data || []);
    } catch (_) { board.announcements = []; }
    emit();
  }

  function useBoard() {
    const [, bump] = useState(0);
    useEffect(() => {
      const fn = () => bump(n => n + 1);
      subs.add(fn);
      if (!started) { started = true; loadFigures(); loadAnnouncements(); }
      return () => { subs.delete(fn); };
    }, []);
    return board;
  }

  window.PortalBoard = { useBoard, loadFigures, loadAnnouncements, FIGURES };

  const ANN_SEEN = 'fa_announcements_seen_at';

  // What the forest offers, month by month — Northern and Central Europe.
  const SEASON = {
    1:  ['Chaga', 'Turkey tail', 'Pine needles'],
    2:  ['Chaga', 'Turkey tail', 'Birch buds'],
    3:  ['Birch sap', 'Nettle tips', 'First wild garlic'],
    4:  ['Wild garlic', 'Nettle', 'Dandelion'],
    5:  ['Spruce tips', 'Woodruff', 'First elderflower'],
    6:  ['Elderflower', 'Linden blossom', 'Meadowsweet'],
    7:  ['Chanterelle', 'Bilberry', "St John's wort"],
    8:  ['Chanterelle', 'Porcini', 'Rowan'],
    9:  ['Chanterelle', 'Elderberry', 'Rosehip', 'Hawthorn'],
    10: ['Hawthorn', 'Sea buckthorn', 'Rosehip', 'Lingonberry'],
    11: ['Sea buckthorn', 'Frost-sweet rosehip', 'Oyster mushroom'],
    12: ['Chaga', 'Oyster mushroom', 'Pine needles'],
  };

  const fmt = n => Number(n).toLocaleString('en-US');

  function Avatar({ m, size = 30 }) {
    const s = { width: size, height: size };
    return m && m.avatar
      ? <img className="db-avatar" src={m.avatar} alt="" style={s} loading="lazy" />
      : <span className="db-avatar" style={s} aria-hidden="true">{((m && m.name) || '?')[0]}</span>;
  }

  function Dashboard({ currentMember, isAdmin, onNavigate }) {
    const SD = window.SporeData || {};
    const R = window.PortalRsvps;
    const rows = R ? R.useRsvps() : [];
    const now = new Date();

    const live = useMemo(() => {
      const members = (SD.MEMBERS || []).filter(m => m.cloudId || m.name);
      const upcoming = (SD.EVENTS || [])
        .filter(e => !e.cancelled && new Date(e.date + 'T23:59:59') >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      return {
        members: members.length,
        nodes: (SD.NETWORK_NODES || []).filter(n => n.activity !== 'proposed').length,
        ahead: upcoming.length,
        upcoming,
        newest: members
          .filter(m => m.createdAt)
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
          .slice(0, 6),
      };
    // MEMBERS and EVENTS are both refilled in place when the cloud
    // lands (loadProfilesFromCloud, portal/events.jsx), so the array
    // identity never changes: key on the length and the events version.
    }, [SD.MEMBERS && SD.MEMBERS.length, SD.EVENTS_VERSION]);

    const b = useBoard();
    const K = window.PortalKeeper;
    const alerts = K ? K.useKeeperAlerts(!!isAdmin) : null;

    // Announcements newer than this member's last visit get a "new" tag;
    // the visit is recorded after the first paint, so the tag shows once.
    const [annSeen] = useState(() => {
      try { return Number(localStorage.getItem(ANN_SEEN)) || 0; } catch (_) { return 0; }
    });
    useEffect(() => {
      if (!b.announcements.length) return;
      try { localStorage.setItem(ANN_SEEN, String(Date.now())); } catch (_) {}
    }, [b.announcements.length]);
    const notices = b.announcements
      .filter(a => !a.expires_at || Date.parse(a.expires_at) > Date.now())
      .slice(0, 3);

    const figures = (b.figures || FIGURES).filter(f => !f.draft || isAdmin).map(f => ({
      ...f,
      shown: f.source ? live[f.source] : f.value,
    })).filter(f => f.shown != null && f.shown !== '');
    const month = now.getMonth() + 1;
    const first = currentMember && currentMember.name ? currentMember.name.split(' ')[0] : null;

    return (
      <div className="page-enter db">
        <div className="section">
          <div className="section-eyebrow">{now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <h2 className="section-title">{first ? <>Welcome back, <em>{first}.</em></> : <>The <em>organism.</em></>}</h2>
          <p className="section-blurb">Fungai Art in one view — what the network holds, what the season offers, and what is coming up.</p>
        </div>

        {alerts && alerts.count ? (
          <button type="button" className="db-alerts" onClick={() => onNavigate && onNavigate('admin')}>
            <span className="db-alerts-dot" aria-hidden="true" />
            {[
              alerts.newOrders.length ? alerts.newOrders.length + ' new order' + (alerts.newOrders.length === 1 ? '' : 's') : null,
              alerts.lowStock.length ? alerts.lowStock.length + ' low on stock' : null,
            ].filter(Boolean).join(' · ')}
            <span className="db-alerts-go">Root →</span>
          </button>
        ) : null}

        {notices.length ? (
          <div className="db-notices" aria-label="Announcements">
            {notices.map(a => (
              <article key={a.id} className="db-notice">
                <p className="db-kicker">
                  Announcement · {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  {Date.parse(a.created_at) > annSeen ? <span className="db-new">new</span> : null}
                </p>
                <h3 className="db-notice-title">{a.title}</h3>
                {a.body ? <p className="db-notice-body">{a.body}</p> : null}
              </article>
            ))}
          </div>
        ) : null}

        <div className="db-figures">
          {figures.map(f => (
            <div key={f.id} className={'db-fig' + (f.draft ? ' is-draft' : '')}>
              {f.draft ? <span className="db-draft" title="Only keepers see drafts. Publish it on the Admin page.">draft</span> : null}
              <div className="db-fig-val">{fmt(f.shown)}{f.unit ? <span className="db-fig-unit">{f.unit}</span> : null}</div>
              <div className="db-fig-label">{f.label}</div>
              {f.note ? <div className="db-fig-note">{f.note}</div> : null}
            </div>
          ))}
        </div>

        <div className="db-grid">
          <section className="db-panel">
            <p className="db-kicker">The season · {now.toLocaleString('en-GB', { month: 'long' })}</p>
            <h3 className="db-title">In the forest now</h3>
            <ul className="db-season">
              {(SEASON[month] || []).map(s => <li key={s}><span className="db-dot" aria-hidden="true" />{s}</li>)}
            </ul>
            <a className="db-link" href="/foraging" target="_blank" rel="noopener">Open the foraging map ↗</a>
          </section>

          <section className="db-panel">
            <p className="db-kicker">Coming up</p>
            <h3 className="db-title">Next gatherings</h3>
            {live.upcoming.length ? (
              <ul className="db-events">
                {live.upcoming.slice(0, 3).map(ev => {
                  const coming = R ? R.attendeesFor(rows, ev.id, 'yes').length : 0;
                  return (
                    <li key={ev.id}>
                      <button type="button" className="db-event" onClick={() => onNavigate && onNavigate('calendar')}>
                        <span className="db-event-date">
                          {new Date(ev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="db-event-body">
                          <span className="db-event-title">{ev.title}</span>
                          <span className="db-event-sub">{ev.subtitle}</span>
                        </span>
                        <span className="db-event-count">{coming ? coming + ' coming' : ''}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="db-empty">Nothing on the calendar yet.</p>}
          </section>

          <section className="db-panel">
            <p className="db-kicker">New in the network</p>
            <h3 className="db-title">Newest hyphae</h3>
            {live.newest.length ? (
              <ul className="db-people">
                {live.newest.map(m => (
                  <li key={m.id}>
                    <button type="button" className="db-person" onClick={() => onNavigate && onNavigate('members')}>
                      <Avatar m={m} />
                      <span className="db-person-name">{m.name}</span>
                      <span className="db-person-when">
                        {new Date(m.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="db-empty">Profiles are still loading.</p>}
          </section>
        </div>

        {isAdmin ? (
          <p className="db-keeper-note">
            Keepers only: figures tagged <b>draft</b> are hidden from members. Edit or publish them,
            and post announcements, on the Admin page (Root).
          </p>
        ) : null}
      </div>
    );
  }

  window.PortalDashboard = Dashboard;
})();
