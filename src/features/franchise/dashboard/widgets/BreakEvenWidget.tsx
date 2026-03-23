import { type FC } from 'react';
import { Target, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { formatMoney } from '../../../../lib/finance';
import WidgetInfoTooltip from '../../../../components/ui/feedback/WidgetInfoTooltip';

interface BreakEvenWidgetProps {
    fixedCosts: number;        // Fixed Structural Costs (Rent, Insurance, Fees)
    avgOrderProfit: number;    // Average profit per order (Revenue - Variable Cost)
    currentOrders: number;     // Orders done today/this month
    timeframe?: 'daily' | 'monthly'; // To change text appropriately
}

const BreakEvenWidget: FC<BreakEvenWidgetProps> = ({
    fixedCosts,
    avgOrderProfit,
    currentOrders,
    timeframe = 'monthly' // Change logic depending on how data is fed
}) => {
    // If we don't know the profit per order, we can't calculate break even.
    // Avoid infinity or NaN by checking avgOrderProfit > 0
    const breakEvenOrders = avgOrderProfit > 0 ? Math.ceil(fixedCosts / avgOrderProfit) : 0;
    
    // Remaining orders to reach profitability
    const remainingOrders = Math.max(0, breakEvenOrders - currentOrders);
    const isProfitable = currentOrders >= breakEvenOrders && breakEvenOrders > 0;
    
    // Progress calculation
    const progressPercentage = breakEvenOrders > 0 
        ? Math.min((currentOrders / breakEvenOrders) * 100, 100) 
        : 0;

    return (
        <div className="workstation-card workstation-scanline p-6 h-full flex flex-col group/card transition-all mechanical-press overflow-hidden relative">
            
            {/* ALERT BANNER IF NOT PROFITABLE (Subtle background) */}
            {!isProfitable && breakEvenOrders > 0 && (
                <div className="absolute inset-0 bg-rose-500/5 dark:bg-rose-500/10 pointer-events-none" />
            )}
            
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4 relative z-10 w-full">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-rose-50 dark:bg-rose-900/10 rounded-lg">
                        <Target className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                            Punto de Equilibrio
                            <WidgetInfoTooltip 
                                title="Punto de Equilibrio"
                                description="Muestra cuántos pedidos necesitas completar en el periodo actual para pagar todos tus gastos fijos. Una vez superado este umbral, cada pedido genera beneficios netos reales."
                            />
                        </h3>
                    </div>
                </div>
                <div className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded capitalize",
                    isProfitable ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : "text-rose-600 bg-rose-50 dark:bg-rose-900/20"
                )}>
                    {isProfitable ? 'Superado' : 'A Pérdida'}
                </div>
            </div>

            {/* MAIN METRIC */}
            <div className="mb-2 flex items-baseline gap-2 relative z-10">
                <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
                    {breakEvenOrders > 0 ? breakEvenOrders : '-'}
                </span>
                <span className="text-xs font-medium text-slate-400">pedidos mínimos/{timeframe === 'daily' ? 'día' : 'mes'}</span>
            </div>

            {/* PROGRESS BAR */}
            <div className="mb-4 relative z-10">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {currentOrders} / {breakEvenOrders} pedidos
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {progressPercentage.toFixed(0)}%
                    </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div 
                        className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            isProfitable ? "bg-emerald-500" : "bg-rose-500"
                        )}
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>

            {/* HIGH-DENSITY ANALYSIS */}
            <div className="space-y-1 mb-6 mt-auto relative z-10">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Gastos Fijos</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                        {formatMoney(fixedCosts)}€
                    </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Margen x Pedido</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatMoney(avgOrderProfit)}€
                    </span>
                </div>
            </div>

            {/* ACTIONABLE INSIGHT */}
            <div className="pt-4 border-t border-slate-100 dark:border-white/5 relative z-10">
                <div className={cn(
                    "flex items-start gap-2 px-3 py-2 rounded-lg border",
                    isProfitable 
                        ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30" 
                        : "bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/30"
                )}>
                    {isProfitable ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    )}
                    <p className={cn(
                        "text-xs font-medium leading-tight",
                        isProfitable ? "text-emerald-800 dark:text-emerald-300" : "text-rose-800 dark:text-rose-300"
                    )}>
                        {isProfitable 
                            ? "Estructura pagada. Cada pedido a partir de ahora es beneficio puro." 
                            : breakEvenOrders > 0 
                                ? `Necesitas ${remainingOrders} pedidos más para dejar de perder dinero con la estructura.` 
                                : "Faltan datos de margen para calcular el equilibrio."}
                    </p>
                </div>
            </div>
            
        </div>
    );
};

export default BreakEvenWidget;
