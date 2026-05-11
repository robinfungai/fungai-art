/* Contribution Tracker — main app */

const { useState, useEffect, useMemo, useCallback } = React;

const STORAGE_KEY = 'spore_tracker_v1';
const CURRENT_USER_KEY = 'spore_tracker_current';

// ── Store ────────────────────────────────────────────────────────────────────
function useStore() {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return { contributions: TrackerData.SEED_CONTRIBUTIONS };
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }, [state]);

  const submit = useCallback((memberId, typeId, nodeId, notes) => {
    const type = TrackerData.CONTRIB_TYPES.find(t => t.id === typeId);
    const id = 'c-' + Math.random().toString(36).slice(2, 8);
    const row = {
      id, memberId, typeId, nodeId, notes,
      status: type.autoApprove ? 'approved' : 'pending',
      submittedAt: Date.now(),
      reviewedAt: type.autoApprove ? Date.now() : undefined,
      reviewedBy: type.autoApprove ? 'system' : undefined,
    };
    setState(s => ({ ...s, contributions: [row, ...s.contributions] }));
    return { id, autoApproved: type.autoApprove };
  }, []);

  const review = useCallback((id, reviewerId, approve, reason) => {
    setState(s => ({
      ...s,
      contributions: s.contributions.map(c =>
        c.id === id
          ? { ...c, status: approve ? 'approved' : 'rejected', reviewedAt: Date.now(), reviewedBy: reviewerId, rejectReason: approve ? undefined : reason }
          : c
      ),
    }));
  }, []);

  const reset = useCallback(() => {
    setState({ contributions: TrackerData.SEED_CONTRIBUTIONS });
  }, []);

  return { state, submit, review, reset };
}

// ── Wallet derivation ────────────────────────────────────────────────────────
// Source of truth: approved contributions. Balance = sum of earn. Rep = sum of rep.
function walletFor(memberId, contributions) {
  const mine = contributions.filter(c => c.memberId === memberId);
  let balance = 0, rep = 0, count = 0, pending = 0;
  for (const c of mine) {
    if (c.status === 'approved') {
      const t = TrackerData.CONTRIB_TYPES.find(x => x.id === c.typeId);
      if (t) { balance += t.earn; rep += t.rep; count++; }
    } else if (c.status === 'pending') {
      pending++;
    }
  }
  return { balance, rep, count, pending, tier: TrackerData.tierFor(rep) };
}

function leaderboard(contributions, window) {
  const cutoff = window === '7d' ? Date.now() - 7 * 86400000
              : window === '30d' ? Date.now() - 30 * 86400000
              : 0;
  const totals = new Map();
  for (const c of contributions) {
    if (c.status !== 'approved') continue;
    if ((c.reviewedAt || c.submittedAt) < cutoff) continue;
    const t = TrackerData.CONTRIB_TYPES.find(x => x.id === c.typeId);
    if (!t) continue;
    const cur = totals.get(c.memberId) || { earn:0, rep:0, count:0 };
    cur.earn += t.earn; cur.rep += t.rep; cur.count++;
    totals.set(c.memberId, cur);
  }
  return [...totals.entries()]
    .map(([memberId, v]) => ({ memberId, ...v }))
    .sort((a, b) => b.earn - a.earn);
}

// ── Small helpers ────────────────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return '—';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return s + 's ago';
  if (s < 3600) return Math.floor(s/60) + 'm ago';
  if (s < 86400) return Math.floor(s/3600) + 'h ago';
  const d = Math.floor(s / 86400);
  if (d < 30) return d + 'd ago';
  return Math.floor(d / 30) + 'mo ago';
}

function findMember(id) { return TrackerData.MEMBERS.find(m => m.id === id); }
function findType(id)   { return TrackerData.CONTRIB_TYPES.find(t => t.id === id); }
function findNode(id)   { return TrackerData.NODES.find(n => n.id === id); }

function Avatar({ member, size = 28 }) {
  if (!member) return null;
  const initials = member.name.split(' ').map(s => s[0]).slice(0, 2).join('');
  return (
    <div className="trk-avatar" style={{
      width: size, height: size, fontSize: size * 0.4,
      background: `color-mix(in srgb, ${member.avatar} 22%, var(--soil-3))`,
      borderColor: `color-mix(in srgb, ${member.avatar} 60%, transparent)`,
      color: member.avatar,
    }}>{initials}</div>
  );
}

