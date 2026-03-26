import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

  const inputClass = 'w-full px-3 py-2 border-0 bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none';
  const labelClass = 'block text-sm font-medium text-gray-300 mb-1';

  return (
    <GameLayout showNavbar={false} showParticles={false}>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md border border-gray-700 bg-gray-900/80 p-6 rounded-lg backdrop-blur-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 border border-gray-600 flex items-center justify-center mb-3 rounded-lg">
            <FaGamepad className="text-2xl text-gray-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-100">GamiLearn</h1>
          <p className="text-sm text-gray-400 mt-1">Sign in to continue</p>
        </div>

        {error && (
          <div className="mb-4 p-3 border border-red-600 bg-red-900/30 text-red-300 text-sm flex items-center gap-2 rounded">
            <FaLock className="shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Email</label>
            <div className="flex items-center gap-2 border border-gray-600 bg-gray-800 rounded focus-within:border-gray-500">
              <FaEnvelope className="text-gray-500 ml-3 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className={inputClass + ' rounded'}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <div className="flex items-center gap-2 border border-gray-600 bg-gray-800 rounded focus-within:border-gray-500">
              <FaLock className="text-gray-500 ml-3 shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Your password"
                className={inputClass + ' rounded'}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 border border-gray-600 bg-gray-800 text-gray-100 font-medium hover:bg-gray-700 rounded disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          New to GamiLearn?{' '}
          <Link to="/signup" className="font-medium text-cyan-400 hover:underline">
            Create account
          </Link>
        </p>
        </div>
      </div>
    </GameLayout>
  );
};

export default Login;
