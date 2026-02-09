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
    franchiseId: z.string().optional().or(z.literal('')),
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

// --- Phase 3: New Schemas ---

export const shiftSchema = z.object({
    franchiseId: z.string().min(1, "Franchise ID is required"),
    riderId: z.string().min(1, "Rider ID is required"),
    vehicleId: z.string().optional(),
    startTime: z.date(),
    endTime: z.date(),
    status: z.enum(['scheduled', 'active', 'completed', 'cancelled']).default('scheduled'),
    notes: z.string().max(500).optional()
}).refine(data => data.endTime > data.startTime, {
    message: "La hora de fin debe ser posterior a la de inicio",
    path: ["endTime"]
});

export const ticketSchema = z.object({
    userId: z.string().min(1),
    franchiseId: z.string().optional(),
    subject: z.string().min(5, "El asunto debe tener al menos 5 caracteres").max(100),
    description: z.string().min(10, "La descripción debe ser detallada (min 10 caracteres)"),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    category: z.enum(['technical', 'billing', 'operational', 'other']).default('technical'),
    status: z.enum(['open', 'in_progress', 'resolved', 'closed']).default('open')
});

export const fleetAssetSchema = z.object({
    franchiseId: z.string().min(1),
    name: z.string().min(2, "El nombre del vehículo es obligatorio"), // e.g., "Moto 01"
    plate: z.string().regex(/^[0-9]{4}[A-Z]{3}$/, "Matrícula inválida (Ej: 1234ABC)").optional().or(z.literal('')),
    type: z.enum(['moto_125', 'moto_50', 'car', 'bicycle', 'electric_scooter']).default('moto_125'),
    status: z.enum(['active', 'maintenance', 'out_of_service']).default('active'),
    nextMaintenanceDate: z.date().optional(),
    mileage: z.number().min(0).optional()
});

export const announcementSchema = z.object({
    title: z.string().min(5, "Título obligatorio"),
    content: z.string().min(10, "Contenido obligatorio"),
    priority: z.enum(['normal', 'high', 'critical']).default('normal'),
    targetAudience: z.enum(['all', 'franchise', 'rider']).default('all'),
    expiresAt: z.date().optional()
});

export type ShiftInput = z.infer<typeof shiftSchema>;
export type TicketInput = z.infer<typeof ticketSchema>;
export type FleetAssetInput = z.infer<typeof fleetAssetSchema>;
export type AnnouncementInput = z.infer<typeof announcementSchema>;


