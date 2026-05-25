/* Spore Living — main app */

const { useState, useEffect, useCallback, useRef } = React;

/* ── Per-member storage ───────────────────────────────────── */

const storageKey  = (id) => `spore_state_${id}`;
const pinKey      = (id) => `spore_pin_${id}`;

function defaultState(member) {
  return {
    balance:       member ? member.balance : 120,
    reputation:    member ? member.rep     : 1,
    contributions: member ? 2              : 0,
    keys:          0,
    unlocked:      [],
    inventory:     [],
    history:       [],
  };
}

function useEconomy(memberId) {
  const member  = SporeData.MEMBERS.find(m => m.id === memberId);
  const key     = storageKey(memberId);
  const initial = defaultState(member);

  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return { ...initial, ...JSON.parse(raw) };
    } catch (_) {}
    return initial;
  });

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch (_) {}
  }, [state, key]);

  const earn = useCallback((amount, label, repGain = 1) => {
    setState(s => ({
      ...s,
      balance:       s.balance + amount,
      reputation:    s.reputation + repGain,
      contributions: s.contributions + 1,
      history: [{ type:'earn', label, delta:+amount, ts:Date.now() }, ...s.history].slice(0, 30),
    }));
  }, []);

  const unlock = useCallback((expId, amount, label) => {
    let ok = false;
    setState(s => {
      if (s.balance < amount || s.unlocked.includes(expId)) return s;
      ok = true;
      return {
        ...s,
        balance:  s.balance - amount,
        keys:     s.keys + 1,
        unlocked: [...s.unlocked, expId],
        history:  [{ type:'unlock', label, delta:-amount, ts:Date.now() }, ...s.history].slice(0, 30),
      };
    });
    return ok;
  }, []);

  const buy = useCallback((prodId, name, amount) => {
    let ok = false;
    setState(s => {
      if (s.balance < amount) return s;
      ok = true;
      return {
        ...s,
        balance:   s.balance - amount,
        inventory: [...s.inventory, prodId],
        history:   [{ type:'buy', label:name, delta:-amount, ts:Date.now() }, ...s.history].slice(0, 30),
      };
    });
    return ok;
  }, []);

  const reset = useCallback(() => setState(defaultState(member)), [member]);
  return { state, earn, unlock, buy, reset };
}

/* ── Toast ───────────────────────────────────────────────── */

function Toast({ message, kind, onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className="toast-wrap">
      <div className={`toast ${kind || ''}`}>{message}</div>
    </div>
  );
}

/* ── PIN modal ───────────────────────────────────────────── */

function PinModal({ member, onSuccess, onCancel }) {
  const tier         = SporeData.reputationTier(member.rep);
  const stored       = localStorage.getItem(pinKey(member.id));
  const isNew        = !stored;
  const [step, setStep]   = useState(isNew ? 'set1' : 'verify');
  const [first, setFirst] = useState('');
  const [pin, setPin]     = useState('');
  const [shake, setShake] = useState(false);
  const [status, setStatus] = useState(
    isNew ? 'Choose a 4-digit code' : 'Enter your code'
  );
  const [isError, setIsError] = useState(false);

  function triggerShake() {
    setShake(true);
    setTimeout(() => { setShake(false); setPin(''); }, 500);
  }

  function press(digit) {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === 4) setTimeout(() => handleFull(next), 80);
  }

  function del() { setPin(p => p.slice(0, -1)); }

  function handleFull(code) {
    if (step === 'set1') {
      setFirst(code);
      setPin('');
      setStep('set2');
      setStatus('Confirm your code');
      setIsError(false);
      return;
    }
    if (step === 'set2') {
      if (code !== first) {
        setIsError(true);
        setStatus('Codes didn\'t match — try again');
        triggerShake();
        setTimeout(() => { setStep('set1'); setFirst(''); setIsError(false); setStatus('Choose a 4-digit code'); }, 600);
        return;
      }
      localStorage.setItem(pinKey(member.id), code);
      onSuccess();
      return;
    }
    if (step === 'verify') {
      if (code === stored) { onSuccess(); return; }
      setIsError(true);
      setStatus('Wrong code — try again');
      triggerShake();
    }
  }

  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div className="pin-backdrop" onClick={onCancel}>
      <div className="pin-sheet" onClick={e => e.stopPropagation()}>
        <div className="pin-member-row">
          <div className="pin-avatar" style={{ background: tier.color }}>{member.name[0]}</div>
          <div>
            <div className="pin-member-name">{member.name}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color: tier.color, marginTop:2 }}>{tier.label}</div>
          </div>
        </div>

        <div className={`pin-dots ${shake ? 'shaking' : ''}`}>
          {[0,1,2,3].map(i => (
            <div key={i} className={`pin-dot ${pin.length > i ? (isError ? 'error' : 'filled') : ''}`} />
          ))}
        </div>

        <div className="pin-pad">
          {keys.map((k, i) => {
            if (k === '') return <div key={i} />;
            if (k === '⌫') return (
              <button key={i} className="pin-key del" onClick={del}>⌫</button>
            );
            return (
              <button key={i} className="pin-key" onClick={() => press(k)}>{k}</button>
            );
          })}
        </div>

        <div className={`pin-status ${isError ? 'error' : ''}`}>{status}</div>
        <button className="pin-cancel" onClick={onCancel}>cancel</button>
      </div>
    </div>
  );
}

/* ── Welcome portal ───────────────────────────────────────── */

