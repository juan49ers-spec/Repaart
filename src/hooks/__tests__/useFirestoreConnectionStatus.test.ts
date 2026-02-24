import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFirestoreConnectionStatus } from '../useFirestoreConnectionStatus';
import { onSnapshotsInSync } from 'firebase/firestore';

// Mock Firebase completo
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    onSnapshotsInSync: vi.fn(),
  };
});

vi.mock('../../lib/firebase', () => ({
  db: {},
}));

vi.mock('../../services/errorLogger', () => ({
  logMessage: vi.fn(),
}));

describe('useFirestoreConnectionStatus', () => {
  const mockUnsubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (onSnapshotsInSync as any).mockReturnValue(mockUnsubscribe);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with navigator.onLine status', () => {
    const originalOnLine = Object.getOwnPropertyDescriptor(Navigator.prototype, 'onLine');
    Object.defineProperty(Navigator.prototype, 'onLine', {
      writable: true,
      value: true,
    });

    const { result } = renderHook(() => useFirestoreConnectionStatus());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.status).toBe('online');

    if (originalOnLine) {
      Object.defineProperty(Navigator.prototype, 'onLine', originalOnLine);
    }
  });

  it('should listen to Firestore sync events', () => {
    renderHook(() => useFirestoreConnectionStatus());

    expect(onSnapshotsInSync).toHaveBeenCalled();
    expect(onSnapshotsInSync).toHaveBeenCalledWith(expect.anything(), expect.any(Function));
  });

  it('should handle online event', async () => {
    const { result } = renderHook(() => useFirestoreConnectionStatus());

    // Simulate offline initially
    Object.defineProperty(Navigator.prototype, 'onLine', {
      writable: true,
      value: false,
    });

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false);
    });

    // Simulate online
    Object.defineProperty(Navigator.prototype, 'onLine', {
      writable: true,
      value: true,
    });

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
    });
  });

  it('should cleanup subscriptions on unmount', () => {
    const { unmount } = renderHook(() => useFirestoreConnectionStatus());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should return correct status object', () => {
    const { result } = renderHook(() => useFirestoreConnectionStatus());

    expect(result.current).toHaveProperty('isOnline');
    expect(result.current).toHaveProperty('isSyncing');
    expect(result.current).toHaveProperty('status');
    expect(['online', 'offline']).toContain(result.current.status);
  });
});
