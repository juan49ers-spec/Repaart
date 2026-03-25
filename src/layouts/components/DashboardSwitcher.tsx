import React, { Suspense, lazy } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import DashboardSkeleton from '../../components/ui/layout/DashboardSkeleton';

const AdminDashboard = lazy(() => import('../../features/admin/dashboard/AdminDashboard'));
const LazyFinanceHub = lazy(() => import('../../features/finance/FinanceHub').then(m => ({ default: m.FinanceHub })));

interface DashboardContext {
    selectedMonth: string;
    setSelectedMonth: (month: string) => void;
    handleAdminSelectFranchise: (franchiseId: string) => void;
}

const DashboardSwitcher: React.FC = () => {
    const { isAdmin, impersonatedFranchiseId } = useAuth();
    const context = useOutletContext<DashboardContext | null>();

    if (!context) return <DashboardSkeleton />;

    const {
        setSelectedMonth,
        handleAdminSelectFranchise,
        selectedMonth
    } = context;

    // --- ADMIN VIEW (Only if NOT impersonating) ---
    if (isAdmin && !impersonatedFranchiseId) {
        return (
            <Suspense fallback={<DashboardSkeleton />}>
                <AdminDashboard
                    onSelectFranchise={handleAdminSelectFranchise}
                    selectedMonth={selectedMonth}
                    onMonthChange={setSelectedMonth}
                />
            </Suspense>
        );
    }

    // --- FRANCHISE COCKPIT VIEW ---
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <LazyFinanceHub />
        </Suspense>
    );
};

export default DashboardSwitcher;
