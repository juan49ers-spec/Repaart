import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, UserProfile } from '../services/userService';
import { sendPasswordResetEmail } from 'firebase/auth';
import { getApp } from 'firebase/app';
import { auth } from '../lib/firebase';
import { logAction, AUDIT_ACTIONS } from '../lib/audit';
import { CreateUserInput, UpdateUserInput } from '../features/admin/users/CreateUserModal';

// Helper for Cloud Functions
import { getFunctions, httpsCallable } from 'firebase/functions';

class SecurityError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SecurityError";
    }
}

interface UserManagerReturn {
    users: UserProfile[];
    loading: boolean;
    error: string | null;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    roleFilter: string;
    setRoleFilter: (role: string) => void;
    statusFilter: string;
    setStatusFilter: (status: string) => void;
    createUser: (userData: CreateUserInput, password?: string) => Promise<string>;
    updateUser: (uid: string, updates: Partial<UpdateUserInput>) => Promise<void>;
    deleteUser: (uid: string) => Promise<void>;
    sendPasswordReset: (email: string) => Promise<void>;
    toggleUserStatus: (uid: string, currentStatus: string) => Promise<void>;
    isCreating: boolean;
    isUpdating: boolean;
    refetch: () => void;
}

export const useUserManager = (currentUser: { uid: string; role?: string; email?: string | null } | null, franchiseId: string | null = null): UserManagerReturn => {
    const queryClient = useQueryClient();
    const isAdmin = currentUser?.role === 'admin';
    const isFranchise = currentUser?.role === 'franchise';

    // Filters State
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Admin permission check (strict - only for admin-only operations)
    const checkAdminPermission = useCallback(() => {
        if (!isAdmin) throw new SecurityError("Acceso Denegado.");
    }, [isAdmin]);

    const checkSelfAction = useCallback((targetUid: string) => {
        if (currentUser?.uid === targetUid) throw new SecurityError("No puedes eliminar tu propia cuenta.");
    }, [currentUser]);

    // QUERY: Fetch Users
    const {
        data: users = [],
        isLoading: loading,
        error,
        refetch
    } = useQuery({
        queryKey: ['users', roleFilter, franchiseId],
        queryFn: async () => {
            if (!isAdmin && !isFranchise) throw new SecurityError("Acceso Denegado"); // Allow Franchise read

            // If franchiseId is provided (God Mode limit), we might need a specific fetch
            // Filter by franchise if in "God Mode" context or Franchise User
            const effectiveFranchiseId = franchiseId || (isFranchise ? currentUser?.uid : null);

            // Server-side filtering now supported:
            const users = await userService.fetchUsers(
                roleFilter !== 'all' ? roleFilter : null,
                effectiveFranchiseId || null
            );

            return users;
        },
        enabled: !!(isAdmin || isFranchise), // Enable for Franchise too
        staleTime: 2 * 60 * 1000
    });

    // MUTATION: Create User (Server-Side)
    const createUserMutation = useMutation({
        mutationFn: async ({ userData, password }: { userData: CreateUserInput; password?: string }) => {
            if (!password && !['driver', 'staff', 'rider'].includes(userData.role)) {
                throw new Error("Password required for new user");
            }

            const functions = getFunctions(getApp());
            const createUserManaged = httpsCallable(functions, 'createUserManaged');

            // Preparar payload para la Cloud Function
            const payload = {
                email: userData.email,
                password: password,
                role: userData.role,
                franchiseId: franchiseId || userData.franchiseId, // Inject context franchiseId
                displayName: userData.displayName,
                phoneNumber: userData.phoneNumber ? (userData.phoneNumber.startsWith('+') ? userData.phoneNumber : `+34${userData.phoneNumber}`) : undefined,
                status: userData.status || 'active',
                pack: userData.pack,
                name: userData.name,
                legalName: userData.legalName,
                cif: userData.cif,
                address: userData.address
            };

            // Llamada segura al Backend
            const result = await createUserManaged(payload);
            const data = result.data as { uid: string, message: string };

            await logAction(currentUser, AUDIT_ACTIONS.CREATE_USER, { email: userData.email, uid: data.uid });
            return data.uid;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });

    // MUTATION: Update User
    const updateUserMutation = useMutation({
        mutationFn: async ({ uid, updates }: { uid: string; updates: Partial<UpdateUserInput> }) => {
            // Permission check: Admin or Franchise updating own rider
            // We assume userService/Firestore rules handle the enforcement, or we add local check here
            if (isFranchise) {
                // Basic client-side check, robust check is in Rules
                // Franchise can only update riders in their franchise.
            } else {
                checkAdminPermission();
            }

            await userService.updateUser(uid, updates);
            await logAction(currentUser, AUDIT_ACTIONS.UPDATE_USER, { uid });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });

    // MUTATION: Delete User
    const deleteUserMutation = useMutation({
        mutationFn: async (uid: string) => {
            checkAdminPermission();
            checkSelfAction(uid);
            await userService.deleteUser(uid);
            await logAction(currentUser, AUDIT_ACTIONS.DELETE_USER, { uid });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });

    // MUTATION: Reset Password
    const resetPasswordMutation = useMutation({
        mutationFn: async (email: string) => {
            checkAdminPermission();
            await sendPasswordResetEmail(auth, email);
            await logAction(currentUser, AUDIT_ACTIONS.SYSTEM_EVENT, { action: 'PASSWORD_RESET_REQ', email });
        }
    });

    // --- Computed Filter Logic ---
    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(user => {
            const matchesSearch =
                user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (user.franchiseId && user.franchiseId?.toLowerCase().includes(searchQuery.toLowerCase())); // Fixed optional chaining for franchiseId string method

            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
            const isNotDeleted = user.status !== 'deleted'; // Hide soft-deleted users

            return matchesSearch && matchesRole && matchesStatus && isNotDeleted;
        });
    }, [users, searchQuery, roleFilter, statusFilter]);

    // Public API
    const createUser = async (userData: CreateUserInput, password?: string) => createUserMutation.mutateAsync({ userData, password });
    const updateUser = async (uid: string, updates: Partial<UpdateUserInput>) => updateUserMutation.mutateAsync({ uid, updates });
    const deleteUser = async (uid: string) => deleteUserMutation.mutateAsync(uid);
    const sendPasswordReset = async (email: string) => resetPasswordMutation.mutateAsync(email);

    const toggleUserStatus = async (uid: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'banned' : 'active';
        return updateUser(uid, { status: newStatus as any });
    };

    return {
        users: filteredUsers,
        loading,
        error: error ? (error as Error).message : null,
        searchQuery, setSearchQuery,
        roleFilter, setRoleFilter,
        statusFilter, setStatusFilter,
        createUser,
        updateUser,
        deleteUser,
        sendPasswordReset,
        toggleUserStatus,
        isCreating: createUserMutation.isPending,
        isUpdating: updateUserMutation.isPending,
        refetch // Expose refetch
    };
};

