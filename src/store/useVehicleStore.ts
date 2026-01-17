import { create } from 'zustand';
import { Vehicle } from '../features/fleet/vehicles/schemas/VehicleSchema';
import { vehicleService } from '../services/fleetService';
import { Moto } from '../schemas/fleet';

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
            const rawVehicles = await vehicleService.getVehicles(franchiseId);
            // ADAPTER: Moto (Camel) -> Vehicle (Snake/Legacy)
            const vehicles: Vehicle[] = rawVehicles.map((m: Moto) => ({
                id: m.id,
                matricula: m.plate,
                modelo: m.brand && m.model ? `${m.brand} ${m.model}` : m.model,
                km_actuales: m.currentKm || 0,
                proxima_revision_km: m.nextRevisionKm || 5000,
                estado: (m.status === 'active' ? 'active' : (m.status === 'maintenance' ? 'maintenance' : 'deleted')) as any,
                type: 'vehicle',
                franchise_id: franchiseId
            }));
            set({ vehicles, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch vehicles:', error);
            set({ isLoading: false, error: 'Error al cargar vehículos' });
        }
    },

    addVehicle: async (franchiseId: string, vehicleData: Partial<Vehicle>) => {
        set({ isLoading: true, error: null });
        try {
            const m = await vehicleService.createVehicle(franchiseId, vehicleData);
            // ADAPTER: Moto (Camel) -> Vehicle (Snake/Legacy)
            const newVehicle: Vehicle = {
                id: m.id,
                matricula: m.plate,
                modelo: m.brand && m.model ? `${m.brand} ${m.model}` : m.model,
                km_actuales: m.currentKm || 0,
                proxima_revision_km: m.nextRevisionKm || 5000,
                estado: (m.status === 'active' ? 'active' : (m.status === 'maintenance' ? 'maintenance' : 'deleted')) as any,
                type: 'vehicle',
                franchise_id: franchiseId
            };
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
            // ADAPTER: Vehicle (Legacy) -> Moto (Service)
            const serviceUpdates: any = {};
            if (updates.matricula) serviceUpdates.plate = updates.matricula;
            if (updates.modelo) serviceUpdates.model = updates.modelo;
            if (updates.km_actuales !== undefined) serviceUpdates.currentKm = updates.km_actuales;
            if (updates.proxima_revision_km !== undefined) serviceUpdates.nextRevisionKm = updates.proxima_revision_km;
            if (updates.estado) {
                serviceUpdates.status = updates.estado === 'active' ? 'active' :
                    (updates.estado === 'maintenance' ? 'maintenance' : 'deleted');
            }

            await vehicleService.updateVehicle(id, serviceUpdates);

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
