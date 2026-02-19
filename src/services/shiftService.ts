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
    getDocs,
    getDoc
} from 'firebase/firestore';
import { ServiceError, validationError } from '../utils/ServiceError';

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
    changeRequested?: boolean;
    changeReason?: string | null;
    isDraft?: boolean;
    // Fields for Recurring Shifts
    isRecurring?: boolean;
    recurringGroupId?: string;  // ID that links all shifts in the series
    recurringPattern?: 'daily' | 'weekly' | 'monthly';
    recurringEndDate?: string;  // ISO date when recurrence ends
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
    changeRequested?: boolean;
    changeReason?: string | null;
    isDraft?: boolean;
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
                    // Mapping Legacy & Modern Fields

                    isConfirmed: (data.isConfirmed === true || data.is_confirmed === true),
                    swapRequested: (data.swapRequested === true || data.swap_requested === true),
                    changeRequested: (data.changeRequested === true || data.change_requested === true),
                    changeReason: data.changeReason || data.change_reason || null,
                    isDraft: data.isDraft || false,
                };
            });
            callback(shifts);
        }, (error) => {
            console.error("Error subscribing to shifts:", error);
            // In snapshot listeners, we can't throw, but we can log structured error
            new ServiceError('subscribeToWeekShifts', { cause: error, code: 'NETWORK' });
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
            status: 'scheduled',
            isDraft: shiftData.isDraft ?? false
        };
        try {
            await addDoc(collection(db, COLLECTION), payload);
        } catch (error) {
            throw new ServiceError('createShift', { cause: error });
        }
    },

    updateShift: async (shiftId: string, updates: Partial<ShiftInput>): Promise<void> => {
        console.log(`[ShiftService] Updating shift ${shiftId} in ${COLLECTION}`, updates);
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

        // Auto-resolve change requests on manual update
        if (updates.changeRequested !== undefined) {
            payload.changeRequested = updates.changeRequested;
            payload.changeReason = updates.changeReason ?? null;
        } else {
            // If it's a general update (admin editing), we reset the flags
            payload.changeRequested = false;
            payload.changeReason = null;
        }

        payload.updatedAt = serverTimestamp();

        const ref = doc(db, COLLECTION, shiftId);
        try {
            await updateDoc(ref, payload);
        } catch (error) {
            throw new ServiceError('updateShift', { cause: error, message: `Failed to update shift ${shiftId}` });
        }
    },

    deleteShift: async (shiftId: string): Promise<void> => {
        try {
            await deleteDoc(doc(db, COLLECTION, shiftId));
        } catch (error) {
            throw new ServiceError('deleteShift', { cause: error, message: `Failed to delete shift ${shiftId}` });
        }
    },

    /**
     * Start Shift (Clock In)
     */
    startShift: async (shiftId: string): Promise<void> => {
        try {
            const ref = doc(db, COLLECTION, shiftId);
            await updateDoc(ref, {
                status: 'active',
                actualStart: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            throw new ServiceError('startShift', { cause: error });
        }
    },

    /**
     * End Shift (Clock Out)
     */
    endShift: async (shiftId: string): Promise<void> => {
        try {
            const ref = doc(db, COLLECTION, shiftId);
            await updateDoc(ref, {
                status: 'completed',
                actualEnd: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            throw new ServiceError('endShift', { cause: error });
        }
    },

    /**
      * Confirm Shift (Rider)
      */
    confirmShift: async (shiftId: string): Promise<void> => {
        try {
            const ref = doc(db, COLLECTION, shiftId);
            await updateDoc(ref, {
                isConfirmed: true,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            throw new ServiceError('confirmShift', { cause: error });
        }
    },

    requestSwap: async (shiftId: string, requested: boolean): Promise<void> => {
        try {
            const ref = doc(db, COLLECTION, shiftId);
            await updateDoc(ref, {
                swapRequested: requested,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            throw new ServiceError('requestSwap', { cause: error });
        }
    },

    /**
     * Request Change (Rider)
     */
    requestChange: async (shiftId: string, requested: boolean, reason?: string): Promise<void> => {
        try {
            const ref = doc(db, COLLECTION, shiftId);
            await updateDoc(ref, {
                changeRequested: requested,
                changeReason: requested ? (reason || 'Sin motivo') : null,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            throw new ServiceError('requestChange', { cause: error });
        }
    },

    /**
     * Get My Shifts (Rider)
     */
    getMyShifts: (
        riderId: string,
        start: Date,
        end: Date,
        callback: (shifts: Shift[]) => void,
        onError?: (error: any) => void
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
                    // 🔥 ESTOS SON LOS CAMPOS QUE FALTAN O ESTÁN MAL MAPEADOS 🔥
                    isConfirmed: (data.isConfirmed === true || data.is_confirmed === true),
                    swapRequested: (data.swapRequested === true || data.swap_requested === true),
                    changeRequested: (data.changeRequested === true || data.change_requested === true),
                    changeReason: data.changeReason || data.change_reason || null,
                    isDraft: data.isDraft || false,
                };
            });
            shifts.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
            callback(shifts);
        }, (error) => {
            console.error("Error subscribing to my shifts:", error);
            if (onError) onError(new ServiceError('getMyShifts', { cause: error, code: 'NETWORK' }));
        });
    },

    /**
     * Get shifts in a range (one-time fetch)
     */
    getShiftsInRange: async (franchiseId: string, start: Date, end: Date): Promise<Shift[]> => {
        if (!franchiseId) return [];

        try {
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
                    isConfirmed: (data.isConfirmed === true || data.is_confirmed === true),
                    swapRequested: (data.swapRequested === true || data.swap_requested === true),
                    changeRequested: (data.changeRequested === true || data.change_requested === true),
                    changeReason: data.changeReason || data.change_reason || null,
                    isDraft: data.isDraft || false
                };
            });
        } catch (error) {
            throw new ServiceError('getShiftsInRange', { cause: error });
        }
    },

    // =====================================================
    // WEEK TEMPLATES (PLANTILLAS DE SEMANA)
    // =====================================================

    /**
     * Save current week as template
     */
    saveWeekTemplate: async (
        franchiseId: string,
        templateName: string,
        templateType: 'verano' | 'invierno' | 'especial',
        shifts: any[]
    ): Promise<string> => {
        if (!franchiseId) throw validationError('saveWeekTemplate', 'Franchise ID is required');

        const templateData = {
            franchiseId,
            name: templateName,
            type: templateType,
            shifts: shifts.map(s => ({
                startAt: s.startAt,
                endAt: s.endAt,
                riderId: s.riderId,
                riderName: s.riderName,
                motoId: s.motoId,
                motoPlate: s.motoPlate,
                date: s.date
            })),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        try {
            const docRef = await addDoc(collection(db, 'week_templates'), templateData);
            return docRef.id;
        } catch (error) {
            throw new ServiceError('saveWeekTemplate', { cause: error });
        }
    },

    /**
     * Get all templates for a franchise
     */
    getWeekTemplates: async (franchiseId: string): Promise<Array<{
        id: string;
        name: string;
        type: 'verano' | 'invierno' | 'especial';
        shifts: any[];
        createdAt: Date;
    }>> => {
        try {
            const q = query(
                collection(db, 'week_templates'),
                where('franchiseId', '==', franchiseId)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name,
                    type: data.type,
                    shifts: data.shifts || [],
                    createdAt: data.createdAt?.toDate() || new Date()
                };
            }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } catch (error) {
            throw new ServiceError('getWeekTemplates', { cause: error });
        }
    },

    /**
     * Apply template to a specific week
     */
    applyWeekTemplate: async (
        franchiseId: string,
        templateId: string,
        targetWeekStart: Date,
        mode: 'overwrite' | 'fill_only' = 'fill_only'
    ): Promise<number> => {
        if (!franchiseId || !templateId) throw validationError('applyWeekTemplate', 'Franchise ID and Template ID are required');

        // Get template
        const templateRef = doc(db, 'week_templates', templateId);
        const templateDoc = await getDoc(templateRef);

        if (!templateDoc.exists()) {
            throw new ServiceError('applyWeekTemplate', { code: 'NOT_FOUND', message: 'Template not found' });
        }

        const template = templateDoc.data();
        const templateShifts = template.shifts || [];

        // Calculate day offset
        const weekStart = new Date(targetWeekStart);
        weekStart.setHours(0, 0, 0, 0);

        // Get existing shifts for the week if in fill_only mode
        let existingShifts: Shift[] = [];
        if (mode === 'fill_only') {
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            existingShifts = await shiftService.getShiftsInRange(franchiseId, weekStart, weekEnd);
        }

        let appliedCount = 0;

        // Apply each shift from template
        for (const templateShift of templateShifts) {
            const originalDate = new Date(templateShift.date);
            const dayOfWeek = originalDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

            // Calculate target date
            const targetDate = new Date(weekStart);
            targetDate.setDate(weekStart.getDate() + dayOfWeek);

            // Check if there's already a shift for this rider on this day (fill_only mode)
            if (mode === 'fill_only') {
                const hasExistingShift = existingShifts.some(s =>
                    s.riderId === templateShift.riderId &&
                    new Date(s.date).toDateString() === targetDate.toDateString()
                );
                if (hasExistingShift) continue;
            }

            // Parse times
            const originalStart = new Date(templateShift.startAt);
            const originalEnd = new Date(templateShift.endAt);

            const startHours = originalStart.getHours();
            const startMinutes = originalStart.getMinutes();
            const endHours = originalEnd.getHours();
            const endMinutes = originalEnd.getMinutes();

            // Create new shift
            const newStartAt = new Date(targetDate);
            newStartAt.setHours(startHours, startMinutes, 0, 0);

            const newEndAt = new Date(targetDate);
            newEndAt.setHours(endHours, endMinutes, 0, 0);

            await shiftService.createShift({
                franchiseId,
                riderId: templateShift.riderId,
                riderName: templateShift.riderName,
                motoId: templateShift.motoId,
                motoPlate: templateShift.motoPlate,
                startAt: toLocalISOString(newStartAt),
                endAt: toLocalISOString(newEndAt),
                isDraft: true // Start as draft so they can review before publishing
            });

            appliedCount++;
        }

        return appliedCount;
    },

    /**
     * Delete a template
     */
    deleteWeekTemplate: async (templateId: string): Promise<void> => {
        if (!templateId) throw validationError('deleteWeekTemplate', 'Template ID is required');
        try {
            await deleteDoc(doc(db, 'week_templates', templateId));
        } catch (error) {
            throw new ServiceError('deleteWeekTemplate', { cause: error });
        }
    },

    // =====================================================
    // RECURRING SHIFTS (TURNOS RECURRENTES)
    // =====================================================

    /**
     * Create a recurring shift series
     */
    createRecurringShift: async (
        baseShift: ShiftInput,
        pattern: 'daily' | 'weekly' | 'monthly',
        occurrences: number,
        franchiseId: string
    ): Promise<string[]> => {
        if (!franchiseId || occurrences <= 0) throw validationError('createRecurringShift', 'Invalid parameters');

        const groupId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const createdIds: string[] = [];
        const baseDate = new Date(baseShift.startAt);

        try {
            for (let i = 0; i < occurrences; i++) {
                const shiftDate = new Date(baseDate);

                if (pattern === 'daily') {
                    shiftDate.setDate(shiftDate.getDate() + i);
                } else if (pattern === 'weekly') {
                    shiftDate.setDate(shiftDate.getDate() + (i * 7));
                } else if (pattern === 'monthly') {
                    shiftDate.setMonth(shiftDate.getMonth() + i);
                }

                const startTime = new Date(baseShift.startAt);
                const endTime = new Date(baseShift.endAt);

                const newStartAt = new Date(shiftDate);
                newStartAt.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

                const newEndAt = new Date(shiftDate);
                newEndAt.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

                const payload = {
                    franchiseId,
                    riderId: baseShift.riderId ?? null,
                    riderName: baseShift.riderName ?? 'Sin asignar',
                    motoId: baseShift.motoId ?? null,
                    motoPlate: baseShift.motoPlate ?? '',
                    startAt: Timestamp.fromDate(newStartAt),
                    endAt: Timestamp.fromDate(newEndAt),
                    createdAt: serverTimestamp(),
                    type: 'standard',
                    status: 'scheduled',
                    isDraft: baseShift.isDraft ?? false,
                    isRecurring: true,
                    recurringGroupId: groupId,
                    recurringPattern: pattern,
                    recurringEndDate: toLocalISOString(new Date(shiftDate.setDate(shiftDate.getDate() + (pattern === 'daily' ? 1 : pattern === 'weekly' ? 7 : 30))))
                };

                const docRef = await addDoc(collection(db, COLLECTION), payload);
                createdIds.push(docRef.id);
            }
        } catch (error) {
            throw new ServiceError('createRecurringShift', { cause: error });
        }
        return createdIds;
    },

    /**
     * Get all shifts in a recurring series
     */
    getRecurringShifts: async (groupId: string): Promise<Shift[]> => {
        if (!groupId) return [];

        try {
            const q = query(
                collection(db, COLLECTION),
                where('recurringGroupId', '==', groupId)
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
                    isConfirmed: (data.isConfirmed === true || data.is_confirmed === true),
                    swapRequested: (data.swapRequested === true || data.swap_requested === true),
                    changeRequested: (data.changeRequested === true || data.change_requested === true),
                    changeReason: data.changeReason || data.change_reason || null,
                    isDraft: data.isDraft || false,
                    isRecurring: data.isRecurring || false,
                    recurringGroupId: data.recurringGroupId,
                    recurringPattern: data.recurringPattern,
                    recurringEndDate: data.recurringEndDate
                };
            });
        } catch (error) {
            throw new ServiceError('getRecurringShifts', { cause: error });
        }
    },

    /**
     * Delete all shifts in a recurring series
     */
    deleteRecurringSeries: async (groupId: string): Promise<void> => {
        if (!groupId) throw validationError('deleteRecurringSeries', 'Group ID is required');

        try {
            const q = query(
                collection(db, COLLECTION),
                where('recurringGroupId', '==', groupId)
            );

            const snapshot = await getDocs(q);
            const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
        } catch (error) {
            throw new ServiceError('deleteRecurringSeries', { cause: error });
        }
    }
};
