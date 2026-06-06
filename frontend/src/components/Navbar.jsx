import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const currentModule = localStorage.getItem('activeModule') || 'ppt';

  const handleModuleChange = (module) => {
    localStorage.setItem('activeModule', module);
    navigate(module === 'ppt' ? '/dashboard' : '/qp-dashboard');
  };

  return (
    <nav className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', background: '#ffffff', borderBottom: '1.5px solid #e2e5f1', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', color: 'var(--color-primary)' }} onClick={() => navigate('/')}>
        <div className="logo-icon" style={{ fontSize: '1.4rem' }}>🎓</div>
        <span>AI Teacher Suite</span>
      </div>

      {/* Module Switcher Dropdown/Tabs */}
      <div style={{ display: 'flex', background: '#f1f3f9', padding: '4px', borderRadius: '10px', border: '1px solid #e2e5f1' }}>
        <button
          onClick={() => handleModuleChange('ppt')}
          style={{
            border: 'none',
            padding: '6px 16px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: currentModule === 'ppt' ? '#ffffff' : 'transparent',
            color: currentModule === 'ppt' ? '#4f46e5' : '#64748b',
            boxShadow: currentModule === 'ppt' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          🗂️ PPT Gen
        </button>
        <button
          onClick={() => handleModuleChange('qp')}
          style={{
            border: 'none',
            padding: '6px 16px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: currentModule === 'qp' ? '#ffffff' : 'transparent',
            color: currentModule === 'qp' ? '#4f46e5' : '#64748b',
            boxShadow: currentModule === 'qp' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          📝 Paper & Evaluator
        </button>
      </div>

      <div className="navbar-actions" style={{ display: 'flex', gap: '8px' }}>
        {currentModule === 'ppt' ? (
          <button
            id="btn-nav-history"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/history')}
            style={{ fontSize: '0.825rem' }}
          >
            📚 History
          </button>
        ) : (
          <button
            id="btn-nav-qp-dashboard"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/qp-dashboard')}
            style={{ fontSize: '0.825rem' }}
          >
            📊 QP Dashboard
          </button>
        )}
        <button
          id="btn-nav-logout"
          className="btn btn-ghost btn-sm"
          onClick={logout}
          style={{ fontSize: '0.825rem' }}
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}
