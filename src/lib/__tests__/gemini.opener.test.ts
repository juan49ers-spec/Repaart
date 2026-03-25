import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockRunner = vi.fn();
vi.mock('firebase/functions', () => ({
  httpsCallable: () => mockRunner,
}));
vi.mock('../firebase', () => ({ functions: {} }));

import { generateAdvisorOpener } from '../gemini';
import type { DashboardAlertContext } from '../gemini';

const mockFinancial: DashboardAlertContext['financial'] = {
  revenue: 12000,
  expenses: 8000,
  profit: 4000,
  margin: 33,
  orders: 180,
  month: '2026-03',
};

describe('generateAdvisorOpener', () => {
  beforeEach(() => {
    mockRunner.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a string when proxy responds with text', async () => {
    mockRunner.mockResolvedValueOnce({
      data: {
        candidates: [{ content: { parts: [{ text: 'Tu margen está al 33%. ¿Lo analizamos?' }] } }]
      }
    });
    const result = await generateAdvisorOpener(mockFinancial);
    expect(result).toBe('Tu margen está al 33%. ¿Lo analizamos?');
  });

  it('returns null on proxy error (silent fail)', async () => {
    mockRunner.mockRejectedValueOnce(new Error('timeout'));
    const result = await generateAdvisorOpener(mockFinancial);
    expect(result).toBeNull();
  });

  it('falls back to second model if first fails', async () => {
    mockRunner
      .mockRejectedValueOnce({ code: 'internal', message: 'Gemini request failed: 503' })
      .mockResolvedValueOnce({
        data: {
          candidates: [{ content: { parts: [{ text: 'Buen mes. ¿Revisamos?' }] } }]
        }
      });
    const result = await generateAdvisorOpener(mockFinancial);
    expect(result).toBe('Buen mes. ¿Revisamos?');
  });
});
