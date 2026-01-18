import React from 'react';
import ShiftCard from './ShiftCard';
import { cn } from '../../lib/utils';

interface DayInfo {
    isoDate: string;
    label: string;
    dateObj: Date;
}

interface MobileAgendaViewProps {
    days: DayInfo[];
    visualEvents: Record<string, any[]>;
    intelByDay?: Record<string, any[]>;
    onEditShift: (shift: any) => void;
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
    return (
        <div className="relative pb-32 min-h-screen bg-slate-50 dark:bg-black transition-colors duration-300">


            <div className="relative z-10 pt-2 pb-12">
                {days.map((day) => {
                    const isToday = new Date().toISOString().split('T')[0] === day.isoDate;
                    const dayEvents = visualEvents[day.isoDate] || [];
                    const sortedEvents = [...dayEvents].sort((a, b) =>
                        new Date(a.visualStart).getTime() - new Date(b.visualStart).getTime()
                    );

                    // Robust Date Formatting
                    const parts = day.label.split(' ');
                    const dayName = parts[0] || '';
                    const dayNum = parts[1] || '';

                    // Preparing Icons
                    const dayIcons = intelByDay?.[day.isoDate]?.map((intel, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20" title={intel.title}>
                            {intel.type === 'holiday' && <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tighter">Festivo</span>}
                        </div>
                    ));

                    return (
                        <div key={day.isoDate} className="mb-8">
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
                                <div className="flex gap-2">{dayIcons}</div>
                            </div>

                            <div className="px-4 mt-4 space-y-3">
                                {/* SHIFTS or REST? */}
                                {sortedEvents.length === 0 ? (
                                    // REST CARD - Refined
                                    <div className={cn(
                                        "p-6 rounded-[28px] border transition-all duration-300 relative overflow-hidden group",
                                        "bg-white dark:bg-[#1c1c1e] border-slate-200/60 dark:border-white/5 shadow-sm",
                                        "flex items-center justify-between"
                                    )}>
                                        <div className="flex flex-col">
                                            <p className="text-lg font-medium text-slate-400 dark:text-zinc-500 tracking-tight">Día de Descanso</p>
                                            <p className="text-xs text-slate-300 dark:text-zinc-600">No hay turnos programados</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-center opacity-40">
                                            <span className="text-2xl">🌙</span>
                                        </div>
                                    </div>
                                ) : (
                                    // SHIFT CARDS
                                    <div className="flex flex-col gap-3">
                                        {sortedEvents.map((ev) => (
                                            <ShiftCard
                                                key={ev.shiftId}
                                                event={ev}
                                                onClick={() => onEditShift(ev)}
                                                onClone={(_ev, _e) => { }}
                                                onDelete={(id) => onDeleteShift(id)}
                                                readOnly={readOnly}
                                                isExpanded={expandedShiftId === ev.shiftId}
                                                isRiderMode={isRiderMode}
                                                style={{ width: '100%' }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Gradient Fade */}
            <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#09090b] to-transparent pointer-events-none z-30" />
        </div>
    );
};

export default MobileAgendaView;
