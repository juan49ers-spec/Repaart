import { describe, it, expect, vi, beforeEach } from 'vitest';
import { operationsService, Rider } from './operationsService';
import { getDocs, addDoc, updateDoc } from 'firebase/firestore';

// Mock Firebase
vi.mock('../lib/firebase', () => ({
    db: {}
}));

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual,
        collection: vi.fn(() => ({ type: 'collection' })),
        query: vi.fn(),
        getDocs: vi.fn(),
        addDoc: vi.fn(),
        doc: vi.fn(() => ({ id: 'mock-doc-id' })),
        updateDoc: vi.fn(),
        writeBatch: vi.fn(() => ({
            set: vi.fn(),
            commit: vi.fn()
        })),
        where: vi.fn(() => ({ type: 'where_constraint' })),
        serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP'),
    };
});

describe('OperationsService', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchRiders', () => {
        it('should fetch and normalize riders correctly', async () => {
            const mockDocs = [
                {
                    id: 'r1',
                    data: () => ({
                        fullName: 'Rider One',
                        role: 'rider',
                        franchiseId: 'f1',
                        status: 'active'
                    })
                },
                {
                    id: 'r2', // Legacy format
                    data: () => ({
                        name: 'Rider Legacy', // Should map to fullName
                        phoneNumber: '123456789', // Should map to phone
                        role: 'staff',
                        franchiseId: 'f1',
                        status: 'active'
                    })
                },
                {
                    id: 'r3', // Deleted user
                    data: () => ({
                        fullName: 'Deleted User',
                        role: 'rider',
                        franchiseId: 'f1',
                        status: 'deleted'
                    })
                }
            ];

            (getDocs as any).mockResolvedValue({ docs: mockDocs });

            const result = await operationsService.fetchRiders('f1');

            expect(result).toHaveLength(2); // r1 and r2 only

            // Check normalization
            expect(result[0].fullName).toBe('Rider One');
            expect(result[1].fullName).toBe('Rider Legacy');
            expect(result[1].phone).toBe('123456789');
        });

        it('should return empty array if no franchiseId provided', async () => {
            const result = await operationsService.fetchRiders('');
            expect(result).toEqual([]);
            expect(getDocs).not.toHaveBeenCalled();
        });
    });

    describe('updateRider', () => {
        it('should map legacy fields during update', async () => {
            const updates: Partial<Rider> = {
                fullName: 'New Name',
                phone: '987654321'
            };

            await operationsService.updateRider('r1', updates);

            expect(updateDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    fullName: 'New Name',
                    displayName: 'New Name', // Mapped
                    phone: '987654321',
                    phoneNumber: '987654321', // Mapped
                    updatedAt: expect.anything()
                })
            );
        });
    });

    describe('createRider', () => {
        it('should set default fields for new rider', async () => {
            const newRider: Partial<Rider> = {
                fullName: 'Fresh Rider',
                email: 'fresh@test.com'
            };

            await operationsService.createRider(newRider);

            expect(addDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    fullName: 'Fresh Rider',
                    role: 'rider',
                    status: 'active',
                    createdAt: 'MOCK_TIMESTAMP'
                })
            );
        });
    });

});
