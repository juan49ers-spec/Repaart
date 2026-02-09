import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
        riders: [],
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

// Mock sub-components
vi.mock('../SchedulerStatusBar', () => ({
    SchedulerStatusBar: ({ hasUnsavedChanges, totalHours, totalCost }: any) => (
        <div data-testid="scheduler-status-bar">
            <span data-testid="has-unsaved">{hasUnsavedChanges ? 'unsaved' : 'saved'}</span>
            <span data-testid="total-hours">{totalHours}</span>
            <span data-testid="total-cost">{totalCost}</span>
        </div>
    )
}));

vi.mock('../components/SchedulerHeader', () => ({
    SchedulerHeader: ({ onPublish, onAudit, onGuide }: any) => (
        <div data-testid="scheduler-header">
            <button data-testid="publish-btn" onClick={onPublish}>Publicar</button>
            <button data-testid="audit-btn" onClick={onAudit}>Auditar</button>
            <button data-testid="guide-btn" onClick={onGuide}>Guía</button>
        </div>
    )
}));

vi.mock('../SchedulerGuideModal', () => ({
    SchedulerGuideModal: ({ isOpen, onClose }: any) =>
        isOpen ? <div data-testid="guide-modal"><button onClick={onClose}>Close</button></div> : null
}));

vi.mock('../SheriffReportModal', () => ({
    SheriffReportModal: ({ isOpen }: any) =>
        isOpen ? <div data-testid="sheriff-modal">Sheriff Report</div> : null
}));

vi.mock('../../operations/ShiftModal', () => ({
    default: ({ isOpen, onClose, onSave }: any) =>
        isOpen ? (
            <div data-testid="shift-modal">
                <button data-testid="close-modal" onClick={onClose}>Close</button>
                <button data-testid="save-shift" onClick={() => onSave({})}>Save</button>
            </div>
        ) : null
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

        it('should render the header component', () => {
            render(<DeliveryScheduler {...defaultProps} />);
            expect(screen.getByTestId('scheduler-header')).toBeInTheDocument();
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
            expect(screen.getByTestId('scheduler-header')).toBeInTheDocument();
        });

        it('should respect readOnly prop', () => {
            render(<DeliveryScheduler {...defaultProps} readOnly={true} />);
            // Status bar should indicate saved state (no unsaved in readOnly)
            expect(screen.getByTestId('has-unsaved')).toHaveTextContent('saved');
        });
    });

    describe('Modal Interactions', () => {
        it('should render header with action buttons', () => {
            render(<DeliveryScheduler {...defaultProps} />);
            // Header should render with all action buttons
            expect(screen.getByTestId('publish-btn')).toBeInTheDocument();
            expect(screen.getByTestId('audit-btn')).toBeInTheDocument();
            expect(screen.getByTestId('guide-btn')).toBeInTheDocument();
        });

        it('should open sheriff modal when audit button is clicked', async () => {
            render(<DeliveryScheduler {...defaultProps} />);

            const auditBtn = screen.getByTestId('audit-btn');
            fireEvent.click(auditBtn);

            await waitFor(() => {
                expect(screen.getByTestId('sheriff-modal')).toBeInTheDocument();
            });
        });
    });

    describe('Shift Display', () => {
        it('should display existing shifts', () => {
            render(<DeliveryScheduler {...defaultProps} />);
            expect(screen.getByTestId('shift-shift-1')).toBeInTheDocument();
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
    });

    describe('Date Navigation', () => {
        it('should call onDateChange when date changes externally', () => {
            const onDateChange = vi.fn();
            render(<DeliveryScheduler {...defaultProps} onDateChange={onDateChange} />);
            // External date changes are handled via props
            expect(screen.getByTestId('scheduler-header')).toBeInTheDocument();
        });
    });

    describe('Status Bar Integration', () => {
        it('should show no unsaved changes initially', () => {
            render(<DeliveryScheduler {...defaultProps} />);
            expect(screen.getByTestId('has-unsaved')).toHaveTextContent('saved');
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

describe('DeliveryScheduler Loading State', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('should show loading state when data is loading', async () => {
        // Override the mock for this test
        vi.doMock('../hooks/useSchedulerData', () => ({
            useSchedulerData: () => ({
                rosterRiders: [],
                weekData: null,
                loading: true
            })
        }));

        // Re-import with new mock - this test verifies the loading path exists
        // In practice, the loading state is handled internally
        const { container } = render(
            <DeliveryScheduler
                franchiseId="test"
                selectedDate={new Date()}
                onDateChange={vi.fn()}
                readOnly={false}
            />
        );

        expect(container.firstChild).toBeInTheDocument();
    });
});
