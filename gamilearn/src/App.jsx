import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet,
} from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from './components/ProtectedRoute';
import PageTransition from './components/PageTransition';
import AppShellLayout from './components/layout/AppShellLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Modules from './pages/Modules';
import CodeEditor from './pages/CodeEditor';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import AdminModuleEditor from './pages/AdminModuleEditor';

function PublicLayout() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={location.pathname}>
        <Outlet />
      </PageTransition>
    </AnimatePresence>
  );
}

function EditorShell() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={location.pathname}>
        <CodeEditor />
      </PageTransition>
    </AnimatePresence>
  );
}

function AdminGateLayout() {
  const { user } = useAuth();
  if (!user?.isAdmin) {
    toast.error('You need admin access to view this page.');
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

function AppRoutes() {
  const location = useLocation();
  const isEditorRoute = location.pathname.startsWith('/editor/');

  useEffect(() => {
    document.body.classList.toggle('prevent-text-copy', !isEditorRoute);
    return () => {
      document.body.classList.remove('prevent-text-copy');
    };
  }, [isEditorRoute]);

  return (
    <div
      style={{
        position: 'relative',
        overflowX: 'hidden',
        overflowY: 'auto',
        minHeight: '100vh',
        width: '100%',
      }}
    >
      <Routes location={location}>
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShellLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/modules" element={<Modules />} />
            <Route path="/profile" element={<Profile />} />
            <Route element={<AdminGateLayout />}>
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/modules/:moduleId" element={<AdminModuleEditor />} />
            </Route>
          </Route>
        </Route>

        <Route
          path="/editor/:moduleId"
          element={
            <ProtectedRoute>
              <EditorShell />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
