import { useState, useMemo } from 'react';
import { Search, Plus, X, Leaf, Activity, Sparkles } from 'lucide-react';
import { HERBS } from './data/herbs'; 
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Herb {
  id: string | number;
  name: string;
  description?: string;
  details?: string;
  category?: string;
}

function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHerbs, setSelectedHerbs] = useState<Herb[]>([]);

  const filteredHerbs = useMemo(() => {
    return (HERBS as Herb[]).filter((herb) => {
      const query = searchQuery.toLowerCase();
      return (
        herb.name.toLowerCase().includes(query) ||
        (herb.description || herb.details || "").toLowerCase().includes(query)
      );
    });
  }, [searchQuery]);

  const toggleHerb = (herb: Herb) => {
    if (selectedHerbs.find((h) => h.id === herb.id)) {
      setSelectedHerbs(selectedHerbs.filter((h) => h.id !== herb.id));
    } else if (selectedHerbs.length < 5) {
      setSelectedHerbs([...selectedHerbs, herb]);
    }
  };

  const isComplete = selectedHerbs.length === 5;

  return (
    <div className="flex h-screen bg-[#0a0f1e] text-slate-200 overflow-hidden font-sans">
      
      {/* MAIN EXPLORER AREA */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Leaf className="text-blue-500 w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Fungai Art</h1>
          </div>
          
          <div className="relative max-w-2xl group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search botanical library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#161d31] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-lg"
            />
          </div>
        </header>

        {/* SCROLLABLE GRID */}
        <section className="flex-1 overflow-y-auto p-8 pt-2 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredHerbs.map((herb) => {
              const isSelected = selectedHerbs.some((h) => h.id === herb.id);
              return (
                <div
                  key={herb.id}
                  onClick={() => toggleHerb(herb)}
                  className={cn(
                    "group relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[180px]",
                    isSelected 
                      ? "bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]" 
                      : "bg-[#161d31] border-slate-800 hover:border-slate-600 hover:bg-[#1c253d]"
                  )}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors leading-tight">
                        {herb.name}
                      </h3>
                      <div className={cn(
                        "p-1.5 rounded-full border transition-all",
                        isSelected ? "bg-blue-500 border-blue-400 text-white" : "border-slate-700 text-slate-500"
                      )}>
                        {isSelected ? <Sparkles size={16} /> : <Plus size={16} />}
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                      {herb.description || herb.details || "Integrative botanical profile pending analysis."}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* FIXED SIDEBAR */}
      <aside className="w-[400px] bg-[#0d1425] border-l border-slate-800 flex flex-col shadow-2xl">
        <div className="p-8 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Activity className="text-blue-500 w-5 h-5" />
              <h2 className="text-xl font-bold text-white uppercase tracking-wider text-sm">Protocol Builder</h2>
            </div>
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-bold transition-all",
              isComplete ? "bg-green-500/20 text-green-400" : "bg-slate-800 text-slate-400"
            )}>
              {selectedHerbs.length} / 5
            </span>
          </div>

          {/* PROGRESS BAR */}
          <div className="h-1.5 w-full bg-slate-800 rounded-full mb-8 overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-500 ease-out", isComplete ? "bg-green-500" : "bg-blue-500")}
              style={{ width: `${(selectedHerbs.length / 5) * 100}%` }}
            />
          </div>

          {/* SELECTED LIST */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {selectedHerbs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <Leaf size={48} className="mb-4 text-slate-600" />
                <p className="text-sm">Select 5 botanicals to<br/>begin your formulation</p>
              </div>
            ) : (
              selectedHerbs.map((herb) => (
                <div 
                  key={herb.id} 
                  className="group flex items-center justify-between p-4 bg-[#161d31] rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all animate-in slide-in-from-right-4 duration-300"
                >
                  <span className="font-medium text-slate-200">{herb.name}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleHerb(herb); }}
                    className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* FINAL ACTION AREA - LOCKED TO BOTTOM */}
        <div className="p-8 bg-[#0a0f1e]/50 border-t border-slate-800">
          <button 
            disabled={!isComplete}
            onClick={() => alert("Protocol Optimized. Preparing botanical summary...")}
            className={cn(
              "w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-lg transition-all duration-300",
              isComplete 
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 active:scale-95" 
                : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
            )}
          >
            {isComplete ? <Sparkles className="animate-pulse" /> : null}
            Generate My Protocol
          </button>
          <p className="text-center text-xs text-slate-600 mt-4">
            Custom biological algorithm active.
          </p>
        </div>
      </aside>
    </div>
  );
}

export default App;