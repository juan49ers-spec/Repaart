import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import {
    WeekData,
    WeekDataSchema,
    FranchiseId,
    WeekId,
    toWeekId
} from '../../schemas/scheduler';

/**
 * WeekService - Handles the heavy lifting of the "Document-Per-Week" architecture.
 * Now enhanced with Zod Runtime Validation and Branded Types.
 */
export const WeekService = {

    /**
     * Helper: Get Week ID (YYYY_WW)
     */
    getWeekId(date: Date): WeekId {
        // Basic ISO week calculation (or simple approximation for now)
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const year = d.getUTCFullYear();
        const weekNo = Math.ceil((((d.getTime() - new Date(Date.UTC(year, 0, 1)).getTime()) / 86400000) + 1) / 7);
        return toWeekId(`${year}_${weekNo.toString().padStart(2, '0')}`);
    },

    /**
     * Fetch a full week document with strict Zod validation.
     */
    async getWeek(franchiseId: FranchiseId, weekId: WeekId): Promise<WeekData | null> {
        try {
            const ref = doc(db, 'franchises', franchiseId, 'weeks', weekId);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                // Runtime validation: will throw if DB data is corrupt
                return WeekDataSchema.parse(snap.data());
            }
            return null;
        } catch (error) {
            console.error('[WeekService] Error fetching/validating week:', error);
            throw error;
        }
    },

    /**
     * Save/Update a week.
     * This is atomic: we overwrite/merge the whole document or specific fields.
     */
    async saveWeek(franchiseId: FranchiseId, weekId: WeekId, data: Partial<WeekData>): Promise<void> {
        try {
            // Partial validation could be tricky with Zod (using .partial()), 
            // but for now we trust `Partial<WeekData>` from TS + Firestore merge
            const ref = doc(db, 'franchises', franchiseId, 'weeks', weekId);
            await setDoc(ref, data, { merge: true });
        } catch (error) {
            console.error('[WeekService] Error saving week:', error);
            throw error;
        }
    },

    /**
     * Initialize a week if it doesn't exist.
     */
    async initWeek(franchiseId: FranchiseId, weekId: WeekId, startDate: string): Promise<WeekData | undefined> {
        const ref = doc(db, 'franchises', franchiseId, 'weeks', weekId);
        const exists = (await getDoc(ref)).exists();

        if (!exists) {
            const initialData: WeekData = {
                id: weekId,
                startDate: startDate, // "YYYY-MM-DD"
                status: 'draft',
                metrics: {
                    totalHours: 0,
                    activeRiders: 0,
                    motosInUse: 0
                },
                shifts: []
            };

            // Validate initial data before saving (Paranoia check)
            const validated = WeekDataSchema.parse(initialData);
            await setDoc(ref, validated);
            return validated;
        }
    },

    /**
     * Suscribirse a cambios en tiempo real de una semana específica.
     * @param callback Función que recibe los datos actualizados o null
     * @returns Función para desuscribirse
     */
    subscribeToWeek(franchiseId: string, weekId: string, callback: (data: WeekData | null) => void): () => void {
        const ref = doc(db, 'franchises', franchiseId, 'weeks', weekId);

        return onSnapshot(ref,
            (snap) => {
                if (snap.exists()) {
                    try {
                        const parsed = WeekDataSchema.parse(snap.data());

                        // 🔥 USER REQUESTED FIX: Strict Mapping for WeekService 🔥
                        parsed.shifts = parsed.shifts.map(s => ({
                            ...s,
                            isConfirmed: s.isConfirmed === true,
                            swapRequested: s.swapRequested === true,
                            changeRequested: s.changeRequested === true,
                            changeReason: s.changeReason || null,
                            isDraft: s.isDraft || false
                        }));

                        callback(parsed);
                    } catch (err) {
                        console.error("[WeekService] Validation Error on Realtime Update:", err);
                        console.log("[WeekService] Problematic Data:", snap.data());
                        // Fallback: Use raw data but ensure shifts is at least an array to avoid crashes
                        const rawData = snap.data() as any;
                        callback({
                            ...rawData,
                            id: snap.id,
                            shifts: Array.isArray(rawData?.shifts) ? rawData.shifts : []
                        } as WeekData);
                    }
                } else {
                    callback(null);
                }
            },
            (error) => {
                console.error("[WeekService] Subscription Error:", error);
            }
        );
    }
};
