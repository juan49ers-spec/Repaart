import React, { useMemo } from 'react';
import { Sun, Moon, Zap, Award, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { startOfWeek, endOfWeek, isWithinInterval, sub, differenceInHours } from 'date-fns';

export interface ShiftData {
    id: string;
    startAt: string;
    endAt: string;
}

interface RiderStatsOverviewProps {
    myShifts: ShiftData[];
}

/**
 * RiderStatsOverview: Rediseño "Clean Apple"
 * Enfocado en claridad, tipografía robusta y legibilidad.
 */
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
            {/* Primary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Main Progress Circle / Bar */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Progreso Semanal</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-slate-900 tracking-tighter">{stats.thisWeekHours.toFixed(1)}</span>
                                <span className="text-lg font-bold text-slate-400">/ {stats.target}h</span>
                            </div>
                        </div>
                        <div className={`flex flex-col items-end ${stats.trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            <div className="flex items-center gap-1">
                                {stats.trend >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                <span className="text-xl font-black">{Math.abs(stats.trend).toFixed(0)}%</span>
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">vs semana anterior</span>
                        </div>
                    </div>
                    
                    <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div 
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                            style={{ width: `${stats.percent}%` }}
                        />
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        <span>Inicio de semana</span>
                        <span className={stats.percent >= 100 ? 'text-emerald-500' : ''}>
                            {stats.percent >= 100 ? 'Objetivo Cumplido' : `${(stats.target - stats.thisWeekHours).toFixed(1)}h restantes`}
                        </span>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <StatCard 
                        icon={<CalendarIcon />} 
                        label="Turnos" 
                        value={stats.totalShifts.toString()} 
                        sub="Completados"
                    />
                    <StatCard 
                        icon={<Zap size={18} className="text-sky-500" />} 
                        label="Eficiencia" 
                        value={stats.totalShifts > 0 ? (stats.thisWeekHours / stats.totalShifts).toFixed(1) : '0'} 
                        sub="Horas/Turno"
                    />
                </div>
            </div>

            {/* Distribution Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DistributionCard 
                    icon={<Sun size={18} className="text-amber-500" />} 
                    label="Mañana" 
                    count={stats.dayShifts} 
                    color="bg-amber-50"
                />
                <DistributionCard 
                    icon={<Sun size={18} className="text-orange-500" />} 
                    label="Tarde" 
                    count={stats.afternoonShifts} 
                    color="bg-orange-50"
                />
                <DistributionCard 
                    icon={<Moon size={18} className="text-indigo-500" />} 
                    label="Noche" 
                    count={stats.nightShifts} 
                    color="bg-indigo-50"
                />
            </div>

            {/* Motivation Banner */}
            {stats.percent >= 80 && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-center gap-6 animate-in slide-in-from-bottom-2 duration-500">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <Award size={24} />
                    </div>
                    <div>
                        <p className="font-black text-emerald-900 uppercase text-xs tracking-widest">¡Excelente ritmo!</p>
                        <p className="text-emerald-700 text-sm">Estás a solo unas horas de completar tu objetivo semanal.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- PRIVATE HELPERS ---

const StatCard = ({ icon, label, value, sub }: any) => (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group">
        <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">{icon}</div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        </div>
        <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">{value}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{sub}</span>
        </div>
    </div>
);

const DistributionCard = ({ icon, label, count, color }: any) => (
    <div className={`${color} rounded-2xl p-5 flex items-center justify-between border border-white/50 backdrop-blur-sm shadow-sm`}>
        <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-xl shadow-sm">{icon}</div>
            <span className="font-black text-slate-800 uppercase text-[10px] tracking-widest">{label}</span>
        </div>
        <span className="text-xl font-black text-slate-900">{count}</span>
    </div>
);

const CalendarIcon = () => (
    <div className="relative w-4 h-4">
        <div className="absolute inset-0 border-2 border-indigo-500 rounded-sm" />
        <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500" />
    </div>
);

export default RiderStatsOverview;
