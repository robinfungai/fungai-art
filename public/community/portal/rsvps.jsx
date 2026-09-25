/* ────────────────────────────────────────────────────────────────
   portal/rsvps.jsx — who is coming, shared by Calendar and Dashboard
   ────────────────────────────────────────────────────────────────
   Backed by public.event_rsvps (supabase-event-rsvps.sql — the table
   exists as of 2026-09-25). Signed-in members can read every row,
   which is the point: everyone sees who is coming. Each member can
   write only their own row; RLS enforces that, not this file.

   One module-level cache so the Calendar and the Dashboard never
   disagree and never fetch twice.
   ──────────────────────────────────────────────────────────────── */
(function () {
  const { useState, useEffect } = React;

  let cache = null;          // [{ event_id, auth_user_id, status, updated_at }]
  let inflight = null;
  const listeners = new Set();
  const emit = () => listeners.forEach(fn => fn(cache));

  async function load(force) {
    if (inflight && !force) return inflight;
    inflight = (async () => {
      try {
        if (window.SBready) await window.SBready;
        if (!window.SBclient) return cache;
        const { data, error } = await window.SBclient
          .from('event_rsvps')
          .select('event_id, auth_user_id, status, updated_at')
          .order('updated_at', { ascending: false })
          .limit(2000);
        if (!error && Array.isArray(data)) { cache = data; emit(); }
      } catch (_) { /* offline, or signed out: the log just stays empty */ }
      return cache;
    })();
    return inflight;
  }

  async function myUid() {
    try {
      if (window.SBready) await window.SBready;
      const u = window.SBauth ? await window.SBauth.getUser() : null;
      return (u && u.id) || null;
    } catch (_) { return null; }
  }

  // All rows, live. Rerenders whenever anyone in this tab changes one.
  function useRsvps() {
    const [rows, setRows] = useState(cache || []);
    useEffect(() => {
      const fn = (r) => setRows(r ? r.slice() : []);
      listeners.add(fn);
      load(false);
      return () => { listeners.delete(fn); };
    }, []);
    return rows;
  }

  // Set (or with status=null, clear) the signed-in member's RSVP.
  // Optimistic, and rolled back if the write fails.
  async function setRsvp(eventId, status) {
    const uid = await myUid();
    if (!uid || !window.SBclient) return { ok: false, reason: 'no-session' };
    const before = (cache || []).slice();
    const now = new Date().toISOString();
    cache = before.filter(r => !(r.event_id === eventId && r.auth_user_id === uid));
    if (status) cache.unshift({ event_id: eventId, auth_user_id: uid, status, updated_at: now });
    emit();
    try {
      const q = status
        ? window.SBclient.from('event_rsvps').upsert(
            { event_id: eventId, auth_user_id: uid, status, updated_at: now },
            { onConflict: 'event_id,auth_user_id' })
        : window.SBclient.from('event_rsvps').delete().eq('event_id', eventId).eq('auth_user_id', uid);
      const { error } = await q;
      if (error) throw error;
      return { ok: true };
    } catch (e) {
      cache = before; emit();
      return { ok: false, reason: (e && e.message) || 'failed' };
    }
  }

  // One event's RSVPs resolved to members, newest first.
  function attendeesFor(rows, eventId, status) {
    const members = (window.SporeData && window.SporeData.MEMBERS) || [];
    return rows
      .filter(r => r.event_id === eventId && (!status || r.status === status))
      .map(r => {
        const m = members.find(x => x.authUserId && x.authUserId === r.auth_user_id) || null;
        return {
          uid: r.auth_user_id,
          status: r.status,
          at: r.updated_at,
          name: m ? m.name : 'A member',
          avatar: m ? m.avatar : null,
          memberId: m ? m.id : null,
        };
      });
  }

  // "3 days ago" — short, for the log.
  function ago(iso) {
    const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
    if (!isFinite(s)) return '';
    if (s < 60)     return 'just now';
    if (s < 3600)   return Math.floor(s / 60) + ' min ago';
    if (s < 86400)  return Math.floor(s / 3600) + ' h ago';
    if (s < 172800) return 'yesterday';
    if (s < 2592000) return Math.floor(s / 86400) + ' days ago';
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  window.PortalRsvps = { useRsvps, setRsvp, load, myUid, attendeesFor, ago };
})();
