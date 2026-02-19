import { describe, it, expect, vi, beforeEach } from 'vitest';
import { financeService } from './financeService';

vi.mock('../lib/firebase', () => ({
    db: {}
}));

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual,
        doc: vi.fn(() => ({ id: 'mock-doc-id' })),
        getDoc: vi.fn(),
        setDoc: vi.fn(),
        serverTimestamp: () => 'MOCK_TIMESTAMP'
    };
});

import { getDoc, setDoc } from 'firebase/firestore';

describe('FinanceService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not zero totals on partial update', async () => {
        (getDoc as any).mockResolvedValue({
            exists: () => true,
            data: () => ({
                totalIncome: 1000,
                totalExpenses: 200,
                status: 'draft',
                isLocked: false
            })
        });

        await financeService.updateFinancialData('F1', '2026-01', { marketing: 10 });

        expect(setDoc).toHaveBeenCalledTimes(1);

        const payload = (setDoc as any).mock.calls[0][1];
        expect(payload.totalIncome).toBe(1000);
        expect(payload.totalExpenses).toBe(200);
        expect(payload.revenue).toBe(1000);
        expect(payload.expenses).toBe(200);
        expect(payload.profit).toBe(800);
        expect(payload.status).toBe('draft');
        expect(payload.breakdown).toBeUndefined();
    });

    it('should set isLocked false when status is open', async () => {
        (getDoc as any).mockResolvedValue({
            exists: () => true,
            data: () => ({
                totalIncome: 1000,
                totalExpenses: 200,
                status: 'locked',
                isLocked: true
            })
        });

        await financeService.updateFinancialData('F1', '2026-01', { status: 'open' });
        const payload = (setDoc as any).mock.calls[0][1];
        expect(payload.status).toBe('open');
        expect(payload.isLocked).toBe(false);
        expect(payload.is_locked).toBe(false);
    });
});

