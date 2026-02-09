import { type FC, type ReactNode } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
    children?: ReactNode;
    requireAdmin?: boolean;
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
    const { user, roleConfig, loading, isAdmin } = useAuth();
    const location = useLocation();

    // DEBUG LOGS
    console.debug('[ProtectedRoute] Evaluating:', {
        hasUser: !!user,
        userEmail: user?.email,
        hasRoleConfig: !!roleConfig,
        role: roleConfig?.role,
        isAdmin,
        requireAdmin,
        loading
    });

    // 1. FASE DE CARGA: Esperamos a Firebase Auth Y al perfil de Firestore
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                {/* Spinner más profesional */}
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
                    <span className="text-slate-400 text-sm font-medium animate-pulse">Cargando perfil...</span>
                </div>
            </div>
        );
    }

    // 2. FASE DE AUTENTICACIÓN: ¿Existe el usuario?
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. FASE DE AUTORIZACIÓN: ¿Tiene permisos de Admin?
    // Usamos isAdmin calculado en AuthContext en lugar de roleConfig?.role
    if (requireAdmin && !isAdmin) {
        console.warn('[ProtectedRoute] Admin access denied for:', user.email, 'isAdmin:', isAdmin);
        return <Navigate to="/profile" replace />;
    }

    // ✅ PASE SEGURO: Todo cargado y verificado.
    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
