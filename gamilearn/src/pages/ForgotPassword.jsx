import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaGamepad, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";
import { GameLayout } from "../components/layout/GameLayout";
import { authAPI } from "../api/api";

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
          sessionStorage.setItem('passwordResetToken', token);
        } catch (_) {}
      }
      toast.success(res.data?.message || "Check your email for reset instructions.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border-0 bg-transparent text-[#d8d0c4] placeholder-[#585048] focus:outline-none rounded-xl [&:-webkit-autofill]:!bg-[#161c28] [&:-webkit-autofill]:![-webkit-text-fill-color:#d8d0c4] [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#161c28]";
  const labelClass = "block text-sm font-medium text-[#a09888] mb-1";

  return (
    <GameLayout showNavbar={false} showParticles={false}>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md border border-[#252c3a] bg-[#111620] p-6 rounded-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 border border-[#2e3648] bg-[#1c2230] flex items-center justify-center mb-3 rounded-xl">
              <FaGamepad className="text-2xl text-[#c8a040]" />
            </div>
            <h1 className="text-xl font-bold text-[#d8d0c4]">Forgot password</h1>
            <p className="text-sm text-[#706858] mt-1 text-center">
              Enter your email and we’ll help you reset your password.
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Email</label>
                <div className="flex items-center gap-2 border border-[#252c3a] bg-[#161c28] rounded-xl focus-within:border-[#3a4258]">
                  <FaEnvelope className="text-[#585048] ml-3 shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className={inputClass}
                    autoComplete="email"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 border border-[#3a4258] bg-[#1c2230] text-[#d8d0c4] font-medium hover:bg-[#242c3c] rounded-xl disabled:opacity-50 transition-colors"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-[#a09888]">
                If an account exists for that email, you can reset your password.
              </p>
              {resetToken ? (
                <button
                  type="button"
                  onClick={() => navigate(`/reset-password?token=${encodeURIComponent(resetToken)}`)}
                  className="w-full py-3 border border-[#3a4258] bg-[#1c2230] text-[#c8a040] font-medium hover:bg-[#242c3c] rounded-xl transition-colors"
                >
                  Set new password
                </button>
              ) : null}
            </div>
          )}

          <p className="mt-6 text-center text-sm text-[#706858]">
            <Link to="/login" className="inline-flex items-center gap-2 font-medium text-[#c8a040] hover:underline">
              <FaArrowLeft className="text-xs" /> Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </GameLayout>
  );
};

export default ForgotPassword;
