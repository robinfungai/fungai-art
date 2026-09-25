/* ────────────────────────────────────────────────────────────────
   admin/keeper.jsx — the keepers' tools on the Admin (Root) page
   ────────────────────────────────────────────────────────────────
   KeeperAlerts        new orders to ship + low / sold-out stock
   AnnouncementsEditor post a notice every member sees on the Dashboard
   FiguresEditor       edit the Dashboard's numbers
   EventsEditor        the Event manager: add, edit, cancel, guest lists
   RankSelect          set a member's rank, which sets their tier
   useKeeperAlerts     the alert counts, shared with the ring's Root
                       badge and the Dashboard strip

   Every write here is also gated by RLS — fa_is_admin() on
   site_figures / announcements (supabase-dashboard-admin.sql), is_admin
   on orders and product_inventory, and the rank guard on profiles
   (supabase-rbac-tiers.sql). Hiding the tools from members is courtesy;
   the database is the gate.
   ──────────────────────────────────────────────────────────────── */
(function () {
  const { useState, useEffect } = React;

  const LOW_STOCK = 3;                          // at or below: flag it
  const SEEN_KEY  = 'fa_orders_seen_at';        // per keeper, per browser
  const POLL_MS   = 60000;

  const sb = () => window.SBclient;
  const eur = n => '€' + Number(n || 0).toFixed(2).replace(/\.00$/, '');
  const missingTable = err => !!err && (err.code === '42P01' || err.code === 'PGRST205' || /does not exist|schema cache/i.test(err.message || ''));

  function ago(iso) {
    const R = window.PortalRsvps;
    return R ? R.ago(iso) : new Date(iso).toLocaleString('en-GB');
  }

  /* ── alerts: one store, one poll, many readers ───────────────── */
  const alerts = { ready: false, lowStock: [], toShip: [], newOrders: [], stockError: null, ordersError: null };
  const subs = new Set();
  const emit = () => subs.forEach(fn => fn());
  let timer = null, users = 0;

  function seenAt() {
    try {
      const v = Number(localStorage.getItem(SEEN_KEY));
      if (v) return v;
    } catch (_) {}
    return Date.now() - 7 * 86400000;           // first visit: the last week counts as new
  }

  async function refreshAlerts() {
    try {
      if (window.SBready) await window.SBready;
      if (!sb()) return;
      const [inv, ord] = await Promise.all([
        sb().from('product_inventory').select('product_id, stock_count').lte('stock_count', LOW_STOCK).order('stock_count'),
        sb().from('orders')
          .select('id, created_at, customer_name, item_count, total_eur, status, items')
          .eq('status', 'paid')
          .order('created_at', { ascending: false })
          .limit(25),
      ]);
      alerts.lowStock    = inv.error ? [] : (inv.data || []);
      alerts.stockError  = inv.error ? inv.error.message : null;
      alerts.toShip      = ord.error ? [] : (ord.data || []);
      alerts.ordersError = ord.error ? ord.error.message : null;
      const seen = seenAt();
      alerts.newOrders = alerts.toShip.filter(o => Date.parse(o.created_at) > seen);
      alerts.ready = true;
    } catch (e) {
      alerts.ordersError = (e && e.message) || String(e);
    }
    emit();
  }

  function markOrdersSeen() {
    try { localStorage.setItem(SEEN_KEY, String(Date.now())); } catch (_) {}
    alerts.newOrders = [];
    emit();
  }

  // Counts for badges. Polls only while at least one keeper view is mounted.
  function useKeeperAlerts(enabled) {
    const [, bump] = useState(0);
    useEffect(() => {
      if (!enabled) return;
      const fn = () => bump(n => n + 1);
      subs.add(fn);
      users++;
      if (!timer) {
        refreshAlerts();
        timer = setInterval(refreshAlerts, POLL_MS);
        window.addEventListener('focus', refreshAlerts);
      }
      return () => {
        subs.delete(fn);
        users--;
        if (!users && timer) {
          clearInterval(timer); timer = null;
          window.removeEventListener('focus', refreshAlerts);
        }
      };
    }, [enabled]);
    return {
      ...alerts,
      count: alerts.newOrders.length + alerts.lowStock.length,
      refresh: refreshAlerts,
      markOrdersSeen,
    };
  }

  function itemsLine(items) {
    const list = Array.isArray(items) ? items : [];
    const s = list.map(i => (i.qty || 1) + '× ' + (i.name || 'item')).join(', ');
    return s.length > 90 ? s.slice(0, 88) + '…' : s;
  }

  /* ── KeeperAlerts ─────────────────────────────────────────────── */
  function KeeperAlerts() {
    const a = useKeeperAlerts(true);
    const newIds = new Set(a.newOrders.map(o => o.id));
    return (
      <div className="kp-panel">
        <div className="kp-head">
          <div>
            <p className="kp-kicker">Keeper alerts</p>
            <h3 className="kp-title">Orders &amp; stock</h3>
          </div>
          <button type="button" className="kp-ghost" onClick={a.refresh}>Refresh</button>
        </div>

        <div className="kp-cols">
          <section>
            <p className="kp-label">
              To ship · {a.toShip.length}
              {a.newOrders.length ? <span className="kp-new">{a.newOrders.length} new</span> : null}
            </p>
            {a.ordersError ? (
              <p className="kp-muted">{missingTable({ message: a.ordersError }) ? 'The orders table is not set up (supabase-orders.sql).' : 'Orders could not load: ' + a.ordersError}</p>
            ) : !a.ready ? (
              <p className="kp-muted">Loading…</p>
            ) : !a.toShip.length ? (
              <p className="kp-muted">Nothing waiting to ship.</p>
            ) : (
              <ul className="kp-list">
                {a.toShip.slice(0, 8).map(o => (
                  <li key={o.id} className={newIds.has(o.id) ? 'is-new' : ''}>
                    <div className="kp-row-top">
                      <span className="kp-name">{o.customer_name || 'Customer'}</span>
                      <span className="kp-amount">{eur(o.total_eur)}</span>
                    </div>
                    <div className="kp-row-sub">{itemsLine(o.items)} · {ago(o.created_at)}</div>
                  </li>
                ))}
              </ul>
            )}
            {a.newOrders.length ? (
              <button type="button" className="kp-ghost" onClick={a.markOrdersSeen}>Mark new orders as seen</button>
            ) : null}
          </section>

          <section>
            <p className="kp-label">Low stock · {a.lowStock.length}</p>
            {a.stockError ? (
              <p className="kp-muted">Stock could not load: {a.stockError}</p>
            ) : !a.ready ? (
              <p className="kp-muted">Loading…</p>
            ) : !a.lowStock.length ? (
              <p className="kp-muted">Everything has more than {LOW_STOCK} in stock.</p>
            ) : (
              <ul className="kp-list">
                {a.lowStock.map(p => (
                  <li key={p.product_id} className={p.stock_count === 0 ? 'is-out' : ''}>
                    <div className="kp-row-top">
                      <span className="kp-name">{p.product_id}</span>
                      <span className="kp-amount">{p.stock_count === 0 ? 'sold out' : p.stock_count + ' left'}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="kp-muted">Restock in “Product stock” further down this page.</p>
          </section>
        </div>
      </div>
    );
  }

  /* ── AnnouncementsEditor ──────────────────────────────────────── */
  const EXPIRY = { never: null, week: 7, month: 30 };

  function AnnouncementsEditor({ onToast }) {
    const PB = window.PortalBoard;
    const board = PB ? PB.useBoard() : { announcements: [] };
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [expiry, setExpiry] = useState('month');
    const [busy, setBusy] = useState(false);
    const toast = (m) => onToast && onToast(m);

    async function post(e) {
      e.preventDefault();
      if (!title.trim() || busy) return;
      setBusy(true);
      const days = EXPIRY[expiry];
      const { error } = await sb().from('announcements').insert({
        title: title.trim(),
        body: body.trim(),
        expires_at: days ? new Date(Date.now() + days * 86400000).toISOString() : null,
      });
      setBusy(false);
      if (error) { toast(missingTable(error) ? 'Run supabase-dashboard-admin.sql first' : 'Could not post: ' + error.message); return; }
      setTitle(''); setBody('');
      toast('✦ Announcement posted to every member');
      if (PB) PB.loadAnnouncements();
    }

    async function remove(a) {
      if (!confirm('Remove “' + a.title + '” for everyone?')) return;
      const { error } = await sb().from('announcements').delete().eq('id', a.id);
      if (error) { toast('Could not remove: ' + error.message); return; }
      if (PB) PB.loadAnnouncements();
    }

    const list = board.announcements || [];
    return (
      <div className="kp-panel">
        <div className="kp-head">
          <div>
            <p className="kp-kicker">To everyone</p>
            <h3 className="kp-title">Announcements</h3>
          </div>
        </div>
        <p className="kp-muted">Shown at the top of every member's Dashboard. Not encrypted — it is for everyone. Private messages go through DMs, which are.</p>
        {board.announcementsMissing ? (
          <p className="kp-warn">The announcements table is not set up yet — run <code>supabase-dashboard-admin.sql</code>.</p>
        ) : null}
        <form className="kp-form" onSubmit={post}>
          <input className="kp-input" value={title} onChange={e => setTitle(e.target.value)} maxLength={120} placeholder="Title — e.g. Fungi Fever Fest tickets are open" aria-label="Announcement title" />
          <textarea className="kp-input" value={body} onChange={e => setBody(e.target.value)} maxLength={2000} rows={3} placeholder="A few lines for everyone (optional)" aria-label="Announcement text" />
          <div className="kp-form-row">
            <label className="kp-muted">
              Shows for{' '}
              <select className="kp-select" value={expiry} onChange={e => setExpiry(e.target.value)}>
                <option value="week">a week</option>
                <option value="month">a month</option>
                <option value="never">until removed</option>
              </select>
            </label>
            <button type="submit" className="kp-primary" disabled={busy || !title.trim()}>{busy ? 'Posting…' : 'Post to everyone'}</button>
          </div>
        </form>
        {list.length ? (
          <ul className="kp-list">
            {list.map(a => {
              const expired = a.expires_at && Date.parse(a.expires_at) < Date.now();
              return (
                <li key={a.id} className={expired ? 'is-out' : ''}>
                  <div className="kp-row-top">
                    <span className="kp-name">{a.title}</span>
                    <button type="button" className="kp-link" onClick={() => remove(a)}>Remove</button>
                  </div>
                  <div className="kp-row-sub">
                    {ago(a.created_at)}{a.expires_at ? (expired ? ' · expired' : ' · until ' + new Date(a.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })) : ''}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    );
  }

  /* ── FiguresEditor ────────────────────────────────────────────── */
  function slug(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'figure';
  }

  function FigureRow({ f, onSaved, onToast }) {
    const [row, setRow] = useState(f);
    const [busy, setBusy] = useState(false);
    useEffect(() => { setRow(f); }, [f]);
    const dirty = JSON.stringify(row) !== JSON.stringify(f);
    const set = (k, v) => setRow(r => ({ ...r, [k]: v }));

    async function save() {
      setBusy(true);
      const { error } = await sb().from('site_figures').upsert({
        id: row.id, label: row.label.trim(), unit: row.unit || null, note: row.note || null,
        value: row.source ? null : (row.value === '' || row.value == null ? null : Number(row.value)),
        source: row.source || null, draft: !!row.draft, sort: Number(row.sort) || 100,
        updated_at: new Date().toISOString(),
      });
      setBusy(false);
      if (error) { onToast && onToast('Could not save: ' + error.message); return; }
      onToast && onToast('Saved “' + row.label + '”');
      onSaved();
    }
    async function remove() {
      if (!confirm('Delete “' + f.label + '” from the Dashboard?')) return;
      const { error } = await sb().from('site_figures').delete().eq('id', f.id);
      if (error) { onToast && onToast('Could not delete: ' + error.message); return; }
      onSaved();
    }

    return (
      <li className={'kp-fig' + (row.draft ? ' is-draft' : '')}>
        <input className="kp-input kp-fig-label" value={row.label} maxLength={80} onChange={e => set('label', e.target.value)} aria-label="Label" />
        {row.source ? (
          <span className="kp-live" title="Computed live by the portal">live · {row.source}</span>
        ) : (
          <input className="kp-input kp-fig-value" type="number" value={row.value == null ? '' : row.value} onChange={e => set('value', e.target.value)} aria-label="Value" />
        )}
        <input className="kp-input kp-fig-unit" value={row.unit || ''} maxLength={8} placeholder="unit" onChange={e => set('unit', e.target.value)} aria-label="Unit" />
        <input className="kp-input kp-fig-note" value={row.note || ''} maxLength={80} placeholder="small note" onChange={e => set('note', e.target.value)} aria-label="Note" />
        <label className="kp-check" title="Published figures are seen by every member; drafts only by keepers">
          <input type="checkbox" checked={!row.draft} onChange={e => set('draft', !e.target.checked)} /> published
        </label>
        <span className="kp-fig-actions">
          <button type="button" className="kp-primary" disabled={!dirty || busy || !row.label.trim()} onClick={save}>{busy ? '…' : 'Save'}</button>
          <button type="button" className="kp-link" onClick={remove}>Delete</button>
        </span>
      </li>
    );
  }

  function FiguresEditor({ onToast }) {
    const PB = window.PortalBoard;
    const board = PB ? PB.useBoard() : { figures: null };
    const [label, setLabel] = useState('');
    const reload = () => { if (PB) PB.loadFigures(); };

    async function add(e) {
      e.preventDefault();
      if (!label.trim()) return;
      const rows = board.figures || [];
      const { error } = await sb().from('site_figures').insert({
        id: slug(label) + (rows.some(r => r.id === slug(label)) ? '-' + Date.now().toString(36) : ''),
        label: label.trim(), value: 0, draft: true,
        sort: (rows.reduce((m, r) => Math.max(m, r.sort || 0), 0) || 0) + 10,
      });
      if (error) { onToast && onToast('Could not add: ' + error.message); return; }
      setLabel('');
      reload();
    }

    return (
      <div className="kp-panel">
        <div className="kp-head">
          <div>
            <p className="kp-kicker">The Dashboard</p>
            <h3 className="kp-title">Figures</h3>
          </div>
        </div>
        <p className="kp-muted">What members see under the ring. Untick “published” to keep a figure as a keepers-only draft. “Live” figures are counted by the portal itself.</p>
        {board.figuresMissing ? (
          <p className="kp-warn">The figures table is not set up yet — run <code>supabase-dashboard-admin.sql</code>. Until then the Dashboard shows its built-in numbers.</p>
        ) : !board.figures ? (
          <p className="kp-muted">Loading…</p>
        ) : (
          <>
            <ul className="kp-figs">
              {board.figures.map(f => <FigureRow key={f.id} f={f} onSaved={reload} onToast={onToast} />)}
            </ul>
            <form className="kp-form-row" onSubmit={add}>
              <input className="kp-input" value={label} onChange={e => setLabel(e.target.value)} maxLength={80} placeholder="New figure — e.g. Workshops run" aria-label="New figure label" />
              <button type="submit" className="kp-primary" disabled={!label.trim()}>Add</button>
            </form>
          </>
        )}
      </div>
    );
  }

  /* ── EventsEditor · the Event manager ─────────────────────────────
     Writes public.events (supabase-events.sql). portal/events.jsx then
     swaps the saved list into SporeData.EVENTS, so the Calendar, the
     Dashboard and the earn sheet all show the change at once.
     An event's id is what its RSVPs point at, so an id is never
     edited — rename the title freely. "Volunteer & earn" roles are kept
     as they are on edit; new events start with none. */
  const BLANK_EVENT = {
    id: null, title: '', subtitle: '', date: '', time: '18:00', node: 'berlin',
    freq: '111 Hz', capacity: 20, desc: '', url: '', contributions: [], cancelled: false,
  };

  function eventId(title, date) {
    const base = slug(title).slice(0, 60).replace(/-+$/, '') || 'event';
    return base + '-' + String(date || '').replace(/-/g, '').slice(2);   // …-261011
  }

  function EventForm({ initial, freqColors, onDone, onToast }) {
    const [ev, setEv] = useState(initial);
    const [busy, setBusy] = useState(false);
    const set = (k, v) => setEv(e => ({ ...e, [k]: v }));
    const isNew = !initial.id;
    const nodes = ((window.SporeData && window.SporeData.NETWORK_NODES) || []).filter(n => n.activity !== 'proposed');
    const freqs = Object.keys(freqColors || {});
    const urlOk = !String(ev.url || '').trim() || /^(\/|https:\/\/)/.test(String(ev.url).trim());
    const ready = ev.title.trim() && ev.date && urlOk && !busy;

    async function save(e) {
      e.preventDefault();
      if (!ready) return;
      setBusy(true);
      const PE = window.PortalEvents;
      const row = PE.toRow({
        ...ev,
        id: isNew ? eventId(ev.title, ev.date) : initial.id,
        color: (freqColors || {})[ev.freq] || ev.color || null,
      });
      const { error } = isNew
        ? await sb().from('events').insert(row)
        : await sb().from('events').update(row).eq('id', initial.id);
      setBusy(false);
      if (error) {
        onToast && onToast(
          missingTable(error) ? 'Run supabase-events.sql first'
          : error.code === '23505' ? 'There is already an event with that title on that date'
          : 'Could not save: ' + error.message);
        return;
      }
      onToast && onToast(isNew ? '✦ Added to the calendar' : 'Event saved');
      await PE.load();
      onDone();
    }

    return (
      <form className="kp-event-form" onSubmit={save}>
        <p className="kp-label">{isNew ? 'New event' : 'Edit · ' + initial.title}</p>
        <input className="kp-input" value={ev.title} onChange={e => set('title', e.target.value)} maxLength={120} placeholder="Title — e.g. Autumn Foraging Walk" aria-label="Title" required />
        <input className="kp-input" value={ev.subtitle} onChange={e => set('subtitle', e.target.value)} maxLength={160} placeholder="Place — e.g. Grunewald · Berlin" aria-label="Place" />
        <div className="kp-grid3">
          <label className="kp-field"><span>Date</span><input className="kp-input" type="date" value={ev.date} onChange={e => set('date', e.target.value)} required /></label>
          <label className="kp-field"><span>Time</span><input className="kp-input" type="time" value={ev.time} onChange={e => set('time', e.target.value)} /></label>
          <label className="kp-field"><span>Capacity</span><input className="kp-input" type="number" min="0" max="100000" value={ev.capacity == null ? '' : ev.capacity} onChange={e => set('capacity', e.target.value)} /></label>
        </div>
        <div className="kp-grid3">
          <label className="kp-field"><span>Node</span>
            <select className="kp-select" value={ev.node} onChange={e => set('node', e.target.value)}>
              {nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </label>
          <label className="kp-field"><span>Frequency</span>
            <select className="kp-select" value={ev.freq} onChange={e => set('freq', e.target.value)}>
              {(freqs.length ? freqs : [ev.freq]).map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
          <label className="kp-field"><span>Event page</span>
            <input className="kp-input" value={ev.url || ''} onChange={e => set('url', e.target.value)} placeholder="/fungi-fever-fest/" aria-invalid={!urlOk} />
          </label>
        </div>
        {!urlOk ? <p className="kp-warn">A link must start with / (a page on this site) or https://.</p> : null}
        <textarea className="kp-input" value={ev.desc} onChange={e => set('desc', e.target.value)} maxLength={4000} rows={4} placeholder="What happens, what to bring, the price" aria-label="Description" />
        <label className="kp-check"><input type="checkbox" checked={!!ev.cancelled} onChange={e => set('cancelled', e.target.checked)} /> Cancelled — stays on the calendar, marked, with RSVPs closed</label>
        <div className="kp-form-row">
          <button type="button" className="kp-ghost" onClick={onDone}>Close</button>
          <button type="submit" className="kp-primary" disabled={!ready}>{busy ? 'Saving…' : isNew ? 'Add to calendar' : 'Save event'}</button>
        </div>
      </form>
    );
  }

  function EventsEditor({ onToast, freqColors }) {
    const R  = window.PortalRsvps;
    const PE = window.PortalEvents;
    const rsvps = R ? R.useRsvps() : [];
    const [, bump] = useState(0);
    const [editing, setEditing]     = useState(null);   // an event, or BLANK_EVENT for a new one
    const [guestsFor, setGuestsFor] = useState(null);
    const [showPast, setShowPast]   = useState(false);

    useEffect(() => {
      const on = () => bump(n => n + 1);
      window.addEventListener('spore:events-changed', on);
      if (PE && PE.status() === 'local') PE.load();
      return () => window.removeEventListener('spore:events-changed', on);
    }, []);

    const status = PE ? PE.status() : 'missing';
    const canEdit = status === 'cloud';
    const today = new Date().toISOString().slice(0, 10);
    const all = ((window.SporeData && window.SporeData.EVENTS) || []).slice().sort((a, b) => (a.date < b.date ? -1 : 1));
    const upcoming = all.filter(e => e.date >= today);
    const past = all.filter(e => e.date < today).reverse();

    async function remove(ev) {
      if (!confirm('Delete “' + ev.title + '” for good? To call it off, mark it cancelled instead — members keep seeing it, and why.')) return;
      const { error } = await sb().from('events').delete().eq('id', ev.id);
      if (error) { onToast && onToast('Could not delete: ' + error.message); return; }
      await PE.load();
    }

    function copyGuests(ev, guests) {
      const text = ev.title + ' · ' + ev.date + '\n' + guests.map(g => g.name + (g.status === 'maybe' ? ' (maybe)' : '')).join('\n');
      try {
        navigator.clipboard.writeText(text).then(() => onToast && onToast('Guest list copied'), () => onToast && onToast('Could not copy'));
      } catch (_) { onToast && onToast('Could not copy'); }
    }

    function row(ev) {
      const going = R ? R.attendeesFor(rsvps, ev.id, 'yes') : [];
      const guests = R ? R.attendeesFor(rsvps, ev.id) : [];
      const open = guestsFor === ev.id;
      return (
        <li key={ev.id} className={ev.cancelled ? 'is-out' : ''}>
          <div className="kp-row-top">
            <span className="kp-name">
              {new Date(ev.date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · {ev.title}
              {ev.cancelled ? <span className="kp-cancelled">cancelled</span> : null}
            </span>
            <span className="kp-amount">{going.length}{ev.capacity ? ' / ' + ev.capacity : ''} coming</span>
          </div>
          <div className="kp-row-sub">{ev.subtitle}</div>
          <div className="kp-row-actions">
            <button type="button" className="kp-link" onClick={() => setGuestsFor(open ? null : ev.id)}>{open ? 'Hide guests' : 'Guests (' + guests.length + ')'}</button>
            {canEdit ? <button type="button" className="kp-link" onClick={() => setEditing(ev)}>Edit</button> : null}
            {canEdit ? <button type="button" className="kp-link" onClick={() => remove(ev)}>Delete</button> : null}
          </div>
          {open ? (
            guests.length ? (
              <div className="kp-guests">
                <ul>
                  {guests.map(g => (
                    <li key={g.uid}>{g.name} <span className="kp-muted">{g.status === 'yes' ? 'coming' : 'maybe'} · {ago(g.at)}</span></li>
                  ))}
                </ul>
                <button type="button" className="kp-ghost" onClick={() => copyGuests(ev, guests)}>Copy guest list</button>
              </div>
            ) : <p className="kp-muted">No RSVPs yet.</p>
          ) : null}
        </li>
      );
    }

    return (
      <div className="kp-panel">
        <div className="kp-head">
          <div>
            <p className="kp-kicker">The calendar</p>
            <h3 className="kp-title">Event manager</h3>
          </div>
          {canEdit && !editing ? <button type="button" className="kp-primary" onClick={() => setEditing(BLANK_EVENT)}>+ New event</button> : null}
        </div>
        {status === 'missing' ? (
          <p className="kp-warn">The events table is not set up yet — run <code>supabase-events.sql</code>. Until then the calendar shows the built-in list and edits cannot be saved.</p>
        ) : status === 'local' ? (
          <p className="kp-muted">Loading events…</p>
        ) : status === 'error' ? (
          <p className="kp-warn">Events could not load from the database.</p>
        ) : null}

        {editing ? (
          <EventForm key={editing.id || 'new'} initial={editing} freqColors={freqColors} onToast={onToast} onDone={() => setEditing(null)} />
        ) : null}

        <p className="kp-label">Coming up · {upcoming.length}</p>
        {upcoming.length ? <ul className="kp-list">{upcoming.map(row)}</ul> : <p className="kp-muted">Nothing coming up. Add an event.</p>}
        {past.length ? (
          <>
            <button type="button" className="kp-ghost" onClick={() => setShowPast(s => !s)}>{showPast ? 'Hide past events' : 'Show past events (' + past.length + ')'}</button>
            {showPast ? <ul className="kp-list" style={{ marginTop: 8 }}>{past.map(row)}</ul> : null}
          </>
        ) : null}
      </div>
    );
  }

  /* ── RankSelect ───────────────────────────────────────────────── */
  // Rank = profiles.rank (RANKS in spore/data.jsx): everyone starts
  // Palawan; Patron, Facilitator and Alchemist are confirmed here by a
  // keeper; Founder is Robin's alone, so it is shown but not offered.
  // The database sets the member's access tier from it
  // (supabase-rbac-tiers.sql §3b) and refuses the change from anyone
  // who is not a keeper.
  function RankSelect({ m, onToast }) {
    const SD = window.SporeData || {};
    const ranks = SD.RANKS || [];
    const current = SD.rankOf ? SD.rankOf(m) : null;
    const [busy, setBusy] = useState(false);
    if (!m.cloudId || !ranks.length || !current) return null;
    const offered = ranks.filter(r => r.id !== 'founder' || current.id === 'founder');

    async function change(e) {
      const r = ranks.find(x => x.id === e.target.value);
      if (!r || busy || r.id === current.id) return;
      setBusy(true);
      try {
        await window.SBprofiles.adminUpdate(m.cloudId, { rank: r.id });
        m.rank = r.id;                          // the shared MEMBERS entry, so every view agrees
        m.claimedRole = null;
        window.dispatchEvent(new Event('spore:members-changed'));
        onToast && onToast(m.name + ' is now ' + r.label);
      } catch (err) {
        const msg = (err && err.message) || String(err);
        onToast && onToast(/rank/.test(msg) && /column/.test(msg)
          ? 'Run supabase-rbac-tiers.sql first — it adds the rank column'
          : 'Rank not changed: ' + msg);
      } finally {
        setBusy(false);
      }
    }

    return (
      <label className="kp-rank" title="Rank sets what this member can open. Only keepers can change it.">
        <span>Rank</span>
        <select className="kp-select" value={current.id} onChange={change} disabled={busy || current.id === 'founder'}>
          {offered.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        {m.claimedRole ? <span className="kp-claim" title="What they chose for themselves in the profile editor">asked for {m.claimedRole}</span> : null}
      </label>
    );
  }

  window.PortalKeeper = { KeeperAlerts, AnnouncementsEditor, FiguresEditor, EventsEditor, RankSelect, useKeeperAlerts };
})();
