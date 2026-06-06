import { useState } from 'react';

const SLIDE_TYPES = ['content', 'intro', 'example', 'activity', 'summary'];

export default function SlideRegeneratePanel({ slide, index, onClose, onRegenerate }) {
  const [instructions, setInstructions] = useState('');
  const [slideType, setSlideType] = useState(slide.type || 'content');
  const [loading, setLoading] = useState(false);

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      await onRegenerate(instructions, slideType);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0 }}>🔄 Regenerate Slide {index + 1}</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Current: <em>{slide.title}</em>
            </p>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="form-label">Instructions for this slide</label>
            <textarea
              id="slide-regen-instructions"
              className="form-textarea"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="e.g. Add a worked example, include a diagram, explain the formula in detail..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Slide Type</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SLIDE_TYPES.map(t => (
                <button
                  key={t}
                  id={`slide-type-${t}`}
                  className={`btn btn-sm ${slideType === t ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ textTransform: 'capitalize' }}
                  onClick={() => setSlideType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
            <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
            <button
              id="btn-confirm-regen-slide"
              className="btn btn-primary"
              onClick={handleRegenerate}
              disabled={loading}
            >
              {loading ? <><div className="spinner spinner-sm" /> Regenerating...</> : '✨ Regenerate Slide'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