function LoginScreen({ onLogin, sbUser }) {
  const [selected, setSelected]     = useState(null);
  const [dropOpen, setDropOpen]     = useState(false);
  const dropRef                      = useRef(null);

  // Supabase magic-link sign-in (primary path for everyone)
  const [signInEmail, setSignInEmail] = useState('');
  const [signInBusy, setSignInBusy] = useState(false);
  const [signInSent, setSignInSent] = useState(false);

  async function handleSignIn(e) {
    e.preventDefault();
    if (!signInEmail.includes('@')) { alert('Enter a valid email'); return; }
    if (!window.SBauth) { alert('Sign-in service still loading — try again in a second.'); return; }
    setSignInBusy(true);
    const { error } = await window.SBauth.signIn(signInEmail);
    setSignInBusy(false);
    if (error) { alert('Sign-in failed: ' + error.message); return; }
    setSignInSent(true);
  }

  useEffect(() => {
    function outside(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  const PHILOSOPHY = [
    { icon:'◉', title:'$MYCEL — Currency', color:'var(--spore-l)', desc:'Earned by contributing to any node. Spent on experiences, products, and access. Emission-based — designed to grow with the organism.' },
    { icon:'⬡', title:'Access Keys — NFTs', color:'var(--fungal-l)', desc:'Non-transferable keys minted on unlock. Each key grants access to a specific experience, lab, or residency — limited by real-world seats.' },
    { icon:'◈', title:'Reputation — Trust', color:'var(--nutrient-l)', desc:'Tracks depth of participation. Cannot be bought, only earned. Required for the deepest access. Resists speculation culture.' },
  ];

  const liveNodes = SporeData.NETWORK_NODES.filter(n => n.activity !== 'proposed');

  return (
    <div className="welcome-wrap">

      {/* ── Nav ── */}
      <div className="welcome-nav">
        <div className="welcome-nav-brand">
          <ProceduralMark size={26} />
          <div>
            <div className="welcome-brand-name">Spore</div>
            <div className="welcome-brand-sub">Living Network · $MYCEL</div>
          </div>
        </div>
        <div style={{ position:'relative' }} ref={dropRef}>
          <button
            className="welcome-login-btn"
            onClick={() => setDropOpen(d => !d)}
          >
            <span>PIN access</span>
            <span style={{ fontSize:10, opacity:0.7, transition:'transform .2s', display:'inline-block', transform: dropOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
          </button>
          {dropOpen && (
            <div className="member-dropdown">
              <div className="md-label">Who are you in the mycelium?</div>
              {SporeData.MEMBERS.map(m => {
                const tier = SporeData.reputationTier(m.rep);
                const node = SporeData.NETWORK_NODES.find(n => n.id === m.node);
                return (
                  <button
                    key={m.id}
                    className="md-item"
                    onClick={() => { setDropOpen(false); setSelected(m); }}
                  >
                    <div className="md-avatar" style={{ background: tier.color }}>{m.name[0]}</div>
                    <div className="md-info">
                      <div className="md-name">{m.name}</div>
                      <div className="md-role">{m.role}{node ? ` · ${node.name}` : ''}</div>
                    </div>
                    <div className="md-tier" style={{ color: tier.color }}>{tier.label}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="welcome-hero">
        <div className="welcome-hero-inner">
          <div className="welcome-eyebrow">A mycelial economy</div>
          <h1 className="welcome-title">Tend a node.<br/><em>Nutrients flow.</em></h1>
          <p className="welcome-blurb">Spore is the living network beneath Fungai Art. Contribute to a node, earn $MYCEL, unlock experiences. The organism grows when you do.</p>

          {/* Email magic-link sign-in — primary entry */}
          <div style={{ marginTop:28, padding:'18px 20px', background:'rgba(15,16,20,0.7)', border:'0.5px solid var(--rule-strong)', borderRadius:14, maxWidth:480 }}>
            {sbUser ? (
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--spore)', boxShadow:'0 0 6px rgba(107,214,111,0.6)' }}></span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--mycelium-l)', flex:1 }}>Signed in as <strong>{sbUser.email}</strong></span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:9.5, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--mycelium-d)' }}>opening your profile…</span>
              </div>
            ) : signInSent ? (
              <div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.24em', textTransform:'uppercase', color:'var(--spore-l)', marginBottom:8 }}>✦ Magic link sent</div>
                <div style={{ fontSize:14, color:'var(--mycelium-l)', lineHeight:1.65, marginBottom:8 }}>Check your inbox at <strong>{signInEmail}</strong>. Click the link — it brings you straight back here, signed in.</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--mycelium-d)', lineHeight:1.6 }}>Didn't arrive in 2 minutes? Check spam, or <button onClick={() => { setSignInSent(false); setSignInEmail(''); }} style={{ background:'none', border:'none', color:'var(--nutrient-l)', cursor:'pointer', textDecoration:'underline', font:'inherit', padding:0 }}>try a different email</button>.</div>
              </div>
            ) : (
              <form onSubmit={handleSignIn}>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.24em', textTransform:'uppercase', color:'var(--nutrient-l)', marginBottom:6 }}>✦ Sign in or join</div>
                <div style={{ fontSize:13, color:'var(--mycelium)', lineHeight:1.65, marginBottom:14 }}>Enter your email. We send a magic link — no password, no installation. Founding members &amp; new threads alike.</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <input type="email" required value={signInEmail} onChange={e => setSignInEmail(e.target.value)} placeholder="your@email.com" style={{ flex:'1 1 220px', background:'var(--soil-3)', border:'0.5px solid var(--rule)', borderRadius:999, color:'var(--mycelium-l)', padding:'12px 18px', fontFamily:'var(--font-sans)', fontSize:14, outline:'none' }} autoComplete="email" />
                  <button type="submit" disabled={signInBusy} style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.24em', textTransform:'uppercase', padding:'12px 24px', borderRadius:999, background:'linear-gradient(135deg, var(--spore), var(--spore-d))', border:'none', color:'var(--soil)', cursor: signInBusy ? 'wait' : 'pointer', fontWeight:500, opacity: signInBusy ? 0.7 : 1 }}>
                    {signInBusy ? 'Sending…' : 'Send magic link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── Network map + nodes ── */}
      <div className="welcome-section">
        <div className="welcome-section-eyebrow">Active nodes · {liveNodes.length} live · 1 proposed</div>
        <div className="welcome-section-title">The <em>network.</em></div>

        {/* Living animated map */}
        <div style={{ background:'var(--soil-2)', border:'0.5px solid var(--rule)', borderRadius:12, overflow:'hidden', marginBottom:16, position:'relative' }}>
          <LivingNetworkMap
            nodes={SporeData.NETWORK_NODES}
            selected={null}
            onSelect={() => {}}
            flowIntensity={1.2}
          />
          <div style={{ position:'absolute', bottom:10, left:10, right:10, display:'flex', justifyContent:'space-between', alignItems:'flex-end', pointerEvents:'none' }}>
            <div style={{ background:'rgba(6,8,9,.7)', backdropFilter:'blur(8px)', border:'0.5px solid var(--rule)', borderRadius:6, padding:'6px 10px' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:8, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--mycelium-d)' }}>Nodes</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--mycelium-l)', marginTop:2 }}>{liveNodes.length} live · 1 proposed</div>
            </div>
            <div style={{ background:'rgba(6,8,9,.7)', backdropFilter:'blur(8px)', border:'0.5px solid var(--rule)', borderRadius:6, padding:'6px 10px' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:8, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--mycelium-d)' }}>Flow capacity</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--nutrient-l)', marginTop:2 }}>
                {SporeData.NETWORK_NODES.reduce((a,n) => a + n.contributions.reduce((b,c) => b + c.earn, 0), 0)} $H/cycle
              </div>
            </div>
          </div>
        </div>

        {/* Node cards */}
        <div className="welcome-nodes">
          {SporeData.NETWORK_NODES.map(node => {
            const isProposed = node.activity === 'proposed';
            const avgFlow = node.contributions.length
              ? Math.round(node.contributions.reduce((a,c) => a + c.earn, 0) / Math.max(1, node.contributions.length))
              : 0;
            return (
              <div key={node.id} className={`welcome-node ${isProposed ? 'proposed' : ''}`}>
                <div className="wn-top">
                  <div className="wn-dot" style={{ background: node.color }} />
                  <div className="wn-status">{isProposed ? 'proposed' : node.activity}</div>
                </div>
                <div className="wn-name">{node.name}</div>
                <div className="wn-sub">{node.sub}</div>
                {!isProposed && (
                  <div className="wn-flow">
                    <span className="wn-flow-val">{avgFlow} $H</span>
                    <span className="wn-flow-lbl">/avg</span>
                  </div>
                )}
                {isProposed && node.requirement && (
                  <div className="wn-req">{node.requirement}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Token philosophy ── */}
      <div className="welcome-section">
        <div className="welcome-section-eyebrow">Token architecture</div>
        <div className="welcome-section-title">How nutrients <em>flow.</em></div>
        <div className="welcome-philosophy">
          {PHILOSOPHY.map(p => (
            <div key={p.title} className="wp-card">
              <div className="wp-icon" style={{ color: p.color }}>{p.icon}</div>
              <div className="wp-title" style={{ color: p.color }}>{p.title}</div>
              <div className="wp-desc">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Flow steps ── */}
      <div className="welcome-section">
        <div className="welcome-section-eyebrow">How to participate</div>
        <div className="welcome-flow">
          {['Arrive', 'Contribute', 'Earn $MYCEL', 'Unlock access', 'Go deeper'].map((s, i) => (
            <div key={s} className="wf-step">
              <div className="wf-num">{i + 1}</div>
              <div className="wf-label">{s}</div>
              {i < 4 && <div className="wf-arrow">→</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="welcome-cta">
        <div style={{ position:'relative' }} ref={null}>
          <button className="welcome-cta-btn" onClick={() => setDropOpen(d => !d)}>
            Log in Hyphae ↗
          </button>
          <p className="welcome-cta-sub">Join the mycelium. Select your name, set a 4-digit code.</p>
        </div>
      </div>

      <div className="welcome-footer">
        <ProceduralMark size={24} />
        <div className="welcome-footer-fine">Fungai Art · tend · flow · unlock</div>
      </div>

      {selected && (
        <PinModal
          member={selected}
          onSuccess={() => onLogin(selected)}
          onCancel={() => setSelected(null)}
        />
      )}
    </div>
  );
}

/* ── TopBar ──────────────────────────────────────────────── */

function TopBar({ state, tier, tab, onTab, onWallet, currentMember, onLogout }) {
  const isAdmin = currentMember && currentMember.admin;
  const tabs = [
    { id:'network',  label:'Network',         icon:'◉' },
    { id:'calendar', label:'Calendar',        icon:'△' },
    { id:'shop',     label:'Apothecary',      icon:'🌿' },
    { id:'exp',      label:'Experiences',     icon:'✦' },
    { id:'members',  label:'Members',         icon:'◈' },
    { id:'academy',  label:'Alchemy Academy', icon:'⚗', accent:true, external:'/community/academy/' },
    { id:'store',    label:'Shop',            icon:'◎', external:'/shop' },
    ...(isAdmin ? [{ id:'admin', label:'Admin', icon:'⬡', adminTab:true }] : []),
  ];
  return (
    <div className="topbar">
      <div className="topbar-row">
        <div className="brand">
          <ProceduralMark />
          <div className="brand-text">
            <div className="brand-name">Spore</div>
            <div className="brand-sub">Living network · $MYCEL</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {currentMember && (
            <div className="topbar-member">
              <div className="topbar-member-avatar" style={{ background: tier.color }}>
                {currentMember.name[0]}
              </div>
              <div className="topbar-member-name">{currentMember.name}</div>
              <button className="topbar-logout" onClick={onLogout}>Sign out</button>
            </div>
          )}
          <button className="wallet-pill" onClick={onWallet}>
            <span className="wallet-rep-dot" style={{ background: tier.color }} />
            <div className="wallet-stack">
              <div className="wallet-bal">{state.balance} $H</div>
              <div className="wallet-cta">tap to flow</div>
            </div>
          </button>
        </div>
      </div>
      <div className="tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'on' : ''} ${t.accent ? 'tab-accent' : ''} ${t.adminTab ? 'tab-admin' : ''}`}
            onClick={() => {
              if (t.external) { window.open(t.external, '_blank'); return; }
              onTab(t.id);
            }}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── System stats ────────────────────────────────────────── */

function SystemStats({ state, tier, flowRate }) {
  const health   = Math.min(100, 40 + state.reputation * 6 + state.contributions * 3);
  const activity = Math.min(100, 25 + state.contributions * 8);
  return (
    <div className="sys-stats">
      <div className="sys-cell">
        <div className="sys-label"><span className="live-dot" /> Health</div>
        <div className="sys-val green">{health}%</div>
        <div className="sys-bar"><span style={{ width:`${health}%` }} /></div>
      </div>
      <div className="sys-cell">
        <div className="sys-label">Flow</div>
        <div className="sys-val amber">{flowRate.toFixed(1)}<span style={{ fontSize:10, color:'var(--mycelium-d)', marginLeft:4 }}>$H/s</span></div>
        <div className="sys-bar amber"><span style={{ width:`${Math.min(100, flowRate * 30)}%` }} /></div>
      </div>
      <div className="sys-cell">
        <div className="sys-label">Activity</div>
        <div className="sys-val blue">{activity}%</div>
        <div className="sys-bar blue"><span style={{ width:`${activity}%` }} /></div>
      </div>
    </div>
  );
}

/* ── Active nodes panel ───────────────────────────────────── */

function ActiveNodesPanel({ selected, onSelect }) {
  const live = SporeData.NETWORK_NODES.filter(n => n.activity !== 'proposed');
  return (
    <div className="active-nodes">
      <div className="an-head">
        <div className="an-head-title"><span className="live-dot" /> Active Nodes · {live.length}</div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--mycelium-d)' }}>tap to inspect</div>
      </div>
      {live.map(n => {
        const flow = (n.contributions.reduce((a, c) => a + c.earn, 0) / n.contributions.length).toFixed(0);
        return (
          <div key={n.id} className={`an-row ${selected === n.id ? 'selected' : ''}`} onClick={() => onSelect(n.id)}>
            <span className="an-pulse" style={{ background: n.color }} />
            <div className="an-info">
              <div className="an-name">{n.name}</div>
              <div className="an-meta">{n.sub}</div>
            </div>
            <div className="an-flow">
              <div>{flow} $H<span style={{ color:'var(--mycelium-d)' }}>/avg</span></div>
              <div className="lbl">flow</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Network page ─────────────────────────────────────────── */

function NetworkPage({ economy, onToast, flowRate }) {
  const [selected, setSelected] = useState('berlin');
  const node      = SporeData.NETWORK_NODES.find(n => n.id === selected);
  const liveCount = SporeData.NETWORK_NODES.filter(n => n.activity !== 'proposed').length;
  const totalFlow = SporeData.NETWORK_NODES.reduce((a, n) =>
    a + n.contributions.reduce((b, c) => b + c.earn, 0), 0);

  return (
    <div className="page-enter">
      <div className="section">
        <div className="section-eyebrow">A living substrate</div>
        <h2 className="section-title">The <em>network.</em></h2>
        <p className="section-blurb">A hidden, intelligent network beneath the surface. Tend a node — nutrients flow, the organism grows.</p>
      </div>

      <div className="net-canvas">
        <LivingNetworkMap
          nodes={SporeData.NETWORK_NODES}
          selected={selected}
          onSelect={setSelected}
          flowIntensity={Math.max(0.5, flowRate)}
        />
        <div className="net-overlay">
          <div className="net-overlay-stat">
            <div className="label-tiny">Nodes</div>
            <div className="v">{liveCount} live · 1 proposed</div>
          </div>
          <div className="net-overlay-stat">
            <div className="label-tiny">Capacity</div>
            <div className="v">{totalFlow} $H/cycle</div>
          </div>
        </div>
      </div>

      <ActiveNodesPanel selected={selected} onSelect={setSelected} />

      {node && node.activity !== 'proposed' && (
        <>
          <div className="section">
            <div className="section-eyebrow">{node.name} · contributions</div>
            <div style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:22, color:'var(--mycelium-l)', letterSpacing:'-0.02em', marginTop:4 }}>
              Tend the node.
            </div>
          </div>
          <div className="node-actions">
            {node.contributions.map(c => (
              <div key={c.id} className="contrib" onClick={() => {
                economy.earn(c.earn, `${c.label} @ ${node.name}`, c.rep || 1);
                onToast(`+${c.earn} $H · ${c.label}`, 'success');
              }}>
                <div className="contrib-l">
                  <div className="contrib-name">{c.label}</div>
                  <div className="contrib-sub">{c.sub}{c.rep ? ` · +${c.rep} rep` : ''}</div>
                </div>
                <div className="contrib-r">
                  <span className="contrib-earn">+{c.earn} $H</span>
                  <span className="contrib-arrow">→</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {node && node.activity === 'proposed' && (
        <div className="node-actions">
          <div style={{ background:'var(--soil-2)', padding:'14px 16px' }}>
            <div className="contrib-name">{node.name}</div>
            <div className="contrib-sub" style={{ marginTop:4 }}>Mycelial expansion</div>
            <p style={{ fontSize:12, color:'var(--mycelium)', lineHeight:1.6, marginTop:10, opacity:0.85 }}>{node.requirement}</p>
            <button className="btn btn-block" style={{ marginTop:12 }} disabled>Locked · need Forager</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Apothecary page — exclusive member editions ─────────── */

const EXCLUSIVE = [
  {
    id:'ex1', name:'Amanita Chocolate',
    sub:'Dark single-origin · spagyric extract',
    badge:'RARE · 12 units',
    bg:'#2A1A10',
    accent:'#C48838',
    desc:'72% Peru cacao infused with a micro-dose spagyric Amanita muscaria extract. Sourced, processed, and poured in the Berlin lab.',
    note:'Effects: warmth, dream-depth, creative clarity.',
    pEur:28, pH:20,
    vol:'2 × 15g bars',
    season:'Berlin LAB · Q2',
  },
  {
    id:'ex2', name:'Reishi Rose Gummies',
    sub:'Adaptogenic · floral',
    badge:'SEASONAL',
    bg:'#3A1828',
    accent:'#f9a8d4',
    desc:'Reishi dual-extract (4-hour decoction + alcohol) set in rose water and raw honey. Gentle immune modulation, heart calming.',
    note:'Dose: 2 gummies morning. 30-day supply.',
    pEur:34, pH:25,
    vol:'30 gummies',
    season:'Sweden + Berlin · Q3',
  },
  {
    id:'ex3', name:'Chaga & Pine Pollen Bar',
    sub:'Nordic wild-foraged · tonic',
    badge:'LIMITED',
    bg:'#1A2210',
    accent:'#7bd4a1',
    desc:'Cold-pressed Chaga (Sweden birch) with solar-harvested Pine Pollen. Melanin-rich antioxidant profile. No sugar — sweetened with raw dates.',
    note:'Effects: deep immunity, sustained energy, Yang vitality.',
    pEur:22, pH:16,
    vol:'40g block',
    season:'Sweden Foraging · seasonal',
  },
  {
    id:'ex4', name:'Blue Lotus Truffle',
    sub:'Ceremonial · sensory',
    badge:'VERY LIMITED · 6 left',
    bg:'#151830',
    accent:'#93c5fd',
    desc:'Hand-rolled cacao truffle with Egyptian Blue Lotus extract, Cardamom, and Saffron. A slow ritual chocolate for the evening.',
    note:'Effects: mild euphoria, sensory warmth, dream support.',
    pEur:18, pH:14,
    vol:'4 truffles',
    season:'Festival Circuit · handmade',
  },
  {
    id:'ex5', name:'Mycelium Trance Gummy',
    sub:'Pre-ceremony · grounding',
    badge:'EVENT ONLY',
    bg:'#0F1820',
    accent:'#6BD66F',
    desc:'Developed for Mycelium Trance ceremonies. Cordyceps + Reishi + L-theanine base. Calms CNS without sedation. Enhances sound sensitivity.',
    note:'Take 45 min before ceremony. One gummy.',
    pEur:12, pH:9,
    vol:'6 gummies',
    season:'Mycelium Trance events only',
  },
  {
    id:'ex6', name:'Lion\'s Mane Bark Bark',
    sub:'Cognitive · daily ritual',
    badge:'NEW',
    bg:'#1C1A14',
    accent:'#F5D689',
    desc:'Lion\'s Mane hot-water extract pressed into a bark-chocolate hybrid. Focused NGF stimulation, memory, creative flow. Daily micro-dose format.',
    note:'Effects: mental clarity, focus, nerve regeneration.',
    pEur:24, pH:18,
    vol:'20g × 2 bars',
    season:'Berlin LAB · year-round',
  },
];

function ApothecaryPage({ economy, onToast }) {
  return (
    <div className="page-enter">
      <div className="section">
        <div className="section-eyebrow">Member-only · exclusive editions</div>
        <h2 className="section-title">The <em>rarities.</em></h2>
        <p className="section-blurb">Not found in any shop. Small-batch gummies, chocolates, and ceremonial confections made in the Fungai Art labs. Available only to Hyphae members — pay in $H or €.</p>
      </div>

      {/* Exclusivity notice */}
      <div style={{ margin:'0 16px 4px', padding:'12px 16px', background:'rgba(232,177,75,.06)', border:'0.5px solid rgba(232,177,75,.25)', borderRadius:10, display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:18 }}>✦</span>
        <div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--nutrient-l)', marginBottom:3 }}>Member discount active</div>
          <div style={{ fontSize:11.5, color:'var(--mycelium)', opacity:.85 }}>Your {economy.state.balance} $H balance can be applied at checkout. Contributors pay in tokens and save vs the public price.</div>
        </div>
      </div>

      <div className="prod-grid" style={{ marginTop:14 }}>
        {EXCLUSIVE.map(p => {
          const owned   = economy.state.inventory.includes(p.id);
          const canPay  = economy.state.balance >= p.pH;
          return (
            <div key={p.id} className="prod-card" style={{ borderColor: owned ? p.accent + '55' : undefined }}>
              {/* Art panel */}
              <div className="prod-art" style={{ background: p.bg, border:`0.5px solid ${p.accent}22` }}>
                <div className="prod-art-stripe" />
                <div className="prod-art-glow" style={{ background:`radial-gradient(circle at 30% 30%, ${p.accent}33, transparent 60%)` }} />
                {/* Badge */}
                <div style={{ position:'absolute', top:8, left:8, fontFamily:'var(--font-mono)', fontSize:7, letterSpacing:'0.16em', textTransform:'uppercase', padding:'2px 7px', borderRadius:3, background:`${p.accent}22`, border:`0.5px solid ${p.accent}55`, color:p.accent }}>
                  {p.badge}
                </div>
                <div className="prod-art-label">
                  <div className="pl-name" style={{ color:p.accent }}>{p.name}</div>
                  <div className="pl-vol">{p.vol}</div>
                </div>
              </div>

              <div>
                <div className="prod-name">{p.name}</div>
                <div className="prod-cat">{p.sub}</div>
              </div>
              <div className="prod-desc">{p.desc}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.1em', color:p.accent, opacity:.8, marginBottom:4 }}>{p.note}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:8, letterSpacing:'0.1em', color:'var(--mycelium-d)', marginBottom:6 }}>◉ {p.season}</div>

              <div className="prod-price">
                <span className="prod-price-eur">€{p.pEur}</span>
                <span className="prod-price-h" style={{ color:p.accent }}>{p.pH} $H</span>
              </div>
              <button
                className={`prod-add ${owned ? 'bought' : ''}`}
                style={owned ? { background:p.accent, borderColor:p.accent, color:'var(--soil)' } : { borderColor:p.accent + '66', color:p.accent }}
                disabled={owned}
                onClick={() => {
                  if (canPay) {
                    economy.buy(p.id, p.name, p.pH);
                    onToast(`✦ ${p.name} claimed · ${p.pH} $H spent`, 'success');
                  } else {
                    onToast(`${p.name} added — pay €${p.pEur} at pickup`);
                  }
                }}
              >
                {owned ? '✓ Claimed' : (canPay ? `✦ Claim for ${p.pH} $H` : `Reserve · €${p.pEur}`)}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ margin:'20px 16px 0', padding:'12px 14px', background:'var(--soil-2)', border:'0.5px solid var(--rule)', borderRadius:8, textAlign:'center' }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--mycelium-d)', marginBottom:4 }}>Want something else?</div>
        <div style={{ fontSize:12, color:'var(--mycelium)' }}>All public products at <a href="/shop" style={{ color:'var(--spore-l)', textDecoration:'none' }}>fungai.art/shop</a> — member discount applies.</div>
      </div>
    </div>
  );
}

/* ── Experiences page ─────────────────────────────────────── */

function ExperiencesPage({ economy, onToast }) {
  const handle = (e, amount, isEarnBack) => {
    if (isEarnBack) {
      economy.earn(e.earnBack, `${e.title} · joined`, 1);
      onToast(`Joined ${e.title} · +${e.earnBack} $H`, 'success');
      return;
    }
    if (amount === 0) { onToast(`Applied to ${e.title}`); return; }
    if (economy.unlock(e.id, amount, e.title)) {
      onToast(`Unlocked: ${e.title} · access key minted`, 'success');
    } else { onToast(`Insufficient $H`); }
  };

  return (
    <div className="page-enter">
      <div className="section">
        <div className="section-eyebrow">Token-gated access</div>
        <h2 className="section-title">Experiences <em>& labs.</em></h2>
        <p className="section-blurb">Some open, some gated. Reputation and balance determine what blooms.</p>
      </div>
      <div className="exp-list">
        {SporeData.EXPERIENCES.map(e => {
          const repOk      = !e.repReq || economy.state.reputation >= e.repReq;
          const canAfford  = economy.state.balance >= e.minH;
          const unlockable = canAfford && repOk;
          const isUnlocked = economy.state.unlocked.includes(e.id);
          const tagCls = ({ open:'tag-spore', locked:'tag-mute', limited:'tag-amber', work:'tag-fungal' })[e.tag];

          return (
            <div key={e.id} className={`exp-card ${e.featured ? 'featured' : ''} ${isUnlocked ? 'unlocked' : ''}`}>
              <div className="exp-art" style={{ background: e.bg }}>
                <div className="exp-art-stripe" />
                <div className="exp-art-glow" />
                <div className="exp-art-label">
                  <span>experience photo</span>
                  <span>{e.id}</span>
                </div>
              </div>
              <div className="exp-body">
                <div className="exp-tag-row">
                  <span className={`tag ${tagCls}`}>{isUnlocked ? '✓ Unlocked' : e.tagLabel}</span>
                  {e.featured && <span className="tag tag-spore">Featured</span>}
                </div>
                <div className="exp-title">{e.title}</div>
                <div className="exp-desc">{e.desc}</div>
                <div className="exp-foot">
                  <div className="exp-price-stack">
                    {e.earnBack ? (
                      <span className="exp-price-free">Earn +{e.earnBack} $H</span>
                    ) : e.pEur === 0 ? (
                      <span className="exp-price-free">Free</span>
                    ) : e.pEur === null ? (
                      <span className="exp-price-h" style={{ fontSize:14 }}>{e.pH} $H · gated</span>
                    ) : (
                      <>
                        <span className="exp-price-eur">€{e.pEur}</span>
                        <span className="exp-price-h">or {e.pH} $H</span>
                      </>
                    )}
                  </div>
                  {isUnlocked ? (
                    <button className="btn btn-ghost">Reserve seat</button>
                  ) : e.earnBack ? (
                    <button className="btn btn-primary" onClick={() => handle(e, 0, true)}>Join + earn</button>
                  ) : e.minH === 0 ? (
                    <button className="btn btn-ghost" onClick={() => handle(e, 0, false)}>Apply</button>
                  ) : (
                    <button className="btn btn-primary" disabled={!unlockable} onClick={() => handle(e, e.pH, false)}>
                      Unlock — {e.pH} $H
                    </button>
                  )}
                </div>
                {!isUnlocked && !unlockable && e.minH > 0 && !e.earnBack && (
                  <div className="exp-lock-hint">
                    {!repOk ? `Reputation: needs ${e.repReq}+ pts` : `Need ${e.minH - economy.state.balance} more $H`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Profile Editor modal — inline character creation ────────── */

function ProfileEditor({ existing, onClose }) {
  const [name, setName]         = useState(existing?.character_name || '');
  const [bio, setBio]           = useState(existing?.bio || '');
  const [role, setRole]         = useState(existing?.role || '');
  const [location, setLocation] = useState(existing?.location || '');
  const [pronouns, setPronouns] = useState(existing?.pronouns || '');
  const [contact, setContact]   = useState(existing?.contact || '');
  const [avatar, setAvatar]     = useState(existing?.avatar || existing?.avatar_url || null);
  const [tags, setTags]         = useState(existing?.specialties || []);
  const [saving, setSaving]     = useState(false);
  const fileRef                 = useRef(null);

  const ROLES = [
    ['forager', 'Forager — wild plant gathering'],
    ['herbalist', 'Herbalist — traditional medicine'],
    ['alchemist', 'Alchemist — extraction & elixirs'],
    ['ceremony', 'Ceremony facilitator'],
    ['sound', 'Sound & frequency healer'],
    ['artist', 'Artist · creative collaborator'],
    ['patron', 'Patron — supporting the work'],
    ['collaborator', 'Collaborator — vendor / supplier'],
    ['student', 'Student — learning the craft'],
    ['seeker', 'Seeker — just beginning'],
    ['other', 'Other'],
  ];
  const LOCATIONS = [
    ['sweden','Sweden'],['berlin','Berlin'],['lisbon','Lisbon'],
    ['beirut','Beirut'],['genoa','Genoa'],['france','France'],
    ['germany','Germany (other)'],['denmark','Denmark'],
    ['other_europe','Elsewhere in Europe'],['other_world','Elsewhere in the world'],
  ];
  const ALL_TAGS = ['foraging','fungi','extraction','formulation','ceremony','sound','photography','writing','design','cooking','land','teaching','research','translation','organising','hospitality'];

  function toggleTag(t) { setTags(tags.includes(t) ? tags.filter(x => x !== t) : [...tags, t]); }

  function onAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) { alert('Image too large — please use one under 2MB.'); return; }
    const reader = new FileReader();
    reader.onload = ev => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function save() {
    if (!name.trim() || !role || !location) {
      alert('Please fill in your name, relation, and node before saving.');
      return;
    }
    setSaving(true);

    // If signed in to Supabase, save to the cloud (shared everywhere)
    if (window.SBclient && window.SBauth) {
      try {
        const user = await window.SBauth.getUser();
        if (!user) {
          // Not signed in — prompt sign-in flow
          const email = prompt('To save your profile so it appears everywhere, enter your email. We\'ll send you a magic link to confirm:');
          if (!email || !email.includes('@')) { setSaving(false); return; }
          const { error } = await window.SBauth.signIn(email);
          if (error) { alert('Sign-in failed: ' + error.message); setSaving(false); return; }
          alert('Check your inbox for a magic link from Supabase, then come back to this page and click "+ Create profile" again. Your form values will reset, sorry — sign-in only happens once.');
          setSaving(false);
          return;
        }

        // Upload avatar if it's a data URL (new image) rather than already a public URL
        let avatarUrl = avatar;
        if (avatar && avatar.startsWith('data:') && fileRef.current?.files?.[0]) {
          try {
            avatarUrl = await window.SBprofiles.uploadAvatar(fileRef.current.files[0]);
          } catch (e) {
            console.warn('Avatar upload failed, falling back to no avatar:', e);
            avatarUrl = null;
          }
        }

        const profile = {
          character_name: name.trim(),
          bio: bio.trim(),
          role, location,
          pronouns: pronouns.trim(),
          contact: contact.trim(),
          specialties: tags,
          avatar_url: avatarUrl,
          node: { sweden:'sweden', berlin:'berlin', lisbon:'lisbon', beirut:'beirut', genoa:'berlin', france:'berlin', germany:'berlin', denmark:'sweden', other_europe:'berlin', other_world:'festival' }[location] || 'berlin',
          focus: bio.trim() || (tags.length ? tags.join(' · ') : 'A new thread in the network'),
        };
        await window.SBprofiles.upsert(profile);

        // Also cache locally for instant first-paint next time
        try { localStorage.setItem('fungai_profile', JSON.stringify({ ...profile, avatar: avatarUrl })); } catch (e) {}

        setTimeout(() => { window.location.reload(); }, 600);
        return;
      } catch (err) {
        alert('Save failed: ' + (err.message || err));
        setSaving(false);
        return;
      }
    }

    // Fallback: localStorage only (Supabase not loaded for some reason)
    const profile = {
      character_name: name.trim(),
      bio: bio.trim(),
      role, location,
      pronouns: pronouns.trim(),
      contact: contact.trim(),
      specialties: tags,
      avatar,
      joined: existing?.joined || new Date().toISOString(),
      updated: new Date().toISOString(),
    };
    try { localStorage.setItem('fungai_profile', JSON.stringify(profile)); } catch (e) {}
    setTimeout(() => { window.location.reload(); }, 500);
  }

  const labelStyle = { fontFamily:'var(--font-mono)', fontSize:9.5, letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--nutrient)', marginBottom:8, display:'block' };
  const inputStyle = { width:'100%', background:'var(--soil-2)', border:'0.5px solid var(--rule)', borderRadius:8, color:'var(--mycelium-l)', padding:'12px 14px', fontFamily:'var(--font-sans)', fontSize:14, outline:'none' };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9000, background:'rgba(10,9,8,0.86)', backdropFilter:'blur(12px)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'40px 16px', overflowY:'auto' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width:'100%', maxWidth:540, background:'var(--soil-2)', border:'0.5px solid var(--rule-strong)', borderRadius:18, padding:'28px 26px', position:'relative', marginBottom:40 }}>

        <button onClick={onClose} style={{ position:'absolute', top:14, right:16, background:'none', border:'none', color:'var(--mycelium-d)', fontSize:22, cursor:'pointer', lineHeight:1, padding:6 }}>×</button>

        <div style={{ fontFamily:'var(--font-mono)', fontSize:9.5, letterSpacing:'0.28em', textTransform:'uppercase', color:'var(--spore-l)', marginBottom:8 }}>
          {existing ? '✦ Edit your thread' : '✦ Become a thread'}
        </div>
        <h2 style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:30, color:'var(--mycelium-l)', letterSpacing:'-0.01em', marginBottom:6, lineHeight:1.1 }}>
          {existing ? 'Update' : 'Create'} your <em style={{ color:'var(--nutrient)' }}>character</em>
        </h2>
        <p style={{ fontSize:13, color:'var(--mycelium)', lineHeight:1.7, marginBottom:24 }}>
          No wallet, no email, no installation. Your profile lives in your browser — fully under your control. Lasts as long as you don't clear site data.
        </p>

        {/* Avatar */}
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:22 }}>
          <label htmlFor="pe-avatar" style={{ width:80, height:80, borderRadius:'50%', background:'var(--soil-3)', border:'0.5px dashed var(--rule-strong)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', cursor:'pointer', flexShrink:0 }}>
            {avatar
              ? <img src={avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <span style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:28, color:'var(--mycelium-d)' }}>+</span>}
            <input ref={fileRef} id="pe-avatar" type="file" accept="image/*" onChange={onAvatarChange} style={{ display:'none' }} />
          </label>
          <div>
            <label htmlFor="pe-avatar" style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.22em', textTransform:'uppercase', padding:'8px 14px', borderRadius:999, background:'rgba(232,177,75,0.08)', border:'0.5px solid rgba(232,177,75,0.35)', color:'var(--nutrient-l)', cursor:'pointer' }}>Upload portrait</label>
            <div style={{ fontSize:11, color:'var(--mycelium-d)', marginTop:6, lineHeight:1.55 }}>Max 2MB. A photo, plant, mushroom, or symbol.</div>
          </div>
        </div>

        {/* Name */}
        <div style={{ marginBottom:18 }}>
          <label style={labelStyle}>Your name in the network</label>
          <input style={{ ...inputStyle, fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:22, padding:'14px 18px' }} value={name} onChange={e => setName(e.target.value)} placeholder="Robert" maxLength={50} />
        </div>

        {/* Bio */}
        <div style={{ marginBottom:18 }}>
          <label style={labelStyle}>A few words about you</label>
          <textarea style={{ ...inputStyle, minHeight:90, resize:'vertical', lineHeight:1.6 }} value={bio} onChange={e => setBio(e.target.value)} placeholder="What you bring, how you came to the forest, what excites you about plants and fungi…" maxLength={400} />
        </div>

        {/* Role + Location */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:18 }}>
          <div>
            <label style={labelStyle}>Your relation</label>
            <select style={{ ...inputStyle, cursor:'pointer' }} value={role} onChange={e => setRole(e.target.value)}>
              <option value="" disabled>Choose…</option>
              {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Your node</label>
            <select style={{ ...inputStyle, cursor:'pointer' }} value={location} onChange={e => setLocation(e.target.value)}>
              <option value="" disabled>Where you grow…</option>
              {LOCATIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div style={{ marginBottom:18 }}>
          <label style={labelStyle}>What you bring · tap any</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {ALL_TAGS.map(t => {
              const on = tags.includes(t);
              return (
                <button key={t} type="button" onClick={() => toggleTag(t)} style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', padding:'7px 12px', borderRadius:999, background: on ? 'rgba(168,143,224,0.14)' : 'var(--soil-3)', border: on ? '0.5px solid rgba(168,143,224,0.5)' : '0.5px solid var(--rule)', color: on ? '#C5B5F5' : 'var(--mycelium-d)', cursor:'pointer' }}>{t}</button>
              );
            })}
          </div>
        </div>

        {/* Pronouns + Contact */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>
          <div>
            <label style={labelStyle}>Pronouns (optional)</label>
            <input style={inputStyle} value={pronouns} onChange={e => setPronouns(e.target.value)} placeholder="she/her · they/them" maxLength={30} />
          </div>
          <div>
            <label style={labelStyle}>Contact (optional)</label>
            <input style={inputStyle} value={contact} onChange={e => setContact(e.target.value)} placeholder="email · @insta · signal" maxLength={80} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:18, borderTop:'0.5px solid var(--rule)' }}>
          <button type="button" onClick={onClose} style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', padding:'12px 22px', borderRadius:999, background:'none', border:'0.5px solid var(--rule)', color:'var(--mycelium-d)', cursor:'pointer' }}>Cancel</button>
          <button type="button" onClick={save} disabled={saving} style={{ fontFamily:'var(--font-mono)', fontSize:10.5, letterSpacing:'0.24em', textTransform:'uppercase', padding:'12px 28px', borderRadius:999, border:'none', cursor: saving ? 'wait' : 'pointer', background:'linear-gradient(135deg, var(--spore), var(--spore-d))', color:'var(--soil)', fontWeight:500, opacity: saving ? 0.6 : 1 }}>
            {saving ? '✦ Saving…' : (existing ? '✦ Update thread' : '✦ Become a thread')}
          </button>
        </div>

      </div>
    </div>
  );
}

/* ── Members page ─────────────────────────────────────────── */

function MembersPage({ currentMember, economy }) {
  const focusKey  = (id) => `spore_focus_${id}`;
  const contribKey= (id) => `spore_contrib_level_${id}`;
  const salesKey  = (id) => `spore_sales_${id}`;

  const [myFocus,   setMyFocus]   = useState(() => { try { return localStorage.getItem(focusKey(currentMember.id)) || ''; } catch { return ''; } });
  const [myContrib, setMyContrib] = useState(() => { try { return Number(localStorage.getItem(contribKey(currentMember.id)) || 3); } catch { return 3; } });
  const [viewProfile, setViewProfile] = useState(null); // admin: member being viewed
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  function pickFocus(id) {
    try { localStorage.setItem(focusKey(currentMember.id), id); } catch {}
    setMyFocus(id);
  }

  function saveContrib(val) {
    setMyContrib(val);
    try { localStorage.setItem(contribKey(currentMember.id), val); } catch {}
  }

  function getMemberState(id) {
    try { const r = localStorage.getItem(`spore_state_${id}`); return r ? JSON.parse(r) : null; } catch { return null; }
  }

  function getMemberSales(id) {
    try { const r = localStorage.getItem(salesKey(id)); return r ? JSON.parse(r) : []; } catch { return []; }
  }

  function getContribLevel(id) {
    try { return Number(localStorage.getItem(contribKey(id)) || 0); } catch { return 0; }
  }

  const CONTRIB_LABELS = ['Not active','Minimal','Part-time','Regular','Full dedication','Leading the node'];

  const isAdmin = currentMember.admin;

  // Admin profile modal
  if (viewProfile && isAdmin) {
    const m     = viewProfile;
    const st    = getMemberState(m.id);
    const bal   = st ? st.balance   : m.balance;
    const rep   = st ? st.reputation: m.rep;
    const contribs = st ? st.contributions : 0;
    const tier  = SporeData.reputationTier(rep);
    const node  = SporeData.NETWORK_NODES.find(n => n.id === m.node);
    const sales = getMemberSales(m.id);
    const focus = localStorage.getItem(focusKey(m.id)) || '';
    const level = getContribLevel(m.id);
    const ct    = SporeData.CONTRIBUTION_TYPES ? SporeData.CONTRIBUTION_TYPES.find(c => c.id === focus) : null;
    const history = st ? (st.history || []) : [];
    const totalSales = sales.reduce((a,s) => a + (s.amount || 0), 0);

    return (
      <div className="page-enter">
        <button onClick={() => setViewProfile(null)} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'var(--mycelium-d)', fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', cursor:'pointer', margin:'14px 16px 0', padding:'6px 0' }}>
          ← Back to members
        </button>
        <div style={{ margin:'12px 16px 0', background:'var(--soil-2)', border:'0.5px solid var(--rule-strong)', borderRadius:16, padding:'20px 18px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:tier.color, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:24, fontStyle:'italic', color:'rgba(255,255,255,.9)', flexShrink:0 }}>{m.name[0]}</div>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:24, color:'var(--mycelium-l)', letterSpacing:'-.02em', lineHeight:1 }}>{m.name}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--mycelium-d)', marginTop:4 }}>{m.role}</div>
              {node && <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--mycelium-d)', marginTop:2 }}>◉ {node.name}</div>}
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
            {[
              {l:'Balance', v:`${bal} $H`, c:'var(--spore-l)'},
              {l:'Rep', v:`${rep} pts`, c:tier.color},
              {l:'Contributions', v:contribs, c:'var(--mycelium-l)'},
              {l:'Sales', v:`€${totalSales}`, c:'var(--nutrient-l)'},
            ].map(s => (
              <div key={s.l} style={{ background:'var(--soil-3)', border:'0.5px solid var(--rule)', borderRadius:8, padding:'9px 10px', textAlign:'center' }}>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:s.c }}>{s.v}</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:7.5, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--mycelium-d)', marginTop:2 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Contribution level */}
          <div style={{ marginBottom:14, padding:'10px 12px', background:'var(--soil-3)', borderRadius:8, border:'0.5px solid var(--rule)' }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:8, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--mycelium-d)', marginBottom:4 }}>Contribution level</div>
            <div style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:17, color:'var(--mycelium-l)' }}>{CONTRIB_LABELS[level] || '—'}</div>
            <div style={{ display:'flex', gap:3, marginTop:6 }}>
              {[1,2,3,4,5].map(i => <div key={i} style={{ height:3, flex:1, borderRadius:2, background: i <= level ? 'var(--spore)' : 'var(--soil-4)' }} />)}
            </div>
            {ct && <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, color:'var(--spore-l)', marginTop:5 }}>{ct.icon} {ct.label}</div>}
          </div>

          {/* Activity log */}
          <div style={{ fontFamily:'var(--font-mono)', fontSize:8, letterSpacing:'.16em', textTransform:'uppercase', color:'var(--mycelium-d)', marginBottom:8 }}>Recent activity</div>
          <div style={{ background:'var(--soil-3)', border:'0.5px solid var(--rule)', borderRadius:8, overflow:'hidden', marginBottom:12 }}>
            {history.length === 0 ? (
              <div style={{ padding:'14px', textAlign:'center', color:'var(--mycelium-d)', fontSize:11, fontStyle:'italic' }}>No activity recorded</div>
            ) : history.slice(0,6).map((h, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderBottom: i < Math.min(5, history.length-1) ? '0.5px solid var(--rule)' : 'none' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background: h.type==='earn' ? 'var(--spore)' : h.type==='unlock' ? 'var(--fungal)' : 'var(--nutrient)', flexShrink:0 }} />
                <div style={{ flex:1, fontSize:11, color:'var(--mycelium)' }}>{h.label}</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color: h.delta > 0 ? 'var(--spore-l)' : 'var(--mycelium-d)' }}>{h.delta > 0 ? '+':''}{h.delta} $H</div>
              </div>
            ))}
          </div>

          {/* Sales */}
          {sales.length > 0 && (
            <>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:8, letterSpacing:'.16em', textTransform:'uppercase', color:'var(--mycelium-d)', marginBottom:8 }}>Sales logged</div>
              <div style={{ background:'var(--soil-3)', border:'0.5px solid var(--rule)', borderRadius:8, overflow:'hidden' }}>
                {sales.slice(0,5).map((s, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderBottom: i < Math.min(4, sales.length-1) ? '0.5px solid var(--rule)' : 'none' }}>
                    <div style={{ flex:1, fontSize:11, color:'var(--mycelium)' }}>{s.note || s.label || 'Sale'}</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--nutrient-l)' }}>€{s.amount}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Read the visitor's own profile (saved locally as cache; real source is Supabase)
  const myProfile = (() => { try { return JSON.parse(localStorage.getItem('fungai_profile') || 'null'); } catch { return null; } })();

  // Supabase auth state
  const [sbUser, setSbUser] = useState(null);
  const [signInEmail, setSignInEmail] = useState('');
  const [signInBusy, setSignInBusy] = useState(false);
  useEffect(() => {
    if (!window.SBauth) return;
    let unsub;
    (async () => {
      const u = await window.SBauth.getUser();
      setSbUser(u);
      const sub = window.SBauth.onAuthChange(({ user }) => setSbUser(user));
      unsub = sub?.data?.subscription?.unsubscribe?.bind(sub.data.subscription);
    })();
    return () => { if (unsub) try { unsub(); } catch {} };
  }, []);
  async function handleSignIn(e) {
    e.preventDefault();
    if (!signInEmail.includes('@')) { alert('Enter a valid email'); return; }
    setSignInBusy(true);
    const { error } = await window.SBauth.signIn(signInEmail);
    setSignInBusy(false);
    if (error) { alert('Sign-in failed: ' + error.message); return; }
    alert('Magic link sent to ' + signInEmail + '. Open your inbox on this device, click the link, you\'ll come back here signed in.');
    setSignInEmail('');
  }
  async function handleSignOut() {
    await window.SBauth.signOut();
    setSbUser(null);
  }

  return (
    <div className="page-enter">
      {showProfileEditor && <ProfileEditor existing={myProfile} onClose={() => setShowProfileEditor(false)} />}

      <div className="section">
        <div className="section-eyebrow">The organism</div>
        <h2 className="section-title">Who's <em>tending.</em></h2>
        <p className="section-blurb">Each hyphae brings a different thread to the mycelium.</p>
      </div>

      {/* Self-onboard / edit profile card */}
      <div style={{ margin:'0 16px 12px', background: myProfile ? 'linear-gradient(160deg, rgba(107,214,111,0.06), rgba(107,214,111,0.02))' : 'linear-gradient(160deg, rgba(232,177,75,0.06), rgba(232,177,75,0.02))', border: myProfile ? '0.5px solid rgba(107,214,111,0.25)' : '0.5px solid rgba(232,177,75,0.3)', borderRadius:12, padding:'16px 18px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
        <div style={{ flex:'1 1 200px', minWidth:0 }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.22em', textTransform:'uppercase', color: myProfile ? 'var(--spore-l)' : 'var(--nutrient-l)', marginBottom:4 }}>
            {myProfile ? '✦ Your thread' : '✦ Add yourself'}
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:18, color:'var(--mycelium-l)', lineHeight:1.3 }}>
            {myProfile ? myProfile.character_name : 'Become a thread in the mycelium'}
          </div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9.5, color:'var(--mycelium-d)', marginTop:3, letterSpacing:'0.04em' }}>
            {myProfile ? `${myProfile.role || ''}${myProfile.location ? ' · ' + myProfile.location : ''}` : 'Set up your character — no wallet, no installation. ~3 minutes.'}
          </div>
        </div>
        <button
          onClick={() => setShowProfileEditor(true)}
          style={{ fontFamily:'var(--font-mono)', fontSize:9.5, letterSpacing:'0.24em', textTransform:'uppercase', padding:'11px 22px', borderRadius:999, border:'none', cursor:'pointer', background: myProfile ? 'rgba(107,214,111,0.12)' : 'linear-gradient(135deg, var(--nutrient), var(--nutrient-d))', color: myProfile ? 'var(--spore-l)' : 'var(--soil)', whiteSpace:'nowrap', fontWeight:500 }}
        >
          {myProfile ? 'Edit profile' : '+ Create profile'}
        </button>
      </div>

      {/* Supabase sign-in / sign-out — required for the profile to be live everywhere */}
      <div style={{ margin:'0 16px 12px', background:'var(--soil-2)', border:'0.5px solid var(--rule)', borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        {sbUser ? (
          <>
            <div style={{ flex:'1 1 200px', minWidth:0 }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:7.5, letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--spore-d)', marginBottom:3 }}>● Signed in · profile syncs everywhere</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--mycelium-l)' }}>{sbUser.email}</div>
            </div>
            <button onClick={handleSignOut} style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', padding:'8px 16px', borderRadius:999, background:'none', border:'0.5px solid var(--rule-strong)', color:'var(--mycelium-d)', cursor:'pointer' }}>Sign out</button>
          </>
        ) : (
          <>
            <div style={{ flex:'1 1 100%', marginBottom:8 }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:7.5, letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--mycelium-d)', marginBottom:3 }}>○ Not signed in · profile is local only</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--mycelium-d)', lineHeight:1.5 }}>Sign in with your email to make your profile visible everywhere &amp; access it from any device. We send you a magic link — no password.</div>
            </div>
            <form onSubmit={handleSignIn} style={{ display:'flex', gap:6, flex:'1 1 100%', flexWrap:'wrap' }}>
              <input type="email" value={signInEmail} onChange={e => setSignInEmail(e.target.value)} placeholder="your@email.com" required style={{ flex:'1 1 200px', background:'var(--soil-3)', border:'0.5px solid var(--rule)', borderRadius:999, color:'var(--mycelium-l)', padding:'9px 16px', fontFamily:'var(--font-sans)', fontSize:13, outline:'none' }} />
              <button type="submit" disabled={signInBusy} style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.22em', textTransform:'uppercase', padding:'9px 18px', borderRadius:999, background:'linear-gradient(135deg, var(--spore), var(--spore-d))', border:'none', color:'var(--soil)', cursor: signInBusy ? 'wait' : 'pointer', opacity: signInBusy ? 0.7 : 1 }}>
                {signInBusy ? 'Sending…' : '✦ Send magic link'}
              </button>
            </form>
          </>
        )}
      </div>

      {/* My contribution type */}
      <div style={{ margin:'0 16px 4px', background:'var(--soil-2)', border:'0.5px solid var(--rule)', borderRadius:10, padding:'14px 16px' }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--mycelium-d)', marginBottom:10 }}>Your work node</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
          {SporeData.CONTRIBUTION_TYPES.map(ct => {
            const isOn = myFocus === ct.id;
            return (
              <button key={ct.id} onClick={() => pickFocus(ct.id)} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderRadius:7, border: isOn ? '1px solid var(--spore-d)' : '0.5px solid var(--rule)', background: isOn ? 'rgba(107,214,111,0.08)' : 'var(--soil-3)', cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}>
                <span style={{ fontSize:16 }}>{ct.icon}</span>
                <div>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color: isOn ? 'var(--spore-l)' : 'var(--mycelium-l)', fontWeight: isOn ? 600 : 400 }}>{ct.label}</div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:8, letterSpacing:'0.1em', color:'var(--mycelium-d)', marginTop:1 }}>{ct.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* My contribution level slider — private */}
        <div className="contrib-slider-wrap" style={{ marginTop:10 }}>
          <div className="cs-label">
            <span>My weekly contribution level</span>
            <span className="cs-val">{CONTRIB_LABELS[myContrib]}</span>
          </div>
          <input
            type="range"
            className="cs-range"
            min={0} max={5}
            value={myContrib}
            onChange={e => saveContrib(Number(e.target.value))}
          />
          <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--mycelium-d)', marginTop:4, letterSpacing:'0.1em' }}>Visible only to you and Robin.</div>
        </div>
      </div>

      <div className="members-grid">
        {SporeData.MEMBERS.map(m => {
          const tier   = SporeData.reputationTier(m.rep);
          const node   = SporeData.NETWORK_NODES.find(n => n.id === m.node);
          const focus  = m.id === currentMember.id ? myFocus : ((() => { try { return localStorage.getItem(focusKey(m.id)) || ''; } catch { return ''; } })());
          const ct     = focus ? SporeData.CONTRIBUTION_TYPES.find(c => c.id === focus) : null;
          const isMe   = m.id === currentMember.id;
          const level  = m.id === currentMember.id ? myContrib : (isAdmin ? getContribLevel(m.id) : null);
          return (
            <div
              key={m.id}
              className={`member-card ${isMe ? 'member-card-me' : ''}`}
              style={{ cursor: isAdmin && !isMe ? 'pointer' : 'default' }}
              onClick={() => { if (isAdmin && !isMe) setViewProfile(m); }}
            >
              <div className="member-avatar" style={{ background: tier.color }}>{m.name[0]}</div>
              <div className="member-body">
                <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                  <div className="member-name">{m.name}</div>
                  {m.founding && <span style={{ fontFamily:'var(--font-mono)', fontSize:7.5, letterSpacing:'0.16em', background:'linear-gradient(135deg, rgba(232,177,75,0.18), rgba(232,177,75,0.08))', border:'0.5px solid rgba(232,177,75,0.45)', borderRadius:3, padding:'2px 6px', color:'#F5D689' }}>FOUNDING</span>}
                  {m.admin && <span style={{ fontFamily:'var(--font-mono)', fontSize:7.5, letterSpacing:'0.14em', background:'rgba(201,184,148,0.12)', border:'0.5px solid var(--rule-strong)', borderRadius:3, padding:'1px 5px', color:'var(--mycelium-d)' }}>ADMIN</span>}
                  {isAdmin && !isMe && <span style={{ fontFamily:'var(--font-mono)', fontSize:7.5, color:'var(--mycelium-d)', marginLeft:'auto' }}>tap ↗</span>}
                </div>
                <div className="member-role">{m.role}</div>
                {node && <div className="member-node">{node.name}</div>}
                {ct && <div style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 7px', borderRadius:4, background:'rgba(107,214,111,0.07)', border:'0.5px solid var(--spore-d)', marginBottom:5, fontSize:10, color:'var(--spore-l)', fontFamily:'var(--font-mono)', letterSpacing:'0.1em' }}>{ct.icon} {ct.label}</div>}
                <div className="member-focus">{m.focus}</div>
                {/* Contribution level bar — shown to self always, to admin for all */}
                {level !== null && level > 0 && (
                  <div style={{ marginTop:6, marginBottom:4 }}>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:7.5, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--mycelium-d)', marginBottom:3 }}>
                      {isMe ? 'My level · ' : ''}{CONTRIB_LABELS[level]}
                    </div>
                    <div style={{ display:'flex', gap:2 }}>
                      {[1,2,3,4,5].map(i => <div key={i} style={{ height:2.5, flex:1, borderRadius:1.5, background: i <= level ? 'var(--spore)' : 'var(--soil-4)', boxShadow: i <= level ? '0 0 4px rgba(107,214,111,0.4)' : 'none' }} />)}
                    </div>
                  </div>
                )}
                <div className="member-stats">
                  <div className="member-stat">
                    <span className="member-stat-val" style={{ color: tier.color }}>{tier.label}</span>
                    <span className="member-stat-lbl">tier</span>
                  </div>
                  <div className="member-stat">
                    <span className="member-stat-val">{m.balance} $H</span>
                    <span className="member-stat-lbl">balance</span>
                  </div>
                  <div className="member-stat">
                    <span className="member-stat-val">{m.rep} pts</span>
                    <span className="member-stat-lbl">rep</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Journal page ─────────────────────────────────────────── */

function JournalPage({ economy, currentMember }) {
  const history = economy.state.history;
  const tier    = SporeData.reputationTier(economy.state.reputation);

  function fmtTime(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('en-GB', { day:'numeric', month:'short' })
      + ' · ' + d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
  }

  return (
    <div className="page-enter">
      <div className="section">
        <div className="section-eyebrow">Your thread</div>
        <h2 className="section-title">The <em>journal.</em></h2>
        <p className="section-blurb">Every earn, unlock, and purchase leaves a trace. The organism remembers.</p>
      </div>

      {/* Stats */}
      <div style={{ margin:'0 16px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:8 }}>
        {[
          { label:'Balance', val:`${economy.state.balance} $H`, color:'var(--spore-l)' },
          { label:'Reputation', val:`${economy.state.reputation} pts`, color: tier.color },
          { label:'Contributions', val:economy.state.contributions, color:'var(--mycelium-l)' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--soil-2)', border:'0.5px solid var(--rule)', borderRadius:8, padding:'11px 10px', textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:13, color:s.color, fontVariantNumeric:'tabular-nums' }}>{s.val}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:8, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--mycelium-d)', marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tier */}
      <div style={{ margin:'10px 16px 0', padding:'12px 14px', background:'var(--soil-2)', border:`0.5px solid ${tier.color}44`, borderRadius:8, display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:10, height:10, borderRadius:'50%', background:tier.color, boxShadow:`0 0 8px ${tier.color}` }} />
        <div style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:17, color:'var(--mycelium-l)' }}>{tier.label}</div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--mycelium-d)', marginLeft:'auto' }}>current tier</div>
      </div>

      {/* History */}
      <div className="section" style={{ paddingBottom:0 }}>
        <div className="section-eyebrow">Activity log</div>
      </div>
      <div style={{ margin:'8px 16px 0', background:'var(--soil-2)', border:'0.5px solid var(--rule)', borderRadius:10, overflow:'hidden' }}>
        {history.length === 0 && (
          <div style={{ padding:'28px 16px', textAlign:'center', color:'var(--mycelium-d)', fontSize:12, fontStyle:'italic' }}>No activity yet. Start by tending a node.</div>
        )}
        {history.map((h, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderBottom: i < history.length-1 ? '0.5px solid var(--rule)' : 'none' }}>
            <div style={{ width:7, height:7, borderRadius:'50%', flexShrink:0, background: h.type==='earn' ? 'var(--spore)' : h.type==='unlock' ? 'var(--fungal)' : 'var(--nutrient)' }} />
            <div style={{ flex:1, fontSize:12, color:'var(--mycelium)', lineHeight:1.3 }}>{h.label}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color: h.delta > 0 ? 'var(--spore-l)' : 'var(--mycelium-d)', fontVariantNumeric:'tabular-nums', flexShrink:0 }}>
              {h.delta > 0 ? '+' : ''}{h.delta} $H
            </div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--mycelium-d)', flexShrink:0, whiteSpace:'nowrap' }}>{fmtTime(h.ts)}</div>
          </div>
        ))}
      </div>

      <button className="reset-link" onClick={economy.reset}>↺ Reset my data</button>
    </div>
  );
}

/* ── Admin page ───────────────────────────────────────────── */

function AdminPage({ onToast }) {
  const [announcement, setAnnouncement] = useState(() => {
    try { return localStorage.getItem('spore_announcement') || ''; } catch { return ''; }
  });
  const [saved, setSaved] = useState(false);

  function saveAnnouncement() {
    try { localStorage.setItem('spore_announcement', announcement); } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onToast('Announcement published', 'success');
  }

  function getMemberState(id) {
    try {
      const raw = localStorage.getItem(`spore_state_${id}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  return (
    <div className="page-enter">
      <div className="section">
        <div className="section-eyebrow">Founder access</div>
        <h2 className="section-title">Admin <em>panel.</em></h2>
      </div>

      {/* Announcement */}
      <div style={{ margin:'8px 16px 0', background:'var(--soil-2)', border:'0.5px solid var(--rule)', borderRadius:10, padding:'16px' }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--mycelium-d)', marginBottom:8 }}>Network announcement</div>
        <textarea
          value={announcement}
          onChange={e => setAnnouncement(e.target.value)}
          maxLength={280}
          rows={3}
          placeholder="Message shown to all members on login…"
          style={{ width:'100%', background:'var(--soil-3)', border:'0.5px solid var(--rule)', borderRadius:6, padding:'10px 12px', color:'var(--mycelium-l)', fontSize:13, lineHeight:1.5, resize:'none', outline:'none', fontFamily:'var(--font-sans)', boxSizing:'border-box', marginBottom:10 }}
        />
        <button
          onClick={saveAnnouncement}
          className="btn btn-primary"
          style={{ width:'100%' }}
        >
          {saved ? '✓ Published' : 'Publish to network'}
        </button>
      </div>

      {/* Member overview */}
      <div className="section" style={{ paddingBottom:0 }}>
        <div className="section-eyebrow">All hyphae</div>
      </div>
      <div style={{ margin:'8px 16px 0', background:'var(--soil-2)', border:'0.5px solid var(--rule)', borderRadius:10, overflow:'hidden' }}>
        {SporeData.MEMBERS.map((m, i) => {
          const st   = getMemberState(m.id);
          const bal  = st ? st.balance  : m.balance;
          const rep  = st ? st.reputation : m.rep;
          const tier = SporeData.reputationTier(rep);
          return (
            <div key={m.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderBottom: i < SporeData.MEMBERS.length-1 ? '0.5px solid var(--rule)' : 'none' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:tier.color, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:16, color:'rgba(255,255,255,0.9)', flexShrink:0 }}>{m.name[0]}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:16, color:'var(--mycelium-l)', lineHeight:1 }}>
                  {m.name} {m.admin && <span style={{ fontFamily:'var(--font-mono)', fontSize:8, letterSpacing:'0.14em', color:tier.color, verticalAlign:'middle' }}>ADMIN</span>}
                </div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--mycelium-d)', marginTop:2 }}>{m.role}</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--spore-l)' }}>{bal} $H</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color: tier.color, marginTop:1 }}>{tier.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── (Alchemy Academy is now a standalone page at /community/academy/) ── */

const METHODS = [
  {
    id: 'spagyric',
    name: 'Spagyric',
    tag: 'PARACELSUS · 16TH C.',
    color: '#C48838',
    desc: 'Separate, purify, recombine. The plant is split into its three philosophical principles — sulfur (essence), mercury (spirit), salt (body) — then reunited into a potentised whole.',
    steps: ['Macerate in alcohol 4–6 wks', 'Distil the alcohol (spirit)', 'Calcine the marc to white ash', 'Dissolve ash back into the tincture'],
    ratio: '1:5 plant to solvent',
    time: '6–10 weeks',
  },
  {
    id: 'tincture',
    name: 'Cold Tincture',
    tag: 'FOLK HERBALISM',
    color: '#3B6D11',
    desc: 'The foundational extraction. Fresh or dried plant material macerated in ethanol, drawing out both water and alcohol soluble constituents. Simple, reliable, broad-spectrum.',
    steps: ['Chop or grind plant material', 'Cover with 40–60% ethanol', 'Macerate 2–6 weeks, shaking daily', 'Press and filter'],
    ratio: '1:3 fresh · 1:5 dry',
    time: '2–6 weeks',
  },
  {
    id: 'decoction',
    name: 'Decoction',
    tag: 'ROOT · BARK · RESIN',
    color: '#7A4F2E',
    desc: 'Long simmering to break down tough cellular material. Roots, bark, and woody mushrooms yield their medicine slowly to water under sustained heat.',
    steps: ['Cold-water soak 30 min', 'Bring to gentle simmer', 'Reduce by 1/3 over 45–90 min', 'Strain while hot, press marc'],
    ratio: '1:20 plant to water',
    time: '1.5–2 hours active',
  },
  {
    id: 'doubleextract',
    name: 'Double Extraction',
    tag: 'FUNGI · POLYSACCHARIDES',
    color: '#0F6E56',
    desc: 'Hot water pulls the beta-glucans; alcohol captures the triterpenes. Essential for reishi, chaga, turkey tail — no single solvent gets everything.',
    steps: ['Decoct in water 2–4 hrs', 'Cool completely', 'Combine 1:1 with 95% ethanol tincture', 'Final 25–30% alcohol content'],
    ratio: '1:1 decoction to tincture',
    time: '4–8 weeks total',
  },
  {
    id: 'oleo',
    name: 'Oleoresin',
    tag: 'HEAT · FAT-SOLUBLE',
    color: '#534AB7',
    desc: 'Fat-soluble constituents — essential oils, resins, fat-soluble vitamins — require a lipid carrier. Slow infusion in a stable oil preserves volatile aromatics.',
    steps: ['Dry plant material thoroughly', 'Infuse in olive or MCT oil 60°C', 'Hold temperature 4–8 hours', 'Strain and store dark'],
    ratio: '1:8 plant to oil',
    time: '4–8 hours',
  },
];

function AcademyPage({ economy }) {
  const [openMethod, setOpenMethod] = useState(null);
  const tier = SporeData.reputationTier(economy.state.reputation);

  return (
    <div className="page-enter">
      <div className="section">
        <div className="section-eyebrow">Member access only · {tier.label}</div>
        <h2 className="section-title">Alchemy <em>Academy.</em></h2>
        <p className="section-blurb">Extraction science meets plant intelligence. Five methods, their philosophy, their practice. Your $H balance grows as you go deeper.</p>
      </div>

      {/* Link to Herbal Engine */}
      <div style={{ margin:'0 16px 4px', background:'linear-gradient(135deg, rgba(232,177,75,0.08), rgba(107,214,111,0.05))', border:'0.5px solid var(--nutrient-d)', borderRadius:12, padding:'16px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--nutrient-l)', marginBottom:5 }}>Interactive tool</div>
          <div style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:20, color:'var(--mycelium-l)', letterSpacing:'-0.02em' }}>Herbal Blending Engine</div>
          <div style={{ fontSize:11.5, color:'var(--mycelium)', marginTop:4, opacity:0.8 }}>Build formulas, explore synergies, save your blends.</div>
        </div>
        <a href="/mixology" style={{ flexShrink:0, display:'inline-flex', alignItems:'center', gap:6, fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', padding:'10px 14px', border:'0.5px solid var(--nutrient-d)', borderRadius:6, background:'rgba(232,177,75,0.1)', color:'var(--nutrient-l)', textDecoration:'none', transition:'all 0.18s' }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(232,177,75,0.2)'; e.currentTarget.style.borderColor='var(--nutrient)'; }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(232,177,75,0.1)'; e.currentTarget.style.borderColor='var(--nutrient-d)'; }}
        >
          Open →
        </a>
      </div>

      {/* Extraction methods */}
      <div className="section" style={{ paddingBottom:0 }}>
        <div className="section-eyebrow">Five extraction methods</div>
        <div style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:22, color:'var(--mycelium-l)', letterSpacing:'-0.02em', marginTop:4 }}>Know your solvents.</div>
      </div>

      <div style={{ margin:'12px 16px 0', display:'flex', flexDirection:'column', gap:1, background:'var(--rule)', borderRadius:10, overflow:'hidden', border:'0.5px solid var(--rule)' }}>
        {METHODS.map(m => {
          const isOpen = openMethod === m.id;
          return (
            <div key={m.id} style={{ background:'var(--soil-2)', transition:'background 0.15s' }}>
              <div
                style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', cursor:'pointer' }}
                onClick={() => setOpenMethod(isOpen ? null : m.id)}
              >
                <div style={{ width:8, height:8, borderRadius:'50%', background:m.color, flexShrink:0, boxShadow:`0 0 8px ${m.color}88` }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:18, color:'var(--mycelium-l)', letterSpacing:'-0.01em', lineHeight:1 }}>{m.name}</div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--mycelium-d)', marginTop:3 }}>{m.tag}</div>
                </div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.14em', color:isOpen ? m.color : 'var(--mycelium-d)', transition:'color 0.2s' }}>{isOpen ? '↑' : '↓'}</div>
              </div>

              {isOpen && (
                <div style={{ padding:'0 16px 18px', animation:'page-in 0.2s ease-out' }}>
                  <p style={{ fontSize:12.5, color:'var(--mycelium)', lineHeight:1.6, marginBottom:14, opacity:0.9 }}>{m.desc}</p>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                    <div style={{ background:'var(--soil-3)', borderRadius:6, padding:'9px 11px', border:'0.5px solid var(--rule)' }}>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:8, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--mycelium-d)', marginBottom:3 }}>Ratio</div>
                      <div style={{ fontSize:11.5, color:'var(--mycelium-l)' }}>{m.ratio}</div>
                    </div>
                    <div style={{ background:'var(--soil-3)', borderRadius:6, padding:'9px 11px', border:'0.5px solid var(--rule)' }}>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:8, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--mycelium-d)', marginBottom:3 }}>Time</div>
                      <div style={{ fontSize:11.5, color:'var(--mycelium-l)' }}>{m.time}</div>
                    </div>
                  </div>

                  <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--mycelium-d)', marginBottom:8 }}>Process</div>
                  {m.steps.map((s, i) => (
                    <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:6 }}>
                      <div style={{ width:18, height:18, borderRadius:'50%', background:'var(--soil-4)', border:'0.5px solid var(--rule)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:8, color:m.color, marginTop:1 }}>{i+1}</div>
                      <div style={{ fontSize:12, color:'var(--mycelium)', lineHeight:1.5 }}>{s}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ margin:'20px 16px 8px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--mycelium-d)' }}>Your balance</div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--spore-l)', fontVariantNumeric:'tabular-nums' }}>{economy.state.balance} $H</div>
      </div>
    </div>
  );
}

/* ── Mycelium Calendar ────────────────────────────────────── */

const FREQ_COLORS = {
  '111 Hz': '#C48838',
  '432 Hz': '#534AB7',
  '528 Hz': '#0F6E56',
};

function PyramidMark({ color, size = 48 }) {
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} style={{ display:'block' }}>
      <polygon points="30,4 56,52 4,52"   fill="none" stroke={color} strokeWidth="1" opacity="0.7" />
      <polygon points="30,56 4,8 56,8"    fill="none" stroke={color} strokeWidth="0.6" opacity="0.35" />
      <line x1="30" y1="4" x2="30" y2="56" stroke={color} strokeWidth="0.4" opacity="0.2" />
      <line x1="4"  y1="30" x2="56" y2="30" stroke={color} strokeWidth="0.4" opacity="0.2" />
      <circle cx="30" cy="30" r="3.5" fill={color} opacity="0.9" />
      <circle cx="30" cy="30" r="7"   fill="none" stroke={color} strokeWidth="0.5" opacity="0.4" />
    </svg>
  );
}

function CalendarPage({ economy, onToast }) {
  const now = new Date();

  function countdown(dateStr) {
    const d = new Date(dateStr);
    const diff = d - now;
    if (diff <= 0) return 'Now';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days >= 60) return `${Math.floor(days / 30)} mo`;
    if (days === 1) return '1 day';
    return `${days} days`;
  }

  function fmtDate(dateStr, timeStr) {
    const d = new Date(dateStr);
    const day = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
    return `${day} ${d.getFullYear()} · ${timeStr}`;
  }

  const upcoming = SporeData.EVENTS
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="page-enter">
      <div className="section">
        <div className="section-eyebrow">Sacred time · $MYCEL calendar</div>
        <h2 className="section-title">Mycelium <em>Calendar.</em></h2>
        <p className="section-blurb">Time moves through the organism like nutrients through hyphae. Each event is a node in the living calendar. Arrive — contribute — let frequency do the rest.</p>
      </div>

      {/* Sacred header panel */}
      <div className="cal-sacred-header">
        <div className="cal-pyramid-wrap">
          <PyramidMark color="#C48838" size={56} />
        </div>
        <p className="cal-philosophy">
          "The mycelium does not measure time in hours. It measures in cycles —
          the fruiting of seasons, the resonance of 111 Hz at the threshold
          between worlds, the geometry of the hourglass where past and future
          hold the same weight."
        </p>
      </div>

      {/* Frequency legend */}
      <div className="cal-freq-legend">
        {Object.entries(FREQ_COLORS).map(([freq, color]) => (
          <div key={freq} className="cal-freq-item">
            <div className="cal-freq-dot" style={{ background: color }} />
            {freq}
          </div>
        ))}
      </div>

      {/* Event cards */}
      <div className="cal-events">
        {upcoming.map((ev, idx) => {
          const freqColor = FREQ_COLORS[ev.freq] || '#C48838';
          const cd = countdown(ev.date);
          const isPast = new Date(ev.date) < now;

          return (
            <div key={ev.id} className="cal-card" style={{ borderColor: freqColor + '44' }}>
              {/* Top row: geom + freq + countdown */}
              <div className="cal-card-top" style={{ background:`linear-gradient(135deg, ${freqColor}0D, transparent 70%)` }}>
                <PyramidMark color={freqColor} size={36} />
                <div className="cal-freq-badge">
                  <span className="cal-freq-val" style={{ color: freqColor }}>{ev.freq}</span>
                  <span className="cal-freq-lbl">resonance</span>
                </div>
                <div className="cal-countdown-wrap">
                  <span className="cal-countdown-val" style={{ color: isPast ? 'var(--mycelium-d)' : 'var(--mycelium-l)' }}>{cd}</span>
                  <span className="cal-countdown-lbl">{isPast ? 'passed' : 'away'}</span>
                </div>
              </div>

              {/* Body */}
              <div className="cal-card-body">
                <div className="cal-date-row">{fmtDate(ev.date, ev.time)}</div>
                <div className="cal-title" style={{ color: isPast ? 'var(--mycelium-d)' : 'var(--mycelium-l)' }}>{ev.title}</div>
                <div className="cal-subtitle">{ev.subtitle}</div>
                <div className="cal-desc">{ev.desc}</div>

                {/* Capacity */}
                <div className="cal-capacity-row">
                  <div className="cal-capacity-lbl">Capacity · {ev.capacity}</div>
                  <div className="cal-cap-bar">
                    <div className="cal-cap-fill" style={{ width:'28%', background: freqColor, opacity:0.7 }} />
                  </div>
                </div>

                {/* Volunteer contributions */}
                {!isPast && (
                  <>
                    <div className="cal-contribs-lbl">Volunteer & earn</div>
                    {ev.contributions.map((c, i) => (
                      <div key={i} className="cal-contrib-row" onClick={() => {
                        economy.earn(c.earn, `${c.label} — ${ev.title}`, c.rep || 0);
                        onToast(`+${c.earn} $H · ${c.label}`, 'success');
                      }}>
                        <div>
                          <div className="cal-contrib-name">{c.label}</div>
                          <div className="cal-contrib-type">{c.type}{c.rep ? ` · +${c.rep} rep` : ''}</div>
                        </div>
                        <div className="cal-contrib-earn" style={{ color: freqColor }}>+{c.earn} $H →</div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sacred footer */}
      <div className="cal-footer">
        <div className="cal-footer-glyph">◇ △ ◇</div>
        <div className="cal-footer-text">
          The organism moves in spiral time. 111 Hz marks the threshold between cycles.
          Be present when the calendar breathes.
        </div>
      </div>
    </div>
  );
}

/* ── Earn sheet ───────────────────────────────────────────── */

function EarnSheet({ open, onClose, economy, onToast }) {
  if (!open) return null;
  const now = new Date();

  const upcoming = SporeData.EVENTS
    .filter(ev => new Date(ev.date) > now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  function daysUntil(dateStr) {
    return Math.round((new Date(dateStr) - now) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.32em', textTransform:'uppercase', color:'var(--mycelium-d)' }}>Push nutrients in</div>
          <div className="sheet-title">Earn $MYCEL</div>
        </div>
        <div className="sheet-body">
          {upcoming.map(ev => {
            const freqColor = FREQ_COLORS[ev.freq] || '#C48838';
            const days = daysUntil(ev.date);
            return (
              <div key={ev.id} className="earn-event">
                <div className="earn-event-header">
                  <div style={{ flex:1 }}>
                    <div className="earn-event-title">{ev.title}</div>
                    <div className="earn-event-sub">{ev.subtitle}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color: freqColor, letterSpacing:'0.1em' }}>{ev.freq}</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--mycelium-d)', marginTop:2 }}>{days}d away</div>
                  </div>
                </div>
                {ev.contributions.map((c, i) => (
                  <div key={i} className="earn-opt" onClick={() => {
                    economy.earn(c.earn, `${c.label} — ${ev.title}`, c.rep || 0);
                    onToast(`+${c.earn} $H · ${c.label}`, 'success');
                    onClose();
                  }}>
                    <div>
                      <div className="earn-name">{c.label}</div>
                      <div className="earn-desc">{c.type}{c.rep ? ` · +${c.rep} rep` : ''}</div>
                    </div>
                    <div className="earn-amount" style={{ color: freqColor }}>+{c.earn} $H</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Tweaks ───────────────────────────────────────────────── */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "flowRate": 1.2,
  "phase": "MOCK",
  "particles": true
}/*EDITMODE-END*/;

function SporeTweaks({ tweaks, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Living motion">
        <TweakSlider
          label="Flow rate"
          value={tweaks.flowRate}
          min={0.3} max={3} step={0.1}
          onChange={v => setTweak('flowRate', v)}
          format={v => `${v.toFixed(1)}×`}
        />
      </TweakSection>
      <TweakSection title="Phase preview">
        <TweakSelect
          label="Phase"
          value={tweaks.phase}
          options={SporeData.PHASES.map(p => ({ value:p.id, label:`${p.num} · ${p.name}` }))}
          onChange={v => setTweak('phase', v)}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

/* ── Quick nav sidebar ────────────────────────────────────── */

function QuickNav({ tab, onTab }) {
  const items = [
    { icon:'⚗', label:'Academy', href:'/community/academy/', ext:true },
    { icon:'⬡', label:'Extract', href:'/extraction', ext:true },
    { icon:'🌿', label:'Herbals', href:'/mixology', ext:true },
    { icon:'◎', label:'Shop', href:'/shop', ext:true },
    { icon:'◉', label:'Network', id:'network' },
    { icon:'△', label:'Calendar', id:'calendar' },
    { icon:'◈', label:'Members', id:'members' },
  ];
  return (
    <div className="quick-nav">
      {items.map((it, i) => (
        <React.Fragment key={it.label}>
          {i === 4 && <div className="qn-divider" />}
          {it.ext ? (
            <a href={it.href} target="_blank" className="qn-item">
              <span className="qn-icon">{it.icon}</span>
              <span className="qn-label">{it.label}</span>
            </a>
          ) : (
            <button className={`qn-item ${tab === it.id ? 'active' : ''}`} onClick={() => onTab(it.id)}>
              <span className="qn-icon">{it.icon}</span>
              <span className="qn-label">{it.label}</span>
            </button>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── MYCO AI Agent ───────────────────────────────────────── */

const MYCO_CHIPS = [
  { label:'✦ Clean lab note', prefix:'Please clean and structure this lab note into proper sections:\n\n' },
  { label:'⚗ Herb guidance', prefix:'Recommend herbs and extraction method for: ' },
  { label:'◉ Network insights', msg:'Analyse the current Spore network: which members might need engagement, what $MYCEL flows look like, and where I should focus next.' },
  { label:'△ Suggest improvements', msg:'What concrete improvements would you suggest for the Spore Living Network — token economy, community features, upcoming events?' },
];

function MycoAgent({ currentMember }) {
  const [open,    setOpen]    = useState(false);
  const [input,   setInput]   = useState('');
  const [msgs,    setMsgs]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const endRef  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && endRef.current) endRef.current.scrollIntoView({ behavior:'smooth' });
  }, [msgs, open]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  async function send(text) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setError('');

    const history = msgs.map(m => ({ role: m.role, content: m.content }));
    setMsgs(prev => [...prev, { role:'user', content:msg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/myco-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMsgs(prev => [...prev, { role:'assistant', content: data.reply }]);
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

  function fmtContent(text) {
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>{line}<br/></React.Fragment>
    ));
  }

  return (
    <div className="myco-wrap">
      {open && (
        <div className="myco-panel">
          {/* Header */}
          <div className="myco-head">
            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
              <div className="myco-avatar">
                <svg viewBox="0 0 24 24" width={16} height={16}>
                  <polygon points="12,2 22,20 2,20" fill="none" stroke="#C48838" strokeWidth="1.5" />
                  <circle cx="12" cy="13" r="2.5" fill="#C48838" />
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

          {/* Messages */}
          <div className="myco-messages">
            {msgs.length === 0 && !loading && (
              <div className="myco-empty">
                <div className="myco-empty-glyph">◇ △ ◇</div>
                <div className="myco-empty-text">
                  What shall we cultivate today, {currentMember ? currentMember.name : 'Hyphae'}?
                </div>
                {/* Quick chips */}
                <div className="myco-chips">
                  {MYCO_CHIPS.map(c => (
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
                <div className="myco-bubble">{fmtContent(m.content)}</div>
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

          {/* After first message show chips again */}
          {msgs.length > 0 && (
            <div className="myco-chips-row">
              {MYCO_CHIPS.map(c => (
                <button key={c.label} className="myco-chip-sm" onClick={() => useChip(c)}>{c.label}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="myco-input-row">
            <textarea
              ref={inputRef}
              className="myco-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask MYCO anything…"
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
              {loading ? '…' : '→'}
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
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

/* ── Claim Profile Picker — first-time sign-in flow for founding members ── */

function ClaimProfilePicker({ onClaim, onCreateNew, onClose }) {
  const [unclaimed, setUnclaimed] = useState([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    (async () => {
      if (!window.SBprofiles) return;
      const rows = await window.SBprofiles.fetchUnclaimed();
      setUnclaimed(rows);
    })();
  }, []);

  async function pick(p) {
    if (busy) return;
    setBusy(true);
    try {
      await window.SBprofiles.claimSeededProfile(p.id);
      onClaim(p);
    } catch (e) {
      alert('Could not claim that profile: ' + (e.message || e));
      setBusy(false);
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9000, background:'rgba(10,9,8,0.92)', backdropFilter:'blur(14px)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'40px 16px', overflowY:'auto' }}>
      <div style={{ width:'100%', maxWidth:520, background:'var(--soil-2)', border:'0.5px solid var(--rule-strong)', borderRadius:18, padding:'28px 26px', marginBottom:40 }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.3em', textTransform:'uppercase', color:'var(--spore-l)', marginBottom:10 }}>✦ Welcome back</div>
        <h2 style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:30, color:'var(--mycelium-l)', letterSpacing:'-0.01em', marginBottom:8, lineHeight:1.1 }}>
          Which <em style={{ color:'var(--nutrient)' }}>thread</em> are you?
        </h2>
        <p style={{ fontSize:13.5, color:'var(--mycelium)', lineHeight:1.7, marginBottom:24 }}>
          If you're a founding member or one of the existing threads, tap your name below to claim your profile. Your contributions, hours, and Hyphae carry over.
        </p>

        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:18 }}>
          {unclaimed.length === 0 && <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--mycelium-d)', padding:'12px 0' }}>All threads already claimed. Create a new profile below.</div>}
          {unclaimed.map(p => (
            <button key={p.id} onClick={() => pick(p)} disabled={busy} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:10, background:'var(--soil-3)', border:'0.5px solid var(--rule)', cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background: p.founding ? 'linear-gradient(135deg, #E8B14B, #8B6320)' : 'var(--spore-d)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:16, color:'rgba(255,255,255,0.9)' }}>{p.character_name[0]}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:17, color:'var(--mycelium-l)' }}>{p.character_name}</span>
                  {p.founding && <span style={{ fontFamily:'var(--font-mono)', fontSize:7.5, letterSpacing:'0.16em', background:'linear-gradient(135deg, rgba(232,177,75,0.18), rgba(232,177,75,0.08))', border:'0.5px solid rgba(232,177,75,0.45)', borderRadius:3, padding:'2px 6px', color:'#F5D689' }}>FOUNDING</span>}
                </div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:9.5, color:'var(--mycelium-d)', marginTop:2 }}>{p.role}{p.node ? ' · ' + p.node : ''}</div>
              </div>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--mycelium-d)' }}>claim ↗</span>
            </button>
          ))}
        </div>

        <div style={{ paddingTop:18, borderTop:'0.5px solid var(--rule)', display:'flex', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
          <button onClick={onCreateNew} disabled={busy} style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', padding:'11px 22px', borderRadius:999, background:'rgba(168,143,224,0.1)', border:'0.5px solid rgba(168,143,224,0.4)', color:'#C5B5F5', cursor:'pointer' }}>+ I'm new — create profile</button>
          <button onClick={onClose} disabled={busy} style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', padding:'11px 22px', borderRadius:999, background:'none', border:'0.5px solid var(--rule)', color:'var(--mycelium-d)', cursor:'pointer' }}>Decide later</button>
        </div>
      </div>
    </div>
  );
}

/* ── App root ─────────────────────────────────────────────── */

function App() {
  const [currentMember, setCurrentMember] = useState(null);
  const [tab,       setTab]      = useState('network');
  const [earnOpen,  setEarnOpen] = useState(false);
  const [toast,     setToast]    = useState({ msg:'', kind:'' });
  const [tweaks,    setTweak]    = useTweaks(TWEAK_DEFAULTS);
  const [cloudVer,  setCloudVer] = useState(0);    // bumps when Supabase profiles load → forces re-render
  const [sbUser,    setSbUser]   = useState(null); // currently signed-in Supabase user (or null)

  const economy = useEconomy(currentMember ? currentMember.id : '__guest__');
  const tier    = SporeData.reputationTier(economy.state.reputation);
  const onToast = (msg, kind) => setToast({ msg, kind });

  function handleLogin(member) {
    setCurrentMember(member);
    setTab('network');
    try { localStorage.setItem('spore_active_member', member.id); } catch {}
  }

  function handleLogout() {
    setCurrentMember(null);
    setTab('network');
    try { localStorage.removeItem('spore_active_member'); } catch {}
  }

  useEffect(() => {
    if (document.getElementById('spore-living-anim')) return;
    const s = document.createElement('style');
    s.id = 'spore-living-anim';
    s.textContent = `@keyframes grow-line { to { stroke-dashoffset: 0; } }`;
    document.head.appendChild(s);
  }, []);

  const [showClaimPicker, setShowClaimPicker] = useState(false);

  // ── Load profiles from Supabase + auto-bypass PIN login if signed in ──
  useEffect(() => {
    let unsub;
    (async () => {
      if (!SporeData.loadProfilesFromCloud) return;
      try {
        const merged = await SporeData.loadProfilesFromCloud();
        SporeData.MEMBERS.length = 0;
        merged.forEach(m => SporeData.MEMBERS.push(m));
        setCloudVer(v => v + 1);
      } catch (e) { console.warn('[Spore] cloud load failed:', e); }

      // Auth state subscription
      if (!window.SBauth) return;
      const user = await window.SBauth.getUser();
      setSbUser(user);
      await tryAutoLogin(user);

      const sub = window.SBauth.onAuthChange(async ({ user }) => {
        setSbUser(user);
        await tryAutoLogin(user);
      });
      unsub = sub?.data?.subscription?.unsubscribe?.bind(sub.data.subscription);
    })();
    return () => { if (unsub) try { unsub(); } catch {} };
  }, []);

  // If a Supabase user is signed in, find their profile and skip the PIN screen.
  // If no profile matches their auth_user_id yet, show the 'claim founder identity' picker.
  async function tryAutoLogin(user) {
    if (!user) return;
    try {
      const mine = await window.SBprofiles.fetchMine();
      if (mine) {
        // Find or create the matching MEMBERS entry, set as current
        const match = SporeData.MEMBERS.find(m => m.cloudId === mine.id)
                   || SporeData.MEMBERS.find(m => m.name.toLowerCase() === (mine.character_name || '').toLowerCase());
        if (match) {
          setCurrentMember(match);
          setTab('members');
          try { localStorage.setItem('spore_active_member', match.id); } catch {}
        }
      } else {
        // No claimed profile yet — show picker
        setShowClaimPicker(true);
      }
    } catch (e) { console.warn('[Spore] auto-login failed:', e); }
  }

  // After ?signedin=1 URL flag (from magic link), drop the flag and pop a welcome toast
  useEffect(() => {
    if (window.location.search.includes('signedin=1')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('signedin');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
      setTimeout(() => setToast({ msg: '✦ Signed in to the network', kind: 'good' }), 600);
    }
  }, []);

  // Render the claim picker when signed in but no profile linked yet
  const claimUI = showClaimPicker ? (
    <ClaimProfilePicker
      onClaim={async (p) => {
        setShowClaimPicker(false);
        // Re-load profiles, then auto-login
        try {
          const merged = await SporeData.loadProfilesFromCloud();
          SporeData.MEMBERS.length = 0;
          merged.forEach(m => SporeData.MEMBERS.push(m));
          setCloudVer(v => v + 1);
          await tryAutoLogin(sbUser);
        } catch {}
      }}
      onCreateNew={() => { setShowClaimPicker(false); /* user will use '+ Create profile' button below */ }}
      onClose={() => setShowClaimPicker(false)}
    />
  ) : null;

  if (!currentMember) {
    return <>
      {claimUI}
      <LoginScreen onLogin={handleLogin} sbUser={sbUser} />
    </>;
  }

  return (
    <div className="app">
      {claimUI}
      <TopBar
        state={economy.state}
        tier={tier}
        tab={tab}
        onTab={setTab}
        onWallet={() => setEarnOpen(true)}
        currentMember={currentMember}
        onLogout={handleLogout}
      />
      <SystemStats state={economy.state} tier={tier} flowRate={tweaks.flowRate} />

      {tab === 'network'  && <NetworkPage economy={economy} onToast={onToast} flowRate={tweaks.flowRate} />}
      {tab === 'calendar' && <CalendarPage economy={economy} onToast={onToast} />}
      {tab === 'shop'     && <ApothecaryPage economy={economy} onToast={onToast} />}
      {tab === 'exp'      && <ExperiencesPage economy={economy} onToast={onToast} />}
      {tab === 'members'  && <MembersPage currentMember={currentMember} economy={economy} />}
      {tab === 'admin'    && currentMember && currentMember.admin && <AdminPage onToast={onToast} currentMember={currentMember} />}

      <div className="app-footer">
        <ProceduralMark size={32} />
        <div className="app-footer-fine">tend · flow · unlock</div>
      </div>

      <QuickNav tab={tab} onTab={setTab} />
      <EarnSheet open={earnOpen} onClose={() => setEarnOpen(false)} economy={economy} onToast={onToast} />
      <Toast message={toast.msg} kind={toast.kind} onClose={() => setToast({ msg:'', kind:'' })} />
      <MycoAgent currentMember={currentMember} />
      <SporeTweaks tweaks={tweaks} setTweak={setTweak} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
