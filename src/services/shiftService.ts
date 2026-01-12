import { db } from '../lib/firebase';
import { toLocalDateString, toLocalISOString } from '../utils/dateUtils';
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
    DocumentData,
    getDocs
} from 'firebase/firestore';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface Shift {
    id: string;      // Alias for shiftId
    shiftId: string;
    startAt: string; // ISO string
    endAt: string;   // ISO string
    date: string;    // YYYY-MM-DD
    riderId: string | null;
    riderName: string;
    motoId: string | null;
    motoPlate: string;
    franchiseId: string;
    // Fields for Cockpit V3 & Interactions
    status?: 'scheduled' | 'active' | 'completed';
    actualStart?: string;
    actualEnd?: string;
    isConfirmed?: boolean;
    swapRequested?: boolean;
    isDraft?: boolean;
}

export interface ShiftInput {
    franchiseId: string;
    riderId?: string | null;
    riderName?: string;
    motoId?: string | null;
    motoPlate?: string;
    startAt: string; // ISO string
    endAt: string;   // ISO string
    status?: 'scheduled' | 'active' | 'completed';
    isConfirmed?: boolean;
    swapRequested?: boolean;
}

// =====================================================
// =====================================

const COLLECTION = 'work_shifts';

export const shiftService = {
    /**
     * Subscribe to shifts (Week)
     */
    subscribeToWeekShifts: (
        franchiseId: string,
        startOfWeek: Date,
        endOfWeek: Date,
        callback: (shifts: Shift[]) => void
    ): Unsubscribe => {
        if (!franchiseId) return () => { };

        const startTs = Timestamp.fromDate(startOfWeek);
        const endTs = Timestamp.fromDate(endOfWeek);

        const q = query(
            collection(db, COLLECTION),
            where('franchiseId', '==', franchiseId),
            where('startAt', '>=', startTs),
            where('startAt', '<=', endTs)
        );

        return onSnapshot(q, (snapshot) => {
            const shifts: Shift[] = snapshot.docs.map(doc => {
                const data = doc.data() as DocumentData;
                const getTs = (keyCamel: string, keySnake: string) => data[keyCamel] || data[keySnake];
                const startVal = getTs('startAt', 'start_time');
                const endVal = getTs('endAt', 'end_time');

                return {
                    id: doc.id,
                    shiftId: doc.id,
                    startAt: startVal ? (startVal.toDate ? toLocalISOString(startVal.toDate()) : startVal) : '',
                    endAt: endVal ? (endVal.toDate ? toLocalISOString(endVal.toDate()) : endVal) : '',
                    date: startVal ? (startVal.toDate ? toLocalDateString(startVal.toDate()) : toLocalDateString(new Date(startVal))) : '',
                    riderId: data.riderId ?? data.rider_id ?? '',
                    riderName: data.riderName ?? data.rider_name ?? 'Sin asignar',
                    motoId: data.motoId ?? data.vehicle_id ?? null,
                    motoPlate: data.motoPlate ?? data.vehicle_plate ?? '',
                    franchiseId: data.franchiseId ?? data.franchise_id,
                    status: data.status || 'scheduled',
                    isConfirmed: data.isConfirmed || false,
                    swapRequested: data.swapRequested || false,
                    isDraft: data.isDraft || false,
                };
            });
            callback(shifts);
        }, (error) => {
            console.error("Error subscribing to shifts:", error);
        });
    },

    createShift: async (shiftData: ShiftInput): Promise<void> => {
        const payload = {
            franchiseId: shiftData.franchiseId,
            riderId: shiftData.riderId ?? null,
            riderName: shiftData.riderName ?? 'Sin asignar',
            motoId: shiftData.motoId ?? null,
            motoPlate: shiftData.motoPlate ?? '',
            startAt: Timestamp.fromDate(new Date(shiftData.startAt)),
            endAt: Timestamp.fromDate(new Date(shiftData.endAt)),
            createdAt: serverTimestamp(),
            type: 'standard',
            status: 'scheduled'
        };
        await addDoc(collection(db, COLLECTION), payload);
    },

    updateShift: async (shiftId: string, updates: Partial<ShiftInput>): Promise<void> => {
        const payload: Record<string, unknown> = {};

        if (updates.riderId !== undefined) payload.riderId = updates.riderId;
        if (updates.riderName !== undefined) payload.riderName = updates.riderName;
        if (updates.motoId !== undefined) payload.motoId = updates.motoId;
        if (updates.motoPlate !== undefined) payload.motoPlate = updates.motoPlate;
        if (updates.franchiseId !== undefined) payload.franchiseId = updates.franchiseId;

        if (updates.startAt) payload.startAt = Timestamp.fromDate(new Date(updates.startAt));
        if (updates.endAt) payload.endAt = Timestamp.fromDate(new Date(updates.endAt));

        if (updates.status) payload.status = updates.status;
        if (updates.isConfirmed !== undefined) payload.isConfirmed = updates.isConfirmed;
        if (updates.swapRequested !== undefined) payload.swapRequested = updates.swapRequested;

        payload.updatedAt = serverTimestamp();

        const ref = doc(db, COLLECTION, shiftId);
        await updateDoc(ref, payload);
    },

    deleteShift: async (shiftId: string): Promise<void> => {
        await deleteDoc(doc(db, COLLECTION, shiftId));
    },

    /**
     * Start Shift (Clock In)
     */
    startShift: async (shiftId: string): Promise<void> => {
        const ref = doc(db, COLLECTION, shiftId);
        await updateDoc(ref, {
            status: 'active',
            actualStart: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    },

    /**
     * End Shift (Clock Out)
     */
    endShift: async (shiftId: string): Promise<void> => {
        const ref = doc(db, COLLECTION, shiftId);
        await updateDoc(ref, {
            status: 'completed',
            actualEnd: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Confirm Shift (Rider)
     */
    confirmShift: async (shiftId: string): Promise<void> => {
        const ref = doc(db, COLLECTION, shiftId);
        await updateDoc(ref, {
            isConfirmed: true,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Request Swap (Rider)
     */
    requestSwap: async (shiftId: string, requested: boolean): Promise<void> => {
        const ref = doc(db, COLLECTION, shiftId);
        await updateDoc(ref, {
            swapRequested: requested,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Get My Shifts (Rider)
     */
    getMyShifts: (
        riderId: string,
        start: Date,
        end: Date,
        callback: (shifts: Shift[]) => void
    ): Unsubscribe => {
        const startTs = Timestamp.fromDate(start);
        const endTs = Timestamp.fromDate(end);

        const q = query(
            collection(db, COLLECTION),
            where('riderId', '==', riderId),
            where('startAt', '>=', startTs),
            where('startAt', '<=', endTs)
        );

        return onSnapshot(q, (snapshot) => {
            const shifts: Shift[] = snapshot.docs.map(doc => {
                const data = doc.data() as DocumentData;
                const getTs = (keyCamel: string, keySnake: string) => data[keyCamel] || data[keySnake];
                const startVal = getTs('startAt', 'start_time');
                const endVal = getTs('endAt', 'end_time');

                return {
                    id: doc.id,
                    shiftId: doc.id,
                    startAt: startVal ? (startVal.toDate ? toLocalISOString(startVal.toDate()) : startVal) : '',
                    endAt: endVal ? (endVal.toDate ? toLocalISOString(endVal.toDate()) : endVal) : '',
                    date: startVal ? (startVal.toDate ? toLocalDateString(startVal.toDate()) : toLocalDateString(new Date(startVal))) : '',
                    riderId: data.riderId ?? data.rider_id ?? '',
                    riderName: data.riderName ?? data.rider_name ?? 'Sin asignar',
                    motoId: data.motoId ?? data.vehicle_id ?? null,
                    motoPlate: data.motoPlate ?? data.vehicle_plate ?? '',
                    franchiseId: data.franchiseId ?? data.franchise_id,
                    status: data.status || 'scheduled',
                    isConfirmed: data.isConfirmed || false,
                    swapRequested: data.swapRequested || false,
                };
            });
            shifts.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
            callback(shifts);
        }, (error) => {
            console.error("Error subscribing to my shifts:", error);
        });
    },

    /**
     * Get shifts in a range (one-time fetch)
     */
    getShiftsInRange: async (franchiseId: string, start: Date, end: Date): Promise<Shift[]> => {
        if (!franchiseId) return [];

        const startTs = Timestamp.fromDate(start);
        const endTs = Timestamp.fromDate(end);

        const q = query(
            collection(db, COLLECTION),
            where('franchiseId', '==', franchiseId),
            where('startAt', '>=', startTs),
            where('startAt', '<=', endTs)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data() as DocumentData;
            const getTs = (keyCamel: string, keySnake: string) => data[keyCamel] || data[keySnake];
            const startVal = getTs('startAt', 'start_time');
            const endVal = getTs('endAt', 'end_time');

            return {
                id: doc.id,
                shiftId: doc.id,
                startAt: startVal ? (startVal.toDate ? toLocalISOString(startVal.toDate()) : startVal) : '',
                endAt: endVal ? (endVal.toDate ? toLocalISOString(endVal.toDate()) : endVal) : '',
                date: startVal ? (startVal.toDate ? toLocalDateString(startVal.toDate()) : toLocalDateString(new Date(startVal))) : '',
                riderId: data.riderId ?? data.rider_id ?? '',
                riderName: data.riderName ?? data.rider_name ?? 'Sin asignar',
                motoId: data.motoId ?? data.vehicle_id ?? null,
                motoPlate: data.motoPlate ?? data.vehicle_plate ?? '',
                franchiseId: data.franchiseId ?? data.franchise_id,
                status: data.status || 'scheduled',
                isConfirmed: data.isConfirmed || false,
                swapRequested: data.swapRequested || false,
                isDraft: data.isDraft || false
            };
        });
    }
};
