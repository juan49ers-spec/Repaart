import React from 'react';
import { Plus, Calendar, CloudRain } from 'lucide-react';
import ShiftCard from './ShiftCard';

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

const TeamLogo: React.FC<{ src?: string, name?: string, size?: number }> = ({ src, name = '?', size = 20 }) => {
    const [error, setError] = React.useState(false);
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    if (!src || error) {
        return (
            <div
                style={{ width: size, height: size }}
                className="rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center border border-white/20 shadow-inner"
            >
                <span className="text-[8px] font-black text-white/90 tracking-tighter">{initials}</span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={name}
            style={{ width: size, height: size }}
            className="object-contain drop-shadow-md rounded-full bg-white/10 p-0.5"
            onError={() => setError(true)}
        />
    );
};

const getDayDemandLevel = (dayDate: string, dayIntel: any[]) => {
    const hasCritical = dayIntel.some(e => e.severity === 'critical');
    const hasWarning = dayIntel.some(e => e.severity === 'warning');
    const dayOfWeek = new Date(dayDate).getDay(); // 0: Sun, 5: Fri, 6: Sat

    if (hasCritical) return 'critical';
    if (hasWarning || [0, 5, 6].includes(dayOfWeek)) return 'warning';
    return 'normal';
};

const MobileAgendaView: React.FC<MobileAgendaViewProps> = ({
    days,
    visualEvents,
    intelByDay = {},
    onEditShift,
    onDeleteShift,
    onAddShift,
    readOnly = false,
    expandedShiftId,
    isRiderMode = false
}) => {
    return (
        <div className="space-y-6 pb-20">
            {days.map((day) => {
                const isToday = new Date().toISOString().split('T')[0] === day.isoDate;
                const dayEvents = visualEvents[day.isoDate] || [];
                const sortedEvents = [...dayEvents].sort((a, b) =>
                    new Date(a.visualStart).getTime() - new Date(b.visualStart).getTime()
                );

                const dayIntel = intelByDay[day.isoDate] || [];
                const demandLevel = getDayDemandLevel(day.isoDate, dayIntel);
                const dayDate = new Date(day.isoDate);
                const isWeekend = [0, 5, 6].includes(dayDate.getDay());

                return (
                    <div key={day.isoDate} className="space-y-3">
                        {/* Day Header */}
                        <div className={`
                            flex items-center justify-between sticky top-0 z-10 p-3 rounded-2xl backdrop-blur-md border shadow-lg transition-all
                            ${isToday ? 'bg-indigo-50/90 border-indigo-200 shadow-indigo-100/50' :
                                demandLevel === 'critical' ? 'bg-rose-50/95 border-rose-200 shadow-rose-200/20' :
                                    demandLevel === 'warning' ? 'bg-amber-50/95 border-amber-200 shadow-amber-100/20' :
                                        'bg-emerald-50/80 border-emerald-100'
                            }
                            ${isWeekend ? 'ring-2 ring-slate-200/50' : ''}
                        `}>
                            {/* Accent Top Bar */}
                            <div className={`
                                absolute top-0 left-6 right-6 h-1 rounded-full 
                                ${demandLevel === 'critical' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' :
                                    demandLevel === 'warning' ? 'bg-amber-500' :
                                        'bg-emerald-500/40'}
                            `} />

                            <div className="flex flex-col gap-2 w-full pr-10">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`text-3xl font-bold tracking-tight ${isToday ? 'text-indigo-600' : 'text-slate-800'}`}>
                                            {day.label.split(' ')[1]}
                                        </div>
                                        <div className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${isToday ? 'text-indigo-500' : 'text-slate-400'}`}>
                                            {day.label.split(' ')[0]}
                                        </div>
                                    </div>
                                    {isWeekend && (
                                        <div className="px-2 py-0.5 rounded-full bg-slate-900/5 text-slate-500 text-[8px] font-black uppercase tracking-widest">
                                            Peak Day
                                        </div>
                                    )}
                                </div>

                                {/* High-Impact Mobile Intel Badges */}
                                {dayIntel.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {dayIntel.map((event: any) => {
                                            const isMatch = event.type === 'match';
                                            const isLive = event.metadata?.isLive;

                                            return (
                                                <div
                                                    key={event.id}
                                                    className={`
                                                        flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold shadow-sm backdrop-blur-md relative overflow-hidden
                                                        ${event.severity === 'critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-800 ring-1 ring-rose-500/5 shadow-rose-500/10' :
                                                            event.severity === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-800 ring-1 ring-amber-500/5 shadow-amber-500/10' :
                                                                'bg-emerald-500/5 border-emerald-500/10 text-emerald-800 ring-1 ring-emerald-500/5'}
                                                    `}
                                                >
                                                    {isLive && <div className="absolute inset-0 bg-rose-500/5 animate-pulse" />}

                                                    {isMatch ? (
                                                        <div className="flex items-center gap-2 relative z-10">
                                                            <div className="flex -space-x-2 items-center">
                                                                <TeamLogo src={event.metadata?.teamLogo} name={event.metadata?.team} size={18} />
                                                                <TeamLogo src={event.metadata?.opponentLogo} name={event.metadata?.opponent} size={18} />
                                                            </div>
                                                            <span className="font-black text-[9px] bg-slate-950/90 text-white px-1.5 py-0.5 rounded-lg ml-1 shadow-sm">
                                                                {isLive ? `${event.metadata?.score?.home}-${event.metadata?.score?.away} LIVE` : new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 relative z-10">
                                                            {event.type === 'weather' ? <CloudRain size={12} /> : <Calendar size={12} />}
                                                            <span className="truncate max-w-[120px]">{event.title}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => onAddShift(day.isoDate)}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full shadow-lg active:scale-95 transition-all
                                    ${isToday ? 'bg-indigo-600 text-white shadow-indigo-500/30' : 'bg-slate-800 text-white shadow-slate-800/20'}
                                    ${readOnly ? 'hidden' : ''}
                                `}
                                title="Añadir turno"
                            >
                                <Plus size={18} />
                            </button>
                        </div>

                        {/* Shifts List */}
                        <div className="pl-4 space-y-3 border-l-2 border-emerald-100 ml-4 relative">
                            {sortedEvents.length === 0 ? (
                                <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-slate-400 text-sm italic">
                                    Sin turnos programados
                                </div>
                            ) : (
                                sortedEvents.map((ev) => (
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
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default MobileAgendaView;
