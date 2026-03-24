import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.stubEnv('VITE_GOOGLE_AI_KEY', 'test-key-123');

import { analyzeExpenseAmount } from '../gemini';

describe('analyzeExpenseAmount', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('returns a result when amount is >20% above avg', async () => {
    const mockResult = { message: 'Este gasto en combustible es un 35% más alto.', level: 'high' as const };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockResult) }] } }]
      })
    });
    const result = await analyzeExpenseAmount('fuel', 270, 200);
    expect(result).toEqual(mockResult);
  });

  it('returns null when historicalAvg is 0', async () => {
    const result = await analyzeExpenseAmount('fuel', 270, 0);
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns null when amount is not above threshold', async () => {
    const result = await analyzeExpenseAmount('fuel', 210, 200);
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns null on API error (silent fail)', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('error'));
    const result = await analyzeExpenseAmount('fuel', 400, 200);
    expect(result).toBeNull();
  });

  it('falls back to second model if first fails', async () => {
    const mockResult = { message: 'Este gasto en combustible es un 35% más alto.', level: 'high' as const };
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify(mockResult) }] } }]
        })
      });
    const result = await analyzeExpenseAmount('fuel', 400, 200);
    expect(result).toEqual(mockResult);
  });

  it('returns null when API key is missing', async () => {
    vi.stubEnv('VITE_GOOGLE_AI_KEY', '');
    const result = await analyzeExpenseAmount('fuel', 400, 200);
    expect(result).toBeNull();
  });
});
