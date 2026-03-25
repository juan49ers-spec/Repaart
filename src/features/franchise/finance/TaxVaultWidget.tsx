import React, { useState } from 'react';
import { formatMoney, MonthlyData } from '../../../lib/finance';
import { Landmark, Maximize2, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { TaxCalculations } from '../../../hooks/useTaxCalculations';
import QuarterlyTaxModal from '../dashboard/widgets/QuarterlyTaxModal';
import { Invoice } from '../../../types/invoicing';

interface TaxVaultWidgetProps {
    taxes: TaxCalculations | null;
    minimal?: boolean;
    currentMonth?: string;
    historicalData?: MonthlyData[];
    currentInvoices?: Invoice[];
}

const TaxVaultWidget: React.FC<TaxVaultWidgetProps> = ({ taxes, currentMonth, historicalData, currentInvoices: _currentInvoices }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [invoicesExpanded, setInvoicesExpanded] = useState(false);

    if (!taxes) return null;

    const { ivaPayable, irpfPayable, totalTaxLiability, ivaCollected, ivaDeductible } = taxes;

    return (
        <div className="workstation-card workstation-scanline p-5 h-full flex flex-col justify-between group/card transition-all mechanical-press overflow-hidden">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg">
                        <Landmark className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
                            Hucha Fiscal
                        </h3>
                    </div>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:text-indigo-600 transition-colors"
                    title="Ver detalle trimestral"
                >
                    <Maximize2 className="w-3 h-3" />
                </button>
            </div>

            {/* MAIN VAULT DISPLAY */}
            <div>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
                        {formatMoney(totalTaxLiability)}€
                    </span>
                    <span className="text-xs font-medium text-slate-400 ml-1">reserva total</span>
                </div>
            </div>

            {/* HIGH-DENSITY PROGRESS TRACKING */}
            <div className="space-y-4 flex-1">
                <div className="group/bar">
                    <div 
                        className={`flex justify-between items-center mb-1 px-1 cursor-pointer transition-colors rounded-lg p-1.5 -mx-1.5 ${invoicesExpanded ? 'bg-indigo-50/80 dark:bg-indigo-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                        onClick={() => setInvoicesExpanded(!invoicesExpanded)}
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">IVA (Rep - Sop)</span>
                            <div className="bg-white dark:bg-slate-800 rounded p-0.5 border border-slate-200 dark:border-slate-700">
                                {invoicesExpanded ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
                            </div>
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-white tabular-nums">{formatMoney(ivaPayable)}€</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                            {...({ style: { width: `${Math.min((ivaPayable / (totalTaxLiability || 1)) * 100, 100)}%` } })}
                        />
                    </div>
                    {/* EXPANDABLE INVOICES SECTION */}
                    {invoicesExpanded && (
                        <div className="mt-2 bg-white dark:bg-slate-900/50 rounded-xl border border-indigo-100 dark:border-indigo-900/50 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-1">
                            {/* Breakdown Header */}
                            <div className="p-3 border-b border-indigo-50 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-900/10 space-y-1.5">
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-slate-500 font-medium">IVA Repercutido (Ventas)</span>
                                    <span className="text-slate-700 dark:text-slate-300 tabular-nums font-semibold">{formatMoney(ivaCollected)}€</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-slate-500 font-medium">IVA Soportado (Gastos)</span>
                                    <span className="text-rose-600 dark:text-rose-400 tabular-nums font-semibold">-{formatMoney(ivaDeductible)}€</span>
                                </div>
                                <div className="pt-1.5 mt-1 border-t border-indigo-100/50 dark:border-indigo-800/50 flex justify-between items-center text-xs">
                                    <span className="font-bold text-indigo-700 dark:text-indigo-400">A pagar / (A compensar)</span>
                                    <span className={`tabular-nums font-bold ${ivaPayable > 0 ? 'text-indigo-700 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {formatMoney(ivaPayable)}€
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="group/bar">
                    <div className="flex justify-between items-end mb-1 px-1">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">IRPF</span>
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">{formatMoney(irpfPayable)}€</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                            {...({ style: { width: `${Math.min((irpfPayable / (totalTaxLiability || 1)) * 100, 100)}%` } })}
                        />
                    </div>
                </div>
            </div>

            {/* Quarterly Detail Button */}
            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5">
                {(() => {
                    const selectedDate = currentMonth ? new Date(currentMonth + '-01') : new Date();
                    const selectedYear = selectedDate.getFullYear();
                    const monthIndex = selectedDate.getMonth();
                    const today = new Date();
                    const currentDay = today.getDate();

                    // Payment months and their deadlines
                    // Jan: IRPF by 20, IVA by 31
                    // Apr, Jul, Oct: Both by 20
                    const paymentDeadlines: Record<number, number> = {
                        0: 31, // January (latest deadline is 31 for IVA)
                        3: 20, // April
                        6: 20, // July
                        9: 20  // October
                    };

                    const isPaymentMonthIndex = [0, 3, 6, 9].includes(monthIndex);
                    const deadline = paymentDeadlines[monthIndex] || 20;

                    // Only show payment mode if we're viewing the CURRENT month AND before deadline
                    const isViewingCurrentMonth = currentMonth === today.toISOString().slice(0, 7);
                    const isBeforeDeadline = currentDay <= deadline;
                    const showPaymentMode = isPaymentMonthIndex && isViewingCurrentMonth && isBeforeDeadline;

                    // Calculate which quarter to show in modal
                    // Payment mode: show PREVIOUS quarter (the one being paid)
                    // Accumulation mode: show CURRENT quarter
                    const getQuarterToShow = () => {
                        if (showPaymentMode) {
                            // Previous quarter
                            if (monthIndex === 0) { // Jan paying Q4
                                return { year: selectedYear - 1, quarterIndex: 3 };
                            } else if (monthIndex === 3) { // Apr paying Q1
                                return { year: selectedYear, quarterIndex: 0 };
                            } else if (monthIndex === 6) { // Jul paying Q2
                                return { year: selectedYear, quarterIndex: 1 };
                            } else { // Oct paying Q3
                                return { year: selectedYear, quarterIndex: 2 };
                            }
                        } else {
                            // Current quarter
                            return { year: selectedYear, quarterIndex: Math.floor(monthIndex / 3) };
                        }
                    };

                    const quarterInfo = getQuarterToShow();

                    // Labels for display
                    const quarterLabels: Record<number, string> = {
                        0: 'Ene - Feb - Mar',
                        1: 'Abr - May - Jun',
                        2: 'Jul - Ago - Sep',
                        3: 'Oct - Nov - Dic'
                    };

                    if (showPaymentMode) {
                        return (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full py-2 px-3 rounded-lg border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wide transition-all hover:bg-rose-100 dark:hover:bg-rose-900/20 flex items-center justify-center gap-2 animate-pulse"
                            >
                                <Activity className="w-3.5 h-3.5" />
                                <span>¡Mes de Pago! ({quarterLabels[quarterInfo.quarterIndex]})</span>
                            </button>
                        );
                    }

                    return (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wide transition-all hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:border-indigo-300"
                        >
                            Acumulado Trimestre Actual
                        </button>
                    );
                })()}
            </div>
            {isModalOpen && currentMonth && historicalData && (() => {
                // Recalculate quarter info for modal
                const selectedDate = new Date(currentMonth + '-01');
                const selectedYear = selectedDate.getFullYear();
                const monthIndex = selectedDate.getMonth();
                const today = new Date();
                const currentDay = today.getDate();

                const paymentDeadlines: Record<number, number> = { 0: 31, 3: 20, 6: 20, 9: 20 };
                const isPaymentMonthIndex = [0, 3, 6, 9].includes(monthIndex);
                const deadline = paymentDeadlines[monthIndex] || 20;
                const isViewingCurrentMonth = currentMonth === today.toISOString().slice(0, 7);
                const isBeforeDeadline = currentDay <= deadline;
                const showPaymentMode = isPaymentMonthIndex && isViewingCurrentMonth && isBeforeDeadline;

                let targetYear = selectedYear;
                let targetQuarterIndex = Math.floor(monthIndex / 3);

                if (showPaymentMode) {
                    if (monthIndex === 0) { targetYear = selectedYear - 1; targetQuarterIndex = 3; }
                    else if (monthIndex === 3) { targetQuarterIndex = 0; }
                    else if (monthIndex === 6) { targetQuarterIndex = 1; }
                    else { targetQuarterIndex = 2; }
                }

                // Create a "fake" currentMonth for the modal that points to the target quarter
                const targetMonthStr = `${targetYear}-${String(targetQuarterIndex * 3 + 1).padStart(2, '0')}`;

                return (
                    <QuarterlyTaxModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        currentMonth={showPaymentMode ? targetMonthStr : currentMonth}
                        historicalData={historicalData}
                        currentMonthTaxes={showPaymentMode ? undefined : { ivaAPagar: ivaPayable, irpfPago: irpfPayable }}
                        isPaymentMode={showPaymentMode}
                    />
                );
            })()}
        </div>
    );
};

export default TaxVaultWidget;
