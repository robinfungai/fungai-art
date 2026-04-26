import { useState, useMemo } from 'react';
import { Search, X, ArrowLeft, AlertTriangle, Zap, Beaker, BookOpen, Clock } from 'lucide-react';
import { HERBS, type Herb } from './data/herbs'; 

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHerbs, setSelectedHerbs] = useState<Herb[]>([]);
  const [showResults, setShowResults] = useState(false);

  // 1. ADVANCED SEARCH
  const filteredHerbs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return HERBS;
    return HERBS.filter(h => 
      h.name.toLowerCase().includes(q) || 
      (h.botanical && h.botanical.toLowerCase().includes(q)) ||
      (h.tcm_element && h.tcm_element.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // 2. CLINICAL SYNERGY & NARRATIVE ENGINE
  const protocol = useMemo(() => {
    const synergies: string[] = [];
    const cautions: string[] = [];
    const names = selectedHerbs.map(h => h.name);

    selectedHerbs.forEach(h => {
      h.herb_interactions?.forEach(interaction => {
        const line = interaction.toLowerCase();
        if (line.includes('synergy:')) {
          const partners = interaction.replace(/synergy:/i, '').split(',').map(s => s.trim());
          partners.forEach(p => {
            if (names.some(n => n.toLowerCase() === p.toLowerCase())) {
              synergies.push(`${h.name} + ${p}`);
            }
          });
        }
        if (line.includes('caution:')) {
          cautions.push(`${h.name}: ${interaction.replace(/caution:/i, '').trim()}`);
        }
      });
    });

    // Generate Dynamic "How to Use" Narrative
    const hasWater = selectedHerbs.some(h => h.tcm_element?.includes('Water'));
    const hasEarth = selectedHerbs.some(h => h.tcm_element?.includes('Earth'));
    
    let instructions = "For optimal extraction, decoct woody/root elements for 20 minutes before adding leaf material. ";
    if (hasWater && hasEarth) {
      instructions = "This 'Earth-Water' matrix is best prepared as a long infusion to extract both minerals and mucilage. Steep for 4-6 hours.";
    } else if (hasWater) {
      instructions = "This 'Water' dominant blend requires a cold-to-warm infusion to preserve delicate demulcent properties.";
    }

    return { 
      synergies: [...new Set(synergies)], 
      cautions: [...new Set(cautions)],
      instructions 
    };
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
          <ArrowLeft size={16} /> Edit Formulation
        </button>

        <div className="max-w-5xl mx-auto space-y-16">
          <header className="text-center">
            <h1 className="text-6xl text-white font-bold italic mb-4 tracking-tight">Clinical Protocol</h1>
            <p className="text-amber-500 font-sans uppercase tracking-[0.5em] text-[10px]">Pharmacological Synthesis Complete</p>
          </header>

          {/* SYNERGY NARRATIVE SECTION */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800 p-10 rounded-[3rem] space-y-6">
              <h2 className="text-white font-sans font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                <Zap size={14} className="text-amber-500" /> Synthesis & Synergy
              </h2>
              <p className="text-lg text-slate-300 leading-relaxed italic">
                {protocol.synergies.length > 0 
                  ? `This formulation leverages the core resonance between ${protocol.synergies.join(' and ')}. By stacking these constituents, we potentiate the ${selectedHerbs[0]?.tcm_element} affinity of the blend, creating a broader therapeutic window than any single extract could achieve.`
                  : "This formulation acts as a balanced poly-herbal matrix, distributing therapeutic load across multiple organ systems to ensure systemic stability."
                }
              </p>
              <div className="pt-6 border-t border-white/5 flex gap-4 items-start">
                <Clock className="text-amber-500 mt-1" size={18} />
                <p className="text-sm text-slate-400 leading-relaxed">
                  <strong className="text-white uppercase text-[10px] tracking-widest block mb-1">Administration</strong>
                  {protocol.instructions}
                </p>
              </div>
            </div>

            <div className="bg-red-500/5 border border-red-500/20 p-10 rounded-[3rem] space-y-6">
              <h2 className="text-red-400 font-sans font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={14} /> Clinical Oversight
              </h2>
              <ul className="text-sm text-slate-400 space-y-4 italic">
                {protocol.cautions.length > 0 
                  ? protocol.cautions.map((c, i) => <li key={i}>{c}</li>)
                  : <li>No immediate contraindications detected for this specific combination.</li>
                }
              </ul>
            </div>
          </section>

          {/* HERB SUMMARY TABLE */}
          <section className="space-y-8">
            <h2 className="text-white font-sans font-bold text-xs uppercase tracking-widest text-center">Constituent Summary</h2>
            <div className="overflow-hidden border border-slate-800 rounded-[2rem] bg-[#0f172a]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1e293b] text-white text-[10px] uppercase tracking-[0.2em]">
                    <th className="p-6">Botanical Ally</th>
                    <th className="p-6">Energetics</th>
                    <th className="p-6">Primary Function</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-400">
                  {selectedHerbs.map(h => (
                    <tr key={h.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-6">
                        <div className="font-bold text-white uppercase tracking-tighter">{h.name}</div>
                        <div className="text-[10px] italic opacity-50">{h.botanical}</div>
                      </td>
                      <td className="p-6 uppercase text-[10px] tracking-widest">{h.energetics?.slice(0, 2).join(" • ")}</td>
                      <td className="p-6 italic">{h.primary_functions?.[0] || "General Tonic"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
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
              className="w-full bg-[#0f172a] border border-slate-800 rounded-2xl py-3 pl-12 pr-10 focus:outline-none focus:border-amber-500/50 text-white text-sm"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-24 custom-scrollbar">
          {filteredHerbs.map(h => (
            <div 
              key={h.id} 
              onClick={() => toggleHerb(h)}
              className={cn(
                "p-8 rounded-[2.5rem] border-2 transition-all duration-300 cursor-pointer relative group",
                selectedHerbs.some(sh => sh.id === h.id) ? "border-amber-500 bg-amber-500/5 shadow-2xl" : "border-slate-800 bg-[#0f172a] hover:border-slate-700"
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
        <h2 className="text-xs font-bold uppercase tracking-[0.4em] text-slate-500 mb-10">Selection Matrix</h2>
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
        </div>
        <button 
          onClick={() => setShowResults(true)}
          disabled={selectedHerbs.length < 2}
          className="mt-10 w-full py-8 rounded-[2.5rem] bg-amber-500 text-black font-bold uppercase tracking-widest disabled:opacity-10 transition-all hover:bg-amber-400 shadow-2xl active:scale-95"
        >
          Generate Protocol ({selectedHerbs.length})
        </button>
      </aside>
    </div>
  );
}