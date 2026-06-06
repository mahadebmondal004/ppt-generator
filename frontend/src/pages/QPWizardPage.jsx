import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { curriculumAPI, qpAPI } from '../api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

export default function QPWizardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [boards, setBoards] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  // Form state
  const [form, setForm] = useState({
    board: '',
    grade: '',
    subject: '',
    topic: '',
    difficulty: 'medium',
    questionsCount: '5',
    totalMarks: '25'
  });

  const [files, setFiles] = useState([]);
  const [generatedPaper, setGeneratedPaper] = useState(null);
  const [activeTab, setActiveTab] = useState('paper'); // 'paper' | 'answers'

  // Fetch boards on mount
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const res = await curriculumAPI.getBoards();
        setBoards(res.data.boards || []);
      } catch (e) {
        toast.error('Failed to load boards');
      }
    };
    fetchBoards();
  }, []);

  // Board change
  const handleBoardChange = async (board) => {
    setForm(prev => ({ ...prev, board, grade: '', subject: '', topic: '' }));
    setGrades([]); setSubjects([]); setTopics([]);
    if (!board) return;
    try {
      const res = await curriculumAPI.getGrades(board);
      setGrades(res.data.grades || []);
    } catch (e) {
      toast.error('Failed to load grades');
    }
  };

  // Grade change
  const handleGradeChange = async (grade) => {
    setForm(prev => ({ ...prev, grade, subject: '', topic: '' }));
    setSubjects([]); setTopics([]);
    if (!grade) return;
    try {
      const res = await curriculumAPI.getSubjects(form.board, grade);
      setSubjects(res.data.subjects || []);
    } catch (e) {
      toast.error('Failed to load subjects');
    }
  };

  // Subject change
  const handleSubjectChange = async (subject) => {
    setForm(prev => ({ ...prev, subject, topic: '' }));
    setTopics([]);
    if (!subject) return;
    try {
      const res = await curriculumAPI.getTopics(form.board, form.grade, subject);
      setTopics(res.data.topics || []);
    } catch (e) {
      toast.error('Failed to load topics');
    }
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGeneratedPaper(null);

    const formData = new FormData();
    Object.keys(form).forEach(key => formData.append(key, form[key]));
    files.forEach(f => formData.append('files', f));

    try {
      const initRes = await qpAPI.generate(formData);
      const paperId = initRes.data.paperId;
      toast.success('AI generation started! ⚡');

      // Poll paper status
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        if (attempts > 40) {
          clearInterval(interval);
          setLoading(false);
          toast.error('Generation timed out. Please try again.');
          return;
        }

        try {
          const detailRes = await qpAPI.getPaperDetails(paperId);
          const paper = detailRes.data.paper;
          if (paper.status === 'completed') {
            clearInterval(interval);
            setGeneratedPaper(paper);
            setLoading(false);
            toast.success('Question paper generated! 🎉');
          } else if (paper.status === 'failed') {
            clearInterval(interval);
            setLoading(false);
            toast.error('AI generation failed.');
          }
        } catch (err) {
          clearInterval(interval);
          setLoading(false);
          toast.error('Failed to fetch generation status.');
        }
      }, 2000);

    } catch (err) {
      setLoading(false);
      toast.error(err.response?.data?.message || 'Failed to start generation');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />

      <div className="container" style={{ padding: '40px var(--space-lg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: generatedPaper ? '1fr' : '1fr', gap: 30, maxWidth: 900, margin: '0 auto' }}>
          
          {/* Main Card */}
          {!generatedPaper && (
            <div className="card" style={{ padding: '32px' }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                  <button
                    type="button"
                    onClick={() => navigate('/qp-dashboard')}
                    className="btn btn-ghost btn-icon btn-sm"
                    style={{ padding: '6px 10px', fontSize: '1.1rem', cursor: 'pointer', border: '1.5px solid #e2e5f1', background: '#ffffff', color: 'var(--text-secondary)' }}
                    title="Back to Dashboard"
                  >
                    ←
                  </button>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>✨ Generate Question Paper</h2>
                </div>
                <p style={{ margin: '4px 0 0 44px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Create fully tailored school exam sheets in seconds
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Board, Grade, Subject */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Curriculum Board</label>
                    <select
                      className="form-input"
                      value={form.board}
                      onChange={(e) => handleBoardChange(e.target.value)}
                      required
                    >
                      <option value="">Select Board</option>
                      {boards.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Grade / Class</label>
                    <select
                      className="form-input"
                      value={form.grade}
                      onChange={(e) => handleGradeChange(e.target.value)}
                      disabled={!form.board}
                      required
                    >
                      <option value="">Select Grade</option>
                      {grades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Subject</label>
                    <select
                      className="form-input"
                      value={form.subject}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      disabled={!form.grade}
                      required
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Lesson Topic</label>
                    <select
                      className="form-input"
                      value={form.topic}
                      onChange={(e) => setForm(prev => ({ ...prev, topic: e.target.value }))}
                      disabled={!form.subject}
                      required
                    >
                      <option value="">Select Topic</option>
                      {topics.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Count, Marks, Difficulty */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Questions Count</label>
                    <select
                      className="form-input"
                      value={form.questionsCount}
                      onChange={(e) => setForm(prev => ({ ...prev, questionsCount: e.target.value }))}
                    >
                      <option value="3">3 Questions</option>
                      <option value="5">5 Questions</option>
                      <option value="10">10 Questions</option>
                      <option value="15">15 Questions</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Total Marks</label>
                    <input
                      className="form-input"
                      type="number"
                      value={form.totalMarks}
                      onChange={(e) => setForm(prev => ({ ...prev, totalMarks: e.target.value }))}
                      min="5"
                      max="100"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Difficulty Level</label>
                    <select
                      className="form-input"
                      value={form.difficulty}
                      onChange={(e) => setForm(prev => ({ ...prev, difficulty: e.target.value }))}
                    >
                      <option value="easy">🟢 Easy</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="hard">🔴 Hard</option>
                    </select>
                  </div>
                </div>

                {/* Upload context */}
                <div className="form-group">
                  <label className="form-label">
                    Upload Reference Context <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional PDF/DOCX)</span>
                  </label>
                  <input
                    type="file"
                    className="form-input"
                    multiple
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.doc,.txt"
                  />
                  <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Add worksheets or specific notes to align the generated questions with your classroom materials.
                  </p>
                </div>

                <button
                  id="btn-qp-submit"
                  type="submit"
                  className="btn btn-primary btn-lg btn-full"
                  disabled={loading}
                  style={{ marginTop: 12 }}
                >
                  {loading ? (
                    <>
                      <div className="spinner spinner-sm" style={{ marginRight: 8 }} />
                      Creating Question Paper...
                    </>
                  ) : (
                    '✨ Generate Questions & Rubrics'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Results Area */}
          {generatedPaper && (
            <div className="card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid #e2e5f1', paddingBottom: '16px' }}>
                <div>
                  <span className="badge badge-primary" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    {generatedPaper.board} · {generatedPaper.grade}
                  </span>
                  <h2 style={{ margin: '4px 0 0', fontSize: '1.4rem', fontWeight: 800 }}>{generatedPaper.topic}</h2>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Difficulty: {generatedPaper.difficulty.toUpperCase()} · Max Marks: {generatedPaper.totalMarks}
                  </p>
                </div>
                <div className="no-print" style={{ display: 'flex', gap: 12 }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setGeneratedPaper(null)}
                    style={{ fontSize: '0.85rem', border: '1px solid #e2e5f1', background: '#ffffff' }}
                  >
                    Reset Form
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handlePrint}
                    style={{ fontSize: '0.85rem' }}
                  >
                    🖨️ Print / Save PDF
                  </button>
                </div>
              </div>

              {/* Tabs Switcher */}
              <div className="no-print" style={{ display: 'flex', borderBottom: '2px solid #e2e5f1', marginBottom: 24 }}>
                <button
                  onClick={() => setActiveTab('paper')}
                  style={{
                    border: 'none',
                    background: 'none',
                    padding: '12px 24px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: activeTab === 'paper' ? '#4f46e5' : '#64748b',
                    borderBottom: activeTab === 'paper' ? '3px solid #4f46e5' : '3px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  📄 Question Paper
                </button>
                <button
                  onClick={() => setActiveTab('answers')}
                  style={{
                    border: 'none',
                    background: 'none',
                    padding: '12px 24px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: activeTab === 'answers' ? '#4f46e5' : '#64748b',
                    borderBottom: activeTab === 'answers' ? '3px solid #4f46e5' : '3px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  🔑 Answer Key & Rubrics
                </button>
              </div>

              {/* Tab: Paper */}
              {activeTab === 'paper' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: 16 }}>
                    <h3 style={{ margin: 0, textTransform: 'uppercase', fontSize: '1rem', letterSpacing: '0.05em' }}>
                      {generatedPaper.subject} Assessment
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Time Allowed: 45 Minutes | Maximum Marks: {generatedPaper.totalMarks}
                    </p>
                  </div>
                  {generatedPaper.questions.map((q, idx) => (
                    <div key={q.questionNumber} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          Q{q.questionNumber}. {q.text}
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--color-primary)', minWidth: 60, textAlign: 'right' }}>
                          [{q.marks} M]
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>
                        Type: {q.type === 'mcq' ? 'Multiple Choice' : q.type === 'long' ? 'Long Answer' : 'Short Answer'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab: Answers */}
              {activeTab === 'answers' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {generatedPaper.answerKey.map(ak => {
                    const q = generatedPaper.questions.find(x => x.questionNumber === ak.questionNumber) || {};
                    return (
                      <div key={ak.questionNumber} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 20 }}>
                        <h4 style={{ margin: '0 0 8px', color: 'var(--color-primary)' }}>
                          Question {ak.questionNumber} ({q.marks} Marks)
                        </h4>
                        <div style={{ fontSize: '0.875rem', marginBottom: 12, background: 'var(--color-bg)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                          <strong>Model Answer: </strong> {ak.modelAnswer}
                        </div>
                        <div>
                          <strong>Evaluation Rubrics:</strong>
                          <ul style={{ margin: '6px 0 0', paddingLeft: '20px', fontSize: '0.85rem' }}>
                            {ak.rubrics.map((r, i) => <li key={i} style={{ marginBottom: 4 }}>{r}</li>)}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
