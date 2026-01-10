import { z } from 'zod';

// Re-export zod types
export const createUserSchema: z.ZodType<any>;
export const updateUserSchema: z.ZodType<any>;
export const financeSchema: z.ZodType<any>;

// User roles
export type UserRole = 'admin' | 'franchise' | 'user' | 'driver' | 'staff';

// Zod type inference helpers
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type FinanceInput = z.infer<typeof financeSchema>;
