import React, { useState } from 'react';
import { QuestionStep } from './QuestionStep';
import { ResultScreen } from './ResultScreen';
import { PROTOCOLS, HERBS } from '../../data/herbs';

interface UserAnswers {
  body_pattern?: string;
  organ_focus?: string[];
  lifestyle?: string;
  ritual_preference?: string;
  safety_flags?: Record<string, boolean>;
  allergies?: string;
  spiritual_intention?: string;
}

export const TailoredHerbs: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [recommendedProtocol, setRecommendedProtocol] = useState<typeof PROTOCOLS[0] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnswer = async (newAnswer: Record<string, any>) => {
    const updatedAnswers = { ...answers, ...newAnswer };
    setAnswers(updatedAnswers);

    if (currentStep === 5) {
      // Safety flags were just answered, proceed to matching
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 6) {
      // Spiritual intention was just answered, now match
      setLoading(true);
      try {
        const result = await matchProtocol(updatedAnswers);
        setRecommendedProtocol(result);
      } catch (error) {
        console.error('Error matching protocol:', error);
        alert('There was an error matching your protocol. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

 const matchProtocol = async (userAnswers: UserAnswers) => {
  console.log('Matching with answers:', userAnswers);
  
  // Call Vercel Function to match protocol
  try {
    const response = await fetch('./api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userAnswers),
    });

    if (!response.ok) {
      console.warn('API returned error, falling back to client-side matching');
      throw new Error('Failed to match protocol');
    }

    const data = await response.json();
    console.log('API response:', data);
    return PROTOCOLS.find((p) => p.id === data.protocol_id) || PROTOCOLS[0];
  } catch (error) {
    console.error('Error calling match API, using client-side:', error);
    // Fallback to client-side matching if API fails
    return matchProtocolClientSide(userAnswers);
  }
};


const matchProtocolClientSide = (userAnswers: UserAnswers): typeof PROTOCOLS[0] => {
  let scores = PROTOCOLS.map((protocol) => {
    let score = 0;

    // Body Pattern Match (40%)
    if (protocol.body_pattern_match.includes(userAnswers.body_pattern || '')) {
      score += 40;
    }

    // Organ Focus Match (30%)
    const organMatches = (userAnswers.organ_focus || []).filter((organ) =>
      protocol.organ_focus_match.includes(organ)
    ).length;
    const organScore = organMatches > 0 
      ? (organMatches / (userAnswers.organ_focus || []).length) * 30 
      : 0;
    score += organScore;

    // Spiritual Intention Match (20%) - Handle both string and array
    const spiritualIntention = userAnswers.spiritual_intention;
    if (Array.isArray(spiritualIntention)) {
      // If multiple selections, give points for any match
      const matchCount = spiritualIntention.filter(intention => 
        protocol.spiritual_qualities.includes(intention)
      ).length;
      score += (matchCount / spiritualIntention.length) * 20;
    } else if (protocol.spiritual_qualities.includes(spiritualIntention || '')) {
      score += 20;
    }

    // Lifestyle Fit (10%)
    if (protocol.lifestyle_fit.includes(userAnswers.lifestyle || '')) {
      score += 10;
    }

    return { protocol, score };
  });

  // Log scores for debugging
  console.log('Protocol Scores:', scores.map(s => ({ name: s.protocol.name, score: s.score })));

  // Apply safety filters - EXCLUDE protocols with contraindications
  if (userAnswers.safety_flags && Object.keys(userAnswers.safety_flags).length > 0) {
    const userSafetyFlags = Object.keys(userAnswers.safety_flags).filter(
      key => userAnswers.safety_flags[key] === true && key !== 'none'
    );
    
    if (userSafetyFlags.length > 0) {
      console.log('User safety flags:', userSafetyFlags);
      
      const originalCount = scores.length;
      scores = scores.filter((item) => {
        // Check if protocol has ANY matching contraindications
        const hasContraindication = item.protocol.contraindications.some((contra: string) => {
          const contraLower = contra.toLowerCase();
          return userSafetyFlags.some(flag => {
            if (flag === 'pregnant' && (contraLower.includes('pregnan') || contraLower.includes('nursing'))) return true;
            if (flag === 'blood_thinners' && contraLower.includes('blood thin')) return true;
            if (flag === 'hormone_therapy' && (contraLower.includes('hormone') || contraLower.includes('birth control'))) return true;
            if (flag === 'immune_medications' && contraLower.includes('immune')) return true;
            if (flag === 'liver_issues' && contraLower.includes('liver')) return true;
            if (flag === 'recent_surgery' && contraLower.includes('surgery')) return true;
            return false;
          });
        });
        
        return !hasContraindication; // EXCLUDE protocols with matching contraindications
      });
      
      console.log(`Safety filter: ${originalCount} → ${scores.length} safe protocols`);
    }
  }

  // Return highest scored protocol
  const best = scores.sort((a, b) => b.score - a.score)[0];
  console.log('Best match:', best?.protocol.name, 'Score:', best?.score);
  
  return best?.protocol || PROTOCOLS[0];
};



  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers({});
    setRecommendedProtocol(null);
  };

  if (recommendedProtocol) {
    return (
      <div className="tailored-herbs-container">
        <ResultScreen
          protocol={recommendedProtocol}
          userAnswers={answers}
          onRestart={handleRestart}
        />
      </div>
    );
  }

  return (
    <div className="tailored-herbs-container">
      {currentStep === 0 ? (
        <div className="intro-screen">
          <div className="intro-content">
            <h1 className="intro-title">Tailored Tinctures</h1>
            <p className="intro-subtitle">A Personalized Journey Into Herbal Wisdom</p>
            <p className="intro-description">
              Through this brief ritual, we'll discover which of our 32 plant allies is calling to you right now. 
              This isn't a quiz—it's a conversation between you and the plants.
            </p>
            <div className="intro-points">
              <div className="point">
                <span className="point-icon">🌿</span>
                <p>Answer 5 guiding questions about your body, life, and spirit</p>
              </div>
              <div className="point">
                <span className="point-icon">⚗️</span>
                <p>We'll match you with a personalized protocol from our library</p>
              </div>
              <div className="point">
                <span className="point-icon">✨</span>
                <p>Receive ritual guidance, dosage, and sacred context for your herbs</p>
              </div>
            </div>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setCurrentStep(1)}
            >
              Begin Your Ritual
            </button>
          </div>
        </div>
      ) : (
        <QuestionStep
          step={currentStep}
          onNext={handleAnswer}
          answers={answers}
        />
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Consulting the plant allies...</p>
        </div>
      )}

      <style>{`
        .tailored-herbs-container {
          min-height: 100vh;
          background: var(--color-background);
          padding: 2rem 1rem;
        }

        .intro-screen {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 80vh;
        }

        .intro-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding: 2rem;
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          animation: fadeIn 0.6s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .intro-title {
          font-size: var(--font-size-4xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text);
          margin: 0;
          text-align: center;
        }

        .intro-subtitle {
          font-size: var(--font-size-xl);
          color: var(--color-text-secondary);
          margin: 0;
          text-align: center;
          font-style: italic;
        }

        .intro-description {
          font-size: var(--font-size-base);
          color: var(--color-text);
          line-height: var(--line-height-normal);
          margin: 0;
          text-align: center;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .intro-points {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          padding: 1.5rem 0;
        }

        .point {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          text-align: center;
          padding: 1.5rem;
          background: var(--color-bg-1);
          border-radius: var(--radius-md);
        }

        .point-icon {
          font-size: 2rem;
        }

        .point p {
          margin: 0;
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          line-height: var(--line-height-normal);
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: var(--radius-md);
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all var(--duration-normal) var(--ease-standard);
        }

        .btn-primary {
          background: var(--color-primary);
          color: var(--color-btn-primary-text);
        }

        .btn-primary:hover {
          background: var(--color-primary-hover);
        }

        .btn-lg {
          padding: 1rem 2rem;
          font-size: var(--font-size-lg);
          align-self: center;
          margin-top: 1rem;
        }

        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          z-index: 1000;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid var(--color-border);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .loading-overlay p {
          color: var(--color-btn-primary-text);
          font-size: var(--font-size-base);
          margin: 0;
        }

        @media (max-width: 768px) {
          .tailored-herbs-container {
            padding: 1rem 0.5rem;
          }

          .intro-content {
            padding: 1.5rem;
          }

          .intro-title {
            font-size: var(--font-size-2xl);
          }

          .intro-points {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default TailoredHerbs;
