import React, { useRef, useState } from 'react';
import { Mail, Phone, MapPin, Briefcase, X, CheckCircle, Pencil, Camera, RefreshCw } from 'lucide-react';
import { Profile, ProfileUpdate, apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileTabProps {
  profile: Profile;
  user: any;
  onUpdate: (data: ProfileUpdate) => Promise<void>;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
}

const panelStyle = {
  backgroundColor: 'var(--bg-card)',
  borderColor: 'var(--border)',
  boxShadow: 'var(--shadow)',
} as const;

const ProfileTab: React.FC<ProfileTabProps> = ({ profile, user, onUpdate, onRefresh, refreshing }) => {
  const { refreshUser } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [formData, setFormData] = useState<ProfileUpdate>({});
  const [newSkill, setNewSkill] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatarKey, setAvatarKey] = useState(0);

  const openModal = () => {
    setFullName(user?.full_name || '');
    setFormData({
      bio: profile.bio || '',
      skills: profile.skills || [],
      phone: profile.phone || '',
      address: profile.address || '',
    });
    setNewSkill('');
    setAvatarFile(null);
    setAvatarPreview(null);
    setError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setError(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, or WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (fullName.trim() !== (user?.full_name || '')) {
        await apiService.updateCurrentUser({ full_name: fullName.trim() });
      }

      if (avatarFile) {
        await apiService.uploadAvatar(avatarFile);
        setAvatarKey((k) => k + 1);
      }

      await onUpdate(formData);
      await refreshUser();

      setModalOpen(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !formData.skills?.includes(trimmed)) {
      setFormData({ ...formData, skills: [...(formData.skills || []), trimmed] });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills?.filter((s) => s !== skill) || [] });
  };

  const avatarSrc = user?.id ? `${apiService.getAvatarUrl(user.id)}?v=${avatarKey}` : null;

  return (
    <div>
      {saveSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={16} />
          Profile saved successfully!
        </div>
      )}

      <div className="rounded-2xl border p-6 mb-6" style={panelStyle}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <AvatarImage src={avatarSrc} name={user?.full_name} size={20} />
            <div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{user?.full_name}</h3>
              <p className="flex items-center gap-1 mt-1" style={{ color: 'var(--text-secondary)' }}>
                <Mail size={14} strokeWidth={1.9} />
                {user?.email}
              </p>
              <p className="text-sm mt-1 capitalize" style={{ color: 'var(--text-muted)' }}>
                Role: {user?.role}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Pencil size={15} strokeWidth={1.9} />
            Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <InfoPanel icon={Phone} label="Phone" value={profile.phone} />
        <InfoPanel icon={MapPin} label="Address" value={profile.address} />
      </div>

      <div className="rounded-2xl border p-5 mb-6" style={panelStyle}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
          Bio
        </p>
        <p className="whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
          {profile.bio || <span className="italic" style={{ color: 'var(--text-muted)' }}>No bio added yet.</span>}
        </p>
      </div>

      <div className="rounded-2xl border p-5" style={panelStyle}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <Briefcase size={12} strokeWidth={1.9} />
            Skills
          </p>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-card)' }}
            title="Refresh skills from latest resume"
          >
            <RefreshCw size={13} strokeWidth={1.9} className={refreshing ? 'animate-spin' : ''} />
            Refresh Skills
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.skills?.length ? (
            profile.skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
              >
                {skill}
              </span>
            ))
          ) : (
            <p className="italic text-sm" style={{ color: 'var(--text-muted)' }}>No skills added yet.</p>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div
            className="relative rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col border"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-active)' }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Edit Profile</h2>
              <button type="button" onClick={closeModal} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <div className="relative">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2" style={{ borderColor: 'var(--border)' }} />
                    ) : (
                      <AvatarImage src={avatarSrc} name={user?.full_name} size={20} />
                    )}
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--accent)' }}
                      title="Change photo"
                    >
                      <Camera size={13} className="text-white" />
                    </button>
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Profile Photo</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>JPEG, PNG or WebP, max 5 MB</p>
                  </div>
                </div>

                <Field label="Full Name">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl themed-input text-sm"
                    placeholder="Your full name"
                  />
                </Field>

                <Field label="Bio">
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl themed-input text-sm"
                    placeholder="Tell us about yourself..."
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Phone">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl themed-input text-sm"
                      placeholder="+1234567890"
                    />
                  </Field>
                  <Field label="Address">
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl themed-input text-sm"
                      placeholder="City, Country"
                    />
                  </Field>
                </div>

                <Field label="Skills">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      className="flex-1 px-3 py-2 rounded-xl themed-input text-sm"
                      placeholder="Type a skill and press Enter"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-3 py-2 text-white rounded-xl text-sm font-medium"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[2rem]">
                    {formData.skills?.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                        style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
                      >
                        {skill}
                        <button type="button" onClick={() => handleRemoveSkill(skill)} className="opacity-80 hover:opacity-100">
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                </Field>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-card)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-white rounded-xl disabled:opacity-50 text-sm font-medium"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
      {label}
    </label>
    {children}
  </div>
);

const InfoPanel: React.FC<{ icon: any; label: string; value?: string | null }> = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border p-5" style={panelStyle}>
    <p className="text-xs font-semibold uppercase tracking-wide mb-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
      <Icon size={12} strokeWidth={1.9} /> {label}
    </p>
    <p style={{ color: 'var(--text-primary)' }}>
      {value || <span className="italic" style={{ color: 'var(--text-muted)' }}>Not provided</span>}
    </p>
  </div>
);

const AvatarImage: React.FC<{ src: string | null; name?: string; size: number }> = ({ src, name, size }) => {
  const [imgError, setImgError] = useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [src]);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        onError={() => setImgError(true)}
        className="rounded-full object-cover border-2 flex-shrink-0"
        style={{ width: size * 4, height: size * 4, borderColor: 'var(--border)' }}
      />
    );
  }

  return (
    <div
      className="text-white rounded-full flex items-center justify-center font-bold flex-shrink-0"
      style={{ width: size * 4, height: size * 4, fontSize: size * 1.2, backgroundColor: 'var(--accent)' }}
    >
      {name?.charAt(0).toUpperCase() || 'U'}
    </div>
  );
};

export default ProfileTab;
