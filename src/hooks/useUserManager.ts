import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, UserProfile } from '../services/userService';
import { sendPasswordResetEmail, createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import { initializeApp, getApp } from 'firebase/app';
import { auth, firebaseConfigExport } from '../lib/firebase';
import { logAction, AUDIT_ACTIONS } from '../lib/audit';
import { serverTimestamp } from 'firebase/firestore';
import { CreateUserInput, UpdateUserInput } from '../features/admin/users/CreateUserModal';

// Helper for secondary auth instance (Singleton pattern)
let secondaryApp: any;
try {
    secondaryApp = getApp("SecondaryAuth");
} catch {
    secondaryApp = initializeApp(firebaseConfigExport, "SecondaryAuth");
}

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

    // Permission check for user creation - allows franchise owners within their context
    const checkUserCreationPermission = useCallback((targetFranchiseId?: string) => {
        // Admin can create any user
        if (isAdmin) return;

        // Franchise can create users for their own franchise
        if (isFranchise && currentUser?.uid && targetFranchiseId === currentUser.uid) return;

        // Otherwise denied
        throw new SecurityError("No tienes permisos para crear usuarios en esta franquicia.");
    }, [isAdmin, isFranchise, currentUser]);

    const checkSelfAction = useCallback((targetUid: string) => {
        if (!currentUser) return;
        if (targetUid === currentUser.uid) {
            throw new SecurityError("No puedes realizar esta acción sobre tu propio usuario.");
        }
    }, [currentUser]);

    // QUERY: Fetch Users
    const {
        data: users = [],
        isLoading: loading,
        error,
        refetch
    } = useQuery({
        queryKey: ['users', roleFilter, franchiseId], // Add franchiseId to key
        queryFn: async () => {
            if (!isAdmin) throw new SecurityError("Acceso Denegado");

            // If franchiseId is provided (God Mode limit), we might need a specific fetch
            // But for now, we'll fetch all and filter in memory OR rely on userService.fetchUsers supporting it
            // Ideally userService.fetchUsers should support franchiseId filtering.
            // Let's implement client-side filtering below if server-side isn't ready,
            // or better, update fetchUsers in userService.

            // For now, consistent with existing logic:
            const allUsers = await userService.fetchUsers(roleFilter !== 'all' ? roleFilter : null);

            // Filter by franchise if in "God Mode" context
            if (franchiseId) {
                return allUsers.filter(u => u.franchiseId === franchiseId);
            }

            return allUsers;
        },
        enabled: !!isAdmin,
        staleTime: 2 * 60 * 1000
    });

    // MUTATION: Create User
    const createUserMutation = useMutation({
        mutationFn: async ({ userData, password }: { userData: CreateUserInput; password?: string }) => {
            // Check permission - admin can create any, franchise can create for their own
            const targetFranchiseId = franchiseId || userData.franchiseId;
            checkUserCreationPermission(targetFranchiseId);

            if (!password && !['driver', 'staff'].includes(userData.role)) {
                throw new Error("Password required for new user");
            }

            let uid;

            // 1. Auth Creation (ONLY if password provided)
            if (password) {
                const secondaryAuth = getAuth(secondaryApp);
                const userCredential = await createUserWithEmailAndPassword(secondaryAuth, userData.email, password);
                uid = userCredential.user.uid;
                await signOut(secondaryAuth); // Clean up session
            } else {
                // Generate a random ID for data-only users
                const { doc } = await import('firebase/firestore');
                const { db } = await import('../lib/firebase');
                const { collection } = await import('firebase/firestore');
                // Use a database generated ID
                const newDocRef = doc(collection(db, 'users'));
                uid = newDocRef.id;
            }

            // 2. Profile Creation (Unified in 'users' collection)
            const profileData: any = {
                uid,
                email: userData.email,
                displayName: userData.displayName || userData.email,
                role: userData.role || 'user',
                franchiseId: franchiseId || userData.franchiseId || null, // Inject context franchiseId if present
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                status: userData.status || 'active'
            };

            if (userData.pack) profileData.pack = userData.pack;
            if (userData.phoneNumber) profileData.phoneNumber = userData.phoneNumber;

            // Franchise-specific fields
            if (userData.name) profileData.name = userData.name;
            if (userData.legalName) profileData.legalName = userData.legalName;
            if (userData.cif) profileData.cif = userData.cif;
            if (userData.address) profileData.address = userData.address;

            // Single Source of Truth Write
            await userService.setUserProfile(uid, profileData);

            await logAction(currentUser, AUDIT_ACTIONS.CREATE_USER, { email: userData.email });
            return uid;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });

    // MUTATION: Update User
    const updateUserMutation = useMutation({
        mutationFn: async ({ uid, updates }: { uid: string; updates: Partial<UpdateUserInput> }) => {
            checkAdminPermission();
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

