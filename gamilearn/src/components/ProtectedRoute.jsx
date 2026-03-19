import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import LoadingScreen from './ui/LoadingScreen';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1e1e1e] text-white">
        <LoadingScreen
          message="Checking your account…"
          subMessage="Taking you to your content"
          className="!min-h-0"
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !user?.isAdmin) {
    toast.error('You need admin access to view this page.');
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
