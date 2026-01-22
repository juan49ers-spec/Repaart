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
            <div className="workstation-card p-4 h-full flex flex-col space-y-3">
                <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                <div className="space-y-2 flex-1">
                    <div className="h-16 bg-slate-50 dark:bg-slate-800/40 rounded animate-pulse" />
                    <div className="h-16 bg-slate-50 dark:bg-slate-800/40 rounded animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full overflow-hidden transition-all hover:shadow-md">
            {/* HEADER */}
            <div className="p-5 pb-3">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                            <BrainCircuit className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                                Monitor de Anomalías
                            </h3>
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                {anomalies.length > 0 ? `${anomalies.length} alertas activas` : 'Sistema nominal'}
                            </div>
                        </div>
                    </div>
                    {anomalies.length > 0 && (
                        <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded-full border border-rose-100 dark:border-rose-800">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">Atención</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3">
                {anomalies.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                        <CheckCircle className="w-10 h-10 text-emerald-500/50 mb-3" />
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Red Optimizada</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            No se han detectado desviaciones críticas.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {anomalies.map((anomaly, idx) => (
                            <div
                                key={`${anomaly.id}-${idx}`}
                                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-3 rounded-lg flex justify-between items-center group/item hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                            {anomaly.franchiseName}
                                        </h4>
                                        {anomaly.type === 'inactive' && (
                                            <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300 text-[9px] font-bold rounded uppercase tracking-wide">
                                                Inactivo
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                                        {anomaly.message}
                                    </p>
                                </div>
                                {anomaly.value && (
                                    <div className="text-right pl-3">
                                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 px-2 py-1 bg-rose-50 dark:bg-rose-900/20 rounded-md whitespace-nowrap">
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
