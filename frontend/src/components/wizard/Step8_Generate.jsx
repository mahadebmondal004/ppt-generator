import { useState, useEffect, useRef } from 'react';
import { generateAPI } from '../../api';

const GENERATION_STEPS = [
  { id: 'parse', label: 'Processing inputs & uploaded files' },
  { id: 'think', label: 'Analyzing curriculum requirements' },
  { id: 'slides', label: 'Generating PPT slides with AI' },
  { id: 'lesson', label: 'Creating structured lesson plan' },
  { id: 'compile', label: 'Compiling final presentation' },
  { id: 'done', label: 'Generation complete!' },
];

export default function Step8_Generate({ generationId, onComplete, isStarted }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [polling, setPolling] = useState(false);
  const [failed, setFailed] = useState(false);
  const intervalRef = useRef(null);
  const stepTimerRef = useRef(null);

  // Animate through steps visually
  useEffect(() => {
    if (!isStarted) return;
    setStepIndex(0);
    let idx = 0;
    const advance = () => {
      idx++;
      if (idx < GENERATION_STEPS.length - 1) {
        setStepIndex(idx);
        const delay = idx === 2 ? 8000 : idx === 3 ? 6000 : 2000; // Longer for AI steps
        stepTimerRef.current = setTimeout(advance, delay);
      }
    };
    stepTimerRef.current = setTimeout(advance, 1500);
    return () => clearTimeout(stepTimerRef.current);
  }, [isStarted]);

  // Poll backend for completion
  useEffect(() => {
    if (!generationId || polling) return;
    setPolling(true);

    const poll = async () => {
      try {
        const res = await generateAPI.getStatus(generationId);
        const { status } = res.data;
        if (status === 'completed') {
          clearInterval(intervalRef.current);
          setStepIndex(GENERATION_STEPS.length - 1);
          setTimeout(() => onComplete(generationId), 1200);
        } else if (status === 'failed') {
          clearInterval(intervalRef.current);
          setFailed(true);
        }
      } catch (e) {
        console.error('Poll error:', e.message);
      }
    };

    intervalRef.current = setInterval(poll, 2000);
    poll(); // Initial check

    return () => clearInterval(intervalRef.current);
  }, [generationId]);

  return (
    <div className="generating-screen">
      {/* Orb */}
      <div className="generating-orb">
        {failed ? '❌' : stepIndex === GENERATION_STEPS.length - 1 ? '✅' : '🤖'}
      </div>

      <div>
        <h2 style={{ textAlign: 'center', marginBottom: 8 }}>
          {failed ? 'Generation Failed' : stepIndex === GENERATION_STEPS.length - 1 ? 'Done! Redirecting...' : 'AI is Working...'}
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          {failed
            ? 'Something went wrong. Please try again.'
            : stepIndex === GENERATION_STEPS.length - 1
              ? 'Your presentation is ready!'
              : 'AI is generating your curriculum-aligned content'}
        </p>
      </div>

      {!failed && (
        <>
          {/* Progress bar */}
          <div className="progress-bar-outer" style={{ width: '100%', maxWidth: 400 }}>
            <div
              className="progress-bar-inner"
              style={{ width: `${((stepIndex + 1) / GENERATION_STEPS.length) * 100}%` }}
            />
          </div>

          {/* Steps */}
          <div className="generation-steps">
            {GENERATION_STEPS.map((step, idx) => {
              const status = idx < stepIndex ? 'done' : idx === stepIndex ? 'active' : 'waiting';
              return (
                <div key={step.id} className={`generation-step ${status}`}>
                  <div className={`step-dot ${status}`} />
                  <span style={{ fontWeight: status === 'active' ? 600 : 400 }}>
                    {idx < stepIndex ? '✓ ' : ''}{step.label}
                  </span>
                  {status === 'active' && <div className="spinner spinner-sm" style={{ marginLeft: 'auto' }} />}
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 400, textAlign: 'center' }}>
            Generation typically takes 30–60 seconds. Please don't close this tab.
          </p>
        </>
      )}
    </div>
  );
}
