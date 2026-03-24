import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
    vi.stubEnv('VITE_GOOGLE_AI_KEY', 'test-key-123');
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('returns a string when API responds with text', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Tu margen está al 33%. ¿Lo analizamos?' }] } }]
      })
    });
    const result = await generateAdvisorOpener(mockFinancial);
    expect(result).toBe('Tu margen está al 33%. ¿Lo analizamos?');
  });

  it('returns null when API key is missing', async () => {
    vi.stubEnv('VITE_GOOGLE_AI_KEY', '');
    const result = await generateAdvisorOpener(mockFinancial);
    expect(result).toBeNull();
  });

  it('returns null on network error (silent fail)', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('timeout'));
    const result = await generateAdvisorOpener(mockFinancial);
    expect(result).toBeNull();
  });

  it('falls back to second model if first fails', async () => {
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Buen mes. ¿Revisamos?' }] } }]
        })
      });
    const result = await generateAdvisorOpener(mockFinancial);
    expect(result).toBe('Buen mes. ¿Revisamos?');
  });
});
