import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useExport } from './hooks/useExport';
import { useAppStore } from './store/useAppStore';
import { lazyWithRetry } from './utils/lazyWithRetry';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardSkeleton from './components/ui/layout/DashboardSkeleton';
import Login from './features/auth/Login';
import { useFranchiseFinance } from './hooks/useFranchiseFinance';
import { useVersionCheck } from './hooks/useVersionCheck';
import { renderDashboardRoutes } from './routes/DashboardAppRoutes';
import { renderRiderRoutes } from './routes/RiderAppRoutes';

const OperationsPage = lazyWithRetry(() => import('./features/operations/OperationsPage'));
const Academy = lazyWithRetry(() => import('./features/academy/Academy'));
const AdminFranchiseView = lazyWithRetry(() => import('./features/admin/AdminFranchiseView'));
const KanbanBoard = lazyWithRetry(() => import('./features/admin/kanban/KanbanBoard'));
const RidersView = lazyWithRetry(() => import('./features/fleet/RidersView'));
const AcademyAdmin = lazyWithRetry(() => import('./features/academy/admin/AcademyAdmin'));

const RiderScheduleView = lazyWithRetry(() => import('./features/rider/schedule/RiderScheduleView'));
const RiderProfileView = lazyWithRetry(() => import('./features/rider/profile/RiderProfileView').then(module => ({ default: module.RiderProfileView })));
const RiderHomeView = lazyWithRetry(() => import('./features/rider/home/RiderHomeView'));
const RiderPersonalDataView = lazyWithRetry(() => import('./features/rider/profile/RiderPersonalDataView').then(module => ({ default: module.RiderPersonalDataView })));
const RiderNotificationsView = lazyWithRetry(() => import('./features/rider/profile/RiderNotificationsView').then(module => ({ default: module.RiderNotificationsView })));
const RiderSecurityView = lazyWithRetry(() => import('./features/rider/profile/RiderSecurityView').then(module => ({ default: module.RiderSecurityView })));
const RiderAvailabilityView = lazyWithRetry(() => import('./features/rider/profile/RiderAvailabilityView'));
const isDevEnvironment = import.meta.env.DEV;

function App() {
    const { user, loading: authLoading, roleConfig, logout, isAdmin, impersonatedFranchiseId } = useAuth();
    const { selectedMonth, setSelectedMonth } = useAppStore();

    useVersionCheck();

    const [targetFranchiseId, setTargetFranchiseId] = React.useState<string | null>(null);
    const [targetFranchiseName, setTargetFranchiseName] = React.useState<string | null>(null);

    const { exportCSV } = useExport();
    const isFranchise = roleConfig?.role === 'franchise' || !!impersonatedFranchiseId;

    const profileFranchiseId = roleConfig?.franchiseId;
    const profileName = roleConfig?.name;
    const userUid = user?.uid;

    const dataHookFranchiseId = ((isAdmin && targetFranchiseId)
        ? targetFranchiseId
        : (profileFranchiseId || profileName || userUid || null)) as string | null;

    useEffect(() => {
        if (!isDevEnvironment) return;

        if (user) {
            console.log(`[Identity] 👤 User: ${user.email}`);
            console.log(`[Identity] 🔑 Role: ${roleConfig?.role}`);
            console.log(`[Identity] 🏢 Profile Slug: ${profileFranchiseId}`);
            console.log(`[Identity] 🏷️  Profile Name: ${profileName}`);
            console.log(`[Identity] 🆔 UID: ${userUid}`);
            console.log(`[Identity] 🎯 Final Target ID: ${dataHookFranchiseId}`);
        }
    }, [user, roleConfig, dataHookFranchiseId, profileFranchiseId, profileName, userUid]);

    const { rawData: currentData, accounting, updateFinance: handleUpdate, isSaving: saving, analysis } = useFranchiseFinance({
        franchiseId: user ? (dataHookFranchiseId || undefined) : undefined,
        month: selectedMonth
    });

    const report = accounting?.report;

    const handleAdminSelectFranchise = (id: string, name: string) => {
        if (isDevEnvironment) {
            console.log(`[Admin] Selecting Franchise: ${name} (${id})`);
        }
        setTargetFranchiseId(id);
        setTargetFranchiseName(name);
    };

    const layoutProps = {
        user,
        isAdmin,
        isFranchise,
        viewMode: 'dashboard',
        setViewMode: () => { },
        franchiseView: 'cockpit',
        setFranchiseView: () => { },
        targetFranchiseName,
        onLogout: logout,
        onExport: () => exportCSV(report as import('./hooks/useExport').ReportData, selectedMonth, isAdmin && targetFranchiseName ? targetFranchiseName : 'REPAART'),
        sidebarData: currentData,
        onCalculate: handleUpdate,
        readOnly: false,
        saving,
        chatData: { report },
        isRider: roleConfig?.role === 'rider'
    };

    const outletContext = {
        user,
        franchiseId: dataHookFranchiseId,
        currentData,
        report,
        analysis,
        selectedMonth,
        setSelectedMonth,
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
                <Route
                    path="/login"
                    element={
                        !user
                            ? <Login />
                            : (['rider'].includes(user.role || '') ? <Navigate to="/rider/dashboard" replace /> : <Navigate to="/dashboard" replace />)
                    }
                />

                {renderDashboardRoutes({
                    user,
                    layoutProps: layoutProps as React.ComponentProps<typeof DashboardLayout>,
                    outletContext,
                    targetFranchiseId,
                    components: { OperationsPage, Academy, RidersView, KanbanBoard, AdminFranchiseView, AcademyAdmin },
                })}

                {renderRiderRoutes({
                    components: {
                        RiderHomeView,
                        RiderScheduleView,
                        RiderAvailabilityView,
                        RiderProfileView,
                        RiderPersonalDataView,
                        RiderNotificationsView,
                        RiderSecurityView,
                    },
                })}
            </Routes>
        </Suspense>
    );
}

export default App;
