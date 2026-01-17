import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFleetStore } from './useFleetStore';
import { fleetService } from '../services/fleetService';

// Mock the fleetService
vi.mock('../services/fleetService', () => ({
    fleetService: {
        getRiders: vi.fn(),
        createRider: vi.fn(),
        updateRider: vi.fn(),
        deleteRider: vi.fn()
    }
}));

describe('useFleetStore Integration', () => {
    // Reset store before each test
    beforeEach(() => {
        vi.clearAllMocks();
        useFleetStore.setState({
            riders: [],
            isLoading: false,
            searchQuery: ''
        });

        // Default mock implementations
        (fleetService.getRiders as any).mockResolvedValue([
            { id: '1', fullName: 'Mock Rider', status: 'active', metrics: {} }
        ]);
        (fleetService.createRider as any).mockImplementation((data: any) => Promise.resolve({
            id: 'new-id',
            ...data,
            metrics: { efficiency: 100 }
        }));
        (fleetService.updateRider as any).mockResolvedValue(undefined);
        (fleetService.deleteRider as any).mockResolvedValue(undefined);
    });

    it('should initialize with empty state', () => {
        const { riders, isLoading } = useFleetStore.getState();
        expect(riders).toHaveLength(0);
        expect(isLoading).toBe(false);
    });

    it('should fetch mock riders correctly', async () => {
        // Use fake timers to skip the setTimeout delay in the store
        vi.useFakeTimers();

        const fetchPromise = useFleetStore.getState().fetchRiders();

        // Fast-forward time
        vi.runAllTimers();
        await fetchPromise;

        const { riders } = useFleetStore.getState();
        expect(riders.length).toBeGreaterThan(0);
        expect(riders[0].fullName).toBeDefined();

        vi.useRealTimers();
    });

    it('should add a new rider', async () => {
        vi.useFakeTimers();

        const newRiderData = {
            fullName: 'Test Rider',
            email: 'test@repaart.com',
            phone: '+34 600 000 000',
            status: 'active' as const
        };

        const addPromise = useFleetStore.getState().addRider(newRiderData);

        vi.runAllTimers();
        await addPromise;

        const { riders } = useFleetStore.getState();
        expect(riders).toHaveLength(1);
        expect(riders[0].fullName).toBe('Test Rider');
        // Check if metrics were auto-generated
        expect(riders[0].metrics).toBeDefined();
        expect(riders[0].metrics.efficiency).toBe(100);

        vi.useRealTimers();
    });

    it('should update an existing rider', async () => {
        vi.useFakeTimers();

        // Setup: Add rider
        const setupPromise = useFleetStore.getState().addRider({
            fullName: 'Original Name',
            email: 'test@repaart.com',
            phone: '+34 600 000 000',
            status: 'active'
        });
        vi.runAllTimers();
        await setupPromise;

        const riderId = useFleetStore.getState().riders[0].id;

        // Act: Update rider
        const updatePromise = useFleetStore.getState().updateRider(riderId, {
            fullName: 'Updated Name',
            status: 'inactive'
        });
        vi.runAllTimers();
        await updatePromise;

        // Assert
        const { riders } = useFleetStore.getState();
        expect(riders[0].fullName).toBe('Updated Name');
        expect(riders[0].status).toBe('inactive');

        vi.useRealTimers();
    });

    it('should delete a rider', async () => {
        vi.useFakeTimers();

        // Setup: Add rider
        const setupPromise = useFleetStore.getState().addRider({
            fullName: 'To Delete',
            email: 'delete@repaart.com',
            phone: '+34 600 000 000',
            status: 'active'
        });
        vi.runAllTimers();
        await setupPromise;

        const { riders: ridersBefore } = useFleetStore.getState();
        expect(ridersBefore).toHaveLength(1);
        const idToDelete = ridersBefore[0].id;

        // Act: Delete rider
        const deletePromise = useFleetStore.getState().deleteRider(idToDelete);
        vi.runAllTimers();
        await deletePromise;

        // Assert
        const { riders: ridersAfter } = useFleetStore.getState();
        expect(ridersAfter).toHaveLength(0);

        vi.useRealTimers();
    });
});
