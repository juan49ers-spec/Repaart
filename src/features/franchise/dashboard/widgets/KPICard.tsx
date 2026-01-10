import React from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip as ChartTooltip } from 'recharts';
import { AlertTriangle, TrendingUp as TrendUp, Target, Calendar } from 'lucide-react';


interface KPICardProps {
    title: string;
    value: string | number;
    trend?: number; // percentage change
    trendData?: number[]; // for sparkline
    icon?: React.ReactNode;
    color?: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose';
    subtext?: string;
    // New advanced props
    monthlyGoal?: number; // objetivo mensual
    lastYearValue?: number; // valor mismo mes año anterior
    showPrediction?: boolean; // mostrar proyección
}

const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    trend,
    trendData,
    icon,
    color = 'blue',
    subtext,
    monthlyGoal,
    lastYearValue,
    showPrediction = true
}) => {


    // Map colors to hex values for charts and badges
    const colorMap = {
        blue: { main: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-600', border: 'border-blue-100 dark:border-blue-900', stroke: '#3b82f6', lightBg: 'bg-blue-500/5' },
        purple: { main: '#8b5cf6', bg: 'bg-purple-50 dark:bg-purple-950/20', text: 'text-purple-600', border: 'border-purple-100 dark:border-purple-900', stroke: '#8b5cf6', lightBg: 'bg-purple-500/5' },
        emerald: { main: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-600', border: 'border-emerald-100 dark:border-emerald-900', stroke: '#10b981', lightBg: 'bg-emerald-500/5' },
        amber: { main: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-600', border: 'border-amber-100 dark:border-amber-900', stroke: '#f59e0b', lightBg: 'bg-amber-500/5' },
        rose: { main: '#f43f5e', bg: 'bg-rose-50 dark:bg-rose-950/20', text: 'text-rose-600', border: 'border-rose-100 dark:border-rose-900', stroke: '#f43f5e', lightBg: 'bg-rose-500/5' },
    };

    const theme = colorMap[color];
    const isPositive = trend && trend >= 0;

    // Advanced calculations
    const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;

    // Proyección próximo mes basada en tendencia
    const prediction = showPrediction && trend && numericValue
        ? numericValue * (1 + trend / 100)
        : null;

    // YoY comparison
    const yoyChange = lastYearValue && numericValue
        ? ((numericValue - lastYearValue) / lastYearValue) * 100
        : null;

    // Monthly goal progress
    const goalProgress = monthlyGoal && numericValue
        ? Math.min((numericValue / monthlyGoal) * 100, 100)
        : null;

    // Critical alert detection
    const isCriticalDrop = trend && trend < -20;

    // Calculate trend strength
    const trendStrength = trend ? Math.abs(trend) : 0;
    const isStrongTrend = trendStrength > 15;
    const isModerateTrend = trendStrength > 5 && trendStrength <= 15;

    // Format trend data for recharts
    const chartData = trendData?.map((val, i) => ({ i, val, label: `Día ${i + 1}` })) || [];

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group h-full flex flex-col">
            {/* Subtle Background Pattern */}
            <div className={`absolute inset-0 ${theme.lightBg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            {/* Critical Alert Banner */}
            {isCriticalDrop && (
                <div className="absolute top-0 left-0 right-0 bg-rose-500 text-white px-3 py-1 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 z-20">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Alerta: Caída significativa</span>
                </div>
            )}

            {/* Header */}
            <div className={`flex items-start justify-between ${isCriticalDrop ? 'mt-7' : 'mb-5'} relative z-10`}>
                <div className="flex items-center gap-3">
                    {icon && (
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${theme.border} ${theme.bg} ${theme.text} transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
                            {icon}
                        </div>
                    )}
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">{title}</h3>
                        <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-[0.08em] leading-none mt-1.5">
                            {subtext || 'Métrica Principal'}
                        </p>
                    </div>
                </div>

                {/* Trend Badge - More Informative */}
                {trend !== undefined && (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${isPositive
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800'
                        } transition-all duration-300 group-hover:scale-105`}>
                        <span className={`text-xs font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {isPositive ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
                        </span>
                    </div>
                )}
            </div>

            {/* Main Value with Enhanced Typography */}
            <div className="mb-4 relative z-10">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">{value}</span>
                </div>

                {/* Trend Context - More Detailed */}
                {trend !== undefined && (
                    <div className="flex items-center gap-2 mt-2">
                        <div className={`text-[10px] font-bold uppercase tracking-wider ${isPositive ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                            {isStrongTrend && (isPositive ? 'Crecimiento Fuerte' : 'Caída Fuerte')}
                            {isModerateTrend && (isPositive ? 'Crecimiento Moderado' : 'Reducción Moderada')}
                            {!isStrongTrend && !isModerateTrend && (isPositive ? 'Crecimiento Leve' : 'Reducción Leve')}
                        </div>
                        <div className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] text-slate-400 font-medium">vs mes anterior</span>
                    </div>
                )}
            </div>

            {/* Advanced Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4 relative z-10">
                {/* YoY Comparison */}
                {yoyChange !== null && (
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1 mb-0.5">
                            <Calendar className="w-2.5 h-2.5 text-slate-400" />
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">YoY</span>
                        </div>
                        <div className={`text-xs font-bold ${yoyChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {yoyChange >= 0 ? '+' : ''}{yoyChange.toFixed(1)}%
                        </div>
                    </div>
                )}

                {/* Prediction */}
                {prediction !== null && (
                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900">
                        <div className="flex items-center gap-1 mb-0.5">
                            <TrendUp className="w-2.5 h-2.5 text-indigo-500" />
                            <span className="text-[8px] text-indigo-500 font-bold uppercase tracking-wider">Proyección</span>
                        </div>
                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {typeof value === 'string' ? value.replace(/[\d.,]+/, prediction.toFixed(0)) : prediction.toFixed(0)}
                        </div>
                    </div>
                )}
            </div>

            {/* Monthly Goal Progress */}
            {monthlyGoal && goalProgress !== null && (
                <div className="mb-4 relative z-10">
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1">
                            <Target className="w-3 h-3 text-slate-400" />
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Objetivo Mensual</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{goalProgress.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ${goalProgress >= 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                                goalProgress >= 75 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                                    'bg-gradient-to-r from-amber-400 to-amber-600'
                                }`}
                            style={{ width: `${goalProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Enhanced Sparkline */}
            {trendData && trendData.length > 0 && (
                <div className="mt-auto h-16 w-full relative z-10 opacity-60 group-hover:opacity-100 transition-all duration-500">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={theme.main} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={theme.main} stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <YAxis domain={['dataMin', 'dataMax']} hide />
                            <ChartTooltip
                                contentStyle={{ fontSize: '10px', padding: '4px 8px', borderRadius: '6px' }}
                                labelStyle={{ fontSize: '9px', fontWeight: 'bold' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="val"
                                stroke={theme.main}
                                strokeWidth={2.5}
                                fill={`url(#gradient-${color})`}
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50" />
                </div>
            )}
        </div>
    );
};

export default KPICard;
