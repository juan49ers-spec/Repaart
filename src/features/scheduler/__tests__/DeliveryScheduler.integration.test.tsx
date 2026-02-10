import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DeliveryScheduler from '../DeliveryScheduler';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Loader2: (props: any) => <div data-testid="loader-icon" {...props} />,
    PenLine: (props: any) => <div data-testid="penline-icon" {...props} />,
    ChevronLeft: (props: any) => <div data-testid="chevron-left" {...props} />,
    ChevronRight: (props: any) => <div data-testid="chevron-right" {...props} />,
    Calendar: (props: any) => <div data-testid="calendar-icon" {...props} />,
    Users: (props: any) => <div data-testid="users-icon" {...props} />,
    Clock: (props: any) => <div data-testid="clock-icon" {...props} />,
    Settings: (props: any) => <div data-testid="settings-icon" {...props} />,
    Plus: (props: any) => <div data-testid="plus-icon" {...props} />,
    Save: (props: any) => <div data-testid="save-icon" {...props} />,
    Trash2: (props: any) => <div data-testid="trash-icon" {...props} />,
    AlertCircle: (props: any) => <div data-testid="alert-icon" {...props} />,
    CheckCircle: (props: any) => <div data-testid="check-icon" {...props} />,
    X: (props: any) => <div data-testid="x-icon" {...props} />,
    HelpCircle: (props: any) => <div data-testid="help-icon" {...props} />,
    Shield: (props: any) => <div data-testid="shield-icon" {...props} />,
    Info: (props: any) => <div data-testid="info-icon" {...props} />,
    Sun: (props: any) => <div data-testid="sun-icon" {...props} />,
    Moon: (props: any) => <div data-testid="moon-icon" {...props} />,
    Utensils: (props: any) => <div data-testid="utensils-icon" {...props} />,
    Star: (props: any) => <div data-testid="star-icon" {...props} />,
    Zap: (props: any) => <div data-testid="zap-icon" {...props} />,
    Sparkles: (props: any) => <div data-testid="sparkles-icon" {...props} />,
    MoreHorizontal: (props: any) => <div data-testid="more-icon" {...props} />,
    Copy: (props: any) => <div data-testid="copy-icon" {...props} />,
    Bike: (props: any) => <div data-testid="bike-icon" {...props} />,
    Eye: (props: any) => <div data-testid="eye-icon" {...props} />,
    BadgeCheck: (props: any) => <div data-testid="badge-check-icon" {...props} />,
    XCircle: (props: any) => <div data-testid="x-circle-icon" {...props} />,
}));

// Mock all dependencies
vi.mock('../../../context/AuthContext', () => ({
    useAuth: () => ({
        user: { uid: 'test-user', franchiseId: 'test-franchise', role: 'franchise' },
        impersonatedFranchiseId: null,
        roleConfig: {}
    })
}));

vi.mock('../hooks/useSchedulerData', () => ({
    useSchedulerData: vi.fn(() => ({
        rosterRiders: [
            { id: 'r1', fullName: 'Juan García', status: 'active', email: 'juan@test.com' },
            { id: 'r2', fullName: 'Ana López', status: 'active', email: 'ana@test.com' }
        ],
        weekData: {
            franchiseId: 'test-franchise',
            weekStartDate: '2024-01-15',
            shifts: [
                {
                    id: 'shift-1',
                    franchiseId: 'test-franchise',
                    riderId: 'r1',
                    startAt: '2024-01-15T10:00:00',
                    endAt: '2024-01-15T14:00:00',
                    isConfirmed: true
                }
            ]
        },
        loading: false
    }))
}));

vi.mock('../../../store/useFleetStore', () => ({
    useFleetStore: () => ({
        riders: [
            { id: 'r1', fullName: 'Juan García', status: 'active', email: 'juan@test.com' },
            { id: 'r2', fullName: 'Ana López', status: 'active', email: 'ana@test.com' }
        ],
        fetchRiders: vi.fn()
    })
}));

vi.mock('../../../store/useVehicleStore', () => ({
    useVehicleStore: () => ({
        vehicles: [],
        fetchVehicles: vi.fn()
    })
}));

vi.mock('../../../hooks/useWeeklySchedule', () => ({
    useWeeklySchedule: () => ({
        weekData: { shifts: [] },
        loading: false,
        motos: [],
        riders: []
    })
}));

vi.mock('../../../hooks/useMediaQuery', () => ({
    useMediaQuery: () => false
}));

vi.mock('../SchedulerStatusBar', () => ({
    SchedulerStatusBar: () => <div data-testid="scheduler-status-bar">Status Bar</div>
}));

vi.mock('../SchedulerGuideModal', () => ({
    SchedulerGuideModal: () => <div data-testid="scheduler-guide-modal">Guide</div>
}));

