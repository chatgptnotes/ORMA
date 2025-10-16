import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/DevAuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Check if user is authenticated
  // DevAuthContext auto-provides a user in development mode
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // In development mode, allow all authenticated users to access admin routes
  return <>{children}</>;
};

export default AdminRoute;