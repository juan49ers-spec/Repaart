import { z } from 'zod';

// --- Branded Types Implementation ---
declare const brand: unique symbol;

type Brand<K, T> = K & { readonly [brand]: T };

export type FranchiseId = Brand<string, 'FranchiseId'>;
export type WeekId = Brand<string, 'WeekId'>;
export type UserId = Brand<string, 'UserId'>;
export type MotoId = Brand<string, 'MotoId'>;

// Helper to cast string to Branded Type (use carefully, mostly at strict boundaries)
export const toFranchiseId = (id: string) => id as FranchiseId;
export const toWeekId = (id: string) => id as WeekId;
export const toUserId = (id: string) => id as UserId;
export const toMotoId = (id: string) => id as MotoId;

// --- Zod Schemas ---

export const FranchiseIdSchema = z.string().min(1).transform(t => t as FranchiseId);

export const WeekMetricsSchema = z.object({
    totalHours: z.number().default(0),
    activeRiders: z.number().default(0),
    motosInUse: z.number().default(0),
});

export const ShiftSchema = z.object({
    id: z.string().optional(), // Allow missing ID (legacy data)
    shiftId: z.string().optional(), // Accommodate loose data
    riderId: z.string().nullable(),
    riderName: z.string().nullable().optional(),
    startAt: z.string(), // Relax datetime to string to avoid timezone parsing crashes during load
    endAt: z.string(),
    motoId: z.string().nullable().optional(),
    motoPlate: z.string().nullable().optional(),
    notes: z.string().optional(),
    isDraft: z.boolean().optional(),
    isConfirmed: z.boolean().optional(),
    swapRequested: z.boolean().optional(),
    changeRequested: z.boolean().optional(),
    changeReason: z.string().nullable().optional(),
    date: z.string().optional(),
    franchiseId: z.string().optional(),
    isNew: z.boolean().optional(),
});

export const WeekDataSchema = z.object({
    id: z.string().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Invalid date format (YYYY-MM-DD)" }).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Invalid date format (YYYY-MM-DD)" }).optional(),
    status: z.enum(['draft', 'published', 'completed', 'active']).default('draft'),
    metrics: WeekMetricsSchema.optional().default({ totalHours: 0, activeRiders: 0, motosInUse: 0 }),
    shifts: z.array(ShiftSchema).optional().default([]),
});

// Inference Types
export type WeekMetrics = z.infer<typeof WeekMetricsSchema>;
export type Shift = z.infer<typeof ShiftSchema>;
export type WeekData = z.infer<typeof WeekDataSchema>;

// Re-export strict types associated with brands for internal usage
export interface WeekDocument extends WeekData {
    id: string; // Firestore ID corresponds to WeekId logic, but raw standard string in DB
}
