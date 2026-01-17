import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { List, PieChart as PieChartIcon, Users, Bike, Car, Fuel, Building2, Smartphone, ShieldCheck, Briefcase, Landmark, FileText, MoreHorizontal, Wrench } from 'lucide-react';
import { formatMoney } from '../../../../lib/finance';
import { Card } from '../../../../ui/primitives/Card';


// Icon mapping for expense categories
const EXPENSE_ICONS: Record<string, typeof Users> = {
    'salarios': Users,
    'nominas': Users,
    'personal': Users,
    'seguros': ShieldCheck,
    'renting': Bike,
    'motos': Bike,
    'flota': Car,
    'royalty': Building2,
    'app': Smartphone,
    'software': Smartphone,
    'flyder': Smartphone,
    'gasolina': Fuel,
    'combustible': Fuel,
    'autonomo': Briefcase,
    'cuota': Briefcase,
    'financieros': Landmark,
    'banco': Landmark,
    'gestoria': FileText,
    'asesoria': FileText,
    'legal': FileText,
    'mantenimiento': Wrench,
    'reparaciones': Wrench,
    'otros': MoreHorizontal,
    'varios': MoreHorizontal,
    'default': MoreHorizontal
};

const getExpenseIcon = (label: string) => {
    const lowerLabel = label.toLowerCase();
    for (const [key, Icon] of Object.entries(EXPENSE_ICONS)) {
        if (lowerLabel.includes(key)) return Icon;
    }
    return EXPENSE_ICONS.default;
};

interface ExpenseCategory {
    label: string;
    amount: number;
    color?: string;
}

interface ExpenseBreakdownWidgetProps {
    breakdown: ExpenseCategory[];
}

// Custom tooltip for donut
const CustomTooltip = ({ active, payload, totalExpenses }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        const percent = totalExpenses > 0 ? (data.value / totalExpenses) * 100 : 0;
        return (
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg">
                <p className="text-sm font-bold text-slate-800 mb-1">{data.name}</p>
                <p className="text-base font-black text-indigo-600 tabular-nums">
                    {formatMoney(data.value)}€
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                    {percent.toFixed(1)}% del total
                </p>
            </div>
        );
    }
    return null;
};

const ExpenseBreakdownWidget: React.FC<ExpenseBreakdownWidgetProps> = ({ breakdown }) => {
    const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');

    // 1. Sort by amount descending
    const sortedData = [...breakdown].sort((a, b) => b.amount - a.amount);

    // 2. Calculate total for percentage bars
    const totalExpenses = sortedData.reduce((sum, item) => sum + item.amount, 0);

    // Modern Finance Color Palette - Repeating if necessary
    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6', '#f97316'];

    // Prepare data for display (show all expenses)
    const displayData = sortedData;
    const chartData = displayData.map((item, index) => ({
        name: item.label,
        value: item.amount,
        color: item.color || COLORS[index % COLORS.length]
    }));




    return (
        <Card className="flex flex-col overflow-hidden pt-2 px-3 pb-3">
            {/* Header with Toggle */}
            <div className="flex items-center justify-between mb-2 shrink-0">
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-base">Desglose de Gastos</h3>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 flex gap-0.5 border border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1 rounded-md transition-all ${viewMode === 'list'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                        title="Lista"
                    >
                        <List className="w-3 h-3" />
                    </button>
                    <button
                        onClick={() => setViewMode('chart')}
                        className={`p-1 rounded-md transition-all ${viewMode === 'chart'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                        title="Gráfico"
                    >
                        <PieChartIcon className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
                {viewMode === 'list' ? (
                    /* EXPANDED LIST VIEW - ALL EXPENSES WITH ICONS */
                    <div className="flex flex-col h-full">
                        <div className="overflow-auto min-h-0 space-y-0.5 pr-1">
                            {displayData.map((item, index) => {
                                const percent = totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0;
                                const color = item.color || COLORS[index % COLORS.length];
                                const Icon = getExpenseIcon(item.label);

                                return (
                                    <div
                                        key={index}
                                        className="group flex items-center justify-between py-0.5 px-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
                                    >
                                        {/* Left: Icon with tooltip + Amount */}
                                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                            <div
                                                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 cursor-help transition-transform group-hover:scale-105"
                                                style={{ backgroundColor: `${color}15` }}
                                                title={item.label}
                                            >
                                                <Icon className="w-4 h-4" style={{ color }} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                                                {formatMoney(item.amount)}€
                                            </span>
                                        </div>

                                        {/* Right: % + Mini Bar */}
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className="text-xs text-slate-400 w-8 text-right tabular-nums font-semibold">
                                                {percent.toFixed(0)}%
                                            </span>
                                            <div className="w-8 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Total Box - Compact & Minimalist */}
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between px-2">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    TOTAL
                                </span>
                                <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                                    {formatMoney(totalExpenses)}€
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* DONUT CHART VIEW */
                    <div className="w-full flex items-center justify-center p-2">
                        {/* Donut Chart - Full Space */}
                        <div className="w-full h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip totalExpenses={totalExpenses} />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default ExpenseBreakdownWidget;
