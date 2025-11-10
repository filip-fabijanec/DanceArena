import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h2>Nemate pristup ovoj stranici</h2>
        <p>Vaša uloga: {currentUser.role}</p>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;