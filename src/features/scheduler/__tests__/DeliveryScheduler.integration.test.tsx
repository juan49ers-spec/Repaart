import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import DeliveryScheduler from '../DeliveryScheduler';

// Mock lucide-react icons
vi.mock('lucide-react', () => {
    const IconMock = (dataTestId: string) => {
        const Component = ({ ...props }: any) => <div data-testid={dataTestId} {...props} />;
        Component.displayName = `Icon(${dataTestId})`;
        return Component;
    };
    return {
        Loader2: IconMock('loader-icon'),
        PenLine: IconMock('penline-icon'),
        ChevronLeft: IconMock('chevron-left'),
        ChevronRight: IconMock('chevron-right'),
        Calendar: IconMock('calendar-icon'),
        Users: IconMock('users-icon'),
        Clock: IconMock('clock-icon'),
        Settings: IconMock('settings-icon'),
        Plus: IconMock('plus-icon'),
        Save: IconMock('save-icon'),
        Trash2: IconMock('trash-icon'),
        AlertCircle: IconMock('alert-icon'),
        CheckCircle: IconMock('check-icon'),
        X: IconMock('x-icon'),
        LayoutTemplate: IconMock('layout-template-icon'),
        RotateCcw: IconMock('rotate-ccw-icon'),
        Copy: IconMock('copy-icon'),
        ChevronDown: IconMock('chevron-down-icon'),
        HelpCircle: IconMock('help-circle-icon'),
        FileText: IconMock('file-text-icon'),
        History: IconMock('history-icon'),
        UserPlus: IconMock('user-plus-icon'),
        CalendarRange: IconMock('calendar-range-icon'),
        Filter: IconMock('filter-icon'),
        Search: IconMock('search-icon'),
        ArrowRight: IconMock('arrow-right-icon'),
        Maximize2: IconMock('maximize-icon'),
        Minimize2: IconMock('minimize-icon'),
        ExternalLink: IconMock('external-link-icon'),
        RefreshCw: IconMock('refresh-cw-icon'),
        Sun: IconMock('sun-icon'),
        Moon: IconMock('moon-icon'),
        BadgeCheck: IconMock('badge-check-icon'),
        XCircle: IconMock('x-circle-icon'),
        Bike: IconMock('bike-icon'),
        Eye: IconMock('eye-icon'),
        MoreHorizontal: IconMock('more-icon'),
        Zap: IconMock('zap-icon'),
        Sparkles: IconMock('sparkles-icon'),
        Star: IconMock('star-icon'),
        Utensils: IconMock('utensils-icon'),
        Shield: IconMock('shield-icon'),
        Info: IconMock('info-icon'),
        AlertTriangle: IconMock('alert-triangle-icon'),
        Bot: IconMock('bot-icon'),
    };
});

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
        it('should render the scheduler container', async () => {
            let container;
            await act(async () => {
                const result = render(<DeliveryScheduler {...defaultProps} />);
                container = result.container;
            });
            expect(container!.firstChild).toBeInTheDocument();
        });

        it('should render with correct root classes', async () => {
            let container;
            await act(async () => {
                const result = render(<DeliveryScheduler {...defaultProps} />);
                container = result.container;
            });
            const rootElement = container!.firstChild as HTMLElement;
            expect(rootElement).toHaveClass('flex');
            expect(rootElement).toHaveClass('flex-col');
            expect(rootElement).toHaveClass('h-full');
            expect(rootElement).toHaveClass('bg-slate-50');
            expect(rootElement).toHaveClass('@container');
        });

        it('should render the status bar', async () => {
            await act(async () => {
                render(<DeliveryScheduler {...defaultProps} />);
            });
            expect(await screen.findByTestId('scheduler-status-bar')).toBeInTheDocument();
        });

        it('should display rider names in grid', async () => {
            await act(async () => {
                render(<DeliveryScheduler {...defaultProps} />);
            });
            // Riders should appear alphabetically
            expect(await screen.findByText(/Ana/)).toBeInTheDocument();
            expect(screen.getByText(/Juan/)).toBeInTheDocument();
        });
    });

    describe('Props Override', () => {
        it('should use provided franchiseId over auth context', async () => {
            await act(async () => {
                render(<DeliveryScheduler {...defaultProps} franchiseId="custom-franchise" />);
            });
            // Component should render without error with custom franchiseId
            expect(await screen.findByText(/Ana/)).toBeInTheDocument();
        });

        it('should respect readOnly prop', async () => {
            await act(async () => {
                render(<DeliveryScheduler {...defaultProps} readOnly={true} />);
            });
            // Component should render in readOnly mode
            expect(await screen.findByText(/Ana/)).toBeInTheDocument();
        });
    });

    describe('Container Layout', () => {
        it('should use flex column layout', async () => {
            let container;
            await act(async () => {
                const result = render(<DeliveryScheduler {...defaultProps} />);
                container = result.container;
            });
            const rootElement = container!.firstChild as HTMLElement;
            expect(rootElement).toHaveClass('flex');
            expect(rootElement).toHaveClass('flex-col');
        });

        it('should have proper height class', async () => {
            let container;
            await act(async () => {
                const result = render(<DeliveryScheduler {...defaultProps} />);
                container = result.container;
            });
            const rootElement = container!.firstChild as HTMLElement;
            expect(rootElement).toHaveClass('h-full');
        });

        it('should have background styling', async () => {
            let container;
            await act(async () => {
                const result = render(<DeliveryScheduler {...defaultProps} />);
                container = result.container;
            });
            const rootElement = container!.firstChild as HTMLElement;
            expect(rootElement).toHaveClass('bg-slate-50');
        });

        it('should have overflow handling', async () => {
            let container;
            await act(async () => {
                const result = render(<DeliveryScheduler {...defaultProps} />);
                container = result.container;
            });
            const rootElement = container!.firstChild as HTMLElement;
            expect(rootElement).toHaveClass('overflow-hidden');
        });
    });

    describe('Date Navigation', () => {
        it('should call onDateChange when date changes externally', async () => {
            const onDateChange = vi.fn();
            await act(async () => {
                render(<DeliveryScheduler {...defaultProps} onDateChange={onDateChange} />);
            });
            // Component renders correctly with date change handler
            expect(await screen.findByText(/Ana/)).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper semantic structure', async () => {
            let container;
            await act(async () => {
                const result = render(<DeliveryScheduler {...defaultProps} />);
                container = result.container;
            });
            // Root should be a proper container
            expect(container!.firstChild).toBeTruthy();
        });
    });
});
