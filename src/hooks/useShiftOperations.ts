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

    const quickFillShifts = useCallback(async (_params: any): Promise<ShiftOperationResult> => {
        // Implementación futura: Generación masiva
        // Por ahora retornamos éxito falso o implementamos un bucle simple
        return { success: false, error: "Auto-fill backend not implemented yet" };
    }, []);

    return { isSaving, addOrUpdateShift, removeShift, quickFillShifts };
};
