import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
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
    "w-full px-3 py-2 border-0 bg-transparent text-[#d8d0c4] placeholder-[#585048] focus:outline-none rounded-xl [&:-webkit-autofill]:!bg-[#161c28] [&:-webkit-autofill]:![-webkit-text-fill-color:#d8d0c4] [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#161c28]";
  const labelClass = "block text-sm font-medium text-[#a09888] mb-1";

  if (step === 2) {
    return (
      <GameLayout showNavbar={false} showParticles={false}>
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg border border-[#252c3a] bg-[#111620] p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-[#9a9080] hover:text-[#d8d0c4] text-sm"
            >
              <FaArrowLeft /> Back
            </button>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 border border-[#2e3648] bg-[#1c2230] flex items-center justify-center text-sm font-bold text-[#706858] rounded-lg">
                1
              </span>
              <span className="w-6 h-0.5 bg-[#2e3648]" />
              <span className="w-8 h-8 border-2 border-[#c8a040] bg-[#1c2230] flex items-center justify-center text-sm font-bold text-[#c8a040] rounded-lg">
                2
              </span>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 border border-[#2e3648] bg-[#1c2230] flex items-center justify-center rounded-xl">
              <FaBookOpen className="text-2xl text-[#c8a040]" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-[#d8d0c4] text-center mb-2">
            Choose Your Starting Path
          </h2>
          <p className="text-[#706858] text-sm text-center mb-6">
            Select the lane that matches your JavaScript experience
          </p>

          <div className="space-y-4">
            <button
              onClick={() => handleJSAnswer(true)}
              disabled={loading}
              className="w-full p-4 border border-[#252c3a] bg-[#161c28] text-left rounded-xl hover:border-[#3a4258] hover:bg-[#1c2230] disabled:opacity-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 border border-[#2e3648] bg-[#1c2230] flex items-center justify-center shrink-0 rounded-xl">
                  <FaRocket className="text-[#4e9a8e] text-lg" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-[#d8d0c4]">
                      Experienced Coder
                    </h3>
                    <span className="px-2 py-0.5 border border-[#4e9a8e]/40 bg-[#4e9a8e]/10 text-xs font-bold text-[#4e9a8e] rounded-lg">
                      FAST TRACK
                    </span>
                  </div>
                  <p className="text-[#9a9080] text-sm">
                    I can work with JavaScript and want to dive into game
                    development
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleJSAnswer(false)}
              disabled={loading}
              className="w-full p-4 border border-[#252c3a] bg-[#161c28] text-left rounded-xl hover:border-[#3a4258] hover:bg-[#1c2230] disabled:opacity-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 border border-[#2e3648] bg-[#1c2230] flex items-center justify-center shrink-0 rounded-xl">
                  <FaStar className="text-[#c8a040] text-lg" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-[#d8d0c4]">New Explorer</h3>
                    <span className="px-2 py-0.5 border border-[#c8a040]/40 bg-[#c8a040]/10 text-xs font-bold text-[#c8a040] rounded-lg">
                      GUIDED
                    </span>
                  </div>
                  <p className="text-[#9a9080] text-sm">
                    I'm new to JavaScript and want to learn from the basics
                  </p>
                </div>
              </div>
            </button>
          </div>

          {loading && (
            <div className="mt-6 flex items-center justify-center gap-2 text-[#9a9080] text-sm">
              <span className="w-4 h-4 border-2 border-[#4e9a8e] border-t-transparent rounded-full animate-spin" />
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
        <div className="w-full max-w-md border border-[#252c3a] bg-[#111620] p-6 rounded-2xl">
        <div className="flex justify-center gap-2 mb-6">
          <span className="w-8 h-8 border-2 border-[#c8a040] bg-[#1c2230] flex items-center justify-center text-sm font-bold text-[#c8a040] rounded-lg">
            1
          </span>
          <span className="w-6 h-0.5 bg-[#2e3648] self-center" />
          <span className="w-8 h-8 border border-[#2e3648] bg-[#1c2230] flex items-center justify-center text-sm font-bold text-[#585048] rounded-lg">
            2
          </span>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 border border-[#2e3648] bg-[#1c2230] flex items-center justify-center mb-2 rounded-xl">
            <FaUser className="text-xl text-[#c8a040]" />
          </div>
          <h1 className="text-xl font-bold text-[#d8d0c4]">
            Create Your Character
          </h1>
          <p className="text-sm text-[#706858] mt-1">
            Begin your coding adventure
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 border border-[#6b3a3a] bg-[#2a1818] text-[#d08080] text-sm flex items-center gap-2 rounded-xl">
            <FaShieldAlt /> {error}
          </div>
        )}

        <form onSubmit={handleInitialSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Name</label>
            <div className="flex items-center gap-2 border border-[#252c3a] bg-[#161c28] rounded-xl focus-within:border-[#3a4258]">
              <FaUser className="text-[#585048] ml-3" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your name"
                className={inputClass + " rounded-xl"}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <div className="flex items-center gap-2 border border-[#252c3a] bg-[#161c28] rounded-xl focus-within:border-[#3a4258]">
              <FaEnvelope className="text-[#585048] ml-3" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className={inputClass + " rounded-xl"}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <div className="flex items-center gap-2 border border-[#252c3a] bg-[#161c28] rounded-xl focus-within:border-[#3a4258]">
              <FaLock className="text-[#585048] ml-3" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="At least 6 characters"
                className={inputClass + " rounded-xl"}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Confirm Password</label>
            <div className="flex items-center gap-2 border border-[#252c3a] bg-[#161c28] rounded-xl focus-within:border-[#3a4258]">
              <FaShieldAlt className="text-[#585048] ml-3" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
                className={inputClass + " rounded-xl"}
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 border border-[#3a4258] bg-[#1c2230] text-[#d8d0c4] font-medium hover:bg-[#242c3c] rounded-xl transition-colors"
          >
            <span className="flex items-center justify-center gap-2">
              <FaArrowRight /> Continue to Skill Selection
            </span>
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#706858]">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-[#c8a040] hover:underline"
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
