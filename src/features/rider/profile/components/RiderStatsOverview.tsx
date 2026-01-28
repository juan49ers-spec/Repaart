import { useMemo } from 'react';
import { Clock, TrendingUp, Calendar, ArrowUp, ArrowDown, Sun, Moon, Zap, Check } from 'lucide-react';
import { startOfWeek, endOfWeek, isWithinInterval, sub, differenceInHours } from 'date-fns';

export interface ShiftData {
    id: string;
    startAt: string;
    endAt: string;
}

interface RiderStatsOverviewProps {
    myShifts: ShiftData[];
}

const RiderStatsOverview: React.FC<RiderStatsOverviewProps> = ({ myShifts }) => {
    const stats = useMemo(() => {
        const now = new Date();
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const end = endOfWeek(now, { weekStartsOn: 1 });

        const thisWeekShifts = myShifts.filter(s =>
            isWithinInterval(new Date(s.startAt), { start, end })
        );

        const lastWeekStart = sub(start, { weeks: 1 });
        const lastWeekEnd = sub(end, { weeks: 1 });
        const lastWeekShifts = myShifts.filter(s =>
            isWithinInterval(new Date(s.startAt), { start: lastWeekStart, end: lastWeekEnd })
        );

        const calculateHours = (shifts: ShiftData[]) => {
            return shifts.reduce((acc, s) => {
                const duration = differenceInHours(new Date(s.endAt), new Date(s.startAt));
                return acc + duration;
            }, 0);
        };

        const thisWeekHours = calculateHours(thisWeekShifts);
        const lastWeekHours = calculateHours(lastWeekShifts);
        const targetHours = 40;
        const percent = Math.min((thisWeekHours / targetHours) * 100, 100);
        const hoursDifference = thisWeekHours - lastWeekHours;
        const trendPercent = lastWeekHours > 0 ? ((hoursDifference / lastWeekHours) * 100) : 0;

        const countShiftsByType = (shifts: ShiftData[]) => {
            let dayShifts = 0;
            let nightShifts = 0;

            shifts.forEach(s => {
                const hour = new Date(s.startAt).getHours();
                if (hour >= 6 && hour < 14) {
                    dayShifts++;
                } else if (hour >= 14 || hour < 6) {
                    nightShifts++;
                }
            });

            return {
                day: dayShifts,
                night: nightShifts,
                total: shifts.length
            };
        };

        const thisWeekDistribution = countShiftsByType(thisWeekShifts);
        const lastWeekDistribution = countShiftsByType(lastWeekShifts);

        return {
            thisWeekHours,
            lastWeekHours,
            target: targetHours,
            percent,
            trend: trendPercent,
            totalShifts: thisWeekDistribution.total,
            dayShifts: thisWeekDistribution.day,
            nightShifts: thisWeekDistribution.night,
            dayShiftsChange: thisWeekDistribution.day - lastWeekDistribution.day,
            nightShiftsChange: thisWeekDistribution.night - lastWeekDistribution.night
        };
    }, [myShifts]);

    return (
        <div className="rider-stats-overview">
            <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">
                    Rendimiento Semanal
                </h2>
            </div>

            <div className="glass-premium rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                <div className="absolute bottom-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 via-emerald-400 to-emerald-500/20" />
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent" />

                <div className="relative z-10">
                    {/* Main Stats */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
                        <div className="flex flex-col items-start gap-2">
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.25em] flex items-center gap-2">
                                <Clock size={12} /> Horas Trabajadas
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-white tracking-tighter">
                                    {stats.thisWeekHours.toFixed(1)}
                                </span>
                                <span className="text-xl font-bold text-slate-500">/ {stats.target}h</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={14} className={stats.trend >= 0 ? "text-emerald-400" : "text-rose-400"} />
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${stats.trend >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                    {stats.trend >= 0 ? '+' : ''}{stats.trend.toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full sm:w-32 h-2 bg-slate-900/50 rounded-full overflow-hidden border border-white/10">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 transition-all duration-1000 ease-out"
                                    style={{ width: `${stats.percent}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Secondary Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* Total Shifts */}
                        <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-800/50 border border-white/5 hover:bg-slate-700/50 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <Calendar size={16} />
                            </div>
                            <div className="text-center">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Turnos</span>
                                <span className="text-xl font-bold text-slate-700 dark:text-slate-300">{stats.totalShifts}</span>
                            </div>
                        </div>

                        {/* Day Shifts */}
                        <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                                <Sun size={16} />
                            </div>
                            <div className="text-center">
                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-600/70">Mediodía</span>
                                <span className="text-xl font-bold text-amber-700 dark:text-amber-400">
                                    {stats.dayShifts}
                                    {stats.dayShiftsChange !== 0 && (
                                        <span className={`text-xs ml-1 ${stats.dayShiftsChange > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                            {stats.dayShiftsChange > 0 ? '+' : ''}{stats.dayShiftsChange}
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* Night Shifts */}
                        <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-700/50 border border-slate-600/20 hover:bg-slate-600/50 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-slate-400">
                                <Moon size={16} />
                            </div>
                            <div className="text-center">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Noche</span>
                                <span className="text-xl font-bold text-slate-400">
                                    {stats.nightShifts}
                                    {stats.nightShiftsChange !== 0 && (
                                        <span className={`text-xs ml-1 ${stats.nightShiftsChange > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                            {stats.nightShiftsChange > 0 ? '+' : ''}{stats.nightShiftsChange}
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* Efficiency */}
                        <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <Zap size={16} />
                            </div>
                            <div className="text-center">
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600/70">Eficiencia</span>
                                <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                                    {stats.totalShifts > 0 ? (stats.thisWeekHours / stats.totalShifts).toFixed(1) : '0'}h
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Comparison with Last Week */}
                    <div className="mt-8 pt-6 border-t border-white/5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <TrendingUp size={14} className="text-indigo-500" />
                                Comparativa con semana anterior
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Semana anterior:</span>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{stats.lastWeekHours.toFixed(1)}h</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-800/30 border border-white/5">
                            {stats.trend >= 0 ? (
                                <div className="flex items-center gap-2">
                                    <ArrowUp size={20} className="text-emerald-500" />
                                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                        {Math.abs(stats.trend)}% mejor
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <ArrowDown size={20} className="text-rose-500" />
                                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                                        {Math.abs(stats.trend)}% peor
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Weekly Goal Indicator */}
                    {stats.percent >= 100 ? (
                        <div className="mt-6 p-4 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center gap-3">
                            <Check size={20} className="text-emerald-500" />
                            <div className="flex-1 text-center">
                                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                    ¡Objetivo semanal alcanzado! 🎉
                                </span>
                                <span className="text-xs text-emerald-600 dark:text-emerald-500 block mt-1">
                                    {stats.totalShifts} turnos completados esta semana
                                </span>
                            </div>
                        </div>
                    ) : stats.percent >= 80 ? (
                        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-500/10 to-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center gap-3">
                            <Check size={20} className="text-indigo-400" />
                            <div className="flex-1 text-center">
                                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400">
                                    ¡Casi ahí!
                                </span>
                                <span className="text-xs text-indigo-600 dark:text-indigo-500 block mt-1">
                                    Faltan {(40 - stats.thisWeekHours).toFixed(1)}h para objetivo
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-6 p-4 bg-gradient-to-r from-slate-100/50 to-slate-200/50 border border-slate-200/50 rounded-2xl flex items-center justify-center gap-3">
                            <Clock size={20} className="text-slate-600" />
                            <div className="flex-1 text-center">
                                <span className="text-sm font-bold text-slate-600">
                                    Continúa trabajando
                                </span>
                                <span className="text-xs text-slate-500 block mt-1">
                                    Faltan {(40 - stats.thisWeekHours).toFixed(1)}h para objetivo
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RiderStatsOverview;
