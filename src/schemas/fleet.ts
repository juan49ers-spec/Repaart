import { z } from 'zod';
import { FranchiseIdSchema } from './scheduler';

// --- Branded Types ---
export type VehicleId = string & { readonly __brand: unique symbol };
export const VehicleIdSchema = z.string().uuid().or(z.string().min(1)).transform(t => t as VehicleId);

// Helper for casting strings to VehicleId
export const toVehicleId = (id: string): VehicleId => id as VehicleId;

// Legacy support
export type MotoId = VehicleId;
export const MotoIdSchema = VehicleIdSchema;
export const toMotoId = toVehicleId;

// --- Enums ---
export const VehicleStatusEnum = z.enum(['active', 'maintenance', 'deleted', 'out_of_service']);
export type VehicleStatus = z.infer<typeof VehicleStatusEnum>;

// Legacy support
export const MotoStatusEnum = VehicleStatusEnum;
export type MotoStatus = VehicleStatus;

// --- Schemas ---
export const VehicleSchema = z.object({
    id: VehicleIdSchema.optional(),
    franchiseId: FranchiseIdSchema.optional(),
    plate: z.string().min(1, "La matrícula es obligatoria").toUpperCase(),
    brand: z.string().min(1, "La marca es obligatoria").optional(), // Made optional to support simple model strings
    model: z.string().min(1, "El modelo es obligatorio"),
    vin: z.string().optional(),
    currentKm: z.number().nonnegative("Los km no pueden ser negativos").default(0),
    nextRevisionKm: z.number().nonnegative("El campo de próxima revisión es obligatorio").default(5000),
    status: VehicleStatusEnum.default('active'),
    type: z.literal('vehicle').default('vehicle'),
    insuranceExpiry: z.string().optional(),

    // Metadata
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type Vehicle = z.infer<typeof VehicleSchema>;

// Legacy support
export const MotoSchema = VehicleSchema;
export type Moto = Vehicle;

export const CreateVehicleSchema = VehicleSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>;

export const VehicleFormSchema = z.object({
    franchiseId: z.string().optional(),
    plate: z.string().min(1, "La matrícula es obligatoria").toUpperCase(),
    brand: z.string().optional(),
    model: z.string().min(1, "El modelo es obligatorio"),
    vin: z.string().optional(),
    currentKm: z.number().nonnegative("Los km no pueden ser negativos"),
    nextRevisionKm: z.number().nonnegative("El campo de próxima revisión es obligatorio"),
    status: VehicleStatusEnum,
    insuranceExpiry: z.string().optional(),
});
export type VehicleFormValues = z.infer<typeof VehicleFormSchema>;

// Legacy support
export const CreateMotoSchema = CreateVehicleSchema;
export type CreateMotoInput = CreateVehicleInput;
