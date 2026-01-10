import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from './userService';
import { UserSchema, toUserId } from '../../schemas/users';
import { toFranchiseId } from '../../schemas/scheduler';
import { getDocs, setDoc } from 'firebase/firestore';

// --- Mocks ---
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn().mockReturnValue({ id: 'test_uid' }),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    onSnapshot: vi.fn(),
    getDocs: vi.fn(),
}));

describe('UserService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Schema Validation', () => {
        it('should validate a correct user object', () => {
            const validUser = {
                uid: 'user123',
                email: 'test@example.com',
                displayName: 'Test User',
                role: 'driver',
                status: 'active',
                franchiseId: 'franchise1'
            };
            const result = UserSchema.safeParse(validUser);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.role).toBe('driver');
                expect(result.data.franchiseId).toBe('franchise1');
            }
        });

        it('should fail if required fields are missing', () => {
            const invalidUser = {
                uid: 'user123',
                // missing email and name
                role: 'driver'
            };
            const result = UserSchema.safeParse(invalidUser);
            expect(result.success).toBe(false);
        });

        it('should enforce enum values for role and status', () => {
            const invalidRole = {
                uid: 'user123',
                email: 'test@example.com',
                displayName: 'Test User',
                role: 'super_admin', // Invalid
                status: 'sleeping' // Invalid
            };
            const result = UserSchema.safeParse(invalidRole);
            expect(result.success).toBe(false);
        });
    });

    describe('Service Methods', () => {
        it('createUser should validate and write to Firestore', async () => {
            const input = {
                email: 'new@example.com',
                displayName: 'New User',
                role: 'staff' as const,
                status: 'active' as const,
                franchiseId: toFranchiseId('f1')
            };
            const uid = toUserId('user_new');

            await UserService.createUser(uid, input);

            expect(setDoc).toHaveBeenCalled();
            // Verify the payload passed to setDoc contained the correct data
            const callArgs = vi.mocked(setDoc).mock.calls[0];
            expect(callArgs[1]).toMatchObject({
                uid: 'user_new',
                email: 'new@example.com',
                status: 'active'
            });
        });

        it('getAvailableRiders should query correctly', async () => {
            const mockDocs = [
                { id: 'u1', data: () => ({ email: 'r1@test.com', displayName: 'Rider 1', role: 'driver', status: 'active', franchiseId: 'f1' }) },
                { id: 'u2', data: () => ({ email: 'r2@test.com', displayName: 'Rider 2', role: 'driver', status: 'active', franchiseId: 'f1' }) }
            ];
            vi.mocked(getDocs).mockResolvedValue({ docs: mockDocs } as any);

            const riders = await UserService.getAvailableRiders(toFranchiseId('f1'));

            expect(riders).toHaveLength(2);
            expect(riders[0].role).toBe('driver');
            expect(riders[0].uid).toBe('u1');
        });
    });
});
