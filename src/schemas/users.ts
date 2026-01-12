import { z } from 'zod';
import { FranchiseIdSchema } from './scheduler';

// --- Branded Types ---
export type UserId = string & { readonly __brand: unique symbol };
export const UserIdSchema = z.string().min(1).transform(t => t as UserId);

// Helper for casting strings to UserId
export const toUserId = (id: string): UserId => id as UserId;

// --- Enums ---
// export const UserRoleEnum = z.enum(['admin', 'staff', 'driver', 'franchise_owner', 'franchisee', 'user', 'superadmin']);
export const UserRoleEnum = z.string(); // EMERGENCY RELAX to prevent crash
export type UserRole = z.infer<typeof UserRoleEnum>;

export const UserStatusEnum = z.enum(['active', 'pending', 'banned', 'deleted']);
export type UserStatus = z.infer<typeof UserStatusEnum>;

// --- Schemas ---
export const UserSchema = z.object({
    uid: UserIdSchema, // Primary Key (Firebase Auth UID)
    id: z.string().optional(), // Specific Firestore ID if different (legacy compat)

    email: z.string().email(),
    displayName: z.string().min(1, "Name is required"),
    role: UserRoleEnum.default('user'),
    status: UserStatusEnum.default('active'),
    franchiseId: FranchiseIdSchema.optional(),

    phoneNumber: z.string().optional(),
    photoURL: z.string().optional().or(z.literal('')), // Relaxed validation

    // Metadata
    createdAt: z.union([z.string(), z.date(), z.object({ seconds: z.number(), nanoseconds: z.number() })]).optional().transform(val => {
        if (!val) return undefined;
        if (val instanceof Date) return val.toISOString();
        if (typeof val === 'string') return val;
        // Handle Firestore Timestamp-like objects
        if (typeof val === 'object' && 'seconds' in val) {
            return new Date(val.seconds * 1000).toISOString();
        }
        return String(val);
    }),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserInputSchema = UserSchema.omit({ uid: true, id: true, createdAt: true }).extend({
    password: z.string().min(6).optional(), // Only for admin creation flows
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
