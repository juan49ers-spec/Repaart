import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, User } from '../services/userService';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, functions } from '../lib/firebase';
import { logAction, AUDIT_ACTIONS } from '../lib/audit';
import { CreateUserInput, UpdateUserInput } from '../features/admin/users/CreateUserModal';
import { httpsCallable } from 'firebase/functions';

class SecurityError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SecurityError";
    }
}

interface UserManagerReturn {
    users: User[];
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

export const useUserManager = (currentUser: { uid: string; role?: string; email?: string | null; franchiseId?: string } | null, franchiseId: string | null = null): UserManagerReturn => {
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
            if (!isAdmin && !isFranchise) throw new SecurityError("Acceso Denegado");

            const effectiveFranchiseId = franchiseId || (isFranchise ? currentUser?.franchiseId : null);

            const fetchedUsers = await userService.fetchUsers(
                roleFilter !== 'all' ? roleFilter : null,
                effectiveFranchiseId || null
            );

            return fetchedUsers;
        },
        enabled: !!(isAdmin || isFranchise),
        staleTime: 2 * 60 * 1000
    });

    // MUTATION: Create User (Server-Side)
    const createUserMutation = useMutation({
        mutationFn: async ({ userData, password }: { userData: CreateUserInput; password?: string }) => {
            if (!password && !['driver', 'staff', 'rider'].includes(userData.role)) {
                throw new Error("Password required for new user");
            }

            const createUserManagedFn = httpsCallable(functions, 'createUserManaged');

            const payload = {
                email: userData.email,
                password: password,
                role: userData.role,
                franchiseId: franchiseId || userData.franchiseId,
                displayName: userData.displayName,
                phoneNumber: userData.phoneNumber ? (userData.phoneNumber.startsWith('+') ? userData.phoneNumber : `+34${userData.phoneNumber}`) : undefined,
                status: userData.status || 'active',
                pack: userData.pack,
                name: userData.name,
                legalName: userData.legalName,
                cif: userData.cif,
                address: userData.address
            };

            const result = await createUserManagedFn(payload);
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
            if (isFranchise) {
                // Franchise checked by rules
            } else {
                checkAdminPermission();
            }

            const {
                role,
                franchiseId: newFranchiseId,
                status,
                ...profileUpdates
            } = updates;

            // 1. Governance: Role & Franchise
            if (role !== undefined || newFranchiseId !== undefined) {
                await userService.setUserRole(
                    uid,
                    (role as string) || 'user',
                    (newFranchiseId as string | null) ?? null
                );
            }

            // 2. Governance: Status
            if (status !== undefined) {
                await userService.setUserStatus(
                    uid,
                    status as 'active' | 'pending' | 'banned' | 'deleted'
                );
            }

            // 3. Profile: Normal fields
            if (Object.keys(profileUpdates).length > 0) {
                await userService.updateUserProfile(uid, profileUpdates as Partial<User>);
            }

            await logAction(currentUser, AUDIT_ACTIONS.UPDATE_USER, { uid, updates });
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
                (user.franchiseId && user.franchiseId.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
            const isNotDeleted = user.status !== 'deleted';

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
        return updateUser(uid, { status: newStatus as UpdateUserInput['status'] });
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
        refetch
    };
};

