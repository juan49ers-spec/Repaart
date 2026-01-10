import React, { useMemo } from 'react';
import { Clock, DollarSign, Users, TrendingUp, AlertTriangle, Trophy } from 'lucide-react';

interface Shift {
    riderId: string;
    riderName: string;
    startAt: string;
    endAt: string;
}

interface WeekData {
    shifts: Shift[];
}

interface WeekMetricsPanelProps {
    weekData: WeekData | null | undefined;
}

interface RiderStat {
    name: string;
    totalHours: number;
}

const WeekMetricsPanel: React.FC<WeekMetricsPanelProps> = ({ weekData }) => {
    const { totalHours, estimatedCost, activeRiders, healthScore, lowCoverageDays, topRiders } = useMemo(() => {
        if (!weekData?.shifts) return { totalHours: 0, estimatedCost: 0, activeRiders: 0, healthScore: 0, lowCoverageDays: [], topRiders: [] };

        const uniqueRiders = new Set(weekData.shifts.map(s => s.riderId));
        const totalHours = weekData.shifts.reduce((sum, shift) => {
            const start = new Date(shift.startAt).getTime();
            const end = new Date(shift.endAt).getTime();
            const duration = (end - start) / (1000 * 60 * 60);
            return sum + (isNaN(duration) ? 0 : duration);
        }, 0);

        const dayGroups: Record<string, number> = {};
        weekData.shifts.forEach(shift => {
            try {
                const day = new Date(shift.startAt).toISOString().split('T')[0];
                dayGroups[day] = (dayGroups[day] || 0) + 1;
            } catch (e) {
                // Ignore invalid dates
            }
        });

        const lowCoverageDays = Object.entries(dayGroups)
            .filter(([_, count]) => count < 3)
            .map(([day]) => day);

        const coverageScore = Math.max(0, 100 - (lowCoverageDays.length * 15));

        // Calculate top riders
        const riderStats: Record<string, RiderStat> = {};
        weekData.shifts.forEach(shift => {
            const riderId = shift.riderId;
            const riderName = shift.riderName;
            if (!riderStats[riderId]) {
                riderStats[riderId] = { name: riderName, totalHours: 0 };
            }
            const start = new Date(shift.startAt).getTime();
            const end = new Date(shift.endAt).getTime();
            const duration = (end - start) / (1000 * 60 * 60);
            riderStats[riderId].totalHours += (isNaN(duration) ? 0 : duration);
        });

        const topRiders = Object.values(riderStats)
            .sort((a, b) => b.totalHours - a.totalHours)
            .slice(0, 3);

        return {
            totalHours: Math.round(totalHours),
            estimatedCost: Math.round(totalHours * 12),
            activeRiders: uniqueRiders.size,
            healthScore: coverageScore,
            lowCoverageDays,
            topRiders
        };
    }, [weekData]);

    const healthColor = healthScore > 70 ? 'text-emerald-400' : healthScore > 40 ? 'text-amber-400' : 'text-red-400';
    const healthBg = healthScore > 70 ? 'bg-emerald-500/10' : healthScore > 40 ? 'bg-amber-500/10' : 'bg-red-500/10';

    return (
        <div className="grid grid-cols-8 gap-1 mb-1">
            <div className="bg-slate-900/50 border border-slate-700/30 rounded p-1.5">
                <div className="flex items-center gap-1 mb-0.5">
                    <Clock className="w-2.5 h-2.5 text-blue-400" />
                    <div className="text-[9px] opacity-80 uppercase tracking-wider">Horas</div>
                </div>
                <div className="text-base font-bold text-white">{totalHours}h</div>
            </div>

            <div className="bg-slate-900/50 border border-slate-700/30 rounded p-1.5">
                <div className="flex items-center gap-1 mb-0.5">
                    <DollarSign className="w-2.5 h-2.5 text-emerald-400" />
                    <div className="text-[9px] opacity-80 uppercase tracking-wider">Coste</div>
                </div>
                <div className="text-base font-bold text-white">{estimatedCost}€</div>
            </div>

            <div className="bg-slate-900/50 border border-slate-700/30 rounded p-1.5">
                <div className="flex items-center gap-1 mb-0.5">
                    <Users className="w-2.5 h-2.5 text-purple-400" />
                    <div className="text-[9px] opacity-80 uppercase tracking-wider">Riders</div>
                </div>
                <div className="text-base font-bold text-white">{activeRiders}</div>
            </div>

            <div className={`${healthBg} border border-slate-700/30 rounded p-1.5`}>
                <div className="flex items-center gap-1 mb-0.5">
                    <TrendingUp className={`w-2.5 h-2.5 ${healthColor}`} />
                    <div className="text-[9px] opacity-80 uppercase tracking-wider">Salud</div>
                </div>
                <div className={`text-base font-bold ${healthColor}`}>{healthScore}%</div>
            </div>

            <div className="bg-slate-900/50 border border-slate-700/30 rounded p-1.5">
                <div className="flex items-center gap-1 mb-0.5">
                    <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                    <div className="text-[9px] opacity-80 uppercase tracking-wider">Alertas</div>
                </div>
                <div className="text-base font-bold text-red-400">{lowCoverageDays.length}</div>
            </div>

            {/* Top 3 Riders */}
            {topRiders.map((rider, idx) => (
                <div key={idx} className="bg-amber-500/10 border border-amber-500/30 rounded p-1.5">
                    <div className="flex items-center gap-1 mb-0.5">
                        <Trophy className="w-2.5 h-2.5 text-amber-400" />
                        <div className="text-[9px] opacity-80 uppercase tracking-wider">#{idx + 1}</div>
                    </div>
                    <div className="text-[10px] font-bold text-white truncate">{rider.name}</div>
                    <div className="text-[9px] text-amber-400">{Math.round(rider.totalHours)}h</div>
                </div>
            ))}
        </div>
    );
};

export default WeekMetricsPanel;
