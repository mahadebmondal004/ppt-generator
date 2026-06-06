import { useState, useEffect } from 'react';
import { useWizard } from '../../context/WizardContext';
import { curriculumAPI } from '../../api';

export default function Step4_Topics({ onNext, onBack }) {
  const { state, updateState } = useWizard();
  const [topics, setTopics] = useState([]);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.board || !state.grade || !state.subject) return;
    setLoading(true);
    curriculumAPI.getTopics(state.board, state.grade, state.subject).then(res => {
      setTopics(res.data.topics || []);
    }).catch(() => {
      setTopics([]);
    }).finally(() => setLoading(false));
  }, [state.board, state.grade, state.subject]);

  const handleTopicSelect = (topicName) => {
    updateState({ topic: topicName, subTopics: [] });
    setOpenAccordion(openAccordion === topicName ? null : topicName);
  };

  const toggleSubTopic = (subTopic) => {
    const current = state.subTopics || [];
    const exists = current.includes(subTopic);
    updateState({
      subTopics: exists ? current.filter(s => s !== subTopic) : [...current, subTopic]
    });
  };

  return (
    <div className="wizard-content">
      <h2>Select Topic & Sub-Topics</h2>
      <p className="step-description">
        Choose a topic from <strong style={{ color: 'var(--color-primary)' }}>{state.subject}</strong> and select the sub-topics to cover
      </p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : topics.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>📚</div>
          <p>No topics found. You can type your topic below:</p>
          <input
            className="form-input"
            style={{ maxWidth: 400, margin: '16px auto' }}
            placeholder="e.g. Photosynthesis, Quadratic Equations..."
            value={state.topic}
            onChange={e => updateState({ topic: e.target.value })}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {topics.map(topic => {
            const isOpen = openAccordion === topic.name;
            const isSelected = state.topic === topic.name;
            const selectedSubCount = (state.subTopics || []).filter(
              st => topic.subTopics?.map(s => s.name).includes(st)
            ).length;

            return (
              <div
                key={topic.name}
                className={`accordion-item ${isSelected ? 'has-selected' : ''}`}
              >
                <div
                  className="accordion-header"
                  id={`accordion-topic-${topic.name.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => handleTopicSelect(topic.name)}
                >
                  <div className="accordion-title">
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: isSelected ? 'var(--gradient-primary)' : 'var(--color-surface-3)',
                      border: isSelected ? 'none' : '2px solid var(--color-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.65rem', color: 'white', flexShrink: 0
                    }}>
                      {isSelected && '✓'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)' }}>
                        {topic.name}
                      </div>
                      {topic.description && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {topic.description}
                        </div>
                      )}
                    </div>
                    {selectedSubCount > 0 && (
                      <span className="badge badge-primary" style={{ fontSize: '0.65rem', marginLeft: 8 }}>
                        {selectedSubCount} selected
                      </span>
                    )}
                  </div>
                  <svg
                    className={`accordion-chevron ${isOpen ? 'open' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {isOpen && topic.subTopics && topic.subTopics.length > 0 && (
                  <div className="accordion-body">
                    {topic.subTopics.map(sub => (
                      <span
                        key={sub.name}
                        id={`chip-subtopic-${sub.name.replace(/\s+/g, '-').toLowerCase()}`}
                        className={`subtopic-chip ${(state.subTopics || []).includes(sub.name) ? 'selected' : ''}`}
                        onClick={e => { e.stopPropagation(); toggleSubTopic(sub.name); }}
                      >
                        {sub.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {state.topic && state.subTopics?.length > 0 && (
        <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem' }}>
          <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Selected: </span>
          <span style={{ color: 'var(--text-secondary)' }}>{state.topic} — {state.subTopics.join(', ')}</span>
        </div>
      )}

      <div className="wizard-nav">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button
          id="btn-next-topics"
          className="btn btn-primary"
          onClick={onNext}
          disabled={!state.topic}
        >
          Continue to Class Config →
        </button>
      </div>
    </div>
  );
}
