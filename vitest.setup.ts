import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Firebase/Firestore in JSDOM
if (typeof global.TextEncoder === 'undefined') {
    (global as any).TextEncoder = TextEncoder;
    (global as any).TextDecoder = TextDecoder;
}

// Ensure jest global is available for legacy mocks if any
(global as any).jest = vi;
