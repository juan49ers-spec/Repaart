import { useMemo, type FC } from 'react';
import { AlertTriangle, TrendingUp, CheckCircle, Sparkles, TrendingDown, ShieldAlert, ArrowRight, MessageCircle } from 'lucide-react';
import { formatMoney } from '../../../../lib/finance';
import { cn } from '../../../../lib/utils';

// ── Types ──────────────────────────────────────────────────
interface FinancialAdvisorWidgetProps {
    revenue: number;
    expenses: number;
    margin: number;
    hourlyCost: number;
    taxReserve: number;
    trend: number;
    onOpenAdvisor?: () => void;
}

interface Alert {
    id: string;
    severity: 'critical' | 'warning' | 'positive';
    label: string;
    detail: string;
    tip: string;
}

// ── Score Calculation ──────────────────────────────────────
function calculateHealthScore(
    margin: number,
    trend: number,
    expenseRatio: number,
    taxReserve: number,
    revenue: number
): number {
    const marginScore = margin >= 20 ? 100
        : margin >= 15 ? 80
            : margin >= 10 ? 60
                : margin >= 5 ? 35
                    : margin >= 0 ? 15
                        : 0;

    const trendScore = trend > 10 ? 100
        : trend > 5 ? 85
            : trend > 0 ? 70
                : trend > -5 ? 50
                    : trend > -10 ? 30
                        : 10;

    const ratioScore = expenseRatio < 0.6 ? 100
        : expenseRatio < 0.7 ? 85
            : expenseRatio < 0.8 ? 65
                : expenseRatio < 0.9 ? 40
                    : 15;

    const expectedReserve = revenue * 0.21;
    const reserveRatio = expectedReserve > 0 ? taxReserve / expectedReserve : 1;
    const reserveScore = reserveRatio >= 0.8 ? 100
        : reserveRatio >= 0.5 ? 70
            : reserveRatio >= 0.3 ? 40
                : 15;

    const profitScore = margin > 0 && revenue > 0
        ? Math.min(100, (revenue * margin / 100 / 3000) * 100)
        : 0;

    return Math.round(
        marginScore * 0.35 +
        trendScore * 0.25 +
        ratioScore * 0.20 +
        reserveScore * 0.10 +
        profitScore * 0.10
    );
}

