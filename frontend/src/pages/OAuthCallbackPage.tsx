import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const OAuthCallbackPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const token = params.get('token');
    const error = params.get('error');

    if (error || !token) {
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }

    localStorage.setItem('token', token);

    refreshUser()
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => navigate('/login?error=oauth_failed', { replace: true }));
  }, [params, navigate, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="rounded-lg shadow-lg p-8 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="animate-pulse text-base" style={{ color: 'var(--text-primary)' }}>
          Signing you in...
        </div>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
