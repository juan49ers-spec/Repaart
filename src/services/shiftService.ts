import { db } from '../lib/firebase';
import {
    collection,
    query,
    where,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    onSnapshot,
    Timestamp,
    Unsubscribe,
    DocumentData
} from 'firebase/firestore';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface Shift {
    shiftId: string;
    startAt: string; // ISO string
    endAt: string;   // ISO string
    riderId: string | null;
    riderName: string;
    motoId: string | null;
    motoPlate: string;
    franchiseId: string;
}

export interface ShiftInput {
    franchiseId: string;
    riderId?: string | null;
    riderName?: string;
    motoId?: string | null;
    motoPlate?: string;
    startAt: string; // ISO string
    endAt: string;   // ISO string
}

// =====================================================
// SERVICE
// =====================================================

const COLLECTION = 'work_shifts';

export const shiftService = {
    /**
     * Suscribe a los turnos de un rango de fechas (Semana)
     */
    subscribeToWeekShifts: (
        franchiseId: string,
        startOfWeek: Date,
        endOfWeek: Date,
        callback: (shifts: Shift[]) => void
    ): Unsubscribe => {
        if (!franchiseId) return () => { };

        // Convertir fechas JS a Timestamps de Firestore para la query
        const startTs = Timestamp.fromDate(startOfWeek);
        const endTs = Timestamp.fromDate(endOfWeek);

        const q = query(
            collection(db, COLLECTION),
            where('franchise_id', '==', franchiseId),
            where('start_time', '>=', startTs),
            where('start_time', '<=', endTs)
        );

        return onSnapshot(q, (snapshot) => {
            const shifts: Shift[] = snapshot.docs.map(doc => {
                const data = doc.data() as DocumentData;
                return {
                    shiftId: doc.id,
                    // Mapeo crítico para el Frontend
                    startAt: data.start_time?.toDate().toISOString() ?? '',
                    endAt: data.end_time?.toDate().toISOString() ?? '',
                    riderId: data.rider_id ?? null,
                    riderName: data.rider_name ?? 'Sin asignar', // Desnormalizado para lectura rápida
                    motoId: data.vehicle_id ?? null,
                    motoPlate: data.vehicle_plate ?? '', // Desnormalizado
                    franchiseId: data.franchise_id
                };
            });
            callback(shifts);
        }, (error) => {
            console.error("Error subscribing to shifts:", error);
            // Si el error es de índices, lo mostramos claro
            if (error.code === 'failed-precondition') {
                console.warn("⚠️ FALTA ÍNDICE COMPUESTO EN FIRESTORE. Crea este índice: " + error.message);
            }
        });
    },

    createShift: async (shiftData: ShiftInput): Promise<void> => {
        // Conversión de ISO String a Timestamp
        const payload = {
            franchise_id: shiftData.franchiseId,
            rider_id: shiftData.riderId ?? null,
            rider_name: shiftData.riderName ?? 'Sin asignar',
            vehicle_id: shiftData.motoId ?? null,
            vehicle_plate: shiftData.motoPlate ?? '',
            start_time: Timestamp.fromDate(new Date(shiftData.startAt)),
            end_time: Timestamp.fromDate(new Date(shiftData.endAt)),
            created_at: serverTimestamp(),
            type: 'standard'
        };
        await addDoc(collection(db, COLLECTION), payload);
    },

    updateShift: async (shiftId: string, updates: Partial<ShiftInput>): Promise<void> => {
        const payload: Record<string, unknown> = {};
        if (updates.riderId !== undefined) payload.rider_id = updates.riderId;
        if (updates.riderName !== undefined) payload.rider_name = updates.riderName;
        if (updates.motoId !== undefined) payload.vehicle_id = updates.motoId;
        if (updates.motoPlate !== undefined) payload.vehicle_plate = updates.motoPlate;
        if (updates.startAt) payload.start_time = Timestamp.fromDate(new Date(updates.startAt));
        if (updates.endAt) payload.end_time = Timestamp.fromDate(new Date(updates.endAt));

        payload.updated_at = serverTimestamp();

        const ref = doc(db, COLLECTION, shiftId);
        await updateDoc(ref, payload);
    },

    deleteShift: async (shiftId: string): Promise<void> => {
        await deleteDoc(doc(db, COLLECTION, shiftId));
    }
};
