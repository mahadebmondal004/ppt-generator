import { useWizard } from '../../context/WizardContext';

const IMAGE_OPTIONS = [
  {
    value: 'none',
    icon: '🚫',
    title: 'No Images',
    desc: 'Text-only slides — faster generation, cleaner layout'
  },
  {
    value: 'ai',
    icon: '🤖',
    title: 'AI-Sourced Images',
    desc: 'Relevant stock photos automatically matched to each slide topic'
  },
  {
    value: 'textbook',
    icon: '📚',
    title: 'Textbook Style',
    desc: 'Diagrams, tables, and curriculum-standard visual references'
  },
  {
    value: 'both',
    icon: '✨',
    title: 'Both (Recommended)',
    desc: 'AI stock photos + textbook-style diagrams where appropriate'
  }
];

export default function Step6_Images({ onNext, onBack }) {
  const { state, updateState } = useWizard();

  return (
    <div className="wizard-content">
      <h2>Image & Visual Preferences</h2>
      <p className="step-description">
        Should the AI include visual elements in your slides?
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {IMAGE_OPTIONS.map(opt => {
          const selected = state.imagePreference === opt.value;
          return (
            <div
              key={opt.value}
              id={`image-pref-${opt.value}`}
              style={{
                padding: '20px 24px',
                borderRadius: 'var(--radius-lg)',
                border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: selected ? 'var(--color-primary-light)' : 'var(--color-surface)',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                display: 'flex',
                alignItems: 'center',
                gap: 20
              }}
              onClick={() => updateState({ imagePreference: opt.value })}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 'var(--radius-md)',
                background: selected ? 'var(--gradient-primary)' : 'var(--color-surface-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', flexShrink: 0
              }}>
                {opt.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: selected ? 'var(--color-primary)' : 'var(--text-primary)', marginBottom: 4 }}>
                  {opt.title}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{opt.desc}</div>
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: selected ? 'var(--gradient-primary)' : 'transparent',
                border: `2px solid ${selected ? 'transparent' : 'var(--color-border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', color: 'white', flexShrink: 0
              }}>
                {selected && '✓'}
              </div>
            </div>
          );
        })}
      </div>

      {state.imagePreference !== 'none' && (
        <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--color-accent)' }}>
          💡 Tip: Images require an Unsplash API key in the backend <code>.env</code>. Without it, slides render beautifully without images.
        </div>
      )}

      <div className="wizard-nav">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button
          id="btn-next-images"
          className="btn btn-primary"
          onClick={onNext}
        >
          Continue to Upload →
        </button>
      </div>
    </div>
  );
}
