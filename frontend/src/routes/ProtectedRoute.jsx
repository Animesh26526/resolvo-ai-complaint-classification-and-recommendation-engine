import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Handles route protection by checking authentication and allowed roles.
export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <span className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-emerald-500 animate-spin"></span>
          <span className="text-sm font-medium text-slate-500">Loading Resolvo...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on role if they try to access unauthorized pages
    switch (user.role) {
      case 'customer': return <Navigate to="/customer/submit" replace />;
      case 'cse': return <Navigate to="/cse/dashboard" replace />;
      case 'qat': return <Navigate to="/qat/dashboard" replace />;
      case 'om': return <Navigate to="/om/dashboard" replace />;
      default: return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
}
