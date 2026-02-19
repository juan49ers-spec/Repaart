import React from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip as ChartTooltip } from 'recharts';
import { AlertTriangle, Target, Receipt, Flame, Clock } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { AnimatedCounter } from '../../../../components/ui/data-display/AnimatedCounter';

interface KPICardProps {
    title: string;
    value: string | number;
    trend?: number;
    trendData?: number[];
    icon?: React.ReactNode;
    color?: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'ruby';
    subtext?: string;
    monthlyGoal?: number;
    rawValue?: number;
    orders?: number;
    totalHours?: number;
    bestDay?: string;
}

const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    trend,
    trendData,
    icon,
    color = 'blue',
    monthlyGoal,
    rawValue,
    orders,
    totalHours,
    bestDay,
    subtext
}) => {
    const colorMap: Record<string, string> = {
        blue: '#3b82f6',
        purple: '#8b5cf6',
        emerald: '#10b981',
        amber: '#f59e0b',
        rose: '#f43f5e',
        ruby: '#e11d48',
    };

    const mainColor = colorMap[color];
    const isPositive = trend !== undefined && trend >= 0;

    const numericValue = rawValue !== undefined
        ? rawValue
        : (typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value);

    const goalProgress = monthlyGoal && numericValue
        ? Math.min((numericValue / monthlyGoal) * 100, 100)
        : null;

    const isCriticalDrop = trend !== undefined && trend < -20;
    const chartData = trendData?.map((val, i) => ({ i, val })) || [];

    return (
        <div className="@container workstation-card workstation-scanline p-6 h-full flex flex-col group/card relative overflow-hidden transition-all mechanical-press">

            {/* TACTICAL ALERT BANNER */}
            {isCriticalDrop && (
                <div className="absolute top-0 left-0 right-0 bg-ruby-600 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wide flex items-center justify-center gap-2 z-20 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Alerta: Umbral Crítico</span>
                </div>
            )}

            {/* HEADER TERMINAL */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {icon && (
                        <div className="p-1.5 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5 text-slate-400 group-hover/card:text-ruby-600 transition-colors">
                            {React.isValidElement(icon)
                                ? React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 16 })
                                : icon}
                        </div>
                    )}
                    <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
                            {title}
                        </h3>
                        {subtext && (
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                {subtext}
                            </p>
                        )}
                    </div>
                </div>
                {trend !== undefined && (
                    <div className={cn(
                        "text-xs font-bold px-2 py-1 rounded-md tabular-nums",
                        isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                    )}>
                        {isPositive ? '+' : '-'}{Math.abs(trend).toFixed(1)}%
                    </div>
                )}
            </div>

            {/* PRIMARY VALUE STATION */}
            <div className="mb-4">
                <div className="flex items-baseline gap-1">
                    <AnimatedCounter
                        value={numericValue || 0}
                        formatted
                        duration={1400}
                        className="text-2xl @[280px]:text-3xl font-bold text-slate-900 dark:text-white tracking-tight"
                    />
                    <span className="text-xs font-medium text-slate-400 ml-1">unidades</span>
                </div>
            </div>

            {/* RICH CONTEXT STRIP */}
            {(orders !== undefined || totalHours !== undefined || bestDay) && (
                <div className="grid grid-cols-1 @[280px]:grid-cols-3 gap-2 mb-5">
                    {orders !== undefined && (
                        <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-1.5 mb-1 opacity-70">
                                <Receipt className="w-3 h-3 text-slate-500" />
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Pedidos</span>
                            </div>
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {orders}
                            </div>
                        </div>
                    )}
                    {totalHours !== undefined && (
                        <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-1.5 mb-1 opacity-70">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Media</span>
                            </div>
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {totalHours && totalHours > 0 ? (numericValue / totalHours).toFixed(1) : '0.0'}€/h
                            </div>
                        </div>
                    )}
                    {!!bestDay && (
                        <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-1.5 mb-1 opacity-70">
                                <Flame className="w-3 h-3 text-amber-500" />
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Pico</span>
                            </div>
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate capitalize">
                                {bestDay}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* OBJECTIVE PROGRESS RADAR */}
            {monthlyGoal && goalProgress !== null && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5 px-0.5">
                        <div className="flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-rose-500" />
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Objetivo</span>
                        </div>
                        <span className="text-xs font-bold text-rose-600">{goalProgress.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-1000",
                                goalProgress >= 100 ? 'bg-emerald-500' :
                                    goalProgress >= 75 ? 'bg-rose-500' : 'bg-amber-500'
                            )}
                            style={{ width: `${goalProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* TACTICAL SPARKLINE */}
            {trendData && trendData.length > 0 && (
                <div className="mt-auto -mx-4 -mb-4 h-16 relative overflow-hidden opacity-30 group-hover/card:opacity-60 transition-all duration-700">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={mainColor} stopOpacity={0.4} />
                                    <stop offset="100%" stopColor={mainColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <YAxis domain={['dataMin', 'dataMax']} hide />
                            <ChartTooltip content={() => null} />
                            <Area
                                type="monotone"
                                dataKey="val"
                                stroke={mainColor}
                                strokeWidth={2}
                                fill={`url(#gradient-${color})`}
                                animationDuration={2000}
                                dot={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default KPICard;
