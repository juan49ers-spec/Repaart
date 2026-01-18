import { useState, useEffect, useCallback } from 'react';
import { fleetService } from '../services/fleetService';
import { useToast } from './useToast';

// =====================================================
// TYPES & INTERFACES
// =====================================================

import { Moto, CreateVehicleInput } from '../schemas/fleet';

export interface Vehicle extends Omit<Moto, 'id'> {
    id: string;
    alias?: string;
    [key: string]: unknown;
}

export type VehicleInput = CreateVehicleInput;

export interface UseFleetReturn {
    vehicles: Vehicle[];
    loading: boolean;
    error: Error | null;
    addVehicle: (data: VehicleInput) => Promise<boolean>;
    updateVehicle: (id: string, data: Partial<VehicleInput>) => Promise<boolean>;
    deleteVehicle: (id: string) => Promise<boolean>;
}

// =====================================================
// HOOK
// =====================================================

export const useFleet = (franchiseId: string | null | undefined): UseFleetReturn => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { toast } = useToast() || {}; // Fallback seguro si no hay contexto

    // Sync loading state during render
    const [prevFranchiseId, setPrevFranchiseId] = useState(franchiseId);
    if (franchiseId !== prevFranchiseId) {
        setPrevFranchiseId(franchiseId);
        if (franchiseId) {
            setLoading(true);
        } else {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!franchiseId) return;

        // Iniciamos la escucha
        const unsubscribe = fleetService.subscribeToFleet(franchiseId, (data: Moto[]) => {
            setVehicles(data as unknown as Vehicle[]);
            setLoading(false);
            setError(null);
        });

        // Cleanup al desmontar o cambiar de franquicia
        return () => unsubscribe();
    }, [franchiseId]);

    // Wrappers de Acciones (para manejo de errores UI)

    const addVehicle = useCallback(async (data: VehicleInput): Promise<boolean> => {
        if (!franchiseId) return false;

        try {
            await fleetService.createVehicle(franchiseId, data);
            toast?.success('Vehículo añadido correctamente');
            return true;
        } catch (err) {
            console.error(err);
            setError(err as Error);
            toast?.error('Error al añadir vehículo');
            return false;
        }
    }, [franchiseId, toast]);

    const updateVehicle = useCallback(async (id: string, data: Partial<VehicleInput>): Promise<boolean> => {
        try {
            await fleetService.updateVehicle(id, data);
            toast?.success('Vehículo actualizado');
            return true;
        } catch (err) {
            console.error(err);
            setError(err as Error);
            toast?.error('Error al actualizar');
            return false;
        }
    }, [toast]);

    const deleteVehicle = useCallback(async (id: string): Promise<boolean> => {
        try {
            await fleetService.deleteVehicle(id);
            toast?.success('Vehículo eliminado');
            return true;
        } catch (err) {
            console.error(err);
            setError(err as Error);
            toast?.error('Error al eliminar');
            return false;
        }
    }, [toast]);

    return {
        vehicles,
        loading,
        error,
        addVehicle,
        updateVehicle,
        deleteVehicle
    };
};
