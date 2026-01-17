import { db } from '../lib/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    writeBatch,
    Timestamp,
    DocumentData
} from 'firebase/firestore';

// ==========================================
// TYPES
// ==========================================

export interface Rider {
    id: string;
    fullName: string;
    phone: string;
    role: 'rider' | 'staff' | 'admin' | 'franchise' | 'developer';
    franchiseId?: string;
    status: 'active' | 'inactive' | 'deleted';
    drivingLicenseExpiry?: string | null; // YYYY-MM-DD
    punctualityScore?: number;
    completedShifts?: number;
    displayName?: string; // Legacy/Auth sync
    phoneNumber?: string; // Legacy/Auth sync
    email?: string; // Often needed for riders
    photoURL?: string; // Avatar
    createdAt?: Timestamp | Date | string; // Allow string for serialized data
    updatedAt?: Timestamp | Date | string;
}

/**
 * Raw Firestore document shape (legacy & modern fields combined)
 * Used for safe normalization in fetchRiders
 */
interface RawUserDoc {
    // Modern fields
    fullName?: string;
    phone?: string;
    email?: string;
    photoURL?: string;
    franchiseId?: string;
    status?: string;
    role?: string;
    drivingLicenseExpiry?: string | null;
    punctualityScore?: number;
    completedShifts?: number;
    createdAt?: Timestamp | Date | string;
    updatedAt?: Timestamp | Date | string;
    // Legacy fields (for backward compatibility)
    name?: string;           // -> fullName
    displayName?: string;   // -> fullName  
    phoneNumber?: string;   // -> phone
}

export interface Moto {
    id: string;
    plate: string;
    model: string;
    franchiseId: string;
    status: 'active' | 'maintenance' | 'deleted';
    year?: number;
    lastMaintenance?: string; // YYYY-MM-DD
    nextRevisionKm?: number;
    currentKm?: number;
    brand?: string;
    createdAt?: Timestamp | Date | string;
    updatedAt?: Timestamp | Date | string;
}

export interface Shift {
    id: string;
    franchiseId: string;
    riderId: string;
    motoId?: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    type: 'morning' | 'afternoon' | 'night' | 'custom';
    status?: 'scheduled' | 'completed' | 'cancelled';
    isConfirmed?: boolean;
    isDraft?: boolean;
    weekId?: string;
}

// ==========================================
// SERVICE
// ==========================================

const COLLECTIONS = {
    RIDERS: 'users', // Unificado con colección principal de usuarios
    MOTOS: 'franchise_motos',
    SHIFTS: 'franchise_shifts'
} as const;

