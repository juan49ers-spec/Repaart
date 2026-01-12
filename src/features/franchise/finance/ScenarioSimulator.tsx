import React, { useState, useMemo } from 'react';
import { X, PlayCircle, RefreshCw, DollarSign, ShoppingBag, Users, TrendingUp, BookOpen, AlertCircle, Fuel, Target } from 'lucide-react';
import { formatMoney } from '../../../lib/finance';

interface ScenarioSimulatorProps {
    isOpen: boolean;
    onClose: () => void;
    currentData: any; // The real month data to use as baseline
}

// Educational Content Constant
const FINANCIAL_RESOURCES = [
    {
        title: "EBITDA vs Beneficio Neto",
        content: "El EBITDA (Beneficio antes de Intereses, Impuestos, Depreciaciones y Amortizaciones) es clave en el delivery para medir la eficiencia operativa pura, ignorando la estructura de deuda o impuestos. Un EBITDA saludable en franquicias de reparto debería rondar el 15-20%.",
        icon: Target
    },
    {
        title: "Optimización del Cash Flow",
        content: "En el reparto, el Cash Flow mata más negocios que la falta de rentabilidad. Vigila los ciclos de pago de las plataformas (15-30 días) vs tus pagos a riders (mensual/semanal). Mantén un fondo de maniobra de al menos 1.5 meses de gastos operativos.",
        icon: DollarSign
    },
    {
        title: "Ratio de Eficiencia Laboral",
        content: "Tu coste laboral total (Salarios + SS) no debería superar el 65-70% de tus ingresos netos. Si superas este umbral, revisa la eficiencia de tus riders (pedidos/hora). El objetivo es maximizar horas activas vs horas valle.",
        icon: Users
    },
    {
        title: "Costes Variables vs Fijos",
        content: "El delivery es un negocio de volumen. Tus costes fijos (alquiler, gestoría) se diluyen con cada pedido extra. Sin embargo, vigila los costes variables 'ocultos' como reparaciones de motos o gasolina. Un aumento del 10% en gasolina puede comerse un 2% de tu margen neto.",
        icon: Fuel
    }
];

