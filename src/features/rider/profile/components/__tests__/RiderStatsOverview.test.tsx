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

    it('displays total hours worked', () => {
        render(<RiderStatsOverview myShifts={mockShifts} />);
        expect(screen.getByText(/24\.0h/i)).toBeInTheDocument();
    });

    it('displays target hours', () => {
        render(<RiderStatsOverview myShifts={mockShifts} />);
        expect(screen.getByText('/40h')).toBeInTheDocument();
    });

    it('displays total shifts count', () => {
        render(<RiderStatsOverview myShifts={mockShifts} />);
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('calculates efficiency correctly', () => {
        render(<RiderStatsOverview myShifts={mockShifts} />);
        expect(screen.getByText('8.0h')).toBeInTheDocument();
    });

    it('displays day shifts count', () => {
        render(<RiderStatsOverview myShifts={mockShifts} />);
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('displays night shifts count', () => {
        render(<RiderStatsOverview myShifts={mockShifts} />);
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('displays goal achieved message when target is met', () => {
        const fullShifts = Array(5).fill(null).map((_, i) => ({
            id: `${i}`,
            startAt: '2026-01-20T06:00:00',
            endAt: '2026-01-20T14:00:00',
        }));

        render(<RiderStatsOverview myShifts={fullShifts} />);
        expect(screen.getByText('Objetivo semanal alcanzado')).toBeInTheDocument();
    });

    it('displays almost there message when close to target', () => {
        const partialShifts = Array(4).fill(null).map((_, i) => ({
            id: `${i}`,
            startAt: '2026-01-20T06:00:00',
            endAt: '2026-01-20T14:00:00',
        }));

        render(<RiderStatsOverview myShifts={partialShifts} />);
        expect(screen.getByText('Casi ahí')).toBeInTheDocument();
    });

    it('displays continue working message when far from target', () => {
        render(<RiderStatsOverview myShifts={mockShifts} />);
        expect(screen.getByText('Continúa trabajando')).toBeInTheDocument();
    });

    it('handles empty shifts array', () => {
        render(<RiderStatsOverview myShifts={[]} />);
        expect(screen.getByText('0.0h')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('displays trend comparison with last week', () => {
        render(<RiderStatsOverview myShifts={mockShifts} />);
        expect(screen.getByText(/Comparativa con semana anterior/i)).toBeInTheDocument();
    });
});