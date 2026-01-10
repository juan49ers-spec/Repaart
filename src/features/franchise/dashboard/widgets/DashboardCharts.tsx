import React, { useMemo, type FC, type CSSProperties } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { formatMoney } from '../../../../lib/finance';
import { TrendingUp, PieChart as PieIcon } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface TooltipPayloadEntry {
    name: string;
    value: number;
    color: string;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadEntry[];
    label?: string;
}

const CustomTooltip: FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-panel p-3 border border-white/60 shadow-xl rounded-xl backdrop-blur-md bg-white/80">
                <p className="font-bold text-slate-800 mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm mb-1">
                        <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color } as CSSProperties} />
                        <span className="text-slate-500 capitalize">{entry.name}:</span>
                        <span className="font-mono font-medium text-slate-700">
                            {formatMoney(entry.value)}€
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

interface BreakdownItem {
    name: string;
    value: number;
}

interface Report {
    revenue?: number;
    expenses?: number;
    profit?: number;
    breakdown?: BreakdownItem[];
}

interface BarDataItem {
    name: string;
    Ingresos: number;
    Gastos: number;
    Beneficio: number;
}

interface PieDataItem {
    name: string;
    value: number;
}

interface DashboardChartsProps {
    report: Report | null;
}

const DashboardCharts: FC<DashboardChartsProps> = ({ report }) => {
    // Memoize expensive data transformations
    const { barData, finalPieData } = useMemo(() => {
        // Prepare Data for Bar Chart
        const barData: BarDataItem[] = [
            {
                name: 'Resumen Financiero',
                Ingresos: report?.revenue || 0,
                Gastos: report?.expenses || 0,
                Beneficio: report?.profit || 0
            }
        ];

        // Prepare Data for Pie Chart (Cost Breakdown)
        const pieData: PieDataItem[] = report?.breakdown?.filter(bg => bg.value > 0).map(item => ({
            name: item.name,
            value: item.value
        })) || [];

        pieData.sort((a, b) => b.value - a.value);

        let finalPieData = pieData;
        if (pieData.length > 5) {
            const top5 = pieData.slice(0, 5);
            const others = pieData.slice(5).reduce((acc, curr) => acc + curr.value, 0);
            finalPieData = [...top5, { name: 'Otros', value: others }];
        }

        return { barData, finalPieData };
    }, [report?.revenue, report?.expenses, report?.profit, report?.breakdown]);



    return (
        <div className="animate-fade-in-up">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Main Bar Chart */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-ios-xl relative group transition-all duration-300 hover:shadow-lg">
                    {/* Ambient Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/5 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-400/10 transition-colors" />

                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <div className="p-2 bg-indigo-50 rounded-lg shadow-sm">
                                <TrendingUp className="w-5 h-5 text-indigo-500" />
                            </div>
                            Rendimiento Financiero
                        </h3>
                        {/* Legend Chips */}
                        <div className="flex gap-2 text-[10px] md:text-xs font-bold uppercase tracking-wider">
                            <span className="px-2 py-1 bg-indigo-50/80 text-indigo-600 rounded-md border border-indigo-100">Ingresos</span>
                            <span className="px-2 py-1 bg-rose-50/80 text-rose-600 rounded-md border border-rose-100">Gastos</span>
                            <span className="px-2 py-1 bg-emerald-50/80 text-emerald-600 rounded-md border border-emerald-100">Beneficio</span>
                        </div>
                    </div>

                    <div className="h-80 w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={barData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorBeneficio" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(val: number) => `${val / 1000}k`} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '5 5' }} />
                                <Area type="monotone" dataKey="Ingresos" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" animationDuration={1500} />
                                <Area type="monotone" dataKey="Gastos" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorGastos)" animationDuration={1500} />
                                <Area type="monotone" dataKey="Beneficio" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorBeneficio)" animationDuration={1500} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Cost Breakdown Pie Chart */}
                <div className="glass-panel p-6 rounded-ios-xl relative group transition-all duration-300 hover:shadow-lg">
                    {/* Ambient Glow */}
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-400/5 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-400/10 transition-colors" />

                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 relative z-10">
                        <div className="p-2 bg-amber-50 rounded-lg shadow-sm">
                            <PieIcon className="w-5 h-5 text-amber-500" />
                        </div>
                        Distribución
                    </h3>

                    <div className="h-64 w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={finalPieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={85}
                                    paddingAngle={4}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {finalPieData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center Text Summary */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total</p>
                            <p className="text-xl font-black text-slate-800">{formatMoney(report?.expenses)}€</p>
                        </div>
                    </div>

                    {/* Custom Legend */}
                    <div className="mt-4 space-y-2.5 max-h-40 overflow-y-auto pr-1 scrollbar-hide relative z-10">
                        {finalPieData.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between text-sm group cursor-default p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] } as CSSProperties} />
                                    <span className="text-slate-600 font-medium truncate max-w-[110px]" title={entry.name}>{entry.name}</span>
                                </div>
                                <span className="font-bold text-slate-800">{((entry.value / (report?.expenses || 1)) * 100).toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(DashboardCharts);
