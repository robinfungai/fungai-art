/* ────────────────────────────────────────────────────────────────
   dm/dm.jsx — member DMs: inbox, threads, composer
   ────────────────────────────────────────────────────────────────
   Any member can message any member, keeper or not (Robin,
   2026-09-25). Messages are end-to-end encrypted with dm/crypto.js
   and stored as ciphertext in public.messages_e2e; see
   supabase-messages-e2e.sql and supabase-messages-e2e-sender-copy.sql.

   Open it from anywhere with:
     window.dispatchEvent(new CustomEvent('spore:dm-open', { detail: { profileId } }))
   (no detail → the inbox). The unread count is broadcast as
   'spore:dm-unread' { count } for the badge in the top bar.

   ── KEYS ─────────────────────────────────────────────────────────
   Every signed-in member gets a keypair on first portal load and the
   public half is published to profiles.dm_public_key, so they can be
   messaged before they ever open the inbox. If a DIFFERENT key is
   already published, another device holds this inbox: it is NOT
   overwritten silently — that would reroute mail away from the other
   device — the inbox offers "read here instead".

   ⚠ When the Security Key vault ships (supabase-e2e-key-vault.sql,
   on hold), init must call MycDMcrypto.openKeypairForVault() instead
   of getOrCreateMyKeypair(). See THE ORDERING TRAP in dm/crypto.js.

   ── IF THE SENDER-COPY MIGRATION HAS NOT RUN ─────────────────────
   Without ciphertext_self a sender cannot read their own sent mail
   after a reload. Everything still works: the insert falls back to
   the recipient copy only, and sent rows say so instead of breaking.

   No Realtime yet: the inbox polls — every 10 s while open, every
   60 s for the badge while closed, and on window focus.
   ──────────────────────────────────────────────────────────────── */
