import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { qpAPI } from '../api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

export default function QPEvaluationResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        const res = await qpAPI.getEvaluationDetails(id);
        setEvaluation(res.data.evaluation);
      } catch (e) {
        toast.error('Failed to load evaluation details');
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluation();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="spinner spinner-lg" />
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '60px var(--space-lg)' }}>
          <h3>Evaluation Not Found</h3>
          <button className="btn btn-primary" onClick={() => navigate('/qp-dashboard')} style={{ marginTop: '16px' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const paper = evaluation.questionPaperId || {};

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />

      <div className="container" style={{ padding: '40px var(--space-lg)' }}>
        
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, borderBottom: '1px solid #e2e5f1', paddingBottom: '16px' }}>
          <div>
            <span className="badge badge-success" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              Grading Completed
            </span>
            <h2 style={{ margin: '6px 0 0', fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              Evaluation: {evaluation.studentName}
              {evaluation.studentRegNo && (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500, background: 'var(--color-bg-secondary)', padding: '2px 8px', borderRadius: 6 }}>
                  #{evaluation.studentRegNo}
                </span>
              )}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Paper: {paper.topic || 'General Assessment'} ({paper.subject} · {paper.grade})
            </p>
          </div>
          <div className="no-print" style={{ display: 'flex', gap: 12 }}>
            <button
              className="btn btn-ghost"
              onClick={() => navigate('/qp-dashboard')}
              style={{ fontSize: '0.85rem', border: '1px solid #e2e5f1', background: '#ffffff' }}
            >
              Back to Dashboard
            </button>
            <button
              className="btn btn-primary"
              onClick={handlePrint}
              style={{ fontSize: '0.85rem' }}
            >
              🖨️ Print Report Card
            </button>
          </div>
        </div>

        {/* Score Banner */}
        <div className="card" style={{ display: 'flex', gap: 30, padding: '24px', marginBottom: 30, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: '#ffffff', border: 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '12px 30px', background: 'rgba(255,255,255,0.15)', borderRadius: '16px', backdropFilter: 'blur(8px)' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 900 }}>
              {evaluation.totalMarks}
            </span>
            <span style={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
              out of {evaluation.maxMarks}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>AI Grading Report Summary</h3>
            <p style={{ margin: '6px 0 0', fontSize: '0.9rem', opacity: 0.9, lineHeight: 1.5, maxWidth: 650 }}>
              {evaluation.feedbackSummary}
            </p>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 30 }}>
          <div className="card" style={{ padding: '24px', borderLeft: '5px solid #10b981' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ✓ Key Strengths
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', lineHeight: 1.6 }}>
              {evaluation.strengths?.map((s, idx) => <li key={idx}>{s}</li>) || <li>No specific strengths recorded.</li>}
            </ul>
          </div>

          <div className="card" style={{ padding: '24px', borderLeft: '5px solid #f59e0b' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ⚠ Areas of Improvement
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', lineHeight: 1.6 }}>
              {evaluation.weaknesses?.map((w, idx) => <li key={idx}>{w}</li>) || <li>No improvement points recorded.</li>}
            </ul>
          </div>
        </div>

        {/* Split Screen Grader View */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
          {/* Left panel: Transcribed Text */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              📖 Student Answer Script
            </h3>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', fontSize: '0.875rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#334155', minHeight: '280px', maxHeight: '500px', overflowY: 'auto' }}>
              {evaluation.studentAnswers || 'No text content extracted.'}
            </div>
            <p style={{ margin: '10px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              * Handwriting digitized via layout-aware OCR transcription engines.
            </p>
          </div>

          {/* Right panel: Question-by-Question breakdown */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 700 }}>
              🎯 Question Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {evaluation.gradedResults?.map(res => {
                const q = paper.questions?.find(x => x.questionNumber === res.questionNumber) || {};
                const key = paper.answerKey?.find(x => x.questionNumber === res.questionNumber) || {};
                return (
                  <div key={res.questionNumber} style={{ border: '1.5px solid #e2e5f1', borderRadius: '12px', padding: '16px', background: 'var(--color-bg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                        Q{res.questionNumber} ({q.marks || res.maxMarks} Marks)
                      </span>
                      <span className={`badge badge-${res.marksAwarded >= (q.marks || res.maxMarks)*0.8 ? 'success' : 'warning'}`} style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                        Awarded: {res.marksAwarded}/{q.marks || res.maxMarks}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {q.text || `Question ${res.questionNumber} details`}
                    </p>

                    <div style={{ fontSize: '0.8rem', background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px dashed #cbd5e1', marginBottom: 10 }}>
                      <strong>Model Key:</strong> {key.modelAnswer}
                    </div>

                    <div style={{ fontSize: '0.825rem', color: '#475569', lineHeight: 1.4 }}>
                      <strong>AI Grader Notes: </strong> {res.feedback}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: '0.75rem', color: res.rubricMatched ? '#059669' : '#d97706', fontWeight: 600 }}>
                      <span>{res.rubricMatched ? '✓' : '⚠'}</span>
                      <span>{res.rubricMatched ? 'Rubric criteria fully satisfied' : 'Some rubrics missed or partially met'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
