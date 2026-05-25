/* Spore — main app */

const { useState, useEffect, useCallback, useMemo } = React;

const STORAGE_KEY = 'spore_economy_v1';

const DEFAULT_STATE = {
  balance: 120,
  reputation: 1,        // points; tier derived
  contributions: 2,
  keys: 0,
  unlocked: [],         // experience ids
  inventory: [],        // product ids
  bought: [],           // product names recently bought (for ui flash)
  history: [],          // [{type,label,delta,ts}]
};

function useEconomy() {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
    } catch (_) {}
    return DEFAULT_STATE;
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }, [state]);

  const earn = useCallback((amount, label, repGain = 1) => {
    setState(s => ({
      ...s,
      balance: s.balance + amount,
      reputation: s.reputation + repGain,
      contributions: s.contributions + 1,
      history: [{ type:'earn', label, delta:+amount, ts:Date.now() }, ...s.history].slice(0, 30),
    }));
  }, []);

  const spend = useCallback((amount, label, type='spend') => {
    let ok = false;
    setState(s => {
      if (s.balance < amount) return s;
      ok = true;
      return {
        ...s,
        balance: s.balance - amount,
        history: [{ type, label, delta:-amount, ts:Date.now() }, ...s.history].slice(0, 30),
      };
    });
    return ok;
  }, []);

  const unlock = useCallback((expId, amount, label) => {
    let ok = false;
    setState(s => {
      if (s.balance < amount) return s;
      if (s.unlocked.includes(expId)) return s;
      ok = true;
      return {
        ...s,
        balance: s.balance - amount,
        keys: s.keys + 1,
        unlocked: [...s.unlocked, expId],
        history: [{ type:'unlock', label, delta:-amount, ts:Date.now() }, ...s.history].slice(0, 30),
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
        balance: s.balance - amount,
        inventory: [...s.inventory, prodId],
        history: [{ type:'buy', label:name, delta:-amount, ts:Date.now() }, ...s.history].slice(0, 30),
      };
    });
    return ok;
  }, []);

  const reset = useCallback(() => setState(DEFAULT_STATE), []);

  return { state, earn, spend, unlock, buy, reset };
}

/* — Toast — */
function Toast({ message, kind, onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 2600);
    return () => clearTimeout(t);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className="toast-wrap">
      <div className={`toast ${kind || ''}`}>{message}</div>
    </div>
  );
}

