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
        <div className="w-full h-[300px] bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Desglose Financiero</h3>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => [`${value.toFixed(2)}€`, 'Cantidad']}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Beneficio Neto</p>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{stats.netResultAfterAmortization.toFixed(2)}€</p>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Margen</p>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{stats.totalExpenses > 0 ? ((stats.profit / (stats.profit + stats.totalExpenses)) * 100).toFixed(1) : 0}%</p>
                </div>
            </div>
        </div>
    );
};
