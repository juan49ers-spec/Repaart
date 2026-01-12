import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RequireRoleProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

/**
 * RequireRole Component (The Bouncer)
 * Protects routes based on user role and handles smart redirection
 * to avoid infinite loops and "dead ends" for specific roles like Riders.
 */
export const RequireRole: React.FC<RequireRoleProps> = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
            </div>
        );
    }

    // 1. If not authenticated, go to login
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. Check Role Authorization
    const userRole = user.role || 'undefined';
    const hasRequiredRole = allowedRoles.includes(userRole);

    if (!hasRequiredRole) {
        console.warn(`[Security] Access Denied! 
            Path: ${location.pathname}
            User: ${user.email}
            Role: [${userRole}] 
            Required: ${allowedRoles.join(', ')}`);

        // 🛡️ Smart Redirect to avoid infinite loops
        if (['rider', 'driver'].includes(userRole)) {
            // If already at rider app, don't redirect (let 404/Not Found handle if specific path bad)
            if (location.pathname.startsWith('/rider')) return children as any;
            return <Navigate to="/rider/schedule" replace />;
        }

        // If role is missing or unauthorized for dashboard, send to profile (Safe Zone)
        if (location.pathname === '/profile') return children as any;
        return <Navigate to="/profile" replace />;
    }

    // 3. Authorized
    return <>{children}</>;
};

export default RequireRole;
