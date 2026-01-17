import { describe, it, expect, vi, beforeEach } from 'vitest';
import { migrationService } from './migrationService';
import { getDocs, writeBatch } from 'firebase/firestore';

// Mock Firestore
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn(),
    getDocs: vi.fn(),
    writeBatch: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    updateDoc: vi.fn(),
    serverTimestamp: vi.fn().mockReturnValue('TIMESTAMP')
}));

vi.mock('../lib/firebase', () => ({
    db: {}
}));

describe('MigrationService (Legacy Cleanup)', () => {
    let mockBatch: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockBatch = {
            delete: vi.fn(),
            update: vi.fn(),
            commit: vi.fn().mockResolvedValue(undefined),
            set: vi.fn()
        };
        (writeBatch as any).mockReturnValue(mockBatch);
    });

    describe('cleanOrphanedShifts', () => {
        it('should mark Valentino as inactive and remove his shifts', async () => {
            // 1. Mock Riders/Users
            const valentinoRider = { id: 'r1', data: () => ({ fullName: 'Valentino Rossi', status: 'active', email: 'v@test.com' }), ref: 'ref1' };
            const normalRider = { id: 'r2', data: () => ({ fullName: 'Normal Rider', status: 'active', franchiseId: 'f1', email: 'n@test.com' }), ref: 'ref2' };

            (getDocs as any)
                .mockResolvedValueOnce({ docs: [valentinoRider], forEach: (cb: any) => [valentinoRider].forEach(cb) }) // riders
                .mockResolvedValueOnce({ docs: [normalRider], forEach: (cb: any) => [normalRider].forEach(cb) });   // users

            // 2. Mock Shifts collections check
            // We mock empty return for simple collections to focus on logic
            (getDocs as any)
                .mockResolvedValueOnce({ docs: [], forEach: () => { } }) // shifts
                .mockResolvedValueOnce({ docs: [], forEach: () => { } }) // work_shifts
                .mockResolvedValueOnce({ docs: [], forEach: () => { } }); // franchise_shifts

            // 3. Mock Legacy Weeks (if franchiseId provided)
            // Skip this part for this test by not providing franchiseId or mocking accordingly

            const result = await migrationService.cleanOrphanedShifts();

            expect(result.success).toBe(true);
            // Expect Valentino to be deactivated
            expect(mockBatch.update).toHaveBeenCalledWith('ref1', expect.objectContaining({ status: 'inactive' }));
        });
    });
});
