import React from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { ExecutiveDashboard } from '../components/dashboard/ExecutiveDashboard';
import { RegionalDashboard } from './RegionalDashboard';
import { SupervisorDashboard } from './SupervisorDashboard';
import { Operations } from './Operations';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Route to specific dashboards based on role
  if (user?.role === 'Regional Manager') {
    return <RegionalDashboard />;
  }

  if (user?.role === 'Supervisor') {
    return <SupervisorDashboard />;
  }
  
  // You could also route Operations Head to the Operations page by default
  // if (user?.role === 'Operations Head') {
  //   return <Operations />;
  // }

  // Default to Executive Dashboard for CEO, Admin, and others for now
  return <ExecutiveDashboard />;
};
