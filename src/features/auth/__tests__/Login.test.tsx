import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Login from '../Login';
import { MemoryRouter } from 'react-router-dom';

// Mocks
const mockNavigate = vi.fn();
const mockLogin = vi.fn();
const mockToast = { success: vi.fn(), error: vi.fn() };

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    setDoc: vi.fn(),
}));

vi.mock('firebase/app', () => ({
    FirebaseError: class extends Error { },
}));

vi.mock('lucide-react', () => ({
    Loader2: () => <div data-testid="loader" />,
    Eye: () => <div data-testid="eye" />,
    EyeOff: () => <div data-testid="eye-off" />,
    Warehouse: () => <div />,
    User: () => <div />,
    LayoutDashboard: () => <div />,
    ShieldCheck: () => <div />,
}));

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

vi.mock('../../../lib/firebase', () => ({
    db: {},
    auth: {},
}));

vi.mock('../../../lib/audit', () => ({
    logAction: vi.fn(),
    AUDIT_ACTIONS: { CREATE_USER: 'create_user' }
}));

// Mock OptimizedImage to avoid issues with Canvas/Image
vi.mock('../../../components/ui/media/OptimizedImage', () => ({
    OptimizedImage: ({ alt }: { alt: string }) => <img alt={alt} data-testid="optimized-image" />,
}));

// Mock assets
vi.mock('../../../assets/login-hero.png', () => ({ default: 'hero.png' }));
vi.mock('../../../assets/repaart-logo-full.png', () => ({ default: 'logo.png' }));
vi.mock('../../../assets/YamimotoCapa-1.png', () => ({ default: 'yamimoto.png' }));
vi.mock('../../../assets/flyder-logo-new-transparent.png', () => ({ default: 'flyder.png' }));

describe('Login Component', () => {
    it('renders login form by default', () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        expect(screen.getByRole('heading', { name: /te damos la bienvenida/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/nombre@empresa.com/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /acceder al portal/i })).toBeInTheDocument();
    });

    it('switches to signup mode', () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        const toggleButton = screen.getByText(/crear nueva cuenta/i);
        fireEvent.click(toggleButton);

        expect(screen.getByRole('heading', { name: /únete a repaart/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/ej. juan pérez/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeInTheDocument();
    });
});
