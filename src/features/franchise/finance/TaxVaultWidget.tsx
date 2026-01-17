import React, { useState } from 'react';
import { formatMoney, MonthlyData } from '../../../lib/finance';
import { Landmark } from 'lucide-react';
import { Card } from '../../../ui/primitives/Card';
import { SectionHeader } from '../../../ui/primitives/SectionHeader';
import { StatValue } from '../../../ui/primitives/StatValue';
import { DataRow } from '../../../ui/primitives/DataRow';
import QuarterlyTaxModal from '../dashboard/widgets/QuarterlyTaxModal';

interface TaxVaultWidgetProps {
    taxes: {
        ivaRepercutido: number;
        ivaSoportado: number;
        ivaAPagar: number;
        irpfPago: number;
        totalReserve: number;
    } | null;
    minimal?: boolean;
    currentMonth?: string;
    historicalData?: MonthlyData[];
}

const TaxVaultWidget: React.FC<TaxVaultWidgetProps> = ({ taxes, currentMonth, historicalData }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!taxes) return null;

    const { ivaAPagar, irpfPago, totalReserve } = taxes;

    // Calculate payment dates based on the QUARTER of the selected month
    const getQuarterPaymentDates = () => {
        // Use currentMonth prop if available, otherwise fall back to current date
        const selectedDate = currentMonth ? new Date(currentMonth + '-01') : new Date();
        const selectedYear = selectedDate.getFullYear();
        const selectedMonthIndex = selectedDate.getMonth(); // 0-11

        // Determine quarter (0=Q1, 1=Q2, 2=Q3, 3=Q4)
        const quarterIndex = Math.floor(selectedMonthIndex / 3);

        // Payment dates by quarter
        // Q1 (Jan-Mar) -> Apr 20
        // Q2 (Apr-Jun) -> Jul 20  
        // Q3 (Jul-Sep) -> Oct 20
        // Q4 (Oct-Dec) -> Jan 20 IRPF, Jan 31 IVA (next year)

        let ivaDate: Date;
        let irpfDate: Date;

        if (quarterIndex === 0) { // Q1 -> April 20
            ivaDate = new Date(selectedYear, 3, 20);
            irpfDate = new Date(selectedYear, 3, 20);
        } else if (quarterIndex === 1) { // Q2 -> July 20
            ivaDate = new Date(selectedYear, 6, 20);
            irpfDate = new Date(selectedYear, 6, 20);
        } else if (quarterIndex === 2) { // Q3 -> October 20
            ivaDate = new Date(selectedYear, 9, 20);
            irpfDate = new Date(selectedYear, 9, 20);
        } else { // Q4 -> January next year
            ivaDate = new Date(selectedYear + 1, 0, 31); // Jan 31
            irpfDate = new Date(selectedYear + 1, 0, 20); // Jan 20
        }

        return { ivaDate, irpfDate };
    };

    const { ivaDate: nextIvaDate, irpfDate: nextIrpfDate } = getQuarterPaymentDates();

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <>
            <Card className="h-full flex flex-col relative group">
                <SectionHeader
                    title="Hucha Fiscal"
                    subtitle={null}
                    icon={<Landmark className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                />

                {/* Main Value */}
                <div className="mb-4">
                    <StatValue
                        value={formatMoney(totalReserve)}
                        unit="€"
                        description="Reserva Total"
                        size="xl"
                    />
                </div>

                {/* Compact Breakdown - 2 rows only */}
                <div className="flex-1 space-y-2">
                    <DataRow
                        label="IVA"
                        value={`${formatMoney(ivaAPagar)}€`}
                        color="bg-indigo-500"
                        secondaryText={`📅 ${formatDate(nextIvaDate)}`}
                    />
                    <DataRow
                        label="IRPF"
                        value={`${formatMoney(irpfPago)}€`}
                        color="bg-amber-500"
                        secondaryText={`📅 ${formatDate(nextIrpfDate)}`}
                    />
                </div>

                {/* Quarterly Detail Button */}
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
                            <div className="mt-3 space-y-1">
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="w-full py-2 px-3 rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm font-semibold transition-all hover:bg-red-100 dark:hover:bg-red-900/40 animate-pulse"
                                >
                                    🚨 ¡Mes de Pago Trimestral!
                                </button>
                                <p className="text-center text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                    A pagar: {quarterLabels[quarterInfo.quarterIndex]} {quarterInfo.year}
                                </p>
                            </div>
                        );
                    }

                    return (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-3 w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs font-medium transition-all hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:border-indigo-300"
                        >
                            📊 Acumulado Trimestre Actual
                        </button>
                    );
                })()}
            </Card>

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
                        currentMonth={targetMonthStr}
                        historicalData={historicalData}
                        currentMonthTaxes={showPaymentMode ? undefined : { ivaAPagar, irpfPago }}
                        isPaymentMode={showPaymentMode}
                    />
                );
            })()}
        </>
    );
};

export default TaxVaultWidget;
