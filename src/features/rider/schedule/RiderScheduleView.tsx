import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MobileAgendaView from '../../operations/MobileAgendaView';
import { shiftService, Shift } from '../../../services/shiftService';
import { useAuth } from '../../../context/AuthContext';

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
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [expandedShiftId, setExpandedShiftId] = useState<string | null>(null);

    // Calculate Week Range
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday start
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    const agendaDays = getWeekDays(weekStart);

    // Fetch Shifts Real-time
    useEffect(() => {
        if (!user?.uid) return;

        // Subscribe to my shifts for the designated week range
        const unsubscribe = shiftService.getMyShifts(
            user.uid,
            weekStart,
            weekEnd,
            (data) => {
                setShifts(data);
            }
        );

        return () => unsubscribe();
    }, [user?.uid, weekStart, weekEnd]);

    // Transform Shifts for MobileAgendaView
    const visualEvents = shifts.reduce((acc, shift) => {
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
            motoAssignments: shift.motoId ? [{
                motoId: shift.motoId,
                plate: shift.motoPlate,
                startAt: shift.startAt,
                endAt: shift.endAt
            }] : []
        });
        return acc;
    }, {} as Record<string, any[]>);

    // Calculate Weekly Metrics
    const totalHours = shifts.reduce((acc, s) => {
        const start = new Date(s.startAt).getTime();
        const end = new Date(s.endAt).getTime();
        return acc + (end - start) / (1000 * 60 * 60);
    }, 0);

    const handlePrevWeek = () => setSelectedDate(d => subWeeks(d, 1));
    const handleNextWeek = () => setSelectedDate(d => addWeeks(d, 1));

    return (
        <div className="flex flex-col gap-6 pb-20">
            {/* WEEK NAV HEADER */}
            <div className="sticky top-0 z-30 -mx-4 px-4 py-6 glass-premium border-b border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={handlePrevWeek} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="text-center">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400">Semana</h2>
                            <p className="text-xl font-black text-white leading-none mt-1">
                                {format(weekStart, 'd MMM')} - {format(weekEnd, 'd MMM', { locale: es })}
                            </p>
                        </div>
                        <button onClick={handleNextWeek} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400">
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
                onEditShift={(s) => setExpandedShiftId(expandedShiftId === s.shiftId ? null : s.shiftId)}
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
