import { useState, useMemo } from "react";
import { Search, X, ArrowLeft, Menu, Leaf } from "lucide-react";
import { HERBS, type Herb } from "./data/herbs";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import FungaiArtLogo from "./assets/fungai-art-logo.png";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CAUTION_COLOR: Record<string, string> = {
  LOW:         "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  "LOW-MEDIUM":"text-emerald-300 border-emerald-400/30 bg-emerald-500/8",
  MEDIUM:      "text-yellow-300  border-yellow-400/30  bg-yellow-500/10",
  "MEDIUM-HIGH":"text-orange-300 border-orange-400/30  bg-orange-500/10",
  HIGH:        "text-red-300     border-red-400/30      bg-red-500/10",
  "VERY HIGH": "text-red-400     border-red-500/40      bg-red-500/15",
};

function shortFunction(fn: string): string {
  const dash = fn.indexOf("—");
  return dash !== -1 ? fn.slice(0, dash).trim() : fn.split(" ").slice(0, 5).join(" ");
}

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHerbs, setSelectedHerbs] = useState<Herb[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const filteredHerbs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return HERBS;
    return HERBS.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        (h.botanical && h.botanical.toLowerCase().includes(q)) ||
        (h.tcm_element && h.tcm_element.toLowerCase().includes(q)) ||
        h.primary_functions.some((f) => f.toLowerCase().includes(q)) ||
        h.energetics.some((e) => e.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Synergy audit — per-herb pairs
  const synergyMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    const names = selectedHerbs.map((h) => h.name.toLowerCase());
    selectedHerbs.forEach((h) => {
      const pairs: string[] = [];
      (h.herb_to_herb_synergy ?? []).forEach((s) => {
        const lower = s.toLowerCase();
        selectedHerbs.forEach((other) => {
          if (other.id !== h.id && lower.includes(other.name.toLowerCase())) {
            pairs.push(other.name);
          }
        });
      });
      // also check herb_interactions field
      (h.herb_interactions ?? []).forEach((s) => {
        if (s.toLowerCase().includes("synergy:")) {
          s.replace(/synergy:/i, "").split(",").forEach((p) => {
            const pt = p.trim();
            if (names.includes(pt.toLowerCase()) && pt.toLowerCase() !== h.name.toLowerCase()) {
              if (!pairs.includes(pt)) pairs.push(pt);
            }
          });
        }
      });
      map[h.id] = [...new Set(pairs)];
    });
    return map;
  }, [selectedHerbs]);

  const cautionFlags = useMemo(() => {
    const flags: Record<string, string[]> = {};
    selectedHerbs.forEach((h) => {
      const cautions: string[] = [];
      (h.herb_to_herb_caution ?? []).forEach((s) => {
        selectedHerbs.forEach((other) => {
          if (other.id !== h.id && s.toLowerCase().includes(other.name.toLowerCase())) {
            cautions.push(other.name);
          }
        });
      });
      flags[h.id] = [...new Set(cautions)];
    });
    return flags;
  }, [selectedHerbs]);

  const toggleHerb = (herb: Herb) => {
    const exists = selectedHerbs.find((h) => h.id === herb.id);
    if (exists) {
      setSelectedHerbs(selectedHerbs.filter((h) => h.id !== herb.id));
    } else if (selectedHerbs.length < 12) {
      setSelectedHerbs([...selectedHerbs, herb]);
    }
  };

  // ─── RESULTS VIEW ────────────────────────────────────────────────────────
  if (showResults) {
    return (
      <div
        className="min-h-screen text-slate-200 p-6 sm:p-10"
        style={{ background: "radial-gradient(circle at top, #1d2623 0, #050606 55%)", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Back */}
          <button
            onClick={() => setShowResults(false)}
            className="flex items-center gap-2 mb-10 text-[11px] uppercase tracking-[0.25em] transition-colors"
            style={{ color: "#7bd4a1" }}
          >
            <ArrowLeft size={14} /> Return to Materia Medica
          </button>

          {/* Header */}
          <header className="mb-12 text-center">
            <img src={FungaiArtLogo} alt="Fungai Art" className="w-14 h-14 mx-auto mb-5 object-contain" />
            <h1
              className="text-5xl sm:text-6xl mb-3 text-white"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, letterSpacing: "0.04em" }}
            >
              Formula Synthesis
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em]" style={{ color: "#7bd4a1" }}>
              {selectedHerbs.length} constituents · Clinical matrix active
            </p>
          </header>

          {/* Per-herb cards */}
          <div className="space-y-5">
            {selectedHerbs.map((h) => {
              const synergies = synergyMap[h.id] ?? [];
              const cautions  = cautionFlags[h.id] ?? [];
              return (
                <div
                  key={h.id}
                  className="rounded-2xl border overflow-hidden"
                  style={{ background: "#0d1410", borderColor: "rgba(255,255,255,0.08)" }}
                >
                  {/* Card header */}
                  <div className="px-6 py-4 flex items-start justify-between gap-4" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
                    <div>
                      <h3
                        className="text-xl text-white mb-0.5"
                        style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
                      >
                        {h.name}
                      </h3>
                      <p className="text-[11px] italic" style={{ color: "#7a766c" }}>{h.botanical}</p>
                    </div>
                    <span className={cn("text-[10px] px-2.5 py-1 rounded-full border whitespace-nowrap mt-1", CAUTION_COLOR[h.caution_level])}>
                      {h.caution_level}
                    </span>
                  </div>

                  <div className="px-6 py-4 grid sm:grid-cols-2 gap-5">
                    {/* Primary functions */}
                    <div>
                      <div className="text-[9px] uppercase tracking-[0.15em] mb-2" style={{ color: "#7bd4a1" }}>Primary actions</div>
                      <ul className="space-y-1.5">
                        {h.primary_functions.slice(0, 4).map((fn, i) => (
                          <li key={i} className="text-[11px] leading-snug flex gap-2" style={{ color: "#b9b3a6" }}>
                            <span style={{ color: "#7bd4a1", marginTop: 2 }}>·</span>
                            <span>{fn}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-4">
                      {/* Energetics */}
                      <div>
                        <div className="text-[9px] uppercase tracking-[0.15em] mb-2" style={{ color: "#7bd4a1" }}>Energetics</div>
                        <div className="flex flex-wrap gap-1.5">
                          {h.energetics.map((e) => (
                            <span key={e} className="text-[10px] px-2 py-0.5 rounded-full border" style={{ borderColor: "rgba(123,212,161,0.2)", color: "#7bd4a1", background: "rgba(123,212,161,0.06)" }}>
                              {e}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Meridians */}
                      <div>
                        <div className="text-[9px] uppercase tracking-[0.15em] mb-2" style={{ color: "#7a766c" }}>TCM meridians</div>
                        <div className="text-[11px]" style={{ color: "#b9b3a6" }}>{h.tcm_meridians.join(" · ")}</div>
                      </div>

                      {/* Dosage */}
                      {h.dosage_range && (
                        <div>
                          <div className="text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: "#7a766c" }}>Dosage</div>
                          <div className="text-[11px]" style={{ color: "#b9b3a6" }}>{h.dosage_range}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Spiritual layer */}
                  {h.spiritual_layer && (
                    <div className="px-6 pb-4">
                      <div className="text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: "#7a766c" }}>Spiritual dimension</div>
                      <p className="text-[11px] italic leading-relaxed" style={{ color: "#7a766c" }}>{h.spiritual_layer}</p>
                    </div>
                  )}

                  {/* Synergy / caution row */}
                  {(synergies.length > 0 || cautions.length > 0) && (
                    <div className="px-6 py-3 flex flex-wrap gap-3" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
                      {synergies.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] uppercase tracking-[0.12em]" style={{ color: "#7bd4a1" }}>Synergy with</span>
                          {synergies.map((s) => (
                            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(123,212,161,0.12)", color: "#7bd4a1", border: "0.5px solid rgba(123,212,161,0.3)" }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      {cautions.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] uppercase tracking-[0.12em] text-orange-400">Caution with</span>
                          {cautions.map((c) => (
                            <span key={c} className="text-[10px] px-2 py-0.5 rounded-full text-orange-300" style={{ background: "rgba(251,146,60,0.1)", border: "0.5px solid rgba(251,146,60,0.3)" }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setShowResults(false)}
              className="text-[11px] uppercase tracking-[0.25em] px-6 py-3 rounded-full border transition-colors"
              style={{ borderColor: "rgba(123,212,161,0.3)", color: "#7bd4a1" }}
            >
              ← Adjust selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN VIEW ───────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col lg:flex-row h-screen overflow-hidden"
      style={{ background: "#050607", color: "#f6f3ea", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
    >
      {/* MAIN */}
      <main className="flex-1 flex flex-col overflow-hidden" style={{ padding: "1.25rem 1.25rem 1.25rem 1.5rem" }}>

        {/* HEADER */}
        <header className="mb-5 pb-5" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between gap-4 mb-4">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ border: "0.5px solid rgba(255,255,255,0.25)", background: "radial-gradient(circle at top, #2a3d35, #050607)" }}>
                <img src={FungaiArtLogo} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(16px, 2vw, 22px)", letterSpacing: "0.15em", color: "#f9fafb", lineHeight: 1.1 }}>
                  Fungai Art Elixirs
                </div>
                <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#7a766c", marginTop: 2 }}>
                  Materia Medica · {HERBS.length} plants
                </div>
              </div>
            </div>

            {/* Nav links + mobile toggle */}
            <div className="flex items-center gap-3">
              <a href="/herbal-engine.html" target="_blank" rel="noreferrer"
                className="hidden sm:block text-[10px] uppercase tracking-[0.22em] transition-colors"
                style={{ color: "rgba(123,212,161,0.6)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#7bd4a1")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(123,212,161,0.6)")}>
                Engine 1.0 →
              </a>
              <a href="/herbal-engine-2/" target="_blank" rel="noreferrer"
                className="hidden sm:block text-[10px] uppercase tracking-[0.22em] transition-colors"
                style={{ color: "#7bd4a1" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#a8e6c8")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#7bd4a1")}>
                Engine 2.0 →
              </a>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2.5 rounded-xl transition-colors"
                style={{ background: "#101412", border: "0.5px solid rgba(255,255,255,0.1)" }}
              >
                <Menu size={18} style={{ color: "#f6f3ea" }} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#7a766c" }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, botanical, energetics, function…"
              className="w-full rounded-xl py-3 pl-11 pr-10 text-sm outline-none transition-colors"
              style={{
                background: "#101412",
                border: "0.5px solid rgba(255,255,255,0.1)",
                color: "#f6f3ea",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(123,212,161,0.4)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
            />
            {searchQuery && (
              <X size={14} onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
                style={{ color: "#7a766c" }} />
            )}
          </div>
          {searchQuery && (
            <p className="text-[10px] mt-2" style={{ color: "#7a766c" }}>
              {filteredHerbs.length} result{filteredHerbs.length !== 1 ? "s" : ""} for "{searchQuery}"
            </p>
          )}
        </header>

        {/* HERB GRID */}
        <div className="flex-1 overflow-y-auto pr-2 pb-8" style={{ scrollbarWidth: "thin", scrollbarColor: "#1e2b24 transparent" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredHerbs.map((h) => {
              const selected = selectedHerbs.some((sh) => sh.id === h.id);
              return (
                <div
                  key={h.id}
                  onClick={() => toggleHerb(h)}
                  className="rounded-2xl cursor-pointer transition-all duration-200 relative overflow-hidden"
                  style={{
                    background: selected ? "radial-gradient(circle at top left, #16382a, #0a0f0c)" : "#0d1410",
                    border: selected ? "0.5px solid rgba(123,212,161,0.5)" : "0.5px solid rgba(255,255,255,0.07)",
                    boxShadow: selected ? "0 0 0 1px rgba(123,212,161,0.15)" : "none",
                    padding: "14px 16px 12px",
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) e.currentTarget.style.borderColor = "rgba(123,212,161,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  }}
                >
                  {/* Selected dot */}
                  {selected && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full" style={{ background: "#7bd4a1" }} />
                  )}

                  {/* Name */}
                  <h3 className="text-white mb-0.5 leading-tight"
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600 }}>
                    {h.name}
                  </h3>

                  {/* Botanical */}
                  <p className="text-[10px] italic mb-3" style={{ color: "#7a766c" }}>{h.botanical}</p>

                  {/* Primary function snippet */}
                  {h.primary_functions[0] && (
                    <p className="text-[11px] leading-snug mb-3" style={{ color: "#b9b3a6" }}>
                      {shortFunction(h.primary_functions[0])}
                    </p>
                  )}

                  {/* Energetics tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {h.energetics.slice(0, 3).map((e) => (
                      <span key={e} className="text-[9px] px-1.5 py-0.5 rounded-full"
                        style={{ background: "rgba(123,212,161,0.07)", color: "rgba(123,212,161,0.7)", border: "0.5px solid rgba(123,212,161,0.15)" }}>
                        {e}
                      </span>
                    ))}
                  </div>

                  {/* Footer row */}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-[0.12em]" style={{ color: "#3d4a43" }}>
                      {h.tcm_element}
                    </span>
                    <span className={cn("text-[9px] px-2 py-0.5 rounded-full border", CAUTION_COLOR[h.caution_level])}>
                      {h.caution_level}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* SIDEBAR */}
      <aside
        className={cn(
          "flex flex-col flex-shrink-0 transition-transform duration-300",
          "fixed inset-y-0 right-0 z-50 w-[300px] sm:w-[340px]",
          "lg:relative lg:translate-x-0 lg:w-[300px]",
          isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
        style={{ background: "#0a0f0c", borderLeft: "0.5px solid rgba(255,255,255,0.07)", padding: "1.25rem 1rem" }}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[9px] uppercase tracking-[0.2em] mb-0.5" style={{ color: "#7a766c" }}>Selection Matrix</div>
            <div className="text-[11px]" style={{ color: selectedHerbs.length > 0 ? "#7bd4a1" : "#3d4a43" }}>
              {selectedHerbs.length === 0 ? "No herbs selected" : `${selectedHerbs.length} herb${selectedHerbs.length > 1 ? "s" : ""} selected`}
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1.5" style={{ color: "#7a766c" }}>
            <X size={16} />
          </button>
        </div>

        {/* Empty state */}
        {selectedHerbs.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
              style={{ background: "rgba(123,212,161,0.06)", border: "0.5px solid rgba(123,212,161,0.15)" }}>
              <Leaf size={20} style={{ color: "rgba(123,212,161,0.4)" }} />
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: "#7a766c" }}>
              Tap any plant in the grid to add it to your formula. Select 2–12 herbs to run a synergy analysis.
            </p>
            <div className="text-[10px] uppercase tracking-[0.15em] mt-2" style={{ color: "#3d4a43" }}>
              {HERBS.length} plants available
            </div>
          </div>
        )}

        {/* Selected list */}
        {selectedHerbs.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-2 mb-4" style={{ scrollbarWidth: "thin", scrollbarColor: "#1e2b24 transparent" }}>
            {selectedHerbs.map((h) => {
              const synergies = synergyMap[h.id] ?? [];
              const cautions  = cautionFlags[h.id] ?? [];
              return (
                <div
                  key={h.id}
                  className="rounded-xl px-3 py-2.5 flex items-start justify-between gap-2 group"
                  style={{ background: "#101412", border: "0.5px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-white truncate">{h.name}</div>
                    <div className="text-[9px] uppercase tracking-[0.1em] mt-0.5" style={{ color: "#7a766c" }}>{h.tcm_element}</div>
                    {synergies.length > 0 && (
                      <div className="text-[9px] mt-1" style={{ color: "#7bd4a1" }}>
                        ⟳ {synergies.join(", ")}
                      </div>
                    )}
                    {cautions.length > 0 && (
                      <div className="text-[9px] mt-0.5 text-orange-400">
                        ⚠ {cautions.join(", ")}
                      </div>
                    )}
                  </div>
                  <X size={13} onClick={() => toggleHerb(h)}
                    className="cursor-pointer flex-shrink-0 mt-0.5 transition-colors"
                    style={{ color: "#3d4a43" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#f97373")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#3d4a43")}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile search */}
        <div className="relative mb-3 lg:hidden">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#7a766c" }} />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-lg py-2 pl-9 pr-8 text-xs outline-none"
            style={{ background: "#101412", border: "0.5px solid rgba(255,255,255,0.08)", color: "#f6f3ea" }} />
          {searchQuery && <X size={12} onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: "#7a766c" }} />}
        </div>

        {/* Analyze button */}
        <button
          onClick={() => setShowResults(true)}
          disabled={selectedHerbs.length < 2}
          className="w-full py-4 rounded-xl text-[11px] uppercase tracking-[0.2em] font-semibold transition-all duration-200"
          style={selectedHerbs.length >= 2
            ? { background: "#16382a", color: "#7bd4a1", border: "0.5px solid rgba(123,212,161,0.4)", cursor: "pointer" }
            : { background: "#0d1410", color: "#3d4a43", border: "0.5px solid rgba(255,255,255,0.05)", cursor: "not-allowed" }
          }
          onMouseEnter={(e) => { if (selectedHerbs.length >= 2) e.currentTarget.style.background = "#1e4a38"; }}
          onMouseLeave={(e) => { if (selectedHerbs.length >= 2) e.currentTarget.style.background = "#16382a"; }}
        >
          {selectedHerbs.length < 2
            ? `Select ${2 - selectedHerbs.length} more to analyse`
            : `Analyse ${selectedHerbs.length} herb${selectedHerbs.length > 1 ? "s" : ""} →`}
        </button>
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.6)" }} />
      )}
    </div>
  );
}
