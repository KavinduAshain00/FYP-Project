import { Navigate, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import LoadingScreen from "./ui/LoadingScreen";

const ease = [0.25, 0.1, 0.25, 1];

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <motion.div
        className="min-h-screen flex flex-col items-center justify-center bg-neutral-900 text-blue-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease }}
      >
        <LoadingScreen
          message="Checking your account…"
          subMessage="Taking you to your content"
          className="!min-h-0"
        />
      </motion.div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !user?.isAdmin) {
    toast.error("You need admin access to view this page.");
    return <Navigate to="/dashboard" replace />;
  }

  return children ?? <Outlet />;
};

export default ProtectedRoute;
