import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatMoney } from '../../../../lib/finance';
import { Card } from '../../../../ui/primitives/Card';
import { SectionHeader } from '../../../../ui/primitives/SectionHeader';
import { Badge } from '../../../../ui/primitives/Badge';

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
    const avgProfit = avgRevenue - avgExpenses;

    // Trend Calculation (Last active month vs Previous active month)
    const lastMonth = activeMonths[activeMonths.length - 1] || data[data.length - 1];
    const prevMonth = activeMonths[activeMonths.length - 2] || data[data.length - 2];

    const revenueTrend = (prevMonth && prevMonth.revenue > 0)
        ? ((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100
        : 0;

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
        <Card className="h-full flex flex-col group border-t-white/50">
            {/* Header */}
            <SectionHeader
                title="Evolución Financiera"
                subtitle="Métricas de facturación y rentabilidad mensual"
                icon={<TrendingUp className="w-5 h-5 text-indigo-500" />}
                action={
                    <Badge intent={revenueTrend >= 0 ? 'success' : 'danger'}>
                        {revenueTrend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(revenueTrend).toFixed(1)}%
                    </Badge>
                }
            />

            <div className="flex items-center gap-10 mb-8 pl-2">
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        Ingresos Promedio
                    </p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-slate-800 dark:text-white tabular-nums">{formatMoney(avgRevenue)}</span>
                        <span className="text-base font-bold text-slate-300">€</span>
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Beneficio Neto
                    </p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-emerald-600 tabular-nums">{formatMoney(avgProfit)}</span>
                        <span className="text-base font-bold text-emerald-200">€</span>
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 w-full min-h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                            dy={15}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#cbd5e1', fontSize: 10, fontWeight: 600 }}
                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                            width={45}
                        />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-white/95 backdrop-blur-md border border-slate-200/60 p-4 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 ring-1 ring-black/5">
                                            <p className="text-[10px] font-black text-slate-400 border-b border-slate-100 pb-2 mb-3 tracking-widest uppercase">{label}</p>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between gap-8">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                                        <span className="text-xs font-bold text-slate-800">Ingresos</span>
                                                    </div>
                                                    <span className="text-xs font-black text-slate-900">{formatMoney(data.revenue)}€</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                                                        <span className="text-xs font-bold text-slate-800">Gastos</span>
                                                    </div>
                                                    <span className="text-xs font-black text-slate-900">{formatMoney(data.expenses)}€</span>
                                                </div>
                                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                                        <span className="text-xs font-black text-emerald-600 uppercase tracking-tighter">Beneficio Neto</span>
                                                    </div>
                                                    <span className="text-sm font-black text-emerald-600">{formatMoney(data.profit)}€</span>
                                                </div>
                                                {data.change !== 0 && (
                                                    <div className={`text-[10px] font-bold flex items-center gap-1 ${data.change > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {data.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                        {Math.abs(data.change).toFixed(1)}% respecto al mes anterior
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                            cursor={{ stroke: '#6366f1', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                        />

                        {/* Reference Line for Avg Revenue */}
                        <ReferenceLine
                            y={avgRevenue}
                            stroke="#6366f1"
                            strokeDasharray="3 3"
                            strokeWidth={1.5}
                            opacity={0.3}
                        />

                        {/* Areas */}
                        <Area
                            type="monotone"
                            dataKey="expenses"
                            stroke="#f43f5e"
                            strokeWidth={1.5}
                            fillOpacity={1}
                            fill="url(#colorExpenses)"
                            animationDuration={1500}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#6366f1"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            animationDuration={1500}
                        />
                        <Area
                            type="monotone"
                            dataKey="profit"
                            stroke="#10b981"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorProfit)"
                            animationDuration={1500}
                            strokeDasharray="5 5"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default RevenueAreaChart;
