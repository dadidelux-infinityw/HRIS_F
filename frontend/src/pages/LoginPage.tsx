import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AUTH_SUCCESS_MESSAGE_KEY = 'authSuccessMessage';
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8000/api/v1';

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

  const handleOAuth = (provider: 'google' | 'linkedin') => {
    window.location.href = `${API_BASE}/auth/${provider}/login`;
  };

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
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                  Forgot password?
                </Link>
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

          <div className="my-6 flex items-center gap-3">
            <span className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
            <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>or continue with</span>
            <span className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              className="inline-flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium hover:bg-gray-50"
              style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}
              aria-label="Sign in with Google"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth('linkedin')}
              className="inline-flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium hover:bg-gray-50"
              style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}
              aria-label="Sign in with LinkedIn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#0A66C2" d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.47v6.27zM5.34 7.43A2.06 2.06 0 1 1 5.35 3.3a2.06 2.06 0 0 1-.01 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45C23.2 24 24 23.23 24 22.28V1.72C24 .77 23.2 0 22.23 0z"/>
              </svg>
              LinkedIn
            </button>
          </div>

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
