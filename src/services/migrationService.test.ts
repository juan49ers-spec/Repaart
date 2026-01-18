import { describe, it, expect, vi, beforeEach } from 'vitest';
import { migrationService } from './migrationService';
import { getDocs, writeBatch } from 'firebase/firestore';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    collection: vi.fn((_db, path) => ({ path, id: path })),
    doc: vi.fn((_db, _coll, id) => ({ id, type: 'doc_ref' })),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    writeBatch: vi.fn(() => ({
        update: vi.fn(),
        commit: vi.fn()
    })),
    deleteField: vi.fn(() => 'DELETE_FIELD'),
    query: vi.fn((coll) => coll),
    where: vi.fn(),
    serverTimestamp: vi.fn()
}));

vi.mock('../lib/firebase', () => ({
    db: {}
}));

const mockDocSnap = (id: string, data: any) => ({
    id,
    ref: { id, type: 'doc_ref' },
    data: () => data
});

const mockQuerySnapshot = (docs: any[]) => {
    const docSnaps = docs.map(d => mockDocSnap(d.id, d.data));
    return {
        docs: docSnaps,
        forEach: (cb: any) => docSnaps.forEach(cb),
        size: docSnaps.length,
        empty: docSnaps.length === 0
    };
};

describe('MigrationService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('migrateFleetLegacyFields', () => {
        it('should correctly stage updates in dryRun mode', async () => {
            const legacyAssets = [
                { id: 'v1', data: { matricula: 'A1', estado: 'activo' } },
                { id: 'v2', data: { plate: 'B2', status: 'active' } }
            ];

            (getDocs as any).mockResolvedValue(mockQuerySnapshot(legacyAssets));

            const result = await migrationService.migrateFleetLegacyFields(true);

            expect(result.success).toBe(true);
            expect(result.count).toBe(1);
            expect(writeBatch).toHaveBeenCalled();
            const mockBatch = vi.mocked(writeBatch).mock.results[0].value;
            expect(mockBatch.update).not.toHaveBeenCalled();
        });

        it('should commit updates when dryRun is false', async () => {
            const legacyAssets = [
                { id: 'v1', data: { matricula: 'A1', estado: 'activo' } }
            ];

            (getDocs as any).mockResolvedValue(mockQuerySnapshot(legacyAssets));

            const result = await migrationService.migrateFleetLegacyFields(false);

            expect(result.success).toBe(true);
            const mockBatch = vi.mocked(writeBatch).mock.results[0].value;
            expect(mockBatch.update).toBeCalled();
            expect(mockBatch.commit).toHaveBeenCalled();
        });
    });

    describe('migrateFinanceLegacyFields', () => {
        it('should migrate records and summaries', async () => {
            const legacyRecords = [{ id: 'r1', data: { franchise_id: 'f1' } }];
            const legacySummaries = [{ id: 's1', data: { franchise_id: 'f1' } }];

            (getDocs as any).mockImplementation((coll: any) => {
                if (coll.path === 'financial_records') return Promise.resolve(mockQuerySnapshot(legacyRecords));
                if (coll.path === 'financial_summaries') return Promise.resolve(mockQuerySnapshot(legacySummaries));
                return Promise.resolve(mockQuerySnapshot([]));
            });

            const result = await migrationService.migrateFinanceLegacyFields(false);

            expect(result.success).toBe(true);
            expect(result.count).toBe(2);
            const mockBatch = vi.mocked(writeBatch).mock.results[0].value;
            expect(mockBatch.commit).toHaveBeenCalled();
        });
    });
});
