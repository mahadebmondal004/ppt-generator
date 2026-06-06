import { useState, useEffect } from 'react';
import { useWizard } from '../../context/WizardContext';
import { curriculumAPI } from '../../api';

const BOARD_INFO = {
  CBSE: {
    icon: '🇮🇳',
    color: '#10b981',
    description: 'Central Board of Secondary Education',
    detail: 'National curriculum · Grades 1–12 · All subjects'
  },
  IGCSE: {
    icon: '🌍',
    color: '#6366f1',
    description: 'International General Certificate',
    detail: 'Cambridge curriculum · Grades 9–12 · International'
  }
};

export default function Step1_Board({ onNext }) {
  const { state, updateState } = useWizard();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    curriculumAPI.getBoards().then(res => {
      setBoards(res.data.boards);
    }).catch(() => {
      setBoards([
        { name: 'CBSE', fullName: 'Central Board of Secondary Education', description: 'National curriculum board of India — Grades 1–12' },
        { name: 'IGCSE', fullName: 'International General Certificate of Secondary Education', description: 'International Cambridge curriculum — Grades 9–12' }
      ]);
    }).finally(() => setLoading(false));
  }, []);

  const handleSelect = (board) => {
    updateState({ board: board.name, grade: '', subject: '', topic: '', subTopics: [] });
  };

  return (
    <div className="wizard-content">
      <h2>Select Curriculum Board</h2>
      <p className="step-description">Which curriculum board are you teaching under?</p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : (
        <div className="tile-grid tile-grid-2">
          {boards.map(board => {
            const info = BOARD_INFO[board.name] || {};
            const selected = state.board === board.name;
            return (
              <div
                key={board.name}
                id={`tile-board-${board.name.toLowerCase()}`}
                className={`selection-tile ${selected ? 'selected' : ''}`}
                onClick={() => handleSelect(board)}
                style={{ padding: '32px 24px', textAlign: 'left', position: 'relative' }}
              >
                {selected && (
                  <div style={{
                    position: 'absolute', top: 16, right: 16,
                    width: 24, height: 24, borderRadius: '50%',
                    background: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', color: 'white', fontWeight: 700
                  }}>✓</div>
                )}
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{info.icon}</div>
                <div style={{
                  fontSize: '1.8rem', fontWeight: 900, marginBottom: 8,
                  fontFamily: 'var(--font-display)',
                  color: selected ? 'var(--color-primary)' : 'var(--text-primary)'
                }}>
                  {board.name}
                </div>
                <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  {board.fullName}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {board.description}
                </div>
                {info.detail && (
                  <div style={{
                    marginTop: 14, padding: '6px 12px', borderRadius: 'var(--radius-full)',
                    background: 'rgba(99,102,241,0.1)', display: 'inline-block',
                    fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 600
                  }}>
                    {info.detail}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="wizard-nav">
        <div />
        <button
          id="btn-next-board"
          className="btn btn-primary"
          onClick={onNext}
          disabled={!state.board}
        >
          Continue to Grade →
        </button>
      </div>
    </div>
  );
}
