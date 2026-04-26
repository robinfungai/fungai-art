import { useState, useMemo } from 'react';
import { Search, Plus, X, Leaf, Sparkles, ArrowLeft, ShieldCheck, Flame, Droplets, Wind, Mountain } from 'lucide-react';
import { HERBS, type Herb } from './data/herbs'; 
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHerbs, setSelectedHerbs] = useState<Herb[]>([]);
  const [showResults, setShowResults] = useState(false);

  const filteredHerbs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return HERBS;
    return HERBS.filter(h => h.name.toLowerCase().includes(query) || h.botanical.toLowerCase().includes(query));
  }, [searchQuery]);

  const toggleHerb = (herb: Herb) => {
    if (selectedHerbs.find(h => h.id === herb.id)) {
      setSelectedHerbs(selectedHerbs.filter(h => h.id !== herb.id));
    } else if (selectedHerbs.length < 5) {
      setSelectedHerbs([...selectedHerbs, herb]);
    }
  };

  // --- FULL DEPTH RESULTS VIEW ---
  if (showResults) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-300 p-4 md:p-12 font-serif animate-in fade-in duration-1000">
        <button onClick={() => setShowResults(false)} className="flex items-center gap-2 text-amber-500/80 mb-10 font-sans uppercase tracking-[0.2em] text-xs font-bold hover:text-amber-400">
          <ArrowLeft size={16} /> Re-Formulate Matrix
        </button>

        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header Card */}
          <div className="bg-[#0f172a] border border-amber-500/20 p-10 rounded-3xl relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={120} className="text-amber-500" /></div>
            <h2 className="text-amber-500 font-sans uppercase tracking-[0.4em] text-sm mb-4">Protocol Synthesis Active</h2>
            <h1 className="text-5xl md:text-6xl text-white font-bold mb-6">Synergistic Formulation</h1>
            <p className="max-w-2xl text-lg text-slate-400 italic">This protocol balances five distinct biological pathways to create a unified field of restoration.</p>
          </div>

          {/* Deep Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: The Components */}
            <div className="lg:col-span-2 space-y-6">
              {selectedHerbs.map((herb, i) => (
                <div key={herb.id} className="bg-[#1e293b]/40 border border-slate-800 p-6 rounded-2xl flex gap-6 group hover:border-amber-500/30 transition-all">
                  <div className="text-3xl font-mono text-amber-500/20">0{i+1}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">{herb.name}</h3>
                    <p className="text-amber-500/60 text-sm italic mb-4 font-sans uppercase tracking-wider">{herb.botanical}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Function</span> {herb.primary_functions.join(", ")}</div>
                      <div><span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Spirit Layer</span> {herb.spiritual_layer}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Synthesis Panel */}
            <div className="space-y-6">
              <div className="bg-amber-500/5 border border-amber-500/20 p-8 rounded-3xl">
                <h4 className="text-white font-bold mb-6 flex items-center gap-2"><Droplets size={18} className="text-amber-500" /> Energetic Pulse</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">TCM Element Match</span>
                    <span className="text-amber-200">Mixed Synergy</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Caution Level</span>
                    <span className="text-amber-500 font-bold">Stable</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-3xl">
                <h4 className="text-white font-bold mb-4">Ritual Preparation</h4>
                <p className="text-sm text-slate-400 leading-relaxed italic">
                  Combine these elements in a quiet space. The extraction should be slow, allowing the water or spirit to pull the heavy minerals and light aromatics into balance.
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs text-amber-500/50 uppercase font-bold tracking-widest">
                  <ShieldCheck size={14} /> Verified Formulation
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#020617] text-slate-300 font-sans overflow-hidden">
      {/* EXPLORER */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#020617]">
        <header className="p-8 border-b border-slate-800/50 bg-[#020617]">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <Leaf className="text-amber-500 w-6 h-6" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-white tracking-widest uppercase">Fungai Art</h1>
          </div>
          <div className="relative max-w-2xl group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" />
            <input
              type="text"
              placeholder="Query the Materia Medica..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-800 rounded-2xl py-5 pl-14 pr-6 focus:outline-none focus:border-amber-500/50 text-white placeholder:text-slate-600 transition-all shadow-inner"
            />
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 custom-scrollbar">
          {filteredHerbs.map((herb) => {
            const isSelected = selectedHerbs.some(h => h.id === herb.id);
            return (
              <div
                key={herb.id}
                onClick={() => toggleHerb(herb)}
                className={cn(
                  "p-6 rounded-3xl border-2 transition-all duration-500 cursor-pointer flex flex-col justify-between min-h-[160px] group",
                  isSelected 
                    ? "bg-amber-500/10 border-amber-500 shadow-[0_0_30px_rgba(251,191,36,0.1)]" 
                    : "bg-[#0f172a] border-slate-800 hover:border-slate-600 shadow-xl"
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-xl mb-1 group-hover:text-amber-400 transition-colors leading-tight">{herb.name}</h3>
                    <p className="text-[10px] text-amber-500/50 uppercase tracking-[0.2em] font-bold">{herb.botanical}</p>
                  </div>
                  <div className={cn("p-2 rounded-xl transition-all", isSelected ? "bg-amber-500 text-[#020617]" : "bg-slate-800 text-slate-500")}>
                    {isSelected ? <X size={16} /> : <Plus size={16} />}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  {herb.tcm_meridians.slice(0, 2).map(m => (
                    <span key={m} className="text-[9px] bg-slate-800 px-2 py-1 rounded-md text-slate-400 uppercase font-bold tracking-tighter">{m}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </main>

      {/* MATRIX SIDEBAR */}
      <aside className="w-full lg:w-[400px] bg-[#0f172a] border-t lg:border-t-0 lg:border-l border-slate-800 p-8 flex flex-col shadow-2xl z-10">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Selection Matrix</h2>
            <div className="flex items-center gap-2">
              <div className="h-1 w-20 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 transition-all duration-700" style={{ width: `${(selectedHerbs.length/5)*100}%` }} />
              </div>
              <span className="text-amber-500 font-mono text-sm">{selectedHerbs.length}/5</span>
            </div>
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            {selectedHerbs.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-600 text-center p-6 italic">
                <Sparkles className="mb-3 opacity-20" size={32} />
                Select 5 signatures to begin the alchemy.
              </div>
            ) : (
              selectedHerbs.map(h => (
                <div key={h.id} className="flex justify-between items-center p-5 bg-[#020617] border border-amber-500/20 rounded-2xl animate-in slide-in-from-right-4">
                  <span className="text-sm font-bold text-white uppercase tracking-wider">{h.name}</span>
                  <X size={16} className="text-slate-600 cursor-pointer hover:text-red-400" onClick={() => toggleHerb(h)} />
                </div>
              ))
            )}
          </div>
        </div>

        <button 
          disabled={selectedHerbs.length !== 5}
          onClick={() => setShowResults(true)}
          className={cn(
            "w-full py-6 rounded-3xl font-bold uppercase tracking-[0.2em] transition-all duration-500 shadow-2xl mt-8",
            selectedHerbs.length === 5 
              ? "bg-amber-500 text-[#020617] hover:bg-amber-400 hover:scale-[1.02] active:scale-95" 
              : "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50"
          )}
        >
          {selectedHerbs.length === 5 ? "Generate Protocol" : "Incomplete Matrix"}
        </button>
      </aside>
    </div>
  );
}

export default App;