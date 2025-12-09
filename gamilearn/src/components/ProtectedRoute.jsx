import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const ProtectedRoute = ({ children, requireGameStudio = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#1e1e1e',
        color: 'white'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireGameStudio && !user?.gameStudioEnabled) {
    toast.info('Game Studio locked: complete your learning path to unlock it.');
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
