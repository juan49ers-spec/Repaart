import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useExport } from './hooks/useExport';
import { useAppStore } from './store/useAppStore';
import { lazyWithRetry } from './utils/lazyWithRetry';

// Layout & Security
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './features/auth/ProtectedRoute';
import RequireRole from './layouts/RequireRole';
import DashboardSkeleton from './ui/layout/DashboardSkeleton';
import Login from './features/auth/Login';
import NotFound from './layouts/pages/NotFound';
import WeeklyScheduler from './features/operations/WeeklyScheduler';

// Page Components
import DashboardSwitcher from './layouts/components/DashboardSwitcher';
import UserProfile from './features/user/UserProfile';
import UserManagementPanel from './features/admin/users/UserManagementPanel';
import DevSandbox from './pages/DevSandbox';

// Other Panels (Mapped from legacy ViewSwitcher)
import SupportHub from './features/franchise/SupportHub';
import ResourcesPanel from './features/franchise/ResourcesPanel';
import AnnouncementSystem from './features/admin/AnnouncementSystem';
import AuditPanel from './features/admin/AuditPanel';
import TariffEditor from './features/admin/finance/TariffEditor';
import AdminSupportPanel from './features/admin/AdminSupportPanel';
import AdminResourcesPanel from './features/admin/AdminResourcesPanel';

// Lazy Load Heavy Components (Durability with lazyWithRetry)
// const FranchiseDashboard = lazyWithRetry(() => import('./features/franchise/FranchiseDashboard'));
const OperationsPage = lazyWithRetry(() => import('./features/operations/OperationsPage'));
const Academy = lazyWithRetry(() => import('./features/academy/Academy'));
const AdminFranchiseView = lazyWithRetry(() => import('./features/admin/AdminFranchiseView'));
const KanbanBoard = lazyWithRetry(() => import('./features/admin/kanban/KanbanBoard'));
const RidersView = lazyWithRetry(() => import('./features/fleet/RidersView'));

import { useFranchiseFinance } from './hooks/useFranchiseFinance';
import { useVersionCheck } from './hooks/useVersionCheck';
import { RiderLayout } from './layouts/RiderLayout';



const RiderScheduleView = lazyWithRetry(() => import('./features/rider/schedule/RiderScheduleView'));
const RiderProfileView = lazyWithRetry(() => import('./features/rider/profile/RiderProfileView').then(module => ({ default: module.RiderProfileView })));
const RiderHomeView = lazyWithRetry(() => import('./features/rider/home/RiderHomeView').then(module => ({ default: module.RiderHomeView })));

