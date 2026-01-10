import React from 'react';
import { Trophy } from 'lucide-react';

interface Shift {
    riderId: string;
    riderName: string;
    startAt: string | Date;
    endAt: string | Date;
}

interface WeekData {
    shifts?: Shift[];
}

interface RiderStat {
    name: string;
    totalShifts: number;
    totalHours: number;
    days: Set<string>;
}

interface RiderStatsPanelProps {
    weekData: WeekData | null;
}

const RiderStatsPanel: React.FC<RiderStatsPanelProps> = ({ weekData }) => {
    if (!weekData?.shifts) return null;

    const riderStats: Record<string, RiderStat> = {};

    weekData.shifts.forEach(shift => {
        const riderId = shift.riderId;
        const riderName = shift.riderName;

        if (!riderStats[riderId]) {
            riderStats[riderId] = {
                name: riderName,
                totalShifts: 0,
                totalHours: 0,
                days: new Set()
            };
        }

        const duration = (new Date(shift.endAt as string | Date).getTime() - new Date(shift.startAt as string | Date).getTime()) / (1000 * 60 * 60);
        riderStats[riderId].totalShifts += 1;
        riderStats[riderId].totalHours += duration;
        riderStats[riderId].days.add(new Date(shift.startAt as string | Date).toISOString().split('T')[0]);
    });

    const topRiders = Object.values(riderStats)
        .map(r => ({ ...r, daysCount: r.days.size }))
        .sort((a, b) => b.totalHours - a.totalHours)
        .slice(0, 5);

    if (topRiders.length === 0) return null;

    return (
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-2 mb-2">
            <div className="flex items-center gap-1 mb-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Top Riders</h3>
            </div>

            <div className="grid grid-cols-5 gap-1">
                {topRiders.map((rider, idx) => (
                    <div
                        key={idx}
                        className="flex flex-col items-center p-1.5 bg-slate-950/50 rounded border border-slate-700/30"
                    >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs mb-1 ${idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                            idx === 1 ? 'bg-slate-400/20 text-slate-300' :
                                idx === 2 ? 'bg-orange-600/20 text-orange-400' :
                                    'bg-slate-700/20 text-slate-400'
                            }`}>
                            {idx + 1}
                        </div>
                        <div className="text-xs font-semibold text-white truncate w-full text-center">{rider.name}</div>
                        <div className="text-[10px] text-emerald-400 font-bold">{Math.round(rider.totalHours)}h</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RiderStatsPanel;
