import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
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
import {
    User,
    Franchise,
    toUserId
} from '../schemas/users';
import { ServiceError, validationError } from '../utils/ServiceError';

export type { User, Franchise };
export { toUserId };

// =====================================================
// MAPPERS
// =====================================================

const mapDocToUser = (doc: QueryDocumentSnapshot<DocumentData>): User => {
    const data = doc.data();
    return {
        uid: toUserId(doc.id),
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

    updateUser: async (uid: string, data: Partial<User>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTIONS.USERS, uid);
            await setDoc(docRef, {
                ...data,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            throw new ServiceError('updateUser', { cause: error });
        }
    },

    setUserProfile: async (uid: string, data: Partial<User>): Promise<void> => {
        try {
            await setDoc(doc(db, COLLECTIONS.USERS, uid), {
                ...data,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            throw new ServiceError('setUserProfile', { cause: error });
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

    createFranchise: async (franchiseData: object): Promise<{ success: boolean; data: { id: string } }> => {
        const data = franchiseData as Record<string, unknown>;
        // Validation: Ensure zipCodes are present
        const location = data.location as Record<string, unknown> | undefined;
        const zipCodes = (location?.zipCodes ?? data.zipCodes) as string[] | undefined;
        if (!zipCodes || !Array.isArray(zipCodes) || zipCodes.length === 0) {
            throw validationError('createFranchise', 'Datos incompletos: Faltan códigos postales (zipCodes)');
        }

        try {
            // Flatten location data for User schema compatibility
            const flatData = {
                ...data,
                role: 'franchise',
                status: 'active',
                isActive: true,
                zipCodes,
                city: location?.city ?? data.city,
                address: location?.address ?? data.address,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            // Remove nested location to avoid duplication
            if ('location' in flatData) delete (flatData as Record<string, unknown>).location;

            const docRef = await addDoc(collection(db, 'franchises'), flatData);

            return {
                success: true,
                data: { id: docRef.id }
            };
        } catch (error) {
            throw new ServiceError('createFranchise', { cause: error });
        }
    },

    deleteUser: async (uid: string): Promise<void> => {
        try {
            const { getFunctions, httpsCallable } = await import('firebase/functions');
            const { getApp } = await import('firebase/app');

            const functions = getFunctions(getApp());
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
