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
    role: 'driver' | 'staff' | 'admin' | 'franchise' | 'developer';
    franchiseId?: string;
    status: 'active' | 'inactive' | 'deleted';
    drivingLicenseExpiry?: string | null; // YYYY-MM-DD
    punctualityScore?: number;
    completedShifts?: number;
    displayName?: string; // Legacy/Auth sync
    phoneNumber?: string; // Legacy/Auth sync
    createdAt?: Timestamp | Date;
    updatedAt?: Timestamp | Date;
    [key: string]: any; // Flexibilidad para campos extra
}

export interface Moto {
    id: string;
    plate: string;
    model: string;
    franchiseId: string;
    status: 'active' | 'maintenance' | 'deleted';
    year?: number;
    lastMaintenance?: string; // YYYY-MM-DD
    [key: string]: any;
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
    [key: string]: any;
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

        // QUERY SIMPLIFICADA: Evitar índices compuestos faltantes.
        const q = query(
            collection(db, COLLECTIONS.RIDERS),
            where('franchiseId', '==', franchiseId)
        );

        const snapshot = await getDocs(q);
        const allFranchiseUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rider));

        // Filtrado en memoria (Infalible)
        return allFranchiseUsers.map(data => ({
            ...data,
            fullName: data.displayName || data.name || data.fullName || 'Sin Nombre',
            phone: data.phoneNumber || data.phone || '',
            drivingLicenseExpiry: data.drivingLicenseExpiry || null,
            punctualityScore: data.punctualityScore || 10.0,
            completedShifts: data.completedShifts || 0
        })).filter(user =>
            // 1. Debe ser driver o staff
            ['driver', 'staff'].includes(user.role) &&
            // 2. No debe estar borrado
            user.status !== 'deleted'
        );
    },

    createRider: async (riderData: Partial<Rider>): Promise<DocumentData> => {
        // NOTA: Esto crea el documento en Firestore pero NO la cuenta de Auth.
        return await addDoc(collection(db, COLLECTIONS.RIDERS), {
            ...riderData,
            displayName: riderData.fullName, // Estandarizar
            phoneNumber: riderData.phone,    // Estandarizar
            role: 'driver',
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    },

    updateRider: async (riderId: string, updates: Partial<Rider>): Promise<void> => {
        const ref = doc(db, COLLECTIONS.RIDERS, riderId);
        const payload: any = { ...updates };

        // Mapeo inverso para guardar estandarizado
        if (payload.fullName) payload.displayName = payload.fullName;
        if (payload.phone) payload.phoneNumber = payload.phone;

        await updateDoc(ref, {
            ...payload,
            updatedAt: serverTimestamp()
        });
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
    copyWeek: async (_franchiseId: string, _sourceWeekShifts: Shift[], _targetDatesMap: any): Promise<void> => {
        const batch = writeBatch(db);
        // Implement logic here
        await batch.commit();
    }
};