(function () {
  const { useState, useEffect, useRef, useCallback, useMemo } = React;

  const POLL_OPEN_MS = 10000;
  const POLL_IDLE_MS = 60000;
  const FULL_COLS = 'id, from_auth_user_id, to_profile_id, ciphertext, ciphertext_self, to_key_fp, self_key_fp, created_at, read_at, thread_key';
  const BASE_COLS = 'id, from_auth_user_id, to_profile_id, ciphertext, created_at, read_at, thread_key';

  const crypto_ = () => window.MycDMcrypto;
  const sb = () => window.SBclient;

  // A missing column shows up as 42703 on SELECT and PGRST204 on INSERT.
  function isColumnError(err) {
    if (!err) return false;
    return err.code === '42703' || err.code === 'PGRST204' || /column/i.test(String(err.message || ''));
  }

  function members() { return (window.SporeData && window.SporeData.MEMBERS) || []; }

  function timeLabel(iso) {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  // Open one row with a keypair and this device's fingerprint. The same
  // rules as MycDMcrypto.readMessage, with the fingerprint computed once
  // per load instead of once per row (it reopens IndexedDB each time).
  async function openRow(kp, myFp, row, mine) {
    const blob = mine ? row.ciphertext_self : row.ciphertext;
    const fp   = mine ? row.self_key_fp     : row.to_key_fp;
    if (!blob) return { unreadable: mine ? 'no-copy' : 'wrong-device' };
    if (fp && myFp && fp !== myFp) return { unreadable: 'wrong-device' };
    try { return { text: await crypto_().decryptFrom(kp, blob) }; }
    catch (_) { return { unreadable: fp ? 'failed' : 'wrong-device' }; }
  }

  const UNREADABLE = {
    'wrong-device': 'Sealed to another device — unreadable here.',
    'no-copy':      'Sent. Only the recipient holds a readable copy.',
    'failed':       'This message could not be opened.',
  };

  function Avatar({ person, size = 34 }) {
    const s = { width: size, height: size, fontSize: Math.round(size * 0.42) };
    return person && person.avatar
      ? <img className="dm-avatar" src={person.avatar} alt="" style={s} loading="lazy" />
      : <span className="dm-avatar" style={s} aria-hidden="true">{((person && person.name) || '?')[0]}</span>;
  }

  function DMCenter({ currentMember }) {
    const me = (currentMember && currentMember.cloudId) || null;   // my profile id

    const [open, setOpen]         = useState(false);
    const [peerId, setPeerId]     = useState(null);   // open thread (a profile id), or null for the list
    const [picking, setPicking]   = useState(false);
    const [query, setQuery]       = useState('');
    const [phase, setPhase]       = useState({ name: 'idle' });  // idle · loading · ready · unavailable
    const [uid, setUid]           = useState(null);
    const [keypair, setKeypair]   = useState(null);
    const [myPub, setMyPub]       = useState(null);
    const [myFp, setMyFp]         = useState(null);
    const [keyElsewhere, setKeyElsewhere] = useState(false);
    const [rows, setRows]         = useState([]);      // newest first
    const [texts, setTexts]       = useState({});      // row id → { text } | { unreadable }
    const [extra, setExtra]       = useState({});      // profiles not in SporeData.MEMBERS: id → { name, avatar, authUserId }
    const [draft, setDraft]       = useState('');
    const [sending, setSending]   = useState(false);
    const [error, setError]       = useState('');
    const selfCopy  = useRef(true);                    // false once we learn ciphertext_self is missing
    const sentPlain = useRef(new Map());               // rows sent this session → plaintext
    const listEnd   = useRef(null);

    /* ── people ───────────────────────────────────────────────── */
    const personByProfile = useCallback((pid) => {
      const m = members().find(x => x.cloudId === pid);
      if (m) return { id: pid, name: m.name, avatar: m.avatar, authUserId: m.authUserId };
      return extra[pid] ? { id: pid, ...extra[pid] } : { id: pid, name: 'A member', avatar: null };
    }, [extra]);

    const profileForAuth = useCallback((authId) => {
      const m = members().find(x => x.authUserId === authId);
      if (m && m.cloudId) return m.cloudId;
      const hit = Object.keys(extra).find(pid => extra[pid].authUserId === authId);
      return hit || null;
    }, [extra]);

    /* ── open requests from anywhere in the portal ─────────────── */
    useEffect(() => {
      const onOpen = (e) => {
        const pid = e && e.detail && e.detail.profileId;
        setOpen(true);
        setPicking(false);
        setError('');
        setPeerId(pid && pid !== me ? pid : null);
      };
      window.addEventListener('spore:dm-open', onOpen);
      return () => window.removeEventListener('spore:dm-open', onOpen);
    }, [me]);

    // Escape closes the inbox, like every other dialog should.
    useEffect(() => {
      if (!open) return;
      const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); setPicking(false); setError(''); } };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    /* ── keys ─────────────────────────────────────────────────── */
    useEffect(() => {
      if (!me) { setPhase({ name: 'unavailable', why: 'no-profile' }); return; }
      let alive = true;
      (async () => {
        setPhase({ name: 'loading' });
        try {
          if (window.SBready) await window.SBready;
          const user = window.SBauth ? await window.SBauth.getUser() : null;
          if (!user || !sb()) { if (alive) setPhase({ name: 'unavailable', why: 'no-session' }); return; }
          if (!crypto_() || !window.crypto || !window.crypto.subtle) {
            if (alive) setPhase({ name: 'unavailable', why: 'no-crypto' });
            return;
          }
          const kp  = await crypto_().getOrCreateMyKeypair();
          const pub = await crypto_().exportPublicKey(kp.publicKey);
          const fp  = await crypto_().keyFingerprint(pub);
          const { data: prof } = await sb().from('profiles').select('dm_public_key').eq('id', me).maybeSingle();
          const published = prof && prof.dm_public_key;
          if (!published) await sb().from('profiles').update({ dm_public_key: pub }).eq('id', me);
          if (!alive) return;
          setUid(user.id); setKeypair(kp); setMyPub(pub); setMyFp(fp);
          setKeyElsewhere(!!published && published !== pub);
          setPhase({ name: 'ready' });
        } catch (e) {
          if (alive) setPhase({ name: 'unavailable', why: 'error', msg: (e && e.message) || String(e) });
        }
      })();
      return () => { alive = false; };
    }, [me]);

    async function readHereInstead() {
      const { error: err } = await sb().from('profiles').update({ dm_public_key: myPub }).eq('id', me);
      if (err) { setError('Could not move your inbox: ' + err.message); return; }
      setKeyElsewhere(false);
    }

    /* ── load ─────────────────────────────────────────────────── */
    const load = useCallback(async () => {
      if (phase.name !== 'ready') return;
      const q = (cols) => sb().from('messages_e2e').select(cols).order('created_at', { ascending: false }).limit(400);
      let res = await q(selfCopy.current ? FULL_COLS : BASE_COLS);
      if (res.error && selfCopy.current && isColumnError(res.error)) {
        selfCopy.current = false;
        res = await q(BASE_COLS);
      }
      if (res.error) {
        setError(res.error.code === '42P01' ? 'Messages are not set up on the server yet.' : 'Could not load messages.');
        return;
      }
      setRows(res.data || []);
    }, [phase.name]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => {
      if (phase.name !== 'ready') return;
      const t = setInterval(load, open ? POLL_OPEN_MS : POLL_IDLE_MS);
      const onFocus = () => load();
      window.addEventListener('focus', onFocus);
      return () => { clearInterval(t); window.removeEventListener('focus', onFocus); };
    }, [phase.name, open, load]);

    // Senders we cannot name from SporeData.MEMBERS — look them up once.
    useEffect(() => {
      if (!uid || !rows.length) return;
      const unknown = [...new Set(rows
        .filter(r => r.from_auth_user_id !== uid && !profileForAuth(r.from_auth_user_id))
        .map(r => r.from_auth_user_id))];
      if (!unknown.length) return;
      (async () => {
        const { data } = await sb().from('profiles').select('id, character_name, avatar_url, auth_user_id').in('auth_user_id', unknown);
        if (!data || !data.length) return;
        setExtra(prev => {
          const next = { ...prev };
          data.forEach(p => { next[p.id] = { name: p.character_name || 'A member', avatar: p.avatar_url || null, authUserId: p.auth_user_id }; });
          return next;
        });
      })();
    }, [rows, uid, profileForAuth]);

    // Decrypt anything new.
    useEffect(() => {
      if (!keypair || !uid) return;
      const todo = rows.filter(r => !texts[r.id]);
      if (!todo.length) return;
      let alive = true;
      (async () => {
        const out = {};
        for (const r of todo) {
          const mine = r.from_auth_user_id === uid;
          out[r.id] = sentPlain.current.has(r.id)
            ? { text: sentPlain.current.get(r.id) }
            : await openRow(keypair, myFp, r, mine);
        }
        if (alive) setTexts(prev => ({ ...prev, ...out }));
      })();
      return () => { alive = false; };
    }, [rows, keypair, uid, myFp]);

    /* ── threads ──────────────────────────────────────────────── */
    const threads = useMemo(() => {
      if (!uid) return [];
      const map = new Map();
      for (const r of rows) {
        const mine = r.from_auth_user_id === uid;
        const peer = mine ? r.to_profile_id : profileForAuth(r.from_auth_user_id);
        if (!peer) continue;
        let t = map.get(peer);
        if (!t) { t = { peer, last: r, unread: 0, rows: [] }; map.set(peer, t); }
        t.rows.push(r);
        if (!mine && !r.read_at) t.unread++;
      }
      return [...map.values()];
    }, [rows, uid, profileForAuth]);

    const unread = threads.reduce((n, t) => n + t.unread, 0);
    useEffect(() => {
      window.dispatchEvent(new CustomEvent('spore:dm-unread', { detail: { count: unread } }));
    }, [unread]);

    const thread = peerId ? (threads.find(t => t.peer === peerId) || { peer: peerId, rows: [], unread: 0 }) : null;

    // Opening a thread marks what was sent to me as read. The column
    // grant allows exactly this one column.
    useEffect(() => {
      if (!open || !thread || !thread.unread) return;
      const ids = thread.rows.filter(r => r.from_auth_user_id !== uid && !r.read_at).map(r => r.id);
      if (!ids.length) return;
      const stamp = new Date().toISOString();
      setRows(prev => prev.map(r => (ids.indexOf(r.id) !== -1 ? { ...r, read_at: stamp } : r)));
      sb().from('messages_e2e').update({ read_at: stamp }).in('id', ids).then(() => {}, () => {});
    }, [open, peerId, thread && thread.unread]);

    useEffect(() => {
      if (listEnd.current) listEnd.current.scrollIntoView({ block: 'end' });
    }, [peerId, thread && thread.rows.length, open]);

    /* ── send ─────────────────────────────────────────────────── */
    const bytes = new TextEncoder().encode(draft).byteLength;
    const max = (crypto_() && crypto_().MAX_PLAINTEXT_BYTES) || 5900;

    async function send() {
      const text = draft.trim();
      if (!text || sending || !peerId) return;
      if (new TextEncoder().encode(text).byteLength > max) { setError('That message is too long.'); return; }
      setSending(true); setError('');
      try {
        const { data: prof, error: pErr } = await sb().from('profiles').select('dm_public_key').eq('id', peerId).maybeSingle();
        if (pErr) throw pErr;
        const theirPub = prof && prof.dm_public_key;
        if (!theirPub) {
          setError(personByProfile(peerId).name + " hasn't opened the portal since messages arrived. They can receive as soon as they sign in once.");
          return;
        }
        const thread_key = await crypto_().threadKey(me, peerId);
        let res = null;
        if (selfCopy.current) {
          const s = await crypto_().encryptForBoth(theirPub, myPub, text);
          res = await sb().from('messages_e2e').insert({
            from_auth_user_id: uid, to_profile_id: peerId,
            ciphertext: s.forRecipient, ciphertext_self: s.forSelf,
            to_key_fp: s.toKeyFp, self_key_fp: s.selfKeyFp, thread_key,
          }).select(FULL_COLS).single();
          if (res.error && isColumnError(res.error)) { selfCopy.current = false; res = null; }
        }
        if (!res) {
          const ciphertext = await crypto_().encryptTo(theirPub, text);
          res = await sb().from('messages_e2e').insert({
            from_auth_user_id: uid, to_profile_id: peerId, ciphertext, thread_key,
          }).select(BASE_COLS).single();
        }
        if (res.error) throw res.error;
        sentPlain.current.set(res.data.id, text);
        setTexts(prev => ({ ...prev, [res.data.id]: { text } }));
        setRows(prev => [res.data, ...prev]);
        setDraft('');
      } catch (e) {
        setError('Could not send: ' + ((e && e.message) || 'try again'));
      } finally {
        setSending(false);
      }
    }

    /* ── render ───────────────────────────────────────────────── */
    if (!open) return null;

    const close = () => { setOpen(false); setPicking(false); setError(''); };
    const peer = peerId ? personByProfile(peerId) : null;
    const candidates = members()
      .filter(m => m.cloudId && m.cloudId !== me)
      .filter(m => !query.trim() || m.name.toLowerCase().indexOf(query.trim().toLowerCase()) !== -1)
      .sort((a, b) => a.name.localeCompare(b.name));

    let body;
    if (phase.name === 'loading' || phase.name === 'idle') {
      body = <p className="dm-state">Opening your inbox…</p>;
    } else if (phase.name === 'unavailable') {
      body = (
        <p className="dm-state">{({
          'no-profile': 'Messages need a linked profile. Create or claim yours on the Hyphae page first.',
          'no-session': 'Messages need an email sign-in. Sign out and back in with the magic link to use them.',
          'no-crypto':  'This browser cannot do the encryption messages need. Try a current Chrome, Safari or Firefox.',
          'error':      'Your inbox could not open: ' + (phase.msg || 'unknown error'),
        })[phase.why]}</p>
      );
    } else if (peer) {
      const ordered = thread.rows.slice().reverse();
      body = (
        <>
          <div className="dm-thread" role="log" aria-live="polite">
            {!ordered.length ? (
              <p className="dm-state">No messages yet. Say hello to {peer.name.split(' ')[0]}.</p>
            ) : ordered.map(r => {
              const mine = r.from_auth_user_id === uid;
              const t = texts[r.id];
              return (
                <div key={r.id} className={'dm-msg' + (mine ? ' is-mine' : '')}>
                  <div className={'dm-bubble' + (t && t.unreadable ? ' is-sealed' : '')}>
                    {!t ? '…' : t.text !== undefined ? t.text : UNREADABLE[t.unreadable]}
                  </div>
                  <div className="dm-meta">{timeLabel(r.created_at)}{mine && r.read_at ? ' · read' : ''}</div>
                </div>
              );
            })}
            <div ref={listEnd} />
          </div>
          <form className="dm-compose" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={'Message ' + peer.name.split(' ')[0] + '…'}
              rows={2}
              aria-label={'Message to ' + peer.name}
            />
            <button type="submit" className="dm-send" disabled={sending || !draft.trim()}>{sending ? '…' : 'Send'}</button>
          </form>
          {bytes > max * 0.8 ? <p className="dm-count">{Math.max(0, max - bytes)} bytes left</p> : null}
        </>
      );
    } else if (picking) {
      body = (
        <div className="dm-pick">
          <input
            className="dm-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the network…"
            autoFocus
            aria-label="Search members"
          />
          <ul className="dm-list">
            {candidates.map(m => (
              <li key={m.cloudId}>
                <button type="button" className="dm-row" onClick={() => { setPeerId(m.cloudId); setPicking(false); setQuery(''); }}>
                  <Avatar person={m} />
                  <span className="dm-row-body"><span className="dm-row-name">{m.name}</span><span className="dm-row-sub">{m.focus || m.role || ''}</span></span>
                  {m.admin ? <span className="dm-chip">keeper</span> : null}
                </button>
              </li>
            ))}
            {!candidates.length ? <li className="dm-state">No one by that name.</li> : null}
          </ul>
        </div>
      );
    } else {
      body = (
        <>
          <button type="button" className="dm-new" onClick={() => setPicking(true)}>+ New message</button>
          {!threads.length ? (
            <p className="dm-state">No conversations yet. Start one with anyone in the network.</p>
          ) : (
            <ul className="dm-list">
              {threads.map(t => {
                const p = personByProfile(t.peer);
                const lt = texts[t.last.id];
                const mine = t.last.from_auth_user_id === uid;
                const preview = !lt ? '…' : lt.text !== undefined ? lt.text : '🔒 ' + UNREADABLE[lt.unreadable];
                return (
                  <li key={t.peer}>
                    <button type="button" className={'dm-row' + (t.unread ? ' is-unread' : '')} onClick={() => setPeerId(t.peer)}>
                      <Avatar person={p} />
                      <span className="dm-row-body">
                        <span className="dm-row-name">{p.name}</span>
                        <span className="dm-row-sub">{mine ? 'You: ' : ''}{preview}</span>
                      </span>
                      <span className="dm-row-side">
                        <span className="dm-row-time">{timeLabel(t.last.created_at)}</span>
                        {t.unread ? <span className="dm-badge">{t.unread}</span> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      );
    }

    return (
      <div className="dm-overlay" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
        <aside className="dm-panel" role="dialog" aria-label="Messages">
          <header className="dm-head">
            {peer || picking ? (
              <button type="button" className="dm-back" onClick={() => { setPeerId(null); setPicking(false); setError(''); }} aria-label="Back to conversations">‹</button>
            ) : null}
            {peer ? <Avatar person={peer} size={30} /> : null}
            <div className="dm-head-text">
              <p className="dm-kicker">{peer ? 'Direct message' : 'Hyphae'}</p>
              <h3 className="dm-title">{peer ? peer.name : picking ? 'New message' : 'Messages'}</h3>
            </div>
            <button type="button" className="dm-close" onClick={close} aria-label="Close messages">×</button>
          </header>

          {keyElsewhere && phase.name === 'ready' ? (
            <div className="dm-banner">
              <p>Your inbox key lives on another device, so new messages to you open there, not here.</p>
              <button type="button" onClick={readHereInstead}>Read here instead</button>
            </div>
          ) : null}

          <div className="dm-body">{body}</div>
          {error ? <p className="dm-error" role="alert">{error}</p> : null}

          <footer className="dm-foot">
            End-to-end encrypted. Only the two of you can read these, on the devices that hold your keys.
          </footer>
        </aside>
      </div>
    );
  }

  window.SporeDM = { DMCenter };
})();
