import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const response = await apiService.forgotPassword(email);
      setSuccessMessage(response.message);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process password reset request.');
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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Forgot your password?</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Enter your account email and we&apos;ll send a reset link if the account exists.
          </p>
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending reset link...' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Remembered your password?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
