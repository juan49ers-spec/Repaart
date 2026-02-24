import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatMoney } from '../../../../lib/finance';

interface RevenueData {
    month: string;
    revenue: number;
    expenses?: number;
}

interface RevenueAreaChartProps {
    data: RevenueData[];
}

const RevenueAreaChart: React.FC<RevenueAreaChartProps> = ({ data }) => {
    const activeMonths = data.filter(d => d.revenue > 0 || (d.expenses || 0) > 0);
    const divider = activeMonths.length || 1;

    const avgRevenue = activeMonths.reduce((sum, d) => sum + d.revenue, 0) / divider;
    const avgExpenses = activeMonths.reduce((sum, d) => sum + (d.expenses || 0), 0) / divider;
    const avgMargin = avgRevenue > 0 ? ((avgRevenue - avgExpenses) / avgRevenue) * 100 : 0;

    const lastMonth = activeMonths[activeMonths.length - 1] || data[data.length - 1];
    const prevMonth = activeMonths[activeMonths.length - 2] || data[data.length - 2];
    const revenueTrend = (prevMonth && prevMonth.revenue > 0)
        ? ((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100
        : 0;

    const bestMonth = activeMonths.reduce((best, current) =>
        current.revenue > (best?.revenue || 0) ? current : best, activeMonths[0]);

    const profitableMonths = activeMonths.filter(d =>
        d.revenue - (d.expenses || 0) > 0).length;

    const chartData = data.map(d => ({
        ...d,
        profit: d.revenue - (d.expenses || 0),
    }));

    const kpis = [
        { label: 'Tendencia', value: `${revenueTrend >= 0 ? '↗' : '↘'} ${Math.abs(revenueTrend).toFixed(0)}%`, color: revenueTrend >= 0 ? 'text-emerald-600' : 'text-rose-600' },
        { label: 'Mejor Mes', value: bestMonth?.month?.substring(0, 3) || '—', color: 'text-slate-700 dark:text-slate-200' },
        { label: 'Margen', value: `${avgMargin.toFixed(0)}%`, color: 'text-indigo-600 dark:text-indigo-400' },
        { label: 'Rentables', value: `${profitableMonths}/${activeMonths.length}`, color: 'text-slate-700 dark:text-slate-200' },
    ];

    return (
        <div className="h-full flex flex-col">
            {/* Compact KPI strip */}
            <div className="flex items-center gap-4 mb-3">
                {kpis.map(kpi => (
                    <div key={kpi.label} className="flex items-baseline gap-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
                        <span className={`text-xs font-black tabular-nums ${kpi.color}`}>{kpi.value}</span>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="flex-1 w-full min-h-[60px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 600 }}
                            dy={5}
                        />
                        <YAxis hide />
                        <Tooltip
                            cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3', strokeOpacity: 0.4 }}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg shadow-lg">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
                                            <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                                                {formatMoney(payload[0].value as number)}€
                                            </p>
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
        </div>
    );
};

export default RevenueAreaChart;
