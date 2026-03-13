import { describe, it, expect, vi } from 'vitest';
import { calculateStorageStats, calculateFolderCounts, filterAndSortResources } from './resource.selectors';
import { ResourceItem } from './resource.types';
import { MAX_STORAGE_BYTES } from './resource.constants';

vi.mock('lucide-react', () => ({
    ShieldCheck: () => null,
    BookOpen: () => null,
    Briefcase: () => null,
    Layout: () => null,
    Folder: () => null,
}));

describe('Resource Selectors', () => {
    const mockResources: ResourceItem[] = [
        { id: '1', size: 1024, category: 'contracts', title: 'Contrato A', isPinned: true },
        { id: '2', size: 2048, category: 'contracts', title: 'Contrato B' },
        { id: '3', size: 500, category: 'marketing', title: 'Logo' },
    ];

    describe('calculateStorageStats', () => {
        it('debe calcular el almacenamiento correctamente', () => {
            const stats = calculateStorageStats(mockResources);
            expect(stats.totalBytes).toBe(3572);
            expect(stats.maxBytes).toBe(MAX_STORAGE_BYTES);
            expect(stats.percentage).toBeCloseTo((3572 / MAX_STORAGE_BYTES) * 100);
            expect(stats.formatted).toBe('3.5 KB');
        });
    });

    describe('calculateFolderCounts', () => {
        it('debe contar los recursos en cada carpeta', () => {
            const counts = calculateFolderCounts(mockResources);
            expect(counts['contracts']).toBe(2);
            expect(counts['marketing']).toBe(1);
            expect(counts['manuals']).toBe(0);
        });
    });

    describe('filterAndSortResources', () => {
        it('debe filtrar por categoría', () => {
            const filtered = filterAndSortResources(mockResources, 'contracts', '', 'newest');
            expect(filtered.length).toBe(2);
        });

        it('debe realizar búsqueda insensible a mayúsculas', () => {
            const filtered = filterAndSortResources(mockResources, '', 'loGo', 'newest');
            expect(filtered.length).toBe(1);
            expect(filtered[0].title).toBe('Logo');
        });

        it('debe priorizar elementos fijados (isPinned)', () => {
            const sorted = filterAndSortResources(mockResources, '', '', 'newest');
            expect(sorted[0].id).toBe('1');
        });

        it('debe ordenar por tamaño descendente', () => {
            const sorted = filterAndSortResources(mockResources, '', '', 'size_desc');
            expect(sorted[0].id).toBe('1'); // Pinned
            expect(sorted[1].id).toBe('2');
            expect(sorted[2].id).toBe('3');
        });
    });
});
