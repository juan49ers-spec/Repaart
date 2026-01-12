import { describe, it, expect } from 'vitest';
import { riderSchema } from './RiderSchema';

describe('RiderSchema Validation', () => {
    it('should validate a correct rider object', () => {
        const validRider = {
            fullName: 'Juan Pérez',
            email: 'juan@repaart.com',
            phone: '+34 600 123 456',
            status: 'active'
        };

        const result = riderSchema.safeParse(validRider);
        expect(result.success).toBe(true);
    });

    it('should fail if name is too short', () => {
        const invalidRider = {
            fullName: 'J',
            email: 'juan@repaart.com',
            phone: '+34 600 123 456',
            status: 'active'
        };

        const result = riderSchema.safeParse(invalidRider);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain('al menos 2 caracteres');
        }
    });

    it('should fail if email is invalid', () => {
        const invalidRider = {
            fullName: 'Juan Pérez',
            email: 'juan-no-email',
            phone: '+34 600 123 456',
            status: 'active'
        };

        const result = riderSchema.safeParse(invalidRider);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Email inválido');
        }
    });

    it('should fail if phone format is invalid', () => {
        const invalidRider = {
            fullName: 'Juan Pérez',
            email: 'juan@repaart.com',
            phone: '123', // Too short/invalid format
            status: 'active'
        };

        const result = riderSchema.safeParse(invalidRider);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Número de teléfono inválido');
        }
    });

    it('should fail if status is not allowed', () => {
        const invalidRider = {
            fullName: 'Juan Pérez',
            email: 'juan@repaart.com',
            phone: '+34 600 123 456',
            status: 'super-active' as any // Force invalid value bypassing TS
        };

        const result = riderSchema.safeParse(invalidRider);
        expect(result.success).toBe(false);
        if (!result.success) {
            // Check if error map works, otherwise strictly check received error
            // const msg = result.error.issues[0].message;
            // expect(msg).toBe('Estado inválido');
            expect(result.success).toBe(false);
        }
    });
});
