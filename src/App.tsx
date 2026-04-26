import React, { useState, useMemo } from 'react';
import { Search, Plus, X, Leaf, Info, Activity } from 'lucide-react';
import { herbs } from './data/herbs'; // Ensure this path matches your file structure
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for Tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHerbs, setSelectedHerbs] = useState<typeof herbs>([]);

  // 1. FILTER LOGIC: This filters the list based on your search input
  const filteredHerbs = useMemo(() => {
    return herbs.filter((herb) =>
      herb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      herb.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const toggleHerb = (herb: typeof herbs[0]) => {
    if (selectedHerbs.find((h) => h.id === herb.id)) {
      setSelectedHerbs(selectedHerbs.filter((h) => h.id !== herb.id));
    } else if (selectedHerbs.length < 5) {
      setSelectedHerbs([...selectedHerbs, herb]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex">
      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-8">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
            <Leaf className="text-blue-500" /> Fungai Art
          </h1>
          
          {/* SEARCH INPUT LOCATION: This is inside the main header */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search herbs, roots, and botanicals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#161d31] border border-gray-700 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </header>

        {/* HERB GRID: Uses filteredHerbs instead of the raw herbs list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHerbs.map((herb) => {
            const isSelected = selectedHerbs.find((h) => h.id === herb.id);
            return (
              <div
                key={herb.id}
                className={cn(
                  "bg-[#161d31] border-2 rounded-xl p-6 transition-all cursor-pointer hover:scale-[1.02]",
                  isSelected ? "border-blue-500 bg-[#1e2746]" : "border-transparent"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">{herb.name}</h3>
                  <button
                    onClick={() => toggleHerb(herb)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      isSelected ? "bg-red-500/20 text-red-500" : "bg-blue-500 text-white"
                    )}
                  >
                    {isSelected ? <X size={20} /> : <Plus size={20} />}
                  </button>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  {herb.description}
                </p>
                <div className="flex gap-2">
                  <span className="text-xs bg-gray-800 px-2 py-1 rounded border border-gray-700">
                    {herb.category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* SIDEBAR JSX LOCATION: This is the right-hand panel */}
      <aside className="w-96 bg-[#161d31] border-l border-gray-800 p-8 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <Activity className="text-blue-500" />
          <h2 className="text-2xl font-bold">Current Protocol</h2>
        </div>

        <div className="flex-1 space-y-4">
          {selectedHerbs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-xl text-gray-500">
              Select up to 5 herbs to build your protocol
            </div>
          ) : (
            selectedHerbs.map((herb) => (
              <div key={herb.id} className="bg-[#1e2746] p-4 rounded-lg flex justify-between items-center group">
                <span>{herb.name}</span>
                <button onClick={() => toggleHerb(herb)} className="text-gray-500 hover:text-red-500">
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* GENERATE BUTTON: Only appears when you have 5 selections */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex justify-between text-sm text-gray-400 mb-6">
            <span>Selection Progress</span>
            <span>{selectedHerbs.length} / 5</span>
          </div>
          
          {selectedHerbs.length === 5 && (
            <button 
              onClick={() => alert("Protocol Generated!")}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 group"
            >
              Generate My Protocol
              <Leaf size={18} className="group-hover:rotate-12 transition-transform" />
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

export default App;