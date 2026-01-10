import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { List, PieChart as PieChartIcon } from 'lucide-react';
import { formatMoney } from '../../../../lib/finance';
import { Card } from '../../../../ui/primitives/Card';
import { SectionHeader } from '../../../../ui/primitives/SectionHeader';

interface ExpenseCategory {
    label: string;
    amount: number;
    color?: string;
}

interface ExpenseBreakdownWidgetProps {
    breakdown: ExpenseCategory[];
}

const ExpenseBreakdownWidget: React.FC<ExpenseBreakdownWidgetProps> = ({ breakdown }) => {
    const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');

    // 1. Sort by amount descending
    const sortedData = [...breakdown].sort((a, b) => b.amount - a.amount);

    // 2. Calculate total for percentage bars
    const totalExpenses = sortedData.reduce((sum, item) => sum + item.amount, 0);

    // Modern Finance Color Palette - Repeating if necessary
    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6', '#f97316'];

    // Prepare data for donut chart
    const chartData = sortedData.map((item, index) => ({
        name: item.label,
        value: item.amount,
        color: item.color || COLORS[index % COLORS.length]
    }));

    // Custom tooltip for donut
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            const percent = totalExpenses > 0 ? (data.value / totalExpenses) * 100 : 0;
            return (
                <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg">
                    <p className="text-xs font-bold text-slate-800 mb-1">{data.name}</p>
                    <p className="text-sm font-black text-indigo-600 tabular-nums">
                        {formatMoney(data.value)}€
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                        {percent.toFixed(1)}% del total
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="h-full flex flex-col overflow-hidden">
            {/* Header with Toggle */}
            <SectionHeader
                title="Desglose de Gastos"
                subtitle={viewMode === 'list' ? `${sortedData.length} categorías` : 'Visualización gráfica'}
                action={
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-1 flex gap-1 border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                            title="Lista"
                        >
                            <List className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setViewMode('chart')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'chart'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                            title="Gráfico"
                        >
                            <PieChartIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>
                }
            />

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
                {viewMode === 'list' ? (
                    /* COMPACT LIST VIEW - ALL EXPENSES */
                    <div className="h-full overflow-auto custom-scrollbar pr-2 space-y-1.5">
                        {sortedData.map((item, index) => {
                            const percent = totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0;
                            const color = item.color || COLORS[index % COLORS.length];

                            return (
                                <div
                                    key={index}
                                    className="group flex items-center justify-between py-2 px-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
                                >
                                    {/* Left: Color Dot + Label */}
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: color }}
                                        />
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                                            {item.label}
                                        </span>
                                    </div>

                                    {/* Right: Amount + % + Mini Bar */}
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums min-w-[70px] text-right">
                                            {formatMoney(item.amount)}€
                                        </span>
                                        <span className="text-[10px] text-slate-400 w-10 text-right tabular-nums font-bold">
                                            {percent.toFixed(1)}%
                                        </span>
                                        {/* Mini Progress Bar */}
                                        <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${Math.max(percent, 2)}%`,
                                                    backgroundColor: color
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Total Box - Compact */}
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-900 rounded-xl p-3 mt-3 sticky bottom-0">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wide">
                                    Total
                                </span>
                                <span className="text-xl font-black text-indigo-900 dark:text-indigo-100 tabular-nums">
                                    {formatMoney(totalExpenses)}€
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* DONUT CHART VIEW */
                    <div className="h-full flex flex-col">
                        {/* Donut Chart */}
                        <div className="w-full h-[180px] flex-shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={70}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Center Total */}
                        <div className="text-center py-3 flex-shrink-0 border-b border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Total Gastos</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                                {formatMoney(totalExpenses)}€
                            </p>
                        </div>

                        {/* Legend - Compact & Scrollable */}
                        <div className="flex-1 overflow-auto custom-scrollbar mt-3 space-y-1 px-1">
                            {chartData.map((item, index) => {
                                const percent = (item.value / totalExpenses) * 100;
                                return (
                                    <div key={index} className="flex items-center justify-between py-1.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded transition-colors text-xs">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <span className="font-medium text-slate-600 dark:text-slate-400 truncate">
                                                {item.name}
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-2 flex-shrink-0">
                                            <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                                                {formatMoney(item.value)}€
                                            </span>
                                            <span className="text-[10px] text-slate-400 w-10 text-right tabular-nums">
                                                {percent.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default ExpenseBreakdownWidget;
