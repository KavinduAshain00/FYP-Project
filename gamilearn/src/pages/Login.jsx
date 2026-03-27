import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FaEnvelope, FaLock, FaGamepad, FaArrowRight } from 'react-icons/fa';
import { GameLayout } from '../components/layout/GameLayout';
import { getNetworkErrorMessage } from '../api/api';

const ease = [0.25, 0.1, 0.25, 1];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(getNetworkErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    'w-full rounded-2xl bg-blue-800 pl-12 pr-4 py-3.5 text-blue-50 placeholder-blue-300 outline-none focus:outline focus:outline-2 focus:outline-blue-400/60 text-sm';

  if (authLoading) {
    return (
      <GameLayout showNavbar={false} showParticles={false}>
        <div className="min-h-screen flex items-center justify-center bg-neutral-900 px-4">
          <p className="text-blue-300">Signing you in…</p>
        </div>
      </GameLayout>
    );
  }

  if (user) {
    return null;
  }

  return (
    <GameLayout showNavbar={false} showParticles={true}>
      <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-900">
        <motion.aside
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease }}
          className="lg:w-[44%] xl:w-[40%] flex flex-col justify-between p-8 sm:p-12 lg:p-14 bg-gradient-to-b from-blue-900 via-blue-900 to-neutral-900 relative overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-400/15 via-transparent to-violet-500/10" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                'url(https://itchronicles.com/wp-content/uploads/2021/04/Optimized-Illustration-from-Adobe-Stock-for-ITC-Post-on-AI-in-Game-Development-2048x1152.jpeg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <span className="w-12 h-12 rounded-2xl bg-blue-800 flex items-center justify-center text-blue-50 shadow-lg shadow-black/40">
                <FaGamepad className="text-xl" />
              </span>
              <div>
                <p className="font-bold text-lg text-blue-50 tracking-tight">GamiLearn</p>
                <p className="text-xs text-blue-300">AI guided Game Development Learning Platform</p>
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-blue-50 leading-tight max-w-md">
              Sign in and continue your last lesson
            </h2>
            <ul className="mt-8 space-y-3 text-sm text-blue-100 max-w-sm">
              <li className="flex gap-2">
                <span className="text-cyan-300 font-bold">1.</span>
                Dashboard shows exactly what to do next
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-300 font-bold">2.</span>
                Editor saves as you type
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-300 font-bold">3.</span>
                XP and achievements track progress
              </li>
            </ul>
          </div>
          <p className="relative z-10 text-xs text-blue-300 hidden lg:block">
            New here? Create an account from the form on the right.
          </p>
        </motion.aside>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.06, ease }}
          >
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <span className="w-11 h-11 rounded-xl bg-blue-800 flex items-center justify-center text-blue-50">
                <FaGamepad />
              </span>
              <span className="font-bold text-blue-50">GamiLearn</span>
            </div>

            <h1 className="text-2xl font-bold text-blue-50">Welcome back</h1>
            <p className="text-blue-300 text-sm mt-2 mb-8">
              Enter the email and password you used to register.
            </p>

            {error && (
              <div className="mb-6 rounded-2xl bg-blue-800 px-4 py-3 text-blue-200 text-sm flex items-start gap-3">
                <FaLock className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Email</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 text-sm" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className={fieldClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Password</label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 text-sm" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Your password"
                    className={fieldClass}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-blue-200 hover:text-blue-100"
                >
                  Forgot password?
                </Link>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 text-blue-950 font-semibold text-sm shadow-lg shadow-cyan-500/30 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-45 disabled:saturate-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? 'Signing in…' : 'Sign in'}
                {!loading && <FaArrowRight className="text-xs" />}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-blue-300">
              New to GamiLearn?{' '}
              <Link to="/signup" className="font-semibold text-blue-200 hover:text-blue-100">
                Create an account
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </GameLayout>
  );
};

export default Login;
