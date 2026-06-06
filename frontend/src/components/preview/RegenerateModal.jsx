import { useState } from 'react';

const STYLE_OPTIONS = ['More Visual', 'More Text-Heavy', 'More Examples', 'Simpler Language', 'More Interactive'];
const DIFFICULTY_OPTIONS = ['basic', 'intermediate', 'advanced'];

export default function RegenerateModal({ onClose, onRegenerate, loading }) {
  const [instructions, setInstructions] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [style, setStyle] = useState('');

  const handleSubmit = () => {
    onRegenerate({
      additionalInstructions: instructions,
      difficultyLevel: difficulty || undefined,
      style: style || undefined
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0 }}>🔄 Regenerate All Slides</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>Optionally add instructions to guide the regeneration</p>
          </div>
          <button
            id="btn-close-regen-modal"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={onClose}
          >✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="form-label">Additional Instructions (optional)</label>
            <textarea
              id="regen-instructions"
              className="form-textarea"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="e.g. Focus more on real-world examples, add more diagrams, simplify the language..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Difficulty Level (optional)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {DIFFICULTY_OPTIONS.map(d => (
                <button
                  key={d}
                  id={`regen-difficulty-${d}`}
                  className={`btn btn-sm ${difficulty === d ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, textTransform: 'capitalize' }}
                  onClick={() => setDifficulty(difficulty === d ? '' : d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Style Adjustment (optional)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {STYLE_OPTIONS.map(s => (
                <span
                  key={s}
                  id={`regen-style-${s.replace(/\s+/g, '-').toLowerCase()}`}
                  className={`subtopic-chip ${style === s ? 'selected' : ''}`}
                  onClick={() => setStyle(style === s ? '' : s)}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
            <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
            <button
              id="btn-confirm-regen-all"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <><div className="spinner spinner-sm" /> Regenerating...</> : '✨ Regenerate All Slides'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
