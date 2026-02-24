import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
}));

// Mock firestore so we can spy on initializeFirestore
vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(() => ({})),
  persistentLocalCache: vi.fn((opts) => opts),
  persistentMultipleTabManager: vi.fn(() => 'tab-manager'),
  disableNetwork: vi.fn(),
  enableNetwork: vi.fn()
}));

describe('Firebase Offline Persistence', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should initialize Firestore with offline persistence', async () => {
    const firestoreMock = await import('firebase/firestore');
    const { app } = await import('../firebase');

    expect(firestoreMock.initializeFirestore).toHaveBeenCalledWith(app, expect.objectContaining({
      localCache: expect.objectContaining({
        tabManager: 'tab-manager',
        cacheSizeBytes: 50 * 1024 * 1024 // 50MB
      })
    }));
  });

  it('should have Firestore instance exported', async () => {
    const { db } = await import('../firebase');
    expect(db).toBeDefined();
  });

  it('should export cache size configuration', async () => {
    const { FIRESTORE_CACHE_SIZE } = await import('../firebase');
    expect(FIRESTORE_CACHE_SIZE).toBe(50 * 1024 * 1024);
  });
});
