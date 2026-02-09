import { describe, it, expect, vi, beforeEach } from 'vitest';
import { financeRecords } from './records';
import { isOk, isErr } from '../../types/result';

// Mock Firebase
vi.mock('../../lib/firebase', () => ({
    db: {}
}));

const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockDoc = vi.fn();
const mockCollection = vi.fn();
const mockServerTimestamp = vi.fn(() => 'timestamp');

vi.mock('firebase/firestore', () => ({
    collection: (...args: any[]) => mockCollection(...args),
    doc: (...args: any[]) => mockDoc(...args),
    addDoc: (...args: any[]) => mockAddDoc(...args),
    updateDoc: (...args: any[]) => mockUpdateDoc(...args),
    deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
    getDoc: (...args: any[]) => mockGetDoc(...args),
    serverTimestamp: () => mockServerTimestamp(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    onSnapshot: vi.fn(),
    increment: vi.fn()
}));

// Mock internal helper to avoid complex dependency
financeRecords._reverseAggregation = vi.fn().mockResolvedValue(undefined);

describe('financeRecords', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('addRecord', () => {
        it('should return VALIDATION_ERROR if franchiseId is missing', async () => {
            const result = await financeRecords.addRecord('', { amount: 100 } as any);

            expect(isErr(result)).toBe(true);
            if (isErr(result)) {
                expect(result.error.type).toBe('VALIDATION_ERROR');
                expect(result.error).toHaveProperty('field', 'franchiseId');
            }
        });

        it('should return Ok with ID on success', async () => {
            mockAddDoc.mockResolvedValueOnce({ id: 'new-record-id' });

            const result = await financeRecords.addRecord('franchise-1', {
                amount: 100,
                type: 'income',
                description: 'Test'
            } as any);

            expect(isOk(result)).toBe(true);
            if (isOk(result)) {
                expect(result.data).toBe('new-record-id');
            }
            expect(mockAddDoc).toHaveBeenCalledTimes(1);
        });

        it('should return UNKNOWN_ERROR on firestore failure', async () => {
            mockAddDoc.mockRejectedValueOnce(new Error('Firestore error'));

            const result = await financeRecords.addRecord('franchise-1', { amount: 100 } as any);

            expect(isErr(result)).toBe(true);
            if (isErr(result)) {
                expect(result.error.type).toBe('UNKNOWN_ERROR');
            }
        });
    });

    describe('updateStatus', () => {
        it('should return Ok on success', async () => {
            mockUpdateDoc.mockResolvedValueOnce(undefined);

            const result = await financeRecords.updateStatus('record-1', 'approved');

            expect(isOk(result)).toBe(true);
            expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
        });
    });

    describe('deleteRecord', () => {
        it('should return NOT_FOUND if record does not exist', async () => {
            mockGetDoc.mockResolvedValueOnce({ exists: () => false });

            const result = await financeRecords.deleteRecord('non-existent');

            expect(isErr(result)).toBe(true);
            if (isErr(result)) {
                expect(result.error.type).toBe('NOT_FOUND');
            }
        });

        it('should return Ok and call _reverseAggregation on success', async () => {
            mockGetDoc.mockResolvedValueOnce({
                exists: () => true,
                data: () => ({ franchise_id: 'f1', amount: 100, month: '2023-10' })
            });
            mockDeleteDoc.mockResolvedValueOnce(undefined);

            const result = await financeRecords.deleteRecord('record-1');

            expect(isOk(result)).toBe(true);
            expect(financeRecords._reverseAggregation).toHaveBeenCalled();
            expect(mockDeleteDoc).toHaveBeenCalled();
        });
    });
});
