import React, { useState } from 'react';
import { Clock, User, MapPin, Trash2 } from 'lucide-react';
import { startOfWeek, addDays } from 'date-fns';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 12); // 12:00 to 00:00 (24h)
const RIDER_COLORS = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-rose-500',
    'bg-indigo-500'
];

interface Shift {
    id: string;
    shiftId: string;
    riderName: string;
    startAt?: string;
    endAt?: string;
    day: string;
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
    zone?: string;
}

interface WeeklyCalendarGridProps {
    shifts: Shift[];
    onDeleteShift?: (shiftId: string) => void;
    onSlotClick?: (date: Date) => void;
    currentDate?: Date;
    readOnly?: boolean;
}

/**
 * WeeklyCalendarGrid - Visual calendar grid with time slots
 */
const WeeklyCalendarGrid: React.FC<WeeklyCalendarGridProps> = ({
    shifts,
    onDeleteShift,
    onSlotClick,
    currentDate,
    readOnly = false
}) => {
    const [hoveredShift, setHoveredShift] = useState<string | null>(null);

    // Get color for a rider (consistent)
    const getRiderColor = (riderName: string) => {
        const hash = riderName.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
        return RIDER_COLORS[hash % RIDER_COLORS.length];
    };

    // Convert time to hour number (e.g., "20:00" -> 20)
    const timeToHour = (time: string) => {
        return parseInt(time.split(':')[0]);
    };

    // Format hour for display
    const formatHour = (hour: number) => {
        if (hour === 0 || hour === 24) return '00:00';
        return `${hour}:00`;
    };

    return (
        <div className="glass-panel-exec p-0 rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
                <div className="min-w-[800px]">
                    {/* Header with Days */}
                    <div className="grid grid-cols-8 border-b border-white/10 bg-white/5">
                        <div className="p-3 text-xs font-bold text-slate-400 border-r border-white/10">
                            HORA
                        </div>
                        {DAYS.map(day => (
                            <div key={day} className="p-3 text-center border-r border-white/10 last:border-r-0">
                                <p className="text-xs font-bold text-slate-200">{day.substring(0, 3).toUpperCase()}</p>
                                <p className="text-[10px] text-slate-500">{day}</p>
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-8 relative">
                        {/* Hour Labels */}
                        <div className="border-r border-white/10 bg-white/5">
                            {HOURS.map(hour => (
                                <div
                                    key={hour}
                                    className="h-16 border-b border-white/5 flex items-center justify-center text-xs text-slate-500 font-medium"
                                >
                                    {formatHour(hour)}
                                </div>
                            ))}
                        </div>

                        {/* Day Columns */}
                        {DAYS.map(day => {
                            // HEURÍSTICA DE SALUD (Visual KPI) 🚦
                            // Contamos turnos en este día para determinar el "estado de cobertura"
                            // En un sistema real, esto vendría comparado con la demanda prevista.
                            const dayShifts = shifts.filter((s: Shift) => s.day === day);
                            const shiftCount = dayShifts.length;

                            // Lógica simple: < 2 Critico (Rojo), 2-4 Alerta (Ambar), > 4 Correcto (Verde) - SOLO VISUAL
                            // Ajustado para que no sea intrusivo si no hay datos (0 = borde sutil)
                            let healthBorder = 'border-white/5';
                            if (shiftCount > 0) {
                                if (shiftCount < 3) healthBorder = 'border-rose-500/30 bg-rose-500/5';
                                else if (shiftCount < 5) healthBorder = 'border-amber-500/30 bg-amber-500/5';
                                else healthBorder = 'border-emerald-500/30 bg-emerald-500/5';
                            }

                            return (
                                <div key={day} className={`border-r ${healthBorder} last:border-r-0 relative transition-colors`}>
                                    {/* Indicador de estado en la cabecera (Pequeño punto) */}
                                    {shiftCount > 0 && (
                                        <div className={`absolute top-0 right-0 w-full h-1 ${shiftCount < 3 ? 'bg-rose-500' :
                                            shiftCount < 5 ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`} />
                                    )}

                                    {HOURS.map(hour => (
                                        <div
                                            key={hour}
                                            className="h-16 border-b border-white/5 relative hover:bg-white/10 transition-colors cursor-pointer group/slot"
                                            onClick={() => {
                                                if (!onSlotClick || !currentDate) return;

                                                // 0=Lunes, 1=Martes... in the DAYS array map
                                                const dayIndex = DAYS.indexOf(day);
                                                // Get Monday of current date
                                                const monday = startOfWeek(currentDate, { weekStartsOn: 1 });
                                                const targetDate = addDays(monday, dayIndex);
                                                // Optional: Set hour
                                                targetDate.setHours(hour);
                                                targetDate.setMinutes(0);

                                                onSlotClick(targetDate);
                                            }}
                                        >
                                            {/* Hint visual "Click to Edit" */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/slot:opacity-100 pointer-events-none">
                                                <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest">+ EDIT</span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Render ALL shifts for this day (positioned absolutely) */}
                                    {shifts.filter((s: Shift) => s.day === day).map((shift) => {
                                        const startHour = timeToHour(shift.startTime);
                                        const endHour = timeToHour(shift.endTime) || 24;
                                        const startIndex = HOURS.indexOf(startHour);

                                        // Skip if shift start hour not in grid range
                                        if (startIndex === -1) return null;

                                        const duration = endHour > startHour ? endHour - startHour : (24 - startHour);
                                        const color = getRiderColor(shift.riderName);

                                        return (
                                            <div
                                                key={shift.id}
                                                className={`absolute left-1 right-1 ${color} rounded-md text-white text-xs p-2 shadow-lg shadow-black/30 cursor-pointer transition-all hover:scale-[1.02] hover:z-20 group border border-white/10`}
                                                style={{
                                                    top: `${startIndex * 64}px`,
                                                    height: `${duration * 64 - 4}px`,
                                                    zIndex: hoveredShift === shift.id ? 30 : 10
                                                }}
                                                onMouseEnter={() => setHoveredShift(shift.id)}
                                                onMouseLeave={() => setHoveredShift(null)}
                                            >
                                                {/* Shift Content */}
                                                <div className="flex flex-col h-full justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-1 mb-1">
                                                            <User size={10} className="text-white/80" />
                                                            <span className="font-bold truncate text-[10px]">{shift.riderName}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[9px] opacity-90">
                                                            <Clock size={8} />
                                                            <span>{shift.startTime}-{shift.endTime}</span>
                                                        </div>
                                                        {shift.zone && (
                                                            <div className="flex items-center gap-1 text-[9px] opacity-80 mt-0.5">
                                                                <MapPin size={8} />
                                                                <span>{shift.zone}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Delete Button (on hover) */}
                                                    {!readOnly && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDeleteShift?.(shift.id);
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 hover:bg-black/60 rounded p-1 self-end text-white"
                                                            title="Eliminar turno"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Hover Tooltip - Optimized for overflow */}
                                                {hoveredShift === shift.id && (
                                                    <div className="fixed sm:absolute left-1/2 sm:left-full top-1/2 sm:top-0 -translate-x-1/2 sm:translate-x-2 -translate-y-1/2 sm:translate-y-0 bg-slate-900 border border-white/10 text-white p-3 rounded-lg shadow-2xl z-50 min-w-[200px] pointer-events-none backdrop-blur-xl">
                                                        <p className="font-bold mb-2 text-primary-400">{shift.riderName}</p>
                                                        <div className="space-y-1 text-xs text-slate-300">
                                                            <p><Clock size={12} className="inline mr-1 text-blue-400" />{shift.startTime} - {shift.endTime}</p>
                                                            {shift.zone && <p><MapPin size={12} className="inline mr-1 text-teal-400" />{shift.zone}</p>}
                                                            <p className="text-slate-500 mt-2">{shift.day}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="border-t border-white/10 p-4 bg-white/5">
                <p className="text-xs text-slate-400 font-bold mb-2 uppercase tracking-wide">Riders Activos:</p>
                <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(shifts.map(s => s.riderName))).map(rider => (
                        <div key={rider} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                            <div className={`w-2 h-2 rounded-full ${getRiderColor(rider)} shadow-[0_0_8px_rgba(255,255,255,0.4)]`} />
                            <span className="text-xs font-medium text-slate-300">{rider}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WeeklyCalendarGrid;
