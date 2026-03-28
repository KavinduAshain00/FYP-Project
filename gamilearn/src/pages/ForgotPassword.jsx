import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaEnvelope, FaGamepad, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";
import { GameLayout } from "../components/layout/GameLayout";
import { authAPI } from "../api/api";

const ease = [0.25, 0.1, 0.25, 1];

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(email.trim().toLowerCase());
      setSent(true);
      if (res.data?.resetToken) {
        const token = res.data.resetToken;
        setResetToken(token);
        try {
          sessionStorage.setItem("passwordResetToken", token);
        } catch {
          // ignore storage failures (private browsing, etc.)
        }
      }
      toast.success(
        res.data?.message || "Check your email for reset instructions.",
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Something went wrong. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    "w-full rounded-2xl bg-blue-800 pl-12 pr-4 py-3.5 text-blue-50 placeholder-blue-300 outline-none focus:outline focus:outline-2 focus:outline-blue-400/60 text-sm";

  return (
    <GameLayout showNavbar={false} showParticles={false}>
      <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-900">
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.42, ease }}
          className="lg:w-[40%] flex flex-col justify-center p-8 sm:p-12 bg-blue-900 relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-12 h-12 rounded-2xl bg-blue-800 flex items-center justify-center text-blue-50 shadow-lg shadow-black/40">
                <FaGamepad className="text-xl" />
              </span>
              <span className="font-bold text-blue-50">GamiLearn</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-blue-50 leading-tight max-w-sm">
              Reset access in a few steps
            </h2>
            <p className="mt-4 text-sm text-blue-200 max-w-xs">
              We will email instructions if an account matches your address.
            </p>
          </div>
        </motion.aside>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <motion.div
            className="w-full max-w-md rounded-3xl bg-blue-900 p-8 shadow-2xl shadow-black/40"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.06, ease }}
          >
            <h1 className="text-2xl font-bold text-blue-50">Forgot password</h1>
            <p className="text-sm text-blue-300 mt-2 mb-8">
              Enter the email you used to register.
            </p>

            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 text-sm" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className={fieldClass}
                      autoComplete="email"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-blue-500 text-black font-semibold text-sm shadow-md shadow-black/30 hover:bg-blue-400 active:scale-[0.99] transition-all disabled:opacity-45 disabled:saturate-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <p className="text-sm text-blue-200">
                  If an account exists for that email, you can reset your
                  password.
                </p>
                {resetToken ? (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/reset-password?token=${encodeURIComponent(resetToken)}`,
                      )
                    }
                    className="w-full py-3.5 rounded-2xl bg-blue-700 text-black font-semibold text-sm hover:bg-blue-600"
                  >
                    Set new password
                  </button>
                ) : null}
              </motion.div>
            )}

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

export default ForgotPassword;
