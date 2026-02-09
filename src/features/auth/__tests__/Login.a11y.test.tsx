import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';

expect.extend(toHaveNoViolations);

// Mocks
const mockNavigate = vi.fn();
const mockLogin = vi.fn();
const mockToast = { success: vi.fn(), error: vi.fn() };

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../../../context/AuthContext', () => ({
    useAuth: () => ({
        login: mockLogin,
    }),
}));

vi.mock('../../../hooks/useToast', () => ({
    useToast: () => ({
        toast: mockToast,
    }),
}));

// Mock OptimizedImage
vi.mock('../../../components/ui/media/OptimizedImage', () => ({
    OptimizedImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

// Mock assets
vi.mock('../../../assets/login-hero.png', () => ({ default: 'hero.png' }));
vi.mock('../../../assets/repaart-logo-full.png', () => ({ default: 'logo.png' }));
vi.mock('../../../assets/YamimotoCapa-1.png', () => ({ default: 'yamimoto.png' }));
vi.mock('../../../assets/flyder-logo-new-transparent.png', () => ({ default: 'flyder.png' }));

describe('Accessibility Checks', () => {
    it('Login page should have no accessibility violations', async () => {
        const { container } = render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        const results = await axe(container);
        if (results.violations.length > 0) {
            console.log('VIOLATIONS FOUND:', JSON.stringify(results.violations, null, 2));
        }
        expect(results).toHaveNoViolations();
    });
});
