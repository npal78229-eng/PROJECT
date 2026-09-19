import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, token } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!user || !allowedRoles.includes(user.role)) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-xl shadow-sm border max-w-md text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
            <p className="text-sm text-gray-600 mb-4">
              Your account ({user?.role}) does not have permission to view this page.
            </p>
            <a
              href="/"
              className="inline-block bg-amber-400 hover:bg-amber-500 text-gray-950 font-semibold px-4 py-2 rounded-lg text-sm transition"
            >
              Return to Storefront
            </a>
          </div>
        </div>
      );
    }
  }

  return children;
}
