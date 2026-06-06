import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { historyAPI } from '../api';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [recentGenerations, setRecentGenerations] = useState([]);
  const [stats, setStats] = useState({ total: 0, slides: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await historyAPI.getHistory(1);
        const gens = res.data.generations || [];
        setRecentGenerations(gens.slice(0, 4));
        setStats({
          total: res.data.pagination.total || 0,
          slides: gens.reduce((sum, g) => sum + (g.slideCount || 0), 0)
        });
      } catch (e) {
        // Not fatal
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const BOARD_COLORS = { CBSE: '#10b981', IGCSE: '#6366f1' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Navbar */}
      <Navbar />

      {/* Hero */}
      <div className="dashboard-hero">
        <div className="container">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: '2.5rem' }}>👋</span>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Welcome back
                </p>
                <h1 style={{ fontSize: '2rem', margin: 0 }}>{user?.name}</h1>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: 500, marginBottom: 32 }}>
              Create beautiful, curriculum-aligned presentations for your IGCSE & CBSE classes in under 2 minutes.
            </p>
            <button
              id="btn-create-new"
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/generate')}
              style={{ fontSize: '1rem', padding: '16px 40px' }}
            >
              ✨ Create New Presentation
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '40px var(--space-lg)' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
          {[
            { icon: '📊', label: 'Total Presentations', value: stats.total },
            { icon: '🗂️', label: 'Slides Generated', value: stats.slides },
            { icon: '⚡', label: 'Avg. Gen. Time', value: '< 60s' },
            { icon: '🏆', label: 'Boards Supported', value: 2 },
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

        {/* Recent */}
        {!loading && recentGenerations.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Recent Presentations</h2>
              <button
                id="btn-view-all-history"
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/history')}
              >View All →</button>
            </div>
            <div className="history-grid">
              {recentGenerations.map(g => (
                <div
                  key={g._id}
                  className="history-card"
                  onClick={() => navigate(`/preview/${g._id}`)}
                >
                  <div className="history-card-header">
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{g.topic}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                        {g.subject} · {g.grade}
                      </p>
                    </div>
                    <span
                      className={`badge badge-${g.status === 'completed' ? 'success' : g.status === 'failed' ? 'error' : 'warning'}`}
                      style={{ fontSize: '0.65rem' }}
                    >
                      {g.status}
                    </span>
                  </div>
                  <div className="history-meta">
                    <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{g.board}</span>
                    <span className="badge" style={{ fontSize: '0.65rem', background: 'var(--color-surface-3)', color: 'var(--text-muted)' }}>
                      {g.slideCount} slides
                    </span>
                    <span className="badge" style={{ fontSize: '0.65rem', background: 'var(--color-surface-3)', color: 'var(--text-muted)' }}>
                      {g.classDuration} min
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick start cards */}
        <h2 style={{ fontSize: '1.25rem', marginBottom: 20 }}>How it works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { step: '1', icon: '🎯', title: 'Choose Curriculum', desc: 'Select your board, grade, subject, and topic' },
            { step: '2', icon: '⚙️', title: 'Configure', desc: 'Set class duration, slide count, and style preferences' },
            { step: '3', icon: '🤖', title: 'AI Generates', desc: 'Advanced AI creates professional slides + lesson plan' },
            { step: '4', icon: '⬇️', title: 'Download', desc: 'Export as .pptx, .docx, or both in a ZIP file' },
          ].map(item => (
            <div key={item.step} className="card" style={{ textAlign: 'center', cursor: 'default' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                Step {item.step}
              </div>
              <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem' }}>{item.title}</h4>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