export const operationsService = {
    // --- RIDERS (Drivers & Staff) ---
    fetchRiders: async (franchiseId: string): Promise<Rider[]> => {
        if (!franchiseId) return [];

        const q = query(
            collection(db, COLLECTIONS.RIDERS),
            where('franchiseId', '==', franchiseId)
        );

        const snapshot = await getDocs(q);

        // Map to typed RawUserDoc for safe normalization
        const rawUsers: (RawUserDoc & { id: string })[] = snapshot.docs.map(doc => {
            const data = doc.data() as RawUserDoc;
            return {
                id: doc.id,
                ...data
            };
        });

        // Normalize and filter in memory
        return rawUsers.map(data => {
            // Priority: displayName -> name (legacy) -> fullName -> Default
            const resolvedName = data.displayName || data.name || data.fullName || 'Sin Nombre';
            const resolvedPhone = data.phoneNumber || data.phone || '';

            const status = data.status || 'active';
            const validStatus: Rider['status'] = ['active', 'inactive', 'deleted'].includes(status)
                ? (status as Rider['status'])
                : 'active';

            const role = data.role || 'rider';
            const validRole: Rider['role'] = ['rider', 'staff', 'admin', 'franchise', 'developer'].includes(role)
                ? (role as Rider['role'])
                : 'rider';

            const rider: Rider = {
                id: data.id,
                fullName: resolvedName,
                phone: resolvedPhone,
                role: validRole,
                franchiseId: data.franchiseId,
                status: validStatus,
                drivingLicenseExpiry: data.drivingLicenseExpiry || null,
                punctualityScore: data.punctualityScore || 10.0,
                completedShifts: data.completedShifts || 0,
                email: data.email,
                photoURL: data.photoURL,
                createdAt: data.createdAt as Timestamp | Date,
                updatedAt: data.updatedAt as Timestamp | Date
            };
            return rider;
        }).filter(user =>
            ['rider', 'staff'].includes(user.role) &&
            user.status !== 'deleted'
        );
    },

    createRider: async (riderData: Partial<Rider>): Promise<DocumentData> => {
        // NOTA: Esto crea el documento en Firestore pero NO la cuenta de Auth.
        return await addDoc(collection(db, COLLECTIONS.RIDERS), {
            ...riderData,
            displayName: riderData.fullName, // Estandarizar
            phoneNumber: riderData.phone,    // Estandarizar
            role: 'rider',
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    },

    updateRider: async (riderId: string, updates: Partial<Rider>): Promise<void> => {
        const ref = doc(db, COLLECTIONS.RIDERS, riderId);

        // Construct payload with explicit type handling
        // Use a strictly typed object for the update
        const payload: Partial<Rider> & { displayName?: string; phoneNumber?: string } = { ...updates };

        // Mapeo inverso para guardar estandarizado
        if (payload.fullName) payload.displayName = payload.fullName;
        if (payload.phone) payload.phoneNumber = payload.phone;

        // Ensure we don't accidentally save undefineds if not intended
        const finalPayload = {
            ...payload,
            updatedAt: serverTimestamp()
        };


        await updateDoc(ref, finalPayload);
    },

    deleteRider: async (riderId: string): Promise<void> => {
        const ref = doc(db, COLLECTIONS.RIDERS, riderId);
        await updateDoc(ref, { status: 'deleted' });
    },

    // --- MOTOS ---
    fetchMotos: async (franchiseId: string): Promise<Moto[]> => {
        if (!franchiseId) return [];
        const q = query(
            collection(db, COLLECTIONS.MOTOS),
            where('franchiseId', '==', franchiseId),
            where('status', '!=', 'deleted')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Moto));
    },

    createMoto: async (motoData: Partial<Moto>): Promise<DocumentData> => {
        return await addDoc(collection(db, COLLECTIONS.MOTOS), {
            ...motoData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    },

    updateMoto: async (motoId: string, updates: Partial<Moto>): Promise<void> => {
        const ref = doc(db, COLLECTIONS.MOTOS, motoId);
        await updateDoc(ref, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    },

    deleteMoto: async (motoId: string): Promise<void> => {
        const ref = doc(db, COLLECTIONS.MOTOS, motoId);
        await updateDoc(ref, { status: 'deleted' });
    },

    // --- SHIFTS (SCHEDULER) ---
    fetchWeekShifts: async (franchiseId: string, _startOfWeekStub?: string): Promise<Shift[]> => {
        if (!franchiseId) return [];
        const q = query(
            collection(db, COLLECTIONS.SHIFTS),
            where('franchiseId', '==', franchiseId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
    },

    createShift: async (shiftData: Partial<Shift>): Promise<DocumentData> => {
        return await addDoc(collection(db, COLLECTIONS.SHIFTS), {
            ...shiftData,
            createdAt: serverTimestamp()
        });
    },

    updateShift: async (shiftId: string, updates: Partial<Shift>): Promise<void> => {
        const ref = doc(db, COLLECTIONS.SHIFTS, shiftId);
        await updateDoc(ref, { ...updates });
    },

    deleteShift: async (shiftId: string): Promise<void> => {
        await deleteDoc(doc(db, COLLECTIONS.SHIFTS, shiftId));
    },

    // --- BULK OPERATIONS ---
    // Stub typed for future implementation
    copyWeek: async (_franchiseId: string, _sourceWeekShifts: Shift[], _targetDatesMap: Record<string, string>): Promise<void> => {
        const batch = writeBatch(db);
        // Implement logic here
        await batch.commit();
    }
};
