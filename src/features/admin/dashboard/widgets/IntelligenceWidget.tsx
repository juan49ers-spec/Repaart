import React, { useMemo } from 'react';
import { AlertOctagon, CheckCircle } from 'lucide-react';

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
            // const expenses = 0; // In a real scenario, we'd pull expenses from the report object if available
            // Note: metrics.margin is already (Profit/Revenue)*100. So Profit = Revenue * (Margin/100). 
            // Expenses = Revenue - Profit. 
            // Simplified check: Low margin = High expense relative to revenue.

            // 🚨 Rule 1: Critical Margin / Loss
            if (revenue > 0 && margin < 5) {
                detected.push({
                    id: f.id,
                    franchiseName: f.name,
                    type: 'critical_loss',
                    message: `Margen crítico detectado (${margin.toFixed(1)}%)`,
                    value: 'Urgent'
                });
            }

            // 🚨 Rule 2: Inactivity (Zero Revenue in active list)
            // Assuming 'franchises' list passed here implies active contracts.
            if (revenue === 0) {
                detected.push({
                    id: f.id,
                    franchiseName: f.name,
                    type: 'inactive',
                    message: "Sin facturación registrada este mes",
                    value: "0€"
                });
            }

            // 🚨 Rule 3: High Revenue Drop (vs Avg - Naive check)
            // If revenue is < 10% of network average (and not zero)
            if (revenue > 0 && revenue < (avgRevenue * 0.1)) {
                detected.push({
                    id: f.id,
                    franchiseName: f.name,
                    type: 'critical_loss', // Reusing type for UI simplicity
                    message: "Rendimiento muy por debajo de la media",
                    value: "-90%"
                });
            }
        });

        // Sort by severity (Critical operations first)
        return detected.sort((a, _) => a.type === 'inactive' ? -1 : 1).slice(0, 4); // Show max 4
    }, [franchises]);

    if (loading) {
        return (
            <div className="bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 h-full animate-pulse">
                <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
                <div className="space-y-3">
                    <div className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
                    <div className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 h-full flex flex-col shadow-sm">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <AlertOctagon className="w-5 h-5 text-rose-500" />
                        Detector de Anomalías
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                        IA Monitor: {anomalies.length > 0 ? `${anomalies.length} problemas detectados` : 'Sistema nominal'}
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                {anomalies.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-emerald-500/10 bg-emerald-50/10 rounded-xl">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mb-3" />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Todo en orden</h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-[180px]">
                            No hay desviaciones críticas en la red en este momento.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {anomalies.map((anomaly, idx) => (
                            <div
                                key={`${anomaly.id}-${idx}`}
                                className="bg-rose-50 dark:bg-rose-900/10 border-l-4 border-rose-500 p-3 rounded-r-xl flex justify-between items-start group hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors"
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                            {anomaly.franchiseName}
                                        </h4>
                                        {anomaly.type === 'inactive' && (
                                            <span className="px-1.5 py-0.5 bg-rose-200 dark:bg-rose-800 text-[10px] font-bold text-rose-800 dark:text-rose-200 rounded uppercase tracking-wide">
                                                Inactivo
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-rose-700 dark:text-rose-300 font-medium leading-tight">
                                        {anomaly.message}
                                    </p>
                                </div>
                                {anomaly.value && (
                                    <div className="text-right pl-2">
                                        <span className="text-xs font-black text-rose-600 dark:text-rose-400 block">
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
