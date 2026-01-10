// Type declarations for fleetService

export interface FleetVehicle {
    id: string;
    plate: string;
    type: 'moto' | 'bike';
    status: 'active' | 'maintenance' | 'retired';
    [key: string]: any;
}

export const fleetService: {
    subscribeToFleet: (franchiseId: string, callback: (vehicles: any[]) => void) => () => void;
    addVehicle: (franchiseId: string, data: any) => Promise<void>;
    updateVehicle: (id: string, data: any) => Promise<void>;
    deleteVehicle: (id: string) => Promise<void>;
};
