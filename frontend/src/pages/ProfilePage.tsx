import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { User, Settings, HelpCircle, FileText, RefreshCw } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Profile, ProfileUpdate, ChangePasswordRequest } from '../services/api';
import ProfileTab from '../components/profile/ProfileTab';
import ResumeTab from '../components/profile/ResumeTab';
import SettingsTab from '../components/profile/SettingsTab';
import HelpCenterTab from '../components/profile/HelpCenterTab';

type TabType = 'profile' | 'resume' | 'settings' | 'help';

const tabPathMap: Record<TabType, string> = {
  profile: '/profile',
  resume: '/resume',
  settings: '/settings',
  help: '/help',
};

const pathTabMap: Record<string, TabType> = {
  '/profile': 'profile',
  '/resume': 'resume',
  '/settings': 'settings',
  '/help': 'help',
};

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isCandidate = user?.role?.toLowerCase() === 'candidate';

  const activeTab = useMemo<TabType>(() => {
    const nextTab = pathTabMap[location.pathname];
    if (nextTab === 'resume' && !isCandidate) {
      return 'profile';
    }
    return nextTab || 'profile';
  }, [isCandidate, location.pathname]);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await apiService.getMyProfile();
      setProfile(data);
      setError(null);
    } catch (err) {
      if (!isRefresh) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!isCandidate && location.pathname === '/resume') {
      navigate('/profile', { replace: true });
    }
  }, [isCandidate, location.pathname, navigate]);

  const handleRefresh = () => fetchProfile(true);

  const handleUpdateProfile = async (data: ProfileUpdate) => {
    const updated = await apiService.updateMyProfile(data);
    setProfile(updated);
  };

  const handleChangePassword = async (data: ChangePasswordRequest) => {
    await apiService.changePassword(data);
  };

  const handleTabChange = (tab: TabType) => {
    navigate(tabPathMap[tab]);
  };

  const tabs = [
    { id: 'profile' as TabType, label: 'My Profile', icon: User, show: true },
    { id: 'resume' as TabType, label: 'Resume', icon: FileText, show: isCandidate },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings, show: true },
    { id: 'help' as TabType, label: 'Help Center', icon: HelpCircle, show: true },
  ].filter((tab) => tab.show);

  const renderContent = () => {
    if (!profile) return null;
    if (activeTab === 'profile') {
      return <ProfileTab profile={profile} user={user} onUpdate={handleUpdateProfile} onRefresh={handleRefresh} refreshing={refreshing} />;
    }
    if (activeTab === 'resume' && isCandidate) {
      return <ResumeTab onProfileChanged={handleRefresh} />;
    }
    if (activeTab === 'settings') {
      return <SettingsTab onChangePassword={handleChangePassword} />;
    }
    return <HelpCenterTab />;
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="border-b px-6 md:px-8 py-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h1 className="text-[28px] font-bold tracking-[-0.03em]" style={{ color: 'var(--text-primary)' }}>
            Profile
          </h1>
        </div>
        <div className="p-6 md:p-8 flex items-center justify-center">
          <div style={{ color: 'var(--text-muted)' }}>Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex-1 min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="border-b px-6 md:px-8 py-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h1 className="text-[28px] font-bold tracking-[-0.03em]" style={{ color: 'var(--text-primary)' }}>
            Profile
          </h1>
        </div>
        <div className="p-6 md:p-8">
          <div className="px-4 py-3 rounded-xl border bg-red-50 text-red-700 border-red-200">
            {error || 'Failed to load profile'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="border-b px-6 md:px-8 py-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[30px] font-bold tracking-[-0.03em]" style={{ color: 'var(--text-primary)' }}>
              Profile
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              Manage your personal information and settings
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-card)' }}
            title="Reload profile data"
          >
            <RefreshCw size={16} strokeWidth={1.9} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="border-b px-6 md:px-8" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className="flex items-center gap-2 px-4 py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap"
                style={{
                  borderBottomColor: isActive ? 'var(--accent)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                <Icon size={18} strokeWidth={1.9} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 md:p-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default ProfilePage;
