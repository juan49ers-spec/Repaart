import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import FinancialControlCenter from './FinancialControlCenter';
import { financeService } from '../../services/financeService';
import { userService } from '../../services/userService';
import { shiftService } from '../../services/shiftService';
import { invoiceEngine } from '../../services/billing/invoiceEngine';

// Explicit mocks for icons
vi.mock('lucide-react', () => ({
    X: (props: any) => <div data-testid="mock-icon-x" {...props} />,
    Activity: (props: any) => <div data-testid="mock-icon-activity" {...props} />,
    Save: (props: any) => <div data-testid="mock-icon-save" {...props} />,
    ArrowLeft: (props: any) => <div data-testid="mock-icon-arrow-left" {...props} />,
    ArrowRight: (props: any) => <div data-testid="mock-icon-arrow-right" {...props} />,
    Lock: (props: any) => <div data-testid="mock-icon-lock" {...props} />,
    CheckCircle: (props: any) => <div data-testid="mock-icon-check-circle" {...props} />
}));

// Mock Dependencies
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        user: { uid: 'test-user', role: 'franchise' }
    })
}));

vi.mock('../../services/financeService', () => ({
    financeService: {
        getFinancialData: vi.fn(),
        getFinancialYearlyData: vi.fn(),
        updateFinancialData: vi.fn()
    }
}));

vi.mock('../../services/userService', () => ({
    userService: {
        getUserProfile: vi.fn(),
        getUserByFranchiseId: vi.fn()
    }
}));

vi.mock('../../services/notificationService', () => ({
    notificationService: {
        notify: vi.fn()
    }
}));

vi.mock('../../services/billing/invoiceEngine', () => ({
    invoiceEngine: {
        getInvoicedIncomeForMonth: vi.fn()
    }
}));

vi.mock('../../services/shiftService', () => ({
    shiftService: {
        getShiftsInRange: vi.fn()
    }
}));

vi.mock('canvas-confetti', () => ({
    default: vi.fn()
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>
    }
}));

// ResizeObserver Polyfill
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// Mock sub-components
vi.mock('./finance/components/RevenueStep', () => ({
    RevenueStep: ({ totalIncome }: any) => <div data-testid="revenue-step">Revenue Step: {totalIncome}</div>
}));

vi.mock('./finance/components/ExpensesStep', () => ({
    ExpensesStep: ({ totalExpenses }: any) => <div data-testid="expenses-step">Expenses Step: {totalExpenses}</div>
}));

vi.mock('./finance/components/FinancialBreakdownChart', () => ({
    FinancialBreakdownChart: () => <div data-testid="breakdown-chart">Chart</div>
}));

describe('FinancialControlCenter', () => {
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (userService.getUserProfile as any).mockResolvedValue({ logisticsRates: [] });
        (financeService.getFinancialData as any).mockResolvedValue({});
        (financeService.getFinancialYearlyData as any).mockResolvedValue({ prevMonthsYtd: 0, months: [] });
        (shiftService.getShiftsInRange as any).mockResolvedValue([]);
        (invoiceEngine.getInvoicedIncomeForMonth as any).mockResolvedValue({ subtotal: 0, total: 0, ordersDetail: {} });
    });

    it('renders loading state initially', () => {
        render(<FinancialControlCenter franchiseId="f1" month="2023-10" onClose={mockOnClose} />);
        expect(screen.getByText(/Sincronizando Inteligencia Financiera/i)).toBeInTheDocument();
    });

    it('renders content after loading', async () => {
        (financeService.getFinancialData as any).mockResolvedValue({
            revenue: 5000,
            status: 'draft'
        });

        render(<FinancialControlCenter franchiseId="f1" month="2023-10" onClose={mockOnClose} />);

        await waitFor(() => {
            expect(screen.queryByText(/Cargando datos financieros/i)).not.toBeInTheDocument();
        });

        expect(screen.getByText('Cierre Financiero')).toBeInTheDocument();
        expect(screen.getByText('2023-10')).toBeInTheDocument();
        expect(screen.getByTestId('revenue-step')).toBeInTheDocument();
    });

    it('switches steps correctly', async () => {
        render(<FinancialControlCenter franchiseId="f1" month="2023-10" onClose={mockOnClose} />);

        await waitFor(() => {
            expect(screen.getByTestId('revenue-step')).toBeInTheDocument();
        });

        // Go to Step 2
        const nextButton = screen.getByText(/Siguiente/i);
        fireEvent.click(nextButton);

        expect(screen.getByTestId('expenses-step')).toBeInTheDocument();

        // Go to Step 3 (Review)
        fireEvent.click(screen.getByText(/Siguiente/i));
        expect(screen.getByTestId('breakdown-chart')).toBeInTheDocument();
    });

    /* 
       Note: The 'handles save action' test logic depends on the specific step the user is on.
       In the new flow, 'Guardar Borrador' is available in footer.
    */
    it('handles save draft action', async () => {
        render(<FinancialControlCenter franchiseId="f1" month="2023-10" onClose={mockOnClose} onSave={mockOnSave} />);

        await waitFor(() => expect(screen.getByText('Cierre Financiero')).toBeInTheDocument());

        // We are on Step 1. Save Draft should be available.
        const saveDraftButton = screen.getByText(/Borrador/i);
        fireEvent.click(saveDraftButton);

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalled();
        });
    });
});
