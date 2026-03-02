import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  requiredPermissions?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredPermissions }) => {
  const { isAuthenticated, hasPermission, loading } = useAuth();

  if (loading) {
    // Return a loading spinner or skeleton screen
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="h-32 w-32">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
             <p className="text-center mt-4 text-gray-500">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    if (!hasPermission(requiredPermissions)) {
      return <Navigate to="/access-denied" replace />;
    }
  }

  return <Outlet />;
};
