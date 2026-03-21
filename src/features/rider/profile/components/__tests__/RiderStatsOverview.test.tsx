import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RiderStatsOverview from '../RiderStatsOverview';

// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Sun: (props: any) => <div data-testid="sun-icon" {...props} />,
    Moon: (props: any) => <div data-testid="moon-icon" {...props} />,
    Zap: (props: any) => <div data-testid="zap-icon" {...props} />,
    Award: (props: any) => <div data-testid="award-icon" {...props} />,
    ArrowUpRight: (props: any) => <div data-testid="arrow-up-right-icon" {...props} />,
    ArrowDownRight: (props: any) => <div data-testid="arrow-down-right-icon" {...props} />,
    CheckCircle2: (props: any) => <div data-testid="check-circle-icon" {...props} />,
  };
});

describe('RiderStatsOverview', () => {
    const mockShifts = [
        {
            id: '1',
            startAt: '2026-01-20T06:00:00',
            endAt: '2026-01-20T14:00:00',
        },
        {
            id: '2',
            startAt: '2026-01-21T14:00:00',
            endAt: '2026-01-21T22:00:00',
        },
        {
            id: '3',
            startAt: '2026-01-22T06:00:00',
            endAt: '2026-01-22T14:00:00',
        },
    ];

    it('renders performance overview section', () => {
        render(<RiderStatsOverview myShifts={mockShifts} />);
        expect(screen.getByText('Progreso')).toBeInTheDocument();
    });

    it('renders without crashing', () => {
        render(<RiderStatsOverview myShifts={mockShifts} />);
        expect(screen.getByText('Turnos')).toBeInTheDocument();
    });

    it('handles empty shifts array', () => {
        render(<RiderStatsOverview myShifts={[]} />);
        expect(screen.getByText('0.0')).toBeInTheDocument();
    });

    it('displays trend percentage indicator', () => {
        render(<RiderStatsOverview myShifts={mockShifts} />);
        expect(screen.getByTestId('arrow-up-right-icon')).toBeInTheDocument();
    });
});