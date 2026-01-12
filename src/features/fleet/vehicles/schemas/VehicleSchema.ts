import { z } from 'zod';

export const VehicleStatusEnum = z.enum(['activo', 'mantenimiento', 'baja']); // Keeping Spanish UI values but could map. Let's stick to Spanish for consistency with previous setup.
export type VehicleStatus = z.infer<typeof VehicleStatusEnum>;

export const VehicleSchema = z.object({
    id: z.string().optional(),
    matricula: z.string().min(1, "La matrícula es obligatoria"), // Format validation could be improved later regex
    modelo: z.string().min(1, "El modelo es obligatorio"),
    km_actuales: z.number().min(0, "Los km no pueden ser negativos").default(0),
    proxima_revision_km: z.number().min(1, "El campo de próxima revisión es obligatorio").default(5000),
    estado: VehicleStatusEnum.default('activo'),

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
