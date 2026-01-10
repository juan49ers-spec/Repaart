import React, { type FC } from 'react';
import { AlertTriangle, Info, CheckCircle2, XCircle, type LucideIcon } from 'lucide-react';
import { formatMoney } from '../../../../lib/finance';
import { ALERT_THRESHOLDS } from '../../../../lib/constants';

type AlertType = 'error' | 'warning' | 'success';

interface Alert {
    type: AlertType;
    icon: LucideIcon;
    title: string;
    message: string;
}

interface ReportMetrics {
    profitMargin?: number;
    breakEvenOrders?: number;
    costPerKm?: number;
}

interface Report {
    orders: number;
    revenue: number;
    expenses: number;
    metrics?: ReportMetrics;
}

interface AlertsWidgetProps {
    report: Report | null;
}

const AlertsWidget: FC<AlertsWidgetProps> = ({ report }) => {
    if (!report) return null;

    const alerts: Alert[] = [];

    // Alert 1: Margen bajo (crítico)
    if (report.metrics?.profitMargin && report.metrics.profitMargin < ALERT_THRESHOLDS.MIN_PROFIT_MARGIN) {
        alerts.push({
            type: 'error',
            icon: AlertTriangle,
            title: 'Margen Reducido',
            message: `Tu margen actual es ${(report.metrics.profitMargin || 0).toFixed(1)}%. El objetivo saludable es >${ALERT_THRESHOLDS.MIN_PROFIT_MARGIN}%.`
        });
    }

    // Alert 2: No alcanzas break-even
    if (report.metrics?.breakEvenOrders && report.orders < report.metrics.breakEvenOrders) {
        const shortage = report.metrics.breakEvenOrders - report.orders;
        alerts.push({
            type: 'error',
            icon: XCircle,
            title: 'Objetivo de Pedidos',
            message: `Faltan ${shortage} pedidos para cubrir gastos fijos.`
        });
    }

    // Alert 3: Gastos fijos muy altos
    const fixedCostRatio = report.revenue > 0 ? (report.expenses / report.revenue) * 100 : 0;
    if (fixedCostRatio > ALERT_THRESHOLDS.MAX_EXPENSE_RATIO) {
        alerts.push({
            type: 'warning',
            icon: Info,
            title: 'Gastos Estructurales',
            message: `Costes fijos: ${fixedCostRatio.toFixed(1)}% de ingresos. Intenta optimizar.`
        });
    }

    // Alert 4: Coste por km alto
    if (report.metrics?.costPerKm && report.metrics.costPerKm > ALERT_THRESHOLDS.MAX_COST_PER_KM) {
        alerts.push({
            type: 'warning',
            icon: Info,
            title: 'Eficiencia Logística',
            message: `Coste/km: ${formatMoney(report.metrics.costPerKm)}€. Objetivo: <${ALERT_THRESHOLDS.MAX_COST_PER_KM}€.`
        });
    }

    // Alert 6: Excelente rendimiento (positivo) (Renumbered implicitly)
    if (report.metrics?.profitMargin && report.metrics.profitMargin > ALERT_THRESHOLDS.EXCELLENT_MARGIN) {
        alerts.push({
            type: 'success',
            icon: CheckCircle2,
            title: 'Excelente Margen',
            message: `¡Gran trabajo! Margen del ${report.metrics.profitMargin.toFixed(1)}%.`
        });
    }

    // Alert 7: Superaste break-even significativamente
    if (report.metrics?.breakEvenOrders && report.orders > report.metrics.breakEvenOrders * ALERT_THRESHOLDS.BREAKEVEN_MULTIPLIER) {
        const surplus = report.orders - report.metrics.breakEvenOrders;
        alerts.push({
            type: 'success',
            icon: CheckCircle2,
            title: 'Objetivos Superados',
            message: `Superado punto de equilibrio por ${surplus} pedidos.`
        });
    }

    if (alerts.length === 0) return null;

    return (
        <div className="space-y-3">
            {alerts.slice(0, 3).map((alert, i) => { // Limit to 3 max
                const Icon = alert.icon;
                const isError = alert.type === 'error';
                const isWarning = alert.type === 'warning';

                // Dynamic Styles based on type
                const containerClasses = isError
                    ? "bg-rose-50/50 border-rose-100 hover:border-rose-200"
                    : isWarning
                        ? "bg-amber-50/50 border-amber-100 hover:border-amber-200"
                        : "bg-emerald-50/50 border-emerald-100 hover:border-emerald-200";

                const iconContainerClasses = isError
                    ? "bg-rose-100 text-rose-600 shadow-rose-100/50"
                    : isWarning
                        ? "bg-amber-100 text-amber-600 shadow-amber-100/50"
                        : "bg-emerald-100 text-emerald-600 shadow-emerald-100/50";

                const titleColor = isError ? "text-rose-900" : isWarning ? "text-amber-900" : "text-emerald-900";
                const bodyColor = isError ? "text-rose-700" : isWarning ? "text-amber-700" : "text-emerald-700";

                return (
                    <div
                        key={i}
                        className={`
                            glass-panel rounded-xl p-3 flex items-start gap-3 border transition-all duration-300 hover:shadow-md
                            ${containerClasses}
                        `}
                    >
                        <div className={`p-2 rounded-lg flex-shrink-0 shadow-sm ${iconContainerClasses}`}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div className="pt-0.5">
                            <h4 className={`font-bold text-sm mb-0.5 ${titleColor} tracking-tight`}>{alert.title}</h4>
                            <p className={`text-xs leading-relaxed font-medium ${bodyColor} break-words`}>
                                {alert.message}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// Memoize with custom comparison to prevent recalculating alerts unnecessarily
export default React.memo(AlertsWidget, (prevProps, nextProps) => {
    return prevProps.report === nextProps.report;
});
