import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';

interface FinancialBreakdownChartProps {
    stats: {
        totalExpenses: number;
        profit: number;
        fixedCosts: number;
        variableCosts: number;
        royaltyAmount: number;
    };
    expenses: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
        <g>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 6}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                className="transition-all duration-300"
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 8}
                outerRadius={outerRadius + 12}
                fill={fill}
                opacity={0.3}
            />
        </g>
    );
};

export const FinancialBreakdownChart: React.FC<FinancialBreakdownChartProps> = ({ stats, expenses }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const rentingTotal = (expenses.renting?.count || 0) * (expenses.renting?.pricePerUnit || 0);

    // Prepare Data for Donut Chart
    const rawData = [
        { name: 'Nóminas y SS', value: (expenses.payroll || 0) + (expenses.socialSecurity || 0), color: '#6366f1' }, // Indigo
        { name: 'Renting Motos', value: rentingTotal, color: '#8b5cf6' }, // Violet
        { name: 'Combustible', value: expenses.fuel || 0, color: '#ec4899' }, // Pink
        { name: 'Royalties', value: stats.royaltyAmount || 0, color: '#f59e0b' }, // Amber
        { name: 'Servicios Prof.', value: expenses.professionalServices || 0, color: '#14b8a6' }, // Teal
        { name: 'Gestoría/Seguros', value: (expenses.agencyFee || 0) + (expenses.insurance || 0) + (expenses.accountingFee || 0) + (expenses.prlFee || 0), color: '#3b82f6' }, // Blue
        { name: 'Incidencias/Rep.', value: (expenses.incidents || 0) + (expenses.repairs || 0), color: '#ef4444' } // Red
    ];

    const definedExpenses = rawData.reduce((acc, curr) => acc + curr.value, 0);
    const otherExpenses = stats.totalExpenses - definedExpenses;

    const data = [
        ...rawData,
        { name: 'Otros Gastos', value: otherExpenses > 0 ? otherExpenses : 0, color: '#94a3b8' } // Slate
    ].filter(i => i.value > 0);

    const totalIncome = stats.profit + stats.totalExpenses;
    const margin = totalIncome > 0 ? (stats.profit / totalIncome) * 100 : 0;
    const roi = stats.totalExpenses > 0 ? (stats.profit / stats.totalExpenses) * 100 : 0;

    return (
        <div className="w-full h-full min-h-[400px] bg-white dark:bg-slate-900/50 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-white/5 flex flex-col relative overflow-hidden">
            {/* Background flourish */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Distribución de Gastos</h3>
            </div>

            <div className="flex-1 min-h-[220px] relative z-10">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                activeIndex={activeIndex}
                                activeShape={renderActiveShape}
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={75}
                                paddingAngle={4}
                                dataKey="value"
                                stroke="none"
                                onMouseEnter={onPieEnter}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number) => [
                                    <span key="val" className="font-mono font-bold">{value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>,
                                    <span key="lbl" className="uppercase text-[10px] tracking-wider font-bold">Importe</span>
                                ]}
                                contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', backgroundColor: 'rgba(15, 23, 42, 0.95)', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend 
                                iconType="circle" 
                                wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '20px' }} 
                                layout="horizontal"
                                verticalAlign="bottom"
                                align="center"
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sin datos de gastos</p>
                    </div>
                )}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 relative z-10">
                <div className={`p-4 rounded-2xl border transition-all relative overflow-hidden group ${
                    stats.profit >= 0 
                        ? 'bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-500/10 dark:to-slate-900 border-emerald-200 dark:border-emerald-500/20 shadow-sm' 
                        : 'bg-gradient-to-br from-rose-50 to-white dark:from-rose-500/10 dark:to-slate-900 border-rose-200 dark:border-rose-500/20 shadow-sm'
                }`}>
                    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-40 -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-110 ${
                        stats.profit >= 0 ? 'bg-emerald-400' : 'bg-rose-400'
                    }`} />
                    <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 relative z-10 ${
                        stats.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                        Margen (Ventas)
                    </p>
                    <p className={`text-2xl font-bold tracking-tight tabular-nums relative z-10 ${
                        stats.profit >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                    }`}>
                        {margin.toFixed(1)}%
                    </p>
                </div>
                
                <div className={`p-4 rounded-2xl border transition-all relative overflow-hidden group ${
                    roi >= 0 
                        ? 'bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-500/10 dark:to-slate-900 border-indigo-200 dark:border-indigo-500/20 shadow-sm' 
                        : 'bg-gradient-to-br from-orange-50 to-white dark:from-orange-500/10 dark:to-slate-900 border-orange-200 dark:border-orange-500/20 shadow-sm'
                }`}>
                    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-40 -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-110 ${
                        roi >= 0 ? 'bg-indigo-400' : 'bg-orange-400'
                    }`} />
                    <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 relative z-10 ${
                        roi >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-orange-600 dark:text-orange-400'
                    }`}>
                        ROI (Sobre Gastos)
                    </p>
                    <p className={`text-2xl font-bold tracking-tight tabular-nums relative z-10 ${
                        roi >= 0 ? 'text-indigo-700 dark:text-indigo-300' : 'text-orange-700 dark:text-orange-300'
                    }`}>
                        {roi.toFixed(1)}%
                    </p>
                </div>
            </div>
        </div>
    );
};