const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({ isOpen, onClose, currentData }) => {
    const [activeTab, setActiveTab] = useState<'simulation' | 'resources'>('simulation');

    // --- LEVERS ---
    const [volumeDelta, setVolumeDelta] = useState(0); // -30% to +50%
    const [ticketDelta, setTicketDelta] = useState(0); // -2€ to +5€
    const [staffDelta, setStaffDelta] = useState(0); // -2 to +5 riders
    const [variableCostDelta, setVariableCostDelta] = useState(0); // Efficiency in variable costs (-10% to +20%)

    // --- CALCULATIONS (using useMemo for derived state) ---
    const { results, warnings } = useMemo(() => {
        if (!currentData) return {
            results: { revenue: 0, expenses: 0, netProfit: 0, margin: 0, breakEven: 0 },
            warnings: []
        };

        // 1. BASELINE EXTRACTION
        const baseRevenue = currentData.revenue || currentData.totalIncome || 0;
        const baseOrders = currentData.orders || 1; // Avoid div by 0
        const baseTotalExpenses = currentData.totalExpenses || 0;

        // Approximate breakdowns if not strictly provided
        const baseLabor = currentData.salaries || (baseTotalExpenses * 0.60); // Default 60% labor if missing
        const baseVariable = (baseTotalExpenses - baseLabor) * 0.40; // Approx 40% of non-labor is variable (gas, repairs)
        const baseFixed = baseTotalExpenses - baseLabor - baseVariable;

        const baseTicket = baseRevenue / baseOrders;
        // Assume rough base riders count if not provided (e.g., 200 orders/rider/month)
        const estimatedRiders = Math.max(2, Math.round(baseOrders / 300));

        // 2. SIMULATION MATH
        // New Volume
        const simOrders = baseOrders * (1 + volumeDelta / 100);

        // New Revenue
        const simTicket = baseTicket + ticketDelta;
        const simRevenue = simOrders * simTicket;

        // New Expenses
        // Labor: cost scales with staff delta. (BaseCost / BaseRiders) * (BaseRiders + Delta)
        const costPerRider = baseLabor / estimatedRiders;
        const simRiders = Math.max(1, estimatedRiders + staffDelta);
        const simLabor = costPerRider * simRiders;

        // Variable: specific efficiency lever applied to variable costs (fuel/repairs)
        // Scale with volume FIRST, then apply efficiency delta
        const rawVariable = (baseVariable / baseOrders) * simOrders;
        const simVariable = rawVariable * (1 + variableCostDelta / 100);

        // Fixed: Remains constant
        const simFixed = baseFixed;

        const simTotalExpenses = simLabor + simVariable + simFixed;
        const simNetProfit = simRevenue - simTotalExpenses;
        const simMargin = simRevenue > 0 ? (simNetProfit / simRevenue) * 100 : 0;

        // Break Even (Orders needed to cover Fixed + Labor with current Contribution Margin)
        // CM per order = Ticket - VariableCostPerOrder
        const variableCostPerOrder = simVariable / simOrders;
        const contributionMargin = simTicket - variableCostPerOrder;
        const breakEvenOrders = contributionMargin > 0 ? (simFixed + simLabor) / contributionMargin : 99999;

        // 3. WARNINGS / INSIGHTS
        const newWarnings = [];
        // Saturation Check: If volume up > 20% but staff same/down -> High Risk
        if (volumeDelta > 20 && staffDelta <= 0) {
            newWarnings.push("ALERTA DE SATURACIÓN: Aumento de pedidos sin añadir riders puede colapsar el servicio.");
        }
        // Profitability Check
        if (simMargin < 5) {
            newWarnings.push("MARGEN CRÍTICO: El beneficio neto es inferior al 5%. Riesgo financiero alto.");
        }

        return {
            results: {
                revenue: simRevenue,
                expenses: simTotalExpenses,
                netProfit: simNetProfit,
                margin: simMargin,
                breakEven: breakEvenOrders
            },
            warnings: newWarnings
        };

    }, [currentData, volumeDelta, ticketDelta, staffDelta, variableCostDelta]);

    if (!isOpen) return null;

    const baselineNet = (currentData?.revenue || 0) - (currentData?.totalExpenses || 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* HEADER */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                            <PlayCircle className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Simulador Financiero Pro</h2>
                            <p className="text-sm text-slate-400 font-medium">Modelado avanzado para franquicias de reparto</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                            <button
                                onClick={() => setActiveTab('simulation')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'simulation' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                Simulación
                            </button>
                            <button
                                onClick={() => setActiveTab('resources')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'resources' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                Recursos
                            </button>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto bg-slate-900/50 p-8">

                    {activeTab === 'simulation' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">

                            {/* LEFT: CONTROLS */}
                            <div className="lg:col-span-4 space-y-8 pr-2">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Variables Operativas</h3>

                                {/* Control 1: Volumen */}
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                            <ShoppingBag className="w-4 h-4 text-blue-400" /> Volumen Pedidos
                                        </label>
                                        <span className={`text-xs font-mono font-bold ${volumeDelta > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>{volumeDelta > 0 ? '+' : ''}{volumeDelta}%</span>
                                    </div>
                                    <input type="range" min="-30" max="50" step="5" value={volumeDelta} onChange={(e) => setVolumeDelta(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg accent-blue-500 cursor-pointer" />
                                </div>

                                {/* Control 2: Ticket */}
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-emerald-400" /> Ticket Medio
                                        </label>
                                        <span className={`text-xs font-mono font-bold ${ticketDelta > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>{ticketDelta > 0 ? '+' : ''}{ticketDelta}€</span>
                                    </div>
                                    <input type="range" min="-2" max="5" step="0.5" value={ticketDelta} onChange={(e) => setTicketDelta(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg accent-emerald-500 cursor-pointer" />
                                </div>

                                {/* Control 3: Staffing */}
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                            <Users className="w-4 h-4 text-indigo-400" /> Flota (Riders)
                                        </label>
                                        <span className={`text-xs font-mono font-bold ${staffDelta > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{staffDelta > 0 ? '+' : ''}{staffDelta}</span>
                                    </div>
                                    <input type="range" min="-3" max="5" step="1" value={staffDelta} onChange={(e) => setStaffDelta(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg accent-indigo-500 cursor-pointer" />
                                    <p className="text-[10px] text-slate-500">Más riders aumentan el coste fijo, pero evitan saturación.</p>
                                </div>

                                {/* Control 4: Variable Efficiency */}
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                            <Fuel className="w-4 h-4 text-amber-400" /> Costes Variables (Motos/Gas)
                                        </label>
                                        <span className={`text-xs font-mono font-bold ${variableCostDelta < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{variableCostDelta > 0 ? '+' : ''}{variableCostDelta}%</span>
                                    </div>
                                    <input type="range" min="-20" max="20" step="1" value={variableCostDelta} onChange={(e) => setVariableCostDelta(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg accent-amber-500 cursor-pointer" />
                                    <p className="text-[10px] text-slate-500">Ajusta gastos de mantenimiento y consumo de combustible.</p>
                                </div>

                                <button onClick={() => { setVolumeDelta(0); setTicketDelta(0); setStaffDelta(0); setVariableCostDelta(0); }} className="w-full py-3 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white text-xs font-bold uppercase transition-all flex items-center justify-center gap-2">
                                    <RefreshCw className="w-4 h-4" /> Resetear Valores
                                </button>
                            </div>

                            {/* RIGHT: DASHBOARD */}
                            <div className="lg:col-span-8 space-y-6">
                                {/* Top KPIs */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
                                        <p className="text-xs font-bold text-slate-500 uppercase">Resultado Actual</p>
                                        <div className="text-3xl font-mono text-slate-400 mt-1">{formatMoney(baselineNet)}€</div>
                                        <div className="text-xs text-slate-500 mt-2">Margen Real</div>
                                    </div>
                                    <div className={`rounded-2xl p-5 border transition-colors duration-300 ${results.netProfit >= baselineNet ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                                        <p className={`text-xs font-bold uppercase ${results.netProfit >= baselineNet ? 'text-emerald-400' : 'text-rose-400'}`}>Resultado Simulado</p>
                                        <div className={`text-4xl font-black font-mono mt-1 ${results.netProfit >= baselineNet ? 'text-emerald-300' : 'text-rose-300'}`}>
                                            {formatMoney(results.netProfit)}€
                                        </div>
                                        <div className="flex gap-4 mt-2">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${results.margin >= 10 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                                Margen: {results.margin.toFixed(1)}%
                                            </span>
                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                <Target className="w-3 h-3" /> Break-even: {Math.round(results.breakEven)} pedidos
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Warnings Area */}
                                {warnings.length > 0 && (
                                    <div className="space-y-2">
                                        {warnings.map((w, i) => (
                                            <div key={i} className="bg-amber-500/10 border border-amber-500/20 text-amber-200 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium animate-in slide-in-from-top-2">
                                                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                                {w}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Graph / Visualizer Placeholder */}
                                <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-800 h-48 flex items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-emerald-500/5 group-hover:opacity-100 opacity-50 transition-opacity" />
                                    <div className="text-center relative z-10">
                                        <TrendingUp className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                                        <p className="text-slate-500 text-sm font-medium">Proyección de Ingresos vs Gastos</p>
                                        <div className="mt-4 flex items-center justify-center gap-8">
                                            <div className="text-center">
                                                <div className="text-xs text-slate-500 uppercase">Ingresos</div>
                                                <div className="text-lg font-bold text-white">{formatMoney(results.revenue)}€</div>
                                            </div>
                                            <div className="h-8 w-px bg-slate-700" />
                                            <div className="text-center">
                                                <div className="text-xs text-slate-500 uppercase">Gastos</div>
                                                <div className="text-lg font-bold text-rose-300">{formatMoney(results.expenses)}€</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    ) : (
                        // RESOURCES TAB
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4">
                            {FINANCIAL_RESOURCES.map((res, idx) => (
                                <div key={idx} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all group">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 group-hover:border-indigo-500/50 transition-colors">
                                            <res.icon className="w-6 h-6 text-indigo-400 group-hover:text-indigo-300" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-200 transition-colors">{res.title}</h4>
                                            <p className="text-sm text-slate-400 leading-relaxed">{res.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="col-span-1 md:col-span-2 mt-4 p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between">
                                <div>
                                    <h4 className="text-indigo-300 font-bold mb-1">¿Necesitas un análisis más profundo?</h4>
                                    <p className="text-indigo-200/60 text-sm">Descarga el manual completo de finanzas para franquiciados.</p>
                                </div>
                                <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors">
                                    <BookOpen className="w-4 h-4" />
                                    Descargar PDF
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ScenarioSimulator;
