import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WizardPage from './pages/WizardPage';
import PreviewPage from './pages/PreviewPage';
import HistoryPage from './pages/HistoryPage';
import QPDashboardPage from './pages/QPDashboardPage';
import QPWizardPage from './pages/QPWizardPage';
import QPEvaluatePage from './pages/QPEvaluatePage';
import QPEvaluationResultPage from './pages/QPEvaluationResultPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }
  // Save the intended location so login can redirect back to it
  return user ? children : <Navigate to="/login" state={{ from: location }} replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (user) {
    // Redirect to where the user was trying to go, or fall back to the active module dashboard
    const from = location.state?.from?.pathname;
    const activeModule = localStorage.getItem('activeModule') || 'ppt';
    const fallback = activeModule === 'qp' ? '/qp-dashboard' : '/dashboard';
    return <Navigate to={from || fallback} replace />;
  }
  return children;
}

function RootRedirect() {
  const activeModule = localStorage.getItem('activeModule') || 'ppt';
  return <Navigate to={activeModule === 'qp' ? '/qp-dashboard' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#0f172a',
              border: '1.5px solid #e2e5f1',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: 500,
              boxShadow: '0 8px 24px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.06)'
            },
            success: { iconTheme: { primary: '#059669', secondary: '#ffffff' } },
            error:   { iconTheme: { primary: '#dc2626', secondary: '#ffffff' } }
          }}
        />
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/generate" element={<ProtectedRoute><WizardPage /></ProtectedRoute>} />
          <Route path="/preview/:id" element={<ProtectedRoute><PreviewPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          
          {/* Question Paper & Evaluation Dashboard routes */}
          <Route path="/qp-dashboard" element={<ProtectedRoute><QPDashboardPage /></ProtectedRoute>} />
          <Route path="/qp-generate" element={<ProtectedRoute><QPWizardPage /></ProtectedRoute>} />
          <Route path="/qp-evaluate" element={<ProtectedRoute><QPEvaluatePage /></ProtectedRoute>} />
          <Route path="/qp-evaluation-result/:id" element={<ProtectedRoute><QPEvaluationResultPage /></ProtectedRoute>} />

          <Route path="/" element={<ProtectedRoute><RootRedirect /></ProtectedRoute>} />
          <Route path="*" element={<ProtectedRoute><RootRedirect /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
