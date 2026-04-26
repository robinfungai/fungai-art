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

  // 1. SMART SEARCH (Casual & Element-Aware)
  const filteredHerbs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return HERBS;
    return HERBS.filter(h => 
      h.name.toLowerCase().includes(q) || 
      h.botanical.toLowerCase().includes(q) ||
      h.tcm_element.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // 2. CLINICAL ALCHEMY ENGINE (Cross-references your herbs.ts data)
  const synthesis = useMemo(() => {
    const alerts: string[] = [];
    const synergies: string[] = [];
    const selectedNames = selectedHerbs.map(h => h.name);

    selectedHerbs.forEach(h => {
      // Check for synergies defined in your data
      h.herb_to_herb_synergy?.forEach(s => {
        if (selectedNames.includes(s)) synergies.push(`${h.name} + ${s}: Potentiated Therapeutic Field`);
      });
      // Check for cautions defined in your data
      h.herb_to_herb_caution?.forEach(c => {
        if (selectedNames.includes(c)) alerts.push(`Clinical Note: ${h.name} + ${c} (Requires dosage titration)`);
      });
    });

    return { 
      alerts: [...new Set(alerts)], 
      synergies: [...new Set(synergies)],
      formulaName: selectedHerbs.length > 0 ? `The ${selectedHerbs[0].tcm_element} Synthesis` : "Empty Matrix"
    };
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
      <div className="min-h-screen bg-[#020617] text-slate-300 p-8 animate-in fade-in duration-500 font-serif">
        <button onClick={() => setShowResults(false)} className="flex items-center gap-2 text-amber-500 mb-12 uppercase tracking-widest text-xs font-bold font-sans hover:text-white transition-colors">
          <ArrowLeft size={16} /> Re-Enter Laboratory
        </button>

        <div className="max-w-4xl mx-auto space-y-16">
          <header className="text-center space-y-4">
            <h2 className="text-amber-500 font-sans uppercase tracking-[0.5em] text-[10px]">Unique Formulation Identified</h2>
            <h1 className="text-6xl text-white font-bold italic underline decoration-amber-500/10 underline-offset-8">{synthesis.formulaName}</h1>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-3xl">
              <h3 className="text-emerald-400 font-sans font-bold text-xs uppercase tracking-widest mb-6 flex items-center gap-2"><Zap size={14} /> Therapeutic Synergy</h3>
              <ul className="space-y-3 text-sm italic leading-relaxed">
                {synthesis.synergies.length > 0 ? synthesis.synergies.map((s, i) => <li key={i}>{s}</li>) : <li className="opacity-40">Molecular synergy within normal parameters.</li>}
              </ul>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-3xl">
              <h3 className="text-red-400 font-sans font-bold text-xs uppercase tracking-widest mb-6 flex items-center gap-2"><AlertTriangle size={14} /> Clinical Oversight</h3>
              <ul className="space-y-3 text-sm italic leading-relaxed">
                {synthesis.alerts.length > 0 ? synthesis.alerts.map((a, i) => <li key={i}>{a}</li>) : <li className="opacity-40">No immediate contraindications detected between constituents.</li>}
              </ul>
            </div>
          </div>

          <div className="space-y-8">
            {selectedHerbs.map(herb => (
              <div key={herb.id} className="bg-[#0f172a] border border-slate-800 p-10 rounded-3xl relative overflow-hidden group hover:border-amber-500/20 transition-all">
                <div className="flex justify-between items-baseline mb-8">
                  <h3 className="text-3xl text-white font-bold">{herb.name}</h3>
                  <span className="text-amber-500/40 font-mono text-[10px] uppercase tracking-[0.3em]">{herb.botanical}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-sm leading-relaxed text-slate-400">
                  <div className="space-y-6">
                    <p><strong className="text-white uppercase text-[10px] block mb-2 tracking-widest">Pharmacology</strong> {herb.pharmacology || herb.primary_functions.join(". ")}</p>
                    <p><strong className="text-white uppercase text-[10px] block mb-2 tracking-widest">Spiritual Resonance</strong> {herb.spiritual_layer}</p>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div><strong className="text-white uppercase text-[10px] block mb-1">Element</strong> {herb.tcm_element}</div>
                      <div><strong className="text-white uppercase text-[10px] block mb-1">Caution</strong> {herb.caution_level}</div>
                    </div>
                    <p><strong className="text-white uppercase text-[10px] block mb-2 tracking-widest">Organ Affinities</strong> {herb.tcm_meridians.join(", ")}</p>
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
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-10">
            <Beaker className="text-amber-500 w-6 h-6" />
            <h1 className="text-xl font-bold text-white tracking-[0.3em] uppercase">Materia Medica Core</h1>
          </div>
          <div className="relative max-w-3xl group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search library casually by name, spirit, or element..." 
              className="w-full bg-[#0f172a] border border-slate-800 rounded-3xl py-6 pl-16 pr-16 focus:outline-none focus:border-amber-500/50 transition-all text-white shadow-2xl"
            />
            {searchQuery && <X onClick={() => setSearchQuery("")} className="absolute right-6 top-1/2 -translate-y-1/2 cursor-pointer hover:text-white text-slate-500 transition-colors" size={22}/>}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pb-24 custom-scrollbar pr-4">
          {filteredHerbs.map(h => (
            <div 
              key={h.id} 
              onClick={() => toggleHerb(h)}
              className={cn(
                "p-8 rounded-[2rem] border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[140px]",
                selectedHerbs.some(sh => sh.id === h.id) ? "border-amber-500 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.05)]" : "border-slate-800 bg-[#0f172a] hover:border-slate-700"
              )}
            >
              <div>
                <h3 className="text-white font-bold text-xl mb-1">{h.name}</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">{h.botanical}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <aside className="w-[420px] bg-[#0f172a] border-l border-slate-800 p-10 flex flex-col shadow-2xl">
        <h2 className="text-xs font-bold uppercase tracking-[0.4em] text-slate-500 mb-10">Matrix Selection</h2>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {selectedHerbs.map(h => (
            <div key={h.id} className="group flex justify-between items-center p-5 bg-[#020617] rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-widest">{h.name}</span>
                <span className="text-[9px] text-amber-500/40 uppercase">{h.tcm_element}</span>
              </div>
              <X size={16} className="cursor-pointer text-slate-600 group-hover:text-red-400 transition-colors" onClick={() => toggleHerb(h)}/>
            </div>
          ))}
          {selectedHerbs.length === 0 && <div className="mt-32 text-center opacity-20 italic text-sm tracking-widest">Laboratory is currently empty</div>}
        </div>
        <button 
          onClick={() => setShowResults(true)}
          disabled={selectedHerbs.length < 2}
          className="mt-10 w-full py-7 rounded-[2rem] bg-amber-500 text-black font-bold uppercase tracking-[0.2em] hover:bg-amber-400 transition-all disabled:opacity-10 shadow-2xl shadow-amber-500/10"
        >
          Generate Synthesis ({selectedHerbs.length})
        </button>
      </aside>
    </div>
  );
}

export default App;