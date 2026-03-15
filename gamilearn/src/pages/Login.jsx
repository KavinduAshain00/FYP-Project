import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { FaEnvelope, FaLock, FaGamepad, FaArrowRight } from 'react-icons/fa';
import { GameLayout } from '../components/layout/GameLayout';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 border-0 bg-transparent text-[#d8d0c4] placeholder-[#585048] focus:outline-none rounded-xl [&:-webkit-autofill]:!bg-[#161c28] [&:-webkit-autofill]:![-webkit-text-fill-color:#d8d0c4] [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#161c28]';
  const labelClass = 'block text-sm font-medium text-[#a09888] mb-1';

  return (
    <GameLayout showNavbar={false} showParticles={false}>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md border border-[#252c3a] bg-[#111620] p-6 rounded-2xl">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 border border-[#2e3648] bg-[#1c2230] flex items-center justify-center mb-3 rounded-xl">
            <FaGamepad className="text-2xl text-[#c8a040]" />
          </div>
          <h1 className="text-xl font-bold text-[#d8d0c4]">GamiLearn</h1>
          <p className="text-sm text-[#706858] mt-1">Sign in to continue your adventure</p>
        </div>

        {error && (
          <div className="mb-4 p-3 border border-[#6b3a3a] bg-[#2a1818] text-[#d08080] text-sm flex items-center gap-2 rounded-xl">
            <FaLock className="shrink-0" /> {error}
          </div>
        )}

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
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <div className="flex items-center gap-2 border border-[#252c3a] bg-[#161c28] rounded-xl focus-within:border-[#3a4258]">
              <FaLock className="text-[#585048] ml-3 shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Your password"
                className={inputClass}
              />
            </div>
          </div>
          <p className="text-right">
            <Link to="/forgot-password" className="text-xs text-[#706858] hover:text-[#c8a040] transition-colors">
              Forgot password?
            </Link>
          </p>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 border border-[#3a4258] bg-[#1c2230] text-[#d8d0c4] font-medium hover:bg-[#242c3c] rounded-xl disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#706858]">
          New to GamiLearn?{' '}
          <Link to="/signup" className="font-medium text-[#c8a040] hover:underline">
            Create account
          </Link>
        </p>
        </div>
      </div>
    </GameLayout>
  );
};

export default Login;
