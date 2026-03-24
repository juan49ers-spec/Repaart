import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('../../../../lib/gemini', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../lib/gemini')>();
  return {
    ...actual,
    validateWeeklySchedule: vi.fn(),
  };
});

import { ShiftCoverageInsight } from '../ShiftCoverageInsight';
import { validateWeeklySchedule } from '../../../../lib/gemini';

const mockShifts = [
  { startAt: '2026-03-24T20:00:00Z', endAt: '2026-03-24T23:00:00Z', riderName: 'Carlos' },
];

describe('ShiftCoverageInsight', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders nothing when shifts array is empty', () => {
    const { container } = render(<ShiftCoverageInsight shifts={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows skeleton while loading', () => {
    (validateWeeklySchedule as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    render(<ShiftCoverageInsight shifts={mockShifts} />);
    expect(screen.getByTestId('coverage-skeleton')).toBeInTheDocument();
  });

  it('renders optimal card with green style', async () => {
    (validateWeeklySchedule as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      score: 90,
      status: 'optimal',
      feedback: '¡Cuadrante perfecto!',
      missingCoverage: [],
    });
    render(<ShiftCoverageInsight shifts={mockShifts} />);
    await waitFor(() => {
      expect(screen.getByText('¡Cuadrante perfecto!')).toBeInTheDocument();
    });
  });

  it('renders warning card with missing coverage list', async () => {
    (validateWeeklySchedule as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      score: 60,
      status: 'warning',
      feedback: 'Hay algunos huecos.',
      missingCoverage: ['Viernes Noche (Falta 1)'],
    });
    render(<ShiftCoverageInsight shifts={mockShifts} />);
    await waitFor(() => {
      expect(screen.getByText('Viernes Noche (Falta 1)')).toBeInTheDocument();
    });
  });

  it('renders nothing when AI fails (silent fail)', async () => {
    (validateWeeklySchedule as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const { container } = render(<ShiftCoverageInsight shifts={mockShifts} />);
    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });
});
