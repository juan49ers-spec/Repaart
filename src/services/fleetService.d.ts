// Type declarations for fleetService

export interface FleetVehicle {
    id: string;
    plate: string;
    type: 'moto' | 'bike';
    status: 'active' | 'maintenance' | 'retired';
    [key: string]: unknown;
}

export const fleetService: {
    subscribeToFleet: (franchiseId: string, callback: (vehicles: FleetVehicle[]) => void) => () => void;
    addVehicle: (franchiseId: string, data: Record<string, unknown>) => Promise<void>;
    updateVehicle: (id: string, data: Record<string, unknown>) => Promise<void>;
    deleteVehicle: (id: string) => Promise<void>;
};
