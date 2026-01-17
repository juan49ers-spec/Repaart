import { useState, type FC } from 'react';
import { Lightbulb, AlertTriangle, TrendingUp, CheckCircle, ArrowRight, ChevronLeft, ChevronRight, Sparkles, Target, Zap } from 'lucide-react';
import { Card } from '../../../../components/ui/primitives/Card';
import { Badge } from '../../../../components/ui/primitives/Badge';
import { formatMoney } from '../../../../lib/finance';

interface FinancialAdvisorWidgetProps {
    revenue: number;
    expenses: number;
    margin: number; // percentage
    hourlyCost: number;
    taxReserve: number;
    trend: number; // percentage change
}

interface Insight {
    id: string;
    type: 'success' | 'warning' | 'danger' | 'info' | 'opportunity';
    icon: any;
    title: string;
    message: string;
    impact?: string; // e.g., "+450€/mes"
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

    // AI Logic: Generate dynamic insights
    const generateInsights = (): Insight[] => {
        const insights: Insight[] = [];

        // 1. Margin Optimization (Opportunity)
        if (margin < 15 && margin > 0) {
            const potentialGain = revenue * 0.05; // Target +5% margin
            insights.push({
                id: 'margin-opt',
                type: 'opportunity',
                icon: Target,
                title: 'Potencial de Mejora',
                message: `Tu margen del ${margin.toFixed(0)}% puede crecer. Reducir costes de flota un 10% tendría gran impacto.`,
                impact: `+${formatMoney(potentialGain)}€`,
                action: 'Analizar Costes',
                priority: 'alta'
            });
        }

        // 2. High Hourly Cost (Warning)
        if (hourlyCost > 22) {
            const excessCost = (hourlyCost - 20) * 160; // Assuming 160h/month
            insights.push({
                id: 'hourly-cost',
                type: 'warning',
                icon: AlertTriangle,
                title: 'Coste Hora Elevado',
                message: `Estás en ${hourlyCost.toFixed(2)}€/h. El objetivo ideal es <20€/h. Revisa turnos inactivos.`,
                impact: `-${formatMoney(excessCost)}€`,
                action: 'Ver Turnos',
                priority: 'media'
            });
        }

        // 3. Tax Reserve (Critical)
        const expectedReserve = revenue * 0.21;
        if (taxReserve < expectedReserve * 0.4 && revenue > 0) {
            insights.push({
                id: 'tax-risk',
                type: 'danger',
                icon: Zap,
                title: 'Riesgo Fiscal',
                message: 'Tu hucha fiscal está muy por debajo de lo recomendado para el IVA trimestral.',
                impact: 'Riesgo Sanción',
                action: 'Ajustar Hucha',
                priority: 'alta'
            });
        }

        // 4. Growth Momentum (Success)
        if (trend > 8) {
            insights.push({
                id: 'growth',
                type: 'success',
                icon: TrendingUp,
                title: 'Momentum Positivo',
                message: `Crecimiento del ${trend.toFixed(1)}% vs mes anterior. Tu estrategia está funcionando.`,
                impact: 'Tendencia Alcista',
                priority: 'baja'
            });
        }

        // Default: General Advice
        if (insights.length < 2) {
            insights.push({
                id: 'general',
                type: 'info',
                icon: Lightbulb,
                title: 'Consejo Pro',
                message: 'Mantén tu coste de personal por debajo del 35% de la facturación para asegurar rentabilidad.',
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
            case 'success': return {
                bg: 'bg-emerald-50 dark:bg-emerald-900/10',
                border: 'border-emerald-100 dark:border-emerald-800',
                text: 'text-emerald-700 dark:text-emerald-400',
                iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
                accent: 'text-emerald-600'
            };
            case 'warning': return {
                bg: 'bg-amber-50 dark:bg-amber-900/10',
                border: 'border-amber-100 dark:border-amber-800',
                text: 'text-amber-700 dark:text-amber-400',
                iconBg: 'bg-amber-100 dark:bg-amber-900/30',
                accent: 'text-amber-600'
            };
            case 'danger': return {
                bg: 'bg-rose-50 dark:bg-rose-900/10',
                border: 'border-rose-100 dark:border-rose-800',
                text: 'text-rose-700 dark:text-rose-400',
                iconBg: 'bg-rose-100 dark:bg-rose-900/30',
                accent: 'text-rose-600'
            };
            case 'opportunity': return {
                bg: 'bg-indigo-50 dark:bg-indigo-900/10',
                border: 'border-indigo-100 dark:border-indigo-800',
                text: 'text-indigo-700 dark:text-indigo-400',
                iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
                accent: 'text-indigo-600'
            };
            default: return {
                bg: 'bg-slate-50 dark:bg-slate-900/30',
                border: 'border-slate-100 dark:border-slate-800',
                text: 'text-slate-600 dark:text-slate-400',
                iconBg: 'bg-white dark:bg-slate-800',
                accent: 'text-slate-500'
            };
        }
    };

    const styles = currentTip ? getStyles(currentTip.type) : getStyles('info');
    const Icon = currentTip?.icon || Lightbulb;

    return (
        <Card className="h-full flex flex-col relative overflow-hidden group">
            {/* Header: AI Persona */}
            <div className="flex items-center justify-between p-4 pb-2">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Sparkles className="w-5 h-5 text-white animate-pulse" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" title="Online" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white leading-none">Tu Asesor</h3>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">
                            IA Financiera
                        </p>
                    </div>
                </div>
                <Badge intent="accent" className="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800">
                    {insights.length} INSIGHTS
                </Badge>
            </div>

            {/* Insights Container */}
            <div className="flex-1 px-4 relative">
                {currentTip ? (
                    <div key={currentTip.id} className={`h-full flex flex-col justify-center animate-in fade-in slide-in-from-right-4 duration-300`}>
                        <div className={`p-4 rounded-2xl border ${styles.bg} ${styles.border} relative overflow-hidden`}>
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 dark:bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                            <div className="flex items-start gap-3 relative z-10">
                                <div className={`p-2.5 rounded-xl ${styles.iconBg} shadow-sm shrink-0`}>
                                    <Icon className={`w-5 h-5 ${styles.accent}`} strokeWidth={2.5} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className={`text-xs font-black uppercase tracking-wide ${styles.text}`}>
                                            {currentTip.title}
                                        </h4>
                                        {currentTip.impact && (
                                            <span className={`text-xs font-black ${styles.accent} bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm`}>
                                                {currentTip.impact}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                                        {currentTip.message}
                                    </p>

                                    {currentTip.action && (
                                        <button className={`mt-3 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${styles.accent} hover:underline decoration-2 underline-offset-4 transition-all`}>
                                            {currentTip.action}
                                            <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <CheckCircle className="w-10 h-10 text-emerald-300 mb-3" />
                        <p className="text-sm font-medium text-slate-500">Todo parece en orden hoy.</p>
                    </div>
                )}
            </div>

            {/* Navigation & Footer - Clean & Minimal */}
            <div className="p-4 pt-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Análisis en tiempo real</span>
                </div>

                {totalTips > 1 && (
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-100 dark:border-slate-800">
                        <button onClick={prevTip} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-400 hover:text-indigo-600 transition-all shadow-sm hover:shadow">
                            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 min-w-[24px] text-center tabular-nums">
                            {currentTipIndex + 1}/{totalTips}
                        </span>
                        <button onClick={nextTip} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-400 hover:text-indigo-600 transition-all shadow-sm hover:shadow">
                            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default FinancialAdvisorWidget;
