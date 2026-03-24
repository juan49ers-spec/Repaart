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
        <div className="space-y-6 @container">
            {/* Top Section: Progress & High Level Stats */}
            <div className="flex flex-col gap-6">
                {/* Progress Bar Area */}
                <div className="flex flex-col justify-center space-y-4">
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 mb-1">Horas Semanales</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl md:text-6xl font-black tracking-tight text-slate-900 drop-shadow-sm">
                                    {stats.thisWeekHours.toFixed(1)}
                                </span>
                                <span className="text-xl font-bold text-slate-400">/ {stats.target}h</span>
                            </div>
                        </div>
                        <div className={`flex flex-col items-end ${stats.trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                                {stats.trend >= 0 ? <ArrowUpRight size={18} className="stroke-[3]" /> : <ArrowDownRight size={18} className="stroke-[3]" />}
                                <span className="font-bold text-sm">{Math.abs(stats.trend).toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner flex items-center">
                        <div 
                            className={`absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-1000 ease-out`}
                            {...({ style: { width: `${stats.percent}%` } })}
                        />
                    </div>
                    
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>Progreso</span>
                        <span className={stats.percent >= 100 ? 'text-blue-500' : ''}>
                            {stats.percent >= 100 ? 'Objetivo Cumplido' : `${(stats.target - stats.thisWeekHours).toFixed(1)}h restantes`}
                        </span>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <StatCard 
                        icon={<CheckCircle2 className="text-emerald-500" size={18} strokeWidth={2.5} />} 
                        label="Turnos" 
                        value={stats.totalShifts.toString()} 
                        sub="Confirmados"
                    />
                    <StatCard 
                        icon={<Zap className="text-amber-500" size={18} strokeWidth={2.5} />} 
                        label="Eficiencia" 
                        value={stats.totalShifts > 0 ? (stats.thisWeekHours / stats.totalShifts).toFixed(1) : '0'} 
                        sub="h/turno"
                    />
                </div>
            </div>

            {/* Distribution */}
            <div>
                <h4 className="text-[11px] font-black text-slate-400 mb-3 uppercase tracking-widest opacity-80">Distribución</h4>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <DistributionCard 
                        icon={<Sun size={16} className="text-amber-500" strokeWidth={2.5} />} 
                        label="Mañana" 
                        count={stats.dayShifts} 
                    />
                    <DistributionCard 
                        icon={<Sun size={16} className="text-orange-500" strokeWidth={2.5} />} 
                        label="Tarde" 
                        count={stats.afternoonShifts} 
                    />
                    <DistributionCard 
                        icon={<Moon size={16} className="text-indigo-500" strokeWidth={2.5} />} 
                        label="Noche" 
                        count={stats.nightShifts} 
                    />
                </div>
            </div>

            {/* Motivation Banner */}
            {stats.percent >= 80 && stats.percent < 100 && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 rounded-[1.25rem] p-4 sm:p-5 flex items-start gap-4 shadow-sm relative overflow-hidden group">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-100 flex items-center justify-center border border-blue-200">
                        <Award size={20} className="text-blue-500" strokeWidth={2.5} />
                    </div>
                    <div className="relative z-10">
                        <p className="font-bold text-[15px] mb-0.5 text-blue-900 tracking-tight">¡Casi lo tienes!</p>
                        <p className="text-blue-700/80 font-medium text-xs leading-relaxed">Estás muy cerca de completar tu objetivo semanal.</p>
                    </div>
                </div>
            )}
             {stats.percent >= 100 && (
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 rounded-[1.25rem] p-4 sm:p-5 flex items-start gap-4 shadow-sm relative overflow-hidden group">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-100 flex items-center justify-center border border-emerald-200">
                        <Award size={20} className="text-emerald-500" strokeWidth={2.5} />
                    </div>
                    <div className="relative z-10">
                        <p className="font-bold text-[15px] mb-0.5 text-emerald-900 tracking-tight">¡Objetivo Cumplido!</p>
                        <p className="text-emerald-700/80 font-medium text-xs leading-relaxed">Has superado tu meta semanal.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- PRIVATE HELPERS ---

const StatCard = ({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string | number, sub: string }) => (
    <div className="bg-slate-50 rounded-[1.25rem] p-4 border border-slate-100 flex flex-col justify-between shadow-sm min-h-[110px]">
        <div className="flex flex-col gap-2 mb-3">
            <div className="p-1.5 w-fit rounded-lg bg-white border border-slate-200/50 shadow-sm">
                {icon}
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        </div>
        <div>
            <div className="flex items-baseline gap-1.5 drop-shadow-sm">
                <span className="text-2xl font-black tracking-tight text-slate-900">{value}</span>
                <span className="text-[10px] whitespace-nowrap font-bold text-slate-500 uppercase tracking-widest">{sub}</span>
            </div>
        </div>
    </div>
);

const DistributionCard = ({ icon, label, count }: { icon: React.ReactNode, label: string, count: number }) => (
    <div className="bg-slate-50 rounded-[1rem] p-3 flex flex-col items-center justify-center gap-1.5 border border-slate-100 shadow-sm text-center">
        <div className="bg-white p-1.5 rounded-lg border border-slate-200/50 shadow-sm mb-1">
            {icon}
        </div>
        <div className="flex flex-col items-center gap-0">
            <span className="font-black text-slate-400 text-[9px] uppercase tracking-widest mb-0.5">{label}</span>
            <span className="text-lg font-black text-slate-900 drop-shadow-sm">{count}</span>
        </div>
    </div>
);

export default RiderStatsOverview;


