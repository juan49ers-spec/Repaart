import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface FinancialBreakdownChartProps {
    stats: {
        totalExpenses: number;
        profit: number;
        fixedCosts: number;
        variableCosts: number;
        royaltyAmount: number;
        netResultAfterAmortization: number;
    };
    expenses: any;
}

export const FinancialBreakdownChart: React.FC<FinancialBreakdownChartProps> = ({ stats, expenses }) => {

    // Prepare Data for Donut Chart
    const data = [
        { name: 'Nóminas', value: expenses.payroll || 0, color: '#6366f1' }, // Indigo
        { name: 'Motos', value: (expenses.renting?.count || 0) * (expenses.renting?.pricePerUnit || 0), color: '#8b5cf6' }, // Violet
        { name: 'Gasolina', value: expenses.fuel || 0, color: '#ec4899' }, // Pink
        { name: 'Royalties', value: stats.royaltyAmount || 0, color: '#f59e0b' }, // Amber
        { name: 'Beneficio', value: stats.profit > 0 ? stats.profit : 0, color: '#10b981' }, // Emerald
        { name: 'Otros', value: stats.totalExpenses - (expenses.payroll || 0) - ((expenses.renting?.count || 0) * (expenses.renting?.pricePerUnit || 0)) - (expenses.fuel || 0) - (stats.royaltyAmount || 0), color: '#94a3b8' } // Slate
    ].filter(i => i.value > 0);

    return (
        <div className="w-full h-full min-h-[350px] bg-white dark:bg-slate-900/50 rounded-3xl p-6 shadow-sm border border-slate-200/60 dark:border-white/5 flex flex-col">
            <h3 className="text-[11px] font-black tracking-[0.2em] text-slate-500 dark:text-slate-400 uppercase mb-6">Desglose Financiero</h3>
            <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => [`${value.toFixed(2)}€`, 'Cantidad']}
                            contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)', backgroundColor: 'rgba(15, 23, 42, 0.95)', color: '#fff' }}
                            itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '20px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-2xl border border-emerald-100 dark:border-emerald-500/10 transition-all hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest mb-1">Beneficio Neto</p>
                    <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">{stats.netResultAfterAmortization.toFixed(2)}€</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700/50 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/50">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">Margen</p>
                    <p className="text-xl font-black text-slate-700 dark:text-slate-200">{stats.totalExpenses > 0 ? ((stats.profit / (stats.profit + stats.totalExpenses)) * 100).toFixed(1) : 0}%</p>
                </div>
            </div>
        </div>
    );
};
