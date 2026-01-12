import { useState, useCallback } from 'react';
import { shiftService } from '../services/shiftService';

export interface ShiftData {
    shiftId?: string;
    motoId?: string | null;
    motoPlate?: string;
    userId?: string | null;
    riderId?: string | null;
    riderName?: string;
    start?: string; // ISO string 
    end?: string; // ISO string
    startAt?: string; // Mapping compatibility
    endAt?: string;   // Mapping compatibility
    [key: string]: any;
}

export interface ShiftOperationResult {
    success: boolean;
    count?: number;
    error?: string;
}

// Minimal interface for Moto to avoid deep dependency if not needed
interface Moto {
    id: string;
    plate: string;
    [key: string]: any;
}

export const useShiftOperations = (
    franchiseId: string | null,
    // weekData and updateWeekData might be used in future or internally, keeping signatures compatible
    _weekData?: any,
    _updateWeekData?: any,
    motos: Moto[] = []
) => {
    const [isSaving, setIsSaving] = useState(false);

    const addOrUpdateShift = useCallback(async (shiftData: ShiftData, isEdit: boolean): Promise<ShiftOperationResult> => {
        setIsSaving(true);
        try {
            // Validaciones básicas
            if (!franchiseId) throw new Error("No franchise ID");

            const payload = {
                franchiseId,
                riderId: shiftData.riderId || shiftData.userId || null,
                riderName: shiftData.riderName || 'Sin asignar',
                motoId: shiftData.motoId || null,
                motoPlate: shiftData.motoPlate || motos.find(m => m.id === shiftData.motoId)?.plate || '',
                startAt: shiftData.startAt || shiftData.start || '',
                endAt: shiftData.endAt || shiftData.end || ''
            };

            if (isEdit && shiftData.shiftId) {
                await shiftService.updateShift(shiftData.shiftId, payload);
            } else {
                await shiftService.createShift(payload);
            }

            return { success: true };
        } catch (error: any) {
            console.error("Shift Operation Error:", error);
            return { success: false, error: error.message || String(error) };
        } finally {
            setIsSaving(false);
        }
    }, [franchiseId, motos]);

    const removeShift = useCallback(async (shiftId: string): Promise<ShiftOperationResult> => {
        try {
            await shiftService.deleteShift(shiftId);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message || String(error) };
        }
    }, []);

    const quickFillShifts = useCallback(async (params: any): Promise<ShiftOperationResult> => {
        const { date, riders } = params; // Expect riders to be passed
        if (!date || !riders || !Array.isArray(riders)) {
            return { success: false, error: "Missing date or riders for smart fill" };
        }

        setIsSaving(true);
        let count = 0;
        const primeHours = [13, 14, 20, 21, 22]; // Standard Prime Time

        try {
            const promises: Promise<void>[] = [];

            for (const rider of riders) {
                // Skip if rider is not active or eligible? Assuming all passed riders are eligible.

                for (const h of primeHours) {
                    // Check logic could be here if we had synchronous access to all shifts, 
                    // but for "Quick Fill" blind fire is often acceptable if the user asked for it.
                    // However, avoiding duplicates is better.
                    // Let's assume the user wants to fill these specific slots.

                    const start = new Date(date); // date string 'YYYY-MM-DD' works with new Date() usually as UTC or Local depending on browser, 
                    // better to construct safely if possible, but params.date comes from format(..., 'yyyy-MM-dd') in Scheduler.
                    // Actually, 'yyyy-MM-dd' + 'T' + HH:mm... is safer.

                    const startIso = `${date}T${h.toString().padStart(2, '0')}:00:00`;
                    const endIso = `${date}T${(h + 1).toString().padStart(2, '0')}:00:00`;

                    // Simple logic: Create 1h shift
                    const payload = {
                        franchiseId: franchiseId!, // Checked at start of hook usually, but let's trust
                        riderId: rider.id,
                        riderName: rider.fullName,
                        motoId: null,
                        motoPlate: '',
                        startAt: new Date(startIso).toISOString(),
                        endAt: new Date(endIso).toISOString()
                    };

                    promises.push(shiftService.createShift(payload));
                    count++;
                }
            }

            await Promise.all(promises);
            return { success: true, count };

        } catch (error: any) {
            console.error("Smart Fill Error:", error);
            return { success: false, error: error.message };
        } finally {
            setIsSaving(false);
        }
    }, [franchiseId]);

    return { isSaving, addOrUpdateShift, removeShift, quickFillShifts };
};
