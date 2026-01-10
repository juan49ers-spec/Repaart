import React, { useState } from 'react';
import { Calculator, Lightbulb, ArrowRight, BarChart3, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface SimulatorWidgetAdvancedProps {
    currentRevenue: number;
    currentOrders: number;
    currentExpenses: number;
}

const SimulatorWidgetAdvanced: React.FC<SimulatorWidgetAdvancedProps> = ({
    currentRevenue,
    currentOrders,
    currentExpenses
}) => {
    // Variables simulables
    const [avgOrderPrice, setAvgOrderPrice] = useState(currentOrders > 0 ? Math.round(currentRevenue / currentOrders) : 12);
    const [ordersPerDay, setOrdersPerDay] = useState(Math.round(currentOrders / 30));
    const [platformFee, setPlatformFee] = useState(18);
    const [riderCostPerHour, setRiderCostPerHour] = useState(12);
    const [hoursPerDay, setHoursPerDay] = useState(10);
    const [fixedCosts, setFixedCosts] = useState(Math.round(currentExpenses * 0.4));

    const [scenario, setScenario] = useState<'realistic' | 'optimistic' | 'pessimistic'>('realistic');

    // Cálculos
    const calculateScenario = (mult: number) => {
        const monthlyOrders = ordersPerDay * 30 * mult;
        const grossRevenue = monthlyOrders * avgOrderPrice;
        const platformCost = grossRevenue * (platformFee / 100);
        const riderCost = hoursPerDay * 30 * riderCostPerHour;
        const totalCosts = platformCost + riderCost + fixedCosts;
        const netProfit = grossRevenue - totalCosts;
        const profitMargin = (netProfit / grossRevenue) * 100;

        return {
            monthlyOrders,
            grossRevenue,
            platformCost,
            riderCost,
            fixedCosts,
            totalCosts,
            netProfit,
            profitMargin
        };
    };

    const results = {
        realistic: calculateScenario(1),
        optimistic: calculateScenario(1.2),
        pessimistic: calculateScenario(0.8)
    };

    const activeResult = results[scenario];

    // Punto de equilibrio
    const breakEvenOrders = Math.ceil((fixedCosts + (hoursPerDay * 30 * riderCostPerHour)) /
        (avgOrderPrice * (1 - platformFee / 100)));

    // Análisis de sensibilidad: ¿Cuál es la palanca más impactante?
    const leverAnalysis = [
        {
            name: 'Precio Pedido',
            impact: ((avgOrderPrice + 2) * ordersPerDay * 30 - avgOrderPrice * ordersPerDay * 30) * (1 - platformFee / 100),
            action: '+2€ precio promedio'
        },
        {
            name: 'Pedidos/Día',
            impact: ((ordersPerDay + 5) * 30 * avgOrderPrice - ordersPerDay * 30 * avgOrderPrice) * (1 - platformFee / 100),
            action: '+5 pedidos diarios'
        },
        {
            name: 'Comisión',
            impact: ((platformFee - 2) / 100 * activeResult.grossRevenue) - (platformFee / 100 * activeResult.grossRevenue),
            action: '-2% comisión'
        },
        {
            name: 'Coste Riders',
            impact: (riderCostPerHour - 1) * hoursPerDay * 30 - riderCostPerHour * hoursPerDay * 30,
            action: '-1€/h riders'
        }
    ].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

    const topLever = leverAnalysis[0];

    // Datos para gráfico de proyección 12 meses
    const projection12Months = Array.from({ length: 12 }, (_, i) => {
        const growth = i * 0.05; // 5% crecimiento mensual
        const monthResult = calculateScenario(1 + growth);
        return {
            month: `M${i + 1}`,
            beneficio: Math.round(monthResult.netProfit),
            ingresos: Math.round(monthResult.grossRevenue)
        };
    });

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <Calculator className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Simulador Avanzado</h2>
                        <p className="text-xs text-slate-500 font-semibold">Proyecta diferentes escenarios</p>
                    </div>
                </div>

                {/* Scenario Selector */}
                <div className="flex gap-2">
                    {(['pessimistic', 'realistic', 'optimistic'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setScenario(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${scenario === s
                                ? s === 'optimistic' ? 'bg-emerald-500 text-white shadow-lg'
                                    : s === 'pessimistic' ? 'bg-rose-500 text-white shadow-lg'
                                        : 'bg-indigo-600 text-white shadow-lg'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            {s === 'optimistic' ? '📈 +20%' : s === 'pessimistic' ? '📉 -20%' : '🎯 Real'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Variables Ajustables */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Precio Pedido
                    </label>
                    <input
                        type="number"
                        value={avgOrderPrice}
                        onChange={(e) => setAvgOrderPrice(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-sm font-bold"
                        aria-label="Precio Pedido"
                    />
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Pedidos/Día
                    </label>
                    <input
                        type="number"
                        value={ordersPerDay}
                        onChange={(e) => setOrdersPerDay(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-sm font-bold"
                        aria-label="Pedidos por día"
                    />
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Comisión %
                    </label>
                    <input
                        type="number"
                        value={platformFee}
                        onChange={(e) => setPlatformFee(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-sm font-bold"
                        aria-label="Comisión porcentaje"
                    />
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Riders €/h
                    </label>
                    <input
                        type="number"
                        value={riderCostPerHour}
                        onChange={(e) => setRiderCostPerHour(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-sm font-bold"
                        aria-label="Coste Riders por hora"
                    />
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Horas/Día
                    </label>
                    <input
                        type="number"
                        value={hoursPerDay}
                        onChange={(e) => setHoursPerDay(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-sm font-bold"
                        aria-label="Horas por día"
                    />
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Fijos/Mes
                    </label>
                    <input
                        type="number"
                        value={fixedCosts}
                        onChange={(e) => setFixedCosts(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-sm font-bold"
                        aria-label="Costes fijos por mes"
                    />
                </div>
            </div>

            {/* Resultados */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-900">
                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wider">
                        Ingresos
                    </div>
                    <div className="text-2xl font-black text-blue-900 dark:text-blue-100">
                        {activeResult.grossRevenue.toLocaleString()}€
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20 border border-rose-200 dark:border-rose-900">
                    <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-1 uppercase tracking-wider">
                        Costes
                    </div>
                    <div className="text-2xl font-black text-rose-900 dark:text-rose-100">
                        {activeResult.totalCosts.toLocaleString()}€
                    </div>
                </div>
                <div className={`p-4 rounded-xl border-2 ${activeResult.netProfit >= 0 ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-300 dark:border-emerald-800' : 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-300 dark:border-amber-800'}`}>
                    <div className={`text-xs font-bold mb-1 uppercase tracking-wider ${activeResult.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        Beneficio
                    </div>
                    <div className={`text-2xl font-black ${activeResult.netProfit >= 0 ? 'text-emerald-900 dark:text-emerald-100' : 'text-amber-900 dark:text-amber-100'}`}>
                        {activeResult.netProfit.toLocaleString()}€
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border border-purple-200 dark:border-purple-900">
                    <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-1 uppercase tracking-wider">
                        Margen
                    </div>
                    <div className="text-2xl font-black text-purple-900 dark:text-purple-100">
                        {activeResult.profitMargin.toFixed(1)}%
                    </div>
                </div>
            </div>

            {/* Punto de Equilibrio */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Punto de Equilibrio</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                    Necesitas <span className="font-bold text-indigo-600 dark:text-indigo-400">{breakEvenOrders} pedidos/mes</span> para cubrir costes
                    ({Math.round(breakEvenOrders / 30)} pedidos/día)
                </div>
            </div>

            {/* Gráfico Proyección */}
            <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Proyección 12 Meses (con crecimiento 5%/mes)
                </h3>
                <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={projection12Months}>
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                            <Line type="monotone" dataKey="beneficio" stroke="#10b981" strokeWidth={3} dot={false} />
                            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recomendación IA */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-1">
                            Palanca de Mayor Impacto
                        </h4>
                        <p className="text-xs text-indigo-700 dark:text-indigo-400 mb-2">
                            <span className="font-bold">{topLever.name}</span>: {topLever.action} generaría{' '}
                            <span className="font-bold">{topLever.impact >= 0 ? '+' : ''}{Math.round(topLever.impact)}€/mes</span>
                        </p>
                        <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                            Actúa sobre esto primero
                            <ArrowRight className="w-3 h-3" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SimulatorWidgetAdvanced;
