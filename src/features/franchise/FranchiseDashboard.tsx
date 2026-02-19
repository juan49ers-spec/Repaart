import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import { useTaxCalculations } from '../../hooks/useTaxCalculations';
import { useFranchiseFinance } from '../../hooks/useFranchiseFinance';
import { useInvoicing } from '../../hooks/useInvoicing';

// Components
import FranchiseDashboardView from './FranchiseDashboardView';
import FinanceAdvisorChat from './finance/FinanceAdvisorChat';
import type { TrendItem } from '../../types/finance';
import { BreakdownItem, DashboardTrendItem } from './FranchiseDashboardView';
import { InvoiceDTO } from '../../types/invoicing';

interface TimestampLike {
    _seconds?: number;
    toDate?: () => Date;
}

interface FranchiseDashboardProps {
    franchiseId?: string;
}

// --- UNIFIED FINANCE HOOK ---
const FranchiseDashboard: React.FC<FranchiseDashboardProps> = ({ franchiseId: propFranchiseId }) => {
    // Context
    const {
        franchiseId: contextFranchiseId,
        report: contextReport,
        selectedMonth: contextMonth,
        setSelectedMonth
    } = useOutletContext<any>() || {};

    const activeFranchiseId = propFranchiseId || contextFranchiseId;

    // State
    const [effectiveMonth, setMonthState] = useState(format(new Date(), 'yyyy-MM'));
    const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
    const [monthlyInvoicedAmount, setMonthlyInvoicedAmount] = useState(0);
    const [invoicedIva, setInvoicedIva] = useState(0);

    // Tactical UI States (Restored)
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
    const [isHistoryView, setIsHistoryView] = useState(false);
    const [drillDown, setDrillDown] = useState<string | null>(null);
    const [isLegendOpen, setIsLegendOpen] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

    // Sync state with context if available
    const displayedMonth = contextMonth || effectiveMonth;
    const setEffectiveMonth = setSelectedMonth || setMonthState;

    const {
        accounting,
        rawData,
        trendData,
        loading,
        isRealTime,
        updateFinance,
        operations
    } = useFranchiseFinance({
        franchiseId: activeFranchiseId || '',
        month: displayedMonth
    });

    const report = contextReport || accounting?.report;
    const revenue = accounting?.revenue || 0;
    const orders = accounting?.orders || 0;

    const taxes = useTaxCalculations(report, invoicedIva);
    const { getInvoices } = useInvoicing();

    // Invoicing Automation Effect
    useEffect(() => {
        const fetchInvoices = async () => {
            if (activeFranchiseId) {
                try {
                    const invoices: InvoiceDTO[] = await getInvoices(activeFranchiseId);
                    const currentMonthInvoices = invoices.filter((inv: InvoiceDTO) => {
                        let date: Date;
                        const issueDate = inv.issueDate as unknown as TimestampLike;

                        if (issueDate && typeof issueDate === 'object' && issueDate._seconds) {
                            date = new Date(issueDate._seconds * 1000);
                        } else if (issueDate && typeof issueDate.toDate === 'function') {
                            date = issueDate.toDate();
                        } else {
                            date = new Date(inv.issueDate as unknown as string);
                        }

                        return date.toISOString().slice(0, 7) === effectiveMonth && inv.status === 'issued';
                    });

                    const total = currentMonthInvoices.reduce((sum: number, inv: InvoiceDTO) => sum + (inv.subtotal || 0), 0);
                    const totalIva = currentMonthInvoices.reduce((sum: number, inv: InvoiceDTO) => sum + ((inv.total || 0) - (inv.subtotal || 0)), 0);

                    setMonthlyInvoicedAmount(total);
                    setInvoicedIva(totalIva);
                } catch (error) {
                    console.error("Error fetching invoices for automation:", error);
                }
            }
        };
        fetchInvoices();
    }, [activeFranchiseId, effectiveMonth, getInvoices]);

    const totalExpenses = (report?.variable.total || 0) + (report?.fixed.total || 0);

    // Expense Breakdown Preparation
    const fullExpenseBreakdown: BreakdownItem[] = useMemo(() => (report?.breakdown || [])
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value)
        .map((item, index) => ({
            label: item.name,
            amount: item.value,
            color: ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'][index % 8]
        })), [report?.breakdown]);

    // Historical Chart Data formatting
    const formattedTrendData: DashboardTrendItem[] = useMemo(() => trendData.map((d: TrendItem) => ({
        month: d.name || d.month || 'Mes',
        fullDate: d.month,
        revenue: d.revenue || d.income || 0,
        expenses: d.expenses || 0
    })), [trendData]);

    // Helper for Firestore Timestamp
    const formatLastUpdated = (ts: unknown): Date | undefined => {
        if (!ts) return undefined;
        const t = ts as TimestampLike;
        if (t.toDate) return t.toDate();
        if (t._seconds) return new Date(t._seconds * 1000);
        return new Date(ts as string);
    };

    // Trending calculation
    const prevRevenue = trendData.length > 1 ? trendData[trendData.length - 2].revenue || 0 : 0;
    const revenueTrend = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;

    return (
        <>
            <FranchiseDashboardView
                franchiseId={activeFranchiseId}
                effectiveMonth={displayedMonth}
                readOnly={false}
                isRealTime={isRealTime}
                lastUpdated={formatLastUpdated(rawData?.lastUpdated)}
                revenue={revenue}
                orders={orders}
                totalExpenses={totalExpenses}
                totalHours={operations?.totalOperationalHours || 0}
                revenueTrend={revenueTrend}
                report={report}
                rawData={rawData}
                trendData={trendData}
                formattedTrendData={formattedTrendData}
                fullExpenseBreakdown={fullExpenseBreakdown}
                taxes={{
                    ...taxes,
                    suggestedInvoicedIncome: monthlyInvoicedAmount
                } as any}
                isWizardOpen={isWizardOpen}
                setIsWizardOpen={setIsWizardOpen}
                isSimulatorOpen={isSimulatorOpen}
                setIsSimulatorOpen={setIsSimulatorOpen}
                isAdvisorOpen={isAdvisorOpen}
                setIsAdvisorOpen={setIsAdvisorOpen}
                isHistoryView={isHistoryView}
                setIsHistoryView={setIsHistoryView}
                drillDown={drillDown}
                setDrillDown={setDrillDown}
                isLegendOpen={isLegendOpen}
                setIsLegendOpen={setIsLegendOpen}
                showGuide={showGuide}
                setShowGuide={setShowGuide}
                onMonthChange={setEffectiveMonth}
                onUpdateFinance={updateFinance}
                monthlyInvoicedAmount={monthlyInvoicedAmount}
            />

            {/* AI Finance Advisor Chat */}
            {!loading && report && (
                <FinanceAdvisorChat
                    financialData={{
                        revenue: revenue || 0,
                        expenses: totalExpenses || 0,
                        netProfit: report.netProfit || 0,
                        orders: orders || 0,
                        margin: report.metrics?.profitMargin || 0,
                        month: displayedMonth,
                        breakdown: fullExpenseBreakdown,
                        metrics: report.metrics
                    }}
                    trendData={formattedTrendData}
                    month={displayedMonth}
                    isOpen={isAdvisorOpen}
                    onClose={() => setIsAdvisorOpen(false)}
                />
            )}
        </>
    );
};

export default FranchiseDashboard;
