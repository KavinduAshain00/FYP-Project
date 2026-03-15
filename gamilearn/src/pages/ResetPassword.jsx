import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaLock, FaGamepad, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";
import { GameLayout } from "../components/layout/GameLayout";
import { authAPI } from "../api/api";

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
      const stored = sessionStorage.getItem('passwordResetToken');
      if (stored) setToken(stored);
    } catch (_) {}
  }, [searchParams]);

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
        sessionStorage.removeItem('passwordResetToken');
      } catch (_) {}
      setSuccess(true);
      toast.success("Password reset. Sign in with your new password.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed. Request a new link.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border-0 bg-transparent text-[#d8d0c4] placeholder-[#585048] focus:outline-none rounded-xl [&:-webkit-autofill]:!bg-[#161c28] [&:-webkit-autofill]:![-webkit-text-fill-color:#d8d0c4] [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#161c28]";
  const labelClass = "block text-sm font-medium text-[#a09888] mb-1";

  if (success) {
    return (
      <GameLayout showNavbar={false} showParticles={false}>
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md border border-[#252c3a] bg-[#111620] p-6 rounded-2xl text-center">
            <p className="text-[#d8d0c4] font-medium">Password updated. Redirecting to sign in…</p>
            <Link to="/login" className="mt-4 inline-block text-[#c8a040] hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout showNavbar={false} showParticles={false}>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md border border-[#252c3a] bg-[#111620] p-6 rounded-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 border border-[#2e3648] bg-[#1c2230] flex items-center justify-center mb-3 rounded-xl">
              <FaGamepad className="text-2xl text-[#c8a040]" />
            </div>
            <h1 className="text-xl font-bold text-[#d8d0c4]">Set new password</h1>
            <p className="text-sm text-[#706858] mt-1 text-center">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!searchParams.get("token") && (
              <div>
                <label className={labelClass}>Reset token</label>
                <div className="flex items-center gap-2 border border-[#252c3a] bg-[#161c28] rounded-xl focus-within:border-[#3a4258]">
                  <FaLock className="text-[#585048] ml-3 shrink-0" />
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste reset token"
                    className={inputClass}
                    autoComplete="one-time-code"
                  />
                </div>
              </div>
            )}
            <div>
              <label className={labelClass}>New password</label>
              <div className="flex items-center gap-2 border border-[#252c3a] bg-[#161c28] rounded-xl focus-within:border-[#3a4258]">
                <FaLock className="text-[#585048] ml-3 shrink-0" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Confirm new password</label>
              <div className="flex items-center gap-2 border border-[#252c3a] bg-[#161c28] rounded-xl focus-within:border-[#3a4258]">
                <FaLock className="text-[#585048] ml-3 shrink-0" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Confirm new password"
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 border border-[#3a4258] bg-[#1c2230] text-[#d8d0c4] font-medium hover:bg-[#242c3c] rounded-xl disabled:opacity-50 transition-colors"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>

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

export default ResetPassword;
