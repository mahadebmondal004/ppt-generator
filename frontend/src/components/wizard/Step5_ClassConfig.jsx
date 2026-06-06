import { useWizard } from '../../context/WizardContext';

const DIFFICULTY_OPTIONS = [
  { value: 'basic', label: '🟢 Basic', desc: 'Simple language, minimal jargon, great for beginners' },
  { value: 'intermediate', label: '🟡 Intermediate', desc: 'Grade-appropriate terminology with clear explanations' },
  { value: 'advanced', label: '🔴 Advanced', desc: 'Technical depth, complex concepts, academic language' }
];

function Slider({ label, value, min, max, step, unit, onChange, hint }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="slider-wrapper">
      <div className="slider-header">
        <label className="form-label">{label}</label>
        <div>
          <span className="slider-value">{value}</span>
          <span className="slider-unit">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        className="range-input"
        min={min} max={max} step={step}
        value={value}
        style={{ '--slider-pct': `${pct}%` }}
        onChange={e => onChange(Number(e.target.value))}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        <span>{min}{unit}</span>
        {hint && <span style={{ color: 'var(--color-primary)' }}>{hint}</span>}
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

export default function Step5_ClassConfig({ onNext, onBack }) {
  const { state, updateState } = useWizard();

  const recommendedSlides = Math.round(state.classDuration / 3);
  const hint = `~1 slide per 3 min → ${recommendedSlides} slides recommended`;

  return (
    <div className="wizard-content">
      <h2>Class Configuration</h2>
      <p className="step-description">
        Configure the structure and depth of your generated presentation
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Duration */}
        <div className="card">
          <h4 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            ⏱️ Class Duration
          </h4>
          <Slider
            label="Total class time"
            value={state.classDuration}
            min={15} max={90} step={5}
            unit=" min"
            hint={hint}
            onChange={v => updateState({ classDuration: v })}
          />
        </div>

        {/* Slide count */}
        <div className="card">
          <h4 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            🗂️ Number of Slides
          </h4>
          <Slider
            label="Slides to generate"
            value={state.slideCount}
            min={5} max={30} step={1}
            unit=" slides"
            onChange={v => updateState({ slideCount: v })}
          />
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            💡 Recommended: <strong style={{ color: 'var(--color-primary)' }}>{recommendedSlides} slides</strong> for a {state.classDuration}-minute class
          </div>
        </div>

        {/* Difficulty */}
        <div className="card">
          <h4 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            📊 Difficulty Level
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {DIFFICULTY_OPTIONS.map(opt => (
              <div
                key={opt.value}
                id={`difficulty-${opt.value}`}
                style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${state.difficultyLevel === opt.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: state.difficultyLevel === opt.value ? 'var(--color-primary-light)' : 'var(--color-surface-2)',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16
                }}
                onClick={() => updateState({ difficultyLevel: opt.value })}
              >
                <div style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{opt.label}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{opt.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="wizard-nav">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button
          id="btn-next-config"
          className="btn btn-primary"
          onClick={onNext}
        >
          Continue to Images →
        </button>
      </div>
    </div>
  );
}
