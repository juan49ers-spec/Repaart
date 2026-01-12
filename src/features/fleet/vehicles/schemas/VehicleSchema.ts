import { z } from 'zod';

export const VehicleStatusEnum = z.enum(['active', 'maintenance', 'deleted', 'out_of_service']);
export type VehicleStatus = z.infer<typeof VehicleStatusEnum>;

export const VehicleSchema = z.object({
    id: z.string().optional(),
    matricula: z.string().min(1, "La matrícula es obligatoria"), // Format validation could be improved later regex
    modelo: z.string().min(1, "El modelo es obligatorio"),
    km_actuales: z.number().min(0, "Los km no pueden ser negativos"),
    proxima_revision_km: z.number().min(1, "El campo de próxima revisión es obligatorio"),
    estado: VehicleStatusEnum,

    // Metadata
    type: z.literal('vehicle').default('vehicle'),
    franchise_id: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional()
});

export type Vehicle = z.infer<typeof VehicleSchema>;

// Form values might differ slightly from domain model if needed, but usually similar
export const VehicleFormSchema = VehicleSchema.omit({
    id: true,
    type: true,
    franchise_id: true,
    createdAt: true,
    updatedAt: true
});

export type VehicleFormValues = z.infer<typeof VehicleFormSchema>;
