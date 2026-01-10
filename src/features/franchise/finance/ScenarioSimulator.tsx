import React, { useState, useEffect } from 'react';
import { X, PlayCircle, RefreshCw, DollarSign, ShoppingBag } from 'lucide-react';
import { formatMoney } from '../../../lib/finance';

interface ScenarioSimulatorProps {
    isOpen: boolean;
    onClose: () => void;
    currentData: any; // The real month data to use as baseline
}

const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({ isOpen, onClose, currentData }) => {
    if (!isOpen) return null;

    // --- STATE: LEVERS ---
    // Delta percentages or absolute values
    const [volumeDelta, setVolumeDelta] = useState(0); // -20% to +50%
    const [ticketDelta, setTicketDelta] = useState(0); // -2€ to +5€
    // const [extraStaff, setExtraStaff] = useState(0); // Not implemented in MVP but reserved

    // --- STATE: RESULTS ---
    const [simulatedNet, setSimulatedNet] = useState(0);
    const [baselineNet, setBaselineNet] = useState(0);

    // --- CALCULATIONS ---
    useEffect(() => {
        if (!currentData) return;

        // 1. BASELINE RECONSTRUCTION (Simplified for MVP)
        // We assume currentData has { revenue, orders, totalExpenses, ... }
        // If not, we fall back to defaults
        const baseRevenue = currentData.revenue || currentData.totalIncome || 0;
        const baseOrders = currentData.orders || 0;
        const baseExpenses = currentData.totalExpenses || 0;

        // Calculate inferred Ticket
        const baseTicket = baseOrders > 0 ? baseRevenue / baseOrders : 0;

        setBaselineNet(baseRevenue - baseExpenses);

        // 2. SIMULATION
        // New Volume
        const simOrders = baseOrders * (1 + volumeDelta / 100);

        // New Ticket
        const simTicket = baseTicket + ticketDelta;

        // New Revenue
        const simRevenue = simOrders * simTicket;

        // New Expenses (Simplified Model)
        // Fixed costs stay same. Variable costs scale with volume.
        // For MVP, let's assume 30% of expenses are variable (riders, fuel, etc)
        // In a real app, we'd sum up specific variable lines.
        const fixedPortion = 0.7;
        const variablePortion = 0.3;

        const simVariableCosts = (baseExpenses * variablePortion) * (1 + volumeDelta / 100);
        const simFixedCosts = baseExpenses * fixedPortion;

        const simTotalExpenses = simFixedCosts + simVariableCosts;

        // Result
        // We assume 21% Tax roughly for the Net (simplified for the "Toy" version)
        // Actually, let's just show Gross Margin improvement or roughly Net.
        // Let's stick to "Cash Flow" impact for now to keep it simple.
        setSimulatedNet(simRevenue - simTotalExpenses);

    }, [currentData, volumeDelta, ticketDelta]);


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* HEADER */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-xl">
                            <PlayCircle className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight">Simulador de Escenarios</h2>
                            <p className="text-xs text-slate-400 font-medium">Juega con las variables y ve el impacto futuro</p>
                        </div>
                    </div>
                    <button onClick={onClose} aria-label="Cerrar simulador" className="p-2 hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-8 space-y-10 overflow-y-auto">

                    {/* RESULTS CARD */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Resultado Actual</p>
                            <p className="text-2xl font-mono text-slate-300">{formatMoney(baselineNet)}€</p>
                        </div>
                        <div className={`p-4 rounded-2xl border ${simulatedNet >= baselineNet ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'} transition-colors duration-500`}>
                            <p className={`text-xs font-bold uppercase mb-1 ${simulatedNet >= baselineNet ? 'text-emerald-400' : 'text-rose-400'}`}>
                                Resultado Simulado
                            </p>
                            <div className="flex items-end gap-2">
                                <p className={`text-3xl font-black font-mono tracking-tight ${simulatedNet >= baselineNet ? 'text-emerald-300' : 'text-rose-300'}`}>
                                    {formatMoney(simulatedNet)}€
                                </p>
                                <div className={`text-xs font-bold mb-1.5 px-1.5 py-0.5 rounded ${simulatedNet >= baselineNet ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                                    {((simulatedNet - baselineNet) >= 0 ? '+' : '') + formatMoney(simulatedNet - baselineNet)}€
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CONTROLS */}
                    <div className="space-y-8">

                        {/* CONTROL 1: VOLUME */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-indigo-400" />
                                    <label className="text-sm font-bold text-slate-200">Volumen de Pedidos</label>
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded bg-slate-800 ${volumeDelta > 0 ? 'text-emerald-400' : volumeDelta < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                    {volumeDelta > 0 ? '+' : ''}{volumeDelta}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="-30"
                                max="50"
                                step="5"
                                value={volumeDelta}
                                onChange={(e) => setVolumeDelta(Number(e.target.value))}
                                aria-label="Ajustar volumen de pedidos"
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <div className="flex justify-between text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                                <span>Menos Trabajo (-30%)</span>
                                <span>Actual</span>
                                <span>Crecimiento (+50%)</span>
                            </div>
                        </div>

                        {/* CONTROL 2: AVG TICKET */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-indigo-400" />
                                    <label className="text-sm font-bold text-slate-200">Ticket Medio</label>
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded bg-slate-800 ${ticketDelta > 0 ? 'text-emerald-400' : ticketDelta < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                    {ticketDelta > 0 ? '+' : ''}{ticketDelta}€
                                </span>
                            </div>
                            <input
                                type="range"
                                min="-2"
                                max="5"
                                step="0.5"
                                value={ticketDelta}
                                onChange={(e) => setTicketDelta(Number(e.target.value))}
                                aria-label="Ajustar ticket medio"
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <div className="flex justify-between text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                                <span>Bajada Precios (-2€)</span>
                                <span>Actual</span>
                                <span>Subida Precios (+5€)</span>
                            </div>
                        </div>

                    </div>

                </div>

                {/* FOOTER */}
                <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex justify-end">
                    <button
                        onClick={() => { setVolumeDelta(0); setTicketDelta(0); }}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 rounded-xl text-slate-400 text-xs font-bold transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Resetear
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ScenarioSimulator;
