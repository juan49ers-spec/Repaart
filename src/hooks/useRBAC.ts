import { useAuth } from '../context/AuthContext';
import { useCallback } from 'react';

type Module = 'finance' | 'academy' | 'operations';
type Role = 'admin' | 'franchise' | 'user';
type Permission = 'read' | 'write' | 'none';

// Central Permission Matrix
// 'write' implies read access. 'read' implies read-only.
const MODULE_PERMISSIONS: Record<Module, Record<Role, Permission>> = {
    finance: {
        admin: 'write',     // Admin manages finance
        franchise: 'read',  // Franchisee views their finances
        user: 'none'
    },
    academy: {
        admin: 'read',      // Admin monitors progress
        franchise: 'write', // Franchisee takes courses (writes progress)
        user: 'none'
    },
    operations: {
        admin: 'read',      // Admin audits/supports
        franchise: 'write', // Franchisee manages daily ops
        user: 'none'
    }
};

export const useRBAC = () => {
    const { user } = useAuth();
    // Default to 'user' role if none defined
    // Assuming user object has a role property typed as string, casting to Role for safety
    const role: Role = (user?.role as Role) || 'user';

    /**
     * Checks if the current user has access to a specific module and action.
     * @param {string} module - 'finance', 'academy', 'operations'
     * @param {string} action - 'read' or 'write'
     */
    const checkAccess = useCallback((module: Module, action: 'read' | 'write' = 'read'): boolean => {
        if (!user) return false;

        const modulePerms = MODULE_PERMISSIONS[module];
        if (!modulePerms) {
            console.warn(`RBAC: Unknown module '${module}' requested.`);
            return false;
        }

        const rolePerm = modulePerms[role];
        if (!rolePerm || rolePerm === 'none') return false;

        if (action === 'read') {
            // Both 'read' and 'write' permissions allow reading
            return rolePerm === 'read' || rolePerm === 'write';
        }

        if (action === 'write') {
            return rolePerm === 'write';
        }

        return false;
    }, [user, role]);

    const canRead = (module: Module): boolean => checkAccess(module, 'read');
    const canWrite = (module: Module): boolean => checkAccess(module, 'write');

    return {
        checkAccess,
        canRead,
        canWrite,
        role,
        MODULE_PERMISSIONS // Exporting for reference/debugging if needed
    };
};
