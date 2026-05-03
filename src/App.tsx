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
  LOW:          "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  "LOW-MEDIUM": "text-emerald-300 border-emerald-400/30 bg-emerald-500/8",
  MEDIUM:       "text-yellow-300  border-yellow-400/30  bg-yellow-500/10",
  "MEDIUM-HIGH":"text-orange-300  border-orange-400/30  bg-orange-500/10",
  HIGH:         "text-red-300     border-red-400/30     bg-red-500/10",
  "VERY HIGH":  "text-red-400     border-red-500/40     bg-red-500/15",
};

const CAUTION_SHORT: Record<string, string> = {
  LOW:          "LOW",
  "LOW-MEDIUM": "L-M",
  MEDIUM:       "MED",
  "MEDIUM-HIGH":"M-H",
  HIGH:         "HIGH",
  "VERY HIGH":  "V-H",
};

function shortFunction(fn: string): string {
  const dash = fn.indexOf("—");
  return dash !== -1 ? fn.slice(0, dash).trim() : fn.split(" ").slice(0, 6).join(" ");
}

export default function App() {
  const [searchQuery, setSearchQuery]   = useState("");
  const [selectedHerbs, setSelectedHerbs] = useState<Herb[]>([]);
  const [showResults, setShowResults]   = useState(false);
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

  // per-herb synergy pairs within the current selection
  const synergyMap = useMemo(() => {
    const map: Record<number, string[]> = {};
    selectedHerbs.forEach((h) => {
      const pairs: string[] = [];
      (h.herb_to_herb_synergy ?? []).forEach((s) => {
        selectedHerbs.forEach((other) => {
          if (other.id !== h.id && s.toLowerCase().includes(other.name.toLowerCase()))
            pairs.push(other.name);
        });
      });
      (h.herb_interactions ?? []).forEach((s) => {
        if (s.toLowerCase().includes("synergy:")) {
          s.replace(/synergy:/i, "").split(",").forEach((p) => {
            const pt = p.trim();
            if (
              selectedHerbs.some((o) => o.name.toLowerCase() === pt.toLowerCase()) &&
              pt.toLowerCase() !== h.name.toLowerCase() &&
              !pairs.includes(pt)
            ) pairs.push(pt);
          });
        }
      });
      map[h.id] = [...new Set(pairs)];
    });
    return map;
  }, [selectedHerbs]);

  const cautionFlags = useMemo(() => {
    const flags: Record<number, string[]> = {};
    selectedHerbs.forEach((h) => {
      const cautions: string[] = [];
      (h.herb_to_herb_caution ?? []).forEach((s) => {
        selectedHerbs.forEach((other) => {
          if (other.id !== h.id && s.toLowerCase().includes(other.name.toLowerCase()))
            cautions.push(other.name);
        });
      });
      flags[h.id] = [...new Set(cautions)];
    });
    return flags;
  }, [selectedHerbs]);

  const mixologySummary = useMemo(() => {
    if (selectedHerbs.length < 2) return null;

    // Temperature balance
    const warmCount = selectedHerbs.filter(h =>
      h.energetics.some(e => /^(hot|warm|slightly warm)/i.test(e))
    ).length;
    const coolCount = selectedHerbs.filter(h =>
      h.energetics.some(e => /^(cold|cool|slightly cool)/i.test(e))
    ).length;
    const tempLabel = warmCount > coolCount + 1 ? "Warming"
      : coolCount > warmCount + 1 ? "Cooling"
      : "Balanced";

    // TCM elements
    const elements = [...new Set(
      selectedHerbs.flatMap(h => h.tcm_element.split(/\s*\+\s*/).map(e => e.trim()))
    )].filter(Boolean).slice(0, 5);

    // Synergy pairs (deduplicated)
    const synergyPairs: { a: string; b: string }[] = [];
    const seenSyn = new Set<string>();
    selectedHerbs.forEach(h => {
      (synergyMap[h.id] ?? []).forEach(partner => {
        const key = [h.name, partner].sort().join("|");
        if (!seenSyn.has(key)) { seenSyn.add(key); synergyPairs.push({ a: h.name, b: partner }); }
      });
    });

    // Caution pairs (deduplicated)
    const cautionPairs: { a: string; b: string }[] = [];
    const seenCaut = new Set<string>();
    selectedHerbs.forEach(h => {
      (cautionFlags[h.id] ?? []).forEach(partner => {
        const key = [h.name, partner].sort().join("|");
        if (!seenCaut.has(key)) { seenCaut.add(key); cautionPairs.push({ a: h.name, b: partner }); }
      });
    });

    // Highest caution level
    const cautionOrder = ["LOW","LOW-MEDIUM","MEDIUM","MEDIUM-HIGH","HIGH","VERY HIGH"];
    const maxCaution = selectedHerbs.reduce<Herb["caution_level"]>(
      (max, h) => cautionOrder.indexOf(h.caution_level) > cautionOrder.indexOf(max) ? h.caution_level : max,
      "LOW"
    );

    // Functional themes
    const THEMES: [string, string][] = [
      ["adaptogen","Adaptogenic"], ["nervine","Nervine"], ["hepatic","Hepatoprotective"],
      ["digest","Digestive"], ["immune","Immune"], ["hormon","Hormonal"],
      ["cognitive","Cognitive"], ["anti-inflamm","Anti-inflammatory"],
      ["anxiolytic","Anxiolytic"], ["sleep","Hypnotic"], ["tonic","Tonic"],
    ];
    const themes = THEMES
      .filter(([kw]) => selectedHerbs.some(h => h.primary_functions.some(f => f.toLowerCase().includes(kw))))
      .map(([, label]) => label);

    // Narrative
    const THEME_WORDS: Record<string, string> = {
      Adaptogenic: "HPA axis adaptation and stress resilience",
      Nervine: "nervous system regulation",
      Hepatoprotective: "hepatic clearing and metabolic flow",
      Digestive: "digestive restoration and gut balance",
      Immune: "innate immune training",
      Hormonal: "endocrine modulation",
      Cognitive: "neuroplasticity and cognitive clarity",
      "Anti-inflammatory": "systemic anti-inflammatory action",
      Anxiolytic: "anxiolytic calm without sedation",
      Hypnotic: "sleep restoration and night repair",
      Tonic: "deep tonic nourishment and vital restoration",
    };
    const top2 = themes.slice(0, 2).map(t => THEME_WORDS[t] || t);
    const themeStr = top2.length >= 2 ? `${top2[0]} and ${top2[1]}` : top2[0] || "broad botanical support";
    const narrative = `A ${tempLabel.toLowerCase()} formula of ${selectedHerbs.length} constituents converging on ${themeStr}. ${
      synergyPairs.length > 0
        ? `${synergyPairs.length} synergistic pair${synergyPairs.length !== 1 ? "s" : ""} amplify the combined field.`
        : "Each herb contributes a distinct therapeutic lane."
    }${cautionPairs.length > 0 ? ` ${cautionPairs.length} interaction${cautionPairs.length !== 1 ? "s" : ""} flagged — review before compounding.` : ""}`;

    return { tempLabel, elements, synergyPairs, cautionPairs, maxCaution, themes, narrative };
  }, [selectedHerbs, synergyMap, cautionFlags]);

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
        className="min-h-[100dvh] overflow-x-hidden"
        style={{
          background: "radial-gradient(circle at top, #1d2623 0, #050606 55%)",
          color: "#f6f3ea",
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          padding: "1.5rem 1rem 4rem",
        }}
      >
        <div className="max-w-3xl mx-auto">
          {/* Back */}
          <button
            onClick={() => setShowResults(false)}
            className="flex items-center gap-2 mb-8 text-[11px] uppercase tracking-[0.22em] transition-opacity hover:opacity-70"
            style={{ color: "#7bd4a1" }}
          >
            <ArrowLeft size={13} /> Return to Materia Medica
          </button>

          {/* Page header */}
          <header className="mb-10 text-center px-2">
            <img src={FungaiArtLogo} alt="Fungai Art" className="w-12 h-12 mx-auto mb-4 object-contain" />
            <h1
              className="mb-2 text-white leading-tight"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 500,
                letterSpacing: "0.04em",
                fontSize: "clamp(32px, 8vw, 56px)",
              }}
            >
              Formula Synthesis
            </h1>
            <p className="text-[10px] uppercase tracking-[0.35em]" style={{ color: "#7bd4a1" }}>
              {selectedHerbs.length} constituents · clinical matrix active
            </p>
          </header>

          {/* ── Mixology Summary ── */}
          {mixologySummary && (
            <div
              className="rounded-2xl overflow-hidden mb-8"
              style={{ background: "#0d1410", border: "0.5px solid rgba(123,212,161,0.22)" }}
            >
              {/* Header */}
              <div
                className="px-5 py-4"
                style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)", background: "rgba(123,212,161,0.03)" }}
              >
                <div className="text-[9px] uppercase tracking-[0.25em] mb-1" style={{ color: "#7bd4a1" }}>
                  Synergy Mixology
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: "#fff" }}>
                  Formula Intelligence
                </div>
              </div>

              {/* Narrative */}
              <div className="px-5 py-4" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
                <p className="text-[12px] leading-relaxed" style={{ color: "#b9b3a6" }}>
                  {mixologySummary.narrative}
                </p>
              </div>

              {/* Stats grid */}
              <div
                className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4"
                style={{ borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}
              >
                <div>
                  <div className="text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: "#7a766c" }}>Temperature</div>
                  <div className="text-[13px] font-medium text-white">{mixologySummary.tempLabel}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: "#7a766c" }}>TCM elements</div>
                  <div className="text-[11px] font-medium text-white leading-snug">{mixologySummary.elements.join(" · ")}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: "#7a766c" }}>Synergy pairs</div>
                  <div className="text-[13px] font-medium" style={{ color: "#7bd4a1" }}>{mixologySummary.synergyPairs.length}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: "#7a766c" }}>Max caution</div>
                  <div className={cn("text-[11px] font-medium", CAUTION_COLOR[mixologySummary.maxCaution])}>
                    {mixologySummary.maxCaution}
                  </div>
                </div>
              </div>

              {/* Functional lanes */}
              {mixologySummary.themes.length > 0 && (
                <div className="px-5 py-3" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
                  <div className="text-[9px] uppercase tracking-[0.15em] mb-2" style={{ color: "#7a766c" }}>Functional lanes</div>
                  <div className="flex flex-wrap gap-1.5">
                    {mixologySummary.themes.map((t) => (
                      <span
                        key={t}
                        className="text-[9px] px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(255,255,255,0.04)", color: "#7a766c", border: "0.5px solid rgba(255,255,255,0.1)" }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Synergy pairs */}
              {mixologySummary.synergyPairs.length > 0 && (
                <div
                  className="px-5 py-3"
                  style={{ borderBottom: mixologySummary.cautionPairs.length > 0 ? "0.5px solid rgba(255,255,255,0.05)" : "none" }}
                >
                  <div className="text-[9px] uppercase tracking-[0.15em] mb-2" style={{ color: "#7bd4a1" }}>Detected synergies</div>
                  <div className="flex flex-wrap gap-2">
                    {mixologySummary.synergyPairs.map(({ a, b }, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2.5 py-1 rounded-full"
                        style={{ background: "rgba(123,212,161,0.08)", color: "#7bd4a1", border: "0.5px solid rgba(123,212,161,0.22)" }}
                      >
                        {a} × {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Caution interactions */}
              {mixologySummary.cautionPairs.length > 0 && (
                <div className="px-5 py-3">
                  <div className="text-[9px] uppercase tracking-[0.15em] mb-2 text-orange-400">Caution interactions</div>
                  <div className="flex flex-wrap gap-2">
                    {mixologySummary.cautionPairs.map(({ a, b }, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2.5 py-1 rounded-full text-orange-300"
                        style={{ background: "rgba(251,146,60,0.08)", border: "0.5px solid rgba(251,146,60,0.22)" }}
                      >
                        {a} × {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Per-herb cards */}
          <div className="space-y-4">
            {selectedHerbs.map((h) => {
              const synergies = synergyMap[h.id] ?? [];
              const cautions  = cautionFlags[h.id] ?? [];
              return (
                <div
                  key={h.id}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: "#0d1410", border: "0.5px solid rgba(255,255,255,0.08)" }}
                >
                  {/* Card top */}
                  <div
                    className="px-4 sm:px-6 py-4 flex items-start justify-between gap-3"
                    style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="min-w-0">
                      <h3
                        className="text-white mb-0.5 leading-tight"
                        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 600 }}
                      >
                        {h.name}
                      </h3>
                      <p className="text-[11px] italic truncate" style={{ color: "#7a766c" }}>{h.botanical}</p>
                    </div>
                    <span className={cn("text-[9px] px-2 py-1 rounded-full border whitespace-nowrap flex-shrink-0 mt-0.5", CAUTION_COLOR[h.caution_level])}>
                      {h.caution_level}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="px-4 sm:px-6 py-4 grid sm:grid-cols-2 gap-4">
                    {/* Primary actions */}
                    <div>
                      <div className="text-[9px] uppercase tracking-[0.15em] mb-2" style={{ color: "#7bd4a1" }}>Primary actions</div>
                      <ul className="space-y-1.5">
                        {h.primary_functions.slice(0, 4).map((fn, i) => (
                          <li key={i} className="text-[11px] leading-snug flex gap-2" style={{ color: "#b9b3a6" }}>
                            <span style={{ color: "#7bd4a1", flexShrink: 0, marginTop: 2 }}>·</span>
                            <span>{fn}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      {/* Energetics */}
                      <div>
                        <div className="text-[9px] uppercase tracking-[0.15em] mb-2" style={{ color: "#7bd4a1" }}>Energetics</div>
                        <div className="flex flex-wrap gap-1.5">
                          {h.energetics.map((e) => (
                            <span key={e} className="text-[9px] px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(123,212,161,0.07)", color: "#7bd4a1", border: "0.5px solid rgba(123,212,161,0.2)" }}>
                              {e}
                            </span>
                          ))}
                        </div>
                      </div>
                      {/* Meridians */}
                      <div>
                        <div className="text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: "#7a766c" }}>TCM meridians</div>
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
                    <div className="px-4 sm:px-6 pb-4">
                      <div className="text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: "#7a766c" }}>Spiritual dimension</div>
                      <p className="text-[11px] italic leading-relaxed" style={{ color: "#7a766c" }}>{h.spiritual_layer}</p>
                    </div>
                  )}

                  {/* Synergy / caution */}
                  {(synergies.length > 0 || cautions.length > 0) && (
                    <div
                      className="px-4 sm:px-6 py-3 flex flex-wrap gap-x-4 gap-y-2"
                      style={{ borderTop: "0.5px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.18)" }}
                    >
                      {synergies.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[9px] uppercase tracking-[0.1em]" style={{ color: "#7bd4a1" }}>Synergy:</span>
                          {synergies.map((s) => (
                            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(123,212,161,0.1)", color: "#7bd4a1", border: "0.5px solid rgba(123,212,161,0.25)" }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      {cautions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[9px] uppercase tracking-[0.1em] text-orange-400">Caution:</span>
                          {cautions.map((c) => (
                            <span key={c} className="text-[10px] px-2 py-0.5 rounded-full text-orange-300"
                              style={{ background: "rgba(251,146,60,0.1)", border: "0.5px solid rgba(251,146,60,0.25)" }}>
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
              className="text-[11px] uppercase tracking-[0.22em] px-6 py-3 rounded-full border transition-opacity hover:opacity-70"
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
      className="flex flex-col lg:flex-row h-[100dvh] overflow-hidden"
      style={{ background: "#050607", color: "#f6f3ea", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
    >
      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col overflow-hidden p-4 sm:p-5 lg:p-6">

        {/* HEADER */}
        <header className="mb-4 pb-4 flex-shrink-0" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>

          {/* Brand row */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex-shrink-0 overflow-hidden"
                style={{ border: "0.5px solid rgba(255,255,255,0.2)", background: "radial-gradient(circle at top, #2a3d35, #050607)" }}
              >
                <img src={FungaiArtLogo} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <div
                  className="leading-tight truncate"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "clamp(15px, 4vw, 22px)",
                    letterSpacing: "0.15em",
                    color: "#f9fafb",
                  }}
                >
                  Fungai Art Elixirs
                </div>
                <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7a766c", marginTop: 1 }}>
                  Materia Medica · {HERBS.length} plants
                </div>
              </div>
            </div>

            {/* Nav + menu */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <a
                href="/herbal-engine.html" target="_blank" rel="noreferrer"
                className="hidden sm:block text-[10px] uppercase tracking-[0.2em] whitespace-nowrap transition-opacity hover:opacity-100"
                style={{ color: "rgba(123,212,161,0.55)" }}
              >
                Engine 1.0 →
              </a>
              <a
                href="/herbal-engine-2/" target="_blank" rel="noreferrer"
                className="hidden sm:block text-[10px] uppercase tracking-[0.2em] whitespace-nowrap transition-opacity hover:opacity-80"
                style={{ color: "#7bd4a1" }}
              >
                Engine 2.0 →
              </a>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden flex items-center justify-center rounded-xl transition-colors"
                style={{
                  width: 36, height: 36,
                  background: "#101412",
                  border: "0.5px solid rgba(255,255,255,0.1)",
                }}
              >
                <Menu size={16} style={{ color: "#f6f3ea" }} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#7a766c" }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, botanical, energetics…"
              className="w-full rounded-xl text-sm outline-none transition-all"
              style={{
                background: "#101412",
                border: "0.5px solid rgba(255,255,255,0.1)",
                color: "#f6f3ea",
                padding: "10px 36px 10px 36px",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(123,212,161,0.35)")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
            />
            {searchQuery && (
              <X
                size={13}
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
                style={{ color: "#7a766c" }}
              />
            )}
          </div>
          {searchQuery && (
            <p className="text-[10px] mt-1.5" style={{ color: "#7a766c" }}>
              {filteredHerbs.length} result{filteredHerbs.length !== 1 ? "s" : ""}
            </p>
          )}
        </header>

        {/* HERB GRID — scrolls independently */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#1e2b24 transparent" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredHerbs.map((h) => {
              const selected = selectedHerbs.some((sh) => sh.id === h.id);
              return (
                <div
                  key={h.id}
                  onClick={() => toggleHerb(h)}
                  className="rounded-2xl cursor-pointer transition-all duration-200 relative"
                  style={{
                    background: selected
                      ? "radial-gradient(circle at top left, #16382a, #0a0f0c)"
                      : "#0d1410",
                    border: selected
                      ? "0.5px solid rgba(123,212,161,0.45)"
                      : "0.5px solid rgba(255,255,255,0.07)",
                    padding: "12px 14px 10px",
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) e.currentTarget.style.borderColor = "rgba(123,212,161,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  }}
                >
                  {/* Selected indicator */}
                  {selected && (
                    <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full" style={{ background: "#7bd4a1" }} />
                  )}

                  {/* Name */}
                  <h3
                    className="text-white leading-tight mb-0.5 pr-4"
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontWeight: 600 }}
                  >
                    {h.name}
                  </h3>

                  {/* Botanical */}
                  <p className="text-[10px] italic mb-2.5" style={{ color: "#7a766c" }}>
                    {h.botanical}
                  </p>

                  {/* Primary function snippet */}
                  {h.primary_functions[0] && (
                    <p className="text-[11px] leading-snug mb-2.5" style={{ color: "#b9b3a6" }}>
                      {shortFunction(h.primary_functions[0])}
                    </p>
                  )}

                  {/* Energetics pills */}
                  <div className="flex flex-wrap gap-1 mb-2.5">
                    {h.energetics.slice(0, 3).map((e) => (
                      <span
                        key={e}
                        className="text-[9px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: "rgba(123,212,161,0.07)",
                          color: "rgba(123,212,161,0.65)",
                          border: "0.5px solid rgba(123,212,161,0.15)",
                        }}
                      >
                        {e}
                      </span>
                    ))}
                  </div>

                  {/* Footer: element + caution — use short label to prevent overflow */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] uppercase tracking-[0.1em] truncate" style={{ color: "#3d4a43" }}>
                      {h.tcm_element}
                    </span>
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border flex-shrink-0", CAUTION_COLOR[h.caution_level])}>
                      {CAUTION_SHORT[h.caution_level]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Bottom breathing room */}
          <div className="h-6" />
        </div>
      </main>

      {/* ── SIDEBAR ── */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex flex-col",
          "w-[290px] sm:w-[320px]",
          "lg:relative lg:translate-x-0 lg:w-[290px]",
          "transition-transform duration-300",
          isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
        style={{
          background: "#0a0f0c",
          borderLeft: "0.5px solid rgba(255,255,255,0.07)",
          padding: "1rem",
          // iOS safe area at bottom
          paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <div className="text-[9px] uppercase tracking-[0.2em] mb-0.5" style={{ color: "#7a766c" }}>
              Selection Matrix
            </div>
            <div className="text-[11px]" style={{ color: selectedHerbs.length > 0 ? "#7bd4a1" : "#3d4a43" }}>
              {selectedHerbs.length === 0
                ? "No herbs selected"
                : `${selectedHerbs.length} herb${selectedHerbs.length > 1 ? "s" : ""} selected`}
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden flex items-center justify-center rounded-lg"
            style={{ width: 30, height: 30, color: "#7a766c" }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Engine links — mobile only */}
        <div className="lg:hidden flex gap-2 mb-4 flex-shrink-0">
          <a
            href="/herbal-engine.html"
            target="_blank"
            rel="noreferrer"
            className="flex-1 text-center text-[10px] uppercase tracking-[0.18em] py-2 rounded-lg transition-opacity hover:opacity-70"
            style={{ background: "#101412", border: "0.5px solid rgba(123,212,161,0.2)", color: "rgba(123,212,161,0.6)" }}
          >
            Engine 1.0 →
          </a>
          <a
            href="/herbal-engine-2/"
            target="_blank"
            rel="noreferrer"
            className="flex-1 text-center text-[10px] uppercase tracking-[0.18em] py-2 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: "#101412", border: "0.5px solid rgba(123,212,161,0.35)", color: "#7bd4a1" }}
          >
            Engine 2.0 →
          </a>
        </div>

        {/* Empty state */}
        {selectedHerbs.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-3 gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: "rgba(123,212,161,0.06)", border: "0.5px solid rgba(123,212,161,0.15)" }}
            >
              <Leaf size={18} style={{ color: "rgba(123,212,161,0.4)" }} />
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: "#7a766c" }}>
              Tap any plant in the grid to add it to your formula. Select 2–12 herbs to run a synergy analysis.
            </p>
            <div className="text-[10px] uppercase tracking-[0.15em]" style={{ color: "#3d4a43" }}>
              {HERBS.length} plants available
            </div>
          </div>
        )}

        {/* Selected list */}
        {selectedHerbs.length > 0 && (
          <div
            className="flex-1 overflow-y-auto space-y-2 mb-3"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#1e2b24 transparent" }}
          >
            {selectedHerbs.map((h) => {
              const synergies = synergyMap[h.id] ?? [];
              const cautions  = cautionFlags[h.id] ?? [];
              return (
                <div
                  key={h.id}
                  className="rounded-xl px-3 py-2.5 flex items-start justify-between gap-2"
                  style={{ background: "#101412", border: "0.5px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-white truncate">{h.name}</div>
                    <div className="text-[9px] uppercase tracking-[0.1em] mt-0.5" style={{ color: "#7a766c" }}>
                      {h.tcm_element}
                    </div>
                    {synergies.length > 0 && (
                      <div className="text-[9px] mt-1 truncate" style={{ color: "#7bd4a1" }}>
                        ⟳ {synergies.join(", ")}
                      </div>
                    )}
                    {cautions.length > 0 && (
                      <div className="text-[9px] mt-0.5 truncate text-orange-400">
                        ⚠ {cautions.join(", ")}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => toggleHerb(h)}
                    className="flex-shrink-0 mt-0.5 transition-opacity hover:opacity-70"
                    style={{ color: "#3d4a43" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#f97373")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#3d4a43")}
                  >
                    <X size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile search */}
        <div className="relative mb-3 lg:hidden flex-shrink-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#7a766c" }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-lg text-xs outline-none"
            style={{
              background: "#101412",
              border: "0.5px solid rgba(255,255,255,0.08)",
              color: "#f6f3ea",
              padding: "9px 32px 9px 32px",
            }}
          />
          {searchQuery && (
            <X size={12} onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
              style={{ color: "#7a766c" }}
            />
          )}
        </div>

        {/* Analyse button */}
        <button
          onClick={() => { if (selectedHerbs.length >= 2) setShowResults(true); }}
          disabled={selectedHerbs.length < 2}
          className="w-full rounded-xl text-[11px] uppercase tracking-[0.2em] font-semibold transition-all duration-200 flex-shrink-0"
          style={{
            padding: "14px 12px",
            ...(selectedHerbs.length >= 2
              ? { background: "#16382a", color: "#7bd4a1", border: "0.5px solid rgba(123,212,161,0.35)", cursor: "pointer" }
              : { background: "#0d1410", color: "#3d4a43", border: "0.5px solid rgba(255,255,255,0.05)", cursor: "not-allowed" }
            ),
          }}
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
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.55)" }}
        />
      )}
    </div>
  );
}
