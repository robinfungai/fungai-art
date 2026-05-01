import { useState, useMemo } from "react";
import {
  Search,
  X,
  ArrowLeft,
  Menu
} from "lucide-react";
import { HERBS, type Herb } from "./data/herbs";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- IMPORT YOUR EXISTING LOGO ---
import FungaiArtLogo from "./assets/fungai-art-logo.png";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHerbs, setSelectedHerbs] = useState<Herb[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 1. ADVANCED SEARCH (Checks name, botanical, and TCM element)
  const filteredHerbs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return HERBS;
    return HERBS.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        (h.botanical && h.botanical.toLowerCase().includes(q)) ||
        (h.tcm_element && h.tcm_element.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // 2. CLINICAL SYNERGY AUDIT (not rendered yet, but logic is fine)
  const audit = useMemo(() => {
    const synergies: string[] = [];
    const cautions: string[] = [];
    const names = selectedHerbs.map((h) => h.name);

    selectedHerbs.forEach((h) => {
      h.herb_interactions?.forEach((interaction) => {
        const line = interaction.toLowerCase();
        if (line.includes("synergy:")) {
          const partners = interaction
            .replace(/synergy:/i, "")
            .split(",")
            .map((s) => s.trim());
          partners.forEach((p) => {
            if (names.some((n) => n.toLowerCase() === p.toLowerCase())) {
              synergies.push(`${h.name} + ${p}: Potentiated Resonance`);
            }
          });
        }
        if (line.includes("caution:")) {
          cautions.push(
            `${h.name}: ${interaction.replace(/caution:/i, "").trim()}`
          );
        }
      });
    });

    return {
      synergies: [...new Set(synergies)],
      cautions: [...new Set(cautions)]
    };
  }, [selectedHerbs]);

  const toggleHerb = (herb: Herb) => {
    const exists = selectedHerbs.find((h) => h.id === herb.id);
    if (exists) {
      setSelectedHerbs(selectedHerbs.filter((h) => h.id !== herb.id));
    } else if (selectedHerbs.length < 12) {
      setSelectedHerbs([...selectedHerbs, herb]);
    }
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-300 p-8 font-serif animate-in fade-in duration-700">
        <button
          onClick={() => setShowResults(false)}
          className="flex items-center gap-2 text-amber-500 mb-12 uppercase tracking-widest text-xs font-bold font-sans"
        >
          <ArrowLeft size={16} /> Return to Materia Medica
        </button>
        <header className="text-center">
          <img
            src={FungaiArtLogo}
            alt="Fungai Art"
            className="w-16 h-16 mx-auto mb-6 object-contain"
          />
          <h1 className="text-6xl text-white font-bold italic mb-4">
            Formula Synthesis
          </h1>
          <p className="text-amber-500 font-sans uppercase tracking-[0.4em] text-[10px]">
            Clinical Matrix Active
          </p>
        </header>
        <div className="max-w-4xl mx-auto space-y-6 mt-16">
          {selectedHerbs.map((h) => (
            <div
              key={h.id}
              className="bg-[#0f172a] border border-slate-800 p-8 rounded-[2.5rem]"
            >
              <h3 className="text-2xl text-white font-bold mb-1">{h.name}</h3>
              <p className="text-sm text-slate-400 italic mb-4">
                {h.botanical}
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                {h.pharmacology}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#020617] text-slate-300 font-sans overflow-hidden">
      {/* --- MAIN AREA --- */}
      <main className="flex-1 flex flex-col p-6 sm:p-8 lg:p-10 bg-[#020617] overflow-hidden">
        {/* HEADER */}
        <header className="mb-10 border-b border-slate-800/50 pb-6 space-y-4">
          {/* Brand row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={FungaiArtLogo}
                alt="Fungai Art Logo"
                className="w-10 h-10 md:w-12 md:h-12 object-contain"
              />
              <div>
                <div
                  className="text-amber-400 tracking-[0.18em] leading-tight"
                  style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: "clamp(11px, 1.8vw, 16px)" }}
                >
                  Fungai Art Elixirs
                </div>
                <div className="text-[10px] uppercase tracking-[0.35em] text-slate-500 mt-0.5">
                  Materia Medica
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/herbal-engine.html"
                className="text-[10px] uppercase tracking-[0.25em] text-amber-500/70 hover:text-amber-400 whitespace-nowrap transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                Engine 1.0 →
              </a>
              <a
                href="/herbal-engine-2/"
                className="text-[10px] uppercase tracking-[0.25em] text-amber-400 hover:text-amber-300 whitespace-nowrap transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                Engine 2.0 →
              </a>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-3 bg-[#0f172a] rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <Menu className="text-white" size={20} />
              </button>
            </div>
          </div>

          {/* Search row */}
          <div className="relative w-full hidden md:block">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, botanical, or TCM element…"
              className="w-full bg-[#0f172a] border border-slate-800 rounded-2xl py-3 pl-12 pr-12 focus:outline-none focus:border-amber-500/40 text-white text-sm"
            />
            {searchQuery && (
              <X
                onClick={() => setSearchQuery("")}
                className="absolute right-5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500 hover:text-white"
                size={16}
              />
            )}
          </div>
        </header>

        {/* HERB GRID */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pb-24 custom-scrollbar pr-4">
          {filteredHerbs.map((h) => (
            <div
              key={h.id}
              onClick={() => toggleHerb(h)}
              className={cn(
                "p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer relative duration-300",
                selectedHerbs.some((sh) => sh.id === h.id)
                  ? "border-amber-500 bg-amber-500/5 shadow-2xl"
                  : "border-slate-800 bg-[#0f172a] hover:border-slate-700"
              )}
            >
              <h3 className="text-white font-bold text-2xl mb-1">{h.name}</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                {h.botanical}
              </p>
              <div className="absolute bottom-4 right-8 text-[8px] text-amber-500/20 uppercase tracking-[0.3em] font-bold">
                {h.tcm_element}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* --- SIDEBAR --- */}
      <aside
        className={cn(
          "bg-[#0f172a] border-l border-slate-800 p-10 flex flex-col shadow-2xl transition-transform duration-300",
          "fixed inset-y-0 right-0 w-[320px] sm:w-[400px] lg:relative lg:translate-x-0 z-50",
          isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-xs font-bold uppercase tracking-[0.4em] text-slate-500 italic">
            Selection Matrix
          </h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-600 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
          {selectedHerbs.map((h) => (
            <div
              key={h.id}
              className="group flex justify-between items-center p-5 bg-[#020617] rounded-2xl border border-white/5 animate-in slide-in-from-right-4"
            >
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-widest">
                  {h.name}
                </span>
                <span className="text-[9px] text-amber-500/40 uppercase">
                  {h.tcm_element}
                </span>
              </div>
              <X
                size={16}
                className="cursor-pointer text-slate-600 group-hover:text-red-400"
                onClick={() => toggleHerb(h)}
              />
            </div>
          ))}
          {selectedHerbs.length === 0 && (
            <div className="mt-32 text-center opacity-20 italic text-sm tracking-widest uppercase">
              Awaiting Selection
            </div>
          )}
        </div>

        {/* MOBILE SEARCH IN SIDEBAR */}
        <div className="relative w-full mt-8 block md:hidden mb-4">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
            size={16}
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Casual query..."
            className="w-full bg-[#020617] border border-slate-800 rounded-xl py-3 pl-10 pr-10 text-white text-xs"
          />
          {searchQuery && (
            <X
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500 hover:text-white"
              size={16}
            />
          )}
        </div>

        <button
          onClick={() => setShowResults(true)}
          disabled={selectedHerbs.length < 2}
          className="mt-6 w-full py-7 rounded-[2rem] bg-amber-500 text-black font-bold uppercase tracking-widest disabled:opacity-10 transition-all active:scale-95 shadow-2xl shadow-amber-500/10"
        >
          {selectedHerbs.length < 2
            ? "Select Constituents"
            : `Analyze Matrix (${selectedHerbs.length})`}
        </button>
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/70 z-40 animate-fade-in"
        />
      )}
    </div>
  );
}