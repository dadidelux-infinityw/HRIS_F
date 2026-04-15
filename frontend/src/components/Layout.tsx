import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';
import LogoutConfirmModal from './modals/LogoutConfirmModal';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Layout: React.FC = () => {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsLogoutModalOpen(false);
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <Sidebar onLogout={() => setIsLogoutModalOpen(true)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Breadcrumbs />
        <div className="flex-1">
          <Outlet />
        </div>
      </div>

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
};

export default Layout;
