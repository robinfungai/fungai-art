import { useState, useMemo } from 'react';
import { Search, X, ArrowLeft, AlertTriangle, Zap, Beaker } from 'lucide-react';
import { HERBS, type Herb } from './data/herbs'; 

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHerbs, setSelectedHerbs] = useState<Herb[]>([]);
  const [showResults, setShowResults] = useState(false);

  // 1. ADVANCED SEARCH ENGINE
  // This fix ensures that searching "Rubus" or "Earth" or "Shatavari" all work.
  const filteredHerbs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return HERBS;
    return HERBS.filter(h => 
      h.name.toLowerCase().includes(q) || 
      (h.botanical && h.botanical.toLowerCase().includes(q)) ||
      (h.tcm_element && h.tcm_element.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // 2. CLINICAL SYNERGY AUDIT
  const audit = useMemo(() => {
    const synergies: string[] = [];
    const cautions: string[] = [];
    const names = selectedHerbs.map(h => h.name);

    selectedHerbs.forEach(h => {
      // Scans your 'herb_interactions' array for keywords
      h.herb_interactions?.forEach(interaction => {
        const line = interaction.toLowerCase();
        if (line.includes('synergy:')) {
          const partners = interaction.replace(/synergy:/i, '').split(',').map(s => s.trim());
          partners.forEach(p => {
            if (names.some(n => n.toLowerCase() === p.toLowerCase())) {
              synergies.push(`${h.name} + ${p}: Potentiated Resonance`);
            }
          });
        }
        if (line.includes('caution:')) {
          cautions.push(`${h.name}: ${interaction.replace(/caution:/i, '').trim()}`);
        }
      });
    });
    return { synergies: [...new Set(synergies)], cautions: [...new Set(cautions)] };
  }, [selectedHerbs]);

  const toggleHerb = (herb: Herb) => {
    const exists = selectedHerbs.find(h => h.id === herb.id);
    if (exists) {
      setSelectedHerbs(selectedHerbs.filter(h => h.id !== herb.id));
    } else {
      setSelectedHerbs([...selectedHerbs, herb]);
    }
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-300 p-8 font-serif animate-in fade-in duration-700">
        <button onClick={() => setShowResults(false)} className="flex items-center gap-2 text-amber-500 mb-12 uppercase tracking-widest text-xs font-bold font-sans hover:text-white transition-colors">
          <ArrowLeft size={16} /> Return to Materia Medica
        </button>

        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center">
            <h1 className="text-6xl text-white font-bold italic mb-4">Formula Synthesis</h1>
            <p className="text-amber-500 font-sans uppercase tracking-[0.4em] text-[10px]">Clinical Matrix Active</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-[2rem]">
              <h3 className="text-emerald-400 font-sans font-bold text-xs uppercase mb-4 flex items-center gap-2"><Zap size={14}/> Synergistic Resonance</h3>
              <ul className="text-sm italic space-y-2 leading-relaxed">
                {audit.synergies.length > 0 ? audit.synergies.map((s,i) => <li key={i}>{s}</li>) : <li className="opacity-40">Standard formulation stacking.</li>}
              </ul>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-[2rem]">
              <h3 className="text-red-400 font-sans font-bold text-xs uppercase mb-4 flex items-center gap-2"><AlertTriangle size={14}/> Safety Cautions</h3>
              <ul className="text-sm italic space-y-2 leading-relaxed">
                {audit.cautions.length > 0 ? audit.cautions.map((c,i) => <li key={i}>{c}</li>) : <li className="opacity-40">No immediate safety conflicts.</li>}
              </ul>
            </div>
          </div>

          <div className="space-y-8">
            {selectedHerbs.map(h => (
              <div key={h.id} className="bg-[#0f172a] border border-slate-800 p-10 rounded-[3rem] hover:border-amber-500/20 transition-all">
                <h3 className="text-3xl text-white font-bold mb-2">{h.name}</h3>
                <p className="text-amber-500/50 text-[10px] uppercase tracking-widest mb-6 font-sans">{h.botanical}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm leading-relaxed text-slate-400 border-t border-white/5 pt-8">
                   <p><strong className="text-white block mb-2 uppercase text-[10px] tracking-widest">Pharmacology</strong> {h.pharmacology}</p>
                   <p><strong className="text-white block mb-2 uppercase text-[10px] tracking-widest">Spiritual Layer</strong> {h.spiritual_layer}</p>
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
        <header className="mb-12 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Beaker className="text-amber-500" />
            <h1 className="text-xl font-bold text-white tracking-[0.2em] uppercase">Materia Medica Core</h1>
          </div>
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Query name, botanical, or element..." 
              className="w-full bg-[#0f172a] border border-slate-800 rounded-2xl py-3 pl-12 pr-10 focus:outline-none focus:border-amber-500/50 text-white text-sm transition-all"
            />
            {searchQuery && <X onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500 hover:text-white" size={16}/>}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-24 custom-scrollbar pr-4">
          {filteredHerbs.map(h => (
            <div 
              key={h.id} 
              onClick={() => toggleHerb(h)}
              className={cn(
                "p-8 rounded-[2.5rem] border-2 transition-all duration-300 cursor-pointer relative group",
                selectedHerbs.some(sh => sh.id === h.id) ? "border-amber-500 bg-amber-500/5" : "border-slate-800 bg-[#0f172a] hover:border-slate-700"
              )}
            >
              <h3 className="text-white font-bold text-xl mb-1 group-hover:text-amber-500 transition-colors">{h.name}</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">{h.botanical}</p>
              <div className="absolute bottom-4 right-8 text-[8px] text-amber-500/20 uppercase tracking-[0.3em] font-bold">{h.tcm_element}</div>
            </div>
          ))}
        </div>
      </main>

      <aside className="w-[400px] bg-[#0f172a] border-l border-slate-800 p-10 flex flex-col shadow-2xl">
        <h2 className="text-xs font-bold uppercase tracking-[0.4em] text-slate-500 mb-10 italic">Selection Matrix</h2>
        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
          {selectedHerbs.map(h => (
            <div key={h.id} className="flex justify-between items-center p-5 bg-[#020617] rounded-2xl border border-white/5 animate-in slide-in-from-right-4">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-widest">{h.name}</span>
                <span className="text-[9px] text-amber-500/40 uppercase">{h.tcm_element}</span>
              </div>
              <X size={16} className="cursor-pointer text-slate-600 hover:text-red-400 transition-colors" onClick={() => toggleHerb(h)}/>
            </div>
          ))}
          {selectedHerbs.length === 0 && <div className="mt-32 text-center opacity-20 italic text-sm tracking-widest uppercase">Awaiting Input</div>}
        </div>
        <button 
          onClick={() => setShowResults(true)}
          disabled={selectedHerbs.length < 2}
          className="mt-10 w-full py-8 rounded-[2.5rem] bg-amber-500 text-black font-bold uppercase tracking-[0.2em] disabled:opacity-10 transition-all hover:bg-amber-400 shadow-2xl shadow-amber-500/10 active:scale-95"
        >
          {selectedHerbs.length < 2 ? "Select Constituents" : `Analyze Matrix (${selectedHerbs.length})`}
        </button>
      </aside>
    </div>
  );
}