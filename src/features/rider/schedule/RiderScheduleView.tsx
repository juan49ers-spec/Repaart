import * as React from 'react';
import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useOperationsIntel, intelService } from '../../../services/intelService';
import MobileAgendaView from '../../operations/MobileAgendaView';
import { ShiftEvent } from '../../operations/ShiftCard';
import { shiftService, Shift } from '../../../services/shiftService';
import { useAuth, AuthUser } from '../../../context/AuthContext';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

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
        }, {} as Record<string, ShiftEvent[]>);
    }, [shifts]);

    // Shifts pending rider confirmation
    const unconfirmedShifts = React.useMemo(
        () => shifts.filter(s => !s.isConfirmed && !s.isDraft),
        [shifts]
    );

    const handleConfirmShift = async (shiftId: string) => {
        // Optimistic UI: Guardamos backup y mutamos instantáneamente en local (0ms lag)
        const previousShifts = [...shifts];
        setShifts(prev => prev.map(s => s.shiftId === shiftId ? { ...s, isConfirmed: true } : s));
        
        toast.success('¡Turno confirmado!', {
            icon: '🚀',
            style: { borderRadius: '16px', background: '#10B981', color: '#fff', fontWeight: 'bold' },
            duration: 2000,
        });

        try {
            // Se envía a Firebase (con caché persistente esto es súper rápido o en diferido si está offline)
            await shiftService.confirmShift(shiftId);
        } catch (error) {
            // Rollback UI si falla por algún motivo de base de datos
            setShifts(previousShifts);
            toast.error('Error de conexión. Se revertió el estado.', {
                style: { borderRadius: '16px' }
            });
            console.error('Error confirming shift:', error);
        }
    };

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
            <div className="sticky top-0 z-30 pt-4 pb-2 bg-[#f4f7fb]/90 backdrop-blur-md">
                <div className="mx-6 rounded-[2rem] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden h-[72px] flex items-center px-4">

                    {/* CENTERED NAVIGATION GROUP (Absolute Center) */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
                        <button
                            onClick={handlePrevWeek}
                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors active:scale-90 rounded-full hover:bg-slate-50"
                            aria-label="Semana anterior"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <span className="text-lg font-black text-slate-800 tracking-tight capitalize min-w-[140px] text-center">
                            {dateRangeLabel}
                        </span>

                        <button
                            onClick={handleNextWeek}
                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors active:scale-90 rounded-full hover:bg-slate-50"
                            aria-label="Semana siguiente"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Hours Metric (Pushed to the far right) */}
                    <div className="ml-auto z-20 flex flex-col items-end justify-center pr-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">HORAS</span>
                        <span className="text-lg font-black text-cyan-600 tracking-tighter leading-none">{totalHours.toFixed(1)}h</span>
                    </div>
                </div>
            </div>

            {/* Pending confirmation banner (Premium & Dark Mode Ready) */}
            {unconfirmedShifts.length > 0 && (
                <div className="mx-3 mb-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/10 p-4 space-y-3 transition-all duration-300">
                    <p className="text-[10px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        {unconfirmedShifts.length} turno{unconfirmedShifts.length > 1 ? 's' : ''} por confirmar
                    </p>
                    <div className="flex flex-col gap-2">
                        {unconfirmedShifts.map(shift => (
                            <div key={shift.shiftId} className="flex items-center justify-between bg-white/40 dark:bg-[#111827]/40 backdrop-blur-sm shadow-sm border border-white/50 dark:border-white/5 rounded-xl px-3 py-2.5 transition-all">
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                                    {format(new Date(shift.startAt), 'EEE d MMM', { locale: es })}
                                    <span className="mx-1.5 opacity-40">·</span>
                                    {format(new Date(shift.startAt), 'HH:mm')}–{format(new Date(shift.endAt), 'HH:mm')}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleConfirmShift(shift.shiftId)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                                >
                                    <CheckCircle2 size={14} />
                                    Confirmar
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <MobileAgendaView
                days={agendaDays}
                visualEvents={visualEvents}
                intelByDay={intelByDay}
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
