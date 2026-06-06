import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '', school: '' });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back! 🎉');
      } else {
        await register(form.name, form.email, form.password, form.school);
        toast.success('Account created! Welcome aboard 🚀');
      }
      const from = location.state?.from?.pathname;
      const activeModule = localStorage.getItem('activeModule') || 'ppt';
      const fallback = activeModule === 'ppt' ? '/dashboard' : '/qp-dashboard';
      navigate(from || fallback, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
      </div>

      <div className="login-container">
        {/* Brand */}
        <div className="login-brand">
          <div className="login-logo">🎓</div>
          <h1 className="login-title">AI Teacher PPT</h1>
          <p className="login-tagline">Generate curriculum-aligned slides & lesson plans in minutes</p>
        </div>

        {/* Card */}
        <div className="login-card">
          {/* Tabs */}
          <div className="login-tabs">
            <button
              id="tab-login"
              className={`login-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >Sign In</button>
            <button
              id="tab-register"
              className={`login-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => setMode('register')}
            >Create Account</button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  id="input-name"
                  className="form-input"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ms. Priya Sharma"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                id="input-email"
                className="form-input"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="teacher@school.edu"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="input-password"
                className="form-input"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">School Name <span style={{color:'var(--text-muted)',fontWeight:400}}>(optional)</span></label>
                <input
                  id="input-school"
                  className="form-input"
                  name="school"
                  value={form.school}
                  onChange={handleChange}
                  placeholder="Delhi Public School"
                />
              </div>
            )}

            <button
              id="btn-submit-auth"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner spinner-sm" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                mode === 'login' ? '✨ Sign In' : '🚀 Create Account'
              )}
            </button>
          </form>

          {/* Demo note */}
          <div className="login-demo-note">
            <span>💡 Quick demo: any email + password (6+ chars)</span>
          </div>
        </div>

        {/* Features */}
        <div className="login-features">
          {[
            { icon: '📊', text: 'CBSE & IGCSE' },
            { icon: '⬇️', text: '.pptx Download' },
          ].map(f => (
            <div key={f.text} className="login-feature-item">
              <span>{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 24px;
          background: linear-gradient(135deg, #eef2ff 0%, #faf5ff 50%, #f0fdf4 100%);
        }

        .login-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
        }

        .login-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(70px);
          animation: float 6s ease-in-out infinite;
        }

        .login-orb-1 {
          width: 500px; height: 500px;
          top: -200px; left: -150px;
          background: radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%);
        }

        .login-orb-2 {
          width: 400px; height: 400px;
          bottom: -150px; right: -100px;
          background: radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%);
          animation-delay: -3s;
        }

        .login-orb-3 {
          width: 300px; height: 300px;
          top: 50%; right: 20%;
          background: radial-gradient(circle, rgba(5,150,105,0.07) 0%, transparent 70%);
          animation-delay: -1.5s;
        }

        .login-container {
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
          position: relative;
          z-index: 1;
        }

        .login-brand { text-align: center; }

        .login-logo {
          font-size: 3rem;
          margin-bottom: 12px;
          display: block;
          animation: float 4s ease-in-out infinite;
          filter: drop-shadow(0 4px 12px rgba(79,70,229,0.20));
        }

        .login-title {
          font-size: 1.9rem;
          font-weight: 900;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
          letter-spacing: -0.03em;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .login-tagline { font-size: 0.88rem; color: #6b7280; line-height: 1.5; }

        .login-card {
          width: 100%;
          background: rgba(255,255,255,0.90);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1.5px solid rgba(226,229,241,0.9);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(255,255,255,0.8) inset;
        }

        .login-tabs {
          display: flex;
          border-bottom: 1.5px solid #e2e5f1;
          background: #f5f6fc;
        }

        .login-tab {
          flex: 1;
          padding: 15px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          background: none;
          border: none;
          color: #9ca3af;
          border-bottom: 2px solid transparent;
          transition: all 200ms cubic-bezier(0.4,0,0.2,1);
          font-family: var(--font-body);
          letter-spacing: -0.01em;
        }

        .login-tab:hover { color: #374151; background: rgba(79,70,229,0.04); }
        .login-tab.active { color: #4f46e5; border-bottom-color: #4f46e5; background: rgba(79,70,229,0.06); }

        .login-form {
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          background: transparent;
        }

        .login-demo-note {
          margin: 0 28px 20px;
          padding: 10px 14px;
          background: rgba(8,145,178,0.06);
          border: 1.5px solid rgba(8,145,178,0.18);
          border-radius: 8px;
          font-size: 0.78rem;
          color: #0891b2;
          text-align: center;
          font-weight: 500;
        }

        .login-features {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .login-feature-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: #6b7280;
          padding: 6px 12px;
          background: rgba(255,255,255,0.75);
          border: 1px solid rgba(226,229,241,0.8);
          border-radius: 20px;
          font-weight: 500;
          backdrop-filter: blur(8px);
        }
      `}</style>
    </div>
  );
}
