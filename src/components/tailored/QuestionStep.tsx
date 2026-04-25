import React from 'react';
import { BODY_PATTERNS, ORGAN_FOCUS, LIFESTYLE, SPIRITUAL_INTENTION, SAFETY_FLAGS } from '../../data/herbs';

interface QuestionStepProps {
  step: number;
  onNext: (answer: any) => void;
  answers: Record<string, any>;
}

// NEW Q4 OPTIONS
const RITUAL_RELATIONSHIP = [
  { value: 'experienced', label: 'I like ceremony and I am familiar with plant medicine' },
  { value: 'new', label: 'New to both ceremony and plant medicine' },
  { value: 'curious', label: 'Curious to know more about both practices' }
];

// UPDATED Q5 OPTIONS
const UPDATED_SAFETY_FLAGS = [
  { id: 'pregnant', label: 'Pregnant or nursing' },
  { id: 'blood_thinners', label: 'Taking blood thinners' },
  { id: 'hormone_therapy', label: 'On hormone therapy or birth control' },
  { id: 'immune_medications', label: 'Taking medications that affect immune system' },
  { id: 'liver_issues', label: 'Liver condition or recent liver issues' },
  { id: 'recent_surgery', label: 'Recent surgery (within 3 months)' },
  { id: 'allergies', label: 'Known plant allergies' }
];


