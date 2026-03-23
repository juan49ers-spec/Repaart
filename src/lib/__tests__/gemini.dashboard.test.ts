import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.stubEnv('VITE_GOOGLE_AI_KEY', 'test-key-123');

import { generateDashboardAlert } from '../gemini';

const mockContext = {
  financial: { revenue: 10000, expenses: 7000, profit: 3000, margin: 30, orders: 150, month: '2026-03' },
  shifts: { totalThisWeek: 20, uncoveredSlots: 2, nextWeekCoverage: 85 },
  riders: { active: 5, inactive: 1 },
};

describe('generateDashboardAlert', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('returns a DashboardAlert when API responds with valid JSON', async () => {
    const mockAlert = { type: 'positive', title: '¡Buen margen este mes!', message: 'Tu margen está al 30%, muy por encima de lo normal.' };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockAlert) }] } }]
      })
    });

    const result = await generateDashboardAlert(mockContext);
    expect(result).toEqual(mockAlert);
  });

  it('returns null when API key is missing', async () => {
    vi.stubEnv('VITE_GOOGLE_AI_KEY', '');
    const result = await generateDashboardAlert(mockContext);
    expect(result).toBeNull();
  });

  it('returns null on network error (silent fail)', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
    const result = await generateDashboardAlert(mockContext);
    expect(result).toBeNull();
  });

  it('falls back to second model if first fails', async () => {
    const mockAlert = { type: 'warning', title: 'Turnos sin cubrir', message: 'Tienes 2 huecos esta semana.' };
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify(mockAlert) }] } }]
        })
      });

    const result = await generateDashboardAlert(mockContext);
    expect(result).toEqual(mockAlert);
  });
});
