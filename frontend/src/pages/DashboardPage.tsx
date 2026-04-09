import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import CandidateDashboard from '../components/dashboard/CandidateDashboard';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'candidate') {
    return <CandidateDashboard />;
  }

  return <AdminDashboard />;
};

export default DashboardPage;
