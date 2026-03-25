import { describe, it, expect, vi, afterEach } from 'vitest';

// generateDashboardAlert fue deprecada (stub => null) tras la migración
// al multiplexer getDashboardAIBundle. Estos tests verifican que
// el stub no rompe componentes que aún la referencian.

const mockRunner = vi.fn();
vi.mock('firebase/functions', () => ({
  httpsCallable: () => mockRunner,
}));
vi.mock('../firebase', () => ({ functions: {} }));

import { generateDashboardAlert } from '../gemini';

const mockContext = {
  financial: { revenue: 10000, expenses: 7000, profit: 3000, margin: 30, orders: 150, month: '2026-03' },
  shifts: { totalThisWeek: 20, uncoveredSlots: 2, nextWeekCoverage: 85 },
  riders: { active: 5, inactive: 1 },
};

describe('generateDashboardAlert (deprecated stub)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('always returns null (function is a deprecated stub)', async () => {
    const result = await generateDashboardAlert(mockContext);
    expect(result).toBeNull();
  });

  it('never calls the proxy (no network requests)', async () => {
    await generateDashboardAlert(mockContext);
    expect(mockRunner).not.toHaveBeenCalled();
  });
});
