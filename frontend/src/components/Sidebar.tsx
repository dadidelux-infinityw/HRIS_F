import React, { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  Calendar,
  ChevronDown,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  LucideIcon,
  Moon,
  Search,
  Settings,
  Target,
  ClipboardList,
  Sun,
  UserCircle2,
  Users,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarProps {
  onLogout: () => void;
}

type UserRole = 'candidate' | 'hr' | 'admin';

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  roles: UserRole[];
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const allMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['candidate', 'hr', 'admin'] },
    { id: 'jobs', label: 'Browse Jobs', icon: Search, path: '/jobs', roles: ['candidate'] },
    { id: 'job-postings', label: 'Job Postings', icon: Briefcase, path: '/job-postings', roles: ['hr', 'admin'] },
    { id: 'my-applications', label: 'My Applications', icon: ClipboardList, path: '/my-applications', roles: ['candidate'] },
    { id: 'applications', label: 'Applications', icon: Users, path: '/applications', roles: ['hr', 'admin'] },
    { id: 'my-interviews', label: 'My Interviews', icon: Calendar, path: '/my-interviews', roles: ['candidate'] },
    { id: 'interviews', label: 'Interviews', icon: Calendar, path: '/interviews', roles: ['hr', 'admin'] },
    { id: 'matching', label: 'Candidate Matching', icon: Target, path: '/matching', roles: ['hr', 'admin'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics', roles: ['hr', 'admin'] },
    { id: 'reports', label: 'Reports', icon: FileText, path: '/reports', roles: ['hr', 'admin'] },
  ];

  const menuItems = useMemo(() => {
    const userRole = (user?.role || 'candidate') as UserRole;
    return allMenuItems.filter((item) => item.roles.includes(userRole));
  }, [user?.role]);

  const initials = user?.full_name
    ?.split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="app-shell-sidebar w-72 min-h-screen flex-col hidden md:flex">
      <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.22em] font-semibold"
              style={{ color: 'var(--text-muted)' }}
            >
              HR Operations
            </p>
            <h1
              className="mt-1 text-[22px] font-bold tracking-[-0.03em]"
              style={{ color: 'var(--text-primary)' }}
            >
              HRIS
            </h1>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="sidebar-theme-toggle h-10 w-10 rounded-xl flex items-center justify-center transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun size={17} strokeWidth={1.8} /> : <Moon size={17} strokeWidth={1.8} />}
          </button>
        </div>
      </div>

      {user && (
        <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((value) => !value)}
            className="sidebar-user-card w-full rounded-2xl p-3 text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full overflow-hidden flex items-center justify-center bg-[#d9efe0] text-[#166534] font-semibold text-sm">
                {user.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials || <UserCircle2 size={20} strokeWidth={1.8} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {user.full_name}
                </p>
                <p className="text-xs capitalize truncate" style={{ color: 'var(--text-muted)' }}>
                  {user.role}
                </p>
              </div>
              <ChevronDown
                size={16}
                strokeWidth={1.8}
                className={`transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                style={{ color: 'var(--text-muted)' }}
              />
            </div>
          </button>

          {isUserMenuOpen && (
            <div
              className="sidebar-user-menu mt-2 overflow-hidden rounded-2xl border"
            >
              <NavLink
                to="/profile"
                onClick={() => setIsUserMenuOpen(false)}
                className="sidebar-user-menu-item flex items-center gap-3 px-4 py-3 text-sm transition-colors"
              >
                <UserCircle2 size={17} strokeWidth={1.8} />
                <span>Profile</span>
              </NavLink>
              <NavLink
                to="/settings"
                onClick={() => setIsUserMenuOpen(false)}
                className="sidebar-user-menu-item flex items-center gap-3 px-4 py-3 text-sm transition-colors"
              >
                <Settings size={17} strokeWidth={1.8} />
                <span>Settings</span>
              </NavLink>
              <NavLink
                to="/help"
                onClick={() => setIsUserMenuOpen(false)}
                className="sidebar-user-menu-item flex items-center gap-3 px-4 py-3 text-sm transition-colors"
              >
                <HelpCircle size={17} strokeWidth={1.8} />
                <span>Help Center</span>
              </NavLink>
              <button
                type="button"
                onClick={onLogout}
                className="sidebar-user-menu-item sidebar-user-menu-danger w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors"
              >
                <LogOut size={17} strokeWidth={1.8} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}

      <div className="px-4 pt-5">
        <p
          className="px-3 text-[11px] uppercase tracking-[0.18em] font-semibold"
          style={{ color: 'var(--text-muted)' }}
        >
          Workspace
        </p>
      </div>

      <nav className="flex-1 px-4 py-3">
        <ul className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-nav-link group flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-150 ${
                      isActive ? 'shadow-sm' : ''
                    }`
                  }
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                    color: isActive ? 'var(--sidebar-active-text)' : 'var(--text-secondary)',
                    border: isActive ? '1px solid var(--sidebar-active-border)' : '1px solid transparent',
                    boxShadow: isActive ? 'var(--sidebar-active-shadow)' : 'none',
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${
                          isActive ? 'app-icon-chip-active' : 'app-icon-chip'
                        }`}
                      >
                        <Icon size={17} strokeWidth={1.8} />
                      </div>
                      <span className="text-sm font-medium tracking-[-0.01em]">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
