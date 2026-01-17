import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FleetService } from '../fleetService';
import { MotoSchema } from '../../schemas/fleet';
import { toFranchiseId } from '../../schemas/scheduler';
import { setDoc } from 'firebase/firestore';

// --- Mocks ---
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn().mockReturnValue({ id: 'new_moto_id' }),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    onSnapshot: vi.fn(),
    serverTimestamp: vi.fn(),
}));

vi.mock('../../lib/firebase', () => ({
    db: {}
}));

vi.spyOn(console, 'error').mockImplementation(() => { });

describe('Fleet Module (Phase 2)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // 1. Schema Tests
    describe('MotoSchema', () => {
        it('should validate a valid moto', () => {
            const valid = {
                id: 'moto_1',
                franchiseId: 'f1',
                plate: '1234XYZ',
                brand: 'Yamaha',
                model: 'NMAX',
                status: 'active',
                currentKm: 1000,
                nextRevisionKm: 5000
            };
            const result = MotoSchema.safeParse(valid);
            expect(result.success).toBe(true);
        });

        it('should reject missing required fields', () => {
            const invalid = {
                id: 'moto_1',
                // Missing plate
                brand: 'Yamaha'
            };
            const result = MotoSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });
    });

    // 2. Service Tests
    describe('FleetService', () => {
        it('createMoto should validate and write to DB', async () => {
            const fid = toFranchiseId('f1');
            const input = {
                plate: '1234ABC',
                brand: 'Honda',
                model: 'PCX',
                currentKm: 0,
                nextRevisionKm: 4000,
                status: 'active' as const,
                insuranceExpiry: '2026-01-01'
            };

            await FleetService.createMoto(fid, input);

            expect(setDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    plate: '1234ABC',
                    franchiseId: 'f1',
                    status: 'active'
                })
            );
        });
        describe('Legacy Compatibility', () => {
            it('createVehicle should map snake_case to camelCase', async () => {
                const fid = toFranchiseId('f1');
                const input = {
                    matricula: 'LEGACY1',
                    modelo: 'OldModel',
                    km_actuales: 100,
                    proxima_revision_km: 1000,
                    estado: 'activo'
                };

                await FleetService.createVehicle(fid, input);

                expect(setDoc).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        plate: 'LEGACY1',
                        model: 'OldModel',
                        currentKm: 100,
                        nextRevisionKm: 1000,
                        status: 'active'
                    })
                );
            });
        });
    });
});

