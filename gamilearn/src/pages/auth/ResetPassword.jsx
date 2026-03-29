import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FaLock, FaGamepad, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";
import { GameLayout } from "../../components/layout/GameLayout";
import { authAPI } from "../../api/api";

const ease = [0.25, 0.1, 0.25, 1];

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fromUrl = searchParams.get("token");
    if (fromUrl) {
      setToken(fromUrl);
      return;
    }
    try {
      const stored = sessionStorage.getItem("passwordResetToken");
      if (stored) setToken(stored);
    } catch {
      // ignore storage failures (private browsing, etc.)
    }
  }, [searchParams]);

  useEffect(() => {
    if (!success) return;
    const tid = setTimeout(() => navigate("/login"), 2000);
    return () => clearTimeout(tid);
  }, [success, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (!token.trim()) {
      toast.error("Reset link is invalid or expired. Request a new one.");
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword(token.trim(), newPassword);
      try {
        sessionStorage.removeItem("passwordResetToken");
      } catch {
        // ignore storage failures (private browsing, etc.)
      }
      setSuccess(true);
      toast.success("Password reset. Sign in with your new password.");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Reset failed. Request a new link.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    "w-full rounded-2xl bg-blue-800 pl-12 pr-4 py-3.5 text-blue-50 placeholder-blue-300 outline-none focus:outline focus:outline-2 focus:outline-blue-400/60 text-sm";

  if (success) {
    return (
      <GameLayout showNavbar={false} showParticles={false}>
        <div className="min-h-screen min-w-0 flex items-center justify-center px-4 py-10 sm:py-12 bg-neutral-900">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease }}
            className="w-full min-w-0 max-w-md rounded-3xl bg-blue-900 p-6 sm:p-8 text-center shadow-2xl shadow-black/40"
          >
            <p className="text-blue-50 font-medium">
              Password updated. Redirecting to sign in…
            </p>
            <Link
              to="/login"
              className="mt-4 inline-block font-semibold text-blue-200 hover:text-blue-100"
            >
              Sign in
            </Link>
          </motion.div>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout showNavbar={false} showParticles={false}>
      <div className="min-h-screen min-w-0 flex flex-col lg:flex-row bg-neutral-900">
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.42, ease }}
          className="w-full shrink-0 lg:w-[40%] flex flex-col justify-center p-6 sm:p-10 lg:p-12 bg-blue-900 relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-12 h-12 rounded-2xl bg-blue-800 flex items-center justify-center text-blue-50 shadow-lg shadow-black/40">
                <FaGamepad className="text-xl" />
              </span>
              <span className="font-bold text-blue-50">
                Choose a strong password
              </span>
            </div>
            <p className="text-sm text-blue-200 max-w-xs">
              After updating, sign in with your email and the new password.
            </p>
          </div>
        </motion.aside>

        <div className="flex-1 flex min-w-0 items-center justify-center p-5 sm:p-10">
          <motion.div
            className="w-full min-w-0 max-w-md rounded-3xl bg-blue-900 p-6 sm:p-8 shadow-2xl shadow-black/40"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.06, ease }}
          >
            <h1 className="text-2xl font-bold text-blue-50">
              Set new password
            </h1>
            <p className="text-sm text-blue-300 mt-2 mb-8">
              Enter your new password below.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!searchParams.get("token") && (
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Reset token
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 text-sm" />
                    <input
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Paste reset token"
                      className={fieldClass}
                      autoComplete="one-time-code"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  New password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 text-sm" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    className={fieldClass}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Confirm new password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 text-sm" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Confirm new password"
                    className={fieldClass}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-blue-500 text-black font-semibold text-sm shadow-md shadow-black/30 hover:bg-blue-400 active:scale-[0.99] transition-all disabled:opacity-45 disabled:saturate-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-blue-300">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 font-semibold text-blue-200 hover:text-blue-100"
              >
                <FaArrowLeft className="text-xs" /> Back to sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </GameLayout>
  );
};

export default ResetPassword;
