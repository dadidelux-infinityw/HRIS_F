import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AUTH_SUCCESS_MESSAGE_KEY = 'authSuccessMessage';
// const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8000/api/v1';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const successMessage = typeof window !== 'undefined' ? window.sessionStorage.getItem(AUTH_SUCCESS_MESSAGE_KEY) : null;

  if (successMessage && typeof window !== 'undefined') {
    window.sessionStorage.removeItem(AUTH_SUCCESS_MESSAGE_KEY);
  }

  // Surface OAuth errors that the callback redirected with
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get('error');
    if (oauthError === 'oauth_failed') {
      setError('Sign-in with the selected provider failed. Please try again.');
    } else if (oauthError === 'oauth_not_configured') {
      setError('Social sign-in is not configured. Contact your administrator.');
    }
  }, []);

  // const handleOAuth = (provider: 'google' | 'linkedin') => {
  //   window.location.href = `${API_BASE}/auth/${provider}/login`;
  // };

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-bg-watermark min-h-screen flex items-center justify-center px-4 py-10" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-md w-full">
        <div className="rounded-lg shadow-lg p-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-center mb-8">
            <img
              src="/branding/nu-logo.png"
              alt="National University"
              className="h-16 w-auto mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Welcome back</h1>
            <p className="mt-2" style={{ color: 'var(--text-muted)' }}>Please enter your details to sign in</p>
          </div>

          {successMessage && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.24)', color: '#15803d' }}>
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="themed-input w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Password
                </label>
                {/* <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                  Forgot password?
                </Link> */}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="themed-input w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* OAuth buttons — uncomment when Google/LinkedIn credentials are configured
          <div className="my-6 flex items-center gap-3">
            <span className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
            <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>or continue with</span>
            <span className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => handleOAuth('google')} ...>Google</button>
            <button type="button" onClick={() => handleOAuth('linkedin')} ...>LinkedIn</button>
          </div>
          */}

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
