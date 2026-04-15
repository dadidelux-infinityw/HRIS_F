import React, { useState } from 'react';
import { Lock, CheckCircle } from 'lucide-react';
import { ChangePasswordRequest } from '../../services/api';

interface SettingsTabProps {
  onChangePassword: (data: ChangePasswordRequest) => Promise<void>;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ onChangePassword }) => {
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate passwords match
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    // Validate password length
    if (passwordData.new_password.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await onChangePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setSuccess(true);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div
        className="rounded-2xl border p-6"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl app-icon-chip-active">
            <Lock size={22} strokeWidth={1.9} />
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Change Password</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Update your password to keep your account secure
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle size={20} />
            <span>Password changed successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.current_password}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, current_password: e.target.value })
                }
                required
                className="w-full px-3 py-2 rounded-xl themed-input"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                New Password
              </label>
              <input
                type="password"
                value={passwordData.new_password}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, new_password: e.target.value })
                }
                required
                className="w-full px-3 py-2 rounded-xl themed-input"
                placeholder="Enter new password"
              />
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                Must be at least 6 characters long
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirm_password: e.target.value })
                }
                required
                className="w-full px-3 py-2 rounded-xl themed-input"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-white rounded-xl disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Additional Settings Placeholder */}
      <div
        className="mt-6 rounded-2xl border p-6"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Notifications</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Notification preferences will be available in a future update.
        </p>
      </div>
    </div>
  );
};

export default SettingsTab;
