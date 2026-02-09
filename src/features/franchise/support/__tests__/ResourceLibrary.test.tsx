import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResourceLibrary, { CATEGORIES } from '../ResourceLibrary';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    BookOpen: (props: Record<string, unknown>) => <div data-testid="book-icon" {...props} />,
    Package: (props: Record<string, unknown>) => <div data-testid="package-icon" {...props} />,
    DollarSign: (props: Record<string, unknown>) => <div data-testid="dollar-icon" {...props} />,
    Wrench: (props: Record<string, unknown>) => <div data-testid="wrench-icon" {...props} />,
    AlertTriangle: (props: Record<string, unknown>) => <div data-testid="alert-icon" {...props} />,
    ArrowRight: (props: Record<string, unknown>) => <div data-testid="arrow-icon" {...props} />,
}));

describe('ResourceLibrary Component', () => {
    describe('Header Rendering', () => {
        it('should render the main title', () => {
            render(<ResourceLibrary />);
            expect(screen.getByText('Centro de Recursos')).toBeInTheDocument();
        });

        it('should render the subtitle', () => {
            render(<ResourceLibrary />);
            expect(screen.getByText('Documentación y manuales para el éxito')).toBeInTheDocument();
        });

        it('should render the book icon', () => {
            render(<ResourceLibrary />);
            expect(screen.getByTestId('book-icon')).toBeInTheDocument();
        });
    });

    describe('Category Cards', () => {
        it('should render all 4 category cards', () => {
            render(<ResourceLibrary />);
            expect(screen.getByText('Operativa')).toBeInTheDocument();
            expect(screen.getByText('Finanzas')).toBeInTheDocument();
            expect(screen.getByText('Técnico')).toBeInTheDocument();
            expect(screen.getByText('Accidente')).toBeInTheDocument();
        });

        it('should render category descriptions', () => {
            render(<ResourceLibrary />);
            expect(screen.getByText('Logística, riders, rutas')).toBeInTheDocument();
            expect(screen.getByText('Facturas, pagos, impuestos')).toBeInTheDocument();
            expect(screen.getByText('Motos, mantenimiento, app')).toBeInTheDocument();
            expect(screen.getByText('Siniestros, seguros')).toBeInTheDocument();
        });

        it('should render "Ver Herramientas" text for each card', () => {
            render(<ResourceLibrary />);
            const toolsLinks = screen.getAllByText('Ver Herramientas');
            expect(toolsLinks).toHaveLength(4);
        });

        it('should render arrow icons for navigation', () => {
            render(<ResourceLibrary />);
            const arrows = screen.getAllByTestId('arrow-icon');
            expect(arrows).toHaveLength(4);
        });
    });

    describe('Layout', () => {
        it('should use grid layout for cards', () => {
            const { container } = render(<ResourceLibrary />);
            const grid = container.querySelector('.grid');
            expect(grid).toBeInTheDocument();
            expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
        });

        it('should have animated entrance', () => {
            const { container } = render(<ResourceLibrary />);
            const section = container.querySelector('section');
            expect(section).toHaveClass('animate-in');
        });
    });

    describe('Interactivity', () => {
        it('should have cursor-pointer on cards', () => {
            const { container } = render(<ResourceLibrary />);
            const cards = container.querySelectorAll('.cursor-pointer');
            expect(cards).toHaveLength(4);
        });

        it('should have hover effects', () => {
            const { container } = render(<ResourceLibrary />);
            const cards = container.querySelectorAll('.hover\\:shadow-xl');
            expect(cards).toHaveLength(4);
        });
    });
});

describe('CATEGORIES Export', () => {
    it('should export 4 categories', () => {
        expect(CATEGORIES).toHaveLength(4);
    });

    it('should have correct category IDs', () => {
        const ids = CATEGORIES.map(cat => cat.id);
        expect(ids).toContain('operativa');
        expect(ids).toContain('finanzas');
        expect(ids).toContain('tecnico');
        expect(ids).toContain('accidente');
    });

    it('should have icons for all categories', () => {
        CATEGORIES.forEach(cat => {
            expect(cat.icon).toBeDefined();
        });
    });

    it('should have colors for all categories', () => {
        CATEGORIES.forEach(cat => {
            expect(cat.color).toBeDefined();
            expect(typeof cat.color).toBe('string');
        });
    });

    it('should have descriptions for all categories', () => {
        CATEGORIES.forEach(cat => {
            expect(cat.desc).toBeDefined();
            expect(cat.desc.length).toBeGreaterThan(0);
        });
    });
});
