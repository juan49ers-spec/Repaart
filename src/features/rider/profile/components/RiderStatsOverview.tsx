import React, { useMemo } from 'react';
import { Sun, Moon, Zap, Award, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';
import { startOfWeek, endOfWeek, isWithinInterval, sub, differenceInHours } from 'date-fns';

export interface ShiftData {
    id: string;
    startAt: string;
    endAt: string;
    isConfirmed?: boolean;
    isDraft?: boolean;
}

interface RiderStatsOverviewProps {
    myShifts: ShiftData[];
}

export const RiderStatsOverview: React.FC<RiderStatsOverviewProps> = ({ myShifts }) => {
    const stats = useMemo(() => {
        const now = new Date();
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const end = endOfWeek(now, { weekStartsOn: 1 });

        const validShifts = myShifts.filter(s => s.isConfirmed && !s.isDraft);

        const thisWeekShifts = validShifts.filter(s =>
            isWithinInterval(new Date(s.startAt), { start, end })
        );

        const lastWeekStart = sub(start, { weeks: 1 });
        const lastWeekEnd = sub(end, { weeks: 1 });
        const lastWeekShifts = validShifts.filter(s =>
            isWithinInterval(new Date(s.startAt), { start: lastWeekStart, end: lastWeekEnd })
        );

        const calculateHours = (shifts: ShiftData[]) => {
            return shifts.reduce((acc, s) => {
                const duration = differenceInHours(new Date(s.endAt), new Date(s.startAt));
                return acc + Math.max(0, duration);
            }, 0);
        };

        const thisWeekHours = calculateHours(thisWeekShifts);
        const lastWeekHours = calculateHours(lastWeekShifts);
        const targetHours = 40;
        const percent = Math.min((thisWeekHours / targetHours) * 100, 100);
        const trendPercent = lastWeekHours > 0 ? (((thisWeekHours - lastWeekHours) / lastWeekHours) * 100) : 0;

        const countShiftsByType = (shifts: ShiftData[]) => {
            let dayShifts = 0;
            let afternoonShifts = 0;
            let nightShifts = 0;

            shifts.forEach(s => {
                const hour = new Date(s.startAt).getHours();
                if (hour >= 6 && hour < 14) dayShifts++;
                else if (hour >= 14 && hour < 22) afternoonShifts++;
                else nightShifts++;
            });

            return { day: dayShifts, afternoon: afternoonShifts, night: nightShifts, total: shifts.length };
        };

        const dist = countShiftsByType(thisWeekShifts);

        return {
            thisWeekHours,
            lastWeekHours,
            target: targetHours,
            percent,
            trend: trendPercent,
            totalShifts: dist.total,
            dayShifts: dist.day,
            afternoonShifts: dist.afternoon,
            nightShifts: dist.night
        };
    }, [myShifts]);

    return (
        <div className="space-y-8">
            {/* Top Section: Progress & High Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Progress Bar Area */}
                <div className="flex flex-col justify-center space-y-4">
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 mb-1">Horas Semanales</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl md:text-6xl font-black tracking-tight text-slate-900">
                                    {stats.thisWeekHours.toFixed(1)}
                                </span>
                                <span className="text-xl font-bold text-slate-400">/ {stats.target}h</span>
                            </div>
                        </div>
                        <div className={`flex flex-col items-end ${stats.trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            <div className="flex items-center gap-1">
                                {stats.trend >= 0 ? <ArrowUpRight size={20} className="stroke-[3]" /> : <ArrowDownRight size={20} className="stroke-[3]" />}
                                <span className="font-bold text-base">{Math.abs(stats.trend).toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative h-4 w-full bg-slate-100 rounded-sm overflow-hidden">
                        <div 
                            className="absolute inset-y-0 left-0 bg-slate-900 transition-all duration-1000 ease-out"
                            style={{ width: `${stats.percent}%` }}
                        />
                    </div>
                    
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span>Progreso</span>
                        <span className={stats.percent >= 100 ? 'text-emerald-600' : ''}>
                            {stats.percent >= 100 ? 'Objetivo Cumplido' : `${(stats.target - stats.thisWeekHours).toFixed(1)}h restantes`}
                        </span>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <StatCard 
                        icon={<CheckCircle2 className="text-slate-900" size={24} strokeWidth={2.5} />} 
                        label="Turnos" 
                        value={stats.totalShifts.toString()} 
                        sub="Confirmados"
                    />
                    <StatCard 
                        icon={<Zap className="text-slate-900" size={24} strokeWidth={2.5} />} 
                        label="Eficiencia" 
                        value={stats.totalShifts > 0 ? (stats.thisWeekHours / stats.totalShifts).toFixed(1) : '0'} 
                        sub="h/turno"
                    />
                </div>
            </div>

            {/* Distribution */}
            <div>
                <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Distribución</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <DistributionCard 
                        icon={<Sun size={20} className="text-slate-700" strokeWidth={2.5} />} 
                        label="Mañana" 
                        count={stats.dayShifts} 
                    />
                    <DistributionCard 
                        icon={<Sun size={20} className="text-slate-700" strokeWidth={2.5} />} 
                        label="Tarde" 
                        count={stats.afternoonShifts} 
                    />
                    <DistributionCard 
                        icon={<Moon size={20} className="text-slate-700" strokeWidth={2.5} />} 
                        label="Noche" 
                        count={stats.nightShifts} 
                    />
                </div>
            </div>

            {/* Motivation Banner */}
            {stats.percent >= 80 && stats.percent < 100 && (
                <div className="bg-emerald-400 rounded-xl p-5 flex items-center gap-5 text-slate-900 border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a]">
                    <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center">
                        <Award size={24} className="text-emerald-400" strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="font-black text-lg leading-tight uppercase">¡Casi lo tienes!</p>
                        <p className="text-slate-800 font-medium">Estás muy cerca de completar tu objetivo semanal. ¡Sigue así!</p>
                    </div>
                </div>
            )}
             {stats.percent >= 100 && (
                <div className="bg-emerald-400 rounded-xl p-5 flex items-center gap-5 text-slate-900 border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a]">
                    <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center">
                        <Award size={24} className="text-emerald-400" strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="font-black text-lg leading-tight uppercase">¡Objetivo Cumplido!</p>
                        <p className="text-slate-800 font-medium">Has superado tu meta semanal. ¡Excelente trabajo!</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- PRIVATE HELPERS ---

const StatCard = ({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string | number, sub: string }) => (
    <div className="bg-white rounded-xl p-5 border-2 border-slate-200 hover:border-slate-900 transition-colors flex flex-col justify-between group">
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-slate-200 transition-colors">{icon}</div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        </div>
        <div>
            <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black tracking-tight text-slate-900">{value}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{sub}</span>
            </div>
        </div>
    </div>
);

const DistributionCard = ({ icon, label, count }: { icon: React.ReactNode, label: string, count: number }) => (
    <div className="bg-white rounded-xl p-4 flex items-center justify-between border-2 border-slate-200">
        <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-2 rounded-lg">{icon}</div>
            <span className="font-bold text-slate-700 text-sm uppercase tracking-wider">{label}</span>
        </div>
        <span className="text-xl font-black text-slate-900">{count}</span>
    </div>
);

export default RiderStatsOverview;

