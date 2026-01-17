import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatMoney } from '../../../../lib/finance';
import { Card } from '../../../../components/ui/primitives/Card';
import { SectionHeader } from '../../../../components/ui/primitives/SectionHeader';

interface RevenueData {
    month: string;
    revenue: number;
    expenses?: number;
}

interface RevenueAreaChartProps {
    data: RevenueData[];
}

const RevenueAreaChart: React.FC<RevenueAreaChartProps> = ({ data }) => {
    // Calculate stats - Filter out months with 0 activity for realistic averages
    const activeMonths = data.filter(d => d.revenue > 0 || (d.expenses || 0) > 0);
    const divider = activeMonths.length || 1; // Prevent div by 0

    const avgRevenue = activeMonths.reduce((sum, d) => sum + d.revenue, 0) / divider;
    const avgExpenses = activeMonths.reduce((sum, d) => sum + (d.expenses || 0), 0) / divider;

    // Trend Calculation (Last active month vs Previous active month)
    const lastMonth = activeMonths[activeMonths.length - 1] || data[data.length - 1];
    const prevMonth = activeMonths[activeMonths.length - 2] || data[data.length - 2];

    const revenueTrend = (prevMonth && prevMonth.revenue > 0)
        ? ((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100
        : 0;

    // NEW: Best month by revenue
    const bestMonth = activeMonths.reduce((best, current) =>
        current.revenue > (best?.revenue || 0) ? current : best, activeMonths[0]);

    // NEW: Average margin percentage
    const avgMargin = avgRevenue > 0 ? ((avgRevenue - avgExpenses) / avgRevenue) * 100 : 0;

    // NEW: Count of profitable months
    const profitableMonths = activeMonths.filter(d =>
        d.revenue - (d.expenses || 0) > 0).length;

    // Prepare chart data with profit and percentage change
    const chartData = data.map((d, i) => {
        const prev = data[i - 1];
        const change = prev && prev.revenue > 0 ? ((d.revenue - prev.revenue) / prev.revenue) * 100 : 0;
        return {
            ...d,
            profit: d.revenue - (d.expenses || 0),
            change: change
        };
    });

    return (
        <Card className="h-full flex flex-col">
            {/* Header - Simplified, no duplicate badge */}
            {/* Header - Simplified, no duplicate badge */}
            <SectionHeader
                title="Evolución 6 meses"
                subtitle={undefined}
                icon={<TrendingUp className="w-5 h-5 text-indigo-500" />}
            />

            {/* 4 Mini-KPIs Strip */}
            {/* 4 Mini-KPIs Strip - 2x2 Grid for compact view */}
            {/* 4 Mini-KPIs 2x2 Grid - Minimal & Fine Design */}
            <div className="shrink-0 grid grid-cols-2 gap-2 mb-2">
                {/* Tendencia */}
                <div
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col items-center justify-center cursor-help"
                    title="Comparativa de ingresos respecto al mes anterior"
                >
                    <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">Tendencia</div>
                    <div className={`text-xs font-bold ${revenueTrend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {revenueTrend >= 0 ? '↗' : '↘'} {Math.abs(revenueTrend).toFixed(0)}%
                    </div>
                </div>

                {/* Mejor Mes */}
                <div
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col items-center justify-center cursor-help"
                    title="El mes con mayor facturación del periodo"
                >
                    <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">Mejor Mes</div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {bestMonth?.month?.substring(0, 3) || '-'}
                    </div>
                </div>

                {/* Margen */}
                <div
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col items-center justify-center cursor-help"
                    title="Porcentaje promedio de beneficio sobre ingresos"
                >
                    <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">Margen</div>
                    <div className="text-xs font-bold text-indigo-500 tabular-nums">
                        {avgMargin.toFixed(0)}%
                    </div>
                </div>

                {/* Rentables */}
                <div
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col items-center justify-center cursor-help"
                    title="Número de meses con saldo positivo (Ingresos > Gastos)"
                >
                    <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">Rentables</div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                        {profitableMonths}/{activeMonths.length}
                    </div>
                </div>
            </div>

            {/* Simplified Chart - Visual only */}
            <div className="flex-1 w-full min-h-[60px] relative opacity-80">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 8 }}
                        />
                        <YAxis hide />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-white border border-slate-200 p-2 rounded-lg shadow-lg text-xs">
                                            <p className="font-bold text-slate-600">{label}</p>
                                            <p className="text-indigo-600 font-black">{formatMoney(payload[0].value as number)}€</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            animationDuration={1000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default RevenueAreaChart;