function App() {
    const { user, loading: authLoading, roleConfig, logout, isAdmin } = useAuth();

    // Global UI State from Store
    const {
        selectedMonth,
        setSelectedMonth
    } = useAppStore();

    // 🔄 AUTO-UPDATE CHECKER
    useVersionCheck();

    // Admin Selection State
    const [targetFranchiseId, setTargetFranchiseId] = React.useState<string | null>(null);
    const [targetFranchiseName, setTargetFranchiseName] = React.useState<string | null>(null);

    const { exportCSV } = useExport();

    // Helper flags
    const isFranchise = roleConfig?.role === 'franchise';

    // 🛠️ DEBUG & CACHE CLEANUP
    console.log("🚀 Running App Version: v4.1.0 - STABLE");

    // --- DATA FETCHING ---
    const dataHookFranchiseId = (isAdmin && targetFranchiseId)
        ? targetFranchiseId
        : (roleConfig?.franchiseId || user?.uid || null);

    const {
        rawData: currentData,
        accounting,
        updateFinance: handleUpdate,
        isSaving: saving,
        analysis
    } = useFranchiseFinance({
        franchiseId: user ? (dataHookFranchiseId || undefined) : undefined,
        month: selectedMonth
    });

    const report = accounting?.report;

    // Handle Admin Select
    const handleAdminSelectFranchise = (uid: string, name: string) => {
        setTargetFranchiseId(uid);
        setTargetFranchiseName(name);
    };

    // --- LAYOUT PROPS ---
    const layoutProps = {
        user, isAdmin, isFranchise,
        // Legacy props for compatibility if Header uses them
        viewMode: 'dashboard', setViewMode: () => { },
        franchiseView: 'cockpit', setFranchiseView: () => { },

        targetFranchiseName,
        // selectedMonth, -> Handled by Store
        // onMonthChange: setSelectedMonth, -> Handled by Store
        // viewPeriod, setViewPeriod, -> Handled by Store
        onLogout: logout,
        onExport: () => exportCSV(report as any, selectedMonth, isAdmin && targetFranchiseName ? targetFranchiseName : 'REPAART'),
        sidebarData: currentData, onCalculate: handleUpdate, readOnly: false,
        saving,
        // isChatOpen, setIsChatOpen, -> Handled by Store (DashboardLayout uses store)
        chatData: { report }
    };

    // Context to be exposed via Outlet
    const outletContext = {
        user,
        franchiseId: dataHookFranchiseId,
        currentData, report, analysis,
        selectedMonth, setSelectedMonth,
        handleAdminSelectFranchise,
        targetFranchiseId,
        setIsSidebarOpen: (_isOpen: boolean) => {
            // Placeholder, handled by Store now
        }
    };

    if (authLoading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><DashboardSkeleton /></div>;
    }

    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><DashboardSkeleton /></div>}>

            <Routes>
                {/* PUBLIC */}
                <Route path="/login" element={
                    !user ? <Login /> : (
                        ['rider', 'driver'].includes(user.role || '')
                            ? <Navigate to="/rider/dashboard" replace />
                            : <Navigate to="/dashboard" replace />
                    )
                } />

                {/* PROTECTED LAYOUT */}
                <Route path="/" element={
                    <ProtectedRoute>
                        {['rider', 'driver'].includes(user?.role || '') ? (
                            <Navigate to="/rider/dashboard" replace />
                        ) : (
                            <DashboardLayout {...layoutProps} outletContext={outletContext} />
                        )}
                    </ProtectedRoute>
                }>
                    <Route index element={
                        ['rider', 'driver'].includes(user?.role || '')
                            ? <Navigate to="/rider/dashboard" replace />
                            : (user?.role === 'admin' || user?.role === 'franchise'
                                ? <Navigate to="/dashboard" replace />
                                : <Navigate to="/profile" replace />)
                    } />

                    {/* CORE (Admin/Franchise Only) */}
                    <Route path="dashboard" element={
                        <RequireRole allowedRoles={['admin', 'franchise']}>
                            <DashboardSwitcher />
                        </RequireRole>
                    } />
                    <Route path="operations" element={
                        <RequireRole allowedRoles={['admin', 'franchise']}>
                            <OperationsPage />
                        </RequireRole>
                    } />
                    <Route path="academy" element={
                        <RequireRole allowedRoles={['admin', 'franchise']}>
                            <Academy />
                        </RequireRole>
                    } />
                    <Route path="fleet" element={
                        <RequireRole allowedRoles={['admin', 'franchise']}>
                            <RidersView />
                        </RequireRole>
                    } />
                    <Route path="profile" element={<UserProfile />} />
                    <Route path="demo/smart-input" element={<DevSandbox />} />

                    {/* FRANCHISE SPECIFIC */}
                    <Route path="support" element={
                        <RequireRole allowedRoles={['admin', 'franchise']}>
                            <SupportHub />
                        </RequireRole>
                    } />
                    <Route path="resources" element={
                        <RequireRole allowedRoles={['admin', 'franchise']}>
                            <ResourcesPanel />
                        </RequireRole>
                    } />

                    {/* ADMIN SPECIFIC */}
                    <Route path="admin/users" element={
                        <ProtectedRoute requireAdmin={true}>
                            <UserManagementPanel />
                        </ProtectedRoute>
                    } />

                    <Route path="admin/support" element={
                        <ProtectedRoute requireAdmin={true}>
                            <AdminSupportPanel />
                        </ProtectedRoute>
                    } />

                    <Route path="admin/resources" element={
                        <ProtectedRoute requireAdmin={true}>
                            <AdminResourcesPanel />
                        </ProtectedRoute>
                    } />

                    <Route path="admin/audit" element={
                        <ProtectedRoute requireAdmin={true}>
                            <AuditPanel />
                        </ProtectedRoute>
                    } />

                    <Route path="admin/tariffs" element={
                        <ProtectedRoute requireAdmin={true}>
                            <TariffEditor onClose={() => { }} />
                        </ProtectedRoute>
                    } />

                    <Route path="admin/communications" element={
                        <ProtectedRoute requireAdmin={true}>
                            <div className="p-5 md:p-8 space-y-6"><AnnouncementSystem /></div>
                        </ProtectedRoute>
                    } />

                    <Route path="admin/shifts" element={
                        <ProtectedRoute requireAdmin={true}>
                            <div className="p-5 md:p-8 space-y-6 h-[calc(100vh-64px)] overflow-hidden"><WeeklyScheduler franchiseId={targetFranchiseId || ''} readOnly={false} /></div>
                        </ProtectedRoute>
                    } />

                    <Route path="admin/kanban" element={
                        <ProtectedRoute requireAdmin={true}>
                            <div className="p-5 md:p-8 space-y-6 h-[calc(100vh-64px)] overflow-hidden">
                                <React.Suspense fallback={<DashboardSkeleton />}>
                                    <KanbanBoard />
                                </React.Suspense>
                            </div>
                        </ProtectedRoute>
                    } />

                    {/* ADMIN FINANCE DETAIL */}
                    <Route path="admin/franchise/:franchiseId" element={
                        <ProtectedRoute requireAdmin={true}>
                            <AdminFranchiseView />
                        </ProtectedRoute>
                    } />

                    {/* 404 for DashboardLayout */}
                    <Route path="*" element={<NotFound />} />
                </Route>

                {/* RIDER SPECIFIC APP (Independent from Admin Layout) */}
                <Route path="/rider" element={
                    <ProtectedRoute>
                        <RequireRole allowedRoles={['rider', 'driver', 'admin']}>
                            <RiderLayout />
                        </RequireRole>
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<RiderHomeView />} />
                    <Route path="schedule" element={<RiderScheduleView />} />
                    <Route path="profile" element={<RiderProfileView />} />
                </Route>
            </Routes>
            {/* <Seeder /> (Removed by User Request) */}
        </Suspense>
    );
}

export default App;
