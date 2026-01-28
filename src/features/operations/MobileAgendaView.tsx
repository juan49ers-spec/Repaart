import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, TrendingUp, ChevronRight, ChevronDown, BarChart3, RefreshCw, Target, ArrowUp, Plus } from 'lucide-react';
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


const MobileAgendaView: React.FC<MobileAgendaViewProps> =({
    days,
    visualEvents,
    intelByDay = {},
    onEditShift,
    onDeleteShift,
    onAddShift,
    readOnly = false,
    expandedShiftId,
    isRiderMode = false,
    isManagerView = false
}) => {
    const [showDetails, setShowDetails] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsRefreshing(false);
    };

    // HUD Logic: Aggregate Stats
    const stats: {
        totalHours: number;
        earnings: number;
        middayCount: number;
        nightCount: number;
        nextShift: ShiftEvent | null;
        weeklyGoal: number;
        goalProgress: number;
        previousWeekEarnings: number;
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

        const earnings = totalHours * EST_HOURLY_BASE;
        const weeklyGoal = earnings * 1.2;
        const goalProgress = (earnings / weeklyGoal) * 100;
        const previousWeekEarnings = earnings * 0.85;

        return {
            totalHours,
            earnings,
            middayCount,
            nightCount,
            nextShift,
            weeklyGoal,
            goalProgress: Math.min(goalProgress, 100),
            previousWeekEarnings
        };
    }, [visualEvents]);

    const [expandedDay, setExpandedDay] = useState<string | null>(() => {
        return new Date().toISOString().split('T')[0];
    });

    const toggleDay = (isoDate: string) => {
        setExpandedDay(prev => prev === isoDate ? null : isoDate);
    };

    return (
        <div className="relative pb-32 min-h-screen bg-slate-50 dark:bg-black transition-colors duration-300">
            <div className="relative z-10 pt-4 pb-12 px-4">

                {/* RIDER HUD - COMPACT PREMIUM SUMMARY CARD */}
                {isRiderMode && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 rounded-2xl bg-[#1c1c1e] border border-white/5 shadow-lg relative overflow-hidden"
                    >
                        {/* Background mesh/glow - Reduced size */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-ruby-600/5 blur-[40px] rounded-full -mr-8 -mt-8 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 blur-[30px] rounded-full -ml-6 -mb-6 pointer-events-none" />

                        <div className="relative z-10">
                            {/* Header - More compact */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-1.5">
                                    <TrendingUp size={10} className="text-ruby-500" />
                                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest font-mono">Resumen Semanal</span>
                                </div>
                                <button
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                    className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
                                >
                                    <RefreshCw size={12} className={cn("text-zinc-400", isRefreshing && "animate-spin")} />
                                </button>
                            </div>

                            {/* Main Stats - Compact */}
                            <div className="flex items-end justify-between mb-3">
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-black text-white tracking-tighter tabular-nums">
                                        {CostService.formatCurrency(stats.earnings).split(',')[0]}
                                    </span>
                                    <span className="text-lg font-black text-white/20">€</span>
                                </div>

                                {/* Weekly Progress Bar */}
                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-1.5">
                                        <Target size={10} className="text-zinc-500" />
                                        <span className="text-[9px] font-medium text-zinc-500">
                                            {stats.goalProgress.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stats.goalProgress}%` }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                            className={cn(
                                                "h-full rounded-full",
                                                stats.goalProgress >= 100 ? "bg-emerald-500" : "bg-ruby-500"
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Expandable Details */}
                            <div className="space-y-2">
                                {/* Summary Stats Row */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        <span className="text-[10px] font-bold text-zinc-400">
                                            {stats.totalHours.toFixed(1)}h
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-ruby-500" />
                                        <span className="text-[10px] font-bold text-zinc-400">
                                            {stats.middayCount + stats.nightCount} turnos
                                        </span>
                                    </div>

                                    {/* Comparison Badge */}
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                        <ArrowUp size={8} className="text-emerald-500" />
                                        <span className="text-[9px] font-bold text-emerald-500">
                                            +15%
                                        </span>
                                    </div>
                                </div>

                                {/* Expand Button */}
                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <span className="text-[10px] font-medium text-zinc-400">
                                        {showDetails ? 'Ocultar' : 'Ver'} detalles
                                    </span>
                                    <ChevronDown size={12} className={cn("text-zinc-400 transition-transform", showDetails && "rotate-180")} />
                                </button>

                                {/* Expanded Details */}
                                <AnimatePresence>
                                    {showDetails && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-2 space-y-2">
                                                {/* Distribution Grid */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Mediodía</span>
                                                            <span className="text-xs font-bold text-white">{stats.middayCount}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-ruby-500" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Noche</span>
                                                            <span className="text-xs font-bold text-white">{stats.nightCount}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Weekly Goal */}
                                                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <Target size={12} className="text-zinc-400" />
                                                        <span className="text-[10px] font-bold text-zinc-400">Objetivo semanal</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-white">
                                                        {CostService.formatCurrency(stats.weeklyGoal)}
                                                    </span>
                                                </div>

                                                {/* Previous Week Comparison */}
                                                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <BarChart3 size={12} className="text-zinc-400" />
                                                        <span className="text-[10px] font-bold text-zinc-400">Semana anterior</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-zinc-400">
                                                        {CostService.formatCurrency(stats.previousWeekEarnings)}
                                                    </span>
                                                </div>

                                                {/* NEXT SHIFT CALLOUT - More Compact */}
                                                {stats.nextShift && (
                                                    <div className="flex items-center justify-between p-3 rounded-xl bg-ruby-600 shadow-lg">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                                                                <Zap size={16} className="fill-white" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[8px] font-bold text-white/60 uppercase tracking-wider">Siguiente</span>
                                                                <span className="text-xs font-bold text-white">
                                                                    {new Date(stats.nextShift.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <ChevronRight size={14} className="text-white/60" />
                                                    </div>
                                                )}

                                                {/* Quick Action Buttons */}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => onAddShift(new Date().toISOString().split('T')[0])}
                                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                                                    >
                                                        <Plus size={12} className="text-zinc-400" />
                                                        <span className="text-[10px] font-bold text-zinc-400">Añadir turno</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
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
                                className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm"
                            >
                                {/* ACCORDION HEADER - CLICKABLE */}
                                <button
                                    onClick={() => toggleDay(day.isoDate)}
                                    className="w-full px-5 py-3.5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-baseline gap-3">
                                        <span className={cn(
                                            "text-base font-semibold tracking-tight",
                                            isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-white"
                                        )}>
                                            {dayName.charAt(0).toUpperCase() + dayName.slice(1)}
                                        </span>
                                        <span className="text-base font-light text-slate-400 dark:text-zinc-500">
                                            {dayNum}
                                        </span>
                                        {isToday && (
                                            <span className="ml-2 px-1.5 py-0.5 rounded-md bg-blue-500/10 text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                                                Hoy
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {/* Day Summary Badge (Only if collapsed) */}
                                        {!isExpanded && sortedEvents.length > 0 && (
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-200 dark:bg-zinc-800 text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase">
                                                <Clock size={10} />
                                                <span>{sortedEvents.length}</span>
                                            </div>
                                        )}
                                        <div className="flex gap-1">{dayIcons}</div>
                                        <ChevronRight
                                            size={18}
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
                                            <div className="px-4 py-5 relative">
                                                {/* TIMELINE VERTICAL LINE */}
                                                {sortedEvents.length > 1 && (
                                                    <div className="absolute left-[18px] top-5 bottom-5 w-[2px] bg-gradient-to-b from-indigo-500/30 via-slate-200/20 to-indigo-500/30 dark:from-indigo-400/20 dark:via-white/5 dark:to-indigo-400/20" />
                                                )}

                                                {/* SHIFTS or REST? */}
                                                {sortedEvents.length === 0 ? (
                                                    // REST CARD - "Zen" Style - Compact
                                                    <motion.div
                                                        initial={{ scale: 0.95, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        className={cn(
                                                            "p-6 rounded-2xl border border-dashed transition-all duration-300 relative overflow-hidden group",
                                                            "bg-slate-50/50 dark:bg-black/20 border-slate-200 dark:border-white/10",
                                                            "flex flex-col items-center justify-center text-center gap-3"
                                                        )}>
                                                        <div className="relative">
                                                            <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full" />
                                                            <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800/80 flex items-center justify-center relative z-10 shadow-sm">
                                                                <span className="text-xl">🌙</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <p className="text-base font-semibold text-slate-800 dark:text-white tracking-tight">Tiempo de Descanso</p>
                                                            <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">No tienes turnos programados.</p>
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    // SHIFT CARDS
                                                    <div className="flex flex-col gap-3">
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
            <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-[#000000] to-transparent pointer-events-none z-30 opacity-90" />
        </div>
    );
};

export default MobileAgendaView;
