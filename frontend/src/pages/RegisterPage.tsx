import type React from 'react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import api from '../services/api';
import './AuthPages.css';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.post('/auth/register', { 
        email, 
        username, 
        full_name: fullName, 
        password 
      });

      const loginResponse = await api.post('/auth/login', { email, password });
      const token = loginResponse.data.access_token;
      const refreshToken = loginResponse.data.refresh_token;
      localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
      const userResponse = await api.get('/auth/me');

      login(token, userResponse.data);
      navigate('/dashboard');
    } catch (err: any) {
      localStorage.removeItem('token');
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-header">
        <div className="logo mb-6 text-primary flex items-center gap-2 font-bold text-xl">
          <span className="icon">✨</span> BrieflyAI
        </div>
        <h2 className="auth-form-title">Create Account</h2>
        <p className="auth-form-subtitle">Join thousands of professionals on BrieflyAI.</p>
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
          />
        </div>

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input 
            type="text" 
            id="username" 
            placeholder="johndoe"
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
        </div>

        <div className="form-group">
          <label htmlFor="fullName">Full Name</label>
          <input 
            type="text" 
            id="fullName" 
            placeholder="John Doe"
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            required 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input 
            type="password" 
            id="password" 
            placeholder="••••••••"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            minLength={8}
          />
        </div>
        
        <div className="form-options">
          <label className="checkbox-label">
            <input type="checkbox" required />
            <span>I agree to the Terms of Service and Privacy Policy</span>
          </label>
        </div>
        
        <Button type="submit" variant="secondary" fullWidth disabled={isLoading} className="mt-4">
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </Button>
      </form>
      
      <div className="auth-switch">
        Already have an account? <Link to="/login">Sign In</Link>
      </div>
    </div>
  );
};

export default RegisterPage;
