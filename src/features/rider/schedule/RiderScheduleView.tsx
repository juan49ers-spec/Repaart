import * as React from 'react';
import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useOperationsIntel, intelService } from '../../../services/intelService';
import MobileAgendaView from '../../operations/MobileAgendaView';
import { shiftService, Shift } from '../../../services/shiftService';
import { useAuth, AuthUser } from '../../../context/AuthContext';

// Helper to generate day columns
const getWeekDays = (start: Date) => {
    return Array.from({ length: 7 }).map((_, i) => {
        const date = addDays(start, i);
        return {
            isoDate: format(date, 'yyyy-MM-dd'),
            label: format(date, 'EEE d', { locale: es }),
            dateObj: date
        };
    });
};

const RiderScheduleView: React.FC = () => {
    const { user } = useAuth() as { user: AuthUser | null };
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [expandedShiftId, setExpandedShiftId] = useState<string | null>(null);

    // Real Data Hooks
    const { events: intelEvents } = useOperationsIntel(selectedDate);

    // Group events for the view
    const intelByDay = React.useMemo(() => {
        return intelService.getEventsByDay(intelEvents);
    }, [intelEvents]);

    // Calculate Week Range
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    const agendaDays = getWeekDays(weekStart);

    // Fetch Shifts Real-time
    useEffect(() => {
        if (!user?.uid) return;
        const unsubscribe = shiftService.getMyShifts(user.uid, weekStart, weekEnd, (data) => setShifts(data));
        return () => unsubscribe();
    }, [user?.uid, weekStart, weekEnd]);

    // Transform Shifts
    const visualEvents = React.useMemo(() => {
        return shifts.reduce((acc, shift) => {
            const dateKey = shift.date;
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push({
                shiftId: shift.shiftId,
                riderId: shift.riderId,
                riderName: shift.riderName,
                startAt: shift.startAt,
                endAt: shift.endAt,
                visualStart: new Date(shift.startAt),
                visualEnd: new Date(shift.endAt),
                isConfirmed: shift.isConfirmed,
                swapRequested: shift.swapRequested,
                changeRequested: shift.changeRequested,
                changeReason: shift.changeReason,
                isDraft: shift.isDraft,
                franchiseId: shift.franchiseId,
                motoAssignments: shift.motoId ? [{
                    motoId: shift.motoId,
                    plate: shift.motoPlate,
                    startAt: shift.startAt,
                    endAt: shift.endAt
                }] : []
            });
            return acc;
        }, {} as Record<string, any[]>);
    }, [shifts]);

    // Metrics
    const totalHours = React.useMemo(() => {
        return shifts.reduce((acc, s) => {
            const start = new Date(s.startAt).getTime();
            const end = new Date(s.endAt).getTime();
            return acc + (end - start) / (1000 * 60 * 60);
        }, 0);
    }, [shifts]);

    const handlePrevWeek = () => setSelectedDate(d => subWeeks(d, 1));
    const handleNextWeek = () => setSelectedDate(d => addWeeks(d, 1));

    // Dynamic Date Range String
    const dateRangeLabel = React.useMemo(() => {
        const startMonth = format(weekStart, 'MMM', { locale: es });
        const endMonth = format(weekEnd, 'MMM', { locale: es });

        if (startMonth === endMonth) {
            return `${format(weekStart, 'd', { locale: es })} — ${format(weekEnd, 'd MMM', { locale: es })}`;
        }
        return `${format(weekStart, 'd MMM', { locale: es })} — ${format(weekEnd, 'd MMM', { locale: es })}`;
    }, [weekStart, weekEnd]);

    return (
        <div className="flex flex-col gap-4 pb-20">
            {/* COMPACT DASHBOARD HEADER */}
            <div className="sticky top-0 z-30 pt-4 pb-2 bg-[#09090b]">
                <div className="mx-3 rounded-[24px] bg-[#121214] border border-white/5 shadow-2xl relative overflow-hidden h-[72px] flex items-center px-4">

                    {/* CENTERED NAVIGATION GROUP (Absolute Center) */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
                        <button
                            onClick={handlePrevWeek}
                            className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-white transition-colors active:scale-90 rounded-full hover:bg-white/5"
                            aria-label="Semana anterior"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <span className="text-lg font-bold text-white tracking-tight capitalize min-w-[140px] text-center">
                            {dateRangeLabel}
                        </span>

                        <button
                            onClick={handleNextWeek}
                            className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-white transition-colors active:scale-90 rounded-full hover:bg-white/5"
                            aria-label="Semana siguiente"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Hours Metric (Pushed to the far right) */}
                    <div className="ml-auto z-20 flex flex-col items-end justify-center">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] leading-none mb-1">HORAS</span>
                        <span className="text-lg font-bold text-white tracking-tighter leading-none">{totalHours.toFixed(1)}h</span>
                    </div>
                </div>
            </div>

            <MobileAgendaView
                days={agendaDays}
                visualEvents={visualEvents}
                intelByDay={intelByDay}
                onEditShift={(s) => setExpandedShiftId(expandedShiftId === (s.shiftId || s.id) ? null : (s.shiftId || s.id))}
                onDeleteShift={() => { }}
                onAddShift={() => { }}
                readOnly={true}
                isRiderMode={true}
                expandedShiftId={expandedShiftId}
            />
        </div>
    );
};

export default RiderScheduleView;
