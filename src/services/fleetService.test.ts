import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fleetService } from './fleetService';
import { getDocs, getDoc, updateDoc } from 'firebase/firestore';
import { notificationService } from './notificationService';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn((_db, _coll, id) => ({ id, type: 'doc_ref' })),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    onSnapshot: vi.fn(),
    serverTimestamp: vi.fn(() => ({ type: 'timestamp' })),
    Timestamp: {
        now: vi.fn(() => ({ toDate: () => new Date() })),
    }
}));

vi.mock('../lib/firebase', () => ({
    db: {}
}));

vi.mock('./notificationService', () => ({
    notificationService: {
        notifyFranchise: vi.fn()
    }
}));

vi.mock('firebase/functions', () => ({
    getFunctions: vi.fn(),
    httpsCallable: vi.fn()
}));

// Helper to create mock doc snapshots
const mockDocSnap = (id: string, data: any) => ({
    id,
    exists: () => true,
    data: () => data
});

const mockQuerySnapshot = (docs: any[]) => ({
    docs: docs.map(d => mockDocSnap(d.id, d.data))
});

describe('FleetService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Mapping (mapDocToVehicle)', () => {
        it('should map legacy snake_case fields correctly', async () => {
            const legacyData = {
                matricula: '1234ABC',
                modelo: 'PCX',
                km_actuales: 1500,
                proxima_revision_km: 4000,
                estado: 'activo',
                franchise_id: 'fran_1'
            };

            const docs = [{ id: 'veh_1', data: legacyData }];
            (getDocs as any).mockResolvedValue(mockQuerySnapshot(docs));

            const vehicles = await fleetService.getVehicles('fran_1');
            const v = vehicles[0];

            expect(v.plate).toBe('1234ABC');
            expect(v.model).toBe('PCX');
            expect(v.currentKm).toBe(1500);
            expect(v.nextRevisionKm).toBe(4000);
            expect(v.status).toBe('active');
            expect(v.franchiseId).toBe('fran_1');
        });

        it('should map new CamelCase fields correctly', async () => {
            const newData = {
                plate: '5678DEF',
                brand: 'Honda',
                model: 'Forza',
                currentKm: 2000,
                nextRevisionKm: 6000,
                status: 'maintenance',
                franchiseId: 'fran_2'
            };

            const docs = [{ id: 'veh_2', data: newData }];
            (getDocs as any).mockResolvedValue(mockQuerySnapshot(docs));

            const vehicles = await fleetService.getVehicles('fran_2');
            const v = vehicles[0];

            expect(v.plate).toBe('5678DEF');
            expect(v.brand).toBe('Honda');
            expect(v.model).toBe('Forza');
            expect(v.currentKm).toBe(2000);
            expect(v.nextRevisionKm).toBe(6000);
            expect(v.status).toBe('maintenance');
            expect(v.franchiseId).toBe('fran_2');
        });
    });

    describe('updateVehicle Maintenance Logic', () => {
        it('should trigger maintenance status and notification when km limit reached', async () => {
            const currentData = {
                plate: '9999XYZ',
                currentKm: 4800,
                nextRevisionKm: 5000,
                status: 'active',
                franchiseId: 'fran_1'
            };

            (getDoc as any).mockResolvedValue(mockDocSnap('veh_1', currentData));

            const updates = { currentKm: 5001 };
            await fleetService.updateVehicle('veh_1', updates);

            expect(updateDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    currentKm: 5001,
                    status: 'maintenance'
                })
            );

            expect(notificationService.notifyFranchise).toHaveBeenCalledWith(
                'fran_1',
                expect.objectContaining({
                    type: 'ALERT',
                    priority: 'high'
                })
            );
        });
    });
});
