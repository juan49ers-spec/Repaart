import { type FC, type CSSProperties } from 'react';
import { Clock, TrendingUp, Users, MapPin, AlertTriangle } from 'lucide-react';

interface Shift {
    startTime: string;
    endTime: string;
    riderName: string;
    zone?: string;
}

interface TopRider {
    name: string;
    hours: number;
}

interface TimeSlot {
    start: number;
    end: number;
    count: number;
}

type SlotCoverage = Record<string, TimeSlot>;
type ZonesCoverage = Record<string, number>;

interface CoverageStatsProps {
    shifts: Shift[];
}

/**
 * CoverageStats - Panel de estadísticas de cobertura
 */
const CoverageStats: FC<CoverageStatsProps> = ({ shifts }) => {
    // Calculate total hours covered this week
    const calculateTotalHours = (): number => {
        return shifts.reduce((total, shift) => {
            const start = parseInt(shift.startTime.split(':')[0]);
            const end = parseInt(shift.endTime.split(':')[0]) || 24;
            const duration = end > start ? end - start : (24 - start) + end;
            return total + duration;
        }, 0);
    };

    // Get top 3 most active riders
    const getTopRiders = (): TopRider[] => {
        const riderHours: Record<string, number> = {};
        shifts.forEach(shift => {
            const start = parseInt(shift.startTime.split(':')[0]);
            const end = parseInt(shift.endTime.split(':')[0]) || 24;
            const duration = end > start ? end - start : (24 - start) + end;
            riderHours[shift.riderName] = (riderHours[shift.riderName] || 0) + duration;
        });

        return Object.entries(riderHours)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, hours]) => ({ name, hours }));
    };

    // Calculate coverage by time slot
    const getCoverageBySlot = (): SlotCoverage => {
        const slots: SlotCoverage = {
            'Almuerzo (12-15h)': { start: 12, end: 15, count: 0 },
            'Tarde (15-18h)': { start: 15, end: 18, count: 0 },
            'Cena (18-21h)': { start: 18, end: 21, count: 0 },
            'Noche (21-00h)': { start: 21, end: 24, count: 0 }
        };

        shifts.forEach(shift => {
            const shiftStart = parseInt(shift.startTime.split(':')[0]);
            const shiftEnd = parseInt(shift.endTime.split(':')[0]) || 24;

            Object.entries(slots).forEach(([name, slot]) => {
                if ((shiftStart < slot.end && shiftEnd > slot.start) ||
                    (shiftStart >= slot.start && shiftStart < slot.end)) {
                    slots[name].count++;
                }
            });
        });

        return slots;
    };

    // Get zones coverage
    const getZonesCoverage = (): ZonesCoverage => {
        const zones: ZonesCoverage = {};
        shifts.forEach(shift => {
            const zone = shift.zone || 'Sin zona';
            zones[zone] = (zones[zone] || 0) + 1;
        });
        return zones;
    };

    const totalHours = calculateTotalHours();
    const topRiders = getTopRiders();
    const slotCoverage = getCoverageBySlot();
    const zonesCoverage = getZonesCoverage();

    // Optimal coverage: 7 days * 12 hours/day * 2 riders = 168 rider-hours
    const optimalHours = 7 * 12 * 2;
    const coveragePercent = Math.min((totalHours / optimalHours) * 100, 100);

    // Find critical gaps
    const criticalSlots = Object.entries(slotCoverage).filter(([, data]) => data.count < 14); // Less than 2 riders per day

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Total Hours */}
            <div className="glass-panel-exec p-4 rounded-xl border-0 ring-1 ring-blue-500/20">
                <div className="flex items-center justify-between mb-3">
                    <Clock className="text-blue-400" size={24} />
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${coveragePercent >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        }`}>
                        {coveragePercent.toFixed(0)}%
                    </span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Horas Cubiertas</p>
                <p className="text-2xl font-black text-white">{totalHours}h</p>
                <div className="mt-2 w-full bg-slate-700/50 rounded-full h-1.5">
                    <div
                        className="bg-blue-500 h-full rounded-full transition-all shadow-glow-blue"
                        style={{ width: `${coveragePercent}%` } as CSSProperties}
                    />
                </div>
            </div>

            {/* Top Riders */}
            <div className="glass-panel-exec p-4 rounded-xl border-0 ring-1 ring-purple-500/20">
                <div className="flex items-center mb-3">
                    <Users className="text-purple-400" size={24} />
                    <span className="ml-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Top Riders</span>
                </div>
                <div className="space-y-2">
                    {topRiders.map((rider, idx) => (
                        <div key={rider.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-purple-400">#{idx + 1}</span>
                                <span className="text-sm font-medium text-slate-200 truncate">{rider.name}</span>
                            </div>
                            <span className="text-xs font-bold text-purple-400">{rider.hours}h</span>
                        </div>
                    ))}
                    {topRiders.length === 0 && (
                        <p className="text-xs text-slate-500 italic">Sin datos</p>
                    )}
                </div>
            </div>

            {/* Critical Gaps */}
            <div className="glass-panel-exec p-4 rounded-xl border-0 ring-1 ring-orange-500/20">
                <div className="flex items-center mb-3">
                    <AlertTriangle className="text-orange-400" size={24} />
                    <span className="ml-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gaps Críticos</span>
                </div>
                {criticalSlots.length > 0 ? (
                    <div className="space-y-2">
                        {criticalSlots.slice(0, 2).map(([slot, data]) => (
                            <div key={slot} className="text-xs">
                                <p className="font-bold text-orange-400">{slot}</p>
                                <p className="text-slate-400">{data.count} turnos (falta {14 - data.count})</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-16">
                        <TrendingUp className="text-emerald-400 mb-1" size={20} />
                        <p className="text-xs font-bold text-emerald-400">Todo cubierto</p>
                    </div>
                )}
            </div>

            {/* Zones Coverage */}
            <div className="glass-panel-exec p-4 rounded-xl border-0 ring-1 ring-teal-500/20">
                <div className="flex items-center mb-3">
                    <MapPin className="text-teal-400" size={24} />
                    <span className="ml-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cobertura Zonas</span>
                </div>
                <div className="space-y-2">
                    {Object.entries(zonesCoverage).map(([zone, count]) => (
                        <div key={zone} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-200">{zone}</span>
                            <span className="text-xs font-bold text-teal-400">{count} turnos</span>
                        </div>
                    ))}
                    {Object.keys(zonesCoverage).length === 0 && (
                        <p className="text-xs text-slate-500 italic">Sin datos</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoverageStats;