// ── Alert Generation ───────────────────────────────────────
function generateAlerts(
    margin: number,
    trend: number,
    expenseRatio: number,
    hourlyCost: number,
    revenue: number,
    expenses: number
): Alert[] {
    const alerts: Alert[] = [];

    // Margen
    if (margin < 5 && revenue > 0) {
        alerts.push({
            id: 'margin-critical',
            severity: 'critical',
            label: 'Ganas muy poco',
            detail: `De cada 100€ que entran, solo te quedas ${margin.toFixed(1)}€. Lo ideal es quedarte con 15€ o más.`,
            tip: 'Revisa tus gastos más grandes o sube el precio del reparto.',
        });
    } else if (margin < 15 && margin >= 5) {
        alerts.push({
            id: 'margin-low',
            severity: 'warning',
            label: 'Margen mejorable',
            detail: `Te quedas con ${margin.toFixed(1)}€ de cada 100€. Lo ideal sería 15€ o más.`,
            tip: 'Busca reducir un 5-10% en tu gasto más alto.',
        });
    }

    // Gastos
    if (expenseRatio > 0.85 && revenue > 0) {
        alerts.push({
            id: 'expenses-high',
            severity: 'critical',
            label: 'Gastos demasiado altos',
            detail: `Estás gastando ${(expenseRatio * 100).toFixed(0)} céntimos de cada euro que ganas. Deberías gastar menos de 70.`,
            tip: 'Mira tus 3 gastos más grandes y negocia con proveedores.',
        });
    } else if (expenseRatio > 0.7) {
        alerts.push({
            id: 'expenses-warning',
            severity: 'warning',
            label: 'Gastos elevados',
            detail: `Gastas ${(expenseRatio * 100).toFixed(0)} céntimos de cada euro. Lo ideal es menos de 70.`,
            tip: 'Revisa si puedes optimizar turnos o reducir combustible.',
        });
    }

    // Coste hora
    if (hourlyCost > 22) {
        alerts.push({
            id: 'hourly-high',
            severity: 'warning',
            label: 'Coste por hora alto',
            detail: `Te cuesta ${hourlyCost.toFixed(1)}€ cada hora de trabajo. Lo habitual es menos de 20€.`,
            tip: 'Intenta cubrir más pedidos por turno o ajustar horarios.',
        });
    }

    // Tendencia
    if (trend < -10) {
        alerts.push({
            id: 'trend-down',
            severity: 'critical',
            label: 'Ingresos cayendo',
            detail: `Estás ingresando un ${Math.abs(trend).toFixed(1)}% menos que el mes pasado.`,
            tip: 'Analiza si hay menos pedidos o si el ticket medio ha bajado.',
        });
    } else if (trend < -3) {
        alerts.push({
            id: 'trend-slight',
            severity: 'warning',
            label: 'Ingresos bajando',
            detail: `Un ${Math.abs(trend).toFixed(1)}% menos que el mes anterior.`,
            tip: 'Mantén el ojo en la tendencia para reaccionar a tiempo.',
        });
    }

    // Pérdidas
    if (revenue > 0 && expenses > revenue) {
        alerts.push({
            id: 'losses',
            severity: 'critical',
            label: 'Estás perdiendo dinero',
            detail: `Este mes llevas ${formatMoney(expenses - revenue)}€ de pérdidas.`,
            tip: 'Es urgente: reduce gastos o aumenta pedidos esta semana.',
        });
    }

    // Positivos
    if (trend > 10) {
        alerts.push({
            id: 'growth',
            severity: 'positive',
            label: '¡Estás creciendo!',
            detail: `Ingresas un ${trend.toFixed(1)}% más que el mes pasado.`,
            tip: 'Buen trabajo. Mantén el ritmo y vigila que el margen no baje.',
        });
    }

    if (margin >= 20) {
        alerts.push({
            id: 'margin-great',
            severity: 'positive',
            label: '¡Excelente rentabilidad!',
            detail: `Te quedas con ${margin.toFixed(1)}€ de cada 100€. Estás por encima de la media.`,
            tip: 'Considera invertir parte del beneficio en crecimiento.',
        });
    }

    const priority = { critical: 0, warning: 1, positive: 2 };
    return alerts.sort((a, b) => priority[a.severity] - priority[b.severity]).slice(0, 3);
}

// ── Score Ring Component ───────────────────────────────────
const ScoreRing: FC<{ score: number; size?: number }> = ({ score, size = 96 }) => {
    const radius = (size - 12) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;
    const center = size / 2;

    const getColorClasses = (s: number) => {
        if (s >= 70) return {
            text: 'text-emerald-500',
            stroke: 'stroke-emerald-500',
            bg: 'bg-emerald-100 dark:bg-emerald-900/30',
            track: 'stroke-emerald-100 dark:stroke-emerald-900/10'
        };
        if (s >= 45) return {
            text: 'text-amber-500',
            stroke: 'stroke-amber-500',
            bg: 'bg-amber-100 dark:bg-amber-900/30',
            track: 'stroke-amber-100 dark:stroke-amber-900/10'
        };
        return {
            text: 'text-rose-500',
            stroke: 'stroke-rose-500',
            bg: 'bg-rose-100 dark:bg-rose-900/30',
            track: 'stroke-rose-100 dark:stroke-rose-900/10'
        };
    };

    const colors = getColorClasses(score);
    const label = score >= 70 ? '🟢 Vas bien' : score >= 45 ? '🟡 Puedes mejorar' : '🔴 Necesitas actuar';

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative flex items-center justify-center" style={{ '--ring-size': `${size}px`, width: 'var(--ring-size)', height: 'var(--ring-size)' } as React.CSSProperties}>
                <svg width={size} height={size} className="transform -rotate-90">
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        className={cn("transition-colors duration-300", colors.track)}
                        strokeWidth={8}
                    />
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        className={cn("transition-all duration-1000 ease-out", colors.stroke)}
                        strokeWidth={8}
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - progress}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn("text-2xl font-black tabular-nums leading-none", colors.text)}>
                        {score}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        /100
                    </span>
                </div>
            </div>
            <span className={cn(
                "text-[11px] font-bold px-2.5 py-1 rounded-full",
                colors.text,
                colors.bg
            )}>
                {label}
            </span>
        </div>
    );
};

