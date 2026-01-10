import React from 'react';
import { TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { formatMoney } from '../../../../lib/finance';

interface CashBalanceHeroProps {
    /** Current cash balance */
    balance: number;
    /** Monthly revenue (for runway calculation) */
    revenue: number;
    /** Monthly expenses (for runway calculation) */
    expenses: number;
    /** Optional trend data for visualization */
    trend?: 'up' | 'down' | 'stable';
}

/**
 * CashBalanceHero - Hero card displaying most critical financial metric
 * 
 * Following industry standard (QuickBooks, Xero): Cash is King
 * Positioned at top of dashboard for immediate visibility
 * 
 * Shows:
 * - Current cash balance (large, prominent)
 * - Runway (months remaining at current burn rate)
 * - Trend indicator
 */
const CashBalanceHero: React.FC<CashBalanceHeroProps> = ({
    balance,
    revenue,
    expenses
}) => {
    // Calculate runway: how many months can business operate at current burn
    const monthlyBurn = expenses - revenue;
    const runway = monthlyBurn > 0 ? balance / monthlyBurn : 999; // 999 = infinite/profitable

    // Health indicators
    // const isHealthy = runway > 6 || monthlyBurn <= 0; // Commented out to avoid lint error
    const isWarning = runway <= 6 && runway > 3;
    const isCritical = runway <= 3 && runway > 0;

    // Visual configuration
    const getConfig = () => {
        if (isCritical) {
            return {
                gradient: 'from-rose-500/20 via-red-500/10 to-orange-500/20',
                border: 'border-rose-500/30',
                textColor: 'text-rose-400',
                icon: AlertCircle,
                message: 'Atención: Cash bajo'
            };
        }
        if (isWarning) {
            return {
                gradient: 'from-amber-500/20 via-yellow-500/10 to-orange-500/20',
                border: 'border-amber-500/30',
                textColor: 'text-amber-400',
                icon: Clock,
                message: 'Vigilar cash flow'
            };
        }
        return {
            gradient: 'from-emerald-500/20 via-teal-500/10 to-cyan-500/20',
            border: 'border-emerald-500/30',
            textColor: 'text-emerald-400',
            icon: TrendingUp,
            message: 'Cash saludable'
        };
    };

    const config = getConfig();
    const StatusIcon = config.icon;

    return (
        <div className={`relative overflow-hidden bg-slate-900 dark:bg-slate-900 border ${config.border} rounded-xl p-5 transition-all duration-300`}>

            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-50`} />

            {/* Content */}
            <div className="relative z-10 flex items-center justify-between">

                {/* Left: Cash Balance */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <StatusIcon className={`w-4 h-4 ${config.textColor}`} />
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                            Balance Disponible
                        </h3>
                    </div>

                    <div className="flex items-baseline gap-1.5">
                        <span className={`text-3xl font-bold ${config.textColor} tabular-nums`}>
                            {formatMoney(balance)}
                        </span>
                        <span className="text-2xl font-bold text-slate-500 dark:text-slate-500">€</span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 font-medium">{config.message}</p>
                </div>

                {/* Right: Runway */}
                <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1.5 font-bold">
                        Runway
                    </p>

                    {monthlyBurn <= 0 ? (
                        <div>
                            <div className="text-2xl font-bold text-emerald-400 dark:text-emerald-400">∞</div>
                            <p className="text-xs text-emerald-500 dark:text-emerald-500 mt-0.5 font-medium">Rentable</p>
                        </div>
                    ) : (
                        <div>
                            <div className={`text-2xl font-bold tabular-nums ${config.textColor}`}>
                                {runway.toFixed(1)}
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5 font-medium">meses</p>
                        </div>
                    )}
                </div>

            </div>

            {/* Bottom: Context */}
            <div className="relative z-10 mt-4 pt-3.5 border-t border-slate-700/50 dark:border-slate-700/50">
                <div className="flex items-center justify-between text-xs">
                    <div>
                        <span className="text-slate-500 dark:text-slate-500">Ingresos/mes: </span>
                        <span className="text-slate-300 dark:text-slate-300 font-bold tabular-nums">{formatMoney(revenue)}€</span>
                    </div>
                    <div>
                        <span className="text-slate-500 dark:text-slate-500">Gastos/mes: </span>
                        <span className="text-slate-300 dark:text-slate-300 font-bold tabular-nums">{formatMoney(expenses)}€</span>
                    </div>
                    <div>
                        <span className="text-slate-500 dark:text-slate-500">Burn: </span>
                        <span className={`font-bold tabular-nums ${monthlyBurn > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {monthlyBurn > 0 ? '-' : '+'}{formatMoney(Math.abs(monthlyBurn))}€
                        </span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default CashBalanceHero;
