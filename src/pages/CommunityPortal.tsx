import { useState, useRef, useEffect } from "react";
import FungaiArtLogo from "@/assets/fungai-art-logo.png";

// ─── Constants ────────────────────────────────────────────────────────────────

const MEMBERS = [
  { name: "Vi",     accent: "#7bd4a1", glow: "rgba(123,212,161,0.14)" },
  { name: "Gabi",   accent: "#f9a8d4", glow: "rgba(249,168,212,0.14)" },
  { name: "Jouni",  accent: "#c4b5fd", glow: "rgba(196,181,253,0.14)" },
  { name: "Emil",   accent: "#93c5fd", glow: "rgba(147,197,253,0.14)" },
  { name: "Angela", accent: "#fcd34d", glow: "rgba(252,211,77,0.14)"  },
  { name: "Remi",   accent: "#fb923c", glow: "rgba(251,146,60,0.14)"  },
] as const;
type Member = typeof MEMBERS[number];

const BRANCHES = ["Fungai Art", "New Tyme Tonics", "Skogens Nektar"] as const;
type Branch = typeof BRANCHES[number];

const CONTRIB_TYPES = [
  { id: "kitchen",   label: "Kitchen",   icon: "🍽",  desc: "Food prep & meals"          },
  { id: "foraging",  label: "Foraging",  icon: "🌿",  desc: "Wild harvest & species ID"  },
  { id: "content",   label: "Content",   icon: "◈",   desc: "Photo, video, copy"         },
  { id: "events",    label: "Events",    icon: "✦",   desc: "Setup & facilitation"        },
  { id: "lab",       label: "Lab",       icon: "⚗",   desc: "Extraction & tinctures"     },
  { id: "workshop",  label: "Workshop",  icon: "◉",   desc: "Teaching & demos"           },
  { id: "admin",     label: "Admin",     icon: "○",   desc: "Planning & logistics"       },
  { id: "sales_rep", label: "Sales",     icon: "◎",   desc: "Customer & market"          },
  { id: "other",     label: "Other",     icon: "•",   desc: "Anything else"              },
] as const;
type ContribId = typeof CONTRIB_TYPES[number]["id"];

// Admin password stored in localStorage; default is revealed to Robin
const ADMIN_PW_KEY = "fa_admin_password";
const DEFAULT_ADMIN_PW = "fungai2025";

// ─── Storage ──────────────────────────────────────────────────────────────────

interface Session { branch: Branch; start: number; end: number; sec: number; ct?: ContribId }
interface Sale    { branch: Branch; amount: number; note: string; ts: number }

const K = {
  pattern:  (n: string) => `fa_com_pattern_${n}`,
  active:   (n: string) => `fa_com_active_${n}`,
  acc:      (n: string, b: string) => `fa_com_acc_${n}_${b.replace(/ /g, "_")}`,
  branch:   (n: string) => `fa_com_branch_${n}`,
  sessions: (n: string) => `fa_com_sessions_${n}`,
  sales:    (n: string) => `fa_com_sales_${n}`,
  notes:    (n: string) => `fa_com_notes_${n}`,
  goal:     (b: string) => `fa_com_goal_${b.replace(/ /g, "_")}`,
  announce: "fa_com_announcement",
};

function lsGet<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function logSession(name: string, session: Session) {
  const existing = lsGet<Session[]>(K.sessions(name), []);
  lsSet(K.sessions(name), [session, ...existing].slice(0, 200));
}

