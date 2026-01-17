import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from './userService';

// Mock Firebase
vi.mock('../lib/firebase', () => ({
    db: {}
}));

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        collection: vi.fn(() => ({ type: 'collection' })),
        query: vi.fn(),
        getDocs: vi.fn(),
        addDoc: vi.fn(),
        doc: vi.fn(() => ({ id: 'mock-doc-id' })),
        setDoc: vi.fn(),
        getDoc: vi.fn(),
        where: vi.fn(() => ({ type: 'where_constraint' })),
        serverTimestamp: () => 'MOCK_TIMESTAMP',
    };
});

import { getDocs, addDoc, where } from 'firebase/firestore';

describe('UserService', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchUsers', () => {
        it('should fetch users without filters', async () => {
            const mockDocs = [
                { id: 'u1', data: () => ({ name: 'User 1', role: 'rider' }) },
                { id: 'u2', data: () => ({ name: 'User 2', role: 'admin' }) }
            ];
            (getDocs as any).mockResolvedValue({ docs: mockDocs });

            const result = await userService.fetchUsers();

            expect(result).toHaveLength(2);
            expect(result[0].uid).toBe('u1');
            expect(where).not.toHaveBeenCalled();
        });

        it('should fetch users with role filter', async () => {
            (getDocs as any).mockResolvedValue({ docs: [] });

            await userService.fetchUsers('franchise');

            expect(where).toHaveBeenCalledWith('role', '==', 'franchise');
        });
    });

    describe('createFranchise', () => {
        it('should create franchise with valid data', async () => {
            (addDoc as any).mockResolvedValue({ id: 'new-franchise-id' });

            const franchiseData = {
                name: 'Test Franchise',
                location: { zipCodes: ['28001'] },
                settings: { isActive: true }
            };

            const result = await userService.createFranchise(franchiseData);

            expect(result.success).toBe(true);
            expect(result.data.id).toBe('new-franchise-id');
            expect(addDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    name: 'Test Franchise',
                    role: 'franchise',
                    active: true
                })
            );
        });

        it('should throw error if missing zipCodes', async () => {
            const franchiseData = {
                name: 'Bad Franchise',
                location: { zipCodes: [] as string[] }, // Empty array
                settings: { isActive: true }
            };

            await expect(userService.createFranchise(franchiseData))
                .rejects.toThrow("Datos incompletos");
        });
    });
});
