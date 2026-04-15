import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import CandidateDashboard from '../components/dashboard/CandidateDashboard';
import AdminDashboard from '../components/dashboard/AdminDashboard';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'candidate') {
    return <CandidateDashboard />;
  }

  return <AdminDashboard />;
};

export default DashboardPage;