export const QuestionStep: React.FC<QuestionStepProps> = ({ step, onNext, answers }) => {
  const [selectedAnswer, setSelectedAnswer] = React.useState<any>(null);
  const [selectedMultiple, setSelectedMultiple] = React.useState<string[]>([]);
  const [safetyFlags, setSafetyFlags] = React.useState<Record<string, boolean>>({});
  const [allergiesText, setAllergiesText] = React.useState('');

  // Auto-advance function (called when answer is selected)
  const autoAdvance = (answer: any) => {
    if (step === 1) {
      onNext({ body_pattern: answer });
    } else if (step === 3) {
      onNext({ lifestyle: answer });
    } else if (step === 4) {
      onNext({ ritual_preference: answer });
    } else if (step === 6) {
      onNext({ spiritual_intention: answer });
    }
  };

  // Handle single-select with auto-advance
  const handleSingleSelect = (value: string) => {
    setSelectedAnswer(value);
    // Auto-advance after short delay for visual feedback
    setTimeout(() => autoAdvance(value), 300);
  };

  // Toggle multi-select (Q2, Q6)
  const toggleMultiSelect = (value: string) => {
    const newSelection = selectedMultiple.includes(value)
      ? selectedMultiple.filter(v => v !== value)
      : [...selectedMultiple, value];
    setSelectedMultiple(newSelection);
  };

  // Manual next for multi-select questions
  const handleMultiNext = () => {
    if (step === 2 && selectedMultiple.length > 0) {
      onNext({ organ_focus: selectedMultiple });
    } else if (step === 6 && selectedMultiple.length > 0) {
      onNext({ spiritual_intention: selectedMultiple });
    }
  };

  // Handle safety flags (Q5)
  const toggleSafetyFlag = (flagId: string) => {
    setSafetyFlags((prev) => ({
      ...prev,
      [flagId]: !prev[flagId],
    }));
  };

  const handleSafetyNext = () => {
    // Check if "None of the above" is the only selection
    const hasNone = safetyFlags['none'];
    const hasOthers = Object.keys(safetyFlags).some(key => key !== 'none' && safetyFlags[key]);
    
    if (hasNone && !hasOthers) {
      // Clear all flags if "None" selected
      onNext({ safety_flags: {}, allergies: '' });
    } else {
      onNext({ safety_flags: safetyFlags, allergies: allergiesText });
    }
  };

  const renderQuestion = () => {
    switch (step) {
      case 1:
        return (
          <div className="question-container">
            <h2 className="question-title">How would you describe your current state?</h2>
            <p className="question-subtitle">Choose what resonates most</p>
            <div className="options-grid">
              {BODY_PATTERNS.map((option) => (
                <button
                  key={option.value}
                  className={`option-btn ${selectedAnswer === option.value ? 'active' : ''}`}
                  onClick={() => handleSingleSelect(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );

case 2:
  return (
    <div className="question-container">
      <h2 className="question-title">Where is your attention needed most?</h2>
      <p className="question-subtitle">Select all that apply, then tap Next</p>
      <div className="options-grid">
        {ORGAN_FOCUS.map((option) => {
          const isSelected = selectedMultiple.includes(option);
          return (
            <button
              key={option}
              className={`option-btn ${isSelected ? 'active' : ''}`}
              onClick={() => toggleMultiSelect(option)}
            >
              {option}
            </button>
          );
        })}
      </div>
      <div className="button-group">
        <button
          className="btn btn-primary btn-lg"
          onClick={handleMultiNext}
          disabled={selectedMultiple.length === 0}
        >
          Next ({selectedMultiple.length} selected)
        </button>
      </div>
    </div>
  );

      case 3:
        return (
          <div className="question-container">
            <h2 className="question-title">What does your daily life look like?</h2>
            <p className="question-subtitle">Choose what fits best</p>
            <div className="options-grid">
              {LIFESTYLE.map((option) => (
                <button
                  key={option.value}
                  className={`option-btn ${selectedAnswer === option.value ? 'active' : ''}`}
                  onClick={() => handleSingleSelect(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="question-container">
            <h2 className="question-title">What's your relationship with ceremony / ritual?</h2>
            <p className="question-subtitle">This colors how we frame your recommendation</p>
            <div className="options-grid">
              {RITUAL_RELATIONSHIP.map((option) => (
                <button
                  key={option.value}
                  className={`option-btn ${selectedAnswer === option.value ? 'active' : ''}`}
                  onClick={() => handleSingleSelect(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="question-container">
            <h2 className="question-title">Before we recommend, let's check safety</h2>
            <p className="question-subtitle">Please confirm all that apply to you</p>
            <div className="safety-checkboxes">
              {UPDATED_SAFETY_FLAGS.map((flag) => (
                <div key={flag.id} className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    id={flag.id}
                    checked={safetyFlags[flag.id] || false}
                    onChange={() => toggleSafetyFlag(flag.id)}
                  />
                  <label htmlFor={flag.id}>{flag.label}</label>
                </div>
              ))}
              
              {/* None of the above option */}
              <div className="checkbox-wrapper">
                <input
                  type="checkbox"
                  id="none"
                  checked={safetyFlags['none'] || false}
                  onChange={() => {
                    if (!safetyFlags['none']) {
                      // If selecting "None", clear all others
                      setSafetyFlags({ none: true });
                    } else {
                      // If unchecking "None"
                      setSafetyFlags({ none: false });
                    }
                  }}
                />
                <label htmlFor="none"><strong>None of the above</strong></label>
              </div>

              {safetyFlags.allergies && (
                <div className="allergy-input-wrapper">
                  <input
                    type="text"
                    placeholder="List any plant allergies..."
                    value={allergiesText}
                    onChange={(e) => setAllergiesText(e.target.value)}
                    className="allergy-input"
                  />
                </div>
              )}
            </div>
            <div className="button-group">
              <button
                className="btn btn-primary"
                onClick={handleSafetyNext}
                disabled={Object.keys(safetyFlags).length === 0}
              >
                Next
              </button>
            </div>
          </div>
        );

case 6:
  return (
    <div className="question-container">
      <h2 className="question-title">What quality are you inviting in?</h2>
      <p className="question-subtitle">Select all that resonate</p>
      <div className="safety-checkboxes">
        {SPIRITUAL_INTENTION.map((option) => (
          <div key={option.value} className="checkbox-wrapper">
            <input
              type="checkbox"
              id={option.value}
              checked={selectedMultiple.includes(option.value)}
              onChange={() => toggleMultiSelect(option.value)}
            />
            <label htmlFor={option.value}>{option.label}</label>
          </div>
        ))}
      </div>
      <div className="button-group">
        <button
          className="btn btn-primary btn-lg"
          onClick={handleMultiNext}
          disabled={selectedMultiple.length === 0}
        >
          See My Ritual
        </button>
      </div>
    </div>
  );


      default:
        return null;
    }
  };

  return (
    <div className="question-step">
      <div className="progress-indicator">
        <span className="step-number">Question {step} of 6</span>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(step / 6) * 100}%` }}></div>
        </div>
      </div>

      {renderQuestion()}

      <style>{`
        .question-step {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding: 2rem;
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          min-height: 60vh;
          animation: fadeIn 0.3s ease-in;
          max-width: 900px;
          margin: 0 auto;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
  .question-step {
    padding: 1rem;
    border-radius: 0;
    min-height: 100vh;
  }

  .options-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .option-btn {
    padding: 1.25rem;
    font-size: 1rem;
    min-height: 56px;
  }

  .btn-lg {
    width: 100%;
    padding: 1rem;
    font-size: 1.125rem;
  }

  .question-title {
    font-size: 1.5rem;
  }
}

        .progress-indicator {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .step-number {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          font-weight: var(--font-weight-medium);
        }

        .progress-bar {
          height: 4px;
          background: var(--color-secondary);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--color-primary);
          transition: width 0.3s ease;
        }

        .question-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          flex: 1;
        }

        .question-title {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text);
          margin: 0;
        }

        .question-subtitle {
          font-size: var(--font-size-base);
          color: var(--color-text-secondary);
          margin: 0;
        }

        .options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .option-btn {
          padding: 1.25rem;
          border: 2px solid var(--color-border);
          background: transparent;
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: var(--font-size-base);
          color: var(--color-text);
          transition: all var(--duration-normal) var(--ease-standard);
          text-align: left;
          min-height: 60px;
          display: flex;
          align-items: center;
        }

        .option-btn:hover {
          border-color: var(--color-primary);
          background: var(--color-secondary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }

        .option-btn.active {
          border-color: var(--color-primary);
          background: var(--color-primary);
          color: var(--color-btn-primary-text);
        }

        .safety-checkboxes {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .checkbox-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: var(--radius-base);
          background: var(--color-secondary);
          transition: background var(--duration-fast);
        }

        .checkbox-wrapper:hover {
          background: var(--color-secondary-hover);
        }

        .checkbox-wrapper input {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: var(--color-primary);
        }

        .checkbox-wrapper label {
          cursor: pointer;
          font-size: var(--font-size-base);
          margin: 0;
          flex: 1;
        }

        .allergy-input-wrapper {
          margin-top: 1rem;
        }

        .allergy-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-base);
          font-size: var(--font-size-base);
          color: var(--color-text);
          background: var(--color-surface);
        }

        .button-group {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }

        .btn {
          padding: 0.875rem 2rem;
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

        .btn-primary:hover:not(:disabled) {
          background: var(--color-primary-hover);
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .question-step {
            padding: 1.5rem;
          }

          .options-grid {
            grid-template-columns: 1fr;
          }

          .question-title {
            font-size: var(--font-size-xl);
          }

          .option-btn {
            padding: 1rem;
            min-height: 50px;
          }
        }
      `}</style>
    </div>
  );
};

export default QuestionStep;
