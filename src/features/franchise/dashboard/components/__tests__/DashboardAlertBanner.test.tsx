import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DashboardAlertBanner } from '../DashboardAlertBanner';

vi.mock('../../../../../lib/gemini', () => ({
  generateDashboardAlert: vi.fn(),
}));

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    TrendingUp: (props: Record<string, unknown>) => <svg data-testid="icon-trending-up" {...props} />,
    AlertTriangle: (props: Record<string, unknown>) => <svg data-testid="icon-alert-triangle" {...props} />,
    AlertCircle: (props: Record<string, unknown>) => <svg data-testid="icon-alert-circle" {...props} />,
    Lightbulb: (props: Record<string, unknown>) => <svg data-testid="icon-lightbulb" {...props} />,
    X: (props: Record<string, unknown>) => <svg data-testid="icon-x" {...props} />,
    Bot: (props: Record<string, unknown>) => <svg data-testid="icon-bot" {...props} />,
  };
});

import { generateDashboardAlert } from '../../../../../lib/gemini';

const baseProps = {
  franchiseId: 'franchise-1',
  financialData: { revenue: 10000, expenses: 7000, profit: 3000, margin: 30, orders: 150, month: '2026-03' },
  shiftsData: { totalThisWeek: 20, uncoveredSlots: 0, nextWeekCoverage: 90 },
  ridersData: { active: 5, inactive: 1 },
  onOpenAdvisor: vi.fn(),
};

describe('DashboardAlertBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows skeleton while loading', () => {
    (generateDashboardAlert as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    render(<DashboardAlertBanner {...baseProps} />);
    expect(screen.getByTestId('alert-skeleton')).toBeInTheDocument();
  });

  it('renders alert title and message after load', async () => {
    (generateDashboardAlert as ReturnType<typeof vi.fn>).mockResolvedValue({
      type: 'positive',
      title: '¡Buen margen este mes!',
      message: 'Estás al 30%, muy por encima de la media.',
    });
    render(<DashboardAlertBanner {...baseProps} />);
    await waitFor(() => {
      expect(screen.getByText('¡Buen margen este mes!')).toBeInTheDocument();
      expect(screen.getByText('Estás al 30%, muy por encima de la media.')).toBeInTheDocument();
    });
  });

  it('renders nothing when generateDashboardAlert returns null', async () => {
    (generateDashboardAlert as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const { container } = render(<DashboardAlertBanner {...baseProps} />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders nothing when financialData is null', async () => {
    const { container } = render(<DashboardAlertBanner {...baseProps} financialData={null} />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('calls onOpenAdvisor when advisor button is clicked', async () => {
    (generateDashboardAlert as ReturnType<typeof vi.fn>).mockResolvedValue({
      type: 'info',
      title: 'Todo en orden',
      message: 'Esta semana va bien.',
    });
    render(<DashboardAlertBanner {...baseProps} />);
    await waitFor(() => screen.getByText('Todo en orden'));
    fireEvent.click(screen.getByRole('button', { name: /asesor/i }));
    expect(baseProps.onOpenAdvisor).toHaveBeenCalled();
  });

  it('dismisses banner when X is clicked', async () => {
    (generateDashboardAlert as ReturnType<typeof vi.fn>).mockResolvedValue({
      type: 'warning',
      title: 'Hay huecos esta semana',
      message: 'Tienes 2 turnos sin cubrir.',
    });
    const { container } = render(<DashboardAlertBanner {...baseProps} />);
    await waitFor(() => screen.getByText('Hay huecos esta semana'));
    fireEvent.click(screen.getByTitle('Descartar'));
    expect(container.firstChild).toBeNull();
  });
});
