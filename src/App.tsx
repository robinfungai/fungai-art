import { useState, useMemo } from 'react';
import { HERBS } from './data/herbs';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedElement, setSelectedElement] = useState('All');
  const [activeProtocol, setActiveProtocol] = useState<any[]>([]);
  const [selectedHerb, setSelectedHerb] = useState<any>(null);

  // --- LOGIC: FILTERING ---
  const filteredHerbs = HERBS.filter(herb => {
    const matchesSearch = herb.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesElement = selectedElement === 'All' || herb.tcm_element.includes(selectedElement);
    return matchesSearch && matchesElement;
  });

  // --- LOGIC: SYNERGY & SAFETY ANALYSIS ---
  const analysis = useMemo(() => {
    const alerts: string[] = [];
    let tempBalance = 0; // Negative for Cold, Positive for Hot

    activeProtocol.forEach(herb => {
      // Temperature check
      const eng = herb.energetics.join(' ').toLowerCase();
      if (eng.includes('cold') || eng.includes('cool')) tempBalance -= 1;
      if (eng.includes('warm') || eng.includes('hot')) tempBalance += 1;

      // Interaction check (Safety Engine)
      activeProtocol.forEach(otherHerb => {
        if (herb.id !== otherHerb.id) {
          // Check if herb name appears in other herb's caution list
          const cautionString = JSON.stringify(otherHerb.herb_interactions).toLowerCase();
          if (cautionString.includes(herb.name.toLowerCase())) {
            alerts.push(`⚠️ ALERT: Potential clash between ${herb.name} and ${otherHerb.name}`);
          }
        }
      });
    });

    return { tempBalance, alerts: [...new Set(alerts)] };
  }, [activeProtocol]);

  const toggleHerbInProtocol = (herb: any) => {
    if (activeProtocol.find(h => h.id === herb.id)) {
      setActiveProtocol(activeProtocol.filter(h => h.id !== herb.id));
    } else {
      if (activeProtocol.length < 5) setActiveProtocol([...activeProtocol, herb]);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#020617', color: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      
      {/* LEFT SIDE: SEARCH & LIBRARY */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', background: 'linear-gradient(to right, #22d3ee, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            FUNG.AI WORKBENCH
          </h1>
          <input 
            type="text" placeholder="Search mushrooms..." 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', maxWidth: '500px', padding: '12px', marginTop: '20px', borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#0f172a', color: 'white' }}
          />
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {filteredHerbs.map(herb => (
            <div key={herb.id} 
              style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#0f172a', border: activeProtocol.find(h => h.id === herb.id) ? '2px solid #3b82f6' : '1px solid #1e293b', cursor: 'pointer' }}
              onClick={() => setSelectedHerb(herb)}
            >
              <h3>{herb.name}</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{herb.botanical}</p>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleHerbInProtocol(herb); }}
                style={{ marginTop: '10px', width: '100%', padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: activeProtocol.find(h => h.id === herb.id) ? '#ef4444' : '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {activeProtocol.find(h => h.id === herb.id) ? 'Remove' : 'Add to Protocol'}
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* RIGHT SIDE: THE ANALYZER SIDEBAR */}
      <aside style={{ width: '350px', backgroundColor: '#0f172a', borderLeft: '1px solid #1e293b', padding: '30px', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <h2 style={{ color: '#22d3ee', marginBottom: '20px' }}>Current Protocol</h2>
        
        {activeProtocol.length === 0 && <p style={{ color: '#64748b' }}>Select up to 5 herbs to begin analysis...</p>}

        {activeProtocol.map(herb => (
          <div key={herb.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
            <span>{herb.name}</span>
            <button onClick={() => toggleHerbInProtocol(herb)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
          </div>
        ))}

        {activeProtocol.length > 0 && (
          <div style={{ marginTop: '30px', borderTop: '1px solid #334155', paddingTop: '20px' }}>
            <h3>Energetic Balance</h3>
            <div style={{ width: '100%', height: '10px', backgroundColor: '#020617', borderRadius: '5px', margin: '15px 0', position: 'relative' }}>
               <div style={{ 
                 position: 'absolute', 
                 left: '50%', 
                 height: '20px', 
                 width: '4px', 
                 backgroundColor: '#fff', 
                 top: '-5px',
                 transform: `translateX(${analysis.tempBalance * 20}px)`,
                 transition: '0.3s'
               }} />
            </div>
            <p style={{ fontSize: '0.8rem', textAlign: 'center' }}>
              {analysis.tempBalance < 0 ? 'Cooling Pattern' : analysis.tempBalance > 0 ? 'Warming Pattern' : 'Neutral / Balanced'}
            </p>

            {analysis.alerts.length > 0 && (
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#450a0a', border: '1px solid #ef4444', borderRadius: '8px' }}>
                <h4 style={{ color: '#f87171', margin: 0 }}>Safety Warnings</h4>
                {analysis.alerts.map((alert, i) => <p key={i} style={{ fontSize: '0.8rem', margin: '5px 0' }}>{alert}</p>)}
              </div>
            )}
          </div>
        )}
      </aside>

      {/* MODAL (For reading full details) */}
      {selectedHerb && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setSelectedHerb(null)}>
          <div style={{ backgroundColor: '#0f172a', padding: '40px', borderRadius: '20px', maxWidth: '600px', border: '1px solid #3b82f6' }} onClick={e => e.stopPropagation()}>
            <h2>{selectedHerb.name}</h2>
            <p style={{ fontStyle: 'italic', color: '#94a3b8' }}>{selectedHerb.spiritual_layer}</p>
            <h4 style={{ marginTop: '20px', color: '#22d3ee' }}>Interactions</h4>
            <p style={{ fontSize: '0.9rem' }}>{JSON.stringify(selectedHerb.herb_interactions)}</p>
            <button onClick={() => setSelectedHerb(null)} style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#334155', color: 'white' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;