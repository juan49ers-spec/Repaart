import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { SmartStartButton } from '../components/SmartStartButton';

// Mock external dependencies
vi.mock('lucide-react', () => ({
    QrCode: (props: Record<string, unknown>) => <div data-testid="qr-icon" {...props} />,
    X: (props: Record<string, unknown>) => <div data-testid="x-icon" {...props} />,
    Loader2: (props: Record<string, unknown>) => <div data-testid="loader-icon" {...props} />,
    CheckCircle2: (props: Record<string, unknown>) => <div data-testid="check-icon" {...props} />,
}));

// Mock QR Scanner - must be done before importing component
vi.mock('@yudiel/react-qr-scanner', () => ({
    Scanner: ({ onScan }: { onScan: (result: unknown) => void }) => (
        <div data-testid="qr-scanner">
            <button data-testid="mock-scan" onClick={() => onScan([{ rawValue: 'moto-123' }])}>
                Mock Scan
            </button>
        </div>
    )
}));

// Mock confetti
vi.mock('canvas-confetti', () => ({
    default: vi.fn()
}));

// Mock services
const mockGetCurrentPosition = vi.fn();
const mockGetFranchiseMeta = vi.fn();
const mockUpdateShift = vi.fn();

vi.mock('../../../../utils/geo', () => ({
    getCurrentPosition: () => mockGetCurrentPosition(),
    calculateDistance: vi.fn(() => 50) // Within 200m
}));

vi.mock('../../../../services/franchiseService', () => ({
    franchiseService: {
        getFranchiseMeta: () => mockGetFranchiseMeta()
    }
}));

vi.mock('../../../../services/shiftService', () => ({
    shiftService: {
        updateShift: (shiftId: string, data: unknown) => mockUpdateShift(shiftId, data)
    }
}));

