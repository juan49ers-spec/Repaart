/**
 * Vitest Setup File
 * 
 * Global mocks and configurations for testing
 */

import '@testing-library/jest-dom';
import { vi, expect } from 'vitest';
import { TextEncoder, TextDecoder } from 'util';
import React from 'react';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Loader2: () => null,
  Eye: () => null,
  EyeOff: () => null,
  default: new Proxy({}, {
    get: () => () => null
  })
}));

// Polyfills for Firebase/Firestore in JSDOM
if (typeof global.TextEncoder === 'undefined') {
  (global as any).TextEncoder = TextEncoder;
  (global as any).TextDecoder = TextDecoder;
}

// Ensure jest global is available for legacy mocks if any
(global as any).jest = vi;

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
} as any;

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => {
  const mockDoc = vi.fn();
  const mockCollection = vi.fn();
  const mockQuery = vi.fn();

  const mockFirestore = {
    collection: mockCollection,
    doc: mockDoc,
    query: mockQuery,
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    runTransaction: vi.fn(),
    serverTimestamp: vi.fn(() => new Date()),
    increment: vi.fn((amount: number) => amount),
    arrayUnion: vi.fn((elements: any[]) => elements),
    arrayRemove: vi.fn((elements: any[]) => elements),
    writeBatch: vi.fn(() => ({
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn()
    }))
  };

  return {
    getFirestore: vi.fn(() => mockFirestore),
    collection: mockCollection,
    doc: mockDoc,
    query: mockQuery,
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    runTransaction: vi.fn(),
    serverTimestamp: vi.fn(() => new Date()),
    increment: vi.fn((amount: number) => amount),
    arrayUnion: vi.fn((elements: any[]) => elements),
    arrayRemove: vi.fn((elements: any[]) => elements),
    writeBatch: vi.fn(() => ({
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn()
    }))
  };
});

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

  return {
    getFirestore: vi.fn(() => ({})),
    initializeFirestore: vi.fn(() => ({})),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    doc: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    addDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    runTransaction: vi.fn(),
    serverTimestamp: vi.fn(() => new Date()),
    increment: vi.fn((n: number) => n),
    enableNetwork: vi.fn(),
    disableNetwork: vi.fn(),
    persistentLocalCache: vi.fn(() => ({})),
    persistentMultipleTabManager: vi.fn(() => ({})),
    Timestamp: MockTimestamp
  };
});

// Mock Firebase Storage
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({}))
}));

// Mock Firebase Functions
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn(() => vi.fn())
}));

// Mock Firebase auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null,
    onAuthStateChanged: vi.fn()
  })),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn()
}));

// Mock the project's firebase.ts
vi.mock('../src/lib/firebase', () => ({
  db: {},
  app: {},
  auth: {},
  functions: {},
  enableOfflineMode: vi.fn(),
  enableOnlineMode: vi.fn(),
  isFirestoreEnabled: vi.fn(() => true)
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
