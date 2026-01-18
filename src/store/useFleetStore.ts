import { create } from 'zustand';
import { fleetService } from '../services/fleetService';

export type RiderStatus = 'active' | 'inactive' | 'on_route' | 'maintenance' | 'deleted';

export interface Rider {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    status: RiderStatus;
    metrics: {
        totalDeliveries: number;
        rating: number; // 0-5
        efficiency: number; // %
        joinedAt: string; // ISO Date
    };
    avatarUrl?: string;
    franchiseId?: string;
    contractHours?: number;
    licenseType?: '49cc' | '125cc';
}

interface FleetState {
    riders: Rider[];
    isLoading: boolean;
    searchQuery: string;

    // Actions
    fetchRiders: (franchiseId?: string) => Promise<void>;
    addRider: (rider: Omit<Rider, 'id' | 'metrics'>) => Promise<void>;
    updateRider: (id: string, data: Partial<Rider>) => Promise<void>;
    deleteRider: (id: string) => Promise<void>;
    setSearchQuery: (query: string) => void;
}

export const useFleetStore = create<FleetState>((set) => ({
    riders: [],
    isLoading: false,
    searchQuery: '',

    fetchRiders: async (franchiseId?: string) => {
        set({ isLoading: true });
        try {
            const riders = await fleetService.getRiders(franchiseId);
            set({ riders, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch riders:', error);
            set({ isLoading: false });
        }
    },

    addRider: async (newRiderData) => {
        set({ isLoading: true });
        try {
            const createdRider = await fleetService.createRider(newRiderData);
            set(state => ({
                riders: [...state.riders, createdRider],
                isLoading: false
            }));
        } catch (error) {
            console.error('Failed to create rider:', error);
            set({ isLoading: false });
            throw error;
        }
    },

    updateRider: async (id, data) => {
        set({ isLoading: true });
        try {
            await fleetService.updateRider(id, data);

            // Optimistic update or refresh? Let's verify via local state update for speed
            set(state => ({
                riders: state.riders.map(r => r.id === id ? { ...r, ...data } : r),
                isLoading: false
            }));
        } catch (error) {
            console.error('Failed to update rider:', error);
            set({ isLoading: false });
            throw error;
        }
    },

    deleteRider: async (id) => {
        set({ isLoading: true });
        try {
            await fleetService.deleteRider(id);
            set(state => ({
                riders: state.riders.filter(r => r.id !== id),
                isLoading: false
            }));
        } catch (error) {
            console.error('Failed to delete rider:', error);
            set({ isLoading: false });
            throw error;
        }
    },

    setSearchQuery: (query) => set({ searchQuery: query })
}));
