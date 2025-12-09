import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [knowsJavaScript, setKnowsJavaScript] = useState(null);
  const [showJSQuestion, setShowJSQuestion] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleInitialSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setShowJSQuestion(true);
  };

  const handleJSAnswer = async (answer) => {
    setKnowsJavaScript(answer);
    setLoading(true);
    setError('');

    try {
      console.log('Attempting signup with:', { 
        name: formData.name, 
        email: formData.email, 
        knowsJavaScript: answer 
      });
      
      const user = await signup(formData.name, formData.email, formData.password, answer);
      
      console.log('Signup successful:', user);
      
      if (user.learningPath === 'javascript-basics') {
        navigate('/dashboard?message=start-basics');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Signup error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Signup failed. Please try again.';
      setError(errorMessage);
      setShowJSQuestion(false);
      setLoading(false);
    }
  };

  if (showJSQuestion) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>🎮 GamiLearn</h1>
          <h2>Quick Question!</h2>
          <p className="auth-subtitle">Are you comfortable with JavaScript?</p>

          <div className="js-question">
            <p className="question-text">
              This helps us customize your learning path. Don't worry, we have courses for all levels!
            </p>

            <div className="button-group">
              <button
                onClick={() => handleJSAnswer(true)}
                className="btn btn-success"
                disabled={loading}
              >
                ✅ Yes, I know JavaScript
              </button>
              <button
                onClick={() => handleJSAnswer(false)}
                className="btn btn-info"
                disabled={loading}
              >
                📚 No, I'm new to JavaScript
              </button>
            </div>

            {loading && <p className="loading-text">Creating your account...</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>🎮 GamiLearn</h1>
        <h2>Create Account</h2>
        <p className="auth-subtitle">Start your game development journey today!</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleInitialSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="John Doe"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your.email@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="At least 6 characters"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Re-enter your password"
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Continue
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
