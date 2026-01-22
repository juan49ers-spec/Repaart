import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { List, PieChart as PieChartIcon, Users, Bike, Car, Fuel, Building2, Smartphone, ShieldCheck, Briefcase, Landmark, FileText, MoreHorizontal, Wrench, Activity } from 'lucide-react';
import { formatMoney } from '../../../../lib/finance';
import { cn } from '../../../../lib/utils';

const EXPENSE_ICONS: Record<string, typeof Users> = {
    'salarios': Users, 'nominas': Users, 'personal': Users, 'social': Users, 'seguridad social': Users, 'seguros': ShieldCheck, 'renting': Bike, 'motos': Bike, 'flota': Car,
    'royalty': Building2, 'app': Smartphone, 'software': Smartphone, 'flyder': Smartphone, 'gasolina': Fuel, 'combustible': Fuel,
    'autonomo': Briefcase, 'cuota': Briefcase, 'financieros': Landmark, 'banco': Landmark, 'gestoria': FileText, 'asesoria': FileText,
    'legal': FileText, 'mantenimiento': Wrench, 'reparaciones': Wrench, 'otros': MoreHorizontal, 'varios': MoreHorizontal, 'default': MoreHorizontal
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

const CustomTooltip = ({ active, payload, totalExpenses }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        const percent = totalExpenses > 0 ? (data.value / totalExpenses) * 100 : 0;
        return (
            <div className="bg-slate-900 border border-white/10 rounded-xl p-3 shadow-2xl">
                <p className="text-xs font-semibold text-white/60 mb-1 capitalize">{data.name}</p>
                <p className="text-lg font-bold text-rose-500 tabular-nums">
                    {formatMoney(data.value)}€
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <p className="text-xs font-medium text-white/80">
                        {percent.toFixed(1)}% del total
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

const ExpenseBreakdownWidget: React.FC<ExpenseBreakdownWidgetProps> = ({ breakdown }) => {
    const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');
    const sortedData = [...breakdown].sort((a, b) => b.amount - a.amount);
    const totalExpenses = sortedData.reduce((sum, item) => sum + item.amount, 0);
    const COLORS = ['#e11d48', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6', '#f97316'];

    const chartData = sortedData.map((item, index) => ({
        name: item.label,
        value: item.amount,
        color: item.color || COLORS[index % COLORS.length]
    }));

    return (
        <div className="workstation-card workstation-scanline p-6 h-full flex flex-col group/card transition-all mechanical-press overflow-hidden min-h-[460px]">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                        <Activity className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
                        Desglose de Gastos
                    </h3>
                </div>
                <div className="bg-slate-100 dark:bg-white/5 rounded-lg p-0.5 flex gap-1 border border-slate-200 dark:border-white/5">
                    <button
                        onClick={(e) => { e.stopPropagation(); setViewMode('list'); }}
                        className={cn(
                            "p-1.5 rounded transition-all",
                            viewMode === 'list' ? 'bg-ruby-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                        )}
                    >
                        <List className="w-3 h-3" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setViewMode('chart'); }}
                        className={cn(
                            "p-1.5 rounded transition-all",
                            viewMode === 'chart' ? 'bg-ruby-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                        )}
                    >
                        <PieChartIcon className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* HIGH-DENSITY CONTENT */}
            <div className="flex-1 min-h-0 flex flex-col">
                {viewMode === 'list' ? (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto pr-1 space-y-1">
                            {sortedData.map((item, index) => {
                                const percent = totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0;
                                const color = item.color || COLORS[index % COLORS.length];
                                const Icon = getExpenseIcon(item.label);

                                return (
                                    <div key={index} className="group/item flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-rose-200 dark:hover:border-rose-900/30 transition-all">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                                                <Icon className="w-4 h-4" style={{ color }} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate capitalize">{item.label}</p>
                                                <p className="text-xs font-bold text-rose-600 tabular-nums">{formatMoney(item.amount)}€</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-xs font-medium text-slate-400 tabular-nums">{percent.toFixed(0)}%</span>
                                            <div className="w-12 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${percent}%`, backgroundColor: color }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* AGGREGATE SUMMARY */}
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                            <div className="flex items-center justify-between px-2">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Gastos</p>
                                <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums bg-slate-100 dark:bg-white/10 px-3 py-1 rounded-lg border border-slate-200 dark:border-white/5">
                                    {formatMoney(totalExpenses)}€
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center p-4">
                        <div className="w-full h-[280px] relative">
                            {/* Technical Overlay */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Visualización</p>
                                <p className="text-xl font-bold text-rose-600">Gastos</p>
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} opacity={0.8} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip totalExpenses={totalExpenses} />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpenseBreakdownWidget;
