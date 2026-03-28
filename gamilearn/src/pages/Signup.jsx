import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBookOpen,
  FaRocket,
  FaShieldAlt,
  FaStar,
  FaUser,
  FaEnvelope,
  FaLock,
  FaGamepad,
} from "react-icons/fa";
import { GameLayout } from "../components/layout/GameLayout";
import { getNetworkErrorMessage } from "../api/api";

const ease = [0.25, 0.1, 0.25, 1];

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInitialSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setStep(2);
  };

  const handleJSAnswer = async (answer) => {
    setLoading(true);
    setError("");
    try {
      if (
        !formData.name.trim() ||
        !formData.email.trim() ||
        !formData.password
      ) {
        setError("Please complete all required fields");
        setStep(1);
        return;
      }
      const user = await signup(
        formData.name.trim(),
        formData.email.trim(),
        formData.password,
        answer,
      );
      if (user.learningPath === "javascript-basics") {
        navigate("/dashboard?message=start-basics");
      } else {
        navigate("/dashboard?message=start-advanced");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError(getNetworkErrorMessage(err, "Signup failed. Please try again."));
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    "w-full rounded-2xl bg-blue-800 pl-12 pr-4 py-3.5 text-blue-50 placeholder-blue-300 outline-none focus:outline focus:outline-2 focus:outline-blue-400/60 text-sm";

  const stepIndicator = (
    <div className="flex items-center gap-3 mb-8">
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold ${
          step === 1
            ? "bg-blue-500 text-black shadow-md shadow-black/25"
            : "bg-blue-700 text-blue-300"
        }`}
      >
        1
      </div>
      <div className="h-1 flex-1 max-w-[48px] rounded-full bg-blue-700 overflow-hidden">
        <div
          className={`h-full rounded-full bg-blue-400 transition-all ${step === 2 ? "w-full" : "w-0"}`}
        />
      </div>
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold ${
          step === 2
            ? "bg-blue-500 text-black shadow-md shadow-black/25"
            : "bg-blue-700 text-blue-300"
        }`}
      >
        2
      </div>
      <span className="text-xs text-blue-300 ml-2">Account → Path</span>
    </div>
  );

  if (step === 2) {
    return (
      <GameLayout showNavbar={false} showParticles={false}>
        <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-900">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease }}
            className="lg:w-[38%] flex flex-col justify-center p-8 sm:p-12 bg-blue-900 relative overflow-hidden"
          >
            <div className="relative z-10 flex items-center gap-3 mb-6">
              <span className="w-11 h-11 rounded-xl bg-blue-800 flex items-center justify-center text-blue-50">
                <FaBookOpen />
              </span>
              <span className="font-bold text-blue-50">Choose your path</span>
            </div>
            <p className="relative z-10 text-blue-100 text-sm leading-relaxed max-w-xs">
              This only sets your starting modules. You can still explore
              everything later from the modules page.
            </p>
          </motion.aside>
          <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
            <motion.div
              className="w-full max-w-lg"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: 0.05, ease }}
            >
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-200 hover:text-blue-100 mb-6"
              >
                <FaArrowLeft /> Back to details
              </button>
              {stepIndicator}
              <h1 className="text-2xl font-bold text-blue-50">
                How well do you know JavaScript?
              </h1>
              <p className="text-blue-300 text-sm mt-2 mb-8">
                Pick the option that best describes you-we will line up the
                right first lessons.
              </p>
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => handleJSAnswer(true)}
                  disabled={loading}
                  className="w-full text-left rounded-2xl bg-blue-900 p-5 shadow-lg shadow-black/30 hover:bg-blue-800 transition-all disabled:bg-blue-900 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-4">
                    <span className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 text-black shadow-md shadow-black/25">
                      <FaRocket className="text-lg" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-blue-50">
                          I already code in JavaScript
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-amber-500 text-blue-950 shadow-sm">
                          Fast track
                        </span>
                      </div>
                      <p className="text-sm text-blue-200">
                        Skip the basics and start closer to game projects.
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleJSAnswer(false)}
                  disabled={loading}
                  className="w-full text-left rounded-2xl bg-blue-900 p-5 shadow-lg shadow-black/30 hover:bg-blue-800 transition-all disabled:bg-blue-900 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-4">
                    <span className="w-12 h-12 rounded-xl bg-blue-700 flex items-center justify-center shrink-0 text-black shadow-md shadow-black/25">
                      <FaStar className="text-lg" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-blue-50">
                          I am new or want a full review
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-emerald-400/90 text-blue-950 shadow-sm">
                          Guided
                        </span>
                      </div>
                      <p className="text-sm text-blue-200">
                        Start from JavaScript fundamentals, then unlock the rest
                        in order.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
              {loading && (
                <div className="mt-8 flex items-center justify-center gap-3 text-blue-300 text-sm">
                  <span className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                  Creating your account…
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout showNavbar={false} showParticles={false}>
      <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-900">
        <motion.aside
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease }}
          className="lg:w-[44%] xl:w-[40%] flex flex-col justify-between p-8 sm:p-12 lg:p-14 bg-blue-900 relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <span className="w-12 h-12 rounded-2xl bg-blue-800 flex items-center justify-center text-blue-50 shadow-lg shadow-black/40">
                <FaGamepad className="text-xl" />
              </span>
              <div>
                <p className="font-bold text-lg text-blue-50">GamiLearn</p>
                <p className="text-xs text-blue-300">
                  Create your learner profile
                </p>
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-blue-50 leading-tight max-w-md">
              Two quick steps: account, then skill level
            </h2>
          </div>
          <p className="relative z-10 text-xs text-blue-300 hidden lg:block">
            Already registered?{" "}
            <Link
              to="/login"
              className="text-blue-200 font-medium hover:text-blue-100"
            >
              Sign in
            </Link>
          </p>
        </motion.aside>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.06, ease }}
          >
            <div className="lg:hidden mb-6">
              <Link to="/login" className="text-sm font-medium text-blue-200">
                Already have an account? Sign in
              </Link>
            </div>
            {stepIndicator}
            <h1 className="text-2xl font-bold text-blue-50">
              Create your account
            </h1>
            <p className="text-blue-300 text-sm mt-2 mb-8">
              We use this to save XP, modules, and achievements across devices.
            </p>

            {error && (
              <div className="mb-6 rounded-2xl bg-blue-800 px-4 py-3 text-blue-200 text-sm flex items-start gap-3">
                <FaShieldAlt className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleInitialSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Name
                </label>
                <div className="relative">
                  <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 text-sm" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="How should we greet you?"
                    className={fieldClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Email
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 text-sm" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className={fieldClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 text-sm" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="At least 6 characters"
                    className={fieldClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Confirm password
                </label>
                <div className="relative">
                  <FaShieldAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 text-sm" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Same as above"
                    className={fieldClass}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-blue-500 text-black font-semibold text-sm shadow-md shadow-black/30 hover:bg-blue-400 active:scale-[0.99] transition-all disabled:opacity-45 disabled:saturate-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Continue <FaArrowRight className="text-xs" />
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-blue-300 hidden lg:block">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-blue-200 hover:text-blue-100"
              >
                Login
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </GameLayout>
  );
};

export default Signup;
