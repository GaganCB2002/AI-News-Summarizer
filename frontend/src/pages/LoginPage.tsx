import type React from 'react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Zap, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import './AuthPages.css';

const TEST_CREDENTIALS = {
  email: 'test@brieflyai.com',
  password: 'testpassword123',
};

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTestLoginLoading, setIsTestLoginLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const token = response.data.access_token;
      const refreshToken = response.data.refresh_token;
      localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
      const userResponse = await api.get('/auth/me');
      login(token, userResponse.data);
      navigate('/dashboard');
    } catch (err: any) {
      localStorage.removeItem('token');
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setIsTestLoginLoading(true);
    setError('');

    setEmail(TEST_CREDENTIALS.email);
    setPassword(TEST_CREDENTIALS.password);

    try {
      const response = await api.post('/auth/test-login');
      const token = response.data.access_token;
      const refreshToken = response.data.refresh_token;
      localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
      const userResponse = await api.get('/auth/me');
      login(token, userResponse.data);
      navigate('/dashboard');
    } catch (err: any) {
      localStorage.removeItem('token');
      setError(err.response?.data?.message || 'Test login failed. Make sure the backend server is running.');
    } finally {
      setIsTestLoginLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none' }} className="hover-lift">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>
      <div className="auth-header">
        <div className="logo mb-6 text-primary flex items-center gap-2 font-bold text-xl">
          <span className="icon">✨</span> BrieflyAI
        </div>
        <h2 className="auth-form-title">Welcome back</h2>
        <p className="auth-form-subtitle">Please enter your details to access your dashboard.</p>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <div className="social-auth">
        <button className="social-btn" type="button">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="18" height="18" />
          <span>Google</span>
        </button>
        <button className="social-btn" type="button">
          <img src="https://www.svgrepo.com/show/511330/apple-173.svg" alt="Apple" width="18" height="18" />
          <span>Apple</span>
        </button>
      </div>

      <div className="divider">
        <span>OR EMAIL</span>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email address</label>
          <input
            type="email"
            id="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <div className="label-row">
            <label htmlFor="password">Password</label>
            <a href="#" className="forgot-password">Forgot password?</a>
          </div>
          <input
            type="password"
            id="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <div className="form-options">
          <label className="checkbox-label">
            <input type="checkbox" />
            <span>Remember me for 30 days</span>
          </label>
        </div>

        <Button type="submit" variant="secondary" fullWidth disabled={isLoading} className="mt-4">
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="divider" style={{ marginTop: '1.5rem' }}>
        <span>QUICK ACCESS</span>
      </div>

      <button
        onClick={handleTestLogin}
        disabled={isTestLoginLoading}
        className="social-btn"
        type="button"
        style={{ backgroundColor: 'var(--color-accent-light-purple)', borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)', fontWeight: 600 }}
      >
        <Zap size={18} />
        {isTestLoginLoading ? 'Logging in...' : 'Test User Auto-Login'}
      </button>

      <div className="auth-switch">
        Don't have an account? <Link to="/register">Create account</Link>
      </div>
    </div>
  );
};

export default LoginPage;
