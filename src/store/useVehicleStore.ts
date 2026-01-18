import { create } from 'zustand';
import { vehicleService } from '../services/fleetService';
import { Vehicle } from '../schemas/fleet';

interface VehicleState {
    vehicles: Vehicle[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchVehicles: (franchiseId: string) => Promise<void>;
    addVehicle: (franchiseId: string, vehicle: Partial<Vehicle>) => Promise<void>;
    updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<void>;
    deleteVehicle: (id: string) => Promise<void>;
}

export const useVehicleStore = create<VehicleState>((set) => ({
    vehicles: [],
    isLoading: false,
    error: null,

    fetchVehicles: async (franchiseId: string) => {
        set({ isLoading: true, error: null });
        try {
            const vehicles = await vehicleService.getVehicles(franchiseId);
            set({ vehicles, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch vehicles:', error);
            set({ isLoading: false, error: 'Error al cargar vehículos' });
        }
    },

    addVehicle: async (franchiseId: string, vehicleData: Partial<Vehicle>) => {
        set({ isLoading: true, error: null });
        try {
            // The service now handles standardized input or accepts the new schema
            const newVehicle = await vehicleService.createVehicle(franchiseId, vehicleData as any);
            set(state => ({
                vehicles: [newVehicle, ...state.vehicles],
                isLoading: false
            }));
        } catch (error) {
            console.error('Failed to add vehicle:', error);
            set({ isLoading: false, error: 'Error al crear vehículo' });
            throw error;
        }
    },

    updateVehicle: async (id: string, updates: Partial<Vehicle>) => {
        set({ isLoading: true, error: null });
        try {
            await vehicleService.updateVehicle(id, updates);

            set(state => ({
                vehicles: state.vehicles.map(v => v.id === id ? { ...v, ...updates } : v),
                isLoading: false
            }));
        } catch (error) {
            console.error('Failed to update vehicle:', error);
            set({ isLoading: false, error: 'Error al actualizar vehículo' });
            throw error;
        }
    },

    deleteVehicle: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            await vehicleService.deleteVehicle(id);
            set(state => ({
                vehicles: state.vehicles.filter(v => v.id !== id),
                isLoading: false
            }));
        } catch (error) {
            console.error('Failed to delete vehicle:', error);
            set({ isLoading: false, error: 'Error al eliminar vehículo' });
            throw error;
        }
    }
}));
