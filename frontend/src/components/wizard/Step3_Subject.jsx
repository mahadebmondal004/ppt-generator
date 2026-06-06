import { useState, useEffect } from 'react';
import { useWizard } from '../../context/WizardContext';
import { curriculumAPI } from '../../api';

const SUBJECT_ICONS = {
  Mathematics: '📐', Science: '🔬', Physics: '⚛️', Chemistry: '🧪',
  Biology: '🧬', English: '📖', 'English Language': '✍️', History: '🏛️',
  Geography: '🌍', 'Computer Science': '💻', Economics: '📈',
  Accountancy: '🧾', 'Business Studies': '💼', Hindi: '🇮🇳',
  Sanskrit: '📜', 'Social Science': '🌐', 'Environmental Studies': '🌿',
  'Art & Design': '🎨', 'Information Technology': '🖥️'
};

export default function Step3_Subject({ onNext, onBack }) {
  const { state, updateState } = useWizard();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.board || !state.grade) return;
    setLoading(true);
    curriculumAPI.getSubjects(state.board, state.grade).then(res => {
      setSubjects(res.data.subjects || []);
    }).catch(() => {
      setSubjects(['Mathematics', 'Science', 'English', 'Social Science', 'Hindi']);
    }).finally(() => setLoading(false));
  }, [state.board, state.grade]);

  const handleSelect = (subject) => {
    updateState({ subject, topic: '', subTopics: [] });
  };

  return (
    <div className="wizard-content">
      <h2>Select Subject</h2>
      <p className="step-description">
        Subjects available for <strong style={{ color: 'var(--color-primary)' }}>{state.board} · {state.grade}</strong>
      </p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : (
        <div className="tile-grid tile-grid-3">
          {subjects.map(subject => (
            <div
              key={subject}
              id={`tile-subject-${subject.replace(/\s+/g, '-').toLowerCase()}`}
              className={`selection-tile ${state.subject === subject ? 'selected' : ''}`}
              onClick={() => handleSelect(subject)}
            >
              <div className="tile-icon">{SUBJECT_ICONS[subject] || '📚'}</div>
              <div className="tile-title">{subject}</div>
            </div>
          ))}
        </div>
      )}

      <div className="wizard-nav">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button
          id="btn-next-subject"
          className="btn btn-primary"
          onClick={onNext}
          disabled={!state.subject}
        >
          Continue to Topics →
        </button>
      </div>
    </div>
  );
}
