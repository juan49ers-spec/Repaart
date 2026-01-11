import React from 'react';
import { Wallet, TrendingUp, Info, PartyPopper } from 'lucide-react';
import { formatMoney } from '../../../../lib/finance';
import { Card } from '../../../../ui/primitives/Card';
import { SectionHeader } from '../../../../ui/primitives/SectionHeader';
import { StatValue } from '../../../../ui/primitives/StatValue';
import { Badge, BadgeIntent } from '../../../../ui/primitives/Badge';

interface TakeHomeProfitWidgetProps {
    /** Total revenue for the month */
    revenue: number;
    /** Total operating expenses */
    totalExpenses: number;
    /** IRPF tax percentage (default 20%) */
    irpfPercent?: number;
    /** Trend data for sparkline visualization */
    trend?: number[];
}

/**
 * TakeHomeProfitWidget - Motivational widget showing net profit after all deductions
 * Uses Atomic Design Primitives
 */
const TakeHomeProfitWidget: React.FC<TakeHomeProfitWidgetProps> = ({
    revenue,
    totalExpenses,
    irpfPercent = 20
}) => {
    const [showBreakdown, setShowBreakdown] = React.useState(false);

    const operatingProfit = revenue - totalExpenses;
    const estimatedTax = operatingProfit > 0 ? (operatingProfit * irpfPercent) / 100 : 0;
    const takeHomeProfit = operatingProfit - estimatedTax;
    const margin = revenue > 1 ? (takeHomeProfit / revenue) * 100 : 0;

    const isExcellent = margin >= 20;
    const isWarning = margin < 8;


    const getConfig = () => {
        if (isExcellent) return {
            color: 'text-emerald-600 dark:text-emerald-400',
            icon: PartyPopper,
            badge: 'Excelente',
            intent: 'success' as BadgeIntent,
            message: 'Rentabilidad superior. ¡Continúa así!'
        };
        if (isWarning) return {
            color: 'text-rose-600 dark:text-rose-400',
            icon: Info,
            badge: 'Optimizar',
            intent: 'danger' as BadgeIntent,
            message: 'Atención: considera reducir gastos o aumentar ingresos.'
        };
        return {
            color: 'text-indigo-600 dark:text-indigo-400',
            icon: Wallet,
            badge: 'Estable',
            intent: 'warning' as BadgeIntent, // Yellowish
            message: 'Márgenes saludables. Puedes optimizar aún más.'
        };
    };

    const config = getConfig();

    return (
        <Card className="h-full flex flex-col relative group">
            {/* Header */}
            <SectionHeader
                title="Tu Bolsillo"
                subtitle="Beneficio Neto Estimado"
                icon={<config.icon className={`w-5 h-5 ${config.color}`} />}
                action={
                    <Badge intent={config.intent} className="animate-in zoom-in spin-in-3 duration-500">
                        {config.badge}
                    </Badge>
                }
            />

            {/* Main Value */}
            <div className="mb-5 relative z-10">
                <StatValue
                    value={formatMoney(takeHomeProfit)}
                    unit="€"
                    description={`${margin.toFixed(1)}% MARGEN NETO`}
                    size="xl"
                />
            </div>

            {/* Always-Visible Breakdown */}
            <div className="flex-1 space-y-2 mb-4 relative z-10">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ingresos Brutos</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">{formatMoney(revenue)}€</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Gastos + IRPF</span>
                    </div>
                    <span className="text-xs font-bold text-rose-500 tabular-nums">-{formatMoney(totalExpenses + estimatedTax)}€</span>
                </div>
            </div>

            {/* Footer Action */}
            <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 relative z-10">
                <button
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="w-full flex items-center justify-center gap-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                    {showBreakdown ? 'Ocultar Detalle' : 'Ver Detalle Completo'}
                    <TrendingUp className={`w-3 h-3 transition-transform duration-300 ${showBreakdown ? 'rotate-180' : ''}`} />
                </button>

                {showBreakdown && (
                    <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                        <div className="flex justify-between text-[10px] py-1.5">
                            <span className="text-slate-500 font-medium">Gastos Operativos</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{formatMoney(totalExpenses)}€</span>
                        </div>
                        <div className="flex justify-between text-[10px] py-1.5">
                            <span className="text-slate-500 font-medium">Reserva IRPF ({irpfPercent}%)</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{formatMoney(estimatedTax)}€</span>
                        </div>
                        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                            <p className={`text-[9px] ${config.color} font-bold italic text-center`}>
                                {config.message}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default TakeHomeProfitWidget;