function logSale(name: string, sale: Sale) {
  const existing = lsGet<Sale[]>(K.sales(name), []);
  lsSet(K.sales(name), [sale, ...existing].slice(0, 500));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function weekStart(offsetWeeks = 0): number {
  const d = new Date();
  const day = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - day + 1 + offsetWeeks * 7);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
function weekSec(sessions: Session[], from: number, to: number) {
  return sessions.filter(s => s.start >= from && s.start < to).reduce((a, s) => a + s.sec, 0);
}
function weekSalesTotal(sales: Sale[], from: number, to: number) {
  return sales.filter(s => s.ts >= from && s.ts < to).reduce((a, s) => a + s.amount, 0);
}
function fmtEur(n: number) { return `€${Number.isInteger(n) ? n : n.toFixed(2)}`; }

function fmt(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
}

function fmtDate(ms: number) {
  const d = new Date(ms);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function fmtDuration(sec: number) {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
}

// ─── Pattern Lock ─────────────────────────────────────────────────────────────

const C = 252;
const DOTS = Array.from({ length: 9 }, (_, i) => ({
  x: 42 + (i % 3) * 84,
  y: 42 + Math.floor(i / 3) * 84,
}));

function paintCanvas(
  canvas: HTMLCanvasElement,
  sel: number[],
  cur: { x: number; y: number } | null,
  drawing: boolean,
  accent: string,
  failed: boolean,
) {
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, C, C);
  const col = failed ? "#f87171" : accent;

  if (sel.length > 1) {
    ctx.beginPath();
    ctx.moveTo(DOTS[sel[0]].x, DOTS[sel[0]].y);
    for (let i = 1; i < sel.length; i++) ctx.lineTo(DOTS[sel[i]].x, DOTS[sel[i]].y);
    ctx.strokeStyle = col + "99";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }
  if (drawing && sel.length > 0 && cur) {
    const last = DOTS[sel[sel.length - 1]];
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(cur.x, cur.y);
    ctx.strokeStyle = col + "44";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  DOTS.forEach((dot, i) => {
    const on = sel.includes(i);
    if (on) {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 26, 0, Math.PI * 2);
      ctx.strokeStyle = col + "33";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, on ? 14 : 8, 0, Math.PI * 2);
    ctx.fillStyle = on ? col : "rgba(255,255,255,0.18)";
    ctx.fill();
    if (!on) {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fill();
    }
  });
}

interface PLockProps {
  accent: string;
  mode: "capture" | "verify";
  saved?: string | null;
  hint?: string;
  onDone: (ok: boolean, pat?: string) => void;
}

function PatternLock({ accent, mode, saved, hint, onDone }: PLockProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [sel, setSel] = useState<number[]>([]);
  const [cur, setCur] = useState<{ x: number; y: number } | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [shake, setShake] = useState(false);
  const selRef = useRef<number[]>([]);
  selRef.current = sel;

  useEffect(() => {
    if (ref.current) paintCanvas(ref.current, sel, cur, drawing, accent, failed);
  }, [sel, cur, drawing, accent, failed]);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const r = ref.current!.getBoundingClientRect();
    const scale = C / r.width;
    const src = "touches" in e ? (e.touches[0] ?? e.changedTouches[0]) : (e as React.MouseEvent);
    return { x: (src.clientX - r.left) * scale, y: (src.clientY - r.top) * scale };
  }

  function hitDot(p: { x: number; y: number }) {
    return DOTS.findIndex(d => Math.hypot(p.x - d.x, p.y - d.y) < 28);
  }

  function onStart(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const p = getPos(e);
    const d = hitDot(p);
    if (d < 0) return;
    setFailed(false); setShake(false);
    setSel([d]); setDrawing(true); setCur(p);
  }

  function onMove(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    if (!drawing) return;
    const p = getPos(e);
    setCur(p);
    const d = hitDot(p);
    if (d >= 0 && !selRef.current.includes(d)) setSel(prev => [...prev, d]);
  }

  function onEnd(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    if (!drawing) return;
    setDrawing(false); setCur(null);
    const current = selRef.current;
    if (current.length < 4) {
      setFailed(true); setShake(true);
      setTimeout(() => { setSel([]); setFailed(false); setShake(false); }, 900);
      return;
    }
    const pat = current.join(",");
    if (mode === "capture") {
      setSel([]);
      onDone(true, pat);
    } else {
      if (pat === saved) {
        onDone(true, pat);
      } else {
        setFailed(true); setShake(true);
        setTimeout(() => { setSel([]); setFailed(false); setShake(false); onDone(false); }, 900);
      }
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      {hint && <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center" }}>{hint}</p>}
      <div style={{ animation: shake ? "pl-shake 0.4s ease" : "none" }}>
        <canvas
          ref={ref} width={C} height={C}
          style={{ width: 210, height: 210, background: "rgba(255,255,255,0.03)", borderRadius: 20, cursor: "crosshair", display: "block", touchAction: "none", userSelect: "none" }}
          onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd}
          onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
        />
      </div>
      <p style={{ fontSize: 12, color: "#f87171", minHeight: 18 }}>
        {failed ? (selRef.current.length < 4 ? "Connect at least 4 dots" : "Wrong pattern — try again") : ""}
      </p>
    </div>
  );
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────

type AuthStep =
  | { step: "set1" }
  | { step: "set2"; first: string }
  | { step: "verify"; attempts: number };

interface AuthModalProps {
  member: Member;
  onSuccess: () => void;
  onClose: () => void;
}

function AuthModal({ member, onSuccess, onClose }: AuthModalProps) {
  const saved = lsGet<string | null>(K.pattern(member.name), null);
  const [authStep, setAuthStep] = useState<AuthStep>(
    saved ? { step: "verify", attempts: 0 } : { step: "set1" }
  );
  const [notice, setNotice] = useState("");

  function handleCapture(ok: boolean, pat?: string) {
    if (!ok || !pat) return;
    if (authStep.step === "set1") {
      setNotice("Draw it once more to confirm");
      setAuthStep({ step: "set2", first: pat });
    } else if (authStep.step === "set2") {
      const { first } = authStep as { step: "set2"; first: string };
      if (pat !== first) {
        setNotice("Didn't match — draw your first pattern again");
        setAuthStep({ step: "set1" });
        return;
      }
      lsSet(K.pattern(member.name), pat);
      onSuccess();
    }
  }

  function handleVerify(ok: boolean) {
    if (ok) { onSuccess(); return; }
    const a = (authStep as { step: "verify"; attempts: number }).attempts + 1;
    if (a >= 3) { onClose(); return; }
    setAuthStep({ step: "verify", attempts: a });
    setNotice(`${3 - a} ${3 - a === 1 ? "attempt" : "attempts"} remaining`);
  }

  const title =
    authStep.step === "set1" ? "Set your pattern" :
    authStep.step === "set2" ? "Confirm your pattern" :
    `Welcome back, ${member.name}`;

  const subtitle =
    authStep.step === "set1" ? "Connect at least 4 dots" :
    authStep.step === "set2" ? (notice || "Draw the same pattern again") :
    (notice || "Draw your unlock pattern");

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(4,5,8,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: "#0e1015", border: `1px solid ${member.accent}33`, borderRadius: 28, padding: "36px 32px", width: "100%", maxWidth: 320, boxShadow: `0 0 60px ${member.glow}, 0 24px 48px rgba(0,0,0,0.6)`, position: "relative" }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
        <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: 999, background: member.glow, border: `1px solid ${member.accent}44`, color: member.accent, fontSize: 13, fontWeight: 600, marginBottom: 20, fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
          {member.name}
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "#f0ede5", marginBottom: 6, fontWeight: 600 }}>{title}</h2>
        <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, marginBottom: 28 }}>{subtitle}</p>

        {authStep.step === "set1" && <PatternLock accent={member.accent} mode="capture" onDone={handleCapture} />}
        {authStep.step === "set2" && <PatternLock key="set2" accent={member.accent} mode="capture" onDone={handleCapture} />}
        {authStep.step === "verify" && <PatternLock key={`v${(authStep as {step:"verify";attempts:number}).attempts}`} accent={member.accent} mode="verify" saved={saved} onDone={handleVerify} />}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

interface DashboardProps {
  member: Member;
  onLogout: () => void;
}

