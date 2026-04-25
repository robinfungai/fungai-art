import React from 'react';
import { Protocol, HERBS } from '../../data/herbs';
import { AILabelGenerator } from './AILabelGenerator';
import bottleImage from '@/assets/tincture-bottle.jpg';

interface ResultScreenProps {
  protocol: Protocol;
  userAnswers: Record<string, any>;
  onRestart: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ protocol, userAnswers, onRestart }) => {
  const [aiLabelImage, setAiLabelImage] = React.useState<string | null>(null);

  const getHerbDetails = (herbName: string) => {
    return HERBS.find((h) => h.name === herbName);
  };

  const generatePersonalization = () => {
    const baseTemplate = protocol.personalization_template || '';
    return baseTemplate.replace('{protocol_name}', `"${protocol.name}"`);
  };

  return (
    <div className="result-screen">
      {/* Hero Section with Bottle */}
      <section className="hero-section">
        <div className="hero-content">
          <span className="caution-badge">{protocol.caution_level}</span>
          <h1 className="protocol-name">{protocol.name}</h1>
          <p className="protocol-tagline">{protocol.tagline}</p>
        </div>
        <div className="feedback-section">
  <p>How well did this match resonate?</p>
  <div className="star-rating">
    {[1,2,3,4,5].map(n => <span key={n}>⭐</span>)}
  </div>
</div>


        <AILabelGenerator 
          protocol={protocol} 
          onLabelGenerated={(url) => setAiLabelImage(url)}
        />

        <div className="bottle-container">
          <div className="bottle-wrapper">
            <img 
              src={bottleImage} 
              alt="Your personalized tincture" 
              className="bottle-image"
            />
            
            <div className="bottle-label-overlay">
              <div className="label-content">
                <div className="label-herbs">
                  {protocol.herbs_in_protocol
                    .slice(0, 3)
                    .map((h: any, i: number) => (
                      <span key={i}>{h.name}</span>
                    ))}
                </div>
                {protocol.tagline && (
                  <p className="label-tagline">{protocol.tagline}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info Cards */}
      <section className="quick-info">
        <div className="info-card">
          <strong>Dosage</strong>
          <span>{protocol.dosage}</span>
        </div>
        <div className="info-card">
          <strong>Preparation</strong>
          <span>{protocol.preparation.split('.')[0]}</span>
        </div>
      </section>

      {/* Your Ritual */}
      <section className="ritual-section">
        <h2>Your Ritual</h2>
        <p className="ritual-text">{generatePersonalization()}</p>
      </section>

      {/* Energetic Profile */}
      <section className="energy-section">
        <h2>Energetic Profile</h2>
        <p className="energy-text">{protocol.energetic_profile}</p>
      </section>

      {/* Herbs Breakdown */}
      <section className="herbs-section">
        <h2>Your Plant Allies</h2>
        <div className="herbs-grid">
          {protocol.herbs_in_protocol.map((herb, idx) => {
            const herbDetails = getHerbDetails(herb.name);
            return (
              <div key={idx} className="herb-card">
                <div className="herb-header">
                  <h3>{herb.name}</h3>
                  <span className="herb-ratio">{herb.ratio}</span>
                </div>
                {herbDetails && (
                  <>
                    <p className="herb-latin">{herbDetails.botanical}</p>
                    <p className="herb-function">{herbDetails.primary_functions[0]}</p>
                    <p className="herb-spirit">{herbDetails.spiritual_layer}</p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* How to Take */}
      <section className="instructions-section">
        <h2>How to Work With This</h2>
        <div className="instruction-card">
          <h3>Ritual Framing</h3>
          <p>{protocol.ritual_framing}</p>
        </div>
        <div className="instruction-card">
          <h3>Storage</h3>
          <p>Cool, dark place. Shake gently before each use.</p>
        </div>
      </section>

      {/* Safety */}
      {(protocol.safety_notes || protocol.contraindications.length > 0) && (
        <section className="safety-section">
          <h2>⚠️ Safety Notes</h2>
          {protocol.safety_notes && (
            <p className="safety-text">{protocol.safety_notes}</p>
          )}
          {protocol.contraindications.length > 0 && (
            <div className="contraindications">
              <h3>Contraindications:</h3>
              <ul>
                {protocol.contraindications.map((contra, idx) => (
                  <li key={idx}>{contra}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Integration Tips */}
      <section className="integration-section">
        <h2>Integration Tips</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <span className="tip-icon">🌅</span>
            <h3>Morning Ritual</h3>
            <p>Take on an empty stomach when you wake. Set an intention.</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🔄</span>
            <h3>Consistency</h3>
            <p>Daily for 4-6 weeks to feel the full effects.</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🎧</span>
            <h3>Listen</h3>
            <p>Start low, go slow. Trust your body's wisdom.</p>
          </div>
        </div>
      </section>

      {/* Action Button */}
      <div className="action-section">
        <button className="btn-restart" onClick={onRestart}>
          ↻ Find Another Ritual
        </button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');

        .result-screen {
          min-height: 100vh;
          background: var(--color-background);
          padding: 0;
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Hero Section */
        .hero-section {
          background: linear-gradient(135deg, var(--color-bg-1) 0%, var(--color-bg-3) 100%);
          padding: 2rem 1rem 1rem;
          text-align: center;
        }

        .hero-content {
          max-width: 600px;
          margin: 0 auto 1.5rem;
        }

        .caution-badge {
          display: inline-block;
          padding: 0.4rem 0.8rem;
          background: var(--color-primary);
          color: var(--color-btn-primary-text);
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
        }

        .protocol-name {
          font-size: 2rem;
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 0.5rem 0;
          line-height: 1.2;
        }

        .protocol-tagline {
          font-size: 1rem;
          color: var(--color-text-secondary);
          margin: 0;
          font-style: italic;
        }

        /* Bottle */
        .bottle-container {
          max-width: 500px;
          margin: 0 auto;
        }

        .bottle-wrapper {
          position: relative;
          width: 100%;
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-lg);
        }

        .bottle-image {
          width: 100%;
          height: auto;
          max-height: 500px;
          object-fit: contain;
          display: block;
        }

        .bottle-label-overlay {
          position: absolute;
          top: 51.71%;
          left: 52.33%;
          width: 26.07%;
          max-height: 18.46%;
          padding: 0.5rem;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transform: perspective(500px) rotateY(-6deg);
          transform-origin: center center;
        }

        .label-content {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          align-items: center;
          width: 100%;
        }

        .label-herbs {
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          font-weight: 700;
          color: #1F2121;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-shadow: 0 0.5px 1px rgba(255, 255, 255, 0.5);
          line-height: 1.5;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .label-herbs span {
          display: block;
        }

        .label-tagline {
          font-family: 'Georgia', serif;
          font-size: 0.55rem;
          color: #5E5240;
          margin: 0.5rem 0 0 0;
          font-style: italic;
          text-shadow: 0 0.5px 1px rgba(255, 255, 255, 0.5);
          line-height: 1.3;
        }

        /* Quick Info Cards */
        .quick-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          padding: 1.5rem 1rem;
          max-width: 600px;
          margin: 0 auto;
        }

        .info-card {
          background: var(--color-surface);
          padding: 1rem;
          border-radius: var(--radius-md);
          text-align: center;
          box-shadow: var(--shadow-sm);
        }

        .info-card strong {
          display: block;
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .info-card span {
          font-size: 0.875rem;
          color: var(--color-text);
        }

        /* Sections */
        section {
          padding: 2rem 1rem;
          max-width: 800px;
          margin: 0 auto;
        }

        section h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 1rem 0;
        }

        .ritual-section {
          background: var(--color-bg-1);
          border-left: 4px solid var(--color-primary);
        }

        .ritual-text {
          font-size: 1rem;
          line-height: 1.6;
          color: var(--color-text);
          font-style: italic;
          margin: 0;
        }

        .energy-section {
          background: var(--color-surface);
        }

        .energy-text {
          font-size: 1rem;
          line-height: 1.6;
          color: var(--color-text-secondary);
          margin: 0;
        }

        /* Herbs Grid */
        .herbs-grid {
          display: grid;
          gap: 1rem;
        }

        .herb-card {
          background: var(--color-surface);
          padding: 1.25rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
        }

        .herb-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .herb-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--color-text);
          margin: 0;
        }

        .herb-ratio {
          background: var(--color-primary);
          color: var(--color-btn-primary-text);
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .herb-latin {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          font-style: italic;
          margin: 0 0 0.5rem 0;
        }

        .herb-function {
          font-size: 0.875rem;
          color: var(--color-text);
          font-weight: 500;
          margin: 0 0 0.75rem 0;
        }

        .herb-spirit {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          font-style: italic;
          line-height: 1.5;
          margin: 0;
        }

        /* Instructions */
        .instructions-section {
          background: var(--color-bg-2);
        }

        .instruction-card {
          background: var(--color-surface);
          padding: 1.25rem;
          border-radius: var(--radius-md);
          margin-bottom: 1rem;
        }

        .instruction-card:last-child {
          margin-bottom: 0;
        }

        .instruction-card h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 0.5rem 0;
        }

        .instruction-card p {
          font-size: 0.875rem;
          line-height: 1.5;
          color: var(--color-text-secondary);
          margin: 0;
        }

        /* Safety */
        .safety-section {
          background: var(--color-bg-4);
          border-left: 4px solid var(--color-error);
        }

        .safety-section h2 {
          color: var(--color-error);
        }

        .safety-text {
          font-size: 0.875rem;
          line-height: 1.6;
          color: var(--color-text);
          margin: 0 0 1rem 0;
        }

        .contraindications h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.75rem 0;
        }

        .contraindications ul {
          margin: 0;
          padding-left: 1.25rem;
        }

        .contraindications li {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }

        /* Integration Tips */
        .tips-grid {
          display: grid;
          gap: 1rem;
        }

        .tip-card {
          background: var(--color-surface);
          padding: 1.25rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          text-align: center;
        }

        .tip-icon {
          font-size: 2rem;
          display: block;
          margin-bottom: 0.75rem;
        }

        .tip-card h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 0.5rem 0;
        }

        .tip-card p {
          font-size: 0.875rem;
          line-height: 1.5;
          color: var(--color-text-secondary);
          margin: 0;
        }

        /* Action */
        .action-section {
          padding: 2rem 1rem 3rem;
          text-align: center;
        }

        .btn-restart {
          background: var(--color-primary);
          color: var(--color-btn-primary-text);
          border: none;
          padding: 1rem 2rem;
          border-radius: var(--radius-md);
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: var(--shadow-md);
        }

        .btn-restart:hover {
          background: var(--color-primary-hover);
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .btn-restart:active {
          transform: translateY(0);
        }

        /* Tablet/Desktop */
        @media (min-width: 768px) {
          .hero-section {
            padding: 3rem 2rem 2rem;
          }

          .protocol-name {
            font-size: 2.5rem;
          }

          .bottle-image {
            max-height: 600px;
          }

          .herbs-grid {
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          }

          .tips-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* Mobile Optimization */
        @media (max-width: 480px) {
          .protocol-name {
            font-size: 1.5rem;
          }

          .bottle-image {
            max-height: 400px;
          }

          section {
            padding: 1.5rem 1rem;
          }

          section h2 {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ResultScreen;
