/**
 * Vitest Setup File
 * 
 * Global mocks and configurations for testing
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { TextEncoder, TextDecoder } from 'util';


// Mock lucide-react icons — use importOriginal so named exports remain available;
// tests that need specific SVG rendering can override individual icons locally.
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return { ...actual };
});

// Polyfills for Firebase/Firestore in JSDOM
if (typeof global.TextEncoder === 'undefined') {
  (global as unknown as Record<string, unknown>).TextEncoder = TextEncoder;
  (global as unknown as Record<string, unknown>).TextDecoder = TextDecoder;
}

// Ensure jest global is available for legacy mocks if any
(global as unknown as Record<string, unknown>).jest = vi;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() { }
  disconnect() { }
  observe() { }
  takeRecords() {
    return [];
  }
  unobserve() { }
} as unknown as typeof IntersectionObserver;

// Mock Firebase app
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({
    firestore: () => ({}),
    auth: () => ({})
  })),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({
    firestore: () => ({}),
    auth: () => ({})
  }))
}));

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => {
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
    toDate() {
      return new Date(this.seconds * 1000 + this.nanoseconds / 1000000);
    }
    toMillis() {
      return this.seconds * 1000 + this.nanoseconds / 1000000;
    }
    isEqual(other: MockTimestamp) {
      return this.seconds === other.seconds && this.nanoseconds === other.nanoseconds;
    }
    valueOf() {
      return this.toMillis().toString();
    }
  }

  const mockSnapshot = {
    docs: [],
    empty: true,
    size: 0,
    forEach: vi.fn(),
    map: vi.fn(() => []),
  };

  const mockDocSnapshot = {
    exists: vi.fn(() => false),
    data: vi.fn(() => ({})),
    id: 'mock-id',
  };

  return {
    initializeFirestore: vi.fn(() => ({})),
    getDoc: vi.fn(() => Promise.resolve(mockDocSnapshot)),
    getDocs: vi.fn(() => Promise.resolve(mockSnapshot)),
    doc: vi.fn(() => ({ id: 'mock-id' })),
    collection: vi.fn(() => ({ id: 'mock-collection' })),
    query: vi.fn(() => ({})),
    where: vi.fn(() => ({})),
    orderBy: vi.fn(() => ({})),
    limit: vi.fn(() => ({})),
    addDoc: vi.fn(() => Promise.resolve({ id: 'new-doc-id' })),
    setDoc: vi.fn(() => Promise.resolve()),
    updateDoc: vi.fn(() => Promise.resolve()),
    deleteDoc: vi.fn(() => Promise.resolve()),
    runTransaction: vi.fn(),
    serverTimestamp: vi.fn(() => new Date()),
    increment: vi.fn((n: number) => n),
    arrayUnion: vi.fn((...args: unknown[]) => args),
    arrayRemove: vi.fn((...args: unknown[]) => args),
    disableNetwork: vi.fn(),
    persistentLocalCache: vi.fn(() => ({})),
    persistentMultipleTabManager: vi.fn(() => ({})),
    onSnapshot: vi.fn((q, cb) => {
      if (typeof cb === 'function') {
        cb(mockSnapshot);
      }
      return vi.fn(); // Unsubscribe
    }),
    Timestamp: MockTimestamp,
    writeBatch: vi.fn(() => ({
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn(() => Promise.resolve())
    }))
  };
});

// Mock Firebase Storage
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(() => ({})),
  uploadBytes: vi.fn(() => Promise.resolve({})),
  getDownloadURL: vi.fn(() => Promise.resolve('https://example.com/mock-url')),
  deleteObject: vi.fn(() => Promise.resolve())
}));

// Mock Firebase Functions
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn(() => vi.fn(() => Promise.resolve({ data: { success: true, data: { id: 'mock-id' } } })))
}));

// Mock Firebase auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null,
    onAuthStateChanged: vi.fn(),
    signOut: vi.fn(() => Promise.resolve())
  })),
  signInWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: { uid: 'mock-uid' } })),
  signOut: vi.fn(() => Promise.resolve()),
  onAuthStateChanged: vi.fn(),
  sendPasswordResetEmail: vi.fn(() => Promise.resolve())
}));

// Mock Ant Design message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      loading: vi.fn()
    }
  };
});

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    loading: vi.fn()
  }
}));