/* — Wallet header — */
function TopBar({ state, tier, tab, onTab, onWallet }) {
  const tabs = [
    { id:'network', label:'Network' },
    { id:'shop',    label:'Apothecary' },
    { id:'exp',     label:'Experiences' },
    { id:'econ',    label:'Economy' },
  ];
  return (
    <div className="topbar">
      <div className="topbar-row">
        <div className="brand">
          <div className="brand-name">Spo<span className="dot" />re</div>
          <div className="brand-sub">$Hyphae · mock economy</div>
        </div>
        <button className="wallet-pill" onClick={onWallet}>
          <span className="wallet-rep-dot" style={{ background: tier.color, boxShadow:`0 0 0 3px color-mix(in srgb, ${tier.color} 25%, transparent)` }} />
          <div className="wallet-stack">
            <div className="wallet-bal">{state.balance} $H</div>
            <div className="wallet-cta">tap to earn</div>
          </div>
        </button>
      </div>
      <div className="tabs">
        {tabs.map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? 'on' : ''}`} onClick={() => onTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* — HUD — */
function HUD({ state, tier }) {
  return (
    <div className="hud">
      <div className="hud-cell">
        <div className="hud-label">Balance</div>
        <div className="hud-val green">{state.balance}</div>
        <div className="hud-sub">$MYCELE</div>
      </div>
      <div className="hud-cell">
        <div className="hud-label">Reputation</div>
        <div className="hud-val amber" style={{ color: tier.color }}>{tier.label}</div>
        <div className="hud-sub">{state.reputation} pts · {state.contributions} contrib</div>
      </div>
      <div className="hud-cell">
        <div className="hud-label">Access keys</div>
        <div className="hud-val">{state.keys}</div>
        <div className="hud-sub">{state.unlocked.length} unlocked</div>
      </div>
    </div>
  );
}

function PhaseStrip({ phase }) {
  const idx = SporeData.PHASES.findIndex(p => p.id === phase);
  return (
    <div className="phase-strip">
      <div className="phase-pip-row">
        {SporeData.PHASES.map((p, i) => (
          <div key={p.id} className={`phase-pip ${i <= idx ? 'on' : ''}`} />
        ))}
      </div>
      <div className="phase-text">
        <strong>Phase {SporeData.PHASES[idx].num}</strong> · {SporeData.PHASES[idx].name}
        <span style={{ color:'var(--ink-3)' }}> — preview only</span>
      </div>
    </div>
  );
}

/* — Network page — */
function NetworkPage({ economy, mapStyle, onToast }) {
  const [selected, setSelected] = useState('berlin');
  const node = SporeData.NETWORK_NODES.find(n => n.id === selected);

  return (
    <div className="page-enter">
      <div className="section">
        <div className="section-eyebrow">Contribution = currency</div>
        <h2 className="section-title">The <em>network.</em></h2>
        <p className="section-blurb">Tend a node — earn $MYCELE and grow your reputation.
          The network expands mycelially; new nodes propagate from contributors.</p>
      </div>

      <div className="net-frame">
        <NetworkMap
          nodes={SporeData.NETWORK_NODES}
          selected={selected}
          onSelect={setSelected}
          style={mapStyle}
        />
        <div className="net-meta">
          <div className="net-meta-left">
            <span className="legend-dot" style={{ background:'var(--sage-300)' }} />
            <span className="label-tiny">Live · pulsing</span>
          </div>
          <span className="label-tiny">{SporeData.NETWORK_NODES.filter(n => n.activity !== 'proposed').length} nodes</span>
        </div>
      </div>

      {node && node.activity !== 'proposed' && (
        <div className="node-detail" key={node.id}>
          <div className="node-detail-head">
            <div>
              <div className="node-detail-title">{node.name}</div>
              <div className="node-detail-sub">{node.sub}</div>
            </div>
            <span className="legend-dot" style={{ background: node.color, marginTop: 8, width:10, height:10 }} />
          </div>
          <div className="contrib-list">
            {node.contributions.map(c => (
              <div
                key={c.id}
                className="contrib-row"
                onClick={() => {
                  economy.earn(c.earn, `${c.label} @ ${node.name}`, c.rep || 1);
                  onToast(`+${c.earn} $H · ${c.label}`, 'success');
                }}
              >
                <div>
                  <div className="contrib-label">{c.label}</div>
                  <div className="contrib-sub">{c.sub}{c.rep ? ` · +${c.rep} rep` : ''}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span className="contrib-earn">+{c.earn} $H</span>
                  <span className="contrib-arrow">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {node && node.activity === 'proposed' && (
        <div className="node-detail">
          <div className="node-detail-head">
            <div>
              <div className="node-detail-title">{node.name}</div>
              <div className="node-detail-sub">Mycelial expansion</div>
            </div>
          </div>
          <div style={{ padding:'14px 16px 18px', borderTop:'0.5px solid var(--rule)' }}>
            <p style={{ fontSize:13, color:'var(--ink-2)', lineHeight:1.6 }}>{node.requirement}</p>
            <button className="btn btn-block" style={{ marginTop:14 }} disabled>
              Locked · need Forager
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* — Apothecary — */
function ProductCard({ p, owned, balance, onBuy }) {
  const canAfford = balance >= p.pH;
  return (
    <div className={`prod-card`}>
      <div className="prod-art" style={{ background: p.bg }}>
        <div className="prod-art-stripe" />
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
        onClick={onBuy}
        disabled={owned}
      >
        {owned ? '✓ In basket' : (canAfford ? '+ Pay in $H' : `Pay €${p.pEur}`)}
      </button>
    </div>
  );
}

function ApothecaryPage({ economy, onToast }) {
  return (
    <div className="page-enter">
      <div className="section">
        <div className="section-eyebrow">Dual pricing · € or $MYCELE</div>
        <h2 className="section-title">The <em>apothecary.</em></h2>
        <p className="section-blurb">Tinctures, fungi, and compositions. Pay in euros or burn $MYCELE — contributors save vs retail.</p>
      </div>

      <figure className="specimen-hero">
        <div className="specimen-hero-art">
          <img src="assets/specimen-fan.png" alt="Schizophyllum commune — fan-form specimen" />
        </div>
        <figcaption className="specimen-hero-cap">
          <div className="label-tiny">Specimen №&nbsp;01</div>
          <div className="specimen-name">Schizophyllum<br/><em>commune.</em></div>
          <div className="specimen-meta">
            <div><span className="k">Family</span><span className="v">Schizophyllaceae</span></div>
            <div><span className="k">Habitat</span><span className="v">Decaying hardwood</span></div>
            <div><span className="k">Used in</span><span className="v">Tinctures · ferments</span></div>
            <div><span className="k">Foraged</span><span className="v">Sweden, autumn</span></div>
          </div>
          <p className="specimen-blurb">A split-gilled fungus — the most widely distributed mushroom on Earth. The base material for our autumn tincture line.</p>
        </figcaption>
      </figure>

      <div className="prod-grid">
        {SporeData.PRODUCTS.map(p => (
          <ProductCard
            key={p.id}
            p={p}
            owned={economy.state.inventory.includes(p.id)}
            balance={economy.state.balance}
            onBuy={() => {
              if (economy.state.balance >= p.pH) {
                economy.buy(p.id, p.name, p.pH);
                onToast(`Purchased ${p.name} · saved vs €`, 'success');
              } else {
                onToast(`Added ${p.name} to € basket`);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* — Experiences — */
function ExperienceCard({ e, balance, repPoints, unlocked, onUnlock }) {
  const repOk = !e.repReq || repPoints >= e.repReq;
  const canAfford = balance >= e.minH;
  const unlockable = canAfford && repOk;
  const isUnlocked = unlocked.includes(e.id);

  const tagCls = ({
    open:'tag-sage', locked:'tag-mute', limited:'tag-clay', work:'tag-violet'
  })[e.tag];

  return (
    <div className={`exp-card ${e.featured ? 'featured' : ''} ${isUnlocked ? 'unlocked' : ''} ${e.tag === 'locked' && !isUnlocked ? 'locked' : ''}`}>
      <div className="exp-art" style={{ background: e.bg }}>
        <div className="exp-art-stripe" />
        <div className="exp-art-label">
          <span>experience photo</span>
          <span>{e.id}</span>
        </div>
      </div>
      <div className="exp-body">
        <div className="exp-tag-row">
          <span className={`tag ${tagCls}`}>{isUnlocked ? '✓ Unlocked' : e.tagLabel}</span>
          {e.featured && <span className="tag tag-sage">Featured</span>}
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
            <button className="btn btn-primary" onClick={() => onUnlock(e, 0, true)}>Join + earn</button>
          ) : e.minH === 0 ? (
            <button className="btn btn-ghost" onClick={() => onUnlock(e, 0, false)}>Apply</button>
          ) : (
            <button className="btn btn-primary" disabled={!unlockable} onClick={() => onUnlock(e, e.pH, false)}>
              Unlock — {e.pH} $H
            </button>
          )}
        </div>
        {!isUnlocked && !unlockable && e.minH > 0 && !e.earnBack && (
          <div className="exp-lock-hint">
            {!repOk ? `Reputation: needs ${e.repReq}+ pts` : `Need ${e.minH - balance} more $H`}
          </div>
        )}
      </div>
    </div>
  );
}

function ExperiencesPage({ economy, onToast }) {
  const handle = (e, amount, isEarnBack) => {
    if (isEarnBack) {
      economy.earn(e.earnBack, `${e.title} · joined`, 1);
      onToast(`Joined ${e.title} · +${e.earnBack} $H`, 'success');
      return;
    }
    if (amount === 0) {
      onToast(`Applied to ${e.title}`);
      return;
    }
    if (economy.unlock(e.id, amount, e.title)) {
      onToast(`Unlocked: ${e.title} · access key granted`, 'success');
    } else {
      onToast(`Insufficient $H`);
    }
  };

  return (
    <div className="page-enter">
      <div className="section">
        <div className="section-eyebrow">Token-gated access</div>
        <h2 className="section-title">Experiences <em>& labs.</em></h2>
        <p className="section-blurb">Dinners, ceremonies, residencies. Some open to all; some unlocked by depth of contribution.</p>
      </div>
      <div className="exp-list">
        {SporeData.EXPERIENCES.map(e => (
          <ExperienceCard
            key={e.id}
            e={e}
            balance={economy.state.balance}
            repPoints={economy.state.reputation}
            unlocked={economy.state.unlocked}
            onUnlock={handle}
          />
        ))}
      </div>
    </div>
  );
}

/* — Economy / phase — */
function EconomyPage({ economy, phase, onPhaseChange }) {
  const flowSteps = [
    { name:'Arrive',         sub:'explore the network' },
    { name:'Contribute',     sub:'work · create · share' },
    { name:'Earn $MYCELE',   sub:'mock balance' },
    { name:'Unlock access',  sub:'experiences · products' },
    { name:'Go deeper',      sub:'residency · governance' },
  ];
  const activeIdx = Math.min(4, Math.floor(economy.state.contributions / 2));

  return (
    <div className="page-enter">
      <div className="section">
        <div className="section-eyebrow">Token architecture</div>
        <h2 className="section-title">How it <em>flows.</em></h2>
        <p className="section-blurb">$MYCELE is the medium; reputation the depth; access keys the gates. Three layers, one organism.</p>
      </div>

      <div className="flow-rail">
        {flowSteps.map((s, i) => (
          <div key={i} className={`flow-step ${i <= activeIdx ? 'active' : ''}`}>
            <div className="flow-bullet">{i + 1}</div>
            <div className="flow-text">
              <div className="flow-name">{s.name}</div>
              <div className="flow-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="section" style={{ paddingBottom:0 }}>
        <div className="section-eyebrow">Three layers</div>
      </div>
      <div className="token-layers">
        <div className="token-layer sage">
          <div className="token-layer-title">$MYCELE — Currency</div>
          <div className="token-layer-name sage">Liquid · earned · spent</div>
          <div className="token-layer-desc">Earned by contributing. Spent on experiences and products. Transferable in phase 3.</div>
        </div>
        <div className="token-layer violet">
          <div className="token-layer-title">Access Keys — NFTs</div>
          <div className="token-layer-name violet">Non-transferable</div>
          <div className="token-layer-desc">Specific events, labs, residencies. Limited by real-world seats; minted on unlock.</div>
        </div>
        <div className="token-layer amber">
          <div className="token-layer-title">Reputation — Trust</div>
          <div className="token-layer-name amber">Earned, never bought</div>
          <div className="token-layer-desc">Tracks depth of participation. Required for the deepest access. Prevents speculation.</div>
        </div>
      </div>

      <div className="section">
        <div className="section-eyebrow">Rollout phases · select to preview</div>
      </div>
      <div style={{ margin:'10px 18px 0', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {SporeData.PHASES.map(p => (
          <button
            key={p.id}
            onClick={() => onPhaseChange(p.id)}
            style={{
              textAlign:'left',
              padding:'12px 14px',
              borderRadius:'var(--r-md)',
              border:`0.5px solid ${phase === p.id ? 'var(--sage-500)' : 'var(--rule)'}`,
              background: phase === p.id ? 'var(--sage-50)' : 'var(--bg-card)',
              cursor:'pointer',
              fontFamily:'inherit',
            }}
          >
            <div className="label-tiny" style={{ color: phase === p.id ? 'var(--sage-700)' : 'var(--ink-3)' }}>Phase {p.num}</div>
            <div style={{ fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize:16, marginTop:4 }}>{p.name}</div>
            <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:4, lineHeight:1.5 }}>{p.items}</div>
          </button>
        ))}
      </div>

      <button className="reset-link" onClick={economy.reset}>↺ Reset prototype</button>
    </div>
  );
}

/* — Earn sheet — */
function EarnSheet({ open, onClose, economy, onToast }) {
  if (!open) return null;
  const opts = [
    { earn:40, label:'Kitchen help',         desc:'1 day · Berlin hub',    rep:1 },
    { earn:20, label:'Content creation',     desc:'Photo · video · words', rep:0 },
    { earn:60, label:'Foraging guide',       desc:'Lead a circle',         rep:1 },
    { earn:80, label:'Event facilitation',   desc:'Help run experience',   rep:2 },
    { earn:15, label:'Species identification',desc:'Document a find',      rep:0 },
  ];
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <div className="label-tiny">Earn $MYCELE</div>
          <div className="sheet-title">Quick contributions</div>
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

/* — Tweaks — */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "mapStyle": "mycelial",
  "phase": "MOCK",
  "density": "default"
}/*EDITMODE-END*/;

function SporeTweaks({ tweaks, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Aesthetic">
        <TweakRadio
          label="Theme"
          value={tweaks.theme}
          options={[
            { value:'light', label:'Light' },
            { value:'loam',  label:'Loam' },
          ]}
          onChange={v => setTweak('theme', v)}
        />
        <TweakRadio
          label="Density"
          value={tweaks.density}
          options={[
            { value:'tight',   label:'Tight' },
            { value:'default', label:'Default' },
            { value:'roomy',   label:'Roomy' },
          ]}
          onChange={v => setTweak('density', v)}
        />
      </TweakSection>
      <TweakSection title="Network map">
        <TweakRadio
          label="Style"
          value={tweaks.mapStyle}
          options={[
            { value:'mycelial', label:'Mycelial' },
            { value:'grid',     label:'Grid' },
          ]}
          onChange={v => setTweak('mapStyle', v)}
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

/* — Root — */
function App() {
  const economy = useEconomy();
  const [tab, setTab] = useState('network');
  const [earnOpen, setEarnOpen] = useState(false);
  const [toast, setToast] = useState({ msg:'', kind:'' });
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const tier = SporeData.reputationTier(economy.state.reputation);

  const onToast = (msg, kind) => setToast({ msg, kind });

  // animate keyframe for path-grow once
  useEffect(() => {
    if (document.getElementById('spore-anim')) return;
    const s = document.createElement('style');
    s.id = 'spore-anim';
    s.textContent = `@keyframes dash-grow { to { stroke-dashoffset: 0; } }`;
    document.head.appendChild(s);
  }, []);

  const themeClass = tweaks.theme === 'loam' ? 'theme-loam' : '';
  const densityClass = `density-${tweaks.density || 'default'}`;

  return (
    <div className={`app ${themeClass} ${densityClass}`}>
      <TopBar
        state={economy.state}
        tier={tier}
        tab={tab}
        onTab={setTab}
        onWallet={() => setEarnOpen(true)}
      />
      <HUD state={economy.state} tier={tier} />
      {tweaks.phase !== 'MOCK' && <PhaseStrip phase={tweaks.phase} />}

      {tab === 'network' && <NetworkPage economy={economy} mapStyle={tweaks.mapStyle} onToast={onToast} />}
      {tab === 'shop'    && <ApothecaryPage economy={economy} onToast={onToast} />}
      {tab === 'exp'     && <ExperiencesPage economy={economy} onToast={onToast} />}
      {tab === 'econ'    && <EconomyPage economy={economy} phase={tweaks.phase} onPhaseChange={(p) => setTweak('phase', p)} />}

      <div className="app-footer">
        <div className="brand-name">Spo<span className="dot" />re</div>
        <div className="app-footer-fine">tend · earn · unlock</div>
      </div>

      <EarnSheet open={earnOpen} onClose={() => setEarnOpen(false)} economy={economy} onToast={onToast} />
      <Toast message={toast.msg} kind={toast.kind} onClose={() => setToast({ msg:'', kind:'' })} />

      <SporeTweaks tweaks={tweaks} setTweak={setTweak} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
