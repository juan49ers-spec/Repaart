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

    // 3. FASE DE INTEGRIDAD (NUEVO): ¿Tenemos los datos críticos?
    // Si el usuario está logueado pero no tiene rol/config, algo falló en la DB o está incompleto.
    // Lo enviamos a una pantalla de "Completar Perfil" o "Error" en lugar de romper la app.
    if (!roleConfig && !user.email?.includes('admin')) {
        // Nota: Excluimos al super-admin inicial que podría no tener perfil en DB aún
        console.warn('⚠️ Usuario autenticado pero sin perfil en DB. Redirigiendo...');
        return <Navigate to="/login" replace />;
    }

    // 4. FASE DE AUTORIZACIÓN: ¿Tiene permisos de Admin?
    if (requireAdmin && roleConfig?.role !== 'admin') {
        return <Navigate to="/profile" replace />;
    }

    // ✅ PASE SEGURO: Todo cargado y verificado.
    return <>{children}</>;
};

export default ProtectedRoute;