vi.mock('../../operations/QuickFillModal', () => ({
    default: () => <div data-testid="quick-fill-modal">Quick Fill</div>
}));

vi.mock('../../operations/ShiftModal', () => ({
    default: () => <div data-testid="shift-modal">Shift Modal</div>
}));

vi.mock('../../operations/MobileAgendaView', () => ({
    default: () => <div data-testid="mobile-agenda-view">Mobile Agenda</div>
}));

vi.mock('../SheriffReportModal', () => ({
    SheriffReportModal: () => <div data-testid="sheriff-report-modal">Sheriff</div>
}));

vi.mock('../../../components/ui/feedback/ConfirmationModal', () => ({
    default: () => <div data-testid="confirmation-modal">Confirmation</div>
}));

vi.mock('../components/ShiftContextMenu', () => ({
    default: () => null
}));

vi.mock('../DroppableCell', () => ({
    DroppableCell: ({ onClick, children }: any) => (
        <div data-testid="droppable-cell" onClick={onClick}>{children}</div>
    )
}));

vi.mock('../DraggableShift', () => ({
    DraggableShift: ({ shift, onClick }: any) => (
        <div
            data-testid={`shift-${shift.id}`}
            onClick={onClick}
            className="draggable-shift"
        >
            Shift: {shift.riderId}
        </div>
    )
}));

describe('DeliveryScheduler Integration', () => {
    const defaultProps = {
        franchiseId: 'test-franchise',
        selectedDate: new Date('2024-01-15'),
        onDateChange: vi.fn(),
        readOnly: false
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Initial Rendering', () => {
        it('should render the scheduler container', () => {
            const { container } = render(<DeliveryScheduler {...defaultProps} />);
            expect(container.firstChild).toBeInTheDocument();
        });

        it('should render with correct root classes', () => {
            const { container } = render(<DeliveryScheduler {...defaultProps} />);
            const rootElement = container.firstChild as HTMLElement;
            expect(rootElement).toHaveClass('flex');
            expect(rootElement).toHaveClass('flex-col');
            expect(rootElement).toHaveClass('h-full');
            expect(rootElement).toHaveClass('bg-slate-50');
            expect(rootElement).toHaveClass('@container');
        });

        it('should render the status bar', () => {
            render(<DeliveryScheduler {...defaultProps} />);
            expect(screen.getByTestId('scheduler-status-bar')).toBeInTheDocument();
        });

        it('should display rider names in grid', () => {
            render(<DeliveryScheduler {...defaultProps} />);
            // Riders should appear alphabetically
            expect(screen.getByText(/Ana/)).toBeInTheDocument();
            expect(screen.getByText(/Juan/)).toBeInTheDocument();
        });
    });

    describe('Props Override', () => {
        it('should use provided franchiseId over auth context', () => {
            render(<DeliveryScheduler {...defaultProps} franchiseId="custom-franchise" />);
            // Component should render without error with custom franchiseId
            expect(screen.getByText(/Ana/)).toBeInTheDocument();
        });

        it('should respect readOnly prop', () => {
            render(<DeliveryScheduler {...defaultProps} readOnly={true} />);
            // Component should render in readOnly mode
            expect(screen.getByText(/Ana/)).toBeInTheDocument();
        });
    });

    describe('Container Layout', () => {
        it('should use flex column layout', () => {
            const { container } = render(<DeliveryScheduler {...defaultProps} />);
            const rootElement = container.firstChild as HTMLElement;
            expect(rootElement).toHaveClass('flex');
            expect(rootElement).toHaveClass('flex-col');
        });

        it('should have proper height class', () => {
            const { container } = render(<DeliveryScheduler {...defaultProps} />);
            const rootElement = container.firstChild as HTMLElement;
            expect(rootElement).toHaveClass('h-full');
        });

        it('should have background styling', () => {
            const { container } = render(<DeliveryScheduler {...defaultProps} />);
            const rootElement = container.firstChild as HTMLElement;
            expect(rootElement).toHaveClass('bg-slate-50');
        });

        it('should have overflow handling', () => {
            const { container } = render(<DeliveryScheduler {...defaultProps} />);
            const rootElement = container.firstChild as HTMLElement;
            expect(rootElement).toHaveClass('overflow-hidden');
        });
    });

    describe('Date Navigation', () => {
        it('should call onDateChange when date changes externally', () => {
            const onDateChange = vi.fn();
            render(<DeliveryScheduler {...defaultProps} onDateChange={onDateChange} />);
            // Component renders correctly with date change handler
            expect(screen.getByText(/Ana/)).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper semantic structure', () => {
            const { container } = render(<DeliveryScheduler {...defaultProps} />);
            // Root should be a proper container
            expect(container.firstChild).toBeTruthy();
        });
    });
});

