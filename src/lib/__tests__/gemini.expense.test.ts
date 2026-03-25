import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockRunner = vi.fn();
vi.mock('firebase/functions', () => ({
  httpsCallable: () => mockRunner,
}));
vi.mock('../firebase', () => ({ functions: {} }));

import { analyzeExpenseAmount } from '../gemini';

describe('analyzeExpenseAmount', () => {
  beforeEach(() => {
    mockRunner.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a result when amount is >20% above avg', async () => {
    const mockResult = { message: 'Este gasto en combustible es un 35% más alto.', level: 'high' as const };
    mockRunner.mockResolvedValueOnce({
      data: {
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockResult) }] } }]
      }
    });
    const result = await analyzeExpenseAmount('fuel', 270, 200);
    expect(result).toEqual(mockResult);
  });

  it('returns null when historicalAvg is 0', async () => {
    const result = await analyzeExpenseAmount('fuel', 270, 0);
    expect(result).toBeNull();
    expect(mockRunner).not.toHaveBeenCalled();
  });

  it('returns null when amount is not above threshold', async () => {
    const result = await analyzeExpenseAmount('fuel', 210, 200);
    expect(result).toBeNull();
    expect(mockRunner).not.toHaveBeenCalled();
  });

  it('returns null on proxy error (silent fail)', async () => {
    mockRunner.mockRejectedValueOnce(new Error('error'));
    const result = await analyzeExpenseAmount('fuel', 400, 200);
    expect(result).toBeNull();
  });

  it('falls back to second model if first fails', async () => {
    const mockResult = { message: 'Este gasto en combustible es un 35% más alto.', level: 'very_high' as const };
    mockRunner
      .mockRejectedValueOnce({ code: 'internal', message: 'Gemini request failed: 503' })
      .mockResolvedValueOnce({
        data: {
          candidates: [{ content: { parts: [{ text: JSON.stringify(mockResult) }] } }]
        }
      });
    const result = await analyzeExpenseAmount('fuel', 400, 200);
    expect(result).toEqual(mockResult);
  });
});
