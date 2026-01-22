import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

// Components
import DashboardSkeleton from '../../components/ui/layout/DashboardSkeleton';
import FranchiseDashboardView, { BreakdownItem, DashboardTrendItem } from './FranchiseDashboardView';

import { AuthUser, useAuth } from '../../context/AuthContext';
import { useFranchiseFinance } from '../../hooks/useFranchiseFinance';

// TYPE DEFINITIONS
interface DashboardContextType {
    user: AuthUser | null;
    franchiseId?: string;
    selectedMonth: string;
    handleUpdate?: () => Promise<void>;
    setSelectedMonth: (month: string) => void;
}

// PROPS for Admin usage (Optional)
interface FranchiseDashboardProps {
    franchiseId?: string;
    readOnly?: boolean;
}

const FranchiseDashboard: React.FC<FranchiseDashboardProps> = ({ franchiseId: propId, readOnly = false }) => {
    // Try to get context, but don't fail if it's missing (Admin usage)
    const context = useOutletContext<DashboardContextType | null>();

    // Check if admin is impersonating - force readOnly in that case
    const { impersonatedFranchiseId } = useAuth();
    const isImpersonating = !!impersonatedFranchiseId;
    const effectiveReadOnly = readOnly || isImpersonating;

    // Derive values
    const selectedMonth = context?.selectedMonth || new Date().toISOString().slice(0, 7);
    const user = context?.user || null;
    // IMPORTANT: When impersonating, use impersonatedFranchiseId directly to ensure correct data loading
    const activeFranchiseId = impersonatedFranchiseId || propId || context?.franchiseId || user?.franchiseId || user?.uid;

    // Helper for Admin Date Switch
    const [localMonth, setLocalMonth] = useState(selectedMonth);
    const effectiveMonth = propId ? localMonth : selectedMonth;
    const effectiveSetMonth = propId ? setLocalMonth : (context?.setSelectedMonth || (() => { }));

    // --- UNIFIED FINANCE HOOK ---
    const {
        accounting,
        rawData,
        trendData,
        loading,
        updateFinance
    } = useFranchiseFinance({
        franchiseId: activeFranchiseId || '', // Pass empty string if undefined to be safe, hook should handle it
        month: effectiveMonth
    });

    const { report, revenue, orders } = accounting;
    const handleUpdate = updateFinance;

    // --- UI STATE (Passed to View) ---
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
    const [isHistoryView, setIsHistoryView] = useState(false);
    const [drillDown, setDrillDown] = useState<string | null>(null);
    const [isLegendOpen, setIsLegendOpen] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

    // If no props and no context, we are lost (Check AFTER hooks)
    if (!propId && !context) return <DashboardSkeleton />;

    if (loading) return <DashboardSkeleton />;

    // --- METRICS CALCULATION (Container Logic) ---
    const totalExpenses = report?.totalExpenses || 0;

    // Cost Per Hour
    const totalHours = Number(rawData?.totalHours || 0);
    // costPerHour removed


    // Trends
    const previousMonthData = trendData.length > 1 ? trendData[trendData.length - 2] : null;
    const revenueTrend = previousMonthData && previousMonthData.revenue > 0
        ? ((revenue - previousMonthData.revenue) / previousMonthData.revenue) * 100
        : 0;

    // Expense Breakdown Preparation
    // Using centralized breakdown from report (lib/finance) to ensure consistency with Monthly Closing
    const fullExpenseBreakdown: BreakdownItem[] = (report?.breakdown || [])
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value)
        .map((item, index) => ({
            label: item.name,
            amount: item.value,
            color: ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'][index % 8]
        }));

    // Historical Chart Data formatting
    const formattedTrendData: DashboardTrendItem[] = trendData.map((d: any) => ({
        month: d.name || d.monthName || d.month || 'Mes',
        fullDate: d.month, // ISO format for logic (YYYY-MM)
        revenue: d.revenue || d.income || 0,
        expenses: d.expenses || d.totalExpenses || 0
    }));

    return (
        <FranchiseDashboardView
            franchiseId={activeFranchiseId}
            effectiveMonth={effectiveMonth}
            readOnly={effectiveReadOnly}

            // Metrics
            revenue={revenue}
            orders={orders}
            totalExpenses={totalExpenses}
            totalHours={totalHours}
            revenueTrend={revenueTrend}

            // Data
            report={report}
            rawData={rawData}
            trendData={trendData}
            formattedTrendData={formattedTrendData}
            fullExpenseBreakdown={fullExpenseBreakdown}

            // State
            isWizardOpen={isWizardOpen}
            setIsWizardOpen={setIsWizardOpen}
            isSimulatorOpen={isSimulatorOpen}
            setIsSimulatorOpen={setIsSimulatorOpen}
            isHistoryView={isHistoryView}
            setIsHistoryView={setIsHistoryView}
            drillDown={drillDown}
            setDrillDown={setDrillDown}
            isLegendOpen={isLegendOpen}
            setIsLegendOpen={setIsLegendOpen}
            showGuide={showGuide}
            setShowGuide={setShowGuide}

            // Handlers
            onMonthChange={effectiveSetMonth}
            onUpdateFinance={handleUpdate}
        />
    );
};

export default FranchiseDashboard;
