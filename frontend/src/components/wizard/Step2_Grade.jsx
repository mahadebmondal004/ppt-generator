import { useState, useEffect } from 'react';
import { useWizard } from '../../context/WizardContext';
import { curriculumAPI } from '../../api';

export default function Step2_Grade({ onNext, onBack }) {
  const { state, updateState } = useWizard();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.board) return;
    setLoading(true);
    curriculumAPI.getGrades(state.board).then(res => {
      setGrades(res.data.grades || []);
    }).catch(() => {
      const fallback = state.board === 'CBSE'
        ? Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)
        : ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
      setGrades(fallback);
    }).finally(() => setLoading(false));
  }, [state.board]);

  const handleSelect = (grade) => {
    updateState({ grade, subject: '', topic: '', subTopics: [] });
  };

  return (
    <div className="wizard-content">
      <h2>Select Grade</h2>
      <p className="step-description">
        Choose the grade level for <strong style={{ color: 'var(--color-primary)' }}>{state.board}</strong>
      </p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : (
        <div className="tile-grid tile-grid-4">
          {grades.map(grade => (
            <div
              key={grade}
              id={`tile-grade-${grade.replace(/\s+/g, '-').toLowerCase()}`}
              className={`grade-tile ${state.grade === grade ? 'selected' : ''}`}
              onClick={() => handleSelect(grade)}
            >
              {grade}
            </div>
          ))}
        </div>
      )}

      <div className="wizard-nav">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button
          id="btn-next-grade"
          className="btn btn-primary"
          onClick={onNext}
          disabled={!state.grade}
        >
          Continue to Subject →
        </button>
      </div>
    </div>
  );
}