describe('SmartStartButton Component', () => {
    const defaultProps = {
        shiftId: 'shift-123',
        franchiseId: 'franchise-456',
        onSuccess: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        // Default successful mocks
        mockGetCurrentPosition.mockResolvedValue({
            coords: { latitude: 40.0, longitude: -3.0 }
        });
        mockGetFranchiseMeta.mockResolvedValue({
            success: true,
            data: {
                coordinates: { lat: 40.0, lng: -3.0 }
            }
        });
        mockUpdateShift.mockResolvedValue({});
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('Idle State', () => {
        it('should render start button in idle state', () => {
            render(<SmartStartButton {...defaultProps} />);
            expect(screen.getByText('Escanear para Iniciar')).toBeInTheDocument();
            expect(screen.getByTestId('qr-icon')).toBeInTheDocument();
        });

        it('should have clickable button', () => {
            render(<SmartStartButton {...defaultProps} />);
            const button = screen.getByRole('button');
            expect(button).not.toBeDisabled();
        });
    });

    describe('Locating State', () => {
        it('should show GPS verification when button clicked', async () => {
            mockGetCurrentPosition.mockImplementation(() => new Promise(() => { })); // Never resolves

            render(<SmartStartButton {...defaultProps} />);
            const button = screen.getByRole('button');

            await act(async () => {
                fireEvent.click(button);
            });

            expect(screen.getByText('Verificando GPS...')).toBeInTheDocument();
            expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
        });

        it('should disable button during GPS verification', async () => {
            mockGetCurrentPosition.mockImplementation(() => new Promise(() => { }));

            render(<SmartStartButton {...defaultProps} />);
            const button = screen.getByRole('button');

            await act(async () => {
                fireEvent.click(button);
            });

            expect(button).toBeDisabled();
        });
    });

    describe('Scanning State', () => {
        it('should show QR scanner after GPS verification', async () => {
            render(<SmartStartButton {...defaultProps} />);

            await act(async () => {
                fireEvent.click(screen.getByRole('button'));
                await Promise.resolve();
            });

            await waitFor(() => {
                expect(screen.getByTestId('qr-scanner')).toBeInTheDocument();
            });
        });

        it('should show close button in scanner mode', async () => {
            render(<SmartStartButton {...defaultProps} />);

            await act(async () => {
                fireEvent.click(screen.getByRole('button'));
                await Promise.resolve();
            });

            await waitFor(() => {
                expect(screen.getByTestId('x-icon')).toBeInTheDocument();
            });
        });

        it('should show scan instructions', async () => {
            render(<SmartStartButton {...defaultProps} />);

            await act(async () => {
                fireEvent.click(screen.getByRole('button'));
                await Promise.resolve();
            });

            await waitFor(() => {
                expect(screen.getByText(/Escanea el QR de la moto/)).toBeInTheDocument();
            });
        });
    });

    describe('Success State', () => {
        it('should show success state after scan', async () => {
            render(<SmartStartButton {...defaultProps} />);

            // Start process
            await act(async () => {
                fireEvent.click(screen.getByRole('button'));
                await Promise.resolve();
            });

            // Wait for scanner
            await waitFor(() => {
                expect(screen.getByTestId('qr-scanner')).toBeInTheDocument();
            });

            // Trigger scan
            await act(async () => {
                fireEvent.click(screen.getByTestId('mock-scan'));
                await Promise.resolve();
            });

            // Should show success
            await waitFor(() => {
                expect(screen.getByText('¡Turno Iniciado!')).toBeInTheDocument();
            });
        });

        it('should update shift with vehicle ID', async () => {
            render(<SmartStartButton {...defaultProps} />);

            await act(async () => {
                fireEvent.click(screen.getByRole('button'));
                await Promise.resolve();
            });

            await waitFor(() => {
                expect(screen.getByTestId('qr-scanner')).toBeInTheDocument();
            });

            await act(async () => {
                fireEvent.click(screen.getByTestId('mock-scan'));
                await Promise.resolve();
            });

            expect(mockUpdateShift).toHaveBeenCalledWith('shift-123', { motoId: 'moto-123' });
        });

        it('should call onSuccess callback after success', async () => {
            render(<SmartStartButton {...defaultProps} />);

            await act(async () => {
                fireEvent.click(screen.getByRole('button'));
                await Promise.resolve();
            });

            await waitFor(() => {
                expect(screen.getByTestId('qr-scanner')).toBeInTheDocument();
            });

            await act(async () => {
                fireEvent.click(screen.getByTestId('mock-scan'));
                await Promise.resolve();
            });

            // Fast-forward timer for onSuccess callback
            await act(async () => {
                vi.advanceTimersByTime(1500);
            });

            expect(defaultProps.onSuccess).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should show error when GPS fails', async () => {
            mockGetCurrentPosition.mockRejectedValue(new Error('GPS Error'));

            render(<SmartStartButton {...defaultProps} />);

            await act(async () => {
                fireEvent.click(screen.getByRole('button'));
            });

            await waitFor(() => {
                expect(screen.getByText(/GPS Error/)).toBeInTheDocument();
            });
        });

        it('should show error when franchise location fails', async () => {
            mockGetFranchiseMeta.mockResolvedValue({
                success: false
            });

            render(<SmartStartButton {...defaultProps} />);

            await act(async () => {
                fireEvent.click(screen.getByRole('button'));
            });

            await waitFor(() => {
                expect(screen.getByText(/No se pudo verificar/)).toBeInTheDocument();
            });
        });

        it('should reset to idle after error timeout', async () => {
            mockGetCurrentPosition.mockRejectedValue(new Error('GPS Error'));

            render(<SmartStartButton {...defaultProps} />);

            await act(async () => {
                fireEvent.click(screen.getByRole('button'));
            });

            await waitFor(() => {
                expect(screen.getByText(/GPS Error/)).toBeInTheDocument();
            });

            // Fast-forward 3 seconds for auto-reset
            await act(async () => {
                vi.advanceTimersByTime(3000);
            });

            expect(screen.getByText('Escanear para Iniciar')).toBeInTheDocument();
        });
    });

    describe('Cancel Flow', () => {
        it('should close scanner when X is clicked', async () => {
            render(<SmartStartButton {...defaultProps} />);

            await act(async () => {
                fireEvent.click(screen.getByRole('button'));
                await Promise.resolve();
            });

            await waitFor(() => {
                expect(screen.getByTestId('qr-scanner')).toBeInTheDocument();
            });

            // Find close button (first X icon in the scanner overlay)
            const closeButton = screen.getAllByRole('button')[0];

            await act(async () => {
                fireEvent.click(closeButton);
            });

            // Should return to idle
            await waitFor(() => {
                expect(screen.getByText('Escanear para Iniciar')).toBeInTheDocument();
            });
        });
    });
});

describe('SmartStartButton Accessibility', () => {
    const defaultProps = {
        shiftId: 'shift-123',
        franchiseId: 'franchise-456',
        onSuccess: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockGetCurrentPosition.mockImplementation(() => new Promise(() => { }));
    });

    it('should have accessible button text', () => {
        render(<SmartStartButton {...defaultProps} />);
        expect(screen.getByText('Escanear para Iniciar')).toBeInTheDocument();
    });

    it('should indicate loading state to assistive technology', async () => {
        render(<SmartStartButton {...defaultProps} />);

        await act(async () => {
            fireEvent.click(screen.getByRole('button'));
        });

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });
});
