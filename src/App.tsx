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

  // 1. DYNAMIC SEARCH (Includes botanical and elements)
  const filteredHerbs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return HERBS;
    return HERBS.filter(h => 
      h.name.toLowerCase().includes(q) || 
      h.botanical.toLowerCase().includes(q) ||
      h.tcm_element.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // 2. CLINICAL AUDIT ENGINE (Scans your pharmacology data)
  const auditResults = useMemo(() => {
    const alerts: string[] = [];
    const synergies: string[] = [];
    const selectedNames = selectedHerbs.map(h => h.name);

    selectedHerbs.forEach(h => {
      // Logic for Contraindications
      h.herb_to_herb_caution?.forEach(caution => {
        if (selectedNames.includes(caution)) {
          alerts.push(`Caution: ${h.name} + ${caution} (Pharmacological interaction noted)`);
        }
      });
      // Logic for Synergies
      h.herb_to_herb_synergy?.forEach(synergy => {
        if (selectedNames.includes(synergy)) {
          synergies.push(`Resonance: ${h.name} + ${synergy} (Potentiated therapeutic effect)`);
        }
      });
    });

    // Dynamic Naming Logic
    const nameBase = selectedHerbs.length > 0 ? selectedHerbs[0].tcm_element : "Aether";
    const formulaName = `The ${nameBase} Catalyst`;

    return { alerts: [...new Set(alerts)], synergies: [...new Set(synergies)], formulaName };
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
        <button onClick={() => setShowResults(false)} className="flex items-center gap-2 text-amber-500 mb-12 uppercase tracking-widest text-xs font-bold font-sans">
          <ArrowLeft size={16} /> Return to Library
        </button>

        <div className="max-w-4xl mx-auto space-y-12">
          <header className="text-center">
            <h2 className="text-amber-500 font-sans uppercase tracking-[0.4em] text-[10px] mb-2">Clinical Synthesis</h2>
            <h1 className="text-5xl text-white font-bold italic">{auditResults.formulaName}</h1>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-3xl">
              <h3 className="text-emerald-400 font-sans font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><Zap size={14}/> Synergy Audit</h3>
              <ul className="text-sm italic space-y-2">
                {auditResults.synergies.length > 0 ? auditResults.synergies.map((s,i) => <li key={i}>{s}</li>) : <li className="opacity-40">Standard therapeutic stacking.</li>}
              </ul>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-3xl">
              <h3 className="text-red-400 font-sans font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><AlertTriangle size={14}/> Safety Cautions</h3>
              <ul className="text-sm italic space-y-2">
                {auditResults.alerts.length > 0 ? auditResults.alerts.map((a,i) => <li key={i}>{a}</li>) : <li className="opacity-40">No immediate contraindications found.</li>}
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            {selectedHerbs.map(herb => (
              <div key={herb.id} className="bg-[#0f172a] border border-slate-800 p-10 rounded-[2.5rem]">
                <div className="flex justify-between items-baseline mb-6">
                  <h3 className="text-3xl text-white font-bold">{herb.name}</h3>
                  <span className="text-amber-500/50 font-mono text-[10px] tracking-widest uppercase">{herb.botanical}</span>
                </div>
                <p className="text-slate-400 leading-relaxed mb-6 italic">{herb.pharmacology}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/5">
                  <div><span className="block text-[10px] text-slate-500 uppercase font-bold">Element</span> {herb.tcm_element}</div>
                  <div><span className="block text-[10px] text-slate-500 uppercase font-bold">Energetics</span> {herb.energetics[0]}</div>
                  <div className="col-span-2"><span className="block text-[10px] text-slate-500 uppercase font-bold">Spiritual Layer</span> {herb.spiritual_layer}</div>
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
          <div className="flex items-center gap-3 mb-8">
            <Beaker className="text-amber-500" />
            <h1 className="text-xl font-bold text-white tracking-widest uppercase">Materia Medica Core</h1>
          </div>
          <div className="relative max-w-2xl group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Query name, spirit, or element..." 
              className="w-full bg-[#0f172a] border border-slate-800 rounded-3xl py-6 pl-16 pr-16 focus:outline-none focus:border-amber-500/50 transition-all text-white"
            />
            {searchQuery && <X onClick={() => setSearchQuery("")} className="absolute right-6 top-1/2 -translate-y-1/2 cursor-pointer hover:text-white text-slate-500" size={20}/>}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-24 custom-scrollbar pr-4">
          {filteredHerbs.map(h => (
            <div 
              key={h.id} 
              onClick={() => toggleHerb(h)}
              className={cn(
                "p-8 rounded-[2rem] border-2 transition-all duration-300 cursor-pointer",
                selectedHerbs.some(sh => sh.id === h.id) ? "border-amber-500 bg-amber-500/10 shadow-xl" : "border-slate-800 bg-[#0f172a] hover:border-slate-700"
              )}
            >
              <h3 className="text-white font-bold text-xl">{h.name}</h3>
              <p className="text-[10px] text-amber-500/50 uppercase tracking-widest">{h.botanical}</p>
            </div>
          ))}
        </div>
      </main>

      <aside className="w-[400px] bg-[#0f172a] border-l border-slate-800 p-10 flex flex-col shadow-2xl">
        <h2 className="text-xs font-bold uppercase tracking-[0.4em] text-slate-500 mb-10">Formula Matrix</h2>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {selectedHerbs.map(h => (
            <div key={h.id} className="flex justify-between items-center p-5 bg-[#020617] rounded-2xl border border-white/5 animate-in slide-in-from-right-4">
              <span className="text-sm font-bold tracking-widest text-white">{h.name}</span>
              <X size={16} className="cursor-pointer text-slate-600 hover:text-red-400" onClick={() => toggleHerb(h)}/>
            </div>
          ))}
          {selectedHerbs.length === 0 && <div className="mt-32 text-center opacity-20 italic text-sm tracking-widest uppercase">Awaiting Selection</div>}
        </div>
        <button 
          onClick={() => setShowResults(true)}
          disabled={selectedHerbs.length < 2}
          className="mt-10 w-full py-7 rounded-[2rem] bg-amber-500 text-black font-bold uppercase tracking-widest disabled:opacity-10 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          {selectedHerbs.length < 2 ? "Select at least 2" : `Generate synthesis (${selectedHerbs.length})`}
        </button>
      </aside>
    </div>
  );
}

export default App;