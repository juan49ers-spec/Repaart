import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../features/auth/Login';

// Mocks
const mockNavigate = vi.fn();
const mockLogin = vi.fn();
const mockToast = { success: vi.fn(), error: vi.fn() };

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ login: mockLogin }) }));
vi.mock('../hooks/useToast', () => ({ useToast: () => ({ toast: mockToast }) }));
vi.mock('../lib/firebase', () => ({ db: {} }));
vi.mock('../lib/audit', () => ({ logAction: vi.fn(), AUDIT_ACTIONS: { CREATE_USER: 'create_user' } }));
vi.mock('../components/ui/media/OptimizedImage', () => ({ OptimizedImage: ({ alt }: { alt: string }) => <img alt={alt} /> }));
vi.mock('../assets/login-hero.png', () => ({ default: 'hero.png' }));
vi.mock('../assets/repaart-logo-full.png', () => ({ default: 'logo.png' }));
vi.mock('../assets/YamimotoCapa-1.png', () => ({ default: 'yamimoto.png' }));
vi.mock('../assets/flyder-logo-new-transparent.png', () => ({ default: 'flyder.png' }));

describe('Login Render Debug', () => {
    it('renders without crashing', () => {
        console.log('STARTING RENDER');
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );
        console.log('RENDER COMPLETE');
        expect(true).toBe(true);
    });
});
