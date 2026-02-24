import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flyderApiService } from '../flyderApiService';
import { Timestamp } from 'firebase/firestore';

// Mock fetch global
global.fetch = vi.fn();

// Mock firebase/firestore
vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal();
  class MockTimestamp {
    seconds: number;
    nanoseconds: number;
    constructor(seconds: number, nanoseconds: number) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }
    static fromDate(date: Date) {
      return new MockTimestamp(Math.floor(date.getTime() / 1000), 0);
    }
    static now() {
      return new MockTimestamp(Math.floor(Date.now() / 1000), 0);
    }
  }
  return {
    ...actual as any,
    Timestamp: MockTimestamp
  };
});

describe('FlyderApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset token
    (flyderApiService as any).token = null;
    (flyderApiService as any).tokenExpiry = null;
  });

  describe('Authentication', () => {
    it('should authenticate successfully', async () => {
      const mockResponse = {
        token: 'test-token-123',
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        user: {
          id: 'user-1',
          email: 'test@flyder.app',
          role: 'admin'
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await flyderApiService.authenticate();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('should handle authentication failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const result = await flyderApiService.authenticate();

      expect(result).toBe(false);
    });
  });

  describe('API Requests', () => {
    beforeEach(async () => {
      // Setup auth
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          token: 'test-token',
          expires_at: new Date(Date.now() + 3600000).toISOString(),
          user: { id: '1', email: 'test@test.com', role: 'admin' }
        })
      });
      await flyderApiService.authenticate();
      vi.clearAllMocks();
    });

    it('should fetch shifts successfully', async () => {
      const mockShifts = [
        {
          id: 'shift-1',
          rider_id: 'rider-1',
          rider_name: 'Juan Pérez',
          franchise_id: 'franchise-1',
          start_at: '2026-01-15T08:00:00Z',
          end_at: '2026-01-15T16:00:00Z',
          status: 'completed',
          type: 'standard',
          moto_id: null,
          moto_plate: 'ABC123',
          created_at: '2026-01-14T10:00:00Z',
          updated_at: '2026-01-15T16:30:00Z'
        }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockShifts)
      });

      const shifts = await flyderApiService.getShifts('franchise-1', '2026-01-15', '2026-01-15');

      expect(shifts).toHaveLength(1);
      expect(shifts[0].id).toBe('shift-1');
      expect(shifts[0].rider_name).toBe('Juan Pérez');
    });

    it('should fetch orders successfully', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          rider_id: 'rider-1',
          franchise_id: 'franchise-1',
          distance: 5.2,
          status: 'finished',
          finished_at: '2026-01-15T12:00:00Z',
          amount: 15.50,
          created_at: '2026-01-15T11:30:00Z'
        }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOrders)
      });

      const orders = await flyderApiService.getOrders('franchise-1', '2026-01-15', '2026-01-15');

      expect(orders).toHaveLength(1);
      expect(orders[0].distance).toBe(5.2);
    });

    it('should retry on 401 error', async () => {
      // First request fails with 401
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      // Re-auth succeeds
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          token: 'new-token',
          expires_at: new Date(Date.now() + 3600000).toISOString(),
          user: { id: '1', email: 'test@test.com', role: 'admin' }
        })
      });

      // Second request succeeds
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      });

      const shifts = await flyderApiService.getShifts('franchise-1', '2026-01-15', '2026-01-15');

      expect(shifts).toEqual([]);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Sync Methods', () => {
    beforeEach(async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          token: 'test-token',
          expires_at: new Date(Date.now() + 3600000).toISOString(),
          user: { id: '1', email: 'test@test.com', role: 'admin' }
        })
      });
      await flyderApiService.authenticate();
      vi.clearAllMocks();
    });

    it('should sync shifts to Firestore format', async () => {
      const mockShifts = [
        {
          id: 'shift-1',
          rider_id: 'rider-1',
          rider_name: 'Juan Pérez',
          franchise_id: 'franchise-1',
          start_at: '2026-01-15T08:00:00Z',
          end_at: '2026-01-15T16:00:00Z',
          status: 'completed',
          type: 'standard',
          moto_id: null,
          moto_plate: 'ABC123',
          created_at: '2026-01-14T10:00:00Z',
          updated_at: '2026-01-15T16:30:00Z'
        }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockShifts)
      });

      const synced = await flyderApiService.syncShifts('franchise-1', '2026-01-15');

      expect(synced).toHaveLength(1);
      expect(synced[0].riderId).toBe('rider-1');
      expect(synced[0].source).toBe('flyder');
      expect(synced[0].startAt).toBeInstanceOf(Timestamp);
    });

    it('should sync orders to Firestore format', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          rider_id: 'rider-1',
          franchise_id: 'franchise-1',
          distance: 5.2,
          status: 'finished',
          finished_at: '2026-01-15T12:00:00Z',
          amount: 15.50,
          created_at: '2026-01-15T11:30:00Z'
        }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOrders)
      });

      const synced = await flyderApiService.syncOrders('franchise-1', '2026-01-15', '2026-01-15');

      expect(synced).toHaveLength(1);
      expect(synced[0].riderId).toBe('rider-1');
      expect(synced[0].distance).toBe(5.2);
    });
  });

  describe('Error Handling', () => {
    it('should retry on network errors', async () => {
      // Setup auth
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          token: 'test-token',
          expires_at: new Date(Date.now() + 3600000).toISOString(),
          user: { id: '1', email: 'test@test.com', role: 'admin' }
        })
      });
      await flyderApiService.authenticate();
      vi.clearAllMocks();

      // Fail twice, then succeed
      (global.fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([])
        });

      const shifts = await flyderApiService.getShifts('franchise-1', '2026-01-15', '2026-01-15');

      expect(shifts).toEqual([]);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      // Setup auth
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          token: 'test-token',
          expires_at: new Date(Date.now() + 3600000).toISOString(),
          user: { id: '1', email: 'test@test.com', role: 'admin' }
        })
      });
      await flyderApiService.authenticate();
      vi.clearAllMocks();

      // Always fail
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(
        flyderApiService.getShifts('franchise-1', '2026-01-15', '2026-01-15')
      ).rejects.toThrow();
    }, 10000);
  });
});
