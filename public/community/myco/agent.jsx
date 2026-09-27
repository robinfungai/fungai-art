/* ────────────────────────────────────────────────────────────────
   MYCO · Agent UI component
   ────────────────────────────────────────────────────────────────
   Moved out of spore/app-living.jsx (Sep 2026). Behaviour is the
   same as before, plus:

   - Chips are now tab-aware (see prompts.js).
   - Every request carries a light `context` blob (see context.js).
   - Client-side hard-refuse for medical / diagnostic requests, so
     the user gets the softer copy without a round-trip.
   - Renders as a global window.MycoAgent so app-living can drop it
     into the tree without ES imports (Babel-standalone runtime).

   Styling still lives in spore/styles-living.css under .myco-*.
   ──────────────────────────────────────────────────────────────── */
(function () {
  const { useState, useRef, useEffect } = React;

  /* ── The conversation is kept (Robin, 2026-09-27) ──────────────────
     Every signed-in member, whatever their rank, keeps their MYCO
     thread. Two layers:
       · this browser — localStorage, per member, always;
       · their account — public.myco_threads, one row per auth user,
         owner-only RLS (supabase-myco-threads.sql). Follows them to
         another device. Until that SQL has run the cloud layer switches
         itself off after the first "table missing" and the local copy
         carries on alone.
     Visitors who are not signed in are not stored. "Clear" empties
     both. */
  const KEEP_MAX  = 60;                 // messages kept per member
  const SIZE_KEY  = 'myco_panel_size';
  const localKey  = (m) => 'myco_thread:' + m.id;
  const trim      = (list) => list.slice(-KEEP_MAX).map(m => ({
    role: m.role, content: String(m.content || '').slice(0, 12000),
    ...(m.sources && m.sources.length ? { sources: m.sources.slice(0, 8) } : {}),
    ...(m.confidence ? { confidence: m.confidence } : {}),
  }));
  let cloudOff = false;                 // the table is not there yet
  const missing = (e) => !!e && (e.code === '42P01' || e.code === 'PGRST205' || /does not exist|schema cache/i.test(e.message || ''));

  function readLocal(m) {
    try { const v = JSON.parse(localStorage.getItem(localKey(m)) || 'null'); return v && Array.isArray(v.msgs) ? v : null; }
    catch (_) { return null; }
  }
  function writeLocal(m, msgs) {
    try {
      if (msgs.length) localStorage.setItem(localKey(m), JSON.stringify({ at: Date.now(), msgs: trim(msgs) }));
      else localStorage.removeItem(localKey(m));
    } catch (_) {}
  }
  async function cloudUser() {
    if (cloudOff || !window.SBclient || !window.SBauth) return null;
    try { if (window.SBready) await window.SBready; } catch (_) {}
    try { const u = await window.SBauth.getUser(); return (u && u.id) ? u : null; } catch (_) { return null; }
  }
  async function readCloud() {
    const u = await cloudUser();
    if (!u) return null;
    const { data, error } = await window.SBclient.from('myco_threads')
      .select('messages, updated_at').eq('user_id', u.id).maybeSingle();
    if (error) { if (missing(error)) cloudOff = true; return null; }
    return data ? { at: Date.parse(data.updated_at) || 0, msgs: Array.isArray(data.messages) ? data.messages : [] } : null;
  }
  async function writeCloud(msgs) {
    const u = await cloudUser();
    if (!u) return;
    const { error } = await window.SBclient.from('myco_threads').upsert(
      { user_id: u.id, messages: trim(msgs), updated_at: new Date().toISOString() },
      { onConflict: 'user_id' });
    if (error && missing(error)) cloudOff = true;
    else if (error) console.warn('[myco] conversation not saved to your account:', error.message);
  }

  function readSize() {
    try { const s = JSON.parse(localStorage.getItem(SIZE_KEY) || 'null'); return s && s.w && s.h ? s : null; }
    catch (_) { return null; }
  }

  function MycoAgent({ currentMember }) {
    const [open,    setOpen]    = useState(false);
    const [input,   setInput]   = useState('');
    const [msgs,    setMsgs]    = useState([]);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');
    const [chips,   setChips]   = useState(() =>
      (window.MycoPrompts?.chipsFor?.('default') || [])
    );
    const [size,    setSize]    = useState(readSize);   // { w, h } once resized
    const endRef  = useRef(null);
    const inputRef = useRef(null);
    const loadedFor = useRef(null);     // member id the thread was loaded for
    const saveT     = useRef(null);
    const fromLoad  = useRef(false);    // the next msgs change came from a load, not the member

    // Load this member's thread: local first (instant), then the account
    // copy if it is newer — that is the one from another device.
    const memberId = currentMember ? currentMember.id : null;
    useEffect(() => {
      loadedFor.current = null;
      if (!currentMember) { setMsgs([]); return; }
      const local = readLocal(currentMember);
      fromLoad.current = true;
      setMsgs(local ? local.msgs : []);
      loadedFor.current = currentMember.id;
      let alive = true;
      readCloud().then(cloud => {
        if (!alive || !cloud || !cloud.msgs.length) return;
        if (!local || cloud.at > local.at) {
          fromLoad.current = true;
          setMsgs(cloud.msgs);
          writeLocal(currentMember, cloud.msgs);
        }
      }).catch(() => {});
      return () => { alive = false; };
    }, [memberId]);

    // Save on every change — locally at once, to the account a moment later.
    useEffect(() => {
      if (!currentMember || loadedFor.current !== currentMember.id) return;
      // A load is not an edit: writing it back would stamp an old local
      // copy as new and push it over the account's newer thread.
      if (fromLoad.current) { fromLoad.current = false; return; }
      writeLocal(currentMember, msgs);
      clearTimeout(saveT.current);
      saveT.current = setTimeout(() => { writeCloud(msgs).catch(() => {}); }, 1200);
    }, [msgs]);

    // Resize from the top-right corner: the panel is pinned bottom-left,
    // so dragging up and right makes it bigger. Double-click resets.
    function startResize(e) {
      e.preventDefault();
      const panel = e.currentTarget.parentElement;
      const r = panel.getBoundingClientRect();
      const x0 = e.clientX, y0 = e.clientY, w0 = r.width, h0 = r.height;
      let last = null;
      const move = (ev) => {
        const w = Math.max(300, Math.min(window.innerWidth - 40, w0 + (ev.clientX - x0)));
        const h = Math.max(320, Math.min(window.innerHeight - 100, h0 - (ev.clientY - y0)));
        last = { w: Math.round(w), h: Math.round(h) };
        setSize(last);
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        document.body.style.userSelect = '';
        if (last) { try { localStorage.setItem(SIZE_KEY, JSON.stringify(last)); } catch (_) {} }
      };
      document.body.style.userSelect = 'none';
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    }
    function resetSize() {
      setSize(null);
      try { localStorage.removeItem(SIZE_KEY); } catch (_) {}
    }
    // Phones get the full-width panel from the stylesheet, not a saved size.
    const sized = size && typeof window !== 'undefined' && window.innerWidth > 600
      ? { width: Math.min(size.w, window.innerWidth - 40), height: Math.min(size.h, window.innerHeight - 100), maxHeight: 'none' }
      : undefined;

    useEffect(() => {
      if (open && endRef.current) endRef.current.scrollIntoView({ behavior:'smooth' });
    }, [msgs, open]);

    useEffect(() => {
      if (open && inputRef.current) inputRef.current.focus();
      // Re-pull chips when the panel opens — they can rotate per tab.
      if (open) {
        try {
          const tab = window.MycoContext?.build?.(currentMember)?.tab || 'default';
          setChips(window.MycoPrompts?.chipsFor?.(tab) || []);
        } catch (_) {}
      }
    }, [open]);

    async function send(text) {
      const msg = (text || input).trim();
      if (!msg || loading) return;

      // Client-side hard-refuse for medical / diagnostic asks. Server
      // enforces the same rules; this saves a network round-trip and
      // gives immediate feedback.
      const refuse = window.MycoPrompts?.shouldClientRefuse?.(msg);
      if (refuse) {
        setMsgs(prev => [
          ...prev,
          { role:'user', content:msg },
          { role:'assistant', content: refuse },
        ]);
        setInput('');
        return;
      }

      setInput('');
      setError('');
      const history = msgs.map(m => ({ role: m.role, content: m.content }));
      setMsgs(prev => [...prev, { role:'user', content:msg }]);
      setLoading(true);

      let context = {};
      try { context = window.MycoContext?.build?.(currentMember) || {}; } catch (_) {}

      try {
        const res = await fetch('/api/myco-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg, history, context }),
        });
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setMsgs(prev => [...prev, {
            role:'assistant',
            content: data.reply,
            // Knowledge layer: what MYCO actually read to answer, and
            // how well the knowledge base covered the question.
            sources: Array.isArray(data.sources) ? data.sources : [],
            confidence: data.confidence || null,
          }]);
        }
      } catch (e) {
        setError('Network error — check connection.');
      }
      setLoading(false);
    }

    function useChip(chip) {
      if (chip.msg) {
        send(chip.msg);
      } else {
        setInput(chip.prefix);
        if (inputRef.current) inputRef.current.focus();
      }
    }

    // MYCO answers in short sections (the server's RESPONSE STYLE asks for
    // it): "## Heading" lines, "- " or "1." items, **bold**, and [K1]
    // citations. Built as React elements — never as HTML — so nothing in
    // a reply can inject markup. Same rules as renderRich() in
    // academy/myco-academy.js.
    function inline(text, key) {
      const out = [];
      const re = /(\*\*[^*]+\*\*|\[K\d+\])/g;
      let last = 0, m, n = 0;
      while ((m = re.exec(text))) {
        if (m.index > last) out.push(text.slice(last, m.index));
        const tok = m[0];
        out.push(tok.startsWith('**')
          ? <strong key={key + '.' + n++}>{tok.slice(2, -2)}</strong>
          : <span key={key + '.' + n++} className="myco-cite">{tok}</span>);
        last = m.index + tok.length;
      }
      if (last < text.length) out.push(text.slice(last));
      return out;
    }

    function fmtContent(text) {
      const out = [];
      let para = [], items = null;
      // Belt and braces for replies that arrive on one line (the server's
      // claims guard used to flatten them): put each "## " back on a line
      // of its own.
      text = String(text || '').replace(/[ \t]+(#{1,4}\s)/g, '\n$1');
      const flushPara = () => {
        if (para.length) { out.push(<p key={'p' + out.length} className="myco-p">{inline(para.join(' '), 'p' + out.length)}</p>); para = []; }
      };
      const flushList = () => {
        if (items) { out.push(<ul key={'u' + out.length} className="myco-ul">{items}</ul>); items = null; }
      };
      String(text || '').split('\n').forEach((raw, i) => {
        const line = raw.trim();
        if (!line) { flushPara(); flushList(); return; }
        const h = line.match(/^#{1,4}\s+(.*)$/);
        // A "heading" longer than a heading is prose that lost its line
        // break — read it as a paragraph, never as a wall of heading type.
        if (h && h[1].length > 70) { flushList(); para.push(h[1]); return; }
        if (h) {
          flushPara(); flushList();
          out.push(<div key={'h' + i} className="myco-h">{h[1].replace(/\*\*/g, '')}</div>);
          return;
        }
        const num = line.match(/^(\d+)[.)]\s+(.*)$/);
        const dot = line.match(/^[-•*]\s+(.*)$/);
        if (num || dot) {
          flushPara();
          (items = items || []).push(
            <li key={'l' + i}>
              {num ? <span className="myco-num">{num[1]}. </span> : null}
              {inline(num ? num[2] : dot[1], 'l' + i)}
            </li>
          );
          return;
        }
        flushList();
        para.push(line);
      });
      flushPara(); flushList();
      return out;
    }

    return (
      <div className="myco-wrap">
        {open && (
          <div className="myco-panel" style={sized}>
            <button
              type="button"
              className="myco-resize"
              onPointerDown={startResize}
              onDoubleClick={resetSize}
              aria-label="Resize MYCO — drag the corner; double-click to reset"
              title="Drag to resize · double-click to reset"
            />
            <div className="myco-head">
              <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                <div className="myco-avatar">
                  <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden="true">
                    <polygon points="12,2 22,20 2,20" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="12" cy="13" r="2.5" fill="currentColor" />
                  </svg>
                </div>
                <div>
                  <div className="myco-head-name">MYCO</div>
                  <div className="myco-head-sub">Fungai Art Intelligence</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                {msgs.length > 0 && (
                  <button className="myco-clear" onClick={() => { setMsgs([]); setError(''); }}>clear</button>
                )}
                <button className="myco-close" onClick={() => setOpen(false)}>✕</button>
              </div>
            </div>

            <div className="myco-messages">
              {msgs.length === 0 && !loading && (
                <div className="myco-empty">
                  <div className="myco-empty-glyph">◇ △ ◇</div>
                  <div className="myco-empty-text">
                    What shall we cultivate today, {currentMember ? currentMember.name.split(' ')[0] : 'Hyphae'}?
                  </div>
                  {/* Same words as the Academy panel: it is the same MYCO. */}
                  <div className="myco-intro">
                    I answer from the Fungai Art knowledge base — herb monographs, extraction protocols and our own practice. I cite what I read, and I say so when a question falls outside it.
                  </div>
                  <div className="myco-note">
                    Traditional preparation and research framing — not medical or diagnostic advice.
                  </div>
                  <div className="myco-chips">
                    {chips.map(c => (
                      <button key={c.label} className="myco-chip" onClick={() => useChip(c)}>{c.label}</button>
                    ))}
                  </div>
                </div>
              )}
              {msgs.map((m, i) => (
                <div key={i} className={`myco-msg ${m.role === 'user' ? 'user' : 'ai'}`}>
                  {m.role === 'assistant' && (
                    <div className="myco-msg-avatar">M</div>
                  )}
                  <div className="myco-bubble">
                    {m.role === 'assistant' ? fmtContent(m.content) : m.content}
                    {m.role === 'assistant' && m.sources && m.sources.length > 0 && (
                      <div className="myco-sources">
                        <div className="myco-sources-head">
                          <span className={'myco-conf myco-conf-' + ((m.confidence && m.confidence.level) || 'low')} />
                          {m.confidence && m.confidence.level === 'none'
                            ? 'not covered by the knowledge base'
                            : 'read from ' + m.sources.length + (m.sources.length === 1 ? ' source' : ' sources')}
                        </div>
                        {m.sources.map(s => (
                          <div key={s.ref} className="myco-source">
                            <span className="myco-source-ref">{s.ref}</span>
                            <span className="myco-source-title">{s.title}</span>
                            <span className="myco-source-kind">{s.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="myco-msg ai">
                  <div className="myco-msg-avatar">M</div>
                  <div className="myco-bubble myco-typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}
              {error && (
                <div className="myco-error">{error}</div>
              )}
              <div ref={endRef} />
            </div>

            {msgs.length > 0 && (
              <div className="myco-chips-row">
                {chips.map(c => (
                  <button key={c.label} className="myco-chip-sm" onClick={() => useChip(c)}>{c.label}</button>
                ))}
              </div>
            )}

            <div className="myco-input-row">
              <textarea
                ref={inputRef}
                className="myco-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask MYCO — ceremony, formulation, alchemy…"
                rows={2}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
                }}
              />
              <button
                className="myco-send"
                onClick={() => send()}
                disabled={!input.trim() || loading}
              >
                {loading ? '…' : 'Ask'}
              </button>
            </div>
          </div>
        )}

        <button className={`myco-btn ${open ? 'open' : ''}`} onClick={() => setOpen(o => !o)}>
          <svg viewBox="0 0 24 24" width={18} height={18}>
            <polygon points="12,2 22,20 2,20" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="12" cy="13" r="2.5" fill="currentColor" />
          </svg>
          <span className="myco-btn-label">MYCO</span>
        </button>
      </div>
    );
  }

  window.MycoAgent = MycoAgent;
})();
