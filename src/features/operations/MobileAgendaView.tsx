import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
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
    isManagerView?: boolean;
}


const MobileAgendaView: React.FC<MobileAgendaViewProps> = ({
    days,
    visualEvents,
    intelByDay = {}, // Default value to prevent crashes if undefined
    onEditShift,
    onDeleteShift,
    readOnly = false,
    expandedShiftId,
    isRiderMode = false,
    isManagerView = false
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

    const [expandedDay, setExpandedDay] = React.useState<string | null>(() => {
        return new Date().toISOString().split('T')[0];
    });

    const toggleDay = (isoDate: string) => {
        setExpandedDay(prev => prev === isoDate ? null : isoDate);
    };

    return (
        <div className="relative pb-32 min-h-screen bg-slate-50 dark:bg-black transition-colors duration-300">
            <div className="relative z-10 pt-4 pb-12 px-4">

                {/* RIDER HUD - PREMIUM SUMMARY CARD */}
                {isRiderMode && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-7 rounded-[2.5rem] bg-[#1c1c1e] border border-white/5 shadow-2xl relative overflow-hidden group"
                    >
                        {/* Background mesh/glow */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-ruby-600/10 blur-[60px] rounded-full -mr-12 -mt-12 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 blur-[40px] rounded-full -ml-8 -mb-8 pointer-events-none" />

                        <div className="relative z-10 flex flex-col gap-7">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                    <TrendingUp size={12} className="text-ruby-500" />
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono">Resumen Semanal</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-zinc-600">
                                    <Calendar size={12} />
                                    <span className="text-[10px] font-black uppercase tracking-tighter">Esta semana</span>
                                </div>
                            </div>

                            <div className="flex items-end justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 font-mono">Ganancias Est.</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black text-white tracking-tighter tabular-nums drop-shadow-md">
                                            {CostService.formatCurrency(stats.earnings).split(',')[0]}
                                        </span>
                                        <span className="text-2xl font-black text-white/30 italic">€</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1 shadow-sm">Horas</span>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-3xl font-black text-white tabular-nums italic">{stats.totalHours.toFixed(1)}</span>
                                        <span className="text-sm font-black text-ruby-600">H</span>
                                    </div>
                                </div>
                            </div>

                            {/* Distribution Indicators */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Mediodía</span>
                                        <span className="text-sm font-black text-white">{stats.middayCount} turnos</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="w-2.5 h-2.5 rounded-full bg-ruby-500 shadow-[0_0_12px_rgba(225,29,72,0.6)]" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Noche</span>
                                        <span className="text-sm font-black text-white">{stats.nightCount} turnos</span>
                                    </div>
                                </div>
                            </div>

                            {/* NEXT SHIFT CALLOUT */}
                            {stats.nextShift && (
                                <div className="mt-1 flex items-center justify-between p-5 rounded-3xl bg-ruby-600 shadow-[0_8px_25px_rgba(225,29,72,0.3)] group-hover:bg-ruby-700 transition-all duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white">
                                            <Zap size={24} className="fill-white animate-pulse" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em] mb-0.5">Siguiente Turno</span>
                                            <span className="text-base font-black text-white tracking-tight">
                                                Hoy {new Date(stats.nextShift.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-sm">
                                        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                <div className="flex flex-col gap-4">
                    {days.map((day, dayIdx) => {
                        const isToday = new Date().toISOString().split('T')[0] === day.isoDate;
                        const dayEvents = visualEvents[day.isoDate] || [];
                        const sortedEvents = [...dayEvents].sort((a, b) =>
                            new Date(a.visualStart).getTime() - new Date(b.visualStart).getTime()
                        );

                        const isExpanded = expandedDay === day.isoDate;

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
                                transition={{ delay: dayIdx * 0.05 }}
                                className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm"
                            >
                                {/* ACCORDION HEADER - CLICKABLE */}
                                <button
                                    onClick={() => toggleDay(day.isoDate)}
                                    className="w-full px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-baseline gap-3">
                                        <span className={cn(
                                            "text-lg font-semibold tracking-tight",
                                            isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-white"
                                        )}>
                                            {dayName.charAt(0).toUpperCase() + dayName.slice(1)}
                                        </span>
                                        <span className="text-lg font-light text-slate-400 dark:text-zinc-500">
                                            {dayNum}
                                        </span>
                                        {isToday && (
                                            <span className="ml-2 px-1.5 py-0.5 rounded-md bg-blue-500/10 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                                                Hoy
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {/* Day Summary Badge (Only if collapsed) */}
                                        {!isExpanded && sortedEvents.length > 0 && (
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200 dark:bg-zinc-800 text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">
                                                <Clock size={10} />
                                                <span>{sortedEvents.length}</span>
                                            </div>
                                        )}
                                        <div className="flex gap-1">{dayIcons}</div>
                                        <ChevronRight
                                            size={20}
                                            className={cn(
                                                "text-slate-400 transition-transform duration-300",
                                                isExpanded ? "rotate-90" : "rotate-0"
                                            )}
                                        />
                                    </div>
                                </button>

                                {/* COLLAPSIBLE CONTENT */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                        >
                                            <div className="px-5 py-6 relative">
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
                                                            "p-8 rounded-[24px] border border-dashed transition-all duration-300 relative overflow-hidden group",
                                                            "bg-slate-50/50 dark:bg-black/20 border-slate-200 dark:border-white/10",
                                                            "flex flex-col items-center justify-center text-center gap-4"
                                                        )}>
                                                        <div className="relative">
                                                            <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full" />
                                                            <div className="w-16 h-16 rounded-full bg-white dark:bg-zinc-800/80 flex items-center justify-center relative z-10 shadow-sm">
                                                                <span className="text-2xl">🌙</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <p className="text-lg font-semibold text-slate-800 dark:text-white tracking-tight">Tiempo de Descanso</p>
                                                            <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">No tienes turnos programados.</p>
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    // SHIFT CARDS
                                                    <div className="flex flex-col gap-4">
                                                        {sortedEvents.map((ev, idx) => (
                                                            <motion.div
                                                                key={ev.shiftId}
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: idx * 0.05 }}
                                                            >
                                                                <ShiftCard
                                                                    event={ev}
                                                                    onClick={() => onEditShift(ev)}
                                                                    onClone={(_ev, _e) => { }}
                                                                    onDelete={(id) => onDeleteShift(id)}
                                                                    readOnly={readOnly}
                                                                    isExpanded={expandedShiftId === ev.shiftId}
                                                                    isRiderMode={isRiderMode}
                                                                    isManagerView={isManagerView}
                                                                    style={{ width: '100%' }}
                                                                    className="relative z-10"
                                                                />
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Gradient Fade */}
            <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-[#000000] to-transparent pointer-events-none z-30 opacity-90" />
        </div>
    );
};

export default MobileAgendaView;
