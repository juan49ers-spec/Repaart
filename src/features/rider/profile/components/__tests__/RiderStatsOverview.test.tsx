import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RiderStatsOverview from '../RiderStatsOverview';

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
        expect(screen.getByText('Rendimiento Semanal')).toBeInTheDocument();
    });

    it('renders without crashing', () => {
        render(<RiderStatsOverview myShifts={mockShifts} />);
        expect(screen.getByText('Horas Trabajadas')).toBeInTheDocument();
    });

    it('handles empty shifts array', () => {
        render(<RiderStatsOverview myShifts={[]} />);
        expect(screen.getByText('0.0')).toBeInTheDocument();
    });

    it('displays trend comparison with last week', () => {
        render(<RiderStatsOverview myShifts={mockShifts} />);
        expect(screen.getByText(/Comparativa con semana anterior/i)).toBeInTheDocument();
    });
});