function Toast({ msg, kind, onClose }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 2400);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  if (!msg) return null;
  return <div className="toast-wrap"><div className={`toast ${kind || ''}`}>{msg}</div></div>;
}

// ── User switcher (top-of-page demo control) ─────────────────────────────────
function UserSwitcher({ currentId, onPick }) {
  const [open, setOpen] = useState(false);
  const cur = findMember(currentId);
  return (
    <div className="trk-switcher">
      <button className="trk-switcher-btn" onClick={() => setOpen(o => !o)}>
        <div className="trk-switcher-eyebrow">DEMO · acting as</div>
        <div className="trk-switcher-row">
          <Avatar member={cur} size={26} />
          <div className="trk-switcher-name">
            <div>{cur.name}</div>
            <div className="trk-switcher-role">{cur.handle} · {cur.role}</div>
          </div>
          <div className="trk-switcher-caret">{open ? '▴' : '▾'}</div>
        </div>
      </button>
      {open && (
        <div className="trk-switcher-menu">
          <div className="trk-switcher-hint">Switch user to see different views — admins & stewards see the approval queue.</div>
          {TrackerData.MEMBERS.map(m => (
            <button
              key={m.id}
              className={`trk-switcher-opt ${m.id === currentId ? 'on' : ''}`}
              onClick={() => { onPick(m.id); setOpen(false); }}
            >
              <Avatar member={m} size={24} />
              <div>
                <div className="trk-switcher-opt-name">{m.name}</div>
                <div className="trk-switcher-opt-meta">{m.handle} · {m.role} · {findNode(m.homeNodeId).name}</div>
              </div>
              <span className={`trk-role-pill role-${m.role}`}>{m.role}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Wallet card ──────────────────────────────────────────────────────────────
function WalletCard({ member, wallet }) {
  return (
    <div className="trk-wallet">
      <div className="trk-wallet-row">
        <div>
          <div className="label-tiny">Wallet · {member.handle}</div>
          <div className="trk-wallet-bal">{wallet.balance} <span>$H</span></div>
          <div className="trk-wallet-sub">{wallet.count} approved contributions</div>
        </div>
        <div className="trk-wallet-side">
          <div className="trk-wallet-tier">
            <span className="trk-tier-dot" style={{ background: wallet.tier.color }} />
            <div>
              <div className="label-tiny">Tier</div>
              <div className="trk-tier-name">{wallet.tier.label}</div>
            </div>
          </div>
          <div className="trk-wallet-rep">
            <div className="label-tiny">Reputation</div>
            <div className="trk-rep-val">{wallet.rep} <span>pts</span></div>
          </div>
        </div>
      </div>
      {wallet.pending > 0 && (
        <div className="trk-wallet-pending">
          ◌ {wallet.pending} contribution{wallet.pending > 1 ? 's' : ''} awaiting review
        </div>
      )}
    </div>
  );
}

// ── Log Work form ────────────────────────────────────────────────────────────
function LogWorkForm({ member, onSubmit }) {
  const [typeId, setTypeId] = useState('kitchen');
  const [nodeId, setNodeId] = useState(member.homeNodeId);
  const [notes, setNotes] = useState('');

  useEffect(() => { setNodeId(member.homeNodeId); }, [member.id]);

  const type = findType(typeId);

  const submit = () => {
    if (!notes.trim()) return;
    onSubmit(typeId, nodeId, notes.trim());
    setNotes('');
  };

  return (
    <div className="trk-card">
      <div className="trk-card-head">
        <div className="section-eyebrow">Log work</div>
        <div className="trk-card-title">Record a <em>contribution.</em></div>
      </div>

      <div className="trk-form">
        <div className="trk-form-row">
          <label className="trk-label">Type</label>
          <div className="trk-chip-grid">
            {TrackerData.CONTRIB_TYPES.map(t => (
              <button
                key={t.id}
                className={`trk-chip ${typeId === t.id ? 'on' : ''}`}
                onClick={() => setTypeId(t.id)}
              >
                <div className="trk-chip-label">{t.label}</div>
                <div className="trk-chip-meta">+{t.earn} $H{t.rep ? ` · +${t.rep} rep` : ''}{t.autoApprove ? ' · auto' : ''}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="trk-form-row">
          <label className="trk-label">Node</label>
          <div className="trk-node-pick">
            {TrackerData.NODES.map(n => (
              <button
                key={n.id}
                className={`trk-node-opt ${nodeId === n.id ? 'on' : ''}`}
                onClick={() => setNodeId(n.id)}
                style={{ '--node-c': n.color }}
              >
                <span className="trk-node-dot" />
                <div>
                  <div className="trk-node-name">{n.name}</div>
                  <div className="trk-node-region">{n.region}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="trk-form-row">
          <label className="trk-label">Notes / evidence</label>
          <textarea
            className="trk-textarea"
            placeholder="What did you do? Link a photo, doc, or just describe it. Stewards review this."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <div className="trk-form-foot">
          <div className="trk-form-summary">
            <span className="trk-summary-k">Submitting</span>
            <span className="trk-summary-v">
              <span className="trk-pill">{type.label}</span>
              <span className="trk-arrow">→</span>
              <span className="trk-pill amber">+{type.earn} $H</span>
              {type.rep > 0 && <span className="trk-pill blue">+{type.rep} rep</span>}
              <span className={`trk-pill ${type.autoApprove ? 'green' : 'mute'}`}>
                {type.autoApprove ? 'auto-credit' : 'needs review'}
              </span>
            </span>
          </div>
          <button className="btn btn-primary" onClick={submit} disabled={!notes.trim()}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

// ── My history (the member's own ledger) ─────────────────────────────────────
function MyHistory({ memberId, contributions }) {
  const mine = contributions.filter(c => c.memberId === memberId).slice(0, 12);
  if (!mine.length) {
    return <div className="trk-empty">No contributions yet — log your first above.</div>;
  }
  return (
    <div className="trk-card">
      <div className="trk-card-head">
        <div className="section-eyebrow">My history</div>
        <div className="trk-card-title">Your <em>ledger.</em></div>
      </div>
      <div className="trk-history">
        {mine.map(c => {
          const t = findType(c.typeId);
          const n = findNode(c.nodeId);
          return (
            <div key={c.id} className={`trk-history-row status-${c.status}`}>
              <div className="trk-history-l">
                <div className="trk-history-status-dot" />
                <div>
                  <div className="trk-history-label">{t.label} <span className="trk-history-at">at {n.name}</span></div>
                  {c.notes && <div className="trk-history-notes">{c.notes}</div>}
                  {c.status === 'rejected' && c.rejectReason && (
                    <div className="trk-history-reject">Reason: {c.rejectReason}</div>
                  )}
                  <div className="trk-history-meta">
                    {c.status === 'approved' && `Approved ${timeAgo(c.reviewedAt)}${c.reviewedBy ? ` by ${findMember(c.reviewedBy)?.handle || c.reviewedBy}` : ''}`}
                    {c.status === 'pending'  && `Submitted ${timeAgo(c.submittedAt)} · awaiting review`}
                    {c.status === 'rejected' && `Rejected ${timeAgo(c.reviewedAt)}`}
                  </div>
                </div>
              </div>
              <div className="trk-history-r">
                {c.status === 'approved' && <span className="trk-earn">+{t.earn} $H</span>}
                {c.status === 'pending'  && <span className="trk-earn pending">+{t.earn} $H</span>}
                {c.status === 'rejected' && <span className="trk-earn rejected">—</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Review queue (steward / admin only) ──────────────────────────────────────
function ReviewQueue({ currentMember, contributions, onReview, onToast }) {
  const isReviewer = currentMember.role === 'steward' || currentMember.role === 'admin';
  const pending = contributions.filter(c => c.status === 'pending');

  if (!isReviewer) return null;

  return (
    <div className="trk-card review">
      <div className="trk-card-head">
        <div className="section-eyebrow">Steward queue · {currentMember.role}</div>
        <div className="trk-card-title">
          {pending.length === 0 ? 'Queue is empty.' : <>Review <em>pending work.</em></>}
        </div>
        {pending.length > 0 && (
          <div className="trk-card-blurb">{pending.length} contribution{pending.length > 1 ? 's' : ''} waiting. Approving credits $H + reputation to the member's wallet.</div>
        )}
      </div>
      {pending.length > 0 && (
        <div className="trk-review-list">
          {pending.map(c => {
            const m = findMember(c.memberId);
            const t = findType(c.typeId);
            const n = findNode(c.nodeId);
            return (
              <div key={c.id} className="trk-review-row">
                <div className="trk-review-top">
                  <div className="trk-review-who">
                    <Avatar member={m} size={32} />
                    <div>
                      <div className="trk-review-name">{m.name} <span className="trk-review-handle">{m.handle}</span></div>
                      <div className="trk-review-meta">submitted {timeAgo(c.submittedAt)}</div>
                    </div>
                  </div>
                  <div className="trk-review-amounts">
                    <span className="trk-pill amber">+{t.earn} $H</span>
                    {t.rep > 0 && <span className="trk-pill blue">+{t.rep} rep</span>}
                  </div>
                </div>
                <div className="trk-review-body">
                  <div className="trk-review-type">
                    <span className="trk-pill mute">{t.label}</span>
                    <span className="trk-arrow">·</span>
                    <span className="trk-review-node" style={{ color: n.color }}>{n.name}</span>
                  </div>
                  {c.notes && <div className="trk-review-notes">"{c.notes}"</div>}
                </div>
                <div className="trk-review-actions">
                  <button className="btn btn-ghost" onClick={() => {
                    const reason = prompt('Reason for rejection (optional):') || 'no reason given';
                    onReview(c.id, currentMember.id, false, reason);
                    onToast(`Rejected · ${m.handle}`);
                  }}>Reject</button>
                  <button className="btn btn-primary" onClick={() => {
                    onReview(c.id, currentMember.id, true);
                    onToast(`Approved · +${t.earn} $H to ${m.handle}`, 'success');
                  }}>Approve</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Leaderboard ──────────────────────────────────────────────────────────────
function Leaderboard({ contributions }) {
  const [win, setWin] = useState('30d');
  const rows = useMemo(() => leaderboard(contributions, win), [contributions, win]);

  return (
    <div className="trk-card">
      <div className="trk-card-head">
        <div className="section-eyebrow">Leaderboard</div>
        <div className="trk-card-title">Top <em>contributors.</em></div>
        <div className="trk-card-blurb">Approved work, this period.</div>
      </div>
      <div className="trk-lb-tabs">
        {['7d','30d','all'].map(w => (
          <button key={w} className={`trk-lb-tab ${win === w ? 'on' : ''}`} onClick={() => setWin(w)}>
            {w === '7d' ? '7 days' : w === '30d' ? '30 days' : 'All time'}
          </button>
        ))}
      </div>
      <div className="trk-lb-list">
        {rows.length === 0 && <div className="trk-empty">No approved work in this window.</div>}
        {rows.map((r, i) => {
          const m = findMember(r.memberId);
          if (!m) return null;
          return (
            <div key={r.memberId} className="trk-lb-row">
              <div className="trk-lb-rank">{i + 1}</div>
              <Avatar member={m} size={28} />
              <div className="trk-lb-who">
                <div className="trk-lb-name">{m.name}</div>
                <div className="trk-lb-meta">{m.handle} · {findNode(m.homeNodeId).name}</div>
              </div>
              <div className="trk-lb-stats">
                <div className="trk-lb-earn">{r.earn} <span>$H</span></div>
                <div className="trk-lb-count">{r.count} contrib · +{r.rep} rep</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Community feed (anonymized public feel) ──────────────────────────────────
function CommunityFeed({ contributions }) {
  const recent = contributions
    .filter(c => c.status === 'approved')
    .slice(0, 10);
  return (
    <div className="trk-card">
      <div className="trk-card-head">
        <div className="section-eyebrow">Live</div>
        <div className="trk-card-title">Community <em>feed.</em></div>
      </div>
      <div className="trk-feed">
        {recent.map(c => {
          const m = findMember(c.memberId);
          const t = findType(c.typeId);
          const n = findNode(c.nodeId);
          return (
            <div key={c.id} className="trk-feed-row">
              <Avatar member={m} size={22} />
              <div className="trk-feed-text">
                <strong>{m.handle}</strong> · {t.label.toLowerCase()} at <span style={{ color: n.color }}>{n.name}</span>
                <span className="trk-feed-time"> · {timeAgo(c.reviewedAt || c.submittedAt)}</span>
              </div>
              <span className="trk-feed-earn">+{t.earn}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Top bar ──────────────────────────────────────────────────────────────────
function TopBar({ currentMember, wallet, tab, setTab }) {
  const isReviewer = currentMember.role === 'steward' || currentMember.role === 'admin';
  const tabs = [
    { id:'log',    label:'Log work' },
    { id:'me',     label:'My ledger' },
    ...(isReviewer ? [{ id:'queue', label:'Review queue' }] : []),
    { id:'board',  label:'Leaderboard' },
  ];
  return (
    <div className="topbar">
      <div className="topbar-row">
        <div className="brand">
          <div className="brand-name">Spo<span className="brand-dot" />re</div>
          <div className="brand-sub">Contribution tracker · demo</div>
        </div>
        <div className="wallet-pill">
          <span className="wallet-rep-dot" style={{ background: wallet.tier.color, boxShadow:`0 0 0 3px color-mix(in srgb, ${wallet.tier.color} 25%, transparent)` }} />
          <div className="wallet-stack">
            <div className="wallet-bal">{wallet.balance} $H</div>
            <div className="wallet-cta">{wallet.tier.label}</div>
          </div>
        </div>
      </div>
      <div className="tabs">
        {tabs.map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────
function App() {
  const store = useStore();
  const [currentId, setCurrentId] = useState(() => {
    try { return localStorage.getItem(CURRENT_USER_KEY) || 'fern'; } catch (_) { return 'fern'; }
  });
  useEffect(() => {
    try { localStorage.setItem(CURRENT_USER_KEY, currentId); } catch (_) {}
  }, [currentId]);

  const currentMember = findMember(currentId);
  const wallet = useMemo(() => walletFor(currentId, store.state.contributions), [currentId, store.state.contributions]);
  const [tab, setTab] = useState('log');
  const [toast, setToast] = useState({ msg:'', kind:'' });
  const onToast = (msg, kind) => setToast({ msg, kind });

  // when switching tabs, scroll up
  useEffect(() => { window.scrollTo({ top: 0, behavior:'smooth' }); }, [tab]);

  // when stewards lose role on switch, fall back to safe tab
  useEffect(() => {
    const reviewer = currentMember.role === 'steward' || currentMember.role === 'admin';
    if (!reviewer && tab === 'queue') setTab('me');
  }, [currentId]);

  return (
    <div className="app">
      <UserSwitcher currentId={currentId} onPick={setCurrentId} />
      <TopBar currentMember={currentMember} wallet={wallet} tab={tab} setTab={setTab} />

      <div className="trk-page page-enter" key={tab + currentId}>
        {tab === 'log' && (
          <>
            <WalletCard member={currentMember} wallet={wallet} />
            <LogWorkForm
              member={currentMember}
              onSubmit={(typeId, nodeId, notes) => {
                const { autoApproved } = store.submit(currentId, typeId, nodeId, notes);
                const t = findType(typeId);
                onToast(
                  autoApproved
                    ? `+${t.earn} $H credited · auto-approved`
                    : `Submitted · pending steward review`,
                  autoApproved ? 'success' : ''
                );
              }}
            />
            <CommunityFeed contributions={store.state.contributions} />
          </>
        )}

        {tab === 'me' && (
          <>
            <WalletCard member={currentMember} wallet={wallet} />
            <MyHistory memberId={currentId} contributions={store.state.contributions} />
          </>
        )}

        {tab === 'queue' && (
          <ReviewQueue
            currentMember={currentMember}
            contributions={store.state.contributions}
            onReview={store.review}
            onToast={onToast}
          />
        )}

        {tab === 'board' && (
          <Leaderboard contributions={store.state.contributions} />
        )}
      </div>

      <button className="trk-reset" onClick={() => { if (confirm('Reset demo data?')) store.reset(); }}>↺ Reset demo</button>

      <Toast msg={toast.msg} kind={toast.kind} onClose={() => setToast({ msg:'', kind:'' })} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
