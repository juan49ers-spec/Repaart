import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatMoney } from '../../../../lib/finance';

import type { TrendItem } from '../../../../types/finance';

interface MonthlyTrendChartProps {
    last6Months: TrendItem[];
}


const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-panel-exec p-3 border border-slate-700/50 shadow-2xl rounded-xl backdrop-blur-xl bg-slate-900/90">
                <p className="font-bold text-slate-200 mb-2 border-b border-slate-700 pb-1 text-xs uppercase tracking-wider">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm py-0.5">
                        <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)] ${entry.name === 'Ingresos' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                        <span className="text-slate-400 text-xs">{entry.name}:</span>
                        <span className={`font-bold font-mono ${Number(entry.value) >= 0 ? entry.name === 'Ingresos' ? 'text-blue-400' : 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatMoney(Number(entry.value))}€
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({ last6Months }) => {
    // console.log("DEBUG: MonthlyTrendChart mounted"); // Removed debug log for release

    if (!last6Months || last6Months.length === 0) {
        return (
            <div className="glass-panel-exec rounded-2xl p-8 border border-white/5 text-center text-slate-500 h-full flex items-center justify-center">
                <p className="text-sm font-medium">Sin datos históricos disponibles</p>
            </div>
        );
    }

    // Format data for chart
    const data = last6Months.map(m => {
        // Handle "YYYY-MM" string safely across browsers
        const [y, mo] = m.month.split('-');
        const date = new Date(Number(y), Number(mo) - 1, 1);

        return {
            month: date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
            Ingresos: m.revenue || 0,
            Beneficio: m.profit || 0
        };
    });

    return (
        <div className="glass-panel-exec rounded-2xl p-6 md:p-8 relative group transition-all duration-500 hover:border-slate-600/50 h-full">
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 bg-indigo-500/10 rounded-lg shadow-inner border border-indigo-500/20">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h3 className="font-bold text-white text-sm md:text-base tracking-tight">Evolución Semestral</h3>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Histórico de Performance</p>
                </div>
            </div>

            <div className="h-[280px] md:h-[320px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.4} vertical={false} />
                        <XAxis
                            dataKey="month"
                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                            dy={15}
                        />
                        <YAxis
                            tick={{ fill: '#475569', fontSize: 10, fontWeight: 500 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            dx={-5}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Legend
                            wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}
                            iconType="circle"
                        />
                        <Line
                            type="monotone"
                            dataKey="Ingresos"
                            stroke="#60a5fa"
                            strokeWidth={3}
                            dot={{ fill: '#0f172a', stroke: '#60a5fa', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#bfdbfe' }}
                            animationDuration={2000}
                        />
                        <Line
                            type="monotone"
                            dataKey="Beneficio"
                            stroke="#34d399"
                            strokeWidth={3}
                            dot={{ fill: '#0f172a', stroke: '#34d399', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#a7f3d0' }}
                            animationDuration={2000}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default React.memo(MonthlyTrendChart);
