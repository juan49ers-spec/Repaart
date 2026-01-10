import { db, auth } from '../lib/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

export interface HealthCheckResult {
    status: 'healthy' | 'warning' | 'critical';
    checks: HealthCheck[];
    timestamp: Date;
}

export interface HealthCheck {
    name: string;
    status: 'pass' | 'warning' | 'fail';
    message: string;
    details?: string;
}

/**
 * Ejecuta verificaciones de salud del sistema
 */
export async function runHealthCheck(): Promise<HealthCheckResult> {
    const checks: HealthCheck[] = [];

    // 1. Firestore Connection
    try {
        await getDocs(query(collection(db, 'users'), limit(1)));
        checks.push({
            name: 'Firestore Connection',
            status: 'pass',
            message: 'Conectado correctamente'
        });
    } catch (error) {
        checks.push({
            name: 'Firestore Connection',
            status: 'fail',
            message: 'Error de conexión',
            details: error instanceof Error ? error.message : String(error)
        });
    }

    // 2. Authentication
    if (auth.currentUser) {
        checks.push({
            name: 'Authentication',
            status: 'pass',
            message: `Usuario: ${auth.currentUser.email}`
        });
    } else {
        checks.push({
            name: 'Authentication',
            status: 'fail',
            message: 'No hay usuario autenticado'
        });
    }

    // 3. Franchises Data
    try {
        const franchisesQuery = query(collection(db, 'users'));
        const snapshot = await getDocs(franchisesQuery);
        const franchiseCount = snapshot.docs.filter(doc => doc.data().role === 'franchise').length;

        if (franchiseCount > 0) {
            checks.push({
                name: 'Franchises Data',
                status: 'pass',
                message: `${franchiseCount} franquicia(s) encontrada(s)`
            });
        } else {
            checks.push({
                name: 'Franchises Data',
                status: 'warning',
                message: 'No se encontraron franquicias',
                details: 'Verifica que existan usuarios con role="franchise"'
            });
        }
    } catch (error) {
        checks.push({
            name: 'Franchises Data',
            status: 'fail',
            message: 'Error al cargar franquicias',
            details: error instanceof Error ? error.message : String(error)
        });
    }

    // 4. Financial Summaries
    try {
        const summariesSnapshot = await getDocs(collection(db, 'financial_summaries'));
        const count = summariesSnapshot.docs.length;

        if (count > 0) {
            checks.push({
                name: 'Financial Data',
                status: 'pass',
                message: `${count} registros financieros`
            });
        } else {
            checks.push({
                name: 'Financial Data',
                status: 'warning',
                message: 'No hay datos financieros'
            });
        }
    } catch (error) {
        checks.push({
            name: 'Financial Data',
            status: 'fail',
            message: 'Error al cargar datos financieros',
            details: error instanceof Error ? error.message : String(error)
        });
    }

    // 5. LocalStorage
    try {
        const testKey = '__health_check_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        checks.push({
            name: 'LocalStorage',
            status: 'pass',
            message: 'Funcionando correctamente'
        });
    } catch (error) {
        checks.push({
            name: 'LocalStorage',
            status: 'warning',
            message: 'No disponible',
            details: 'Modo incógnito o bloqueado'
        });
    }

    // 6. Network Status
    if (navigator.onLine) {
        checks.push({
            name: 'Network',
            status: 'pass',
            message: 'Conectado'
        });
    } else {
        checks.push({
            name: 'Network',
            status: 'fail',
            message: 'Sin conexión a Internet'
        });
    }

    // Determinar estado general
    const hasFailures = checks.some(c => c.status === 'fail');
    const hasWarnings = checks.some(c => c.status === 'warning');

    let overallStatus: 'healthy' | 'warning' | 'critical';
    if (hasFailures) {
        overallStatus = 'critical';
    } else if (hasWarnings) {
        overallStatus = 'warning';
    } else {
        overallStatus = 'healthy';
    }

    return {
        status: overallStatus,
        checks,
        timestamp: new Date()
    };
}
