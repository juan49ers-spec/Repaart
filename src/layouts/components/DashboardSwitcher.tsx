import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import AdminDashboard from '../../features/admin/dashboard/AdminDashboard';
import DashboardSkeleton from '../../ui/layout/DashboardSkeleton';
import FranchiseDashboard from '../../features/franchise/FranchiseDashboard';

interface DashboardContext {
    selectedMonth: string;
    setSelectedMonth: (month: string) => void;
    handleAdminSelectFranchise: (franchiseId: string) => void;
}

const DashboardSwitcher: React.FC = () => {
    const { isAdmin, impersonatedFranchiseId } = useAuth();
    // Context from DashboardLayout (via Outlet)
    const context = useOutletContext<DashboardContext | null>();

    // Safety check if context is null (though ProtectedRoute helps, this adds robustness)
    if (!context) return <DashboardSkeleton />;

    const {
        setSelectedMonth,
        handleAdminSelectFranchise,
        selectedMonth
    } = context;

    // --- ADMIN VIEW (Only if NOT impersonating) ---
    if (isAdmin && !impersonatedFranchiseId) {
        return (
            <AdminDashboard
                onSelectFranchise={handleAdminSelectFranchise}
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
            />
        );
    }

    // --- FRANCHISE COCKPIT VIEW ---
    // Extracting the Cockpit render logic from the old ViewSwitcher
    return (
        <FranchiseDashboard />
    );
};

export default DashboardSwitcher;
