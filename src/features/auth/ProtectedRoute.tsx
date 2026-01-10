import { type FC, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
    requireAdmin?: boolean;
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
    const { user, roleConfig, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        // Return a loading skeleton or null while auth checks complete
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
            </div>
        );
    }

    if (!user) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them
        // along to that page after they login, which is a nicer user experience.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireAdmin && roleConfig?.role !== 'admin') {
        // If the route requires admin but the user is not an admin, redirect to dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
