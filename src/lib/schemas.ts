import { z } from 'zod';

// Regex: Mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula y 1 número.
const passwordComplexity = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/;

/**
 * Esquema Base: Reglas comunes para Creación y Edición.
 * Incluye sanitización automática (trim, lowerCase para emails).
 */
const baseUserSchema = z.object({
    displayName: z.string()
        .trim()
        .min(2, "El nombre debe tener al menos 2 caracteres"),

    email: z.string()
        .trim()
        .toLowerCase()
        .email("Introduce una dirección de correo válida"),

    role: z.enum(['admin', 'franchise', 'staff', 'rider', 'user']),
    franchiseId: z.string().optional(),
    phoneNumber: z.string().regex(/^\+?[0-9\s-]{6,}$/, "Formato de teléfono inválido").optional().or(z.literal('')),
    pack: z.enum(['basic', 'premium']).default('basic'),
    status: z.enum(['active', 'pending', 'banned']).default('active'),

    // Franchise-specific fields
    name: z.string().trim().optional(), // Ciudad Franquicia
    legalName: z.string().trim().optional(), // Razón Social
    cif: z.string().trim().optional(),
    city: z.string().trim().optional(),
    address: z.string().trim().optional()
});

/**
 * Esquema de Creación:
 * - Password OBLIGATORIO para 'admin', 'franchise', 'user'.
 * - Password OPCIONAL para 'rider', 'staff'.
 */
export const createUserSchema = baseUserSchema.extend({
    password: z.string().optional()
}).refine((data) => {
    // Si es un rol con login necesario, exigimos password complejo
    const loginRoles = ['admin', 'franchise', 'rider', 'user'];
    if (loginRoles.includes(data.role)) {
        if (!data.password || !passwordComplexity.test(data.password)) {
            return false;
        }
    }
    return true;
}, {
    message: "La contraseña es obligatoria y debe ser segura (Min 8 caracteres, Mayús/Minús/Núm)",
    path: ["password"]
}).refine((data) => {
    if (data.role === 'franchise') {
        if (!data.name || data.name.trim() === '') return false;
    }
    return true;
}, {
    message: "El nombre de Ciudad Franquicia es obligatorio",
    path: ["name"]
}).refine((data) => {
    if (data.role === 'franchise') {
        if (!data.legalName || data.legalName.trim() === '') return false;
    }
    return true;
}, {
    message: "La Razón Social es obligatoria",
    path: ["legalName"]
}).refine((data) => {
    if (data.role === 'franchise' && (!data.cif || data.cif.trim() === '')) {
        return false;
    }
    return true;
}, {
    message: "El CIF/NIF es obligatorio para franquiciados",
    path: ["cif"]
});

/**
 * Esquema de Edición: Password es OPCIONAL.
 * Solo se valida si el usuario escribe algo.
 */
export const updateUserSchema = baseUserSchema.extend({
    password: z.string()
        .optional()
        .refine((val) => !val || val === '' || passwordComplexity.test(val), {
            message: "La nueva contraseña debe ser segura (Mayús/Minús/Núm)",
        }),
});

export const financeSchema = z.object({
    revenue: z.coerce.number().min(0.01, "Los ingresos deben ser mayores a 0"),
    orders: z.coerce.number().int().min(0, "El número de pedidos no puede ser negativo"),
    activeVehicles: z.coerce.number().int().min(0, "Los vehículos activos no pueden ser negativos"),
    notes: z.string().max(500, "Máximo 500 caracteres").optional()
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type FinanceInput = z.infer<typeof financeSchema>;
export type UserRole = 'admin' | 'franchise' | 'staff' | 'rider' | 'user';

