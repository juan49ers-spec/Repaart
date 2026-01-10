import React from 'react';
import ShiftCard from './ShiftCard';
import { Plus } from 'lucide-react';

// Reusing interfaces would be better if shared, but for now defining compatible ones
// Interfaces removed


interface DayInfo {
    isoDate: string;
    label: string;
    dateObj: Date;
}

interface MobileAgendaViewProps {
    days: DayInfo[];
    visualEvents: Record<string, any[]>;
    onEditShift: (shift: any) => void;
    onDeleteShift: (shiftId: string) => void;
    onAddShift: (isoDate: string) => void;
}

const MobileAgendaView: React.FC<MobileAgendaViewProps> = ({
    days,
    visualEvents,
    onEditShift,
    onDeleteShift,
    onAddShift
}) => {
    return (
        <div className="space-y-6 pb-20">
            {days.map((day) => {
                const dayEvents = visualEvents[day.isoDate] || [];
                // Sort by time
                const sortedEvents = [...dayEvents].sort((a, b) =>
                    new Date(a.visualStart).getTime() - new Date(b.visualStart).getTime()
                );

                const isToday = new Date().toISOString().split('T')[0] === day.isoDate;

                return (
                    <div key={day.isoDate} className="space-y-3">
                        {/* Day Header */}
                        <div className={`flex items-center justify-between sticky top-0 z-10 p-2 rounded-lg backdrop-blur-md border shadow-sm ${isToday
                            ? 'bg-blue-50/90 border-blue-200 text-blue-800'
                            : 'bg-white/90 border-slate-200 text-slate-700'
                            }`}>
                            <div className="flex items-center gap-3">
                                <div className={`text-2xl font-bold ${isToday ? 'text-blue-600' : 'text-slate-800'}`}>
                                    {day.label.split(' ')[1]}
                                </div>
                                <div className="text-sm font-bold uppercase tracking-wider opacity-80">
                                    {day.label.split(' ')[0]}
                                </div>
                            </div>
                            <button
                                onClick={() => onAddShift(day.isoDate)}
                                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md active:scale-95 transition-all"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        {/* Shifts List */}
                        <div className="pl-4 space-y-3 border-l-2 border-slate-200 ml-4 relative">
                            {sortedEvents.length === 0 ? (
                                <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-slate-400 text-sm">
                                    Sin turnos programados
                                </div>
                            ) : (
                                sortedEvents.map((ev) => (
                                    <ShiftCard
                                        key={ev.shiftId}
                                        event={ev}
                                        onClick={() => onEditShift(ev)}
                                        onClone={() => { }} // No clone on mobile? Or implement if needed
                                        onDelete={onDeleteShift}
                                        readOnly={false}
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
