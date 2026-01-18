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
        <div className="relative pb-32 min-h-screen bg-[#09090b]">


            <div className="space-y-4 relative z-10 px-4 pt-4">
                {days.map((day) => {
                    const isToday = new Date().toISOString().split('T')[0] === day.isoDate;
                    const dayEvents = visualEvents[day.isoDate] || [];
                    const sortedEvents = [...dayEvents].sort((a, b) =>
                        new Date(a.visualStart).getTime() - new Date(b.visualStart).getTime()
                    );

                    // Preparing Label: "LUN 12" or "LUN 12 • HOY"
                    const baseLabel = `${day.label.split(' ')[0]} ${day.label.split(' ')[1]}`.toUpperCase();
                    const dateLabel = isToday ? `${baseLabel} • HOY` : baseLabel;

                    // Preparing Icons
                    const dayIcons = intelByDay?.[day.isoDate]?.map((intel, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-1 rounded-full bg-zinc-800/50 border border-white/5" title={intel.title}>
                            {intel.type === 'holiday' && <span className="text-lg">🎉</span>}
                        </div>
                    ));

                    return (
                        <div key={day.isoDate} className="relative">

                            {/* SHIFTS or REST? */}
                            {sortedEvents.length === 0 ? (
                                // REST CARD
                                <div className={cn(
                                    "p-4 rounded-[24px] border transition-all duration-300 relative overflow-hidden group mb-3",
                                    "bg-[#09090b] border-white/5 hover:bg-[#121214]"
                                )}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={cn(
                                            "text-sm font-medium tracking-tight uppercase",
                                            isToday ? "text-emerald-500" : "text-zinc-500"
                                        )}>
                                            {dateLabel}
                                        </span>
                                        <div className="flex gap-1">{dayIcons}</div>
                                    </div>

                                    <div className="py-4 flex flex-col items-center justify-center opacity-40 group-hover:opacity-60 transition-opacity">
                                        <p className="text-xl font-medium text-zinc-600 tracking-widest uppercase">Descanso</p>
                                    </div>
                                </div>
                            ) : (
                                // SHIFT CARDS - Pass down props to ShiftCard. ShiftCard itself handles card typography internally, 
                                // but we control the header logic here.
                                <div className="flex flex-col gap-0">
                                    {sortedEvents.map((ev, index) => (
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
                                            // Pass Date/Icons mainly to the first card to act as header for that day
                                            dateLabel={index === 0 ? dateLabel : undefined}
                                            intelIcons={index === 0 ? dayIcons : undefined}
                                        />
                                    ))}
                                </div>
                            )}
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
