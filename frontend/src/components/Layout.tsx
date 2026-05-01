import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';
import LogoutConfirmModal from './modals/LogoutConfirmModal';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar onLogout={() => setIsLogoutModalOpen(true)} />
      <div className="flex-1 flex flex-col min-w-0 bg-transparent">
        <Breadcrumbs />
        <div key={location.pathname} className="flex-1 bg-transparent page-fade">
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
