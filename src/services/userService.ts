import { db, functions } from '../lib/firebase';
import {
    collection,
    doc,
    serverTimestamp,
    getDoc,
    setDoc,
    getDocs,
    query,
    where,
    QueryConstraint,
    QueryDocumentSnapshot,
    DocumentData
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import {
    User,
    Franchise,
    toUserId
} from '../schemas/users';
import { ServiceError } from '../utils/ServiceError';

export type { User, Franchise };
export { toUserId };

// =====================================================
// MAPPERS
// =====================================================

const mapDocToUser = (doc: QueryDocumentSnapshot<DocumentData>): User => {
    const data = doc.data();
    const userId = doc.id;

    // Debug log
    if (!userId) {
        console.error('[mapDocToUser] Document ID is missing!', { doc, data });
    }

    return {
        uid: toUserId(userId),
        id: data.id || doc.id,
        email: data.email || '',
        displayName: data.displayName || data.name || '',
        role: data.role || 'user',
        status: data.status || 'active',
        franchiseId: data.franchiseId || (data.role === 'franchise' ? doc.id : ''),
        phoneNumber: data.phoneNumber || data.phone || '',
        photoURL: data.photoURL || '',
        pack: data.pack,
        legalName: data.legalName || data.name || '',
        cif: data.cif || '',
        city: data.city || '',
        address: data.address || '',
        zipCodes: data.zipCodes || [],
        monthlyRevenueGoal: data.monthlyRevenueGoal || data.goal || 0,
        notifications: data.notifications || {},
        logisticsRates: data.logisticsRates || [],
        pricingModel: data.pricingModel || 'standard',
        createdAt: data.createdAt || data.created_at,
        updatedAt: data.updatedAt || data.updated_at
    } as User;
};

const mapDocToFranchise = (doc: QueryDocumentSnapshot<DocumentData>): Franchise => {
    const data = doc.data();
    return {
        id: data.id || doc.id,
        uid: data.uid || doc.id,
        name: data.name || data.displayName || data.email || 'Franquicia',
        email: data.email || '',
        role: data.role || 'franchise',
        isActive: data.isActive !== undefined ? data.isActive : (data.active !== undefined ? data.active : (data.status === 'active' || data.status !== 'deleted')),
        status: data.status || 'active',
        location: data.location || data.address || '',
        settings: data.settings || { isActive: data.active !== undefined ? data.active : true },
        displayName: data.displayName || data.name || '',
        metrics: data.metrics || {},
        createdAt: data.createdAt || data.created_at,
        updatedAt: data.updatedAt || data.updated_at
    } as Franchise;
};

// =====================================================
// SERVICE
// =====================================================

const COLLECTIONS = {
    USERS: 'users',
    USER_PREFERENCES: 'user_preferences',
    FRANCHISES: 'franchises'
};

const GOVERNANCE_FIELDS = new Set(['role', 'franchiseId', 'status', 'admin']);

function hasGovernanceFields(data: Record<string, unknown>): boolean {
    return Object.keys(data).some((key) => GOVERNANCE_FIELDS.has(key));
}

export const userService = {
    // --- IDENTITY (Users) ---

    getUserProfile: async (uid: string): Promise<User | null> => {
        try {
            if (!uid) return null;
            const docRef = doc(db, COLLECTIONS.USERS, uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                return mapDocToUser(snap as QueryDocumentSnapshot<DocumentData>);
            }
            return null;
        } catch (error) {
            throw new ServiceError('getUserProfile', { cause: error });
        }
    },

    getUserByFranchiseId: async (franchiseId: string): Promise<User | null> => {
        try {
            if (!franchiseId) return null;
            const q = query(collection(db, COLLECTIONS.USERS), where('franchiseId', '==', franchiseId));
            const snap = await getDocs(q);
            if (!snap.empty) {
                return mapDocToUser(snap.docs[0]);
            }
            return null;
        } catch (error) {
            throw new ServiceError('getUserByFranchiseId', { cause: error });
        }
    },

    updateUserProfile: async (uid: string, data: Partial<User>): Promise<void> => {
        try {
            if (hasGovernanceFields(data as Record<string, unknown>)) {
                throw new Error('updateUserProfile no permite modificar campos de gobernanza (rol, status, franchiseId). Use los métodos setUserRole o setUserStatus.');
            }

            const docRef = doc(db, COLLECTIONS.USERS, uid);
            await setDoc(docRef, {
                ...data,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Error updating user profile:", error);
            throw error;
        }
    },

    updateUser: async (uid: string, data: Partial<User>): Promise<void> => {
        return userService.updateUserProfile(uid, data);
    },

    setUserRole: async (
        targetUid: string,
        newRole: string,
        franchiseId: string | null = null
    ): Promise<void> => {
        try {
            const setRoleFn = httpsCallable(functions, 'setRole');
            await setRoleFn({
                targetUid,
                newRole,
                franchiseId
            });
        } catch (error) {
            console.error("Error setting user role:", error);
            throw error;
        }
    },

    setUserStatus: async (
        targetUid: string,
        newStatus: 'active' | 'pending' | 'banned' | 'deleted'
    ): Promise<void> => {
        try {
            const setUserStatusFn = httpsCallable(functions, 'setUserStatus');
            await setUserStatusFn({
                targetUid,
                newStatus
            });
        } catch (error) {
            console.error("Error setting user status:", error);
            throw error;
        }
    },

    fetchUsers: async (roleFilter: string | null = null, franchiseId: string | null = null): Promise<User[]> => {
        try {
            const usersRef = collection(db, COLLECTIONS.USERS);
            const constraints: QueryConstraint[] = [];

            if (roleFilter) {
                constraints.push(where('role', '==', roleFilter));
            }

            if (franchiseId) {
                constraints.push(where('franchiseId', '==', franchiseId));
            }

            const q = query(usersRef, ...constraints);
            const snapshot = await getDocs(q);
            return snapshot.docs.map(mapDocToUser);
        } catch (error) {
            throw new ServiceError('fetchUsers', { cause: error });
        }
    },

    // --- BUSINESS ENTITIES (Franchises) ---

    createFranchise: async (franchiseData: any): Promise<{ success: boolean; data: { id: string } }> => {
        try {
            // Client-side validation to match tests and prevent empty requests
            if (!franchiseData.location?.zipCodes || franchiseData.location.zipCodes.length === 0) {
                throw new Error("Datos incompletos: Se requieren códigos postales.");
            }

            const createFranchiseFn = httpsCallable(functions, 'createFranchise');
            const result = await createFranchiseFn(franchiseData);
            const data = result.data as { success: boolean; data: { id: string } };
            return data;
        } catch (error) {
            if (error instanceof Error && error.message.includes("Datos incompletos")) {
                throw error;
            }
            console.error("Error creating franchise:", error);
            throw new ServiceError('createFranchise', { cause: error });
        }
    },

    deleteUser: async (uid: string): Promise<void> => {
        try {
            const adminDeleteUser = httpsCallable(functions, 'adminDeleteUser');
            await adminDeleteUser({ uid });
        } catch (error) {
            throw new ServiceError('deleteUser', { cause: error });
        }
    },

    fetchFranchises: async (): Promise<Franchise[]> => {
        try {
            const q = query(collection(db, COLLECTIONS.USERS), where('role', '==', 'franchise'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(mapDocToFranchise);
        } catch (error) {
            throw new ServiceError('fetchFranchises', { cause: error });
        }
    }
};
