import { useState, type FC } from 'react';
import { Lightbulb, AlertTriangle, TrendingUp, CheckCircle, ArrowRight, ChevronLeft, ChevronRight, Sparkles, Target, Zap, Activity } from 'lucide-react';
import { formatMoney } from '../../../../lib/finance';
import { cn } from '../../../../lib/utils';

interface FinancialAdvisorWidgetProps {
    revenue: number;
    expenses: number;
    margin: number;
    hourlyCost: number;
    taxReserve: number;
    trend: number;
}

interface Insight {
    id: string;
    type: 'success' | 'warning' | 'danger' | 'info' | 'opportunity';
    icon: any;
    title: string;
    message: string;
    impact?: string;
    action?: string;
    priority: 'alta' | 'media' | 'baja';
}

const FinancialAdvisorWidget: FC<FinancialAdvisorWidgetProps> = ({
    revenue,
    margin,
    hourlyCost,
    taxReserve,
    trend
}) => {
    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    const generateInsights = (): Insight[] => {
        const insights: Insight[] = [];
        if (margin < 15 && margin > 0) {
            const potentialGain = revenue * 0.05;
            insights.push({
                id: 'margin-opt',
                type: 'opportunity',
                icon: Target,
                title: 'Optimización de Margen',
                message: `El margen actual del ${margin.toFixed(0)}% está por debajo del umbral. Se recomienda reducir gastos de flota en un 10%.`,
                impact: `+${formatMoney(potentialGain)}€`,
                action: 'Analizar Costes',
                priority: 'alta'
            });
        }
        if (hourlyCost > 22) {
            const excessCost = (hourlyCost - 20) * 160;
            insights.push({
                id: 'hourly-cost',
                type: 'warning',
                icon: AlertTriangle,
                title: 'Alta Tasa de Gasto',
                message: `Coste operativo de ${hourlyCost.toFixed(2)}€/h. El objetivo del sistema es <20€/h. Audite turnos inactivos.`,
                impact: `-${formatMoney(excessCost)}€`,
                action: 'Auditar Turnos',
                priority: 'media'
            });
        }
        const expectedReserve = revenue * 0.21;
        if (taxReserve < expectedReserve * 0.4 && revenue > 0) {
            insights.push({
                id: 'tax-risk',
                type: 'danger',
                icon: Zap,
                title: 'Riesgo Fiscal Detectado',
                message: 'Las reservas de la hucha fiscal son críticamente bajas para el próximo pago trimestral de IVA.',
                impact: 'Umbral Crítico',
                action: 'Ejecutar Reserva',
                priority: 'alta'
            });
        }
        if (trend > 8) {
            insights.push({
                id: 'growth',
                type: 'success',
                icon: TrendingUp,
                title: 'Momentum Positivo',
                message: `Crecimiento del ${trend.toFixed(1)}% vs ciclo anterior. La estrategia operativa es conforme.`,
                impact: 'Tendencia Alcista',
                priority: 'baja'
            });
        }
        if (insights.length < 2) {
            insights.push({
                id: 'general',
                type: 'info',
                icon: Lightbulb,
                title: 'Nota de Eficiencia',
                message: 'Mantenga la carga laboral por debajo del 35% de los ingresos para asegurar el máximo margen de seguridad.',
                priority: 'baja'
            });
        }
        return insights.sort((a, _b) => (a.priority === 'alta' ? -1 : 1)).slice(0, 5);
    };

    const insights = generateInsights();
    const currentTip = insights[currentTipIndex];
    const totalTips = insights.length;

    const nextTip = () => setCurrentTipIndex((prev) => (prev + 1) % totalTips);
    const prevTip = () => setCurrentTipIndex((prev) => (prev - 1 + totalTips) % totalTips);

    const getStyles = (type: Insight['type']) => {
        switch (type) {
            case 'success': return { text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
            case 'warning': return { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
            case 'danger': return { text: 'text-ruby-600', bg: 'bg-ruby-600/10', border: 'border-ruby-600/20' };
            case 'opportunity': return { text: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' };
            default: return { text: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' };
        }
    };

    const styles = getStyles(currentTip?.type || 'info');
    const Icon = currentTip?.icon || Lightbulb;

    return (
        <div className="workstation-card workstation-scanline p-6 h-full flex flex-col group/card transition-all mechanical-press overflow-hidden">
            {/* TACTICAL AI HEADER */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
                        Asesor IA Financiero
                    </h3>
                </div>
                <div className="text-xs font-medium bg-slate-100 dark:bg-white/5 px-2 py-1 rounded border border-slate-200 dark:border-white/5 text-slate-500">
                    {insights.length} sugerencias
                </div>
            </div>

            {/* INSIGHTS DISPLAY TERMINAL */}
            <div className="flex-1 flex flex-col justify-center py-4">
                {currentTip ? (
                    <div key={currentTip.id} className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className={cn("p-4 rounded-xl border relative overflow-hidden", styles.bg, styles.border)}>
                            <div className="flex items-start gap-4 relative z-10">
                                <div className={cn("p-2 rounded-lg shrink-0", styles.bg)}>
                                    <Icon className={cn("w-5 h-5", styles.text)} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <h4 className={cn("text-sm font-bold uppercase tracking-wide", styles.text)}>
                                            {currentTip.title}
                                        </h4>
                                        {currentTip.impact && (
                                            <span className={cn("text-xs font-bold px-2 py-0.5 rounded tabular-nums", styles.bg, styles.text)}>
                                                {currentTip.impact}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-snug">
                                        {currentTip.message}
                                    </p>
                                    {currentTip.action && (
                                        <button className={cn("mt-3 text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-all hover:translate-x-1", styles.text)}>
                                            {currentTip.action}
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center opacity-40">
                        <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Sistema Óptimo</p>
                    </div>
                )}
            </div>

            {/* NAVIGATION MODULE */}
            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Diagnóstico en tiempo real</span>
                </div>

                {totalTips > 1 && (
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 p-0.5 rounded-lg border border-slate-200 dark:border-white/5">
                        <button onClick={prevTip} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all">
                            <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 min-w-[30px] text-center tabular-nums">
                            {currentTipIndex + 1}/{totalTips}
                        </span>
                        <button onClick={nextTip} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all">
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinancialAdvisorWidget;
