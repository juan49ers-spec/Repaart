import { z } from 'zod';
import { FranchiseIdSchema } from './scheduler';

// --- Branded Types ---
export type MotoId = string & { readonly __brand: unique symbol };
export const MotoIdSchema = z.string().uuid().or(z.string().min(1)).transform(t => t as MotoId);

// Helper for casting strings to MotoId
export const toMotoId = (id: string): MotoId => id as MotoId;

// --- Enums ---
export const MotoStatusEnum = z.enum(['active', 'maintenance', 'deleted', 'out_of_service']);
export type MotoStatus = z.infer<typeof MotoStatusEnum>;

// --- Schemas ---
export const MotoSchema = z.object({
    id: MotoIdSchema,
    franchiseId: FranchiseIdSchema.optional(), // Link to franchise
    plate: z.string().min(1, "License plate is required").toUpperCase(),
    brand: z.string().min(1, "Brand is required"),
    model: z.string().min(1, "Model is required"),
    vin: z.string().optional(),
    currentKm: z.number().nonnegative().default(0),
    nextRevisionKm: z.number().nonnegative().default(0),
    status: MotoStatusEnum.default('active'),
    insuranceExpiry: z.string().optional(), // ISO Date string usually

    // Metadata
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type Moto = z.infer<typeof MotoSchema>;

export const CreateMotoSchema = MotoSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type CreateMotoInput = z.infer<typeof CreateMotoSchema>;
