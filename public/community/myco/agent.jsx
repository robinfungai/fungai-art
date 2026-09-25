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

  function MycoAgent({ currentMember }) {
    const [open,    setOpen]    = useState(false);
    const [input,   setInput]   = useState('');
    const [msgs,    setMsgs]    = useState([]);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');
    const [chips,   setChips]   = useState(() =>
      (window.MycoPrompts?.chipsFor?.('default') || [])
    );
    const endRef  = useRef(null);
    const inputRef = useRef(null);

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
          <div className="myco-panel">
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
