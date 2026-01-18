import { z } from 'zod';

export const riderSchema = z.object({
    fullName: z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(50, 'El nombre es demasiado largo'),

    email: z
        .string()
        .email('Email inválido'),

    phone: z
        .string()
        .regex(/^\+?[0-9\s-]{9,}$/, 'Número de teléfono inválido'),

    status: z.enum(['active', 'inactive', 'on_route', 'maintenance']),

    password: z
        .string()
        .min(6, 'La contraseña debe tener al menos 6 caracteres')
        .optional()
        .or(z.literal('')), // Allow empty string which will be treated as undefined

    contractHours: z.number()
        .min(0, 'Las horas no pueden ser negativas')
        .max(168, 'Imposible trabajar más de 168h'),

    licenseType: z.enum(['49cc', '125cc']).default('125cc'),

    joinedAt: z.string().optional() // ISO String for manual onboarding date
});

export type RiderFormValues = z.infer<typeof riderSchema>;
