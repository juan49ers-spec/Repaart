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
    FieldValue,
    QueryConstraint
} from 'firebase/firestore';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface UserProfile {
    uid: string;
    id?: string;
    email?: string;
    displayName?: string;
    phoneNumber?: string; // Standard
    phone?: string;       // Legacy?
    role?: string;
    franchiseId?: string;
    pack?: 'basic' | 'premium';
    status?: 'active' | 'pending' | 'banned' | 'deleted';
    name?: string;
    legalName?: string;
    cif?: string;
    city?: string;
    address?: string;
    zipCodes?: string[];
    logisticsRates?: any[]; // Consider typing strictly if schema known
    notifications?: {
        email?: boolean;
        push?: boolean;
        [key: string]: boolean | undefined;
    };
    photoURL?: string;
    createdAt?: Date | FieldValue | string | { seconds: number, nanoseconds: number };
    updatedAt?: Date | FieldValue | string | { seconds: number, nanoseconds: number };
    updated_at?: Date | FieldValue; // Legacy support
}

export interface FranchiseLocation {
    zipCodes: string[];
}

export interface FranchiseSettings {
    isActive: boolean;
}

export interface FranchiseData {
    name: string;
    location: FranchiseLocation;
    settings: FranchiseSettings;
}

export interface FranchiseEntity {
    id: string;
    uid: string;
    name?: string;
    email?: string;
    role?: string;
    active?: boolean;
    status?: string;
    location?: FranchiseLocation | string;
    settings?: FranchiseSettings;
    displayName?: string;
    metrics?: {
        revenue?: number;
        orders?: number;
        profit?: number;
        margin?: number;
    };
    createdAt?: Date | FieldValue;
    updatedAt?: Date | FieldValue;
}

export interface CreateFranchiseResult {
    success: boolean;
    data: {
        id: string;
    };
}

// =====================================================
// SERVICE
// =====================================================

const COLLECTIONS = {
    USERS: 'users',
    FRANCHISES: 'franchises'
};

export const userService = {
    // --- IDENTITY (Users) ---

    /**
     * Get user profile by UID
     */
    getUserProfile: async (uid: string): Promise<UserProfile | null> => {
        try {
            if (!uid) return null;
            const docRef = doc(db, COLLECTIONS.USERS, uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                return { uid: snap.id, ...snap.data() } as UserProfile;
            }
            return null;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            throw error;
        }
    },

    /**
     * Get user profile by custom Franchise ID
     */
    getUserByFranchiseId: async (franchiseId: string): Promise<UserProfile | null> => {
        try {
            if (!franchiseId) return null;
            const q = query(collection(db, COLLECTIONS.USERS), where('franchiseId', '==', franchiseId));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const doc = snap.docs[0];
                return { uid: doc.id, ...doc.data() } as UserProfile;
            }
            return null;
        } catch (error) {
            console.error("Error fetching user by franchiseId:", error);
            throw error;
        }
    },

    /**
     * Create or Update User Profile
     */
    updateUser: async (uid: string, data: Partial<UserProfile>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTIONS.USERS, uid);
            // Use setDoc with merge to ensure document exists
            await setDoc(docRef, {
                ...data,
                updated_at: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Error updating user:", error);
            throw error;
        }
    },

    /**
     * Set user profile data (Create/Overwrite)
     */
    setUserProfile: async (uid: string, data: Partial<UserProfile>): Promise<void> => {
        try {
            await setDoc(doc(db, COLLECTIONS.USERS, uid), {
                ...data,
                updated_at: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Error setting user profile:", error);
            throw error;
        }
    },

    /**
     * Get all users, optionally filtered by role
     */
    fetchUsers: async (roleFilter: string | null = null, franchiseId: string | null = null): Promise<UserProfile[]> => {
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
            return snapshot.docs.map(doc => ({
                id: doc.id,
                uid: doc.id,
                ...doc.data()
            } as UserProfile));
        } catch (error) {
            console.error("Error fetching users:", error);
            return []; // Return empty array on error to prevent crash
        }
    },

    // --- BUSINESS ENTITIES (Franchises) ---

    /**
     * Create a new Franchise Entity + Admin User link
     */
    createFranchise: async (franchiseData: FranchiseData): Promise<CreateFranchiseResult> => {
        try {

            // Validacion defensiva pre-flight (Cinturón de seguridad)
            if (!franchiseData.name || franchiseData.location.zipCodes.length === 0) {
                throw new Error("Datos incompletos: Nombre y al menos un CP son obligatorios.");
            }

            // Real Firestore Write
            const docRef = await addDoc(collection(db, COLLECTIONS.FRANCHISES), {
                ...franchiseData,
                role: 'franchise', // Mandatory for fetchUsers('franchise') to find it
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                // Ensure default values are consistent with fetchUsers expectations
                active: franchiseData.settings.isActive
            });

            return {
                success: true,
                data: {
                    id: docRef.id,
                    ...franchiseData
                }
            };
        } catch (error) {
            console.error("Error creating franchise:", error);
            throw error;
        }
    },

    /**
     * Delete user profile
     */
    deleteUser: async (uid: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTIONS.USERS, uid);
            // Note: This only deletes the Firestore profile
            // Firebase Auth user deletion requires admin SDK or secondary auth instance
            await setDoc(docRef, { status: 'deleted', updated_at: serverTimestamp() }, { merge: true });
        } catch (error) {
            console.error("Error deleting user:", error);
            throw error;
        }
    },
    /**
     * Get all franchises (users with role='franchise')
     */
    fetchFranchises: async (): Promise<FranchiseEntity[]> => {
        try {
            // Fetch users with role 'franchise' from the users collection
            const q = query(collection(db, COLLECTIONS.USERS), where('role', '==', 'franchise'));
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    uid: doc.id,
                    name: data.displayName || data.email || 'Franquicia',
                    active: data.status === 'active' || data.status !== 'deleted',
                    role: data.role,
                    email: data.email,
                    ...data
                } as FranchiseEntity;
            });
        } catch (error) {
            console.error("Error fetching franchises:", error);
            return [];
        }
    }
};
