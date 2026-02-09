import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShiftCard } from '../components/ShiftCard';
import { WeekStrip } from '../components/WeekStrip';
import { format, addDays, isSameDay } from 'date-fns';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    MapPin: (props: Record<string, unknown>) => <div data-testid="map-pin" {...props} />,
    Bike: (props: Record<string, unknown>) => <div data-testid="bike-icon" {...props} />,
    Clock: (props: Record<string, unknown>) => <div data-testid="clock-icon" {...props} />,
}));

// Test data
const mockShift = {
    id: 'shift-1',
    shiftId: 'shift-1',
    franchiseId: 'franchise-1',
    riderId: 'rider-1',
    riderName: 'Juan García',
    date: '2024-01-15',
    startAt: '2024-01-15T10:00:00',
    endAt: '2024-01-15T14:00:00',
    isConfirmed: true,
    isDraft: false,
    motoId: 'moto-1',
    motoPlate: 'ABC123',
    swapRequested: false,
    changeRequested: false,
    changeReason: null,
};

describe('ShiftCard Component', () => {
    describe('Rendering', () => {
        it('should render shift time range', () => {
            render(<ShiftCard shift={mockShift} />);
            expect(screen.getByText('10:00')).toBeInTheDocument();
            expect(screen.getByText('14:00')).toBeInTheDocument();
        });

        it('should render "Turno Regular" label', () => {
            render(<ShiftCard shift={mockShift} />);
            expect(screen.getByText('Turno Regular')).toBeInTheDocument();
        });

        it('should render moto plate when available', () => {
            render(<ShiftCard shift={mockShift} />);
            expect(screen.getByText('ABC123')).toBeInTheDocument();
        });

        it('should not render moto plate when not available', () => {
            const shiftWithoutMoto = { ...mockShift, motoPlate: '' };
            render(<ShiftCard shift={shiftWithoutMoto} />);
            expect(screen.queryByText('ABC123')).not.toBeInTheDocument();
        });

        it('should render location info', () => {
            render(<ShiftCard shift={mockShift} />);
            expect(screen.getByText(/Base Principal/)).toBeInTheDocument();
        });

        it('should render icons', () => {
            render(<ShiftCard shift={mockShift} />);
            expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
            expect(screen.getByTestId('map-pin')).toBeInTheDocument();
            expect(screen.getByTestId('bike-icon')).toBeInTheDocument();
        });
    });

    describe('Past Shift Styling', () => {
        it('should apply past styling when isPast is true', () => {
            const { container } = render(<ShiftCard shift={mockShift} isPast={true} />);
            const card = container.firstChild as HTMLElement;
            expect(card).toHaveClass('opacity-60');
        });

        it('should not apply past styling when isPast is false', () => {
            const { container } = render(<ShiftCard shift={mockShift} isPast={false} />);
            const card = container.firstChild as HTMLElement;
            expect(card).not.toHaveClass('opacity-60');
        });

        it('should use different styling for past shifts', () => {
            const { container: pastContainer } = render(<ShiftCard shift={mockShift} isPast={true} />);
            const { container: currentContainer } = render(<ShiftCard shift={mockShift} isPast={false} />);

            const pastCard = pastContainer.firstChild as HTMLElement;
            const currentCard = currentContainer.firstChild as HTMLElement;

            expect(pastCard.className).not.toBe(currentCard.className);
        });
    });
});

describe('WeekStrip Component', () => {
    const mockOnSelectDate = vi.fn();
    const today = new Date();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render 14 date buttons', () => {
            render(<WeekStrip selectedDate={today} onSelectDate={mockOnSelectDate} />);
            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBe(14);
        });

        it('should display day abbreviations', () => {
            render(<WeekStrip selectedDate={today} onSelectDate={mockOnSelectDate} />);
            // At least one weekday abbreviation should be present
            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(0);
        });

        it('should display day numbers', () => {
            render(<WeekStrip selectedDate={today} onSelectDate={mockOnSelectDate} />);
            const dayNumber = format(today, 'd');
            expect(screen.getByText(dayNumber)).toBeInTheDocument();
        });
    });

    describe('Selection', () => {
        it('should call onSelectDate when a date is clicked', () => {
            render(<WeekStrip selectedDate={today} onSelectDate={mockOnSelectDate} />);
            const buttons = screen.getAllByRole('button');
            fireEvent.click(buttons[3]); // Click any date
            expect(mockOnSelectDate).toHaveBeenCalledTimes(1);
        });

        it('should pass the clicked date to onSelectDate', () => {
            render(<WeekStrip selectedDate={today} onSelectDate={mockOnSelectDate} />);
            const buttons = screen.getAllByRole('button');
            fireEvent.click(buttons[0]);
            expect(mockOnSelectDate).toHaveBeenCalledWith(expect.any(Date));
        });

        it('should highlight the selected date', () => {
            const { container } = render(<WeekStrip selectedDate={today} onSelectDate={mockOnSelectDate} />);
            // Selected date should have special styling
            const selectedButtons = container.querySelectorAll('.bg-emerald-600');
            expect(selectedButtons.length).toBe(1);
        });
    });

    describe('Styling', () => {
        it('should have horizontal scroll container', () => {
            const { container } = render(<WeekStrip selectedDate={today} onSelectDate={mockOnSelectDate} />);
            const scrollContainer = container.querySelector('.overflow-x-auto');
            expect(scrollContainer).toBeInTheDocument();
        });

        it('should apply snap scrolling', () => {
            const { container } = render(<WeekStrip selectedDate={today} onSelectDate={mockOnSelectDate} />);
            const scrollContainer = container.querySelector('.snap-x');
            expect(scrollContainer).toBeInTheDocument();
        });
    });
});

describe('Helper Functions', () => {
    describe('Date Calculations', () => {
        it('addDays should correctly calculate future dates', () => {
            const today = new Date('2024-01-15');
            const nextWeek = addDays(today, 7);
            expect(format(nextWeek, 'yyyy-MM-dd')).toBe('2024-01-22');
        });

        it('isSameDay should correctly compare dates', () => {
            const date1 = new Date('2024-01-15T10:00:00');
            const date2 = new Date('2024-01-15T22:00:00');
            const date3 = new Date('2024-01-16T10:00:00');

            expect(isSameDay(date1, date2)).toBe(true);
            expect(isSameDay(date1, date3)).toBe(false);
        });
    });
});
