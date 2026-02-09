import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import Login from '../features/auth/Login';

// Mocks
const mockNavigate = vi.fn();
const mockLogin = vi.fn();
const mockToast = { success: vi.fn(), error: vi.fn() };

vi.mock('../features/auth/Login', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../features/auth/Login')>();
    return actual;
});

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    setDoc: vi.fn(),
}));

vi.mock('firebase/app', () => ({
    FirebaseError: class extends Error { },
}));

vi.mock('../lib/firebase', () => ({
    db: {},
    auth: {},
    functions: {},
    storage: {}
}));

vi.mock('../lib/audit', () => ({
    logAction: vi.fn(),
    AUDIT_ACTIONS: { CREATE_USER: 'create_user' }
}));

vi.mock('../hooks/useToast', () => ({
    useToast: () => ({
        toast: mockToast,
    }),
}));

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        login: mockLogin,
    }),
}));

// Mock OptimizedImage
vi.mock('../components/ui/media/OptimizedImage', () => ({
    OptimizedImage: ({ alt }: { alt: string }) => <img alt={alt} data-testid="optimized-image" />,
}));

// Mock assets
vi.mock('../assets/login-hero.png', () => ({ default: 'hero.png' }));
vi.mock('../assets/repaart-logo-full.png', () => ({ default: 'logo.png' }));
vi.mock('../assets/YamimotoCapa-1.png', () => ({ default: 'yamimoto.png' }));
vi.mock('../assets/flyder-logo-new-transparent.png', () => ({ default: 'flyder.png' }));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('Accessibility Checks', () => {
    it('Login page should have no accessibility violations', async () => {
        const { container } = render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );
        const results = await axe(container);
        if (results.violations.length > 0) {
            console.log('A11y Violations:', JSON.stringify(results.violations, null, 2));
        }
        expect(results.violations).toEqual([]);
    });
});
