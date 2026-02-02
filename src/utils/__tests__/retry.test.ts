import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '../retry';

describe('withRetry', () => {
  it('should return success on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Attempt 1'))
      .mockRejectedValueOnce(new Error('Attempt 2'))
      .mockResolvedValue('success');
    
    const result = await withRetry(fn, { maxAttempts: 3 });
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Always fails'));
    
    await expect(
      withRetry(fn, { maxAttempts: 2 })
    ).rejects.toThrow('Always fails');
    
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should use exponential backoff', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Attempt 1'))
      .mockRejectedValueOnce(new Error('Attempt 2'))
      .mockResolvedValue('success');
    
    const start = Date.now();
    await withRetry(fn, { 
      maxAttempts: 3, 
      baseDelay: 100 
    });
    const duration = Date.now() - start;
    
    // Should wait at least 100ms + 200ms = 300ms
    expect(duration).toBeGreaterThanOrEqual(250);
  });

  it('should not retry on non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Fatal error'));
    
    await expect(
      withRetry(fn, { 
        maxAttempts: 3,
        shouldRetry: (error) => !error.message.includes('Fatal')
      })
    ).rejects.toThrow('Fatal error');
    
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
