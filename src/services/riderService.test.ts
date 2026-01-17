import { describe, it, expect, vi, beforeEach } from 'vitest';
import { riderService } from './riderService';

// Mock Firebase
vi.mock('../lib/firebase', () => ({
    db: {}
}));

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        collection: vi.fn(() => ({ type: 'collection' })),
        addDoc: vi.fn(),
        serverTimestamp: () => 'MOCK_TIMESTAMP',
    };
});

import { addDoc, collection } from 'firebase/firestore';

describe('RiderService', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('reportIncident', () => {
        it('should report incident with correct payload', async () => {
            (addDoc as any).mockResolvedValue({ id: 'incident-id' });

            const incidentData = {
                type: 'accident' as const,
                description: 'Fender bender',
                isUrgent: true,
                franchiseId: 'f1'
            };

            const result = await riderService.reportIncident('rider1', incidentData);

            expect(result.id).toBe('incident-id');
            expect(addDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    riderId: 'rider1',
                    type: 'accident',
                    status: 'open',
                    createdAt: 'MOCK_TIMESTAMP'
                })
            );
        });
    });

    describe('submitChecklist', () => {
        it('should submit checklist with correct payload', async () => {
            (addDoc as any).mockResolvedValue({ id: 'check-id' });

            const checkData = {
                items: ['lights', 'brakes'],
                vehicleId: 'moto1',
                franchiseId: 'f1'
            };

            const result = await riderService.submitChecklist('rider1', checkData);

            expect(result.id).toBe('check-id');
            expect(addDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    riderId: 'rider1',
                    allClear: true,
                    items: ['lights', 'brakes'],
                    createdAt: 'MOCK_TIMESTAMP'
                })
            );
        });
    });
});
