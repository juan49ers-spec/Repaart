import React from 'react';
import { AlertTriangle, CheckCircle, Search, TrendingUp, Brain, Zap, Target, Activity } from 'lucide-react';
import { formatMoney } from '../../../lib/finance';

interface SmartInsightsProps {
    mode?: 'franchise' | 'admin';
    // Franchise Props
    report?: any;
    revenue?: number;
    orders?: number;
    // Admin Props
    stats?: {
        totalRevenue: number;
        totalProfit: number;
        margin: number;
        franchiseCount: number;
    };
    trendData?: any[];
    alerts?: any[];
}

const SmartInsightsWidget: React.FC<SmartInsightsProps> = ({
    mode = 'franchise',
    report,
    revenue = 0,
    orders = 0,
    stats,
    trendData,
    alerts
}) => {
    // --- LOGIC: THE DETECTIVE ---
    const insights: any[] = [];

    // ==========================================
    // 🛡️ ADMIN MODE LOGIC
    // ==========================================
    if (mode === 'admin') {
        if (stats) {
            // 1. PROJECTED REVENUE (New "Powerful" Feature)
            // Simple extrapolation: (Revenue / Day) * TotalDays
            const today = new Date();
            const dayOfMonth = today.getDate();
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

            if (dayOfMonth > 5) { // Only project after day 5 for stability
                const projected = (stats.totalRevenue / dayOfMonth) * daysInMonth;

                // Let's just show the projection info
                insights.push({
                    type: 'info',
                    title: 'Proyección de Cierre',
                    message: `Al ritmo actual, cerrarás el mes en ~${formatMoney(projected)}€.`,
                    icon: <Target className="w-4 h-4 text-indigo-400" />
                });
            }

            // 2. MARGIN CHECK (Network Wide)
            if (stats.margin < 12) {
                insights.push({
                    type: 'warning',
                    title: 'Margen de Red Bajo',
                    message: `Promedio global: ${stats.margin.toFixed(1)}%. Objetivo: >15%.`,
                    icon: <TrendingUp className="w-4 h-4 text-amber-500" />
                });
            } else if (stats.margin > 18) {
                insights.push({
                    type: 'success',
                    title: 'Rentabilidad Alta',
                    message: `Margen de red excelente: ${stats.margin.toFixed(1)}%.`,
                    icon: <CheckCircle className="w-4 h-4 text-emerald-500" />
                });
            }

            // 3. REVENUE TREND
            if (trendData && trendData.length >= 2) {
                const current = trendData[trendData.length - 1].value;
                const previous = trendData[trendData.length - 2].value;
                const growth = ((current - previous) / previous) * 100;

                if (growth > 10) {
                    insights.push({
                        type: 'success',
                        title: 'Crecimiento Acelerado',
                        message: `+${growth.toFixed(0)}% vs mes anterior. Tendencia positiva.`,
                        icon: <TrendingUp className="w-4 h-4 text-emerald-500" />
                    });
                } else if (growth < -10) {
                    insights.push({
                        type: 'warning',
                        title: 'Desaceleración',
                        message: `Caída del ${Math.abs(growth).toFixed(0)}% en facturación vs mes anterior.`,
                        icon: <TrendingUp className="w-4 h-4 text-rose-500 rotate-90" />
                    });
                }
            }
        }

        // 4. SYSTEM ALERTS & EFFICIENCY
        if (alerts && alerts.length > 0) {
            insights.push({
                type: 'warning',
                title: 'Atención Requerida',
                message: `${alerts.length} incidencias críticas en la red.`,
                icon: <AlertTriangle className="w-4 h-4 text-rose-400" />
            });
        }

    } else {
        // ==========================================
        // 🏪 FRANCHISE MODE LOGIC (Existing + Enhanced)
        // ==========================================
        if (!report || !report.breakdown) return null;

        // 1. ORDER VOLUME & TICKET ANALYSIS (New)
        if (orders > 0 && revenue > 0) {
            const avgTicket = revenue / orders;

            // Insight: High Volume vs High Ticket
            if (avgTicket < 5 && orders > 2000) {
                insights.push({
                    type: 'info',
                    title: 'Volumen Alto / Ticket Bajo',
                    message: `Ticket medio bajo (${avgTicket.toFixed(2)}€). El negocio depende del volumen masivo.`,
                    icon: <Activity className="w-4 h-4 text-blue-400" />
                });
            } else if (avgTicket > 6) {
                insights.push({
                    type: 'success',
                    title: 'Ticket Medio Saludable',
                    message: `Excelente ticket medio de ${avgTicket.toFixed(2)}€. Maximiza cada entrega.`,
                    icon: <TrendingUp className="w-4 h-4 text-emerald-500" />
                });
            }
        }

        // 2. FUEL CHECK (Gasoline)
        const fuelExpense = report.breakdown.find((i: any) => i.id === 'fuel' || i.name.toLowerCase().includes('gasolina') || i.name.toLowerCase().includes('combustible'));
        if (fuelExpense && revenue > 0) {
            const fuelRatio = (fuelExpense.value / revenue) * 100;
            if (fuelRatio > 8) {
                insights.push({
                    type: 'warning',
                    title: 'Exceso en Combustible',
                    message: `Gasto: ${fuelRatio.toFixed(1)}% (Obj: <5%). Revisa rutas.`,
                    icon: <Zap className="w-4 h-4 text-amber-500" />
                });
            }
        }

        // 3. REPAIRS CHECK
        const repairExpense = report.breakdown.find((i: any) => i.id === 'repairs' || i.name.toLowerCase().includes('reparaci'));
        if (repairExpense && repairExpense.value > 300) {
            insights.push({
                type: 'warning',
                title: 'Pico en Taller',
                message: `Gasto inusual de ${formatMoney(repairExpense.value)}€ en reparaciones.`,
                icon: <AlertTriangle className="w-4 h-4 text-rose-500" />
            });
        }

        // 4. ANOMALY IN "OTHERS"
        const otherExpense = report.breakdown.find((i: any) => i.id === 'other' || i.name.toLowerCase().includes('otros'));
        if (otherExpense && otherExpense.value > 500) {
            insights.push({
                type: 'info',
                title: 'Auditoría Sugerida',
                message: `Categoría "Otros" excesiva (${formatMoney(otherExpense.value)}€). Desglosar.`,
                icon: <Search className="w-4 h-4 text-blue-400" />
            });
        }



        // 6. PROFITABILITY
        if (report.taxes && report.taxes.margin > 18) {
            insights.push({
                type: 'success',
                title: 'Franquicia Top Performer',
                message: `Margen neto del ${report.taxes.margin.toFixed(1)}%. ¡Excelente gestión!`,
                icon: <CheckCircle className="w-4 h-4 text-emerald-500" />
            });
        }
    }

    // HAPPY STATE
    if (insights.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/60 rounded-3xl p-6 backdrop-blur-md h-full flex flex-col justify-between group shadow-sm dark:shadow-none transition-colors">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 transition-colors">Sistema Optimizado</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium transition-colors">Sin anomalías detectadas</p>
                    </div>
                </div>
                {/* Visual decoration */}
                <div className="h-12 flex items-end justify-center gap-1 opacity-20">
                    <div className="w-1 h-4 bg-emerald-400 rounded-t" />
                    <div className="w-1 h-6 bg-emerald-400 rounded-t" />
                    <div className="w-1 h-8 bg-emerald-400 rounded-t" />
                    <div className="w-1 h-5 bg-emerald-400 rounded-t" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/60 rounded-3xl p-5 backdrop-blur-md h-full overflow-hidden flex flex-col relative group hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all shadow-sm dark:shadow-none">
            {/* Glowing header effect (subtle) */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-3 mb-4 shrink-0">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:text-white group-hover:bg-indigo-600 transition-all shadow-[0_0_15px_rgba(99,102,241,0.05)] group-hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                    <Brain className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 group-hover:text-white transition-colors">Smart Insights</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium">
                        {mode === 'admin' ? 'Inteligencia de Red' : 'Auditoría Automática'}
                    </p>
                </div>
            </div>

            <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1 -mr-2">
                {insights.map((insight, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border flex items-start gap-3 transition-all hover:translate-x-1 ${insight.type === 'warning' ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20 hover:border-amber-500' :
                        insight.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20 hover:border-emerald-500' :
                            insight.type === 'info' ? 'bg-blue-50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/20 hover:border-blue-500' :
                                'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700'
                        }`}>
                        <div className="mt-0.5 shrink-0">
                            {insight.icon}
                        </div>
                        <div>
                            <p className={`text-xs font-bold mb-0.5 ${insight.type === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                                insight.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' :
                                    insight.type === 'info' ? 'text-blue-600 dark:text-blue-400' :
                                        'text-slate-700 dark:text-slate-300'
                                }`}>
                                {insight.title}
                            </p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                                {insight.message}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SmartInsightsWidget;
