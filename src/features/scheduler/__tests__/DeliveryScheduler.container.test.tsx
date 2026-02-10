import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import DeliveryScheduler from '../DeliveryScheduler';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronLeft: (props: any) => <div data-testid="chevron-left" {...props} />,
  ChevronRight: (props: any) => <div data-testid="chevron-right" {...props} />,
  Sun: (props: any) => <div data-testid="sun-icon" {...props} />,
  Moon: (props: any) => <div data-testid="moon-icon" {...props} />,
  Save: (props: any) => <div data-testid="save-icon" {...props} />,
  Loader2: (props: any) => <div data-testid="loader-icon" {...props} />,
  BadgeCheck: (props: any) => <div data-testid="badge-check-icon" {...props} />,
  XCircle: (props: any) => <div data-testid="x-circle-icon" {...props} />,
  PenLine: (props: any) => <div data-testid="penline-icon" {...props} />,
  Bike: (props: any) => <div data-testid="bike-icon" {...props} />,
}));

// Mock all dependencies
vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user', franchiseId: 'test-franchise' },
    impersonatedFranchiseId: null,
    roleConfig: {}
  })
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
  ShiftContextMenu: () => <div data-testid="shift-context-menu">Context Menu</div>
}));

describe('DeliveryScheduler Container Queries', () => {
  const defaultProps = {
    franchiseId: 'test-franchise',
    selectedDate: new Date(),
    onDateChange: vi.fn(),
    readOnly: false
  };

  it('should have @container class on root element', () => {
    const { container } = render(
      <DeliveryScheduler {...defaultProps} />
    );

    const rootElement = container.firstChild as HTMLElement;
    expect(rootElement).toHaveClass('@container');
  });

  it('should use flex layout for responsive design', () => {
    const { container } = render(
      <DeliveryScheduler {...defaultProps} />
    );

    const rootElement = container.firstChild as HTMLElement;
    expect(rootElement).toHaveClass('flex');
    expect(rootElement).toHaveClass('flex-col');
  });

  it('should have overflow handling', () => {
    const { container } = render(
      <DeliveryScheduler {...defaultProps} />
    );

    const rootElement = container.firstChild as HTMLElement;
    expect(rootElement).toHaveClass('overflow-hidden');
  });
});
