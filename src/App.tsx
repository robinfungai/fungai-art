import { useState, useMemo } from 'react';
import { Search, Plus, X, Leaf, Sparkles, ArrowLeft, AlertTriangle, Zap } from 'lucide-react';
import { HERBS, type Herb } from './data/herbs'; 

function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHerbs, setSelectedHerbs] = useState<Herb[]>([]);
  const [showResults, setShowResults] = useState(false);

  // 1. SMART SEARCH ENGINE
  const filteredHerbs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return q ? HERBS.filter(h => h.name.toLowerCase().includes(q) || h.botanical.toLowerCase().includes(q)) : HERBS;
  }, [searchQuery]);

  // 2. DYNAMIC NAMING ENGINE
  const generateFormulaName = () => {
    if (selectedHerbs.length === 0) return "Empty Vessel";
    const elements = selectedHerbs.map(h => h.tcm_element);
    const primaryElement = elements.sort((a,b) => elements.filter(v => v===a).length - elements.filter(v => v===b).length).pop();
    const adjectives = ["Obsidian", "Golden", "Emerald", "Celestial", "Primal", "Lunar"];
    const nouns = ["Matrix", "Ascension", "Resonance", "Catalyst", "Elixir"];
    return `${adjectives[selectedHerbs.length % adjectives.length]} ${primaryElement} ${nouns[selectedHerbs.length % nouns.length]}`;
  };

  // 3. CROSS-REFERENCE AUDITOR (Pharmacology Check)
  const runSafetyAudit = () => {
    const warnings: string[] = [];
    const synergies: string[] = [];
    
    selectedHerbs.forEach(h => {
      // Check for specific contraindications in the selection
      selectedHerbs.forEach(other => {
        if (h.herb_to_herb_caution?.includes(other.name)) {
          warnings.push(`Caution: Combining ${h.name} and ${other.name} may lead to energetic over-saturation.`);
        }
        if (h.herb_to_herb_synergy?.includes(other.name)) {
          synergies.push(`Resonance: ${h.name} + ${other.name} strengthens the ${h.tcm_element} delivery.`);
        }
      });
    });
    return { warnings: Array.from(new Set(warnings)), synergies: Array.from(new Set(synergies)) };
  };

  const toggleHerb = (herb: Herb) => {
    if (selectedHerbs.find(h => h.id === herb.id)) {
      setSelectedHerbs(selectedHerbs.filter(h => h.id !== herb.id));
    } else {
      setSelectedHerbs([...selectedHerbs, herb]);
    }
  };

  if (showResults) {
    const audit = runSafetyAudit();
    return (
      <div className="min-h-screen bg-[#020617] text-slate-300 p-8 font-serif animate-in fade-in duration-700">
        <button onClick={() => setShowResults(false)} className="flex items-center gap-2 text-amber-500 mb-8 uppercase tracking-widest text-xs font-bold">
          <ArrowLeft size={16} /> Return to Laboratory
        </button>

        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-amber-500 font-sans uppercase tracking-[0.5em] text-sm">Formulation Identified</h2>
            <h1 className="text-6xl text-white font-bold italic">{generateFormulaName()}</h1>
          </div>

          {/* Pharmacological Audit Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-3xl">
              <h3 className="text-emerald-400 font-bold mb-4 flex items-center gap-2"><Zap size={18}/> Synergistic Sparks</h3>
              <ul className="text-sm space-y-2 italic">
                {audit.synergies.length > 0 ? audit.synergies.map((s, i) => <li key={i}>{s}</li>) : <li>No direct metabolic synergies identified.</li>}
              </ul>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-3xl">
              <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2"><AlertTriangle size={18}/> Contraindications</h3>
              <ul className="text-sm space-y-2 italic">
                {audit.warnings.length > 0 ? audit.warnings.map((w, i) => <li key={i}>{w}</li>) : <li>Clear of primary metabolic conflicts.</li>}
              </ul>
            </div>
          </div>

          {/* Deep Profile Translation */}
          <div className="space-y-6">
            {selectedHerbs.map(herb => (
              <div key={herb.id} className="bg-[#0f172a] border border-slate-800 p-8 rounded-3xl">
                <div className="flex justify-between items-baseline mb-4">
                  <h3 className="text-2xl text-white font-bold">{herb.name}</h3>
                  <span className="text-amber-500/50 text-xs uppercase tracking-widest">{herb.botanical}</span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">{herb.pharmacology}</p>
                <div className="pt-4 border-t border-slate-800/50 text-xs italic text-slate-500">
                  Energetic Impact: {herb.energetics.join(" • ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#020617] text-slate-300 font-sans overflow-hidden">
      <main className="flex-1 flex flex-col p-8 overflow-hidden">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-8">
            <Leaf className="text-amber-500" />
            <h1 className="text-xl font-bold text-white tracking-tighter">MATERIA MEDICA CORE</h1>
          </div>
          <div className="relative max-w-xl group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Casual botanical search..." 
              className="w-full bg-[#0f172a] border border-slate-800 rounded-2xl py-4 pl-14 pr-12 focus:outline-none focus:border-amber-500/50 transition-all"
            />
            {searchQuery && <X onClick={() => setSearchQuery("")} className="absolute right-5 top-1/2 -translate-y-1/2 cursor-pointer hover:text-white" size={18}/>}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-20 custom-scrollbar">
          {filteredHerbs.map(h => (
            <div 
              key={h.id} 
              onClick={() => toggleHerb(h)}
              className={cn(
                "p-6 rounded-3xl border-2 transition-all cursor-pointer",
                selectedHerbs.some(sh => sh.id === h.id) ? "border-amber-500 bg-amber-500/5" : "border-slate-800 bg-[#0f172a] hover:border-slate-700"
              )}
            >
              <h3 className="text-white font-bold">{h.name}</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">{h.botanical}</p>
            </div>
          ))}
        </div>
      </main>

      <aside className="w-[350px] bg-[#0f172a] border-l border-slate-800 p-8 flex flex-col">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 mb-8">Active Selection</h2>
        <div className="flex-1 overflow-y-auto space-y-3">
          {selectedHerbs.map(h => (
            <div key={h.id} className="flex justify-between items-center p-4 bg-[#020617] rounded-xl border border-white/5">
              <span className="text-sm font-bold">{h.name}</span>
              <X size={14} className="cursor-pointer" onClick={() => toggleHerb(h)}/>
            </div>
          ))}
        </div>
        <button 
          onClick={() => setShowResults(true)}
          disabled={selectedHerbs.length < 2}
          className="mt-8 w-full py-5 rounded-2xl bg-amber-500 text-black font-bold uppercase tracking-widest disabled:opacity-20"
        >
          Generate Protocol ({selectedHerbs.length})
        </button>
      </aside>
    </div>
  );
}

// Helper for Tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default App;