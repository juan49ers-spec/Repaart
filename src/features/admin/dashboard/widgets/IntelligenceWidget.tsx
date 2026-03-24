import React, { useMemo } from 'react';
import { CheckCircle, BrainCircuit } from 'lucide-react';

interface Franchise {
    id: string;
    name: string;
    metrics?: {
        margin: number;
        revenue?: number;
    };
    report?: {
        totalIncome?: number;
        totalExpenses?: number;
    };
}

interface IntelligenceWidgetProps {
    franchises: Franchise[];
    loading?: boolean;
}

// Simple Anomaly Types
type AnomalyType = 'critical_loss' | 'high_expense' | 'inactive';

interface Anomaly {
    id: string;
    franchiseName: string;
    type: AnomalyType;
    message: string;
    value?: string;
}

const IntelligenceWidget: React.FC<IntelligenceWidgetProps> = ({ franchises, loading }) => {

    // 🧠 AI Logic (Simplified Rule Engine)
    const anomalies: Anomaly[] = useMemo(() => {
        if (!franchises || franchises.length === 0) return [];
        const detected: Anomaly[] = [];

        // 1. Calculate Network Averages (to detect outliers)
        const totalRevenue = franchises.reduce((acc, f) => acc + (f.metrics?.revenue || 0), 0);
        const avgRevenue = totalRevenue / franchises.length;

        franchises.forEach(f => {
            const revenue = f.metrics?.revenue || 0;
            const margin = f.metrics?.margin || 0;

            // 🚨 Rule 1: Critical Margin / Loss
            if (revenue > 0 && margin < 5) {
                detected.push({
                    id: f.id,
                    franchiseName: f.name,
                    type: 'critical_loss',
                    message: `margen crítico detectado (${margin.toFixed(1)}%)`,
                    value: 'urgente'
                });
            }

            // 🚨 Rule 2: Inactivity (Zero Revenue)
            if (revenue === 0) {
                detected.push({
                    id: f.id,
                    franchiseName: f.name,
                    type: 'inactive',
                    message: "sin ingresos registrados",
                    value: "0.00"
                });
            }

            // 🚨 Rule 3: High Revenue Drop
            if (revenue > 0 && revenue < (avgRevenue * 0.1)) {
                detected.push({
                    id: f.id,
                    franchiseName: f.name,
                    type: 'critical_loss',
                    message: "rendimiento muy por debajo de la media",
                    value: "-90%"
                });
            }
        });

        return detected.sort((a, _) => a.type === 'inactive' ? -1 : 1).slice(0, 5);
    }, [franchises]);

    if (loading) {
        return (
            <div className="bg-[#12141A] rounded-xl border border-white/5 shadow-2xl p-4 h-full flex flex-col space-y-3">
                <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
                <div className="space-y-2 flex-1">
                    <div className="h-16 bg-white/5 rounded animate-pulse" />
                    <div className="h-16 bg-white/5 rounded animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#12141A] rounded-xl border border-white/5 shadow-2xl flex flex-col h-full overflow-hidden transition-all group/card hover:border-ruby-500/30 relative">
            {/* Ambient Base Layer */}
            <div className="absolute inset-0 bg-gradient-to-br from-ruby-500/5 via-transparent to-transparent pointer-events-none" />

            {/* HEADER */}
            <div className="p-5 pb-3 relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 border border-white/10 group-hover/card:border-rose-500/30 transition-colors rounded-lg">
                            <BrainCircuit className="w-4 h-4 text-rose-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                                Monitor de Anomalías
                            </h3>
                            <div className="text-xs font-medium text-slate-400">
                                {anomalies.length > 0 ? `${anomalies.length} alertas activas` : 'Sistema nominal'}
                            </div>
                        </div>
                    </div>
                </div>
                {anomalies.length > 0 && (
                    <div className="flex items-center gap-1 bg-rose-500/10 px-2 py-1 rounded-full border border-rose-500/20 absolute right-5 top-5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wide">Atención</span>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3 relative z-10">
                {anomalies.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                        <CheckCircle className="w-10 h-10 text-emerald-500/50 mb-3" />
                        <h4 className="text-xs font-bold text-slate-300">Red Optimizada</h4>
                        <p className="text-[11px] text-slate-400 mt-1">
                            No se han detectado desviaciones críticas.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {anomalies.map((anomaly, idx) => (
                            <div
                                key={`${anomaly.id}-${idx}`}
                                className="bg-white/5 border border-white/5 p-3 rounded-lg flex justify-between items-center group/item hover:bg-white/10 hover:border-white/10 transition-all font-mono"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="text-xs font-bold text-slate-200 truncate">
                                            {anomaly.franchiseName}
                                        </h4>
                                        {anomaly.type === 'inactive' && (
                                            <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-bold rounded uppercase tracking-wide">
                                                Inactivo
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-medium truncate font-sans">
                                        {anomaly.message}
                                    </p>
                                </div>
                                {anomaly.value && (
                                    <div className="text-right pl-3">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap ${
                                            anomaly.type === 'inactive' 
                                            ? 'bg-white/10 text-slate-300' 
                                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                        }`}>
                                            {anomaly.value}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default IntelligenceWidget;