// ── Alert Badge  ───────────────────────────────────────────
const AlertBadge: FC<{ alert: Alert }> = ({ alert }) => {
    const config = {
        critical: {
            icon: ShieldAlert,
            bg: 'bg-rose-50 dark:bg-rose-900/20',
            border: 'border-rose-200 dark:border-rose-800/40',
            text: 'text-rose-700 dark:text-rose-400',
            iconColor: 'text-rose-500',
            tipBg: 'bg-rose-100/60 dark:bg-rose-900/30',
        },
        warning: {
            icon: AlertTriangle,
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            border: 'border-amber-200 dark:border-amber-800/40',
            text: 'text-amber-700 dark:text-amber-400',
            iconColor: 'text-amber-500',
            tipBg: 'bg-amber-100/60 dark:bg-amber-900/30',
        },
        positive: {
            icon: CheckCircle,
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            border: 'border-emerald-200 dark:border-emerald-800/40',
            text: 'text-emerald-700 dark:text-emerald-400',
            iconColor: 'text-emerald-500',
            tipBg: 'bg-emerald-100/60 dark:bg-emerald-900/30',
        },
    };

    const c = config[alert.severity];
    const Icon = c.icon;

    return (
        <div className={cn('flex flex-col gap-1.5 p-2.5 rounded-lg border', c.bg, c.border)}>
            <div className="flex items-start gap-2.5">
                <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', c.iconColor)} />
                <div className="min-w-0 flex-1">
                    <p className={cn('text-xs font-bold leading-tight', c.text)}>
                        {alert.label}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                        {alert.detail}
                    </p>
                </div>
            </div>
            <p className={cn('text-[10px] font-medium px-2 py-1 rounded-md ml-6', c.tipBg, c.text)}>
                💡 {alert.tip}
            </p>
        </div>
    );
};

// ── Main Widget ────────────────────────────────────────────
const FinancialAdvisorWidget: FC<FinancialAdvisorWidgetProps> = ({
    revenue,
    expenses,
    margin,
    hourlyCost,
    taxReserve,
    trend,
    onOpenAdvisor,
}) => {
    const expenseRatio = revenue > 0 ? expenses / revenue : 0;

    const score = useMemo(
        () => calculateHealthScore(margin, trend, expenseRatio, taxReserve, revenue),
        [margin, trend, expenseRatio, taxReserve, revenue]
    );

    const alerts = useMemo(
        () => generateAlerts(margin, trend, expenseRatio, hourlyCost, revenue, expenses),
        [margin, trend, expenseRatio, hourlyCost, revenue, expenses]
    );

    const trendIcon = trend > 0
        ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
        : trend < 0
            ? <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            : null;

    return (
        <div className="workstation-card workstation-scanline p-5 h-full flex flex-col group/card transition-all mechanical-press overflow-hidden">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        Salud Financiera
                    </h3>
                </div>
                {trendIcon && (
                    <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                        {trendIcon}
                        <span className={cn(
                            'tabular-nums',
                            trend > 0 ? 'text-emerald-600' : 'text-rose-600'
                        )}>
                            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                        </span>
                    </div>
                )}
            </div>

            {/* BODY: Score + Alerts */}
            <div className="flex-1 flex gap-5 items-start">
                {/* Score Ring */}
                <div className="shrink-0">
                    <ScoreRing score={score} size={96} />
                </div>

                {/* Alerts List */}
                <div className="flex-1 space-y-2 min-w-0">
                    {alerts.length > 0 ? (
                        alerts.map((alert) => (
                            <AlertBadge key={alert.id} alert={alert} />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-4 opacity-60">
                            <CheckCircle className="w-8 h-8 text-emerald-400 mb-1.5" />
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                Todo en orden
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* FOOTER: CTA */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
                <button
                    onClick={onOpenAdvisor}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md"
                >
                    <MessageCircle className="w-4 h-4" />
                    Pide consejo al Asesor
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
            </div>
        </div>
    );
};

export default FinancialAdvisorWidget;
