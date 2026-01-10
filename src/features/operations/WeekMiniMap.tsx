import React from 'react';
import { Eye, Users } from 'lucide-react';

interface Shift {
    startAt: string | Date;
    riderId?: string;
}

interface WeekData {
    shifts?: Shift[];
}

interface DayInfo {
    isoDate: string;
    label: string;
    [key: string]: any;
}

interface WeekMiniMapProps {
    weekData: WeekData | null;
    days: DayInfo[] | null;
}

const WeekMiniMap: React.FC<WeekMiniMapProps> = ({ weekData, days }) => {
    if (!weekData || !days) return null;

    // Calculate density and riders for each day
    const dayDensity = days.map(day => {
        const dayShifts = weekData.shifts?.filter(shift => {
            const shiftDate = new Date(shift.startAt as string | Date).toISOString().split('T')[0];
            return shiftDate === day.isoDate;
        }) || [];

        const uniqueRiders = new Set(dayShifts.map(s => s.riderId)).size;

        return {
            ...day,
            shiftCount: dayShifts.length,
            riderCount: uniqueRiders
        };
    });

    const maxShifts = Math.max(...dayDensity.map(d => d.shiftCount), 1);

    return (
        <div className="bg-slate-900/30 border border-slate-700/20 rounded px-2 py-1 mb-1 flex items-center gap-2">
            <div className="flex items-center gap-1 flex-shrink-0">
                <Eye className="w-3 h-3 text-blue-400" />
                <div className="text-[9px] font-bold text-slate-400 uppercase">Vista</div>
            </div>

            <div className="flex gap-0.5 flex-1">
                {dayDensity.map((day, idx) => {
                    const intensity = day.shiftCount / maxShifts;
                    const bgOpacity = Math.max(intensity * 40, 10);

                    return (
                        <div
                            key={idx}
                            className={`group relative flex-1 h-6 rounded transition-all ${day.shiftCount === 0
                                ? 'bg-slate-800/20'
                                : `bg-emerald-500/${Math.round(bgOpacity)}`
                                }`}
                            title={`${day.label}: ${day.shiftCount} turnos, ${day.riderCount} riders`}
                        >
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-[7px] font-bold text-slate-400">{day.label.substring(0, 1)}</div>
                                <div className="flex items-center gap-0.5">
                                    <Users className="w-2 h-2 text-purple-400" />
                                    <span className="text-[7px] font-bold text-white">{day.riderCount}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WeekMiniMap;
