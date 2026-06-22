import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/Dashboards/AdminDashboard';
import ManagerDashboard from '../components/Dashboards/ManagerDashboard';
import OfficerDashboard from '../components/Dashboards/OfficerDashboard';
import TellerDashboard from '../components/Dashboards/TellerDashboard';
import ViewerDashboard from '../components/Dashboards/ViewerDashboard';

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  switch (user?.role) {
    case 'admin':
      return <AdminDashboard user={user} />;
    case 'manager':
      return <ManagerDashboard user={user} />;
    case 'officer':
      return <OfficerDashboard user={user} />;
    case 'teller':
      return <TellerDashboard user={user} />;
    case 'viewer':
      return <ViewerDashboard user={user} />;
    default:
      return <OfficerDashboard user={user} />;
  }
};

export default Dashboard;