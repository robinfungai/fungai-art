import { useState, useMemo } from 'react';
import { Search, X, Leaf, Sparkles, ArrowLeft, AlertTriangle, Zap, Beaker } from 'lucide-react';
import { HERBS, type Herb } from './data/herbs'; 
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHerbs, setSelectedHerbs] = useState<Herb[]>([]);
  const [showResults, setShowResults] = useState(false);

  // 1. SMART SEARCH (Fuzzy & Case-Insensitive)
  const filteredHerbs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return HERBS;
    return HERBS.filter(h => 
      h.name.toLowerCase().includes(q) || 
      h.botanical.toLowerCase().includes(q) ||
      h.tcm_element.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // 2. THE ALCHEMICAL NAMING ENGINE
  const formulaName = useMemo(() => {
    if (selectedHerbs.length === 0) return "The Unformed Vessel";
    const elements = selectedHerbs.map(h => h.tcm_element);
    const primary = elements.sort((a,b) => elements.filter(v=>v===a).length - elements.filter(v=>v===b).length).pop();
    const prefix = selectedHerbs.length > 4 ? "Great" : "Focused";
    return `${prefix} ${primary} Resonance`;
  }, [selectedHerbs]);

  // 3. CLINICAL SAFETY AUDIT
  const audit = useMemo(() => {
    const alerts: string[] = [];
    const synergies: string[] = [];
    const names = selectedHerbs.map(h => h.name);

    selectedHerbs.forEach(h => {
      h.herb_to_herb_caution?.forEach(c => {
        if (names.includes(c)) alerts.push(`Caution: ${h.name} + ${c} (Energetic Conflict)`);
      });
      h.herb_to_herb_synergy?.forEach(s => {
        if (names.includes(s)) synergies.push(`Resonance: ${h.name} + ${s} (Potentiated)`);
      });
    });
    return { alerts: [...new Set(alerts)], synergies: [...new Set(synergies)] };
  }, [selectedHerbs]);

  const toggleHerb = (herb: Herb) => {
    if (selectedHerbs.find(h => h.id === herb.id)) {
      setSelectedHerbs(selectedHerbs.filter(h => h.id !== herb.id));
    } else {
      setSelectedHerbs([...selectedHerbs, herb]);
    }
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-300 p-6 md:p-12 animate-in fade-in duration-500 font-serif">
        <button onClick={() => setShowResults(false)} className="flex items-center gap-2 text-amber-500 mb-10 uppercase tracking-widest text-xs font-bold font-sans">
          <ArrowLeft size={16} /> Back to Library
        </button>

        <div className="max-w-4xl mx-auto space-y-12">
          <header className="text-center">
            <h2 className="text-amber-500 font-sans uppercase tracking-[0.4em] text-xs mb-2">Synthesized Protocol</h2>
            <h1 className="text-5xl md:text-6xl text-white font-bold italic">{formulaName}</h1>
          </header>

          {/* Pharmacological Synergy & Warning Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-3xl">
              <h3 className="text-emerald-400 font-sans font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap size={14} /> Therapeutic Synergy
              </h3>
              <ul className="space-y-2 text-sm italic">
                {audit.synergies.length > 0 ? audit.synergies.map((s, i) => <li key={i}>{s}</li>) : <li className="opacity-50">No direct herb-to-herb potentiations identified.</li>}
              </ul>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-3xl">
              <h3 className="text-red-400 font-sans font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle size={14} /> Clinical Warnings
              </h3>
              <ul className="space-y-2 text-sm italic">
                {audit.alerts.length > 0 ? audit.alerts.map((a, i) => <li key={i}>{a}</li>) : <li className="opacity-50">No immediate pharmacological conflicts detected.</li>}
              </ul>
            </div>
          </div>

          {/* Full Integrated Profiles */}
          <div className="space-y-6">
            {selectedHerbs.map(herb => (
              <div key={herb.id} className="bg-[#0f172a] border border-slate-800 p-8 rounded-3xl group hover:border-amber-500/30 transition-all">
                <div className="flex justify-between items-baseline mb-6">
                  <h3 className="text-2xl text-white font-bold">{herb.name}</h3>
                  <span className="text-amber-500/50 font-mono text-[10px] uppercase tracking-widest">{herb.botanical}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                  <div className="space-y-4">
                    <p><strong className="text-slate-500 uppercase text-[10px] block mb-1">Pharmacology</strong> {herb.pharmacology}</p>
                    <p><strong className="text-slate-500 uppercase text-[10px] block mb-1">Spirit</strong> {herb.spiritual_layer}</p>
                  </div>
                  <div className="space-y-4">
                    <p><strong className="text-slate-500 uppercase text-[10px] block mb-1">TCM Mapping</strong> {herb.tcm_meridians.join(", ")} ({herb.tcm_element})</p>
                    <p><strong className="text-slate-500 uppercase text-[10px] block mb-1">Flavor Profile</strong> {herb.flavor_profile}</p>
                  </div>
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
      <main className="flex-1 flex flex-col p-8 bg-[#020617]">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-8">
            <Beaker className="text-amber-500" />
            <h1 className="text-xl font-bold text-white tracking-widest uppercase">Materia Medica Core</h1>
          </div>
          <div className="relative max-w-2xl group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, botanical, or TCM element..." 
              className="w-full bg-[#0f172a] border border-slate-800 rounded-2xl py-5 pl-14 pr-14 focus:outline-none focus:border-amber-500/50 transition-all text-white"
            />
            {searchQuery && <X onClick={() => setSearchQuery("")} className="absolute right-5 top-1/2 -translate-y-1/2 cursor-pointer hover:text-white text-slate-500" size={18}/>}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-24 custom-scrollbar">
          {filteredHerbs.map(h => (
            <div 
              key={h.id} 
              onClick={() => toggleHerb(h)}
              className={cn(
                "p-6 rounded-3xl border-2 transition-all cursor-pointer",
                selectedHerbs.some(sh => sh.id === h.id) ? "border-amber-500 bg-amber-500/10" : "border-slate-800 bg-[#0f172a] hover:border-slate-700"
              )}
            >
              <h3 className="text-white font-bold text-lg">{h.name}</h3>
              <p className="text-[10px] text-amber-500/50 uppercase tracking-widest font-bold">{h.botanical}</p>
            </div>
          ))}
        </div>
      </main>

      <aside className="w-[380px] bg-[#0f172a] border-l border-slate-800 p-8 flex flex-col shadow-2xl">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 mb-8">Clinical Selection</h2>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {selectedHerbs.map(h => (
            <div key={h.id} className="flex justify-between items-center p-4 bg-[#020617] rounded-2xl border border-white/5 animate-in slide-in-from-right-4">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">{h.name}</span>
                <span className="text-[9px] text-slate-500 uppercase">{h.tcm_element}</span>
              </div>
              <X size={14} className="cursor-pointer text-slate-600 hover:text-red-400" onClick={() => toggleHerb(h)}/>
            </div>
          ))}
          {selectedHerbs.length === 0 && <div className="mt-20 text-center opacity-20 italic text-sm">Select herbs to begin synthesis</div>}
        </div>
        <button 
          onClick={() => setShowResults(true)}
          disabled={selectedHerbs.length < 2}
          className="mt-8 w-full py-6 rounded-3xl bg-amber-500 text-black font-bold uppercase tracking-widest hover:bg-amber-400 transition-all disabled:opacity-10 shadow-lg shadow-amber-500/10"
        >
          Generate Protocol ({selectedHerbs.length})
        </button>
      </aside>
    </div>
  );
}

export default App;