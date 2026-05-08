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

// Admin password stored in localStorage; default is revealed to Robin
const ADMIN_PW_KEY = "fa_admin_password";
const DEFAULT_ADMIN_PW = "fungai2025";

// ─── Storage ──────────────────────────────────────────────────────────────────

interface Session { branch: Branch; start: number; end: number; sec: number }

const K = {
  pattern:  (n: string) => `fa_com_pattern_${n}`,
  active:   (n: string) => `fa_com_active_${n}`,
  acc:      (n: string, b: string) => `fa_com_acc_${n}_${b.replace(/ /g, "_")}`,
  branch:   (n: string) => `fa_com_branch_${n}`,
  sessions: (n: string) => `fa_com_sessions_${n}`,
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
  // keep latest 200 per member
  const updated = [session, ...existing].slice(0, 200);
  lsSet(K.sessions(name), updated);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

  function startTimer() {
    lsSet(K.active(member.name), { branch, start: Date.now() });
    setIsRunning(true);
  }

  function stopTimer() {
    const a = getActive();
    if (a) {
      const end = Date.now();
      const sec = Math.floor((end - a.start) / 1000);
      lsSet(K.acc(member.name, a.branch), accSec(a.branch as Branch) + sec);
      logSession(member.name, { branch: a.branch as Branch, start: a.start, end, sec });
      lsSet(K.active(member.name), null);
    }
    setIsRunning(false);
    setSessionSec(0);
  }

  function switchBranch(b: Branch) {
    if (b === branch) return;
    if (isRunning) stopTimer();
    setBranch(b);
    lsSet(K.branch(member.name), b);
  }

  const activeBranch: Branch = (getActive()?.branch as Branch) ?? branch;
  const totalSec = accSec(activeBranch) + (isRunning && activeBranch === branch ? sessionSec : 0);

  const sessions = lsGet<Session[]>(K.sessions(member.name), []).slice(0, 5);

  return (
    <div style={{ minHeight: "100dvh", background: "#060809", color: "#f0ede5", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 0" }}>
        <button onClick={() => window.location.href = "/"} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 13 }}>← Engine</button>
        <button onClick={onLogout} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 13 }}>Sign out</button>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 20px 60px" }}>
        {/* Greeting */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 44, color: member.accent, marginBottom: 4 }}>Hey, {member.name}</h1>
          <p style={{ color: "rgba(255,255,255,0.32)", fontSize: 14 }}>Track your time across branches</p>
        </div>

        {/* Branch pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
          {BRANCHES.map(b => (
            <button key={b} onClick={() => switchBranch(b as Branch)} style={{
              padding: "9px 18px", borderRadius: 999,
              border: b === branch ? `1.5px solid ${member.accent}` : "1.5px solid rgba(255,255,255,0.1)",
              background: b === branch ? member.glow : "rgba(255,255,255,0.03)",
              color: b === branch ? member.accent : "rgba(255,255,255,0.45)",
              fontSize: 13, fontWeight: b === branch ? 600 : 400,
              cursor: "pointer", transition: "all 0.2s ease",
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
            }}>
              {b}
            </button>
          ))}
        </div>

        {/* Timer card */}
        <div style={{ background: "rgba(255,255,255,0.035)", borderRadius: 28, border: "1px solid rgba(255,255,255,0.07)", padding: "44px 28px 40px", textAlign: "center", position: "relative", overflow: "hidden", marginBottom: 20 }}>
          <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 240, height: 240, borderRadius: "50%", background: member.glow, filter: "blur(70px)", opacity: isRunning ? 1 : 0.35, transition: "opacity 1.2s ease", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 20, right: 20, display: "flex", alignItems: "center", gap: 6, opacity: isRunning ? 1 : 0, transition: "opacity 0.3s" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: member.accent, animation: "cp-pulse 1.5s ease-in-out infinite" }} />
            <span style={{ color: member.accent, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em" }}>REC</span>
          </div>
          <div style={{ fontSize: "clamp(48px, 14vw, 72px)", fontWeight: 300, letterSpacing: "0.04em", color: "#f0ede5", fontVariantNumeric: "tabular-nums", fontFamily: "'Space Grotesk', monospace", marginBottom: 10, position: "relative" }}>
            {fmt(totalSec)}
          </div>
          <div style={{ color: member.accent, fontSize: 13, opacity: 0.65, marginBottom: 36 }}>{branch}</div>
          <button onClick={isRunning ? stopTimer : startTimer} style={{
            display: "inline-flex", alignItems: "center", gap: 10, padding: "15px 40px", borderRadius: 999,
            background: isRunning ? "rgba(248,113,113,0.1)" : member.glow,
            border: isRunning ? "1.5px solid rgba(248,113,113,0.4)" : `1.5px solid ${member.accent}55`,
            color: isRunning ? "#f87171" : member.accent,
            fontSize: 17, fontWeight: 600, cursor: "pointer",
            fontFamily: "'Space Grotesk', system-ui, sans-serif", transition: "all 0.2s ease",
          }}>
            <span style={{ fontSize: 14 }}>{isRunning ? "■" : "▶"}</span>
            {isRunning ? "Stop" : "Start"}
          </button>
        </div>

        {/* Branch totals */}
        <div style={{ background: "rgba(255,255,255,0.025)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.06)", padding: "4px 0", marginBottom: 20 }}>
          {BRANCHES.map((b, i) => {
            const sec = accSec(b as Branch) + (isRunning && activeBranch === b ? sessionSec : 0);
            return (
              <div key={b} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 20px", borderBottom: i < BRANCHES.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>{b}</span>
                <span style={{ fontFamily: "monospace", color: sec > 0 ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.2)", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>{fmt(sec)}</span>
              </div>
            );
          })}
        </div>

        {/* Recent sessions */}
        {sessions.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 10 }}>RECENT SESSIONS</p>
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", padding: "2px 0" }}>
              {sessions.map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: i < sessions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <div>
                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{s.branch}</span>
                    <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginLeft: 8 }}>{fmtDate(s.start)}</span>
                  </div>
                  <span style={{ color: member.accent, fontSize: 12, fontFamily: "monospace" }}>{fmtDuration(s.sec)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Widget slot */}
        <div style={{ padding: "20px", borderRadius: 20, border: "1px dashed rgba(255,255,255,0.06)", textAlign: "center", color: "rgba(255,255,255,0.18)", fontSize: 12, letterSpacing: "0.06em" }}>
          MORE WIDGETS COMING SOON
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
  const [tab, setTab] = useState<"overview" | "sessions" | "settings">("overview");
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
      const sessions = lsGet<Session[]>(K.sessions(m.name), []);
      for (const s of sessions) all.push({ ...s, member: m.name, accent: m.accent });
    }
    return all.sort((a, b) => b.start - a.start);
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
        {(["overview", "sessions", "settings"] as const).map(t => (
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
                let total = 0;
                for (const m of MEMBERS) {
                  total += lsGet<number>(K.acc(m.name, b), 0);
                  const active = lsGet<{ branch: Branch; start: number } | null>(K.active(m.name), null);
                  if (active?.branch === b) total += Math.floor((Date.now() - active.start) / 1000);
                }
                const colors: Record<string, string> = {
                  "Fungai Art": "#7bd4a1",
                  "New Tyme Tonics": "#f9a8d4",
                  "Skogens Nektar": "#c4b5fd",
                };
                return (
                  <div key={b} style={{ background: card, borderRadius: 18, border: `1px solid ${border}`, padding: "20px 18px" }}>
                    <div style={{ color: colors[b], fontSize: 11, letterSpacing: "0.1em", marginBottom: 8 }}>{b.toUpperCase()}</div>
                    <div style={{ fontSize: 26, fontFamily: "monospace", fontWeight: 300, color: "#f0ede5" }}>{fmt(total)}</div>
                    <div style={{ color: muted, fontSize: 11, marginTop: 4 }}>team total</div>
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
            <p style={{ color: muted, fontSize: 14, marginBottom: 20 }}>
              {allSessions.length} recorded sessions across the team
            </p>
            <div style={{ background: card, borderRadius: 20, border: `1px solid ${border}`, overflow: "hidden" }}>
              {allSessions.slice(0, 50).map((s, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
                  borderBottom: i < Math.min(allSessions.length, 50) - 1 ? `1px solid rgba(255,255,255,0.05)` : "none",
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.accent, flexShrink: 0 }} />
                  <span style={{ color: s.accent, fontWeight: 600, fontSize: 13, width: 60 }}>{s.member}</span>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, flex: 1 }}>{s.branch}</span>
                  <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{fmtDate(s.start)}</span>
                  <span style={{ color: "#f0ede5", fontFamily: "monospace", fontSize: 12, width: 60, textAlign: "right" }}>{fmtDuration(s.sec)}</span>
                </div>
              ))}
              {allSessions.length === 0 && (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
                  No sessions recorded yet
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === "settings" && (
          <div style={{ maxWidth: 480 }}>
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
          {MEMBERS.map(m => (
            <button
              key={m.name}
              onClick={() => onSelect(m)}
              style={{ background: m.glow, border: `1.5px solid ${m.accent}33`, borderRadius: 20, padding: "28px 16px", cursor: "pointer", transition: "all 0.22s ease", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
              onMouseEnter={e => { const el = e.currentTarget; el.style.border = `1.5px solid ${m.accent}88`; el.style.transform = "translateY(-3px)"; el.style.boxShadow = `0 12px 32px ${m.glow}`; }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.border = `1.5px solid ${m.accent}33`; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; }}
            >
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg, ${m.accent}33, ${m.accent}11)`, border: `1.5px solid ${m.accent}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontFamily: "'Cormorant Garamond', serif", color: m.accent, fontWeight: 600 }}>
                {m.name[0]}
              </div>
              <span style={{ color: "#f0ede5", fontSize: 17, fontWeight: 600 }}>{m.name}</span>
              <span style={{ color: m.accent, fontSize: 10, letterSpacing: "0.08em", opacity: 0.6 }}>HYPHAE</span>
            </button>
          ))}
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
