import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';

const AUTH_SUCCESS_MESSAGE_KEY = 'authSuccessMessage';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const hasToken = useMemo(() => token.trim().length > 0, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!hasToken) {
      setError('This reset link is invalid or incomplete.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await apiService.resetPassword(token, password);
      window.sessionStorage.setItem(AUTH_SUCCESS_MESSAGE_KEY, 'Your password has been reset. Please sign in with your new password.');
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-bg-watermark min-h-screen flex items-center justify-center px-4 py-10" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-md w-full rounded-lg shadow-lg p-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="text-center mb-8">
          <img
            src="/branding/nu-logo.png"
            alt="National University"
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Reset password</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Choose a new password for your account.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {!hasToken ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#b91c1c' }}>
              This reset link is invalid or incomplete.
            </div>
            <Link to="/forgot-password" className="w-full btn-primary py-3 text-center block">
              Request a new link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                New password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                className="themed-input w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="themed-input w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Resetting password...' : 'Reset password'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
