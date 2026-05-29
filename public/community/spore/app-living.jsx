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

function LoginScreen({ onLogin, sbUser, onContinueCreating, onSignOut }) {
  const [selected, setSelected]     = useState(null);
  const [dropOpen, setDropOpen]     = useState(false);
  const dropRef                      = useRef(null);

  // Supabase magic-link sign-in (primary path for everyone)
  const [signInEmail, setSignInEmail] = useState('');
  const [signInBusy, setSignInBusy] = useState(false);
  const [signInSent, setSignInSent] = useState(false);

  // "Create new profile" gate — codes live in Supabase (invite_codes table)
  // and are validated by the validate_invite_code() RPC, which atomically
  // checks expiry/max_uses/disabled and consumes one use on success.
  // Rotate / disable / add codes from the admin panel without a code deploy.
  const [showInviteGate, setShowInviteGate] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteBusy, setInviteBusy]   = useState(false);
  const [createMode, setCreateMode]   = useState(false); // unlocked → show create-flavoured copy
  const [showMagicForm, setShowMagicForm] = useState(false); // email form hidden until user picks a path

  // Sign-in by name + PIN (no email needed for existing members).
  // The typed name is matched against SporeData.MEMBERS — case-insensitive.
  const [showSignInBox, setShowSignInBox] = useState(false);
  const [signInName, setSignInName]       = useState('');
  const [signInNameError, setSignInNameError] = useState('');

  function handleNameSignIn(e) {
    e.preventDefault();
    const wanted = signInName.trim().toLowerCase();
    if (!wanted) return;
    const member = (SporeData.MEMBERS || []).find(m =>
      (m.name || '').trim().toLowerCase() === wanted
    );
    if (!member) {
      setSignInNameError("We don't recognise that name. If you're new, use Create profile instead.");
      return;
    }
    // Trigger PinModal (already wired below — when `selected` is set, it opens)
    setSelected(member);
    setShowSignInBox(false);
    setSignInName('');
    setSignInNameError('');
  }

  const INVITE_REASON_COPY = {
    not_found: "That invite code doesn't match. Ask Robin or Steph for the current one.",
    expired:   "That code has expired. Ask Robin or Steph for a fresh one.",
    exhausted: "That code has been fully used. Ask Robin or Steph for a fresh one.",
    disabled:  "That code is no longer active. Ask Robin or Steph for a fresh one.",
  };

  async function submitInvite(e) {
    e.preventDefault();
    const code = inviteCode.trim();
    if (!code) return;
    if (!window.SBclient) {
      setInviteError("Sign-in service still loading — try again in a second.");
      return;
    }

    setInviteBusy(true);
    setInviteError('');
    try {
      const { data, error } = await window.SBclient.rpc('validate_invite_code', { p_code: code });
      setInviteBusy(false);
      if (error) {
        setInviteError("Couldn't reach the server. Check your connection and try again.");
        console.warn('[invite-code] RPC error:', error);
        return;
      }
      // RPC returns a TABLE → SDK gives us an array; take first row
      const result = Array.isArray(data) ? data[0] : data;
      if (result?.valid) {
        setCreateMode(true);
        setShowMagicForm(true);
        setShowInviteGate(false);
        setInviteCode('');
        setInviteError('');
        // Scroll the magic-link form into view so user can complete the flow
        setTimeout(() => {
          document.getElementById('spore-magic-link-form')?.scrollIntoView({ behavior:'smooth', block:'center' });
        }, 80);
        return;
      }
      setInviteError(
        INVITE_REASON_COPY[result?.reason]
        || "That invite code didn't work. Ask Robin or Steph for help."
      );
    } catch (err) {
      setInviteBusy(false);
      setInviteError("Something went wrong. Try again in a moment.");
      console.warn('[invite-code] threw:', err);
    }
  }

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
          <img src="/fungai-art-logo.png" alt="Fungai Art" style={{ width:34, height:34, borderRadius:'50%', objectFit:'cover', border:'0.5px solid rgba(232,177,75,0.35)', boxShadow:'0 0 12px rgba(232,177,75,0.15)' }} />
          <div>
            <div className="welcome-brand-name">Spore</div>
            <div className="welcome-brand-sub">Living Network · $MYCEL</div>
          </div>
        </div>
        {/* PIN-picker dropdown removed — exposed the full member roster to any
            visitor and let them pick anyone. Sign-in is now unified via the
            "+ Create profile" path (uses invite code + magic-link, existing
            members just skip the editor). */}
      </div>

      {/* ── Hero ── */}
      <div className="welcome-hero">
        <div className="welcome-hero-inner">
          <div className="welcome-eyebrow">A decentralized mycelium · no centre · no CEO</div>
          <h1 className="welcome-title">There is no <em>centre.</em><br/>Only the threads<br/>that <em>hold.</em></h1>
          <p className="welcome-blurb">
            Fungai Art isn't a brand with a headquarters. It's a <strong style={{ color:'var(--mycelium-l)' }}>living mycelium</strong> spread across Berlin labs, Nordic forests, Lisbon studios, Beirut kitchens — and growing. Each member is a <em>hypha</em>: a thread tending soil. Each gathering, a fruiting body.
          </p>
          <p className="welcome-blurb" style={{ marginTop:14 }}>
            We forage, ferment, ceremony, teach. The network grows when you do. <strong style={{ color:'var(--spore-l)' }}>Reputation cannot be bought — only earned.</strong> Tiers run: <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--mycelium)' }}>Spore → Palawan → Mycelium → Forager → Root Node</span>.
          </p>

          {/* Single CTA. Three states:
              (a) Not signed in → Create profile button (opens invite gate)
              (b) Signed in but no profile yet (dead state) → Continue your thread button + sign out link
              (c) Signed in with profile → nothing here (App routes to MembersPage) */}
          {!sbUser && !signInSent && (
            <>
              <div style={{ marginTop:32, display:'flex', justifyContent:'flex-end', width:'100%' }}>
                <button
                  onClick={() => { setShowInviteGate(true); setInviteError(''); }}
                  style={{ fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:'0.24em', textTransform:'uppercase', padding:'16px 36px', borderRadius:999, background:'linear-gradient(135deg, rgba(232,177,75,0.18), rgba(232,177,75,0.06))', border:'0.5px solid rgba(232,177,75,0.55)', color:'var(--nutrient-l)', fontWeight:500, cursor:'pointer', boxShadow:'0 0 24px rgba(232,177,75,0.15)' }}
                >
                  ✦ Cross the threshold
                </button>
              </div>
              <div style={{ marginTop:10, fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--mycelium-d)', width:'100%', textAlign:'right' }}>
                New here? Cross the threshold above.
              </div>

              {/* Returning-member sign-in by NAME + PIN.
                  No email. They type their character name (robert, emil, remi…)
                  → PinModal opens for that member → they enter their 4-digit
                  code (or set one if first time on this device). */}
              <div style={{ marginTop:18, width:'100%', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10 }}>
                {!showSignInBox && (
                  <button
                    onClick={() => { setShowSignInBox(true); setSignInNameError(''); }}
                    style={{ background:'none', border:'none', color:'var(--spore-l)', fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', cursor:'pointer', padding:'8px 0', textDecoration:'underline', textUnderlineOffset:4 }}
                  >
                    ✦ Already a thread? Sign in
                  </button>
                )}
                {showSignInBox && (
                  <form onSubmit={handleNameSignIn} style={{ width:'100%', maxWidth:360, display:'flex', flexDirection:'column', gap:6 }}>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--spore-l)', textAlign:'right' }}>
                      ✦ Sign in · your name
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <input
                        autoFocus
                        type="text"
                        value={signInName}
                        onChange={e => { setSignInName(e.target.value); setSignInNameError(''); }}
                        placeholder="robert, emil, remi…"
                        style={{ flex:1, background:'var(--soil-3)', border: signInNameError ? '0.5px solid var(--coral)' : '0.5px solid var(--rule-strong)', borderRadius:999, color:'var(--mycelium-l)', padding:'12px 18px', fontFamily:'var(--font-sans)', fontSize:14, outline:'none' }}
                      />
                      <button type="submit" style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.22em', textTransform:'uppercase', padding:'12px 22px', borderRadius:999, background:'linear-gradient(135deg, var(--spore), var(--spore-d))', border:'none', color:'var(--soil)', fontWeight:500, cursor:'pointer' }}>
                        →
                      </button>
                    </div>
                    {signInNameError && (
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--coral)', textAlign:'right', lineHeight:1.5 }}>{signInNameError}</div>
                    )}
                    <button type="button" onClick={() => { setShowSignInBox(false); setSignInName(''); setSignInNameError(''); }} style={{ background:'none', border:'none', color:'var(--mycelium-d)', fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', cursor:'pointer', alignSelf:'flex-end', padding:0 }}>
                      cancel
                    </button>
                  </form>
                )}
              </div>
            </>
          )}

          {/* Signed in but no profile → recoverable dead state */}
          {sbUser && !signInSent && (
            <div style={{ marginTop:32, width:'100%', textAlign:'right' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--mycelium-d)', marginBottom:10 }}>
                Signed in as <strong style={{ color:'var(--mycelium-l)' }}>{sbUser.email}</strong>
              </div>
              <button
                onClick={() => onContinueCreating && onContinueCreating()}
                style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.22em', textTransform:'uppercase', padding:'14px 28px', borderRadius:999, background:'linear-gradient(135deg, var(--spore), var(--spore-d))', border:'none', color:'var(--soil)', fontWeight:500, cursor:'pointer' }}
              >
                ✦ Continue your thread
              </button>
              <div style={{ marginTop:10 }}>
                <button
                  onClick={() => onSignOut && onSignOut()}
                  style={{ background:'none', border:'none', color:'var(--mycelium-d)', fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', cursor:'pointer', padding:0, textDecoration:'underline' }}
                >
                  Sign out & start over
                </button>
              </div>
            </div>
          )}

          {/* Email magic-link form — hidden until user picks a path
              (clicks "Sign in with link" or accepts an invite code).
              Also stays mounted after signInSent / sbUser so feedback
              messages keep rendering. */}
          {(showMagicForm || signInSent || sbUser) && (
          <div id="spore-magic-link-form" style={{ marginTop:18, padding:'18px 20px', background:'rgba(15,16,20,0.7)', border: createMode ? '0.5px solid rgba(232,177,75,0.5)' : '0.5px solid var(--rule-strong)', borderRadius:14, maxWidth:480 }}>
            {sbUser ? (
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--spore)', boxShadow:'0 0 6px rgba(107,214,111,0.6)' }}></span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--mycelium-l)', flex:1 }}>Signed in as <strong>{sbUser.email}</strong></span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:9.5, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--mycelium-d)' }}>opening your profile…</span>
              </div>
            ) : signInSent ? (
              <div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.24em', textTransform:'uppercase', color:'var(--spore-l)', marginBottom:8 }}>✦ Magic link sent</div>
                <div style={{ fontSize:14, color:'var(--mycelium-l)', lineHeight:1.65, marginBottom:8 }}>Check your inbox at <strong>{signInEmail}</strong>. Click the link — it brings you straight back here, {createMode ? 'and the profile editor will open automatically.' : 'signed in.'}</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--mycelium-d)', lineHeight:1.6 }}>Didn't arrive in 2 minutes? Check spam, or <button onClick={() => { setSignInSent(false); setSignInEmail(''); }} style={{ background:'none', border:'none', color:'var(--nutrient-l)', cursor:'pointer', textDecoration:'underline', font:'inherit', padding:0 }}>try a different email</button>.</div>
              </div>
            ) : (
              <form onSubmit={handleSignIn}>
                {createMode && (
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.24em', textTransform:'uppercase', color:'var(--nutrient-l)', marginBottom:6 }}>✦ Invite accepted — last step</div>
                )}
                <div style={{ fontSize:13, color:'var(--mycelium)', lineHeight:1.65, marginBottom:14 }}>
                  {createMode
                    ? 'Enter your email. We send you a link — click it and your profile editor opens automatically.'
                    : 'No password, no installation. We email you a magic link — works for founding members & new threads alike.'}
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <input type="email" required value={signInEmail} onChange={e => setSignInEmail(e.target.value)} placeholder="your@email.com" style={{ flex:'1 1 220px', background:'var(--soil-3)', border:'0.5px solid var(--rule)', borderRadius:999, color:'var(--mycelium-l)', padding:'12px 18px', fontFamily:'var(--font-sans)', fontSize:14, outline:'none' }} autoComplete="email" />
                  <button type="submit" disabled={signInBusy} style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.24em', textTransform:'uppercase', padding:'12px 24px', borderRadius:999, background: createMode ? 'linear-gradient(135deg, var(--nutrient), var(--nutrient-d))' : 'linear-gradient(135deg, var(--spore), var(--spore-d))', border:'none', color:'var(--soil)', cursor: signInBusy ? 'wait' : 'pointer', fontWeight:500, opacity: signInBusy ? 0.7 : 1 }}>
                    {signInBusy ? 'Sending…' : (createMode ? 'Send my link' : 'Send magic link')}
                  </button>
                </div>
              </form>
            )}
          </div>
          )}

          {/* Invite-code gate modal */}
          {showInviteGate && (
            <div style={{ position:'fixed', inset:0, zIndex:9500, background:'rgba(6,8,9,0.86)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }} onClick={(e) => { if (e.target === e.currentTarget) setShowInviteGate(false); }}>
              <form onSubmit={submitInvite} style={{ width:'100%', maxWidth:380, background:'var(--soil-2)', border:'0.5px solid rgba(232,177,75,0.4)', borderRadius:16, padding:'30px 28px', position:'relative' }}>
                <button type="button" onClick={() => setShowInviteGate(false)} style={{ position:'absolute', top:14, right:16, background:'none', border:'none', color:'var(--mycelium-d)', fontSize:22, cursor:'pointer', lineHeight:1 }}>×</button>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.28em', textTransform:'uppercase', color:'var(--nutrient-l)', marginBottom:8 }}>✦ Invite required</div>
                <h2 style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:26, color:'var(--mycelium-l)', letterSpacing:'-0.01em', marginBottom:8, lineHeight:1.1 }}>What's the <em style={{ color:'var(--nutrient)' }}>code?</em></h2>
                <p style={{ fontSize:13, color:'var(--mycelium)', lineHeight:1.65, marginBottom:18 }}>
                  Robin or Steph shared a short code with you. Enter it below — then you'll get a magic link to your email to finish setting up your profile.
                </p>
                <input
                  autoFocus
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  value={inviteCode}
                  onChange={e => { setInviteCode(e.target.value); setInviteError(''); }}
                  placeholder="••••"
                  style={{ width:'100%', background:'var(--soil-3)', border: inviteError ? '0.5px solid var(--coral)' : '0.5px solid var(--rule-strong)', borderRadius:10, color:'var(--mycelium-l)', padding:'14px 18px', fontFamily:'var(--font-mono)', fontSize:22, letterSpacing:'0.5em', textAlign:'center', outline:'none', marginBottom: inviteError ? 8 : 16 }}
                />
                {inviteError && <div style={{ fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--coral)', marginBottom:12, lineHeight:1.55 }}>{inviteError}</div>}
                <button type="submit" disabled={inviteBusy} style={{ width:'100%', fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.24em', textTransform:'uppercase', padding:'13px 22px', borderRadius:999, background:'linear-gradient(135deg, var(--nutrient), var(--nutrient-d))', border:'none', color:'var(--soil)', cursor: inviteBusy ? 'wait' : 'pointer', fontWeight:500, opacity: inviteBusy ? 0.7 : 1 }}>{inviteBusy ? 'Checking…' : 'Unlock →'}</button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Old WHO'S IN block removed — the active version is below, after Path */}
      {false && (
      <div className="welcome-section" id="welcome-mycelium-old">
        <div className="welcome-section-eyebrow">The mycelium · {SporeData.MEMBERS.length} threads</div>
        <div className="welcome-section-title">Who's <em>in.</em></div>
        <p style={{ fontSize:14, color:'var(--mycelium)', lineHeight:1.7, maxWidth:640, marginBottom:24 }}>
          Founding members and palawan threads — each tending a node, each contributing nutrients to the network. Tiers grow with depth of participation: Spore → Palawan → Mycelium → Forager → Root Node.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:14 }}>
          {SporeData.MEMBERS.map(m => {
            const tier = SporeData.reputationTier(m.rep);
            const node = SporeData.NETWORK_NODES.find(n => n.id === m.node);
            return (
              <div key={m.id} style={{
                background:'var(--soil-2)',
                border:'0.5px solid var(--rule)',
                borderRadius:14,
                padding:'18px 16px',
                display:'flex', flexDirection:'column', gap:8,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{
                    width:38, height:38, borderRadius:'50%',
                    background: tier.color, color:'var(--soil)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:'var(--font-display)', fontSize:18, fontWeight:600,
                    flexShrink:0,
                  }}>{m.name[0]}</div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ color:'var(--mycelium-l)', fontSize:15, fontWeight:600, lineHeight:1.2 }}>{m.name}</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color: tier.color, marginTop:2 }}>{tier.label}{m.founding ? ' · founding' : ''}</div>
                  </div>
                </div>
                <div style={{ color:'var(--mycelium)', fontSize:12, lineHeight:1.5 }}>{m.role}{node ? ` · ${node.name}` : ''}</div>
                {m.focus && <div style={{ color:'var(--mycelium-d)', fontSize:11, lineHeight:1.6 }}>{m.focus}</div>}
                {m.favoritePlant && (
                  <div style={{ marginTop:6, paddingTop:6, borderTop:'0.5px solid var(--rule)', fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--mycelium-d)' }}>
                    Ally · <span style={{ color:'var(--spore-l)', fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:12, textTransform:'none', letterSpacing:0 }}>{m.favoritePlant}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* ── Network map + nodes ──
          The map section uses a wider section variant so it can breathe on
          desktop. Map frame has aspect-ratio so the canvas always renders at
          a generous height; viewBox tightened to Europe + Mediterranean +
          Atitlán arc so the coastlines actually read as geography. */}
      <div className="welcome-section welcome-section-wide">
        <div className="welcome-section-eyebrow">Active nodes · {liveNodes.length} live · 1 proposed</div>
        <div className="welcome-section-title">The <em>network.</em></div>

        <div className="welcome-map-frame">
          <LivingNetworkMap
            nodes={SporeData.NETWORK_NODES.filter(n =>
              ['berlin','sweden','lisbon','festival','beirut','genoa','atitlan','nosara'].includes(n.id)
            )}
            selected={null}
            onSelect={() => {}}
            flowIntensity={1.2}
            viewBox={{ lonMin: -94, lonMax: 44, latMin: 8, latMax: 66 }}
            speed={0.4}
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

        {/* Node cards — split into two visual tiers:
              PRIMARY (Fungai Art operational nodes): Berlin, Sweden, Festival,
              Lisbon, Beirut. Rendered first, full size, full color.
              COMMUNITY (sister/satellite nodes not run directly by Fungai Art):
              Atitlán, Zanzibar, Bangkok, Bali, Hokkaido, Genoa. Dimmer,
              compact, in a sub-section. */}
        {(() => {
          const PRIMARY_NODE_IDS = ['berlin','sweden','festival','lisbon','beirut'];
          const primary = SporeData.NETWORK_NODES.filter(n => PRIMARY_NODE_IDS.includes(n.id));
          const community = SporeData.NETWORK_NODES.filter(n => !PRIMARY_NODE_IDS.includes(n.id));
          const renderCard = (node, dimmed = false) => {
            const isProposed = node.activity === 'proposed';
            const avgFlow = node.contributions.length
              ? Math.round(node.contributions.reduce((a,c) => a + c.earn, 0) / Math.max(1, node.contributions.length))
              : 0;
            return (
              <div key={node.id} className={`welcome-node ${isProposed ? 'proposed' : ''}`} style={dimmed ? { opacity:0.55, transform:'scale(0.94)' } : {}}>
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
          };
          return (
            <>
              {/* Primary — Fungai Art operational */}
              <div style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--mycelium-d)', marginBottom:10 }}>
                Fungai Art operations
              </div>
              <div className="welcome-nodes">
                {primary.map(node => renderCard(node, false))}
              </div>

              {/* Community — satellite / proposed. Hidden behind a <details>
                  drop-down per user direction: these are inactive earning-
                  wise, so keeping them collapsed sharpens the focus on the
                  operational arc above. */}
              <details style={{ marginTop:28 }}>
                <summary style={{ cursor:'pointer', listStyle:'none', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, padding:'12px 14px', background:'var(--soil-2)', border:'0.5px solid var(--rule)', borderRadius:8 }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--mycelium-d)' }}>
                    Community nodes &middot; sister gardens &middot; {community.length}
                  </span>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--mycelium-d)' }}>show &darr;</span>
                </summary>
                <div style={{ marginTop:10 }}>
                  <p style={{ fontFamily:'var(--font-mono)', fontSize:9.5, color:'var(--mycelium-d)', letterSpacing:'0.06em', lineHeight:1.65, marginBottom:14, padding:'10px 12px', background:'rgba(232,177,75,0.05)', border:'0.5px dashed rgba(232,177,75,0.2)', borderRadius:6 }}>
                    Sister-garden nodes are documentation only &mdash; no $MH is awarded for contributions here. The operational nodes above carry the active 30 $MH / 3h rate.
                  </p>
                  <div className="welcome-nodes" style={{ opacity:0.78 }}>
                    {community.map(node => renderCard(node, true))}
                  </div>
                </div>
              </details>
            </>
          );
        })()}
      </div>

      {/* Old Who's In here — moved BELOW Path per the latest portal layout pass */}
      {false && (
      <div className="welcome-section" id="welcome-mycelium-old2">
        <div className="welcome-section-eyebrow">The mycelium · {SporeData.MEMBERS.length} threads · {SporeData.MEMBERS.filter(m => m.founding).length} founding</div>
        <div className="welcome-section-title">Who's <em>in.</em></div>
        <p style={{ fontSize:14, color:'var(--mycelium)', lineHeight:1.7, maxWidth:640, marginBottom:24 }}>
          Founders and palawan threads — each tending a node, each contributing nutrients. None bought their way in. Every tier was earned.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:14 }}>
          {SporeData.MEMBERS.map(m => {
            const tier = SporeData.reputationTier(m.rep);
            const node = SporeData.NETWORK_NODES.find(n => n.id === m.node);
            return (
              <div key={m.id} style={{
                background:'var(--soil-2)',
                border:'0.5px solid var(--rule)',
                borderRadius:14,
                padding:'18px 16px',
                display:'flex', flexDirection:'column', gap:8,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{
                    width:38, height:38, borderRadius:'50%',
                    background: tier.color, color:'var(--soil)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:'var(--font-display)', fontSize:18, fontWeight:600,
                    flexShrink:0,
                  }}>{m.name[0]}</div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ color:'var(--mycelium-l)', fontSize:15, fontWeight:600, lineHeight:1.2 }}>{m.name}</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color: tier.color, marginTop:2 }}>{tier.label}{m.founding ? ' · founding' : ''}</div>
                  </div>
                </div>
                <div style={{ color:'var(--mycelium)', fontSize:12, lineHeight:1.5 }}>{m.role}{node ? ` · ${node.name}` : ''}</div>
                {m.focus && <div style={{ color:'var(--mycelium-d)', fontSize:11, lineHeight:1.6 }}>{m.focus}</div>}
                {m.favoritePlant && (
                  <div style={{ marginTop:6, paddingTop:6, borderTop:'0.5px solid var(--rule)', fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--mycelium-d)' }}>
                    Ally · <span style={{ color:'var(--spore-l)', fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:12, textTransform:'none', letterSpacing:0 }}>{m.favoritePlant}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* ── The principles (was: Token philosophy) — much richer now ── */}
      <div className="welcome-section">
        <div className="welcome-section-eyebrow">Three principles · the bones of it</div>
        <div className="welcome-section-title">How nutrients <em>flow.</em></div>
        <p style={{ fontSize:14, color:'var(--mycelium)', lineHeight:1.7, maxWidth:680, marginBottom:28 }}>
          Three forces hold the mycelium together. None of them are tokens to speculate on. All of them are tools to <em>build a community that can hold weight.</em>
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12 }}>
          {[
            {
              icon:'◉', color:'var(--spore-l)',
              title:'$MYCEL', subtitle:'The currency of contribution',
              desc:'Earned by doing — cooking a meal, leading a foraging walk, hosting a ceremony, documenting a harvest. Spent on experiences, products, and access. Emission-based, designed to grow with the organism rather than concentrate.',
              example:'Wissam leads a foraging circle in Sweden → earns 100 $H + 3 rep.',
            },
            {
              icon:'⬡', color:'var(--fungal-l)',
              title:'Access Keys', subtitle:'Non-transferable NFTs',
              desc:'Each key unlocks a specific experience, lab residency, or retreat. Limited by real-world seats, not artificial scarcity. They cannot be sold or transferred — they live in the wallet of the person who earned them.',
              example:'Burn 80 $H → mint a key for the Berlin Lab Night. The key is yours forever.',
            },
            {
              icon:'◈', color:'var(--nutrient-l)',
              title:'Reputation', subtitle:'The trust ledger',
              desc:'Tracks depth of participation across time. Cannot be bought, transferred, or gifted — only earned through showing up. Required for the deepest access. Resists the speculation culture that ruins most token economies.',
              example:'Reach Forager (6 rep) → propose new nodes, lead expeditions, teach in the academy.',
            },
          ].map(p => (
            <div key={p.title} style={{
              background:'var(--soil-2)',
              border:`0.5px solid var(--rule-strong)`,
              borderRadius:12,
              padding:'16px 16px',
              display:'flex', flexDirection:'column', gap:10,
              position:'relative', overflow:'hidden',
            }}>
              <div style={{ position:'absolute', top:-30, right:-30, width:100, height:100, borderRadius:'50%', background:`${p.color}08`, filter:'blur(20px)' }} />
              <div style={{ display:'flex', alignItems:'flex-start', gap:10, position:'relative' }}>
                <div style={{ fontSize:24, color: p.color, lineHeight:1, flexShrink:0 }}>{p.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:18, color: p.color, lineHeight:1.1, letterSpacing:'-0.01em' }}>{p.title}</div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:8, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--mycelium-d)', marginTop:3 }}>{p.subtitle}</div>
                </div>
              </div>
              <div style={{ fontSize:11.5, color:'var(--mycelium)', lineHeight:1.6, position:'relative' }}>{p.desc}</div>
              <div style={{ marginTop:'auto', paddingTop:10, borderTop:'0.5px solid var(--rule)', position:'relative' }}>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:7.5, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--mycelium-d)', marginBottom:3 }}>In practice</div>
                <div style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:11.5, color:'var(--mycelium-l)', lineHeight:1.5, letterSpacing:'-.005em' }}>"{p.example}"</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How to participate — narrative steps, not just labels ── */}
      <div className="welcome-section">
        <div className="welcome-section-eyebrow">The path · 5 thresholds</div>
        <div className="welcome-section-title">How to <em>weave in.</em></div>
        <p style={{ fontSize:14, color:'var(--mycelium)', lineHeight:1.7, maxWidth:680, marginBottom:28 }}>
          You don't apply. You don't pay. You start at the edge and grow inward, one contribution at a time.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:10 }}>
          {[
            { num:'01', tier:'Spore',     title:'Arrive',           desc:'Cross the threshold. Create your thread. Watch what others tend.', color:'#854F0B' },
            { num:'02', tier:'Palawan',   title:'Contribute',       desc:'First act — a forage, a meal, a photo, a translation. The network notices.', color:'#3B6D11' },
            { num:'03', tier:'Mycelium',  title:'Earn $MYCEL',      desc:'Each contribution flows back as currency. Stack it, save it, or spend it on an experience.', color:'#0F6E56' },
            { num:'04', tier:'Forager',   title:'Unlock access',    desc:'Burn $MYCEL for keys. Walk into the Berlin Lab, the Lisbon Studio, a Mycelium Trance ceremony.', color:'#534AB7' },
            { num:'05', tier:'Root Node', title:'Hold the vision',  desc:'At the deepest tier you steward. Propose new nodes. Teach. Carry weight others can lean on.', color:'#3C3489' },
          ].map((s, i, arr) => (
            <div key={s.num} style={{
              background:'var(--soil-2)',
              border:`0.5px solid ${s.color}40`,
              borderRadius:10,
              padding:'14px 12px',
              display:'flex', flexDirection:'column', gap:6,
              position:'relative',
            }}>
              <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.2em', color: s.color }}>{s.num}</span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:7, letterSpacing:'0.16em', textTransform:'uppercase', color: s.color, opacity:0.7 }}>● {s.tier}</span>
              </div>
              <div style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:17, color:'var(--mycelium-l)', lineHeight:1.1, letterSpacing:'-0.005em' }}>{s.title}</div>
              <div style={{ fontSize:11, color:'var(--mycelium)', lineHeight:1.55 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── The Mycelium — moved to be AFTER Path per latest layout pass.
            Member cards are NARROWER (180px min) to fit more per row. ── */}
      <div className="welcome-section" id="welcome-mycelium">
        <div className="welcome-section-eyebrow">The mycelium · {SporeData.MEMBERS.length} threads · {SporeData.MEMBERS.filter(m => m.founding).length} founding</div>
        <div className="welcome-section-title">Who's <em>in.</em></div>
        <p style={{ fontSize:13, color:'var(--mycelium)', lineHeight:1.65, maxWidth:600, marginBottom:20 }}>
          Founders and palawan threads — each tending a node, each contributing nutrients. None bought their way in. Every tier was earned.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:10 }}>
          {SporeData.MEMBERS.map(m => {
            const tier = SporeData.reputationTier(m.rep);
            const node = SporeData.NETWORK_NODES.find(n => n.id === m.node);
            return (
              <div key={m.id} style={{
                background:'var(--soil-2)',
                border:'0.5px solid var(--rule)',
                borderRadius:10,
                padding:'12px 12px',
                display:'flex', flexDirection:'column', gap:6,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{
                    width:30, height:30, borderRadius:'50%',
                    background: tier.color, color:'var(--soil)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:'var(--font-display)', fontSize:14, fontWeight:600,
                    flexShrink:0,
                  }}>{m.name[0]}</div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ color:'var(--mycelium-l)', fontSize:13.5, fontWeight:600, lineHeight:1.15 }}>{m.name}</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:7.5, letterSpacing:'0.14em', textTransform:'uppercase', color: tier.color, marginTop:2 }}>{tier.label}{m.founding ? ' · founding' : ''}</div>
                  </div>
                </div>
                <div style={{ color:'var(--mycelium)', fontSize:11, lineHeight:1.45 }}>{m.role}{node ? ` · ${node.name}` : ''}</div>
                {m.focus && <div style={{ color:'var(--mycelium-d)', fontSize:10, lineHeight:1.5 }}>{m.focus}</div>}
                {m.favoritePlant && (
                  <div style={{ marginTop:4, paddingTop:5, borderTop:'0.5px solid var(--rule)', fontFamily:'var(--font-mono)', fontSize:8, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--mycelium-d)' }}>
                    Ally · <span style={{ color:'var(--spore-l)', fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:11, textTransform:'none', letterSpacing:0 }}>{m.favoritePlant}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA section removed — the hero already has the primary buttons.
          Old "Log in Hyphae ↗" was redundant and confused the entry path. */}

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

// Live supply pill — shows ($MH available) of (TOTAL). Tied to a custom
// 'spore:economy' event so any balance mutation in SporeEconomy re-renders it.
function TokenSupplyPill() {
  const [avail, setAvail] = useState(() => SporeEconomy.availableSupply());
  const fmt = n => Number(n || 0).toLocaleString('en-US');
  useEffect(() => {
    const onChange = () => setAvail(SporeEconomy.availableSupply());
    window.addEventListener('spore:economy', onChange);
    const t = setInterval(onChange, 30000);
    return () => { window.removeEventListener('spore:economy', onChange); clearInterval(t); };
  }, []);
  return (
    <div title={`Token supply · ${fmt(avail)} of ${fmt(SporeData.TOKEN.TOTAL_SUPPLY)} $MH remaining`} style={{
      display:'flex', alignItems:'center', gap:6,
      padding:'5px 10px', borderRadius:999,
      background:'rgba(232,177,75,0.08)', border:'0.5px solid rgba(232,177,75,0.25)',
      fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.12em', color:'var(--nutrient-l)',
    }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--nutrient)', boxShadow:'0 0 5px rgba(232,177,75,0.7)' }} />
      <span>{fmt(avail)} <span style={{ opacity:0.55 }}>$MH</span></span>
    </div>
  );
}

function TopBar({ state, tier, tab, onTab, onWallet, currentMember, onLogout }) {
  const isAdmin = currentMember && currentMember.admin;
  const [mobileOpen, setMobileOpen] = useState(false);
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
  const activeTab = tabs.find(t => t.id === tab) || tabs[0];
  const handleTabClick = (t) => {
    if (t.external) { window.open(t.external, '_blank'); setMobileOpen(false); return; }
    onTab(t.id);
    setMobileOpen(false);
  };
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
          <TokenSupplyPill />
          <button className="wallet-pill" onClick={onWallet}>
            <span className="wallet-rep-dot" style={{ background: tier.color }} />
            <div className="wallet-stack">
              <div className="wallet-bal">{state.balance} $H</div>
              <div className="wallet-cta">tap to flow</div>
            </div>
          </button>
        </div>
      </div>
      {/* Desktop tab strip — hidden on phones via CSS */}
      <div className="tabs tabs-desktop">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'on' : ''} ${t.accent ? 'tab-accent' : ''} ${t.adminTab ? 'tab-admin' : ''}`}
            onClick={() => handleTabClick(t)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </div>
      {/* Mobile compact bar — single active pill + hamburger that opens the
          full list as a dropdown. Far less vertical real-estate than the
          horizontally-scrolling row used to take. */}
      <div className="tabs-mobile">
        <button className={`tabs-mobile-active ${activeTab.accent ? 'tab-accent' : ''} ${activeTab.adminTab ? 'tab-admin' : ''}`} onClick={() => setMobileOpen(o => !o)} aria-expanded={mobileOpen}>
          <span className="tab-icon">{activeTab.icon}</span>
          <span className="tab-label">{activeTab.label}</span>
          <span className="tabs-mobile-caret">{mobileOpen ? '▴' : '▾'}</span>
        </button>
        <button className="tabs-mobile-hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="All sections">
          <span></span><span></span><span></span>
        </button>
        {mobileOpen && (
          <div className="tabs-mobile-sheet">
            {tabs.map(t => (
              <button
                key={t.id}
                className={`tabs-mobile-item ${tab === t.id ? 'on' : ''} ${t.accent ? 'tab-accent' : ''} ${t.adminTab ? 'tab-admin' : ''}`}
                onClick={() => handleTabClick(t)}
              >
                <span className="tab-icon">{t.icon}</span>
                <span className="tab-label">{t.label}</span>
                {t.external && <span className="tabs-mobile-ext">↗</span>}
              </button>
            ))}
          </div>
        )}
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
  // Hydrate from an unsaved draft if one exists (recovered after sign-in)
  const draft = (() => {
    try { const d = JSON.parse(localStorage.getItem('fungai_profile_draft') || 'null'); return d || {}; }
    catch { return {}; }
  })();
  const seed = existing || draft;
  const [name, setName]         = useState(seed?.character_name || '');
  const [bio, setBio]           = useState(seed?.bio || '');
  const [role, setRole]         = useState(seed?.role || '');
  const [location, setLocation] = useState(seed?.location || '');
  const [pronouns, setPronouns] = useState(seed?.pronouns || '');
  const [contact, setContact]   = useState(seed?.contact || '');
  const [favoritePlant, setFavoritePlant] = useState(seed?.favoritePlant || seed?.favorite_plant || '');
  const [avatar, setAvatar]     = useState(seed?.avatar || seed?.avatar_url || null);
  const [tags, setTags]         = useState(seed?.specialties || []);
  const [recruitedBy, setRecruitedBy] = useState(seed?.recruitedBy || seed?.recruited_by || '');
  const [saving, setSaving]     = useState(false);
  const fileRef                 = useRef(null);

  const ROLES = [
    // 'founder' role removed from the dropdown — Robin & Stephanie are the
    // only founders and their profiles are pre-seeded with that role.
    // New members can't claim Founder for themselves.
    ['forager', 'Forager — wild plant gathering'],
    ['herbalist', 'Herbalist — traditional medicine'],
    ['alchemist', 'Alchemist — extraction & elixirs'],
    ['ceremony', 'Ceremony facilitator'],
    ['sound', 'Sound & frequency healer'],
    ['artist', 'Artist · creative collaborator'],
    ['cultivator', 'Cultivator — mycelium · spawn · substrate'],
    ['documenter', 'Documenter — photography · field notes · archive'],
    ['weaver', 'Community weaver — facilitation · governance'],
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

    // Three paths:
    //  A) Signed in via Supabase → normal upsert (insert claimed OR update existing)
    //  B) Not signed in, creating new → insert as unclaimed seed (auth_user_id = null)
    //     Used by admin/PIN-only Robin and by invite-code (5858) users.
    //  C) Not signed in, editing an already-claimed profile → can't update via RLS;
    //     save as draft + ask user to sign in.
    if (window.SBclient && window.SBauth) {
      try {
        const user = await window.SBauth.getUser();
        const isEditingClaimed = !!(existing && (existing.cloudId || existing.character_name));

        // Path C: editing existing profile but not signed in — RLS blocks UPDATE
        if (!user && isEditingClaimed) {
          try {
            localStorage.setItem('fungai_profile_draft', JSON.stringify({
              character_name: name.trim(), bio: bio.trim(), role, location,
              pronouns: pronouns.trim(), contact: contact.trim(), specialties: tags,
              avatar: avatar && avatar.startsWith('data:') ? null : avatar,
            }));
          } catch {}
          alert('To edit an existing profile you need to sign in with the same email it was claimed with. Your changes are saved as a draft — sign in via the email card below and come back.');
          setSaving(false);
          onClose && onClose();
          return;
        }

        // Avatar handling. Authed users upload to storage; unclaimed users stash
        // the data URL locally so the pic shows on this device AND auto-uploads
        // the next time they sign in (handled by syncPendingAvatar at boot).
        let avatarUrl = avatar;
        if (avatar && avatar.startsWith('data:') && fileRef.current?.files?.[0]) {
          if (user) {
            try {
              avatarUrl = await window.SBprofiles.uploadAvatar(fileRef.current.files[0]);
            } catch (e) {
              console.warn('Avatar upload failed, falling back to no avatar:', e);
              avatarUrl = null;
            }
          } else {
            // Not signed in → stash the data URL locally so the user still SEES
            // their pic on this device. When they later sign in via magic link,
            // the boot-time syncPendingAvatar pass uploads it to Supabase.
            try { localStorage.setItem('fungai_pending_avatar', avatar); } catch (e) {}
            avatarUrl = null;
          }
        }

        // Profile object — keep `recruited_by` LOCAL only. The Supabase
        // `profiles` table doesn't have that column (would require a manual
        // migration / RLS update) so we strip it before sending. Recruiter
        // bonuses are tracked entirely in localStorage `spore_recruits`.
        const profile = {
          character_name: name.trim(),
          bio: bio.trim(),
          role, location,
          pronouns: pronouns.trim(),
          contact: contact.trim(),
          favorite_plant: favoritePlant.trim(),
          specialties: tags,
          avatar_url: avatarUrl,
          recruited_by: recruitedBy || null,
          node: { sweden:'sweden', berlin:'berlin', lisbon:'lisbon', beirut:'beirut', genoa:'berlin', france:'berlin', germany:'berlin', denmark:'sweden', other_europe:'berlin', other_world:'festival' }[location] || 'berlin',
          focus: bio.trim() || (tags.length ? tags.join(' · ') : 'A new thread in the network'),
        };
        const { recruited_by: _stripRecruitedBy, ...cloudProfile } = profile;

        if (user) {
          // Path A
          await window.SBprofiles.upsert(cloudProfile);
        } else {
          // Path B — unclaimed insert (requires the new RLS policy)
          await window.SBprofiles.createUnclaimed(cloudProfile);
        }

        // Recruiter bonus — local-first ledger. If recruiter is named the
        // ledger awards 5 $MH to that recruiter (idempotent per recruiter+recruitee).
        // Self-recruitment is silently dropped.
        if (recruitedBy && (!existing || (existing.recruited_by || existing.recruitedBy) !== recruitedBy)) {
          const selfId = (window.SporeData?.MEMBERS || []).find(m => (m.character_name || m.name || '').toLowerCase() === name.trim().toLowerCase());
          const recruiteeId = selfId ? selfId.id : ('new-' + name.trim().toLowerCase().replace(/\s+/g, '-'));
          if (recruitedBy !== recruiteeId) {
            try { window.SporeEconomy.recordRecruit(recruitedBy, recruiteeId); } catch (e) {}
          }
        }

        // Cache locally for instant first-paint next time, and clear any unsaved draft.
        // If we have a pending data-URL avatar (unclaimed user upload), include it in the
        // local cache so the user keeps seeing their pic until claim+upload completes.
        let localAvatar = avatarUrl;
        if (!localAvatar) {
          try { localAvatar = localStorage.getItem('fungai_pending_avatar') || null; } catch (e) {}
        }
        try { localStorage.setItem('fungai_profile', JSON.stringify({ ...profile, avatar: localAvatar })); } catch (e) {}
        try { localStorage.removeItem('fungai_profile_draft'); } catch (e) {}

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
          {existing ? 'Edit' : 'Create'} your <em style={{ color:'var(--nutrient)' }}>character</em>
        </h2>
        <p style={{ fontSize:13, color:'var(--mycelium)', lineHeight:1.7, marginBottom:24 }}>
          {existing
            ? 'Update your details. Changes sync across all your devices.'
            : 'Your profile is the thread you weave into the network. Visible to other members.'}
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
          <input style={{ ...inputStyle, fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:22, padding:'14px 18px' }} value={name} onChange={e => setName(e.target.value)} placeholder="Your name or how you wish to be called" maxLength={50} />
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
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:18 }}>
          <div>
            <label style={labelStyle}>Pronouns (optional)</label>
            <input style={inputStyle} value={pronouns} onChange={e => setPronouns(e.target.value)} placeholder="she/her · they/them" maxLength={30} />
          </div>
          <div>
            <label style={labelStyle}>Public contact (optional)</label>
            <input style={inputStyle} value={contact} onChange={e => setContact(e.target.value)} placeholder="@insta · signal · telegram" maxLength={80} />
          </div>
        </div>

        {/* Favourite plant or mushroom — shown on public profile detail */}
        <div style={{ marginBottom:18 }}>
          <label style={labelStyle}>Favourite plant or mushroom</label>
          <input style={inputStyle} value={favoritePlant} onChange={e => setFavoritePlant(e.target.value)} placeholder="Chaga · Hawthorn · Amanita muscaria…" maxLength={60} />
        </div>

        {/* What recruited you — drops 5 $MH to the recruiter when saved */}
        <div style={{ marginBottom:24 }}>
          <label style={labelStyle}>What recruited you? &nbsp;<span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--mycelium-d)', textTransform:'none', letterSpacing:'0.04em' }}>(+5 $MH to the recruiter)</span></label>
          <select style={inputStyle} value={recruitedBy} onChange={e => setRecruitedBy(e.target.value)}>
            <option value="">— pick a thread —</option>
            {(window.SporeData?.MEMBERS || []).map(m => (
              <option key={m.id} value={m.id}>{m.name}{m.admin ? ' (admin)' : ''}{m.role ? ' · ' + m.role : ''}</option>
            ))}
            <option value="found-online">Found Fungai Art online</option>
            <option value="event">Met at an event / dinner</option>
            <option value="other">Other / can&rsquo;t say</option>
          </select>
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

/* ── Public profile detail modal — anyone can open by tapping a member card ── */

function PublicProfileModal({ member, onClose }) {
  if (!member) return null;
  const tier = SporeData.reputationTier(member.rep);
  const node = SporeData.NETWORK_NODES.find(n => n.id === member.node);
  const joined = (() => {
    if (!member.createdAt) return null;
    try {
      const d = new Date(member.createdAt);
      return d.toLocaleDateString('en-GB', { month:'long', year:'numeric' });
    } catch { return null; }
  })();
  // Make a contact look like a link only when it's a recognisable handle / email
  const contact = member.contact || '';
  const contactHref = contact.includes('@') && contact.includes('.')
    ? 'mailto:' + contact
    : contact.startsWith('@')
      ? 'https://instagram.com/' + contact.slice(1)
      : null;
  // Tier descriptions — what reaching each level actually means
  const TIER_DESCRIPTIONS = {
    'Spore':     'Just arrived. Watching, learning, planting first threads.',
    'Palawan':   'First contributions made. Earning a place in the network.',
    'Mycelium':  'Active contributor. Trusted across multiple nodes and ceremonies.',
    'Forager':   'Deep practitioner. Hosts events, leads expeditions, teaches.',
    'Root Node': 'Pillar of the network. Holds vision and stewardship.',
  };
  // Other members tending the same node
  const sameNode = (SporeData.MEMBERS || [])
    .filter(m => m.node === member.node && m.id !== member.id)
    .slice(0, 6);
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9100, background:'rgba(6,8,9,0.86)', backdropFilter:'blur(10px)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'40px 16px', overflowY:'auto' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width:'100%', maxWidth:480, background:'var(--soil-2)', border:'0.5px solid var(--rule-strong)', borderRadius:18, padding:'28px 26px', position:'relative', marginBottom:40 }}>
        <button onClick={onClose} style={{ position:'absolute', top:14, right:16, background:'none', border:'none', color:'var(--mycelium-d)', fontSize:22, cursor:'pointer', lineHeight:1 }}>×</button>

        {/* Header — avatar + name + badges */}
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:18 }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background: member.avatar ? `url(${member.avatar}) center/cover` : tier.color, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:28, color:'rgba(255,255,255,.9)', flexShrink:0, border:'0.5px solid var(--rule-strong)' }}>
            {!member.avatar && member.name[0]}
          </div>
          <div style={{ minWidth:0, flex:1 }}>
            <div style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:26, color:'var(--mycelium-l)', lineHeight:1.05, letterSpacing:'-.005em' }}>{member.name}</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginTop:6 }}>
              {member.founding && <span style={{ fontFamily:'var(--font-mono)', fontSize:7.5, letterSpacing:'0.16em', background:'linear-gradient(135deg, rgba(232,177,75,0.18), rgba(232,177,75,0.08))', border:'0.5px solid rgba(232,177,75,0.45)', borderRadius:3, padding:'2px 6px', color:'#F5D689' }}>FOUNDING</span>}
              {member.admin && <span style={{ fontFamily:'var(--font-mono)', fontSize:7.5, letterSpacing:'0.14em', background:'rgba(201,184,148,0.12)', border:'0.5px solid var(--rule-strong)', borderRadius:3, padding:'2px 6px', color:'var(--mycelium-d)' }}>ADMIN</span>}
              <span style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.16em', color: tier.color }}>● {tier.label}</span>
            </div>
          </div>
        </div>

        {/* Role + node */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
          <div style={{ background:'var(--soil-3)', border:'0.5px solid var(--rule)', borderRadius:8, padding:'10px 12px' }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:7.5, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--mycelium-d)' }}>Relation</div>
            <div style={{ fontSize:13, color:'var(--mycelium-l)', marginTop:3 }}>{member.role}</div>
          </div>
          <div style={{ background:'var(--soil-3)', border:'0.5px solid var(--rule)', borderRadius:8, padding:'10px 12px' }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:7.5, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--mycelium-d)' }}>Node</div>
            <div style={{ fontSize:13, color:'var(--mycelium-l)', marginTop:3 }}>{node ? node.name : (member.node || '—')}</div>
          </div>
        </div>

        {/* Stats — Rep · Balance · Pronouns (in one tight row) */}
        <div style={{ display:'grid', gridTemplateColumns: member.pronouns ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap:8, marginBottom:14 }}>
          <div style={{ background:'var(--soil-3)', border:'0.5px solid var(--rule)', borderRadius:8, padding:'10px 12px' }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:7.5, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--mycelium-d)' }}>Reputation</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:14, color: tier.color, marginTop:3 }}>{member.rep ?? 0} pts</div>
          </div>
          <div style={{ background:'var(--soil-3)', border:'0.5px solid var(--rule)', borderRadius:8, padding:'10px 12px' }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:7.5, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--mycelium-d)' }}>Balance</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:14, color:'var(--spore-l)', marginTop:3 }}>{member.balance ?? 0} $H</div>
          </div>
          {member.pronouns && (
            <div style={{ background:'var(--soil-3)', border:'0.5px solid var(--rule)', borderRadius:8, padding:'10px 12px' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:7.5, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--mycelium-d)' }}>Pronouns</div>
              <div style={{ fontSize:13, color:'var(--mycelium-l)', marginTop:3 }}>{member.pronouns}</div>
            </div>
          )}
        </div>

        {/* Tier description — what reaching this level means */}
        {TIER_DESCRIPTIONS[tier.label] && (
          <div style={{ marginBottom:14, padding:'12px 14px', background:`${tier.color}10`, border:`0.5px solid ${tier.color}40`, borderRadius:8 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:8, letterSpacing:'0.22em', textTransform:'uppercase', color: tier.color, marginBottom:5 }}>● {tier.label}</div>
            <div style={{ fontSize:12.5, color:'var(--mycelium)', lineHeight:1.55 }}>{TIER_DESCRIPTIONS[tier.label]}</div>
          </div>
        )}

        {/* Member since */}
        {joined && (
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9.5, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--mycelium-d)', marginBottom:14 }}>
            ✦ Member since {joined}
          </div>
        )}

        {/* Focus / bio */}
        {(member.bio || member.focus) && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--nutrient-l)', marginBottom:6 }}>In their own words</div>
            <div style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:16, color:'var(--mycelium-l)', lineHeight:1.55, letterSpacing:'-.005em' }}>"{member.bio || member.focus}"</div>
          </div>
        )}

        {/* Favourite plant */}
        {member.favoritePlant && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:'rgba(107,214,111,0.06)', border:'0.5px solid rgba(107,214,111,0.25)', borderRadius:8, marginBottom:14 }}>
            <div style={{ fontSize:20 }}>✿</div>
            <div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:7.5, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--spore-d)' }}>Favourite plant or mushroom</div>
              <div style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:18, color:'var(--spore-l)', marginTop:2 }}>{member.favoritePlant}</div>
            </div>
          </div>
        )}

        {/* Specialties */}
        {member.specialties && member.specialties.length > 0 && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--mycelium-d)', marginBottom:6 }}>Brings</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {member.specialties.map(t => (
                <span key={t} style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', padding:'5px 10px', borderRadius:999, background:'rgba(168,143,224,0.1)', border:'0.5px solid rgba(168,143,224,0.4)', color:'#C5B5F5' }}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Also tending this node */}
        {node && sameNode.length > 0 && (
          <div style={{ marginBottom:14, paddingTop:14, borderTop:'0.5px solid var(--rule)' }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--mycelium-d)', marginBottom:8 }}>
              Also tending {node.name}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {sameNode.map(m => {
                const t = SporeData.reputationTier(m.rep);
                return (
                  <div key={m.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px 4px 4px', background:'var(--soil-3)', border:'0.5px solid var(--rule)', borderRadius:999 }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', background: t.color, color:'rgba(255,255,255,.9)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:11 }}>{m.name[0]}</div>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--mycelium)' }}>{m.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Contact */}
        {contact && (
          <div style={{ paddingTop:14, borderTop:'0.5px solid var(--rule)' }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--mycelium-d)', marginBottom:5 }}>Reach out</div>
            {contactHref ? (
              <a href={contactHref} target="_blank" rel="noopener" style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--nutrient-l)', textDecoration:'none', borderBottom:'0.5px solid rgba(232,177,75,0.35)' }}>{contact}</a>
            ) : (
              <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--mycelium)' }}>{contact}</div>
            )}
          </div>
        )}
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
  const [viewProfile, setViewProfile] = useState(null); // admin: member being viewed (admin sheet)
  const [publicView, setPublicView] = useState(null);   // anyone: public detail modal
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

  // ── Supabase auth state — MUST be declared BEFORE the admin-sheet early
  //    return below, otherwise the second render (when an admin taps a
  //    member card) skips these hooks and React throws
  //    "Rendered fewer hooks than expected". Classic Rules-of-Hooks bug.
  const [sbUser, setSbUser] = useState(null);
  const [signInEmail, setSignInEmail] = useState('');
  const [signInBusy, setSignInBusy] = useState(false);
  useEffect(() => {
    if (!window.SBauth) return;
    let unsub;
    (async () => {
      const u = await window.SBauth.getUser();
      setSbUser(u);
      // Auto-open editor for fresh signed-in users who have no linked profile yet
      // (this is the post-magic-link landing flow). Detect either:
      //   ?signedin=1 → legacy implicit-flow marker we append to emailRedirectTo
      //   ?code=...   → PKCE flow auth code (auto-stripped by supabase-js after exchange,
      //                 but present on initial mount so we can use it as a trigger)
      const qs = window.location.search;
      const cameFromMagicLink = qs.includes('signedin') || qs.includes('code=');
      if (u && !isLinked && !myProfile && cameFromMagicLink) {
        setTimeout(() => setShowProfileEditor(true), 800);
      }
      const sub = window.SBauth.onAuthChange(({ user }) => setSbUser(user));
      unsub = sub?.data?.subscription?.unsubscribe?.bind(sub.data.subscription);
    })();
    return () => { if (unsub) try { unsub(); } catch {} };
  }, []);

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

  // Is the signed-in user already linked to a cloud profile?
  // (currentMember comes from the parent — set by tryAutoLogin when fetchMine succeeds)
  const isLinked = !!(currentMember && (currentMember.cloudId || currentMember.authUserId));

  // Build the editor-prefill object. Priority: cloud-merged currentMember > localStorage cache > nothing
  // Map MEMBERS-style fields (name/node/role-as-title) to the ProfileEditor schema (character_name/location/role-as-key)
  const ROLE_TITLE_TO_KEY = {
    'Founder':'founder','Co-Founder':'founder','Sound Healer':'sound','Documenter':'documenter',
    'Forager':'forager','Artist':'artist','Artist & Contributor':'artist','Cultivator':'cultivator',
    'Community Weaver':'weaver','Herbalist':'herbalist','Alchemist':'alchemist','Collaborator':'collaborator',
    'Patron':'patron','Student':'student','Seeker':'seeker','Ceremony Facilitator':'ceremony',
  };
  const editorExisting = (currentMember && (currentMember.cloudId || isLinked || currentMember.bio || currentMember.name))
    ? {
        character_name: currentMember.name || currentMember.character_name || '',
        bio:            currentMember.bio  || '',
        // try the lowercase id first (cloud), then map the capitalised title (hardcoded shells)
        role:           currentMember.role && (ROLE_TITLE_TO_KEY[currentMember.role] || (currentMember.role.toLowerCase ? currentMember.role.toLowerCase() : '') || ''),
        location:       currentMember.location || currentMember.node || '',
        pronouns:       currentMember.pronouns || '',
        contact:        currentMember.contact  || '',
        avatar:         currentMember.avatar   || currentMember.avatar_url || null,
        specialties:    currentMember.specialties || [],
      }
    : myProfile;

  // sbUser / signInEmail / signInBusy / their useEffect were hoisted above
  // the admin-sheet early return — see the block right after `isAdmin =`.
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
    // Clear cached profile + draft so the next visitor in this browser
    // doesn't inherit the previous user's identity.
    try {
      localStorage.removeItem('fungai_profile');
      localStorage.removeItem('fungai_profile_draft');
      localStorage.removeItem('spore_active_member');
    } catch {}
    // Reload to fully reset in-memory currentMember and force re-render
    setTimeout(() => { window.location.reload(); }, 200);
  }

  return (
    <div className="page-enter">
      {showProfileEditor && <ProfileEditor existing={editorExisting} onClose={() => setShowProfileEditor(false)} />}
      {publicView && <PublicProfileModal member={publicView} onClose={() => setPublicView(null)} />}

      <div className="section">
        <div className="section-eyebrow">The organism</div>
        <h2 className="section-title">Who's <em>tending.</em></h2>
        <p className="section-blurb">Each hyphae brings a different thread to the mycelium.</p>
      </div>

      {/* Identity & sign-in controls — moved here from Admin so any signed-in
          user can fix their founder link even if they're stuck on a non-admin
          profile like 'Robin1'. Renders nothing when there's nothing useful
          to do (signed in, linked, matched). */}
      <SelfIdentityBlock currentMember={currentMember} onToast={(m,k) => { try { window.dispatchEvent(new CustomEvent('spore:toast', { detail:{ msg:m, kind:k } })); } catch{} alert(m); }} />

      {/* Self-onboard / edit profile card.
          Logic:
          - Linked to cloud profile (currentMember has cloudId/authUserId): only EDIT — never offer "create new"
          - Local-cache profile but no cloud link: offer edit (will save to cloud if signed in)
          - Nothing yet: invite to set up — but require sign-in first to avoid orphan profiles
      */}
      {(() => {
        const linked = isLinked;
        const displayName = linked ? currentMember.name : (myProfile && myProfile.character_name);
        const displayMeta = linked
          ? `${currentMember.role || ''}${currentMember.node ? ' · ' + currentMember.node : ''}`
          : (myProfile ? `${myProfile.role || ''}${myProfile.location ? ' · ' + myProfile.location : ''}` : 'Set up your character — no wallet, no installation. ~3 minutes.');
        const has = !!displayName;
        const canCreate = sbUser && !linked; // only signed-in unlinked users can create new
        return (
          <div style={{ margin:'0 16px 12px', background: has ? 'linear-gradient(160deg, rgba(107,214,111,0.06), rgba(107,214,111,0.02))' : 'linear-gradient(160deg, rgba(232,177,75,0.06), rgba(232,177,75,0.02))', border: has ? '0.5px solid rgba(107,214,111,0.25)' : '0.5px solid rgba(232,177,75,0.3)', borderRadius:12, padding:'16px 18px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <div style={{ flex:'1 1 200px', minWidth:0 }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.22em', textTransform:'uppercase', color: has ? 'var(--spore-l)' : 'var(--nutrient-l)', marginBottom:4 }}>
                {linked ? '✦ Your thread · linked' : (has ? '✦ Your thread · local only' : '✦ Add yourself')}
              </div>
              <div style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:18, color:'var(--mycelium-l)', lineHeight:1.3 }}>
                {has ? displayName : 'Become a thread in the mycelium'}
              </div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:9.5, color:'var(--mycelium-d)', marginTop:3, letterSpacing:'0.04em' }}>
                {displayMeta}
              </div>
            </div>
            {has ? (
              <button
                onClick={() => setShowProfileEditor(true)}
                style={{ fontFamily:'var(--font-mono)', fontSize:9.5, letterSpacing:'0.24em', textTransform:'uppercase', padding:'11px 22px', borderRadius:999, border:'none', cursor:'pointer', background:'rgba(107,214,111,0.12)', color:'var(--spore-l)', whiteSpace:'nowrap', fontWeight:500 }}
              >
                Edit profile
              </button>
            ) : canCreate ? (
              <button
                onClick={() => setShowProfileEditor(true)}
                style={{ fontFamily:'var(--font-mono)', fontSize:9.5, letterSpacing:'0.24em', textTransform:'uppercase', padding:'11px 22px', borderRadius:999, border:'none', cursor:'pointer', background:'linear-gradient(135deg, var(--nutrient), var(--nutrient-d))', color:'var(--soil)', whiteSpace:'nowrap', fontWeight:500 }}
              >
                + Create profile
              </button>
            ) : (
              <div style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--mycelium-d)', padding:'10px 14px', border:'0.5px dashed var(--rule)', borderRadius:999 }}>
                Sign in below ↓ first
              </div>
            )}
          </div>
        );
      })()}

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
              style={{ cursor: isMe ? 'default' : 'pointer' }}
              onClick={() => {
                if (isMe) return;
                // Admin: open the admin sheet (rep/balance/activity).
                // Anyone: open the public-facing detail modal.
                if (isAdmin) setViewProfile(m);
                else setPublicView(m);
              }}
              title={isMe ? '' : 'Tap to view profile'}
            >
              <div className="member-avatar" style={{ background: tier.color }}>{m.name[0]}</div>
              <div className="member-body">
                <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                  <div className="member-name">{m.name}</div>
                  {m.founding && <span style={{ fontFamily:'var(--font-mono)', fontSize:7.5, letterSpacing:'0.16em', background:'linear-gradient(135deg, rgba(232,177,75,0.18), rgba(232,177,75,0.08))', border:'0.5px solid rgba(232,177,75,0.45)', borderRadius:3, padding:'2px 6px', color:'#F5D689' }}>FOUNDING</span>}
                  {m.admin && <span style={{ fontFamily:'var(--font-mono)', fontSize:7.5, letterSpacing:'0.14em', background:'rgba(201,184,148,0.12)', border:'0.5px solid var(--rule-strong)', borderRadius:3, padding:'1px 5px', color:'var(--mycelium-d)' }}>ADMIN</span>}
                  {!isMe && <span style={{ fontFamily:'var(--font-mono)', fontSize:7.5, color:'var(--mycelium-d)', marginLeft:'auto' }}>tap ↗</span>}
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

// ── Admin sub-blocks ──────────────────────────────────────────────────────

// Lets the signed-in user attach themselves to the right hardcoded MEMBERS
// entry by renaming their cloud profile to that member's name. The auto-
// match in tryAutoLogin (case-insensitive character_name → MEMBERS.name)
// then picks them up. Also exposes Supabase auth.updateUser for changing
// the account email without leaving the portal.
function SelfIdentityBlock({ currentMember, onToast }) {
  const [authEmail, setAuthEmail] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [myCharName, setMyCharName] = useState('');
  const [cloudId, setCloudId] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [signInEmail, setSignInEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  async function refreshAuth() {
    try {
      if (!window.SBauth) { setAuthChecked(true); return; }
      const u = await window.SBauth.getUser();
      setAuthEmail(u?.email || '');
      if (window.SBprofiles) {
        const mine = await window.SBprofiles.fetchMine();
        if (mine) { setMyCharName(mine.character_name || ''); setCloudId(mine.id); }
      }
    } catch (e) { /* not fatal */ }
    finally { setAuthChecked(true); }
  }

  useEffect(() => { refreshAuth(); }, []);

  const founders = (SporeData.MEMBERS || []).filter(m => m.founding || m.admin);
  const isAuthed = !!authEmail;
  const linkedLabel = currentMember ? currentMember.name : '— not linked —';
  // "matched" = linked to a real hardcoded founder thread. Not enough that
  // currentMember.name === cloud.character_name — if a runtime-loaded cloud
  // profile (like 'Robin1') ended up in MEMBERS, the user is still NOT on
  // a founder identity, so we need to surface the relink picker.
  const matched = !!(currentMember && currentMember.founding);

  async function sendMagicLink() {
    if (!window.SBauth) { onToast('Auth client not loaded.', 'warn'); return; }
    const trimmed = signInEmail.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) { onToast('Enter a valid email.', 'warn'); return; }
    setBusy(true);
    try {
      const { error } = await window.SBauth.signIn(trimmed);
      if (error) throw error;
      setLinkSent(true);
      onToast('Magic link sent. Click it on this device / browser.', 'success');
    } catch (err) {
      onToast('Sign-in failed: ' + (err.message || err), 'warn');
    } finally { setBusy(false); }
  }

  async function relinkAs(founderName) {
    if (!isAuthed) { onToast('Sign in below first, then click again.', 'warn'); return; }
    if (!cloudId) {
      // Auth user exists but no profile row yet — create one with the founder name.
      setBusy(true);
      try {
        await window.SBprofiles.upsert({ character_name: founderName, role:'founder', node:'berlin' });
        onToast(`Created profile as ${founderName}. Reloading…`, 'success');
        setTimeout(() => window.location.reload(), 700);
      } catch (err) {
        onToast('Could not create profile: ' + (err.message || err), 'warn');
        setBusy(false);
      }
      return;
    }
    setBusy(true);
    try {
      const { error } = await window.SBclient
        .from('profiles').update({ character_name: founderName }).eq('id', cloudId);
      if (error) throw error;
      onToast(`Linked your account to ${founderName}. Reloading…`, 'success');
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      onToast('Relink failed: ' + (err.message || err), 'warn');
      setBusy(false);
    }
  }

  async function changeEmail() {
    if (!isAuthed) { onToast('Sign in below first, then change your email.', 'warn'); return; }
    const trimmed = newEmail.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) { onToast('Enter a valid email address.', 'warn'); return; }
    setBusy(true);
    try {
      const { error } = await window.SBclient.auth.updateUser({ email: trimmed });
      if (error) throw error;
      onToast('Confirmation links sent to both old and new addresses.', 'success');
      setNewEmail('');
    } catch (err) {
      onToast('Email change failed: ' + (err.message || err), 'warn');
    } finally { setBusy(false); }
  }

  // Hard-removes the current account's cloud profile row. Useful when the
  // user accidentally created e.g. "robin1" and wants to start clean before
  // re-claiming the founder identity. Auth user stays — only the profiles
  // row is deleted (RLS allows users to delete their own row).
  async function deleteMyCloudProfile() {
    if (!isAuthed || !cloudId) { onToast('Nothing to delete — no cloud profile.', 'warn'); return; }
    if (!confirm('Permanently delete your current cloud profile row (' + (myCharName || cloudId) + ')? Your auth account stays; only the profile entry is removed. You can re-create immediately.')) return;
    setBusy(true);
    try {
      const { error } = await window.SBclient
        .from('profiles').delete().eq('id', cloudId);
      if (error) throw error;
      onToast('Cloud profile deleted. Reloading…', 'success');
      try { localStorage.removeItem('fungai_profile'); } catch {}
      try { localStorage.removeItem('spore_active_member'); } catch {}
      try { localStorage.removeItem('spore_active_member_full'); } catch {}
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      onToast('Delete failed (RLS may block it): ' + (err.message || err), 'warn');
      setBusy(false);
    }
  }

  if (!authChecked) return null;

  return (
    <div style={{ margin:'8px 16px 0', background:'linear-gradient(160deg, rgba(168,143,224,0.05), rgba(168,143,224,0.01))', border:'0.5px solid rgba(168,143,224,0.28)', borderRadius:10, padding:'14px 16px' }}>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.22em', textTransform:'uppercase', color:'#C5B5F5', marginBottom:6 }}>✦ Your identity on this device</div>

      {/* Status line */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:10 }}>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--mycelium-d)' }}>Cloud session</span>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color: isAuthed ? 'var(--spore-l)' : '#E16B6B' }}>{isAuthed ? authEmail : 'not signed in'}</span>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--mycelium-d)', marginLeft:8 }}>·</span>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--mycelium-d)' }}>local thread</span>
        <span style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:14, color: 'var(--mycelium-l)' }}>{linkedLabel}</span>
        {myCharName && <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--mycelium-d)' }}>· cloud name {myCharName}</span>}
      </div>

      {/* Not signed in → inline magic-link form. This is the source of the
          confusing "Auth session missing!" error: the local thread can read
          "Robin" while the actual Supabase session is empty. Surface it
          clearly and offer to sign in right here. */}
      {!isAuthed && (
        <div style={{ marginBottom:12, padding:'10px 12px', background:'rgba(225,107,107,0.06)', border:'0.5px solid rgba(225,107,107,0.28)', borderRadius:6 }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', color:'#E16B6B', marginBottom:6 }}>Local-only mode</div>
          <p style={{ fontSize:12, color:'var(--mycelium)', lineHeight:1.55, margin:'0 0 8px' }}>
            You&rsquo;re seeing the network through the locally-cached Robin profile, but there&rsquo;s no live Supabase session — so cloud features (email change, restrictions sync, founder relink) can&rsquo;t fire. Sign in here to enable them.
          </p>
          {linkSent ? (
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--spore-l)' }}>✓ Magic link sent. Open the email <strong>on this browser</strong> — PKCE flow needs the same tab.</div>
          ) : (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <input type="email" placeholder="robin@fungai.art" value={signInEmail} onChange={e => setSignInEmail(e.target.value)} style={{ flex:'1 1 220px', minWidth:0, padding:'9px 11px', borderRadius:6, background:'var(--soil-3)', border:'0.5px solid var(--rule)', color:'var(--mycelium-l)', fontFamily:'var(--font-sans)', fontSize:13, outline:'none' }} />
              <button onClick={sendMagicLink} disabled={busy} style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', padding:'9px 16px', borderRadius:999, background:'linear-gradient(135deg, var(--spore), var(--spore-d))', border:'none', color:'var(--soil)', cursor: busy ? 'wait' : 'pointer' }}>
                Send magic link
              </button>
            </div>
          )}
        </div>
      )}

      {/* Signed in but local thread name doesn't match cloud character_name */}
      {isAuthed && !matched && (
        <div style={{ marginBottom:12, padding:'10px 12px', background:'rgba(232,177,75,0.06)', border:'0.5px solid rgba(232,177,75,0.28)', borderRadius:6 }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--nutrient-l)', marginBottom:6 }}>Cloud profile not linked to a founder</div>
          <p style={{ fontSize:12, color:'var(--mycelium)', lineHeight:1.55, margin:'0 0 8px' }}>
            Pick which founder this Supabase account corresponds to. We rename your cloud profile&rsquo;s <code>character_name</code> to match — auto-merge happens on next reload.
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {founders.map(f => (
              <button key={f.id} disabled={busy} onClick={() => relinkAs(f.name)} style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.16em', textTransform:'uppercase', padding:'7px 12px', borderRadius:999, background:'rgba(168,143,224,0.1)', border:'0.5px solid rgba(168,143,224,0.45)', color:'#C5B5F5', cursor: busy ? 'wait' : 'pointer' }}>
                I am {f.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Email change — only relevant when there's an actual Supabase session */}
      {isAuthed && (
        <details>
          <summary style={{ cursor:'pointer', listStyle:'none', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, fontFamily:'var(--font-mono)', fontSize:9.5, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--mycelium-d)', padding:'4px 0' }}>
            <span>✉ Change my account email</span>
            <span>▾</span>
          </summary>
          <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
            <input type="email" placeholder="new@email.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={{ flex:'1 1 220px', minWidth:0, padding:'9px 11px', borderRadius:6, background:'var(--soil-3)', border:'0.5px solid var(--rule)', color:'var(--mycelium-l)', fontFamily:'var(--font-sans)', fontSize:13, outline:'none' }} />
            <button onClick={changeEmail} disabled={busy} style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', padding:'9px 16px', borderRadius:999, background:'linear-gradient(135deg, var(--spore), var(--spore-d))', border:'none', color:'var(--soil)', cursor: busy ? 'wait' : 'pointer' }}>
              Send change link
            </button>
          </div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, color:'var(--mycelium-d)', marginTop:6, lineHeight:1.55 }}>
            Supabase will email BOTH addresses with a confirmation link. The change isn&rsquo;t live until you click the link in the new inbox.
          </div>
        </details>
      )}

      {/* Wipe-my-cloud-profile — escape hatch when you ended up as 'robin1' and
          want to start clean. Robin-only: the RLS policy on the profiles table
          only permits deletes from auth.email() = 'robin@fungai.art', so we
          hide the button for everyone else (no point surfacing a button that
          will always 403). */}
      {isAuthed && cloudId && authEmail === 'robin@fungai.art' && (
        <details style={{ marginTop:6 }}>
          <summary style={{ cursor:'pointer', listStyle:'none', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, fontFamily:'var(--font-mono)', fontSize:9.5, letterSpacing:'0.18em', textTransform:'uppercase', color:'#E16B6B', padding:'4px 0' }}>
            <span>✕ Delete my current cloud profile (Robin only)</span>
            <span>▾</span>
          </summary>
          <p style={{ fontSize:12, color:'var(--mycelium-d)', lineHeight:1.55, margin:'8px 0' }}>
            Deletes the profile row currently linked to <strong>{authEmail}</strong> (character_name <em>{myCharName}</em>). Useful if you ended up on the wrong name like &ldquo;robin1&rdquo; and want to re-claim the right founder identity. Your auth login stays; only the profile entry goes.
          </p>
          <button onClick={deleteMyCloudProfile} disabled={busy} style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', padding:'9px 16px', borderRadius:999, background:'rgba(225,107,107,0.08)', border:'0.5px solid rgba(225,107,107,0.5)', color:'#E16B6B', cursor: busy ? 'wait' : 'pointer' }}>
            ✕ Delete profile row
          </button>
        </details>
      )}
    </div>
  );
}

function PendingContributionsBlock({ onToast }) {
  const [, bump] = useState(0);
  useEffect(() => {
    const refresh = () => bump(b => b + 1);
    window.addEventListener('spore:economy', refresh);
    const t = setInterval(refresh, 30000);
    return () => { window.removeEventListener('spore:economy', refresh); clearInterval(t); };
  }, []);
  const pending = SporeEconomy.pendingSessions();
  function accept(p) {
    SporeEconomy.acceptContribSession(p.memberId, p.sessionIndex);
    onToast(`Accepted ${(p.minutes / 60).toFixed(2)}h for ${p.memberName}`, 'success');
  }
  const fmtMins = m => m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
  return (
    <>
      <div className="section" style={{ paddingBottom:0 }}>
        <div className="section-eyebrow">Pending review</div>
        <h3 style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:20, color:'var(--mycelium-l)', marginTop:4, marginBottom:6 }}>Contribution <em>queue.</em> <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--mycelium-d)', fontStyle:'normal' }}>· {pending.length} waiting</span></h3>
        <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--mycelium-d)', lineHeight:1.6 }}>Each stopped contribution timer lands here. Accept to issue $MH at the rate of {SporeData.TOKEN.CONTRIB_RATE_PER_HOUR} $MH per hour.</p>
      </div>
      <div style={{ margin:'8px 16px 16px', background:'var(--soil-2)', border:'0.5px solid var(--rule)', borderRadius:10, overflow:'hidden' }}>
        {pending.length === 0 && (
          <div style={{ padding:'20px', textAlign:'center', fontStyle:'italic', color:'var(--mycelium-d)', fontSize:12 }}>No pending sessions.</div>
        )}
        {pending.map((p, i) => (
          <div key={p.memberId + '-' + p.sessionIndex} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, padding:'12px 14px', borderBottom: i < pending.length - 1 ? '0.5px solid var(--rule)' : 'none', flexWrap:'wrap' }}>
            <div style={{ minWidth:0 }}>
              <div style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:15, color:'var(--mycelium-l)' }}>{p.memberName}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--mycelium-d)', marginTop:2 }}>
                {fmtMins(p.minutes)} &middot; ends {new Date(p.end).toLocaleString()} &middot; payout {((p.minutes / 60) * SporeData.TOKEN.CONTRIB_RATE_PER_HOUR).toFixed(2)} $MH
              </div>
            </div>
            <button onClick={() => accept(p)} style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', padding:'7px 16px', borderRadius:999, background:'linear-gradient(135deg, var(--spore), var(--spore-d))', border:'none', color:'var(--soil)', cursor:'pointer' }}>
              ✦ Accept
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function WeeklyReportBlock({ currentMemberId, onToast }) {
  const isAdmin = currentMemberId === 'robin' || currentMemberId === 'stephanie';
  if (!isAdmin) return null;
  const existing = SporeEconomy.thisWeekReport(currentMemberId);
  const [body, setBody] = useState(existing ? existing.body : '');
  const [savedAt, setSavedAt] = useState(existing ? existing.ts : null);
  const wk = SporeEconomy.weekStartIso();
  const now = new Date();
  const hour = now.getHours();
  const inWindow = hour >= 12 && hour < 24;
  function submit() {
    if (!body.trim()) return;
    SporeEconomy.submitWeeklyReport(currentMemberId, body.trim());
    setSavedAt(Date.now());
    onToast('Weekly report submitted', 'success');
  }
  const recent = SporeEconomy.recentReports(null, 6);
  return (
    <>
      <div className="section" style={{ paddingBottom:0 }}>
        <div className="section-eyebrow">Founder check-in</div>
        <h3 style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:20, color:'var(--mycelium-l)', marginTop:4, marginBottom:6 }}>Weekly <em>report.</em> <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--mycelium-d)', fontStyle:'normal' }}>· week of {wk}</span></h3>
        <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--mycelium-d)', lineHeight:1.6 }}>
          Submit between <strong>12:00 and 24:00</strong>. Sunday at any hour Myco drops a reminder into your inbox.
          {!inWindow && <span style={{ color:'#E16B6B', marginLeft:6 }}>Outside the window — you can still draft.</span>}
        </p>
      </div>
      <div style={{ margin:'8px 16px 0', background:'var(--soil-2)', border:'0.5px solid var(--rule)', borderRadius:10, padding:'16px' }}>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={5}
          placeholder="What did you tend this week? What needs attention?"
          style={{ width:'100%', background:'var(--soil-3)', border:'0.5px solid var(--rule)', borderRadius:6, padding:'10px 12px', color:'var(--mycelium-l)', fontSize:13, lineHeight:1.5, resize:'vertical', outline:'none', fontFamily:'var(--font-sans)', boxSizing:'border-box', marginBottom:10 }}
        />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--mycelium-d)' }}>
            {savedAt ? `Saved · ${new Date(savedAt).toLocaleString()}` : 'Not yet submitted this week'}
          </div>
          <button onClick={submit} className="btn btn-primary" style={{ padding:'10px 22px' }}>
            {savedAt ? 'Update report' : '✦ Submit report'}
          </button>
        </div>
      </div>
      {recent.length > 0 && (
        <div style={{ margin:'12px 16px 16px', background:'var(--soil-3)', border:'0.5px solid var(--rule)', borderRadius:8, padding:'10px 12px' }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--mycelium-d)', marginBottom:6 }}>Recent reports</div>
          {recent.map((r, i) => {
            const m = SporeData.MEMBERS.find(x => x.id === r.memberId);
            return (
              <div key={i} style={{ padding:'6px 0', borderTop: i ? '0.5px solid var(--rule)' : 'none' }}>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--mycelium-d)' }}>{m ? m.name : r.memberId} · {r.weekStart}</div>
                <div style={{ fontSize:12, color:'var(--mycelium-l)', lineHeight:1.5, marginTop:2, whiteSpace:'pre-wrap' }}>{r.body.length > 220 ? r.body.slice(0, 220) + '…' : r.body}</div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function AdminPage({ onToast, currentMember }) {
  const currentMemberId = currentMember && currentMember.id;
  const isRobin = currentMemberId === 'robin';
  const [announcement, setAnnouncement] = useState(() => {
    try { return localStorage.getItem('spore_announcement') || ''; } catch { return ''; }
  });
  const [saved, setSaved] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [restrictionEdits, setRestrictionEdits] = useState({}); // {cloudId: ['foraging','mixology']}
  const [savingRestrictions, setSavingRestrictions] = useState({});

  // Foraging is deliberately omitted — it's open to everyone, no restrictions.
  const RESTRICTABLE_FEATURES = [
    { id:'extraction', label:'Extraction'   },
    { id:'mixology',   label:'Mixology'     },
    { id:'community',  label:'Community'    },
  ];

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

  // Resolve current restrictions for a member: in-memory edit > cloud value > [].
  // Admins always return [] — they bypass restrictions by design, so the toggles
  // appear greyed in the UI but never actually apply.
  function currentRestrictions(m) {
    if (m.admin) return [];
    if (!m.cloudId) return [];
    if (restrictionEdits[m.cloudId]) return restrictionEdits[m.cloudId];
    return m.restrictions || [];
  }

  function toggleRestriction(m, feature) {
    if (m.admin) { onToast(`${m.name} is an admin — admins always bypass restrictions.`, 'warn'); return; }
    if (!m.cloudId) { onToast('Member has no cloud profile yet — claim it first.', 'warn'); return; }
    const cur = currentRestrictions(m);
    const next = cur.includes(feature) ? cur.filter(x => x !== feature) : [...cur, feature];
    setRestrictionEdits(e => ({ ...e, [m.cloudId]: next }));
  }

  async function saveRestrictions(m) {
    if (!m.cloudId) return;
    setSavingRestrictions(s => ({ ...s, [m.cloudId]: true }));
    try {
      // Local-first: write the restrictions list to a per-cloudId localStorage
      // key. The Supabase `profiles` table doesn't have a `restrictions`
      // column (no migration applied yet) so we keep this local until you
      // run the alter table. The cross-page gate (/spore-gate.js) reads
      // from spore_active_member_full which we already populate at login.
      try {
        const map = JSON.parse(localStorage.getItem('spore_restrictions_by_cloud') || '{}');
        map[m.cloudId] = currentRestrictions(m);
        localStorage.setItem('spore_restrictions_by_cloud', JSON.stringify(map));
      } catch {}
      // Best-effort cloud sync. Silently no-ops when the column doesn't
      // exist; surfaces only unexpected errors.
      if (window.SBclient) {
        const { error } = await window.SBclient
          .from('profiles')
          .update({ restrictions: currentRestrictions(m) })
          .eq('id', m.cloudId);
        if (error && !/schema cache|column.*restrictions/i.test(error.message || '')) {
          throw error;
        }
      }
      onToast(`Saved restrictions for ${m.name}`, 'success');
      setRestrictionEdits(e => { const n = {...e}; delete n[m.cloudId]; return n; });
      m.restrictions = currentRestrictions(m); // optimistic local update
    } catch (err) {
      onToast('Save failed: ' + (err.message || err), 'warn');
    } finally {
      setSavingRestrictions(s => ({ ...s, [m.cloudId]: false }));
    }
  }

  return (
    <div className="page-enter">
      {showCreate && <ProfileEditor existing={null} onClose={() => setShowCreate(false)} />}

      <div className="section">
        <div className="section-eyebrow">Founder access</div>
        <h2 className="section-title">Admin <em>panel.</em></h2>
      </div>

      {/* Self-identity tools — make it easy to link this signed-in account to
          the right hardcoded MEMBERS entry without back-and-forth. */}
      <SelfIdentityBlock currentMember={currentMember} onToast={onToast} />

      {/* Quick actions (admin-only profile creation) */}
      <div style={{ margin:'8px 16px 0', background:'linear-gradient(160deg, rgba(232,177,75,0.06), rgba(232,177,75,0.02))', border:'0.5px solid rgba(232,177,75,0.3)', borderRadius:10, padding:'14px 16px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
        <div style={{ flex:'1 1 200px', minWidth:0 }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--nutrient-l)', marginBottom:4 }}>✦ Admin tools</div>
          <div style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:17, color:'var(--mycelium-l)', lineHeight:1.3 }}>Add a new thread to the network</div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--mycelium-d)', marginTop:3 }}>Creates a new profile in Supabase. New member can claim it via magic-link with their email.</div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ fontFamily:'var(--font-mono)', fontSize:9.5, letterSpacing:'0.24em', textTransform:'uppercase', padding:'11px 22px', borderRadius:999, border:'none', cursor:'pointer', background:'linear-gradient(135deg, var(--nutrient), var(--nutrient-d))', color:'var(--soil)', whiteSpace:'nowrap', fontWeight:500 }}
        >
          + Create profile
        </button>
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

      {/* Pending contributions queue — every stopped timer lands here for admin acceptance */}
      <PendingContributionsBlock onToast={onToast} />

      {/* Weekly report — Robin and Stephanie each submit one per week */}
      <WeeklyReportBlock currentMemberId={currentMemberId} onToast={onToast} />

      {/* Per-member feature restrictions — collapsed by default. Each member
          row is now a single-line summary that expands on click; the long
          list of 3-toggle-pill rows was eating most of the page. */}
      <details className="section" style={{ paddingBottom:0 }}>
        <summary style={{ cursor:'pointer', listStyle:'none', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, padding:'6px 0' }}>
          <div>
            <div className="section-eyebrow">Access control</div>
            <h3 style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:20, color:'var(--mycelium-l)', marginTop:4, marginBottom:0 }}>Restrict <em>features.</em> <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--mycelium-d)', fontStyle:'normal', letterSpacing:0 }}>&middot; {SporeData.MEMBERS.filter(m => !m.admin && m.cloudId).length} editable threads</span></h3>
          </div>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--mycelium-d)' }}>show &darr;</span>
        </summary>
        <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--mycelium-d)', lineHeight:1.6, margin:'4px 0 10px' }}>Tap a member to expand toggles. Enforced on /mixology and /extraction via /spore-gate.js. Admins always bypass.</p>
        <div style={{ margin:'0 0 16px', background:'var(--soil-2)', border:'0.5px solid var(--rule)', borderRadius:10, overflow:'hidden' }}>
          {SporeData.MEMBERS.map((m, i, arr) => {
            const r = currentRestrictions(m);
            const dirty = !!restrictionEdits[m.cloudId];
            const busy = !!savingRestrictions[m.cloudId];
            const isAdminRow = m.admin;
            const noCloud = !m.cloudId;
            const summary = isAdminRow
              ? 'admin · bypass'
              : noCloud ? 'unclaimed'
              : r.length === 0 ? 'no restrictions'
              : r.map(id => (RESTRICTABLE_FEATURES.find(f => f.id === id) || {}).label || id).join(' · ');
            return (
              <details key={m.id} style={{ borderBottom: i < arr.length - 1 ? '0.5px solid var(--rule)' : 'none' }}>
                <summary style={{ cursor: (isAdminRow || noCloud) ? 'default' : 'pointer', listStyle:'none', display:'flex', alignItems:'center', gap:10, padding:'9px 14px', opacity: isAdminRow ? 0.7 : 1 }}>
                  <div style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:14, color:'var(--mycelium-l)', minWidth:80 }}>{m.name}</div>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color: r.length > 0 ? '#E16B6B' : 'var(--mycelium-d)', letterSpacing:'0.06em', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{summary}</span>
                  {!isAdminRow && !noCloud && (
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--mycelium-d)' }}>&middot; edit</span>
                  )}
                </summary>
                {!isAdminRow && !noCloud && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5, alignItems:'center', padding:'4px 14px 12px' }}>
                    {RESTRICTABLE_FEATURES.map(f => {
                      const blocked = r.includes(f.id);
                      return (
                        <button key={f.id} type="button" onClick={() => toggleRestriction(m, f.id)}
                          style={{
                            fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase',
                            padding:'5px 10px', borderRadius:999, cursor:'pointer',
                            background: blocked ? 'rgba(225,107,107,0.12)' : 'var(--soil-3)',
                            border: blocked ? '0.5px solid rgba(225,107,107,0.5)' : '0.5px solid var(--rule)',
                            color: blocked ? '#E16B6B' : 'var(--mycelium-d)',
                          }}>
                          {blocked ? '✕' : '○'} {f.label}
                        </button>
                      );
                    })}
                    {dirty && (
                      <button type="button" onClick={() => saveRestrictions(m)} disabled={busy} style={{ marginLeft:'auto', fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', padding:'5px 12px', borderRadius:999, background:'linear-gradient(135deg, var(--spore), var(--spore-d))', border:'none', color:'var(--soil)', cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1 }}>
                        {busy ? '…' : '✦ Save'}
                      </button>
                    )}
                  </div>
                )}
              </details>
            );
          })}
        </div>
      </details>

      {/* Member overview — "All hyphaes" with per-member expandable details
          (hours / recruits / events / email / contribution timer / remove
          for Robin only). */}
      <div className="section" style={{ paddingBottom:0 }}>
        <div className="section-eyebrow">All hyphaes &middot; {SporeData.MEMBERS.length} threads</div>
      </div>
      <div style={{ margin:'8px 16px 0', background:'var(--soil-2)', border:'0.5px solid var(--rule)', borderRadius:10, overflow:'hidden' }}>
        {SporeData.MEMBERS.map((m, i) => (
          <AdminHyphaeRow key={m.id} m={m} last={i === SporeData.MEMBERS.length - 1} isRobin={isRobin} currentMemberId={currentMemberId} onToast={onToast} />
        ))}
      </div>
    </div>
  );
}

function AdminHyphaeRow({ m, last, isRobin, currentMemberId, onToast }) {
  const [, bump] = useState(0);
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgBody, setMsgBody] = useState('');
  useEffect(() => {
    const refresh = () => bump(b => b + 1);
    window.addEventListener('spore:economy', refresh);
    // 1s tick while panel is open so the running timer reads live
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => { window.removeEventListener('spore:economy', refresh); clearInterval(id); };
  }, []);

  const bal   = SporeEconomy.getBalance(m.id);
  const rep   = m.rep;
  const tier  = SporeData.reputationTier(rep);
  const hours = SporeEconomy.totalHoursContributed(m.id);
  const recruits = SporeEconomy.recruitsCount(m.id);
  const events = SporeEconomy.eventsParticipatedCount(m.id);
  const contrib = SporeEconomy.getContrib(m.id);
  const running = !!contrib.startedAt;
  const runningMin = running ? Math.max(0, Math.round((Date.now() - contrib.startedAt) / 60000)) : 0;
  const isMe = currentMemberId === m.id;
  const memberEmail = m.cloudEmail || m.email || (m.cloudId ? '— (linked, email RLS-gated)' : '— (unclaimed)');

  function toggleTimer() {
    if (running) {
      SporeEconomy.stopContrib(m.id);
      onToast(`Stopped timer for ${m.name} — ${runningMin}m queued for review`, 'success');
    } else {
      SporeEconomy.startContrib(m.id);
      onToast(`Started timer for ${m.name}`, 'success');
    }
  }
  function sendMsg() {
    if (!msgBody.trim()) return;
    SporeEconomy.sendMessage(currentMemberId || 'admin', (SporeData.MEMBERS.find(x => x.id === currentMemberId) || {}).name || 'Admin', m.id, msgBody.trim());
    setMsgBody('');
    setMsgOpen(false);
    onToast(`Message sent to ${m.name}`, 'success');
  }
  async function removeProfile() {
    if (!isRobin) return;
    if (!confirm(`Remove ${m.name} permanently? This deletes their cloud profile row AND clears their local balance / contrib / messages on this device. Auth user (Supabase login) stays.`)) return;
    // Local wipe first (always safe)
    try {
      ['spore_bal_','spore_contrib_','spore_events_','spore_msgs_','spore_state_'].forEach(p => localStorage.removeItem(p + m.id));
      const list = JSON.parse(localStorage.getItem('spore_recruits') || '{}');
      delete list[m.id];
      Object.keys(list).forEach(k => { list[k] = (list[k] || []).filter(x => x !== m.id); });
      localStorage.setItem('spore_recruits', JSON.stringify(list));
    } catch {}
    // Cloud delete — succeeds only if the RLS policy "only robin can delete profiles"
    // is in place. Surfaces an explicit error otherwise so we know why.
    if (m.cloudId && window.SBclient) {
      try {
        const { error } = await window.SBclient.from('profiles').delete().eq('id', m.cloudId);
        if (error) throw error;
        onToast(`Removed ${m.name} (cloud + local)`, 'success');
      } catch (err) {
        onToast(`Removed ${m.name} locally, but cloud delete failed: ${err.message || err}`, 'warn');
      }
    } else {
      onToast(`Removed ${m.name} (local data only — no cloud profile)`, 'success');
    }
    bump(b => b + 1);
  }

  return (
    <div style={{ borderBottom: last ? 'none' : '0.5px solid var(--rule)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', cursor:'pointer' }} onClick={() => setOpen(o => !o)}>
        <div style={{ width:32, height:32, borderRadius:'50%', background:tier.color, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:16, color:'rgba(255,255,255,0.9)', flexShrink:0 }}>{m.name[0]}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:16, color:'var(--mycelium-l)', lineHeight:1 }}>
            {m.name} {m.admin && <span style={{ fontFamily:'var(--font-mono)', fontSize:8, letterSpacing:'0.14em', color:tier.color, verticalAlign:'middle' }}>ADMIN</span>}
            {running && <span style={{ fontFamily:'var(--font-mono)', fontSize:8, letterSpacing:'0.14em', color:'#6BD66F', marginLeft:8 }}>● TIMER · {runningMin}m</span>}
          </div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--mycelium-d)', marginTop:2 }}>{m.role}</div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--spore-l)' }}>{bal} $MH</div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color: tier.color, marginTop:1 }}>{tier.label}</div>
        </div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--mycelium-d)', marginLeft:6 }}>{open ? '▴' : '▾'}</div>
      </div>
      {open && (
        <div style={{ padding:'10px 14px 14px', borderTop:'0.5px solid var(--rule)', background:'rgba(0,0,0,0.18)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(110px, 1fr))', gap:6, marginBottom:10 }}>
            <Stat label="Hours" value={`${hours}h`} />
            <Stat label="Recruits" value={recruits} />
            <Stat label="Events" value={events} />
            <Stat label="Balance" value={`${bal} $MH`} />
          </div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--mycelium-d)', marginBottom:8 }}>
            ✉ {memberEmail}
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {!isMe && (
              <button onClick={toggleTimer} style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.16em', textTransform:'uppercase', padding:'6px 12px', borderRadius:999, background: running ? 'rgba(225,107,107,0.12)' : 'rgba(107,214,111,0.12)', border: running ? '0.5px solid rgba(225,107,107,0.5)' : '0.5px solid rgba(107,214,111,0.5)', color: running ? '#E16B6B' : '#6BD66F', cursor:'pointer' }}>
                {running ? `⏸ Stop · ${runningMin}m` : '▶ Start contribution'}
              </button>
            )}
            <button onClick={() => setMsgOpen(o => !o)} style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.16em', textTransform:'uppercase', padding:'6px 12px', borderRadius:999, background:'var(--soil-3)', border:'0.5px solid var(--rule)', color:'var(--mycelium-d)', cursor:'pointer' }}>
              ✉ Message
            </button>
            {isRobin && !m.admin && (
              <button onClick={removeProfile} style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.16em', textTransform:'uppercase', padding:'6px 12px', borderRadius:999, background:'rgba(225,107,107,0.08)', border:'0.5px solid rgba(225,107,107,0.4)', color:'#E16B6B', cursor:'pointer', marginLeft:'auto' }}>
                ✕ Remove
              </button>
            )}
          </div>
          {msgOpen && (
            <div style={{ marginTop:10, padding:10, background:'var(--soil-3)', border:'0.5px solid var(--rule)', borderRadius:6 }}>
              <textarea value={msgBody} onChange={e => setMsgBody(e.target.value)} rows={2} placeholder={`Message to ${m.name}…`} style={{ width:'100%', background:'var(--soil-2)', border:'0.5px solid var(--rule)', borderRadius:4, padding:'8px 10px', color:'var(--mycelium-l)', fontSize:12, lineHeight:1.4, resize:'vertical', outline:'none', fontFamily:'var(--font-sans)', boxSizing:'border-box', marginBottom:8 }} />
              <div style={{ display:'flex', justifyContent:'flex-end', gap:6 }}>
                <button onClick={() => { setMsgOpen(false); setMsgBody(''); }} style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.16em', textTransform:'uppercase', padding:'6px 12px', borderRadius:999, background:'transparent', border:'0.5px solid var(--rule)', color:'var(--mycelium-d)', cursor:'pointer' }}>Cancel</button>
                <button onClick={sendMsg} style={{ fontFamily:'var(--font-mono)', fontSize:8.5, letterSpacing:'0.16em', textTransform:'uppercase', padding:'6px 12px', borderRadius:999, background:'linear-gradient(135deg, var(--spore), var(--spore-d))', border:'none', color:'var(--soil)', cursor:'pointer' }}>Send</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
function Stat({ label, value }) {
  return (
    <div style={{ padding:'6px 8px', background:'var(--soil-3)', border:'0.5px solid var(--rule)', borderRadius:6, textAlign:'center' }}>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:8, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--mycelium-d)' }}>{label}</div>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--mycelium-l)', marginTop:2 }}>{value}</div>
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

  async function handleLogout() {
    setCurrentMember(null);
    setTab('network');
    try {
      localStorage.removeItem('spore_active_member');
      localStorage.removeItem('fungai_profile');
      localStorage.removeItem('fungai_profile_draft');
    } catch {}
    // If signed in via Supabase too, sign out there so the next visitor
    // on this browser truly starts fresh.
    if (window.SBauth) {
      try { await window.SBauth.signOut(); } catch {}
    }
  }

  useEffect(() => {
    if (document.getElementById('spore-living-anim')) return;
    const s = document.createElement('style');
    s.id = 'spore-living-anim';
    s.textContent = `@keyframes grow-line { to { stroke-dashoffset: 0; } }`;
    document.head.appendChild(s);
  }, []);

  const [showClaimPicker, setShowClaimPicker] = useState(false);
  // App-level ProfileEditor — opened for signed-in users who have no profile
  // yet (the case that used to trigger the claim picker). Lives here (not in
  // MembersPage) because MembersPage doesn't mount until currentMember exists,
  // which a brand-new user doesn't have.
  const [showRootEditor, setShowRootEditor] = useState(false);

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
        // Find or create the matching MEMBERS entry, set as current. Email-link
        // merge: match by cloudId first (claimed before), then by exact
        // character_name (case-insensitive). If neither matches we fall through
        // to the new-profile branch — meaning Robin signing in with a totally
        // new email & character_name="robin1" will NOT merge into the hardcoded
        // "robin" admin. To merge, Robin must claim with character_name="Robin"
        // OR an admin has to manually set cloudId on the MEMBERS entry once.
        const match = SporeData.MEMBERS.find(m => m.cloudId === mine.id)
                   || SporeData.MEMBERS.find(m => m.name.toLowerCase() === (mine.character_name || '').toLowerCase());
        if (match) {
          // Carry the cloud profile's restrictions onto the in-memory member so
          // gating works on this device immediately.
          match.cloudId = mine.id;
          if (Array.isArray(mine.restrictions)) match.restrictions = mine.restrictions;
          if (mine.avatar_url) match.avatar = mine.avatar_url;
          setCurrentMember(match);
          setTab('members');
          // Cross-page gate uses these keys (see /spore-gate.js).
          try { localStorage.setItem('spore_active_member', match.id); } catch {}
          try { localStorage.setItem('spore_active_member_full', JSON.stringify({
            id: match.id, name: match.name, admin: !!match.admin,
            restrictions: match.restrictions || [],
            avatar: match.avatar || null,
            cloudId: mine.id,
          })); } catch {}
          // Sunday Myco nudge — drops the founder's reminder into the inbox
          // exactly once per Sunday. Safe to call any day; no-ops on M–Sat.
          try {
            if (match.admin) window.SporeEconomy?.maybeSendSundayMyco(match.id);
          } catch {}
          // Upload any locally-stashed avatar from the unclaimed-create flow.
          try {
            const pending = localStorage.getItem('fungai_pending_avatar');
            if (pending && pending.startsWith('data:') && window.SBprofiles?.uploadAvatar) {
              const blob = await (await fetch(pending)).blob();
              const file = new File([blob], 'avatar.png', { type: blob.type || 'image/png' });
              const url = await window.SBprofiles.uploadAvatar(file);
              if (url) await window.SBprofiles.upsert({ avatar_url: url });
              localStorage.removeItem('fungai_pending_avatar');
            }
          } catch (e) { console.warn('[Spore] pending avatar sync failed:', e); }
        }
      } else {
        // No claimed profile yet. Only auto-open the editor when the user
        // JUST arrived from a magic-link click (URL still carries the PKCE
        // ?code= or our ?signedin marker). Otherwise we'd pop the modal
        // on every page refresh / revisit, which is annoying.
        const qs = window.location.search;
        const cameFromMagicLink = qs.includes('signedin') || qs.includes('code=');
        if (cameFromMagicLink) {
          setShowRootEditor(true);
        }
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
      {showRootEditor && (
        <ProfileEditor
          existing={null}
          onClose={async () => {
            setShowRootEditor(false);
            // After save, refresh profiles + retry auto-login so the
            // newly-created profile becomes currentMember and MembersPage
            // takes over.
            try {
              const merged = await SporeData.loadProfilesFromCloud();
              SporeData.MEMBERS.length = 0;
              merged.forEach(m => SporeData.MEMBERS.push(m));
              setCloudVer(v => v + 1);
              await tryAutoLogin(sbUser);
            } catch {}
          }}
        />
      )}
      <LoginScreen
        onLogin={handleLogin}
        sbUser={sbUser}
        onContinueCreating={() => setShowRootEditor(true)}
        onSignOut={handleLogout}
      />
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