function Dashboard({ member, onLogout }: DashboardProps) {
  const [branch, setBranch] = useState<Branch>(
    () => lsGet<Branch>(K.branch(member.name), "Fungai Art")
  );
  // Sale modal
  const [showSale, setShowSale] = useState(false);
  const [saleBranch, setSaleBranch] = useState<Branch>(branch);
  const [saleAmount, setSaleAmount] = useState("");
  const [saleNote, setSaleNote] = useState("");
  // Notes widget
  const [notes, setNotes] = useState(() => lsGet<string>(K.notes(member.name), ""));

  function getActive() {
    return lsGet<{ branch: Branch; start: number } | null>(K.active(member.name), null);
  }

  const [isRunning, setIsRunning] = useState(() => getActive() !== null);
  const [sessionSec, setSessionSec] = useState(() => {
    const a = getActive();
    return a ? Math.floor((Date.now() - a.start) / 1000) : 0;
  });

  useEffect(() => {
    if (!isRunning) { setSessionSec(0); return; }
    const id = setInterval(() => {
      const a = getActive();
      setSessionSec(a ? Math.floor((Date.now() - a.start) / 1000) : 0);
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, member.name]);

  function accSec(b: Branch) { return lsGet<number>(K.acc(member.name, b), 0); }

  function ctSec(ctId: ContribId): number {
    return lsGet<Session[]>(K.sessions(member.name), [])
      .filter(s => s.ct === ctId)
      .reduce((a, s) => a + s.sec, 0);
  }

  function startTimer(ctId: ContribId) {
    lsSet(K.active(member.name), { branch, ct: ctId, start: Date.now() });
    setIsRunning(true);
  }

  function stopTimer() {
    const a = getActive();
    if (a) {
      const end = Date.now();
      const sec = Math.floor((end - a.start) / 1000);
      lsSet(K.acc(member.name, a.branch), accSec(a.branch as Branch) + sec);
      logSession(member.name, { branch: a.branch as Branch, ct: a.ct as ContribId | undefined, start: a.start, end, sec });
      lsSet(K.active(member.name), null);
    }
    setIsRunning(false);
    setSessionSec(0);
  }

  function toggleContrib(ctId: ContribId) {
    const active = getActive();
    if (active && active.ct === ctId) { stopTimer(); return; }
    if (active) stopTimer();
    startTimer(ctId);
  }

  function submitSale() {
    const amt = parseFloat(saleAmount);
    if (!amt || amt <= 0) return;
    logSale(member.name, { branch: saleBranch, amount: amt, note: saleNote.trim(), ts: Date.now() });
    setSaleAmount(""); setSaleNote(""); setShowSale(false);
  }

  function switchBranch(b: Branch) {
    if (b === branch) return;
    if (isRunning) stopTimer();
    setBranch(b);
    lsSet(K.branch(member.name), b);
  }

  const activeRec = getActive();
  const activeCt = activeRec?.ct as ContribId | undefined;
  const activeBranch: Branch = (activeRec?.branch as Branch) ?? branch;
  const totalSec = accSec(activeBranch) + (isRunning && activeBranch === branch ? sessionSec : 0);

  const sessions = lsGet<Session[]>(K.sessions(member.name), []).slice(0, 5);

  const announcement = lsGet<string>(K.announce, "");
  const thisW = weekStart(0); const lastW = weekStart(-1);
  const allSessions = lsGet<Session[]>(K.sessions(member.name), []);
  const allSales    = lsGet<Sale[]>(K.sales(member.name), []);
  const thisHrs  = weekSec(allSessions, thisW, thisW + 7*86400*1000);
  const lastHrs  = weekSec(allSessions, lastW, lastW + 7*86400*1000);
  const thisSales = weekSalesTotal(allSales, thisW, thisW + 7*86400*1000);
  const lastSales = weekSalesTotal(allSales, lastW, lastW + 7*86400*1000);

  return (
    <div style={{ minHeight: "100dvh", background: "#060809", color: "#f0ede5", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      {/* Sale Modal */}
      {showSale && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(4,5,8,.9)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setShowSale(false)}>
          <div style={{ background: "#0e1015", border: `1px solid ${member.accent}33`, borderRadius: 24, padding: "28px 24px", width: "100%", maxWidth: 340 }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "#f0ede5", marginBottom: 16 }}>Log a Sale</h3>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {BRANCHES.map(b => (
                <button key={b} onClick={() => setSaleBranch(b as Branch)} style={{ padding: "6px 14px", borderRadius: 999, fontSize: 12, cursor: "pointer", border: saleBranch === b ? `1.5px solid ${member.accent}` : "1px solid rgba(255,255,255,0.12)", background: saleBranch === b ? member.glow : "transparent", color: saleBranch === b ? member.accent : "rgba(255,255,255,0.4)", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>{b}</button>
              ))}
            </div>
            <input type="number" min="0" step="0.01" value={saleAmount} onChange={e => setSaleAmount(e.target.value)} placeholder="Amount (€)" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede5", fontSize: 15, outline: "none", marginBottom: 10, boxSizing: "border-box", fontFamily: "'Space Grotesk', system-ui, sans-serif" }} />
            <input type="text" value={saleNote} onChange={e => setSaleNote(e.target.value)} placeholder="Note — product, event… (optional)" maxLength={80} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede5", fontSize: 14, outline: "none", marginBottom: 18, boxSizing: "border-box", fontFamily: "'Space Grotesk', system-ui, sans-serif" }} />
            <button onClick={submitSale} style={{ width: "100%", padding: "13px", borderRadius: 14, background: member.glow, border: `1.5px solid ${member.accent}55`, color: member.accent, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>Save Sale</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 0" }}>
        <button onClick={() => window.location.href = "/"} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 13 }}>← Engine</button>
        <button onClick={onLogout} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 13 }}>Sign out</button>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 20px 60px" }}>
        {/* Announcement banner */}
        {announcement && (
          <div style={{ background: "rgba(252,211,77,0.08)", border: "1px solid rgba(252,211,77,0.25)", borderRadius: 14, padding: "12px 16px", marginBottom: 24, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>📣</span>
            <p style={{ color: "#fcd34d", fontSize: 13, lineHeight: 1.5 }}>{announcement}</p>
          </div>
        )}

        {/* ── Personal greeting ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: member.accent, lineHeight: 1 }}>{member.name}</h1>
            {isRunning && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: member.accent, animation: "cp-pulse 1.5s ease-in-out infinite" }} />
                <span style={{ color: member.accent, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em" }}>LIVE</span>
              </div>
            )}
          </div>
          <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 13 }}>
            {isRunning
              ? `${CONTRIB_TYPES.find(c => c.id === activeCt)?.label ?? "Working"} · ${branch}`
              : "Select a contribution to start timing"}
          </p>
        </div>

        {/* ── Branch selector ── */}
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 24 }}>
          {BRANCHES.map(b => (
            <button key={b} onClick={() => switchBranch(b as Branch)} style={{
              padding: "7px 16px", borderRadius: 999, fontSize: 12,
              border: b === branch ? `1.5px solid ${member.accent}` : "1.5px solid rgba(255,255,255,0.08)",
              background: b === branch ? member.glow : "transparent",
              color: b === branch ? member.accent : "rgba(255,255,255,0.38)",
              fontWeight: b === branch ? 600 : 400, cursor: "pointer",
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
            }}>{b}</button>
          ))}
        </div>

        {/* ── Active session banner (when running) ── */}
        {isRunning && activeCt && (
          <div style={{ background: member.glow, border: `1px solid ${member.accent}44`, borderRadius: 20, padding: "18px 20px", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: member.accent, fontSize: 11, letterSpacing: "0.1em", marginBottom: 3 }}>NOW TIMING</div>
              <div style={{ color: "#f0ede5", fontSize: 22, fontFamily: "monospace", fontWeight: 300, fontVariantNumeric: "tabular-nums" }}>{fmt(sessionSec)}</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 }}>
                {CONTRIB_TYPES.find(c => c.id === activeCt)?.label} · {activeBranch}
              </div>
            </div>
            <button onClick={stopTimer} style={{ padding: "10px 20px", borderRadius: 999, background: "rgba(248,113,113,0.12)", border: "1.5px solid rgba(248,113,113,0.4)", color: "#f87171", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
              ■ Stop
            </button>
          </div>
        )}

        {/* ── Contribution type grid ── */}
        <p style={{ color: "rgba(255,255,255,0.22)", fontSize: 10, letterSpacing: "0.12em", marginBottom: 12 }}>WHAT ARE YOU WORKING ON?</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 9, marginBottom: 24 }}>
          {CONTRIB_TYPES.map(ct => {
            const isActive = isRunning && activeCt === ct.id;
            const logged = ctSec(ct.id);
            return (
              <button key={ct.id} onClick={() => toggleContrib(ct.id)} style={{
                borderRadius: 16, padding: "14px 10px 12px",
                background: isActive ? member.glow : "rgba(255,255,255,0.03)",
                border: isActive ? `1.5px solid ${member.accent}` : "1px solid rgba(255,255,255,0.07)",
                cursor: "pointer", textAlign: "center",
                transition: "all 0.18s ease", fontFamily: "'Space Grotesk', system-ui, sans-serif",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                boxShadow: isActive ? `0 0 20px ${member.glow}` : "none",
              }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>{ct.icon}</span>
                <span style={{ color: isActive ? member.accent : "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: isActive ? 600 : 400 }}>{ct.label}</span>
                <span style={{ color: logged > 0 ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.15)", fontSize: 10, fontFamily: "monospace" }}>
                  {logged > 0 ? fmtDuration(logged + (isActive ? sessionSec : 0)) : "—"}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Branch totals + goal progress ── */}
        <div style={{ background: "rgba(255,255,255,0.025)", borderRadius: 18, border: "1px solid rgba(255,255,255,0.06)", padding: "4px 0", marginBottom: 18 }}>
          {BRANCHES.map((b, i) => {
            const sec = accSec(b as Branch) + (isRunning && activeBranch === b ? sessionSec : 0);
            const goalHrs = lsGet<number>(K.goal(b), 0);
            const progress = goalHrs > 0 ? Math.min(1, sec / (goalHrs * 3600)) : 0;
            return (
              <div key={b} style={{ padding: "11px 18px", borderBottom: i < BRANCHES.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: goalHrs > 0 ? 5 : 0 }}>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{b}</span>
                  <span style={{ fontFamily: "monospace", color: sec > 0 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.18)", fontSize: 12 }}>{fmt(sec)}</span>
                </div>
                {goalHrs > 0 && (
                  <div style={{ height: 2, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", background: progress >= 1 ? "#7bd4a1" : member.accent, width: `${progress * 100}%`, transition: "width 0.6s" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Weekly summary ── */}
        <div style={{ background: "rgba(255,255,255,0.025)", borderRadius: 18, border: "1px solid rgba(255,255,255,0.06)", padding: "16px 18px", marginBottom: 18 }}>
          <p style={{ color: "rgba(255,255,255,0.22)", fontSize: 10, letterSpacing: "0.12em", marginBottom: 12 }}>THIS WEEK VS LAST</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ color: member.accent, fontSize: 18, fontFamily: "monospace" }}>{fmtDuration(thisHrs)}</div>
              <div style={{ color: "rgba(255,255,255,0.28)", fontSize: 11, marginTop: 2 }}>vs {fmtDuration(lastHrs)} last wk</div>
            </div>
            <div>
              <div style={{ color: thisSales > 0 ? "#7bd4a1" : "rgba(255,255,255,0.28)", fontSize: 18, fontFamily: "monospace" }}>{fmtEur(thisSales)}</div>
              <div style={{ color: "rgba(255,255,255,0.28)", fontSize: 11, marginTop: 2 }}>vs {fmtEur(lastSales)} last wk</div>
            </div>
          </div>
        </div>

        {/* ── Log a sale ── */}
        <button onClick={() => { setSaleBranch(branch); setShowSale(true); }} style={{ width: "100%", padding: "11px", borderRadius: 14, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", fontFamily: "'Space Grotesk', system-ui, sans-serif", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <span style={{ fontSize: 14 }}>＋</span> Log a sale
        </button>

        {/* ── Recent sessions ── */}
        {sessions.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <p style={{ color: "rgba(255,255,255,0.22)", fontSize: 10, letterSpacing: "0.12em", marginBottom: 10 }}>RECENT</p>
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
              {sessions.map((s, i) => {
                const ctInfo = CONTRIB_TYPES.find(c => c.id === s.ct);
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: i < sessions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {ctInfo && <span style={{ fontSize: 14, opacity: 0.7 }}>{ctInfo.icon}</span>}
                      <div>
                        <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>{ctInfo?.label ?? s.branch}</span>
                        <span style={{ color: "rgba(255,255,255,0.22)", fontSize: 11, marginLeft: 7 }}>{fmtDate(s.start)}</span>
                      </div>
                    </div>
                    <span style={{ color: member.accent, fontSize: 12, fontFamily: "monospace" }}>{fmtDuration(s.sec)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Personal notes ── */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: "rgba(255,255,255,0.22)", fontSize: 10, letterSpacing: "0.12em", marginBottom: 8 }}>MY NOTES</p>
          <textarea value={notes} onChange={e => { setNotes(e.target.value); lsSet(K.notes(member.name), e.target.value); }}
            placeholder="Tasks, reminders, what you're working on…"
            rows={4}
            style={{ width: "100%", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "12px 14px", color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "'Space Grotesk', system-ui, sans-serif", boxSizing: "border-box" }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────

function AdminPanel() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [pwError, setPwError] = useState(false);
  const [tab, setTab] = useState<"overview" | "sessions" | "sales" | "settings">("overview");
  const [announcement, setAnnouncement] = useState(() => lsGet<string>(K.announce, ""));
  const [annoSaved, setAnnoSaved] = useState(false);
  const [goals, setGoals] = useState<Record<string, number>>(() => {
    const g: Record<string, number> = {};
    for (const b of BRANCHES) g[b] = lsGet<number>(K.goal(b), 0);
    return g;
  });
  const [newPw, setNewPw] = useState("");
  const [pwSaved, setPwSaved] = useState(false);
  const [tick, setTick] = useState(0);

  // Live tick for active timers
  useEffect(() => {
    if (!authed) return;
    const id = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(id);
  }, [authed]);

  function tryLogin() {
    const stored = lsGet<string>(ADMIN_PW_KEY, DEFAULT_ADMIN_PW);
    if (pw === stored) {
      setAuthed(true);
    } else {
      setPwError(true);
      setTimeout(() => setPwError(false), 1500);
    }
  }

  function savePassword() {
    if (newPw.length < 4) return;
    lsSet(ADMIN_PW_KEY, newPw);
    setNewPw("");
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 2000);
  }

  function getMemberData(m: Member) {
    const totals: Record<string, number> = {};
    let grand = 0;
    for (const b of BRANCHES) {
      const acc = lsGet<number>(K.acc(m.name, b), 0);
      const active = lsGet<{ branch: Branch; start: number } | null>(K.active(m.name), null);
      const live = (active && active.branch === b)
        ? Math.floor((Date.now() - active.start) / 1000) : 0;
      totals[b] = acc + live;
      grand += acc + live;
    }
    const active = lsGet<{ branch: Branch; start: number } | null>(K.active(m.name), null);
    const hasPattern = lsGet<string | null>(K.pattern(m.name), null) !== null;
    const sessions = lsGet<Session[]>(K.sessions(m.name), []);
    const lastSeen = sessions[0]?.end ?? null;
    return { totals, grand, active, hasPattern, sessions, lastSeen };
  }

  function getAllSessions(): Array<Session & { member: string; accent: string }> {
    const all: Array<Session & { member: string; accent: string }> = [];
    for (const m of MEMBERS) {
      for (const s of lsGet<Session[]>(K.sessions(m.name), [])) all.push({ ...s, member: m.name, accent: m.accent });
    }
    return all.sort((a, b) => b.start - a.start);
  }

  function getAllSales(): Array<Sale & { member: string; accent: string }> {
    const all: Array<Sale & { member: string; accent: string }> = [];
    for (const m of MEMBERS) {
      for (const s of lsGet<Sale[]>(K.sales(m.name), [])) all.push({ ...s, member: m.name, accent: m.accent });
    }
    return all.sort((a, b) => b.ts - a.ts);
  }

  function exportCSV() {
    const sessions = getAllSessions();
    const sales = getAllSales();
    let csv = "TYPE,MEMBER,BRANCH,DATE,DURATION_SEC,AMOUNT_EUR,NOTE\n";
    for (const s of sessions) csv += `time,${s.member},${s.branch},${fmtDate(s.start)},${s.sec},,\n`;
    for (const s of sales)    csv += `sale,${s.member},${s.branch},${fmtDate(s.ts)},,${s.amount},"${s.note}"\n`;
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `fungai-data-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  function resetMember(name: string) {
    if (!confirm(`Reset ALL data for ${name}? This cannot be undone.`)) return;
    localStorage.removeItem(K.pattern(name));
    localStorage.removeItem(K.active(name));
    localStorage.removeItem(K.sessions(name));
    for (const b of BRANCHES) localStorage.removeItem(K.acc(name, b.replace(/ /g, "_")));
    setTick(t => t + 1);
  }

  const bg = "#060809";
  const card = "rgba(255,255,255,0.035)";
  const border = "rgba(255,255,255,0.07)";
  const muted = "rgba(255,255,255,0.35)";

  if (!authed) {
    return (
      <div style={{ minHeight: "100dvh", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
        <div style={{ width: "100%", maxWidth: 360, padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
            <img src={FungaiArtLogo} alt="" style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.15)" }} />
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, letterSpacing: "0.1em", color: "#f0ede5" }}>fungai art</div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: "0.12em" }}>ADMIN PANEL</div>
            </div>
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "#f0ede5", marginBottom: 8 }}>Robin's Dashboard</h1>
          <p style={{ color: muted, fontSize: 14, marginBottom: 32 }}>Enter the admin password to continue.</p>
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && tryLogin()}
            placeholder="Password"
            style={{
              width: "100%", padding: "14px 18px", borderRadius: 14,
              background: "rgba(255,255,255,0.05)",
              border: `1.5px solid ${pwError ? "#f87171" : "rgba(255,255,255,0.1)"}`,
              color: "#f0ede5", fontSize: 15, outline: "none",
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              boxSizing: "border-box", marginBottom: 12,
              transition: "border-color 0.2s",
            }}
          />
          {pwError && <p style={{ color: "#f87171", fontSize: 12, marginBottom: 12 }}>Wrong password</p>}
          <button onClick={tryLogin} style={{
            width: "100%", padding: "14px", borderRadius: 14,
            background: "rgba(123,212,161,0.14)", border: "1.5px solid #7bd4a1",
            color: "#7bd4a1", fontSize: 15, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Space Grotesk', system-ui, sans-serif",
          }}>
            Enter
          </button>
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <a href="/community" style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, textDecoration: "none" }}>← Back to portal</a>
          </div>
        </div>
      </div>
    );
  }

  const allSessions = getAllSessions();

  return (
    <div style={{ minHeight: "100dvh", background: bg, color: "#f0ede5", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: `1px solid ${border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={FungaiArtLogo} alt="" style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.15)" }} />
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, letterSpacing: "0.1em" }}>Robin's Dashboard</div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: "0.1em" }}>FUNGAI ART ADMIN</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <a href="/community" style={{ color: muted, fontSize: 12, textDecoration: "none" }}>← Portal</a>
          <button onClick={() => setAuthed(false)} style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer" }}>Sign out</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, padding: "0 24px", borderBottom: `1px solid ${border}` }}>
        {(["overview", "sessions", "sales", "settings"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "14px 20px", background: "none",
            border: "none", borderBottom: `2px solid ${tab === t ? "#7bd4a1" : "transparent"}`,
            color: tab === t ? "#7bd4a1" : muted,
            fontSize: 13, fontWeight: tab === t ? 600 : 400,
            cursor: "pointer", fontFamily: "'Space Grotesk', system-ui, sans-serif",
            textTransform: "capitalize", letterSpacing: "0.04em",
            transition: "all 0.2s",
          }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px 60px" }}>

        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && (
          <div>
            {/* Grand totals per branch */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 32 }}>
              {BRANCHES.map(b => {
                let totalSec = 0;
                let totalRev = 0;
                for (const m of MEMBERS) {
                  totalSec += lsGet<number>(K.acc(m.name, b), 0);
                  const active = lsGet<{ branch: Branch; start: number } | null>(K.active(m.name), null);
                  if (active?.branch === b) totalSec += Math.floor((Date.now() - active.start) / 1000);
                  const sales = lsGet<Sale[]>(K.sales(m.name), []);
                  totalRev += sales.filter(s => s.branch === b).reduce((a, s) => a + s.amount, 0);
                }
                const colors: Record<string, string> = { "Fungai Art": "#7bd4a1", "New Tyme Tonics": "#f9a8d4", "Skogens Nektar": "#c4b5fd" };
                return (
                  <div key={b} style={{ background: card, borderRadius: 18, border: `1px solid ${border}`, padding: "20px 18px" }}>
                    <div style={{ color: colors[b], fontSize: 11, letterSpacing: "0.1em", marginBottom: 8 }}>{b.toUpperCase()}</div>
                    <div style={{ fontSize: 26, fontFamily: "monospace", fontWeight: 300, color: "#f0ede5" }}>{fmt(totalSec)}</div>
                    <div style={{ color: totalRev > 0 ? "#7bd4a1" : muted, fontSize: 14, fontFamily: "monospace", marginTop: 4 }}>{fmtEur(totalRev)}</div>
                    <div style={{ color: muted, fontSize: 11, marginTop: 2 }}>team total</div>
                  </div>
                );
              })}
            </div>

            {/* Per-member table */}
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 12 }}>INDIVIDUAL CONTRIBUTIONS</p>
            <div style={{ background: card, borderRadius: 20, border: `1px solid ${border}`, overflowX: "auto" }}>
            <div style={{ minWidth: 520 }}>
              {/* Header row */}
              <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 1fr 1fr 90px", gap: 0, padding: "10px 20px", borderBottom: `1px solid ${border}`, color: "rgba(255,255,255,0.3)", fontSize: 11, letterSpacing: "0.08em" }}>
                <span>HYPHAE</span>
                <span>FUNGAI ART</span>
                <span>NEW TYME</span>
                <span>SKOGENS</span>
                <span>TOTAL</span>
              </div>
              {MEMBERS.map((m, i) => {
                const d = getMemberData(m);
                const isLive = d.active !== null;
                return (
                  <div key={m.name} style={{ display: "grid", gridTemplateColumns: "130px 1fr 1fr 1fr 90px", gap: 0, padding: "14px 20px", borderBottom: i < MEMBERS.length - 1 ? `1px solid ${border}` : "none", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {isLive && <div style={{ width: 6, height: 6, borderRadius: "50%", background: m.accent, flexShrink: 0, animation: "cp-pulse 1.5s ease-in-out infinite" }} />}
                      <span style={{ color: m.accent, fontWeight: 600, fontSize: 14 }}>{m.name}</span>
                    </div>
                    {BRANCHES.map(b => (
                      <span key={b} style={{ fontFamily: "monospace", fontSize: 13, color: d.totals[b] > 0 ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.2)" }}>
                        {fmt(d.totals[b])}
                      </span>
                    ))}
                    <span style={{ fontFamily: "monospace", fontSize: 13, color: d.grand > 0 ? "#f0ede5" : "rgba(255,255,255,0.2)", fontWeight: 600 }}>
                      {fmt(d.grand)}
                    </span>
                  </div>
                );
              })}
            </div>{/* end minWidth wrapper */}
            </div>{/* end scroll wrapper */}

            {/* Who's live right now */}
            <div style={{ marginTop: 24 }}>
              {MEMBERS.filter(m => getMemberData(m).active).map(m => {
                const a = lsGet<{ branch: Branch; start: number } | null>(K.active(m.name), null);
                if (!a) return null;
                const elapsed = Math.floor((Date.now() - a.start) / 1000);
                return (
                  <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: `${m.glow}`, borderRadius: 12, marginBottom: 8, border: `1px solid ${m.accent}33` }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.accent, animation: "cp-pulse 1.5s infinite" }} />
                    <span style={{ color: m.accent, fontWeight: 600, fontSize: 13 }}>{m.name}</span>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>is timing</span>
                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{a.branch}</span>
                    <span style={{ color: m.accent, fontFamily: "monospace", fontSize: 12, marginLeft: "auto" }}>{fmt(elapsed)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SESSIONS TAB ── */}
        {tab === "sessions" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <p style={{ color: muted, fontSize: 14 }}>{allSessions.length} recorded sessions</p>
              <button onClick={exportCSV} style={{ padding: "8px 16px", borderRadius: 10, background: "rgba(123,212,161,0.1)", border: "1px solid #7bd4a1", color: "#7bd4a1", fontSize: 12, cursor: "pointer", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>↓ Export CSV</button>
            </div>
            <div style={{ background: card, borderRadius: 20, border: `1px solid ${border}`, overflow: "hidden" }}>
              {allSessions.slice(0, 50).map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 20px", borderBottom: i < Math.min(allSessions.length, 50) - 1 ? `1px solid rgba(255,255,255,0.05)` : "none" }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.accent, flexShrink: 0 }} />
                  <span style={{ color: s.accent, fontWeight: 600, fontSize: 13, width: 56, flexShrink: 0 }}>{s.member}</span>
                  {s.ct && <span style={{ fontSize: 13, opacity: 0.6 }}>{CONTRIB_TYPES.find(c => c.id === s.ct)?.icon}</span>}
                  <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, flex: 1 }}>{s.ct ? CONTRIB_TYPES.find(c => c.id === s.ct)?.label : s.branch}</span>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, flexShrink: 0 }}>{fmtDate(s.start)}</span>
                  <span style={{ color: "#f0ede5", fontFamily: "monospace", fontSize: 12, width: 56, textAlign: "right", flexShrink: 0 }}>{fmtDuration(s.sec)}</span>
                </div>
              ))}
              {allSessions.length === 0 && <div style={{ padding: "40px 20px", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>No sessions recorded yet</div>}
            </div>
          </div>
        )}

        {/* ── SALES TAB ── */}
        {tab === "sales" && (() => {
          const allSalesData = getAllSales();
          return (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
                {BRANCHES.map(b => {
                  const rev = allSalesData.filter(s => s.branch === b).reduce((a, s) => a + s.amount, 0);
                  const colors: Record<string, string> = { "Fungai Art": "#7bd4a1", "New Tyme Tonics": "#f9a8d4", "Skogens Nektar": "#c4b5fd" };
                  return (
                    <div key={b} style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, padding: "16px 14px" }}>
                      <div style={{ color: colors[b], fontSize: 10, letterSpacing: "0.1em", marginBottom: 6 }}>{b.toUpperCase()}</div>
                      <div style={{ fontSize: 22, fontFamily: "monospace", color: "#f0ede5" }}>{fmtEur(rev)}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ background: card, borderRadius: 20, border: `1px solid ${border}`, overflow: "hidden" }}>
                {allSalesData.slice(0, 100).map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 20px", borderBottom: i < Math.min(allSalesData.length, 100) - 1 ? `1px solid rgba(255,255,255,0.05)` : "none" }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.accent, flexShrink: 0 }} />
                    <span style={{ color: s.accent, fontWeight: 600, fontSize: 13, width: 56 }}>{s.member}</span>
                    <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, flex: 1 }}>{s.branch}</span>
                    {s.note && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.note}</span>}
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginLeft: "auto", flexShrink: 0 }}>{fmtDate(s.ts)}</span>
                    <span style={{ color: "#7bd4a1", fontFamily: "monospace", fontSize: 13, width: 64, textAlign: "right", flexShrink: 0 }}>{fmtEur(s.amount)}</span>
                  </div>
                ))}
                {allSalesData.length === 0 && <div style={{ padding: "40px 20px", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>No sales logged yet</div>}
              </div>
            </div>
          );
        })()}

        {/* ── SETTINGS TAB ── */}
        {tab === "settings" && (
          <div style={{ maxWidth: 480 }}>
            {/* Announcement */}
            <div style={{ background: card, borderRadius: 20, border: `1px solid ${border}`, padding: "24px", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "#f0ede5" }}>Team Announcement</h3>
              <p style={{ color: muted, fontSize: 13, marginBottom: 14 }}>Members see this as a banner when they open their portal.</p>
              <textarea value={announcement} onChange={e => setAnnouncement(e.target.value)} maxLength={280} rows={3}
                placeholder="e.g. Berlin focus this week — all hands on the lab event Thursday."
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede5", fontSize: 14, outline: "none", resize: "none", fontFamily: "'Space Grotesk', system-ui, sans-serif", boxSizing: "border-box", marginBottom: 10 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { lsSet(K.announce, announcement); setAnnoSaved(true); setTimeout(() => setAnnoSaved(false), 2000); }}
                  style={{ flex: 1, padding: "10px", borderRadius: 10, background: annoSaved ? "rgba(123,212,161,0.2)" : "rgba(123,212,161,0.1)", border: "1px solid #7bd4a1", color: "#7bd4a1", fontSize: 13, cursor: "pointer", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                  {annoSaved ? "Published ✓" : "Publish"}
                </button>
                <button onClick={() => { setAnnouncement(""); lsSet(K.announce, ""); }}
                  style={{ padding: "10px 16px", borderRadius: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: muted, fontSize: 13, cursor: "pointer", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                  Clear
                </button>
              </div>
            </div>

            {/* Branch goals */}
            <div style={{ background: card, borderRadius: 20, border: `1px solid ${border}`, padding: "24px", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "#f0ede5" }}>Weekly Hour Goals</h3>
              <p style={{ color: muted, fontSize: 13, marginBottom: 14 }}>Members see a progress bar on their timer. Set 0 to disable.</p>
              {BRANCHES.map(b => (
                <div key={b} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{b}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="number" min="0" max="168" value={goals[b] ?? 0} onChange={e => setGoals(g => ({ ...g, [b]: Number(e.target.value) }))}
                      style={{ width: 70, padding: "7px 10px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede5", fontSize: 14, outline: "none", textAlign: "right", fontFamily: "'Space Grotesk', system-ui, sans-serif" }} />
                    <span style={{ color: muted, fontSize: 12 }}>hrs</span>
                  </div>
                </div>
              ))}
              <button onClick={() => { for (const b of BRANCHES) lsSet(K.goal(b), goals[b] ?? 0); setAnnoSaved(true); setTimeout(() => setAnnoSaved(false), 1500); }}
                style={{ width: "100%", padding: "10px", borderRadius: 10, background: "rgba(123,212,161,0.1)", border: "1px solid #7bd4a1", color: "#7bd4a1", fontSize: 13, cursor: "pointer", fontFamily: "'Space Grotesk', system-ui, sans-serif", marginTop: 4 }}>
                {annoSaved ? "Saved ✓" : "Save goals"}
              </button>
            </div>

            {/* Change password */}
            <div style={{ background: card, borderRadius: 20, border: `1px solid ${border}`, padding: "24px", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: "#f0ede5" }}>Change Admin Password</h3>
              <p style={{ color: muted, fontSize: 13, marginBottom: 16 }}>Current default: <code style={{ color: "#7bd4a1" }}>fungai2025</code></p>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  type="password"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && savePassword()}
                  placeholder="New password (min 4 chars)"
                  style={{ flex: 1, padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede5", fontSize: 14, outline: "none", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                />
                <button onClick={savePassword} style={{ padding: "12px 20px", borderRadius: 12, background: pwSaved ? "rgba(123,212,161,0.2)" : "rgba(123,212,161,0.1)", border: "1px solid #7bd4a1", color: "#7bd4a1", fontSize: 14, cursor: "pointer", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                  {pwSaved ? "Saved ✓" : "Save"}
                </button>
              </div>
            </div>

            {/* Member management */}
            <div style={{ background: card, borderRadius: 20, border: `1px solid ${border}`, padding: "24px" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: "#f0ede5" }}>Member Data</h3>
              <p style={{ color: muted, fontSize: 13, marginBottom: 16 }}>Reset a member's pattern and all time data.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {MEMBERS.map(m => {
                  const d = getMemberData(m);
                  return (
                    <div key={m.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: `1px solid rgba(255,255,255,0.06)` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.hasPattern ? m.accent : "rgba(255,255,255,0.2)" }} />
                        <span style={{ color: m.accent, fontWeight: 600, fontSize: 13 }}>{m.name}</span>
                        <span style={{ color: muted, fontSize: 11 }}>{d.hasPattern ? "pattern set" : "no pattern"} · {fmt(d.grand)} total</span>
                      </div>
                      <button onClick={() => resetMember(m.name)} style={{ padding: "5px 12px", borderRadius: 8, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", fontSize: 11, cursor: "pointer", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                        Reset
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Member Grid ──────────────────────────────────────────────────────────────

interface GridProps { onSelect: (m: Member) => void }

function MemberGrid({ onSelect }: GridProps) {
  return (
    <div style={{ minHeight: "100dvh", background: "#060809", color: "#f0ede5", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(255,255,255,0.15)", flexShrink: 0 }}>
            <img src={FungaiArtLogo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, letterSpacing: "0.12em" }}>fungai art</div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, letterSpacing: "0.08em" }}>COMMUNITY PORTAL</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <a href="/community/admin" style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, textDecoration: "none", letterSpacing: "0.06em" }}>admin</a>
          <a href="/" style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textDecoration: "none" }}>← Engine</a>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(32px, 8vw, 52px)", letterSpacing: "0.04em", marginBottom: 8, background: "linear-gradient(135deg, #7bd4a1, #f9e6ac)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          The Hyphaes
        </h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginBottom: 48, lineHeight: 1.6 }}>
          The mycelial network of Fungai Art. Select your name and draw your pattern to enter your portal.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 14 }}>
          {MEMBERS.map(m => {
            const isLive = lsGet<{ branch: Branch; start: number } | null>(K.active(m.name), null) !== null;
            return (
            <button
              key={m.name}
              onClick={() => onSelect(m)}
              style={{ background: m.glow, border: `1.5px solid ${m.accent}33`, borderRadius: 20, padding: "28px 16px", cursor: "pointer", transition: "all 0.22s ease", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, fontFamily: "'Space Grotesk', system-ui, sans-serif", position: "relative" }}
              onMouseEnter={e => { const el = e.currentTarget; el.style.border = `1.5px solid ${m.accent}88`; el.style.transform = "translateY(-3px)"; el.style.boxShadow = `0 12px 32px ${m.glow}`; }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.border = `1.5px solid ${m.accent}33`; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; }}
            >
              {isLive && <div style={{ position: "absolute", top: 12, right: 12, width: 8, height: 8, borderRadius: "50%", background: m.accent, animation: "cp-pulse 1.5s ease-in-out infinite" }} />}
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg, ${m.accent}33, ${m.accent}11)`, border: `1.5px solid ${m.accent}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontFamily: "'Cormorant Garamond', serif", color: m.accent, fontWeight: 600 }}>
                {m.name[0]}
              </div>
              <span style={{ color: "#f0ede5", fontSize: 17, fontWeight: 600 }}>{m.name}</span>
              <span style={{ color: m.accent, fontSize: 10, letterSpacing: "0.08em", opacity: 0.6 }}>{isLive ? "● IN SESSION" : "HYPHAE"}</span>
            </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

type PortalState =
  | { view: "grid" }
  | { view: "auth"; member: Member }
  | { view: "dashboard"; member: Member };

export default function CommunityPortal() {
  const [state, setState] = useState<PortalState>({ view: "grid" });

  useEffect(() => {
    const id = "cp-keyframes";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes cp-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
      @keyframes pl-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
    `;
    document.head.appendChild(style);
  }, []);

  if (state.view === "grid") {
    return <MemberGrid onSelect={m => setState({ view: "auth", member: m })} />;
  }
  if (state.view === "auth") {
    return (
      <>
        <MemberGrid onSelect={() => {}} />
        <AuthModal
          member={state.member}
          onSuccess={() => setState({ view: "dashboard", member: state.member })}
          onClose={() => setState({ view: "grid" })}
        />
      </>
    );
  }
  return (
    <Dashboard
      member={state.member}
      onLogout={() => setState({ view: "grid" })}
    />
  );
}

export { AdminPanel };
