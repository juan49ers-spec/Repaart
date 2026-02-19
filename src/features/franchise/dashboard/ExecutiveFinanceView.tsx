import React, { useState } from 'react';
import {
    Banknote,
    TrendingUp,
    Activity,
    PieChart,
    BarChart3,
    Table as TableIcon,
    Download,
    ArrowUpRight,
    ArrowDownRight,
    Calendar
} from 'lucide-react';
import { formatMoney, FinancialReport } from '../../../lib/finance';
import { TaxCalculations } from '../../../hooks/useTaxCalculations';
import PnLWaterfallChart from './widgets/PnLWaterfallChart';
import TaxVaultWidget from '../finance/TaxVaultWidget';
import { TrendItem } from '../../../types/finance';
import ErrorBoundary from '../../../components/ui/feedback/ErrorBoundary';

interface ExecutiveFinanceViewProps {
    report: FinancialReport | null;
    taxes: TaxCalculations | null;
    trendData?: TrendItem[];
    previousReport?: FinancialReport | null; // For MoM comparison
    isRealTime: boolean;
    lastUpdated?: Date;
    effectiveMonth: string;
    onMonthChange: (month: string) => void;
    suggestedInvoicedIncome?: number;
}

const ExecutiveFinanceView: React.FC<ExecutiveFinanceViewProps> = ({
    report,
    taxes,
    trendData,
    isRealTime,
    lastUpdated,
    effectiveMonth,
    onMonthChange,
    suggestedInvoicedIncome = 0
}) => {
    const [viewMode, setViewMode] = useState<'visual' | 'table'>('visual');

    // Safe accessors
    const revenue = report?.revenue || 0;
    const netProfit = report?.netProfit || 0;
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    // Tax Data
    const taxLiability = taxes?.totalTaxLiability || 0;
    const safeToSpend = taxes?.safeToSpend || 0;

    // Suggested Income vs Real Revenue
    const incomeGap = suggestedInvoicedIncome - (report?.revenue || 0);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 p-6 space-y-8">

            {/* 1. EXECUTIVE HEADER (The "Ticker") */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                            FINANCE <span className="text-ruby-600">OS</span>
                        </h1>
                        {isRealTime && (
                            <span className="flex h-2.5 w-2.5 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="text-sm text-slate-500 font-mono uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(effectiveMonth + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                            {lastUpdated && ` • LIVE SYNC ${lastUpdated.toLocaleTimeString()}`}
                        </p>

                        {/* Month Selector Trigger */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                            <input
                                type="month"
                                value={effectiveMonth}
                                onChange={(e) => onMonthChange(e.target.value)}
                                className="bg-transparent text-xs font-bold px-3 py-1.5 outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
                                title="Seleccionar mes de análisis"
                                aria-label="Seleccionar mes de análisis"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Net Profit</p>
                        <div className="text-3xl font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {formatMoney(netProfit)}€
                        </div>
                    </div>
                    <div className="text-right pl-6 border-l border-slate-200 dark:border-slate-800">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Margin</p>
                        <div className={`text-3xl font-mono font-bold tabular-nums ${margin >= 15 ? 'text-emerald-600' : margin >= 5 ? 'text-amber-500' : 'text-rose-500'}`}>
                            {margin.toFixed(1)}%
                        </div>
                    </div>
                </div>
            </header>

            {/* 2. KPI GRID (The "Pulse") */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPITile
                    label="Ingresos (Gross)"
                    value={revenue}
                    subValue={suggestedInvoicedIncome > 0 ? `Facturado: ${formatMoney(suggestedInvoicedIncome)}€` : 'vs. Mes Anterior'}
                    trend={revenue > 0 && incomeGap !== 0 ? (incomeGap / revenue) * 100 : undefined}
                    icon={<Banknote className="w-4 h-4" />}
                />
                <KPITile
                    label="Impuestos (Est.)"
                    value={taxLiability}
                    subValue="IVA + IRPF"
                    status="warning"
                    icon={<Activity className="w-4 h-4" />}
                />
                <KPITile
                    label="Profit (Safe)"
                    value={safeToSpend}
                    subValue="Post-Tax Cash"
                    status="success"
                    icon={<Banknote className="w-4 h-4" />}
                />
                <KPITile
                    label="Runway / Cash"
                    value={report?.metrics?.activeRiders || 0}
                    isCurrency={false}
                    suffix=" Riders"
                    subValue="Active Fleet"
                    status="neutral"
                    icon={<TrendingUp className="w-4 h-4" />}
                />
            </div>

            {/* 3. MAIN VISUALIZATION STAGE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[500px]">
                {/* P&L Waterfall / Chart Area */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-slate-400" />
                            Estructura de Costes (Waterfall)
                        </h3>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('visual')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'visual' ? 'bg-white dark:bg-slate-700 shadow-sm text-ruby-600' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Vista Visual"
                            >
                                <BarChart3 className="w-4 h-4" aria-hidden="true" />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-ruby-600' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Vista Tabla"
                            >
                                <TableIcon className="w-4 h-4" aria-hidden="true" />
                            </button>
                        </div>
                    </div>

                    {/* Waterfall Chart */}
                    <div className="h-[400px] w-full">
                        {viewMode === 'visual' ? (
                            <ErrorBoundary>
                                <PnLWaterfallChart
                                    revenue={revenue}
                                    variableCosts={report?.variable.total || 0}
                                    fixedCosts={report?.fixed.total || 0}
                                    taxes={taxLiability}
                                    netProfit={netProfit}
                                />
                            </ErrorBoundary>
                        ) : (
                            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-slate-900 h-full overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="text-left pb-2">Concepto</th>
                                            <th className="text-right pb-2">Monto</th>
                                            <th className="text-right pb-2">%</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                                        <tr>
                                            <td className="py-3 font-medium">Ingresos Totales</td>
                                            <td className="py-3 text-right font-mono">{formatMoney(revenue)}€</td>
                                            <td className="py-3 text-right text-slate-400">100%</td>
                                        </tr>
                                        <tr>
                                            <td className="py-3 font-medium text-amber-600">Costes Variables</td>
                                            <td className="py-3 text-right font-mono">-{formatMoney(report?.variable.total || 0)}€</td>
                                            <td className="py-3 text-right text-slate-400">{revenue > 0 ? (((report?.variable.total || 0) / revenue) * 100).toFixed(1) : 0}%</td>
                                        </tr>
                                        <tr>
                                            <td className="py-3 font-medium text-indigo-600">Costes Fijos</td>
                                            <td className="py-3 text-right font-mono">-{formatMoney(report?.fixed.total || 0)}€</td>
                                            <td className="py-3 text-right text-slate-400">{revenue > 0 ? (((report?.fixed.total || 0) / revenue) * 100).toFixed(1) : 0}%</td>
                                        </tr>
                                        <tr>
                                            <td className="py-3 font-medium text-rose-500">Estimación Impuestos</td>
                                            <td className="py-3 text-right font-mono">-{formatMoney(taxLiability)}€</td>
                                            <td className="py-3 text-right text-slate-400">{revenue > 0 ? ((taxLiability / revenue) * 100).toFixed(1) : 0}%</td>
                                        </tr>
                                        <tr className="bg-slate-100/50 dark:bg-slate-800/50">
                                            <td className="py-3 font-bold">Resultado Neto</td>
                                            <td className="py-3 text-right font-mono font-bold text-emerald-600">{formatMoney(netProfit)}€</td>
                                            <td className="py-3 text-right font-bold">{margin.toFixed(1)}%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Vertical Context / Breakdown */}
                <div className="space-y-6 flex flex-col">
                    {/* RESTORED: TaxVaultWidget */}
                    <div className="h-[320px]">
                        <TaxVaultWidget
                            taxes={taxes}
                            currentMonth={effectiveMonth}
                            historicalData={trendData as any}
                        />
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col flex-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-slate-400" />
                            Distribución de Gasto
                        </h3>

                        <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[400px]">
                            {report?.breakdown.map((item, idx) => (
                                <div key={idx} className="group">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                                            {item.name}
                                        </span>
                                        <span className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">
                                            {formatMoney(item.value)}€
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${item.type === 'variable' ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                            style={{ width: revenue > 0 ? `${(item.value / revenue) * 100}%` : '0%' }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 text-right mt-0.5 font-mono">
                                        {revenue > 0 ? ((item.value / revenue) * 100).toFixed(1) : 0}% of Revenue
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                            <button
                                className="w-full py-3 flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl transition-all font-medium text-sm"
                                title="Exportar Informe PDF"
                            >
                                <Download className="w-4 h-4" aria-hidden="true" />
                                Exportar Informe PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-component: Impactful KPI Tile
interface KPITileProps {
    label: string;
    value: number;
    subValue?: string;
    trend?: number;
    status?: 'success' | 'warning' | 'neutral';
    icon: React.ReactNode;
    isCurrency?: boolean;
    suffix?: string;
}

const KPITile: React.FC<KPITileProps> = ({ label, value, subValue, trend, status = 'neutral', icon, isCurrency = true, suffix = '' }) => {
    const statusColor =
        status === 'success' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' :
            status === 'warning' ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';

    const valueColor =
        status === 'success' ? 'text-emerald-700 dark:text-emerald-400' :
            status === 'warning' ? 'text-slate-900 dark:text-white' : // Warning doesn't mean bad value, just attention
                'text-slate-900 dark:text-white';

    return (
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${statusColor}`}>
                    {icon}
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {trend > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                        {Math.abs(trend).toFixed(1)}%
                    </div>
                )}
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                <h3 className={`text-2xl font-mono font-bold ${valueColor} tracking-tight`}>
                    {isCurrency ? formatMoney(value) + '€' : value + suffix}
                </h3>
                {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
            </div>
        </div>
    );
};

export default ExecutiveFinanceView;
