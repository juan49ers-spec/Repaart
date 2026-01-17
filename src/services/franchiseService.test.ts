import { describe, it, expect, vi, beforeEach } from 'vitest';
import { franchiseService } from './franchiseService';
import { isOk, isErr } from '../types/result';


// Mock Firebase
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
}));

vi.mock('../lib/firebase', () => ({
    db: {}
}));

// Helper to create mock doc snapshots
const mockDoc = (id: string, data: any) => ({
    id,
    exists: () => true,
    data: () => data
});

const mockQuerySnapshot = (docs: any[]) => ({
    docs: docs.map(d => ({
        id: d.id,
        data: () => d.data,
        exists: () => true
    }))
});

import { getDoc, getDocs } from 'firebase/firestore';

describe('FranchiseService (Strict Types)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getFranchiseMeta', () => {
        it('should return metadata if user exists and is franchise', async () => {
            const franchiseData = {
                role: 'franchise',
                name: 'Test Franchise',
                address: 'Calle Test 123',
                franchiseId: 'f-123'
            };

            (getDoc as any).mockResolvedValue(mockDoc('uid_123', franchiseData));

            const result = await franchiseService.getFranchiseMeta('uid_123');

            expect(isOk(result)).toBe(true);
            if (isOk(result)) {
                expect(result.data.id).toBe('f-123');
                expect(result.data.name).toBe('Test Franchise');
            }
        });

        it('should return null (NOT_FOUND) if user not found', async () => {
            (getDoc as any).mockResolvedValue({ exists: () => false });

            // Mock fallback getAllFranchises to return empty
            // Since getFranchiseMeta calls getAllFranchises internally on failure, we need to mock getDocs for that too or mock the service method?
            // But we are testing the service method.
            // Internal call uses exported function or local? It uses `franchiseService.getAllFranchises()`.
            // We can mock the firestore call for getAllFranchises to return empty.
            (getDocs as any).mockResolvedValue({ docs: [] });

            const result = await franchiseService.getFranchiseMeta('uid_unknown');
            expect(isErr(result)).toBe(true);
            if (isErr(result)) {
                expect(result.error.type).toBe('NOT_FOUND');
            }
        });
    });

    describe('getAllFranchises', () => {
        it('should map documents correctly', async () => {
            const docs = [
                { id: 'uid_1', data: { role: 'franchise', name: 'F1', franchiseId: 'f1' } },
                { id: 'uid_2', data: { role: 'franchise', name: 'F2' } } // Missing franchiseId, should fallback to doc.id
            ];

            (getDocs as any).mockResolvedValue(mockQuerySnapshot(docs));

            const result = await franchiseService.getAllFranchises();

            expect(isOk(result)).toBe(true);
            if (isOk(result)) {
                expect(result.data).toHaveLength(2);
                expect(result.data[0].id).toBe('f1');
                expect(result.data[1].id).toBe('uid_2');
                expect(result.data[0].uid).toBe('uid_1');
            }
        });
    });
});
