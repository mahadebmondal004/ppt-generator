import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { qpAPI } from '../api';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

export default function QPDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [stats, setStats] = useState({ totalPapers: 0, totalEvaluated: 0, avgScore: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [papersRes, evalsRes] = await Promise.all([
          qpAPI.getPapers(),
          qpAPI.getEvaluations()
        ]);
        
        const paperList = papersRes.data.papers || [];
        const evalList = evalsRes.data.evaluations || [];

        setPapers(paperList.slice(0, 4));
        setEvaluations(evalList.slice(0, 4));

        const completedEvals = evalList.filter(e => e.status === 'completed');
        const avg = completedEvals.length > 0
          ? Math.round(completedEvals.reduce((sum, e) => sum + ((e.totalMarks / e.maxMarks) * 100), 0) / completedEvals.length)
          : 0;

        setStats({
          totalPapers: paperList.length,
          totalEvaluated: evalList.length,
          avgScore: avg
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />

      {/* Hero */}
      <div className="dashboard-hero">
        <div className="container">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: '2.5rem' }}>👋</span>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Question Paper Portal
                </p>
                <h1 style={{ fontSize: '2rem', margin: 0 }}>Welcome back, {user?.name}</h1>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: 600, marginBottom: 32 }}>
              Generate syllabus-aligned exam sheets and perform instant AI rubric-based grading on handwritten student answer sheets.
            </p>
            <div style={{ display: 'flex', gap: 16 }}>
              <button
                id="btn-qp-generate-nav"
                className="btn btn-primary btn-lg"
                onClick={() => navigate('/qp-generate')}
                style={{ fontSize: '0.95rem', padding: '14px 32px' }}
              >
                ✨ Generate Question Paper
              </button>
              <button
                id="btn-qp-evaluate-nav"
                className="btn btn-ghost btn-lg"
                onClick={() => navigate('/qp-evaluate')}
                style={{ fontSize: '0.95rem', padding: '14px 32px', background: '#ffffff', border: '1.5px solid #e2e5f1' }}
              >
                📝 Evaluate Student Sheet
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '40px var(--space-lg)' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
          {[
            { icon: '📄', label: 'Papers Generated', value: stats.totalPapers },
            { icon: '📝', label: 'Student Sheets Graded', value: stats.totalEvaluated },
            { icon: '🎯', label: 'Average Score', value: `${stats.avgScore}%` },
            { icon: '⚡', label: 'Grading Time', value: '< 20s' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon">{s.icon}</div>
              <div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic content */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 40 }}>
          {/* Recent Papers */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 700 }}>Recent Question Papers</h3>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
            ) : papers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                No papers generated yet. Get started by creating one!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {papers.map(p => (
                  <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid #e2e5f1' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{p.topic}</h4>
                      <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.subject} · {p.grade} · {p.questionsCount} Questions
                      </p>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.75rem', padding: '6px 12px', border: '1px solid #e2e5f1', background: '#ffffff' }}
                      onClick={() => navigate(`/qp-evaluate?paperId=${p._id}`)}
                    >
                      Grade Sheet
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Evaluations */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 700 }}>Recent Evaluations</h3>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
            ) : evaluations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                No sheets evaluated yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {evaluations.map(e => (
                  <div
                    key={e._id}
                    onClick={() => navigate(`/qp-evaluation-result/${e._id}`)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid #e2e5f1', cursor: 'pointer', hover: { background: '#f8fafc' } }}
                  >
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {e.studentName}
                        {e.studentRegNo && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            ({e.studentRegNo})
                          </span>
                        )}
                      </h4>
                      <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Paper: {e.questionPaperId?.topic || 'General Topic'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '4px 8px', fontWeight: 600 }}>
                        {e.totalMarks}/{e.maxMarks}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
