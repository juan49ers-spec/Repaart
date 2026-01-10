import React from 'react';
import { X, TrendingUp, TrendingDown, Edit3, PieChart as PieChartIcon } from 'lucide-react';
import { MonthlyRecord } from '../../../hooks/useFranchiseHistory';
import { formatMoney } from '../../../lib/finance';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface QuickViewPanelProps {
    record: MonthlyRecord;
    onClose: () => void;
    onEdit: () => void;
    canEdit?: boolean;
}

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b'];

const QuickViewPanel: React.FC<QuickViewPanelProps> = ({ record, onClose, onEdit, canEdit = true }) => {
    const isPositive = record.profit >= 0;
    const margin = record.revenue > 0 ? (record.profit / record.revenue) * 100 : 0;

    // Simple chart data (mock - real data would come from full record)
    const chartData = [
        { name: 'Equipo', value: 30 },
        { name: 'Flota', value: 25 },
        { name: 'Estructura', value: 20 },
        { name: 'Marketing', value: 25 },
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed right-0 top-0 bottom-0 w-full md:w-[480px] bg-slate-950 border-l border-slate-800 z-50 animate-in slide-in-from-right duration-300 overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-950 z-10">
                    <div>
                        <h2 className="text-xl font-black text-white">Vista Rápida</h2>
                        <p className="text-sm text-slate-500 font-mono mt-0.5">{record.month}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* KPIs Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Ingresos</p>
                            <p className="text-2xl font-black text-indigo-400 font-mono">{formatMoney(record.revenue)}€</p>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Gastos</p>
                            <p className="text-2xl font-black text-slate-400 font-mono">{formatMoney(record.totalExpenses)}€</p>
                        </div>
                    </div>

                    {/* Profit Card */}
                    <div className={`border rounded-2xl p-6 ${isPositive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs uppercase tracking-wider text-slate-400">Beneficio</p>
                            <span className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {margin.toFixed(1)}%
                            </span>
                        </div>
                        <p className={`text-3xl font-black font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatMoney(record.profit)}€
                        </p>
                    </div>

                    {/* Chart */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <PieChartIcon className="w-4 h-4 text-slate-500" />
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Distribución Estimada</h3>
                        </div>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center mt-4">
                            {chartData.map((item, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                                    <span className="text-xs text-slate-500">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Button */}
                    {canEdit && (
                        <button
                            onClick={onEdit}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                        >
                            <Edit3 className="w-4 h-4" />
                            Editar Mes Completo
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

export default QuickViewPanel;
