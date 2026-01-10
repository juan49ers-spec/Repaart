import React, { useMemo } from 'react';
import { X, TrendingUp, TrendingDown, ArrowRight, Lightbulb, AlertCircle, CheckCircle2, Target } from 'lucide-react';
import { MonthlyRecord } from '../../../hooks/useFranchiseHistory';
import { formatMoney } from '../../../lib/finance';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MonthComparisonModalProps {
    month1: MonthlyRecord;
    month2: MonthlyRecord;
    onClose: () => void;
}

interface ComparisonMetric {
    label: string;
    value1: number;
    value2: number;
    delta: number;
    deltaPercent: number;
}

/**
 * MonthComparisonModal - Premium comparison view for financial months
 * 
 * Features:
 * - Side-by-side month headers with visual hierarchy
 * - Interactive bar chart with Recharts
 * - Detailed delta table with color-coded trends
 * - Auto-generated insights based on data patterns
 * - Smooth animations and premium aesthetics
 * 
 * @param month1 - Base month for comparison
 * @param month2 - Target month to compare against
 * @param onClose - Callback to close modal
 */
const MonthComparisonModal: React.FC<MonthComparisonModalProps> = ({ month1, month2, onClose }) => {

    // ============================================
    // CALCULATIONS - Delta metrics for all KPIs
    // ============================================

    const metrics: ComparisonMetric[] = useMemo(() => {
        /**
         * Helper to calculate absolute and percentage deltas
         * Handles division by zero gracefully
         */
        const calculateDelta = (val1: number, val2: number) => ({
            delta: val2 - val1,
            deltaPercent: val1 !== 0 ? ((val2 - val1) / val1) * 100 : (val2 > 0 ? 100 : 0)
        });

        return [
            {
                label: 'Ingresos',
                value1: month1.revenue,
                value2: month2.revenue,
                ...calculateDelta(month1.revenue, month2.revenue)
            },
            {
                label: 'Gastos',
                value1: month1.totalExpenses,
                value2: month2.totalExpenses,
                ...calculateDelta(month1.totalExpenses, month2.totalExpenses)
            },
            {
                label: 'Beneficio',
                value1: month1.profit,
                value2: month2.profit,
                ...calculateDelta(month1.profit, month2.profit)
            }
        ];
    }, [month1, month2]);

    // ============================================
    // CHART DATA - Formatted for Recharts
    // ============================================

    const chartData = useMemo(() => [
        {
            name: 'Ingresos',
            [month1.month]: month1.revenue,
            [month2.month]: month2.revenue,
            category: 'positive' // Used for conditional coloring
        },
        {
            name: 'Gastos',
            [month1.month]: month1.totalExpenses,
            [month2.month]: month2.totalExpenses,
            category: 'negative'
        },
        {
            name: 'Beneficio',
            [month1.month]: month1.profit,
            [month2.month]: month2.profit,
            category: month1.profit >= 0 && month2.profit >= 0 ? 'positive' : 'negative'
        }
    ], [month1, month2]);

    // ============================================
    // INSIGHTS - Auto-generated based on data
    // ============================================

    const insights = useMemo(() => {
        const revenueMetric = metrics.find(m => m.label === 'Ingresos')!;
        const expensesMetric = metrics.find(m => m.label === 'Gastos')!;
        const profitMetric = metrics.find(m => m.label === 'Beneficio')!;

        const generated: Array<{ type: 'success' | 'warning' | 'info'; text: string; icon: typeof CheckCircle2 }> = [];

        // Revenue insights
        if (revenueMetric.deltaPercent > 20) {
            generated.push({
                type: 'success',
                text: `Excelente crecimiento de ingresos del ${revenueMetric.deltaPercent.toFixed(1)}%. ¡Sigue así!`,
                icon: CheckCircle2
            });
        } else if (revenueMetric.deltaPercent < -10) {
            generated.push({
                type: 'warning',
                text: `Los ingresos cayeron un ${Math.abs(revenueMetric.deltaPercent).toFixed(1)}%. Revisa estrategia comercial.`,
                icon: AlertCircle
            });
        }

        // Profit margin insights
        const margin1 = month1.revenue > 0 ? (month1.profit / month1.revenue) * 100 : 0;
        const margin2 = month2.revenue > 0 ? (month2.profit / month2.revenue) * 100 : 0;
        const marginDelta = margin2 - margin1;

        if (marginDelta > 5) {
            generated.push({
                type: 'success',
                text: `Margen de beneficio mejoró en ${marginDelta.toFixed(1)}pp. Eficiencia operativa óptima.`,
                icon: Target
            });
        } else if (marginDelta < -5) {
            generated.push({
                type: 'warning',
                text: `Margen cayó ${Math.abs(marginDelta).toFixed(1)}pp. Considera optimizar costes.`,
                icon: AlertCircle
            });
        }

        // Expense control insights
        if (expensesMetric.deltaPercent > 15 && revenueMetric.deltaPercent < 10) {
            generated.push({
                type: 'warning',
                text: 'Gastos crecen más rápido que ingresos. Riesgo de compresión de márgenes.',
                icon: AlertCircle
            });
        }

        // Profit growth insights
        if (profitMetric.deltaPercent > 30) {
            generated.push({
                type: 'success',
                text: `Beneficio creció ${profitMetric.deltaPercent.toFixed(1)}%. Momento de escalar o invertir.`,
                icon: Lightbulb
            });
        }

        // Default insight if none generated
        if (generated.length === 0) {
            generated.push({
                type: 'info',
                text: 'Rendimiento estable. Monitorea tendencias futuras para detectar cambios.',
                icon: Lightbulb
            });
        }

        return generated;
    }, [metrics, month1, month2]);

    // ============================================
    // RENDER
    // ============================================

    return (
        <>
            {/* Backdrop - Smooth fade-in with blur */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Container - Full screen with padding */}
            <div className="fixed inset-4 md:inset-10 lg:inset-16 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl z-50 animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col shadow-2xl shadow-black/50">

                {/* ============================ */}
                {/* HEADER - Title and close     */}
                {/* ============================ */}
                <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
                    {/* Decorative gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-emerald-500/5" />

                    <div className="relative z-10">
                        <h2 className="text-3xl font-black text-white mb-1 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                            Análisis Comparativo
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">Comparación detallada mes a mes</p>
                    </div>

                    <button
                        onClick={onClose}
                        className="relative z-10 p-3 hover:bg-slate-800/50 rounded-xl text-slate-400 hover:text-white transition-all hover:scale-105"
                        aria-label="Cerrar comparación"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* ============================ */}
                {/* CONTENT - Scrollable area    */}
                {/* ============================ */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">

                    {/* Month Headers - Visual comparison header */}
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-8 items-center">
                        {/* Month 1 - Base */}
                        <div className="group bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border border-indigo-500/30 rounded-2xl p-8 text-center hover:border-indigo-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10">
                            <p className="text-xs text-indigo-400 uppercase tracking-widest mb-2 font-bold">Mes Base</p>
                            <p className="text-4xl font-black text-white font-mono group-hover:scale-105 transition-transform">{month1.month}</p>
                            <p className="text-xs text-slate-500 mt-3">Punto de referencia</p>
                        </div>

                        {/* Arrow Separator */}
                        <div className="flex flex-col items-center gap-2">
                            <ArrowRight className="w-10 h-10 text-slate-600 animate-pulse" />
                            <span className="text-[10px] text-slate-600 uppercase tracking-wider font-bold">VS</span>
                        </div>

                        {/* Month 2 - Compared */}
                        <div className="group bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/30 rounded-2xl p-8 text-center hover:border-emerald-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
                            <p className="text-xs text-emerald-400 uppercase tracking-widest mb-2 font-bold">Mes Comparado</p>
                            <p className="text-4xl font-black text-white font-mono group-hover:scale-105 transition-transform">{month2.month}</p>
                            <p className="text-xs text-slate-500 mt-3">Mes objetivo</p>
                        </div>
                    </div>

                    {/* Smart Insights - Auto-generated recommendations */}
                    {insights.length > 0 && (
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur">
                            <div className="flex items-center gap-2 mb-4">
                                <Lightbulb className="w-5 h-5 text-amber-400" />
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Insights Automáticos</h3>
                            </div>
                            <div className="space-y-3">
                                {insights.map((insight, i) => {
                                    const Icon = insight.icon;
                                    const colors = {
                                        success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
                                        warning: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
                                        info: 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                                    };
                                    const iconColors = {
                                        success: 'text-emerald-400',
                                        warning: 'text-amber-400',
                                        info: 'text-blue-400'
                                    };

                                    return (
                                        <div
                                            key={i}
                                            className={`flex items-start gap-3 p-4 rounded-xl border ${colors[insight.type]} animate-in slide-in-from-left duration-500`}
                                            style={{ animationDelay: `${i * 100}ms` }}
                                        >
                                            <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColors[insight.type]}`} />
                                            <p className="text-sm leading-relaxed">{insight.text}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Comparison Chart - Interactive bar visualization */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur hover:border-slate-700 transition-colors">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                            <div className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-emerald-500 rounded-full" />
                            Gráfico Comparativo
                        </h3>
                        <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} barGap={8}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#94a3b8"
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                        axisLine={{ stroke: '#475569' }}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        axisLine={{ stroke: '#475569' }}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => [formatMoney(value) + '€', '']}
                                        contentStyle={{
                                            backgroundColor: '#0f172a',
                                            borderColor: '#334155',
                                            borderRadius: '12px',
                                            padding: '12px',
                                            boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                                        }}
                                        labelStyle={{ color: '#e2e8f0', fontWeight: 'bold', marginBottom: '8px' }}
                                        cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                                    />
                                    <Legend
                                        wrapperStyle={{ paddingTop: '20px' }}
                                        iconType="circle"
                                    />
                                    {/* Month 1 bars - Indigo gradient */}
                                    <Bar
                                        dataKey={month1.month}
                                        fill="url(#colorMonth1)"
                                        radius={[12, 12, 0, 0]}
                                        animationDuration={800}
                                    />
                                    {/* Month 2 bars - Emerald gradient */}
                                    <Bar
                                        dataKey={month2.month}
                                        fill="url(#colorMonth2)"
                                        radius={[12, 12, 0, 0]}
                                        animationDuration={800}
                                        animationBegin={200}
                                    />
                                    {/* Gradient definitions */}
                                    <defs>
                                        <linearGradient id="colorMonth1" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.8} />
                                        </linearGradient>
                                        <linearGradient id="colorMonth2" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Comparison Table - Detailed delta breakdown */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur hover:border-slate-700 transition-colors">
                        <div className="p-6 border-b border-slate-800 bg-slate-950/50">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <div className="w-1 h-5 bg-gradient-to-b from-rose-500 to-emerald-500 rounded-full" />
                                Tabla de Diferencias Detallada
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-950/80">
                                    <tr>
                                        <th className="px-8 py-5 text-left text-xs font-black text-slate-500 uppercase tracking-wider">
                                            Concepto
                                        </th>
                                        <th className="px-8 py-5 text-right text-xs font-black text-slate-500 uppercase tracking-wider">
                                            {month1.month}
                                        </th>
                                        <th className="px-8 py-5 text-right text-xs font-black text-slate-500 uppercase tracking-wider">
                                            {month2.month}
                                        </th>
                                        <th className="px-8 py-5 text-right text-xs font-black text-slate-500 uppercase tracking-wider">
                                            Δ Absoluta
                                        </th>
                                        <th className="px-8 py-5 text-right text-xs font-black text-slate-500 uppercase tracking-wider">
                                            Δ Relativa
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {metrics.map((metric, index) => {
                                        // Determine if delta is "good" based on metric type
                                        const isPositiveGood = metric.label === 'Ingresos' || metric.label === 'Beneficio';
                                        const isGoodDelta = isPositiveGood ? metric.delta > 0 : metric.delta < 0;

                                        // Color scheme for delta values
                                        const deltaColor = isGoodDelta ? 'text-emerald-400' : 'text-rose-400';
                                        const bgColor = isGoodDelta ? 'bg-emerald-500/10' : 'bg-rose-500/10';
                                        const borderColor = isGoodDelta ? 'border-l-emerald-500/50' : 'border-l-rose-500/50';

                                        return (
                                            <tr
                                                key={index}
                                                className={`group hover:bg-slate-800/40 transition-all duration-200 border-l-4 border-l-transparent hover:${borderColor}`}
                                            >
                                                <td className="px-8 py-6">
                                                    <span className="text-white font-bold text-sm">{metric.label}</span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className="font-mono text-base font-semibold text-indigo-300">
                                                        {formatMoney(metric.value1)}€
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className="font-mono text-base font-semibold text-emerald-300">
                                                        {formatMoney(metric.value2)}€
                                                    </span>
                                                </td>
                                                <td className={`px-8 py-6 text-right`}>
                                                    <div className="flex items-center justify-end gap-2">
                                                        {metric.delta > 0 ? (
                                                            <TrendingUp className={`w-4 h-4 ${deltaColor}`} />
                                                        ) : metric.delta < 0 ? (
                                                            <TrendingDown className={`w-4 h-4 ${deltaColor}`} />
                                                        ) : null}
                                                        <span className={`font-mono text-base font-bold ${deltaColor}`}>
                                                            {metric.delta > 0 ? '+' : ''}{formatMoney(metric.delta)}€
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black ${bgColor} ${deltaColor} border border-current/20`}>
                                                        {metric.deltaPercent > 0 ? '+' : ''}{metric.deltaPercent.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary Cards - Quick visual overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {metrics.map((metric, i) => {
                            const isPositiveGood = metric.label === 'Ingresos' || metric.label === 'Beneficio';
                            const isGoodDelta = isPositiveGood ? metric.delta > 0 : metric.delta < 0;

                            const cardStyles = isGoodDelta
                                ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/30 hover:border-emerald-400/50 hover:shadow-emerald-500/20'
                                : 'bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/30 hover:border-rose-400/50 hover:shadow-rose-500/20';

                            return (
                                <div
                                    key={i}
                                    className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl group ${cardStyles}`}
                                >
                                    <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-bold">
                                        {metric.label}
                                    </p>
                                    <p className={`text-3xl font-black font-mono mb-1 group-hover:scale-105 transition-transform ${isGoodDelta ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {metric.delta > 0 ? '+' : ''}{formatMoney(metric.delta)}€
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                        <span>{metric.deltaPercent > 0 ? '+' : ''}{metric.deltaPercent.toFixed(1)}%</span>
                                        <span>•</span>
                                        <span>vs {month1.month}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
};

export default MonthComparisonModal;
