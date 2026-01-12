import React from 'react';
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
    onAddShift?: (isoDate: string) => void;
    readOnly?: boolean;
    isRiderMode?: boolean;
}

const MobileAgendaView: React.FC<MobileAgendaViewProps> = ({
    days,
    visualEvents,
    onEditShift,
    onDeleteShift,
    readOnly = false,
    isRiderMode = false
}) => {
    return (
        <div className="relative pb-24 px-4 pt-4 min-h-[80vh]">
            {/* Timeline Spine */}
            <div className="absolute left-[27px] top-4 bottom-0 w-0.5 bg-gradient-to-b from-slate-800 via-slate-700 to-transparent" />

            {days.map((day) => {
                const isToday = new Date().toISOString().split('T')[0] === day.isoDate;
                const dayEvents = visualEvents[day.isoDate] || [];
                const sortedEvents = [...dayEvents].sort((a, b) =>
                    new Date(a.visualStart).getTime() - new Date(b.visualStart).getTime()
                );

                const hasEvents = sortedEvents.length > 0;
                const dateNum = day.label.split(' ')[1];
                const dayName = day.label.split(' ')[0];

                return (
                    <div key={day.isoDate} className={`relative mb-3 ${!hasEvents && !isToday ? 'opacity-50 hover:opacity-100 transition-opacity' : ''}`}>

                        {/* Day Node & Date Header */}
                        <div className="flex items-center gap-3 mb-2 relative z-10">
                            {/* Circle Node */}
                            <div className={`
                                w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-[2px] shadow-sm z-10 transition-all duration-300
                                ${isToday
                                    ? 'bg-indigo-500 border-indigo-900 shadow-indigo-500/50 scale-105'
                                    : hasEvents
                                        ? 'bg-slate-900 border-slate-700'
                                        : 'bg-slate-950 border-slate-800'
                                }
                            `}>
                                {isToday && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                            </div>

                            {/* Date Text */}
                            <div className="flex items-baseline gap-2">
                                <span className={`text-xl font-black tracking-tighter ${isToday ? 'text-indigo-400' : 'text-white'}`}>
                                    {dateNum}
                                </span>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? 'text-indigo-500' : 'text-slate-500'}`}>
                                    {dayName}
                                </span>
                                {isToday && (
                                    <span className="text-[8px] font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0 rounded-full border border-indigo-500/30">
                                        HOY
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Events Container */}
                        <div className="pl-8 space-y-2 relative">
                            {sortedEvents.length === 0 ? (
                                <div className="h-12 border-l-2 border-dashed border-slate-800 ml-[-20px] pl-6 flex items-center text-slate-700 text-xs italic font-medium">
                                    No hay turnos
                                </div>
                            ) : (
                                sortedEvents.map((ev) => (
                                    <ShiftCard
                                        key={ev.shiftId}
                                        event={ev}
                                        onClick={() => onEditShift(ev)}
                                        onClone={() => { }}
                                        onDelete={onDeleteShift}
                                        readOnly={readOnly}
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
