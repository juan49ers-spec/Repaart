import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MobileAgendaView from '../../operations/MobileAgendaView';
import { useAuth } from '../../../context/AuthContext';
import { useRiderStore } from '../../../store/useRiderStore';

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

export const RiderScheduleView: React.FC = () => {
    const { user } = useAuth();
    const { myShifts, fetchMyShifts } = useRiderStore();
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Calculate Week Range
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday start
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    const agendaDays = getWeekDays(weekStart);

    // Fetch Shifts via Store (Centralized)
    useEffect(() => {
        if (user?.uid) {
            fetchMyShifts(user.uid);
        }
    }, [user, fetchMyShifts]);

    // Filter Shifts for Selected Week
    const visualEvents = useMemo(() => {
        // Filter shifts that fall within the current week view
        const weeklyShifts = myShifts.filter(s =>
            isWithinInterval(new Date(s.startAt), { start: weekStart, end: weekEnd })
        );

        return weeklyShifts.reduce((acc, shift) => {
            const dateKey = shift.date; // shift.date is YYYY-MM-DD
            if (!acc[dateKey]) acc[dateKey] = [];

            // Map shift to the format expected by ShiftCard/MobileAgendaView
            acc[dateKey].push({
                shiftId: shift.shiftId,
                riderId: shift.riderId,
                riderName: shift.riderName,
                startAt: shift.startAt,
                endAt: shift.endAt,
                visualStart: new Date(shift.startAt),
                visualEnd: new Date(shift.endAt),
                isConfirmed: shift.isConfirmed || false,
                swapRequested: shift.swapRequested || false,
                motoAssignments: shift.motoId ? [{
                    motoId: shift.motoId,
                    plate: shift.motoPlate,
                    startAt: shift.startAt,
                    endAt: shift.endAt
                }] : []
            });
            return acc;
        }, {} as Record<string, any[]>);
    }, [myShifts, weekStart, weekEnd]);

    // Calculate Weekly Metrics
    const totalHours = useMemo(() => {
        const weeklyShifts = myShifts.filter(s =>
            isWithinInterval(new Date(s.startAt), { start: weekStart, end: weekEnd })
        );
        return weeklyShifts.reduce((acc, s) => {
            const start = new Date(s.startAt).getTime();
            const end = new Date(s.endAt).getTime();
            return acc + (end - start) / (1000 * 60 * 60);
        }, 0);
    }, [myShifts, weekStart, weekEnd]);

    const handlePrevWeek = () => setSelectedDate(d => subWeeks(d, 1));
    const handleNextWeek = () => setSelectedDate(d => addWeeks(d, 1));

    return (
        <div className="flex flex-col gap-6 pb-20">
            {/* WEEK NAV HEADER */}
            <div className="sticky top-0 z-30 -mx-4 px-4 py-6 glass-premium border-b border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handlePrevWeek}
                            className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400"
                            aria-label="Semana anterior"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="text-center">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400">Semana</h2>
                            <p className="text-xl font-black text-white leading-none mt-1">
                                {format(weekStart, 'd MMM')} - {format(weekEnd, 'd MMM', { locale: es })}
                            </p>
                        </div>
                        <button
                            onClick={handleNextWeek}
                            className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400"
                            aria-label="Semana siguiente"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <div className="px-5 py-3 bg-slate-900/40 rounded-2xl border border-white/5 text-right">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Horas</span>
                            <span className="text-lg font-black text-white">{totalHours.toFixed(1)}h</span>
                        </div>
                    </div>
                </div>
            </div>

            <MobileAgendaView
                days={agendaDays}
                visualEvents={visualEvents}
                onEditShift={() => { }}
                onDeleteShift={() => { }}
                onAddShift={() => { }}
                readOnly={false}
                isRiderMode={true}
            />
        </div>
    );
};

export default RiderScheduleView;
