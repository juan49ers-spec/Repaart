import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAdminResources } from './useAdminResources';
import { onSnapshot } from 'firebase/firestore';
import { resourceRequestService } from '../../../../services/resourceRequestService';

// Mock dependencias
vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    onSnapshot: vi.fn(),
    getFirestore: vi.fn(() => ({}))
}));

vi.mock('../../../../lib/firebase', () => ({
    db: {}
}));

vi.mock('../../../../services/resourceRequestService', () => ({
    resourceRequestService: {
        getPendingRequests: vi.fn()
    }
}));

describe('useAdminResources', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe inicializar con loading en true y estado vacío', async () => {
        vi.mocked(resourceRequestService.getPendingRequests).mockResolvedValue([]);
        vi.mocked(onSnapshot).mockImplementation(() => vi.fn());

        const { result } = renderHook(() => useAdminResources());
        
        expect(result.current.loading).toBe(true);
        expect(result.current.dbResources).toEqual([]);
        expect(result.current.pendingRequestsCount).toBe(0);
        expect(result.current.error).toBe(null);
    });

    it('debe actualizar los recursos cuando onSnapshot emite datos', async () => {
        vi.mocked(resourceRequestService.getPendingRequests).mockResolvedValue([]);
        
        const mockDocs = [
            { id: '1', data: () => ({ title: 'Test 1' }) }
        ];

        // @ts-expect-error: mock implementation of onSnapshot
        vi.mocked(onSnapshot).mockImplementation((_query: unknown, cb: (snapshot: unknown) => void) => {
            cb({ docs: mockDocs });
            return vi.fn();
        });

        const { result } = renderHook(() => useAdminResources());

        expect(result.current.loading).toBe(false);
        expect(result.current.dbResources).toHaveLength(1);
        expect(result.current.dbResources[0].id).toBe('1');
        expect(result.current.dbResources[0].title).toBe('Test 1');
    });

    it('debe aplicar la política de fallo seguro en error de onSnapshot', async () => {
        vi.mocked(resourceRequestService.getPendingRequests).mockResolvedValue([]);

        // @ts-expect-error: mock implementation of onSnapshot error callback
        vi.mocked(onSnapshot).mockImplementation((_query: unknown, _successCb: unknown, errorCb: (e: Error) => void) => {
            errorCb(new Error('Test error'));
            return vi.fn();
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const { result } = renderHook(() => useAdminResources());

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeTruthy();
        expect(result.current.dbResources).toEqual([]); 

        consoleSpy.mockRestore();
    });
});
