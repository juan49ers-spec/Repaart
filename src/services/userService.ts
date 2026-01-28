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
            console.error("Error fetching user profile:", error);
            throw error;
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
            console.error("Error fetching user by franchiseId:", error);
            throw error;
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
            console.error("Error updating user:", error);
            throw error;
        }
    },

    setUserProfile: async (uid: string, data: Partial<User>): Promise<void> => {
        try {
            await setDoc(doc(db, COLLECTIONS.USERS, uid), {
                ...data,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Error setting user profile:", error);
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
            console.error("Error fetching users:", error);
            return [];
        }
    },

    // --- BUSINESS ENTITIES (Franchises) ---

    createFranchise: async (franchiseData: any): Promise<{ success: boolean; data: { id: string } }> => {
        try {
            // Validation: Ensure zipCodes are present
            const zipCodes = franchiseData.location?.zipCodes || franchiseData.zipCodes;
            if (!zipCodes || !Array.isArray(zipCodes) || zipCodes.length === 0) {
                throw new Error("Datos incompletos: Faltan códigos postales (zipCodes)");
            }

            // Flatten location data for User schema compatibility
            const flatData = {
                ...franchiseData,
                role: 'franchise',
                status: 'active',
                isActive: true, // Legacy compatibility
                zipCodes: zipCodes,
                city: franchiseData.location?.city || franchiseData.city,
                address: franchiseData.location?.address || franchiseData.address,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            // Remove nested location if it was flattened to avoid duplication/confusion
            if (flatData.location) delete flatData.location;

            const docRef = await addDoc(collection(db, 'franchises'), flatData);

            return {
                success: true,
                data: { id: docRef.id }
            };
        } catch (error) {
            console.error("Error creating franchise:", error);
            throw error;
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
            console.error("Error deleting user:", error);
            throw error;
        }
    },

    fetchFranchises: async (): Promise<Franchise[]> => {
        try {
            const q = query(collection(db, COLLECTIONS.USERS), where('role', '==', 'franchise'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(mapDocToFranchise);
        } catch (error) {
            console.error("Error fetching franchises:", error);
            return [];
        }
    }
};
