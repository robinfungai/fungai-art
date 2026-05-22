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

/* ── Login screen ─────────────────────────────────────────── */

function LoginScreen({ onLogin }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="login-screen">
      <div className="login-brand">
        <ProceduralMark size={48} />
        <div className="login-brand-name">Spore</div>
        <div className="login-brand-sub">Living network · $HYPHA</div>
      </div>

      <div className="login-prompt">Who are you in the mycelium?</div>

      <div className="login-member-grid">
        {SporeData.MEMBERS.map(m => {
          const tier = SporeData.reputationTier(m.rep);
          const node = SporeData.NETWORK_NODES.find(n => n.id === m.node);
          return (
            <button
              key={m.id}
              className="login-member-btn"
              onClick={() => setSelected(m)}
            >
              <div className="login-member-avatar" style={{ background: tier.color }}>
                {m.name[0]}
              </div>
              <div className="login-member-info">
                <div className="login-member-name">{m.name}</div>
                <div className="login-member-role">{m.role}</div>
                {node && <div style={{ fontFamily:'var(--font-mono)', fontSize:8, letterSpacing:'0.1em', color:'var(--mycelium-d)', marginTop:2 }}>{node.name}</div>}
              </div>
            </button>
          );
        })}
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
  const tabs = [
    { id:'network',  label:'Network' },
    { id:'shop',     label:'Apothecary' },
    { id:'exp',      label:'Experiences' },
    { id:'academy',  label:'Alchemy Academy', accent: true },
    { id:'members',  label:'Members' },
  ];
  return (
    <div className="topbar">
      <div className="topbar-row">
        <div className="brand">
          <ProceduralMark />
          <div className="brand-text">
            <div className="brand-name">Spore</div>
            <div className="brand-sub">Living network · $HYPHA</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {currentMember && (
            <div className="topbar-member">
              <div className="topbar-member-avatar" style={{ background: tier.color }}>
                {currentMember.name[0]}
              </div>
              <div className="topbar-member-name">{currentMember.name}</div>
              <button className="topbar-logout" onClick={onLogout}>out</button>
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
            className={`tab ${tab === t.id ? 'on' : ''} ${t.accent ? 'tab-accent' : ''}`}
            onClick={() => onTab(t.id)}
          >
            {t.label}
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

/* ── Apothecary page ─────────────────────────────────────── */

function ApothecaryPage({ economy, onToast }) {
  return (
    <div className="page-enter">
      <div className="section">
        <div className="section-eyebrow">Pay in € or $H</div>
        <h2 className="section-title">The <em>apothecary.</em></h2>
        <p className="section-blurb">Tinctures, fungi, compositions. Nutrients leave the network as physical things; contributors save vs retail.</p>
      </div>

      <div className="specimen-plate">
        <div className="specimen-plate-art">
          <div className="sp-grid" />
          <div className="sp-crosshair sp-ch-tl"><span /><span /><em>SPM·01</em></div>
          <div className="sp-crosshair sp-ch-br"><span /><span /><em>61.0°N</em></div>
          <img src="spore/assets/specimen-fan.png" alt="Schizophyllum commune specimen" />
        </div>
        <div className="specimen-plate-meta">
          <div className="sp-row"><span className="k">SPECIMEN</span><span className="v">№ 01 / 04</span></div>
          <div className="sp-name">Schizophyllum<br/><em>commune.</em></div>
          <div className="sp-grid-meta">
            <div><span className="k">FAMILY</span><span className="v">Schizophyllaceae</span></div>
            <div><span className="k">SUBSTRATE</span><span className="v">Hardwood, decaying</span></div>
            <div><span className="k">FORAGED</span><span className="v">Sweden · 61.0°N</span></div>
            <div><span className="k">OUTPUT</span><span className="v">Tincture line · Q4</span></div>
            <div><span className="k">YIELD</span><span className="v">2.4 kg / cycle</span></div>
            <div><span className="k">FLOW</span><span className="v">+18 $H per kg</span></div>
          </div>
          <p className="sp-blurb">Most widely distributed mushroom on Earth. The split gills regenerate after drying — a metaphor we keep returning to.</p>
        </div>
      </div>

      <div className="prod-grid">
        {SporeData.PRODUCTS.map(p => {
          const owned = economy.state.inventory.includes(p.id);
          return (
            <div key={p.id} className="prod-card">
              <div className="prod-art" style={{ background: p.bg }}>
                <div className="prod-art-stripe" />
                <div className="prod-art-glow" />
                <div className="prod-art-label">
                  <div className="pl-name">{p.name}</div>
                  <div className="pl-vol">{p.vol}</div>
                </div>
              </div>
              <div>
                <div className="prod-name">{p.name}</div>
                <div className="prod-cat">{p.cat}</div>
              </div>
              <div className="prod-desc">{p.desc}</div>
              <div className="prod-price">
                <span className="prod-price-eur">€{p.pEur}</span>
                <span className="prod-price-h">{p.pH} $H</span>
              </div>
              <button
                className={`prod-add ${owned ? 'bought' : ''}`}
                disabled={owned}
                onClick={() => {
                  if (economy.state.balance >= p.pH) {
                    economy.buy(p.id, p.name, p.pH);
                    onToast(`Purchased ${p.name} · saved vs €`, 'success');
                  } else {
                    onToast(`Added ${p.name} to € basket`);
                  }
                }}
              >
                {owned ? '✓ In basket' : (economy.state.balance >= p.pH ? '+ Pay in $H' : `Pay €${p.pEur}`)}
              </button>
            </div>
          );
        })}
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

/* ── Members page ─────────────────────────────────────────── */

function MembersPage() {
  return (
    <div className="page-enter">
      <div className="section">
        <div className="section-eyebrow">The organism</div>
        <h2 className="section-title">Who's <em>tending.</em></h2>
        <p className="section-blurb">Six nodes in the living network. Each brings a different thread to the mycelium.</p>
      </div>
      <div className="members-grid">
        {SporeData.MEMBERS.map(m => {
          const tier = SporeData.reputationTier(m.rep);
          const node = SporeData.NETWORK_NODES.find(n => n.id === m.node);
          return (
            <div key={m.id} className="member-card">
              <div className="member-avatar" style={{ background: tier.color }}>{m.name[0]}</div>
              <div className="member-body">
                <div className="member-name">{m.name}</div>
                <div className="member-role">{m.role}</div>
                {node && <div className="member-node">{node.name}</div>}
                <div className="member-focus">{m.focus}</div>
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

/* ── Alchemy Academy page ─────────────────────────────────── */

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

/* ── Earn sheet ───────────────────────────────────────────── */

function EarnSheet({ open, onClose, economy, onToast }) {
  if (!open) return null;
  const opts = [
    { earn:40, label:'Kitchen help',          desc:'1 day · Berlin hub',    rep:1 },
    { earn:20, label:'Content creation',      desc:'Photo · video · words', rep:0 },
    { earn:60, label:'Foraging guide',        desc:'Lead a circle',         rep:1 },
    { earn:80, label:'Event facilitation',    desc:'Help run experience',   rep:2 },
    { earn:15, label:'Species identification',desc:'Document a find',       rep:0 },
  ];
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.32em', textTransform:'uppercase', color:'var(--mycelium-d)' }}>Push nutrients in</div>
          <div className="sheet-title">Earn $HYPHA</div>
        </div>
        <div className="sheet-body">
          {opts.map(o => (
            <div key={o.label} className="earn-opt" onClick={() => {
              economy.earn(o.earn, o.label, o.rep);
              onToast(`+${o.earn} $H · ${o.label}`, 'success');
              onClose();
            }}>
              <div>
                <div className="earn-name">{o.label}</div>
                <div className="earn-desc">{o.desc}{o.rep ? ` · +${o.rep} rep` : ''}</div>
              </div>
              <div className="earn-amount">+{o.earn} $H</div>
            </div>
          ))}
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

/* ── App root ─────────────────────────────────────────────── */

function App() {
  const [currentMember, setCurrentMember] = useState(null);
  const [tab,       setTab]      = useState('network');
  const [earnOpen,  setEarnOpen] = useState(false);
  const [toast,     setToast]    = useState({ msg:'', kind:'' });
  const [tweaks,    setTweak]    = useTweaks(TWEAK_DEFAULTS);

  const economy = useEconomy(currentMember ? currentMember.id : '__guest__');
  const tier    = SporeData.reputationTier(economy.state.reputation);
  const onToast = (msg, kind) => setToast({ msg, kind });

  function handleLogin(member) {
    setCurrentMember(member);
    setTab('network');
  }

  function handleLogout() {
    setCurrentMember(null);
    setTab('network');
  }

  useEffect(() => {
    if (document.getElementById('spore-living-anim')) return;
    const s = document.createElement('style');
    s.id = 'spore-living-anim';
    s.textContent = `@keyframes grow-line { to { stroke-dashoffset: 0; } }`;
    document.head.appendChild(s);
  }, []);

  if (!currentMember) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="app">
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
      {tab === 'shop'     && <ApothecaryPage economy={economy} onToast={onToast} />}
      {tab === 'exp'      && <ExperiencesPage economy={economy} onToast={onToast} />}
      {tab === 'academy'  && <AcademyPage economy={economy} />}
      {tab === 'members'  && <MembersPage />}

      <div className="app-footer">
        <ProceduralMark size={32} />
        <div className="app-footer-fine">tend · flow · unlock</div>
      </div>

      <EarnSheet open={earnOpen} onClose={() => setEarnOpen(false)} economy={economy} onToast={onToast} />
      <Toast message={toast.msg} kind={toast.kind} onClose={() => setToast({ msg:'', kind:'' })} />
      <SporeTweaks tweaks={tweaks} setTweak={setTweak} />

    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
