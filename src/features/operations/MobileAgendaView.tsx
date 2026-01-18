import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Clock, Zap, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import ShiftCard, { ShiftEvent } from './ShiftCard';
import { cn } from '../../lib/utils';
import { CostService, EST_HOURLY_BASE } from '../../services/scheduler/costService';

interface DayInfo {
    isoDate: string;
    label: string;
    dateObj: Date;
}

interface MobileAgendaViewProps {
    days: DayInfo[];
    visualEvents: Record<string, ShiftEvent[]>;
    intelByDay?: Record<string, any[]>;
    onEditShift: (shift: ShiftEvent) => void;
    onDeleteShift: (shiftId: string) => void;
    onAddShift: (isoDate: string) => void;
    readOnly?: boolean;
    expandedShiftId?: string | null;
    isRiderMode?: boolean;
}


const MobileAgendaView: React.FC<MobileAgendaViewProps> = ({
    days,
    visualEvents,
    intelByDay = {}, // Default value to prevent crashes if undefined
    onEditShift,
    onDeleteShift,
    readOnly = false,
    expandedShiftId,
    isRiderMode = false
}) => {
    // HUD Logic: Aggregate Stats
    const stats: {
        totalHours: number;
        earnings: number;
        middayCount: number;
        nightCount: number;
        nextShift: ShiftEvent | null;
    } = useMemo(() => {
        const allShifts = Object.values(visualEvents).flat();
        let totalHours = 0;
        let middayCount = 0;
        let nightCount = 0;

        const now = new Date();
        let nextShift: ShiftEvent | null = null;

        allShifts.forEach(s => {
            const start = new Date(s.startAt);
            const end = new Date(s.endAt);
            const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            totalHours += duration;

            const startHour = start.getHours();
            if (startHour >= 12 && startHour < 18) middayCount++;
            if (startHour >= 20 || startHour < 5) nightCount++;

            if (start > now && (!nextShift || start < new Date(nextShift.startAt))) {
                nextShift = s;
            }
        });

        return {
            totalHours,
            earnings: totalHours * EST_HOURLY_BASE,
            middayCount,
            nightCount,
            nextShift
        };
    }, [visualEvents]);

    return (
        <div className="relative pb-32 min-h-screen bg-slate-50 dark:bg-black transition-colors duration-300">
            <div className="relative z-10 pt-4 pb-12 px-4">

                {/* RIDER HUD - PREMIUM SUMMARY CARD */}
                {isRiderMode && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-6 rounded-[32px] bg-[#1c1c1e] border border-white/5 shadow-2xl relative overflow-hidden group"
                    >
                        {/* Background mesh/glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full -mr-10 -mt-10" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 blur-[40px] rounded-full -ml-8 -mb-8" />

                        <div className="relative z-10 flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                    <TrendingUp size={12} className="text-indigo-400" />
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Resumen Semanal</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-zinc-500">
                                    <Calendar size={12} />
                                    <span className="text-[11px] font-medium">Esta semana</span>
                                </div>
                            </div>

                            <div className="flex items-end justify-between">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-zinc-500 mb-1">Ganancias Est.</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-light text-white tracking-tighter">
                                            {CostService.formatCurrency(stats.earnings)}
                                        </span>
                                        <Wallet size={18} className="text-indigo-400/50 ml-1" />
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1 text-right">Horas Totales</span>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-2xl font-light text-white">{stats.totalHours.toFixed(1)}</span>
                                        <span className="text-sm font-medium text-zinc-600">H</span>
                                    </div>
                                </div>
                            </div>

                            {/* Distribution Indicators */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-zinc-500">MEDIODÍA</span>
                                        <span className="text-sm font-medium text-white">{stats.middayCount} turnos</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-zinc-500">NOCHE</span>
                                        <span className="text-sm font-medium text-white">{stats.nightCount} turnos</span>
                                    </div>
                                </div>
                            </div>

                            {/* NEXT SHIFT CALLOUT */}
                            {stats.nextShift && (
                                <div className="mt-2 flex items-center justify-between p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 group-hover:bg-indigo-500/15 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                            <Zap size={20} className="animate-pulse" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">PRÓXIMO TURNO</span>
                                            <span className="text-sm font-semibold text-white">
                                                Hoy a las {new Date(stats.nextShift.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                <AnimatePresence>
                    {days.map((day, dayIdx) => {
                        const isToday = new Date().toISOString().split('T')[0] === day.isoDate;
                        const dayEvents = visualEvents[day.isoDate] || [];
                        const sortedEvents = [...dayEvents].sort((a, b) =>
                            new Date(a.visualStart).getTime() - new Date(b.visualStart).getTime()
                        );

                        const parts = day.label.split(' ');
                        const dayName = parts[0] || '';
                        const dayNum = parts[1] || '';

                        const dayIcons = intelByDay?.[day.isoDate]?.map((intel, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20" title={intel.title}>
                                {intel.type === 'holiday' && <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tighter">Festivo</span>}
                            </div>
                        ));

                        return (
                            <motion.div
                                key={day.isoDate}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: dayIdx * 0.08 }}
                                className="mb-8"
                            >
                                {/* STICKY DAY HEADER - Apple Style */}
                                <div className="sticky top-0 z-40 -mx-4 px-6 py-3 flex items-center justify-between bg-slate-50/70 dark:bg-black/70 backdrop-blur-xl saturate-150 border-y border-slate-200/50 dark:border-white/5">
                                    <div className="flex items-baseline gap-2">
                                        <span className={cn(
                                            "text-xl font-semibold tracking-tight",
                                            isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-white"
                                        )}>
                                            {dayName.charAt(0).toUpperCase() + dayName.slice(1)}
                                        </span>
                                        <span className="text-xl font-light text-slate-400 dark:text-zinc-500">
                                            {dayNum}
                                        </span>
                                        {isToday && (
                                            <span className="ml-2 px-1.5 py-0.5 rounded-md bg-blue-500/10 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                                                Hoy
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {/* Day Summary Badge */}
                                        {sortedEvents.length > 0 && (
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase border border-slate-200/50 dark:border-white/5">
                                                <Clock size={10} className="text-slate-400 dark:text-zinc-500" />
                                                <span>{sortedEvents.length} {sortedEvents.length === 1 ? 'Turno' : 'Turnos'}</span>
                                            </div>
                                        )}
                                        <div className="flex gap-1">{dayIcons}</div>
                                    </div>
                                </div>

                                <div className="px-5 mt-6 relative">
                                    {/* TIMELINE VERTICAL LINE */}
                                    {sortedEvents.length > 1 && (
                                        <div className="absolute left-[20px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-indigo-500/30 via-slate-200/20 to-indigo-500/30 dark:from-indigo-400/20 dark:via-white/5 dark:to-indigo-400/20" />
                                    )}

                                    {/* SHIFTS or REST? */}
                                    {sortedEvents.length === 0 ? (
                                        // REST CARD - "Zen" Style
                                        <motion.div
                                            initial={{ scale: 0.95, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className={cn(
                                                "p-8 rounded-[32px] border transition-all duration-300 relative overflow-hidden group",
                                                "bg-white dark:bg-[#1c1c1e] border-slate-200/60 dark:border-white/5 shadow-2xl shadow-black/5",
                                                "flex flex-col items-center justify-center text-center gap-4"
                                            )}>
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
                                                <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-zinc-800/80 flex items-center justify-center relative z-10 border border-slate-200/50 dark:border-white/10">
                                                    <span className="text-4xl">🌙</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-xl font-semibold text-slate-800 dark:text-white tracking-tight">Tiempo de Descanso</p>
                                                <p className="text-sm text-slate-400 dark:text-zinc-500 font-medium">Respira profundamente. No tienes turnos.</p>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        // SHIFT CARDS
                                        <div className="flex flex-col gap-4">
                                            {sortedEvents.map((ev, idx) => (
                                                <motion.div
                                                    key={ev.shiftId}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: (dayIdx * 0.08) + (idx * 0.04) }}
                                                >
                                                    <ShiftCard
                                                        event={ev}
                                                        onClick={() => onEditShift(ev)}
                                                        onClone={(_ev, _e) => { }}
                                                        onDelete={(id) => onDeleteShift(id)}
                                                        readOnly={readOnly}
                                                        isExpanded={expandedShiftId === ev.shiftId}
                                                        isRiderMode={isRiderMode}
                                                        style={{ width: '100%' }}
                                                        className="relative z-10"
                                                    />
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Bottom Gradient Fade */}
            <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-[#000000] to-transparent pointer-events-none z-30 opacity-90" />
        </div>
    );
};

export default MobileAgendaView;
