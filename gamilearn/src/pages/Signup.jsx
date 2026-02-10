import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBookOpen,
  FaCheckCircle,
  FaRocket,
  FaShieldAlt,
  FaStar,
  FaUser,
  FaEnvelope,
  FaLock,
} from "react-icons/fa";
import { GameLayout } from "../components/layout/GameLayout";

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
        setLoading(false);
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
      setError(
        err.response?.data?.message ||
          err.message ||
          "Signup failed. Please try again.",
      );
      setStep(1);
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border-0 bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1";

  if (step === 2) {
    return (
      <GameLayout showNavbar={false} showParticles={false}>
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg border border-gray-700 bg-gray-900/80 p-6 rounded-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-200 text-sm"
            >
              <FaArrowLeft /> Back
            </button>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 border border-gray-600 flex items-center justify-center text-sm font-bold text-gray-400 rounded">
                1
              </span>
              <span className="w-6 h-0.5 bg-gray-600" />
              <span className="w-8 h-8 border-2 border-gray-500 bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-200 rounded">
                2
              </span>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 border border-gray-600 flex items-center justify-center rounded-lg">
              <FaBookOpen className="text-2xl text-gray-400" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-100 text-center mb-2">
            Choose Your Starting Path
          </h2>
          <p className="text-gray-400 text-sm text-center mb-6">
            Select the lane that matches your JavaScript experience
          </p>

          <div className="space-y-4">
            <button
              onClick={() => handleJSAnswer(true)}
              disabled={loading}
              className="w-full p-4 border border-gray-600 bg-gray-800 text-left rounded-lg hover:border-gray-500 hover:bg-gray-700 disabled:opacity-50"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 border border-gray-500 flex items-center justify-center shrink-0 rounded">
                  <FaRocket className="text-gray-400 text-lg" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-100">
                      Experienced Coder
                    </h3>
                    <span className="px-2 py-0.5 border border-gray-500 text-xs font-bold text-gray-400 rounded">
                      FAST TRACK
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    I can work with JavaScript and want to dive into game
                    development
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleJSAnswer(false)}
              disabled={loading}
              className="w-full p-4 border border-gray-600 bg-gray-800 text-left rounded-lg hover:border-gray-500 hover:bg-gray-700 disabled:opacity-50"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 border border-gray-500 flex items-center justify-center shrink-0 rounded">
                  <FaStar className="text-gray-400 text-lg" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-100">New Explorer</h3>
                    <span className="px-2 py-0.5 border border-gray-500 text-xs font-bold text-gray-400 rounded">
                      GUIDED
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    I'm new to JavaScript and want to learn from the basics
                  </p>
                </div>
              </div>
            </button>
          </div>

          {loading && (
            <div className="mt-6 flex items-center justify-center gap-2 text-gray-400 text-sm">
              <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
              Creating your account...
            </div>
          )}
          </div>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout showNavbar={false} showParticles={false}>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md border border-gray-700 bg-gray-900/80 p-6 rounded-lg backdrop-blur-sm">
        <div className="flex justify-center gap-2 mb-6">
          <span className="w-8 h-8 border-2 border-gray-500 bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-200 rounded">
            1
          </span>
          <span className="w-6 h-0.5 bg-gray-600" />
          <span className="w-8 h-8 border border-gray-600 flex items-center justify-center text-sm font-bold text-gray-500 rounded">
            2
          </span>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 border border-gray-600 flex items-center justify-center mb-2 rounded-lg">
            <FaUser className="text-xl text-gray-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-100">
            Create Your Character
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Begin your coding adventure
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 border border-red-600 bg-red-900/30 text-red-300 text-sm flex items-center gap-2 rounded">
            <FaShieldAlt /> {error}
          </div>
        )}

        <form onSubmit={handleInitialSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Name</label>
            <div className="flex items-center gap-2 border border-gray-600 bg-gray-800 rounded focus-within:border-gray-500">
              <FaUser className="text-gray-500 ml-3" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your name"
                className={inputClass + " rounded"}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <div className="flex items-center gap-2 border border-gray-600 bg-gray-800 rounded focus-within:border-gray-500">
              <FaEnvelope className="text-gray-500 ml-3" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className={inputClass + " rounded"}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <div className="flex items-center gap-2 border border-gray-600 bg-gray-800 rounded focus-within:border-gray-500">
              <FaLock className="text-gray-500 ml-3" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="At least 6 characters"
                className={inputClass + " rounded"}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Confirm Password</label>
            <div className="flex items-center gap-2 border border-gray-600 bg-gray-800 rounded focus-within:border-gray-500">
              <FaShieldAlt className="text-gray-500 ml-3" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
                className={inputClass + " rounded"}
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 border border-gray-600 bg-gray-800 text-gray-100 font-medium hover:bg-gray-700 rounded"
          >
            <span className="flex items-center justify-center gap-2">
              <FaArrowRight /> Continue to Skill Selection
            </span>
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-cyan-400 hover:underline"
          >
            Login here
          </Link>
        </p>
        </div>
      </div>
    </GameLayout>
  );
};

export default Signup;
