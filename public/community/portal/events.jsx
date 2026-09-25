/* ────────────────────────────────────────────────────────────────
   portal/events.jsx — the calendar's events, from public.events
   ────────────────────────────────────────────────────────────────
   Events used to be hardcoded in spore/data.jsx. They now live in
   public.events (supabase-events.sql), written by the Event manager on
   the Admin page. This file loads them and swaps them INTO
   SporeData.EVENTS in place — the same trick loadProfilesFromCloud
   plays on MEMBERS — so the Calendar, the Dashboard and the earn sheet
   all follow without each learning a new source. It then fires
   'spore:events-changed' so App rerenders.

   If the table is missing (SQL not run yet) or the member is signed
   out, nothing is swapped and data.jsx's list stays as it was.
   ──────────────────────────────────────────────────────────────── */
(function () {
  const COLS = 'id, title, subtitle, date, time, node, freq, color, capacity, description, url, contributions, cancelled';
  let status = 'local';          // local · cloud · missing · error
  let version = 0;
  const missing = err => !!err && (err.code === '42P01' || err.code === 'PGRST205' || /does not exist|schema cache/i.test(err.message || ''));

  // A table row → the shape the portal has always used (desc, not description).
  function toEvent(r) {
    return {
      id:        r.id,
      title:     r.title,
      subtitle:  r.subtitle || '',
      date:      r.date,
      time:      r.time || '',
      node:      r.node || 'berlin',
      freq:      r.freq || '111 Hz',
      color:     r.color || null,
      capacity:  r.capacity == null ? 0 : r.capacity,
      desc:      r.description || '',
      url:       r.url || null,
      contributions: Array.isArray(r.contributions) ? r.contributions : [],
      cancelled: !!r.cancelled,
    };
  }

  // …and back, for the Event manager's writes.
  function toRow(ev) {
    return {
      id:          ev.id,
      title:       String(ev.title || '').trim(),
      subtitle:    String(ev.subtitle || '').trim() || null,
      date:        ev.date,
      time:        ev.time || null,
      node:        ev.node || null,
      freq:        ev.freq || null,
      color:       ev.color || null,
      capacity:    ev.capacity === '' || ev.capacity == null ? null : Number(ev.capacity),
      description: String(ev.desc || '').trim() || null,
      url:         String(ev.url || '').trim() || null,
      contributions: Array.isArray(ev.contributions) ? ev.contributions : [],
      cancelled:   !!ev.cancelled,
    };
  }

  async function load() {
    try {
      if (window.SBready) await window.SBready;
      if (!window.SBclient || !window.SporeData) return status;
      const { data, error } = await window.SBclient.from('events').select(COLS).order('date');
      if (error) {
        status = missing(error) ? 'missing' : 'error';
        window.dispatchEvent(new Event('spore:events-changed'));
        return status;
      }
      const list = window.SporeData.EVENTS;
      list.length = 0;
      (data || []).forEach(r => list.push(toEvent(r)));
      status = 'cloud';
      window.SporeData.EVENTS_VERSION = ++version;
      window.dispatchEvent(new Event('spore:events-changed'));
    } catch (_) {
      status = 'error';
    }
    return status;
  }

  window.PortalEvents = { load, toEvent, toRow, status: () => status };
})();
