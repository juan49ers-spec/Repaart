import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RequireActiveStatusProps {
    children: React.ReactNode;
}

/**
 * RequireActiveStatus Guard
 * Ensures the user has 'active' status.
 * If 'pending', redirects to /resources (one of the few allowed pages).
 * If 'banned', redirects to login (or could show a banner).
 */
export const RequireActiveStatus: React.FC<RequireActiveStatusProps> = ({ children }) => {
    const { user } = useAuth();

    if (!user) return null; // Should be handled by ProtectedRoute/RequireRole

    // PENDING: Redirect to a safe zone (Resources)
    if (user.status === 'pending') {
        return <Navigate to="/resources" replace />;
    }

    // BANNED: Kick out
    if (user.status === 'banned') {
        return <Navigate to="/login" replace />;
    }

    // ACTIVE: Allow access
    return <>{children}</>;
};

export default RequireActiveStatus;
