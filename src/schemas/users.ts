import { z } from 'zod';
import { FranchiseIdSchema } from './scheduler';

// --- Branded Types ---
export type UserId = string & { readonly __brand: unique symbol };
export const UserIdSchema = z.string().min(1).transform(t => t as UserId);

// Helper for casting strings to UserId
export const toUserId = (id: string): UserId => id as UserId;

// --- Enums ---
export const UserRoleEnum = z.enum(['admin', 'staff', 'rider', 'franchise_owner', 'franchisee', 'user', 'superadmin', 'franchise']).or(z.string());
export type UserRole = z.infer<typeof UserRoleEnum>;

export const UserStatusEnum = z.enum(['active', 'pending', 'banned', 'deleted']);
export type UserStatus = z.infer<typeof UserStatusEnum>;

// --- Helpers ---
const TimestampSchema = z.union([
    z.string(),
    z.date(),
    z.object({ seconds: z.number(), nanoseconds: z.number() }),
    z.any() // Fallback
]).optional();

// --- Franchise Schema ---
export const FranchiseLocationSchema = z.object({
    address: z.string().optional(),
    city: z.string().optional(),
    zipCodes: z.array(z.string()).default([]),
});

export const FranchiseSchema = z.object({
    id: z.string(),
    uid: z.string(),
    name: z.string().min(1, "Nombre de franquicia requerido"),
    email: z.string().email().optional(),
    role: z.string().optional().default('franchise'),
    isActive: z.boolean().default(true), // standardized from 'active'
    status: z.string().optional().default('active'),
    location: z.union([FranchiseLocationSchema, z.string()]).optional(),
    settings: z.object({
        isActive: z.boolean()
    }).optional(),
    displayName: z.string().optional(),
    metrics: z.object({
        revenue: z.number().optional(),
        orders: z.number().optional(),
        profit: z.number().optional(),
        margin: z.number().optional(),
    }).optional(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
});

export type Franchise = z.infer<typeof FranchiseSchema>;

// --- User Schema ---
export const UserSchema = z.object({
    uid: UserIdSchema,
    id: z.string().optional(),

    email: z.string().email(),
    displayName: z.string().min(1, "Name is required"),
    role: UserRoleEnum.default('user'),
    status: UserStatusEnum.default('active'),
    franchiseId: FranchiseIdSchema.optional(),

    phoneNumber: z.string().optional(), // standardized from 'phone'
    photoURL: z.string().optional().or(z.literal('')),

    // Detailed Profile
    pack: z.union([z.literal('basic'), z.literal('premium')]).optional(),
    legalName: z.string().optional(),
    cif: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    zipCodes: z.array(z.string()).optional(),
    monthlyRevenueGoal: z.number().optional(),
    logisticsRates: z.array(z.any()).optional(), // Added for Franchise compatibility

    notifications: z.record(z.string(), z.boolean()).optional(),

    // Metadata
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserInputSchema = UserSchema.omit({ uid: true, id: true, createdAt: true, updatedAt: true }).extend({
    password: z.string().min(6).optional(),
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

// Legacy Compatibility Aliases
export type UserProfile = User;
export type FranchiseEntity = Franchise;
export type FranchiseMetadata = Franchise;
