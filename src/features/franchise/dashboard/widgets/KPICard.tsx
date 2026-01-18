import React from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip as ChartTooltip } from 'recharts';
import { AlertTriangle, Target, Receipt, Flame, Clock } from 'lucide-react';
import { Card } from '../../../../components/ui/primitives/Card';
import { Badge, BadgeIntent } from '../../../../components/ui/primitives/Badge';
import { StatValue } from '../../../../components/ui/primitives/StatValue';
import { SectionHeader } from '../../../../components/ui/primitives/SectionHeader';

interface KPICardProps {
    title: string;
    value: string | number;
    trend?: number; // percentage change
    trendData?: number[]; // for sparkline
    icon?: React.ReactNode;
    color?: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose';
    subtext?: string | React.ReactNode;
    // New advanced props
    monthlyGoal?: number; // objetivo mensual
    lastYearValue?: number; // valor mismo mes año anterior
    showPrediction?: boolean; // mostrar proyección
    rawValue?: number; // Raw number for accurate calc
    // Micro-KPIs for Revenue card
    orders?: number;
    totalHours?: number;
    bestDay?: string;
    alignHeader?: 'left' | 'center';
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
    alignHeader = 'left'
}) => {
    // Map colors to hex values for charts and badge intents
    const colorMap: Record<string, { main: string, intent: BadgeIntent }> = {
        blue: { main: '#3b82f6', intent: 'info' },
        purple: { main: '#8b5cf6', intent: 'accent' },
        emerald: { main: '#10b981', intent: 'success' },
        amber: { main: '#f59e0b', intent: 'warning' },
        rose: { main: '#f43f5e', intent: 'danger' },
    };

    const theme = colorMap[color];
    const isPositive = trend && trend >= 0;

    // Advanced calculations
    // Use rawValue if provided, otherwise failover to parsing (which is risky for EUR format)
    const numericValue = rawValue !== undefined
        ? rawValue
        : (typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value);

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

    // Trend Text Description
    let trendText = '';
    if (trend !== undefined) {
        if (isStrongTrend) trendText = isPositive ? 'Crecimiento Fuerte' : 'Caída Fuerte';
        else if (isModerateTrend) trendText = isPositive ? 'Crecimiento Moderado' : 'Reducción Moderada';
        else trendText = isPositive ? 'Crecimiento Leve' : 'Reducción Leve';
    }

    // Format trend data for recharts
    const chartData = trendData?.map((val, i) => ({ i, val, label: `Día ${i + 1}` })) || [];

    // Trend Badge Intent override (always traffic light for +/-)
    const trendBadgeIntent: BadgeIntent = isPositive ? 'success' : 'danger';

    return (
        <Card className="h-full relative group animate-in fade-in zoom-in-95 duration-500 ease-out hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50">

            {/* Critical Alert Banner */}
            {isCriticalDrop && (
                <div className="absolute top-0 left-0 right-0 bg-rose-500 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 z-20 rounded-t-xl">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Alerta: Caída significativa</span>
                </div>
            )}

            {/* Header using Primitive */}
            <SectionHeader
                title={title}
                subtitle={null} // Subtitle removed entirely as requested
                icon={icon}
                className={isCriticalDrop ? 'mt-6' : ''}
                action={null}
                align={alignHeader}
            />

            {/* Main Value using Primitive */}
            <div className="mb-4 relative z-10">
                <StatValue
                    value={value}
                    description={undefined} // Removed redundant text description
                    size="xl"
                />
            </div>

            {/* Compact Badges Row: Orders + Trend */}
            <div className="mb-4 relative z-10 flex items-center justify-center gap-2">
                {orders && orders > 0 && (
                    <span className="inline-flex items-center gap-1 font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border border-indigo-100 dark:border-indigo-500/20">
                        {orders} PEDIDOS
                    </span>
                )}
                {trend !== undefined && (
                    <div title={trendText} className="cursor-help">
                        <Badge intent={trendBadgeIntent}>
                            {isPositive ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
                        </Badge>
                    </div>
                )}
            </div>

            {/* Micro-KPIs Strip - Premium Design */}
            {(orders || totalHours || bestDay) && (
                <div className="flex items-stretch gap-0 mb-4 relative z-10 bg-slate-50/80 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-700/50 overflow-hidden shadow-inner">
                    {/* Ticket Medio */}
                    {orders && orders > 0 && numericValue > 0 && (
                        <div className="flex-1 py-2 px-2.5 text-center border-r border-slate-200/60 dark:border-slate-700/40 hover:bg-white/60 dark:hover:bg-slate-700/30 transition-colors">
                            <div className="flex items-center justify-center gap-1 mb-0.5" title="Ticket Medio por Pedido">
                                <Receipt className="w-2.5 h-2.5 text-blue-500" />
                                <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wide">Ticket</span>
                            </div>
                            <div className="text-xs font-black text-slate-800 dark:text-slate-100 tabular-nums">
                                {(numericValue / orders).toFixed(2)}€
                            </div>
                        </div>
                    )}

                    {/* Mejor Día */}
                    {bestDay && (
                        <div className="flex-1 py-2 px-2.5 text-center border-r border-slate-200/60 dark:border-slate-700/40 hover:bg-white/60 dark:hover:bg-slate-700/30 transition-colors">
                            <div className="flex items-center justify-center gap-1 mb-0.5" title="Día con mayor facturación">
                                <Flame className="w-2.5 h-2.5 text-amber-500" />
                                <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wide">Top</span>
                            </div>
                            <div className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                                {bestDay}
                            </div>
                        </div>
                    )}

                    {/* Ingresos por Hora */}
                    {totalHours && totalHours > 0 && numericValue > 0 && (
                        <div className="flex-1 py-2 px-2.5 text-center hover:bg-white/60 dark:hover:bg-slate-700/30 transition-colors">
                            <div className="flex items-center justify-center gap-1 mb-0.5" title="Ingresos medios por hora operativa">
                                <Clock className="w-2.5 h-2.5 text-emerald-500" />
                                <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wide">€/h</span>
                            </div>
                            <div className="text-xs font-black text-slate-800 dark:text-slate-100 tabular-nums">
                                {(numericValue / totalHours).toFixed(0)}€
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Monthly Goal Progress (Custom but clean) */}
            {monthlyGoal && goalProgress !== null && (
                <div className="mb-4 relative z-10">
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1">
                            <Target className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Objetivo Mensual</span>
                        </div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{goalProgress.toFixed(0)}%</span>
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

            {/* Chart (Custom) */}
            {trendData && trendData.length > 0 && (
                <div className="mt-auto h-24 w-full relative z-10 opacity-60 group-hover:opacity-100 transition-all duration-500">
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
        </Card>
    );
};

export default KPICard;
