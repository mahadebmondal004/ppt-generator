import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { historyAPI } from '../api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const STATUS_COLORS = {
  completed: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
  failed: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  generating: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  pending: { bg: 'rgba(99,102,241,0.1)', color: '#6366f1', border: 'rgba(99,102,241,0.3)' }
};

export default function HistoryPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [generations, setGenerations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    try {
      const res = await historyAPI.getHistory(p);
      setGenerations(res.data.generations);
      setTotalPages(res.data.pagination.pages || 1);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(page);
  }, [page]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this presentation?')) return;
    try {
      await historyAPI.deleteItem(id);
      setGenerations(prev => prev.filter(g => g._id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />

      <div className="container" style={{ padding: '40px var(--space-lg)' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '1.8rem' }}>📚 Presentation History</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            All your generated presentations — click to preview and download
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : generations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎯</div>
            <h3>No presentations yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              Create your first AI-generated presentation
            </p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/generate')}>
              ✨ Create First Presentation
            </button>
          </div>
        ) : (
          <>
            <div className="history-grid">
              {generations.map(g => {
                const statusStyle = STATUS_COLORS[g.status] || STATUS_COLORS.pending;
                return (
                  <div
                    key={g._id}
                    id={`history-card-${g._id}`}
                    className="history-card"
                    onClick={() => g.status === 'completed' && navigate(`/preview/${g._id}`)}
                    style={{ cursor: g.status === 'completed' ? 'pointer' : 'default' }}
                  >
                    <div className="history-card-header">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {g.topic}
                        </h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                          {new Date(g.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div style={{
                        padding: '3px 10px', borderRadius: 'var(--radius-full)',
                        background: statusStyle.bg, color: statusStyle.color,
                        border: `1px solid ${statusStyle.border}`,
                        fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                        whiteSpace: 'nowrap'
                      }}>
                        {g.status}
                      </div>
                    </div>

                    <div className="history-meta" style={{ margin: '10px 0' }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{g.board}</span>
                      <span className="badge" style={{ fontSize: '0.65rem', background: 'var(--color-surface-3)', color: 'var(--text-muted)' }}>{g.grade}</span>
                      <span className="badge" style={{ fontSize: '0.65rem', background: 'var(--color-surface-3)', color: 'var(--text-muted)' }}>{g.subject}</span>
                      <span className="badge" style={{ fontSize: '0.65rem', background: 'var(--color-surface-3)', color: 'var(--text-muted)' }}>{g.slideCount} slides</span>
                    </div>

                    <div className="history-actions">
                      {g.status === 'completed' && (
                        <button
                          id={`btn-preview-${g._id}`}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1 }}
                          onClick={e => { e.stopPropagation(); navigate(`/preview/${g._id}`); }}
                        >
                          👁️ Preview
                        </button>
                      )}
                      <button
                        id={`btn-delete-${g._id}`}
                        className="btn btn-danger btn-sm"
                        onClick={e => handleDelete(g._id, e)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                >← Prev</button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                >Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
