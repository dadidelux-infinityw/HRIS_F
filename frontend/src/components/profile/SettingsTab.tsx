import React, { useEffect, useState } from 'react';
import { Lock, CheckCircle, Bell } from 'lucide-react';
import { apiService, ChangePasswordRequest, NotificationPreferences } from '../../services/api';

interface SettingsTabProps {
  onChangePassword: (data: ChangePasswordRequest) => Promise<void>;
}

const NOTIFICATION_OPTIONS: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  {
    key: 'notify_in_app',
    label: 'In-app notifications',
    description: 'Show updates in the notification bell.',
  },
  {
    key: 'notify_email',
    label: 'Email notifications',
    description: 'Email me about status changes, stage changes and interview updates.',
  },
];

const SettingsTab: React.FC<SettingsTabProps> = ({ onChangePassword }) => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<keyof NotificationPreferences | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiService
      .getNotificationPreferences()
      .then((prefs) => {
        if (!cancelled) setPreferences(prefs);
      })
      .catch((err) => {
        if (!cancelled) {
          setPrefsError(err instanceof Error ? err.message : 'Failed to load notification preferences');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleTogglePreference = async (key: keyof NotificationPreferences) => {
    if (!preferences) return;
    const previous = preferences;
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    setPrefsError(null);
    setSavingKey(key);
    try {
      const saved = await apiService.updateNotificationPreferences({ [key]: next[key] });
      setPreferences(saved);
    } catch (err) {
      setPreferences(previous);
      setPrefsError(err instanceof Error ? err.message : 'Failed to update notification preferences');
    } finally {
      setSavingKey(null);
    }
  };

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

      {/* Notification preferences */}
      <div
        className="mt-6 rounded-2xl border p-6"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl app-icon-chip-active">
            <Bell size={22} strokeWidth={1.9} />
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Choose how you hear about application and interview updates
            </p>
          </div>
        </div>

        {prefsError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {prefsError}
          </div>
        )}

        {!preferences ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {prefsError ? 'Notification preferences are unavailable right now.' : 'Loading preferences...'}
          </p>
        ) : (
          <div className="space-y-4">
            {NOTIFICATION_OPTIONS.map((option) => {
              const checked = preferences[option.key];
              return (
                <div key={option.key} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {option.label}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {option.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    aria-label={option.label}
                    disabled={savingKey !== null}
                    onClick={() => handleTogglePreference(option.key)}
                    className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-60"
                    style={{ backgroundColor: checked ? 'var(--accent)' : 'var(--bg-tertiary)' }}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        checked ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsTab;
