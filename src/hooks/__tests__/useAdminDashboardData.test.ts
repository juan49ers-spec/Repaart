import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { ReactNode } from 'react';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../lib/firebase', () => ({ db: {} }));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(() => 'mock-collection'),
    query: vi.fn(() => 'mock-query'),
    where: vi.fn(() => 'mock-where'),
    getDocs: vi.fn(),
}));

vi.mock('../../services/franchiseService', () => ({
    franchiseService: {
        getAllFranchises: vi.fn(),
    },
}));

vi.mock('../../services/financeService', () => ({
    financeService: {
        getFinancialTrend: vi.fn(),
    },
}));

// ── Imports after mocks ───────────────────────────────────────────────────────

import { getDocs } from 'firebase/firestore';
import { franchiseService } from '../../services/franchiseService';
import { financeService } from '../../services/financeService';
import { useAdminDashboardData } from '../useAdminDashboardData';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    const Wrapper = ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children);
    Wrapper.displayName = 'QueryClientWrapper';
    return Wrapper;
}

const MOCK_FRANCHISES = [
    { id: 'F-0001', name: 'Repaart Madrid', status: 'active' },
    { id: 'F-0002', name: 'Repaart Valencia', status: 'inactive' },
];

const MOCK_TREND = [
    { month: '2026-01', income: 8000, expenses: 3000 },
    { month: '2026-02', income: 9000, expenses: 3500 },
    { month: '2026-03', income: 10000, expenses: 4000 },
];

const MOCK_SUMMARIES = [
    { franchiseId: 'F-0001', month: '2026-03', totalIncome: 10000 },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useAdminDashboardData', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        (franchiseService.getAllFranchises as any).mockResolvedValue({
            success: true,
            data: MOCK_FRANCHISES,
        });

        (financeService.getFinancialTrend as any).mockResolvedValue(MOCK_TREND);

        (getDocs as any).mockResolvedValue({
            forEach: (cb: (doc: any) => void) =>
                MOCK_SUMMARIES.forEach(s =>
                    cb({ data: () => s })
                ),
        });
    });

    it('starts in loading state', () => {
        const { result } = renderHook(
            () => useAdminDashboardData('2026-03'),
            { wrapper: makeWrapper() }
        );
        expect(result.current.loading).toBe(true);
    });

    it('loads franchises and stats for the selected month', async () => {
        const { result } = renderHook(
            () => useAdminDashboardData('2026-03'),
            { wrapper: makeWrapper() }
        );

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.franchises).toHaveLength(2);
        expect(result.current.stats.totalRevenue).toBe(10000);
        expect(result.current.stats.totalProfit).toBe(6000);
        expect(result.current.stats.margin).toBeCloseTo(60, 0);
    });

    it('counts only active franchises', async () => {
        const { result } = renderHook(
            () => useAdminDashboardData('2026-03'),
            { wrapper: makeWrapper() }
        );

        await waitFor(() => expect(result.current.loading).toBe(false));

        // F-0001 is active, F-0002 is inactive
        expect(result.current.stats.franchiseCount).toBe(1);
    });

    it('maps trend data income → revenue for chart compatibility', async () => {
        const { result } = renderHook(
            () => useAdminDashboardData('2026-03'),
            { wrapper: makeWrapper() }
        );

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.trendData[0]).toHaveProperty('revenue', 8000);
    });

    it('exposes a refresh function', async () => {
        const { result } = renderHook(
            () => useAdminDashboardData('2026-03'),
            { wrapper: makeWrapper() }
        );

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(typeof result.current.refresh).toBe('function');
    });

    it('surfaces errors when fetch fails', async () => {
        (franchiseService.getAllFranchises as any).mockRejectedValue(
            new Error('Firestore unavailable')
        );

        const { result } = renderHook(
            () => useAdminDashboardData('2026-03'),
            { wrapper: makeWrapper() }
        );

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toMatch(/Firestore unavailable/i);
    });
});
