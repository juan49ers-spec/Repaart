import React, { Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useExport } from './hooks/useExport';
import { useAppStore } from './store/useAppStore';
import { lazyWithRetry } from './utils/lazyWithRetry';

// Layout & Security
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './features/auth/ProtectedRoute';
import RequireRole from './layouts/RequireRole';
import RequireActiveStatus from './layouts/RequireActiveStatus';
import DashboardSkeleton from './components/ui/layout/DashboardSkeleton';
import NotFound from './layouts/pages/NotFound';
import DebugFirestore from './components/debug/DebugFirestore';
// Page Components
const DashboardSwitcher = lazyWithRetry(() => import('./layouts/components/DashboardSwitcher'));
import UserProfile from './features/user/UserProfile';

const Login = lazyWithRetry(() => import('./features/auth/Login'));
const NotificationsPage = lazyWithRetry(() => import('./features/user/NotificationsPage'));

const WeeklyScheduler = lazyWithRetry(() => import('./features/operations/WeeklyScheduler'));
const AdminFlyderDashboard = lazyWithRetry(() => import('./features/admin/flyder/AdminFlyderDashboard'));
const UserManagementPanel = lazyWithRetry(() => import('./features/admin/users/UserManagementPanel'));
const AdminBillingDashboard = lazyWithRetry(() => import('./features/admin/billing/AdminBillingDashboard'));
import DevSandbox from './pages/DevSandbox';

// Other Panels (Mapped from legacy ViewSwitcher)
const SupportHub = lazyWithRetry(() => import('./features/franchise/SupportHub'));
const ResourcesPanel = lazyWithRetry(() => import('./features/franchise/ResourcesPanel'));
const AnnouncementSystem = lazyWithRetry(() => import('./features/admin/AnnouncementSystem'));
const AuditPanel = lazyWithRetry(() => import('./features/admin/AuditPanel'));
const TariffEditor = lazyWithRetry(() => import('./features/admin/finance/TariffEditor'));
const AdminSupportPanel = lazyWithRetry(() => import('./features/admin/AdminSupportPanel'));
const AdminResourcesPanel = lazyWithRetry(() => import('./features/admin/AdminResourcesPanel'));

// Lazy Load Heavy Components (Durability with lazyWithRetry)
// const FranchiseDashboard = lazyWithRetry(() => import('./features/franchise/FranchiseDashboard'));
const OperationsPage = lazyWithRetry(() => import('./features/operations/OperationsPage'));
const Academy = lazyWithRetry(() => import('./features/academy/Academy'));
const AdminFranchiseView = lazyWithRetry(() => import('./features/admin/AdminFranchiseView'));
const KanbanBoard = lazyWithRetry(() => import('./features/admin/kanban/KanbanBoard'));
const RidersView = lazyWithRetry(() => import('./features/fleet/RidersView'));
const AcademyAdmin = lazyWithRetry(() => import('./features/academy/admin/AcademyAdmin'));
// InvoicingDashboard moved to FinanceHub
// const NotificationsPage = lazyWithRetry(() => import('./features/user/NotificationsPage'));

import { useFranchiseFinance } from './hooks/useFranchiseFinance';
import { useVersionCheck } from './hooks/useVersionCheck';
import { RiderLayout } from './layouts/RiderLayout';



const RiderScheduleView = lazyWithRetry(() => import('./features/rider/schedule/RiderScheduleView'));
const RiderProfileView = lazyWithRetry(() => import('./features/rider/profile/RiderProfileView').then(module => ({ default: module.RiderProfileView })));
const RiderHomeView = lazyWithRetry(() => import('./features/rider/home/RiderHomeView'));
const RiderAdvisorView = lazyWithRetry(() => import('./features/rider/advisor/RiderAdvisorView'));
const RiderPersonalDataView = lazyWithRetry(() => import('./features/rider/profile/RiderPersonalDataView').then(module => ({ default: module.RiderPersonalDataView })));
const RiderNotificationsView = lazyWithRetry(() => import('./features/rider/profile/RiderNotificationsView').then(module => ({ default: module.RiderNotificationsView })));
const RiderSecurityView = lazyWithRetry(() => import('./features/rider/profile/RiderSecurityView').then(module => ({ default: module.RiderSecurityView })));
const RiderAvailabilityView = lazyWithRetry(() => import('./features/rider/profile/RiderAvailabilityView'));

import { ErrorBoundaryWithToast } from './components/error/ErrorBoundary';

function App() {
    const { user, loading: authLoading, roleConfig, logout, isAdmin, impersonatedFranchiseId } = useAuth();


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
    const isFranchise = roleConfig?.role === 'franchise' || !!impersonatedFranchiseId;

    // 🛠️ DEBUG & CACHE CLEANUP
    // console.log("🚀 Running App Version: v4.1.0 - STABLE");

    // --- DATA FETCHING IDENTITY ---
    const profileFranchiseId = roleConfig?.franchiseId;
    const profileName = roleConfig?.name;
    const userUid = user?.uid;

    // Logic: Prefer Slug > Name > UID for queries, as historical data uses Slugs
    const dataHookFranchiseId = ((isAdmin && targetFranchiseId)
        ? targetFranchiseId
        : (profileFranchiseId || profileName || userUid || null)) as string | null;



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
    const handleAdminSelectFranchise = React.useCallback((id: string, name: string) => {
        if (import.meta.env.DEV) console.log(`[Admin] Selecting Franchise: ${name} (${id})`);
        setTargetFranchiseId(id);
        setTargetFranchiseName(name);
    }, []);

    // --- LAYOUT PROPS ---
    const layoutProps = React.useMemo(() => ({
        user, isAdmin, isFranchise,
        // Legacy props for compatibility if Header uses them
        viewMode: 'dashboard' as const, setViewMode: () => { },
        franchiseView: 'cockpit' as const, setFranchiseView: () => { },

        targetFranchiseName,
        // selectedMonth, -> Handled by Store
        // onMonthChange: setSelectedMonth, -> Handled by Store
        // viewPeriod, setViewPeriod, -> Handled by Store
        onLogout: logout,
        onExport: () => exportCSV(report as import('./hooks/useExport').ReportData, selectedMonth, isAdmin && targetFranchiseName ? targetFranchiseName : 'REPAART'),
        sidebarData: currentData, onCalculate: handleUpdate, readOnly: false,
        saving,
        // isChatOpen, setIsChatOpen, -> Handled by Store (DashboardLayout uses store)
        chatData: { report },
        isRider: roleConfig?.role === 'rider'
    }), [user, isAdmin, isFranchise, targetFranchiseName, logout, exportCSV, report, selectedMonth, currentData, handleUpdate, saving, roleConfig?.role]);

    // Context to be exposed via Outlet
    const outletContext = React.useMemo(() => ({
        user,
        franchiseId: dataHookFranchiseId,
        currentData, report, analysis,
        selectedMonth, setSelectedMonth,
        handleAdminSelectFranchise,
        targetFranchiseId,
        setIsSidebarOpen: (_isOpen: boolean) => {
            // Placeholder, handled by Store now
        }
    }), [user, dataHookFranchiseId, currentData, report, analysis, selectedMonth, setSelectedMonth, handleAdminSelectFranchise, targetFranchiseId]);

    if (authLoading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><DashboardSkeleton /></div>;
    }

    return (
        <>
            <ErrorBoundaryWithToast level="page">
                <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><DashboardSkeleton /></div>}>

                    <Routes>
                        {/* PUBLIC */}
                        <Route path="/login" element={
                            !user ? <Login /> : (
                                ['rider'].includes(user.role || '')
                                    ? <Navigate to="/rider/dashboard" replace />
                                    : <Navigate to="/dashboard" replace />
                            )
                        } />

                        {/* PROTECTED LAYOUT */}
                        <Route path="/" element={
                            <ProtectedRoute>
                                {['rider'].includes(user?.role || '') ? (
                                    <Navigate to="/rider/dashboard" replace />
                                ) : (
                                    <DashboardLayout {...layoutProps} outletContext={outletContext} />
                                )}
                            </ProtectedRoute>
                        }>
                            {/* SHARED ROUTES - Explicitly first */}
                            <Route path="notifications" element={
                                <React.Suspense fallback={<div className="p-10 text-center">Cargando Notificaciones...</div>}>
                                    <NotificationsPage />
                                </React.Suspense>
                            } />

                            <Route index element={
                                ['rider'].includes(user?.role || '')
                                    ? <Navigate to="/rider/dashboard" replace />
                                    : (user?.role === 'admin' || user?.role === 'franchise'
                                        ? <Navigate to="/dashboard" replace />
                                        : <Navigate to="/profile" replace />)
                            } />

                            {/* CORE (Admin/Franchise Only) */}
                            <Route path="dashboard" element={
                                <RequireRole allowedRoles={['admin', 'franchise']}>
                                    <RequireActiveStatus>
                                        <DashboardSwitcher />
                                    </RequireActiveStatus>
                                </RequireRole>
                            } />
                            <Route path="operations" element={
                                <RequireRole allowedRoles={['admin', 'franchise']}>
                                    <RequireActiveStatus>
                                        <OperationsPage />
                                    </RequireActiveStatus>
                                </RequireRole>
                            } />
                            <Route path="academy" element={
                                <RequireRole allowedRoles={['admin', 'franchise']}>
                                    <Academy />
                                </RequireRole>
                            } />
                            <Route path="academy/:moduleId" element={
                                <RequireRole allowedRoles={['admin', 'franchise']}>
                                    <Academy />
                                </RequireRole>
                            } />
                            <Route path="fleet" element={
                                <RequireRole allowedRoles={['admin', 'franchise']}>
                                    <RequireActiveStatus>
                                        <RidersView />
                                    </RequireActiveStatus>
                                </RequireRole>
                            } />
                            <Route path="invoicing" element={
                                <Navigate to="/dashboard" replace />
                            } />
                            <Route path="profile" element={<UserProfile />} />
                            <Route path="demo/smart-input" element={<DevSandbox />} />

                            {/* FRANCHISE SPECIFIC */}
                            <Route path="support" element={
                                <RequireRole allowedRoles={['admin', 'franchise']}>
                                    {/* Support is ALLOWED for Pending users */}
                                    <SupportHub />
                                </RequireRole>
                            } />
                            <Route path="resources" element={
                                <RequireRole allowedRoles={['admin', 'franchise']}>
                                    {/* Resources is ALLOWED for Pending users */}
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

                            <Route path="admin/billing" element={
                                <ProtectedRoute requireAdmin={true}>
                                    <AdminBillingDashboard />
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

                            {/* ADMIN ACADEMY STUDIO */}
                            <Route path="admin/academy" element={
                                <ProtectedRoute requireAdmin={true}>
                                    <AcademyAdmin />
                                </ProtectedRoute>
                            } />

                            {/* ADMIN FLYDER DASHBOARD - Hyper-Vision Module */}
                            <Route path="admin/flyder" element={
                                <ProtectedRoute requireAdmin={true}>
                                    <AdminFlyderDashboard franchiseId={targetFranchiseId || undefined} />
                                </ProtectedRoute>
                            } />

                            {/* 404 for DashboardLayout */}
                            <Route path="*" element={<NotFound />} />
                        </Route>

                        {/* RIDER SPECIFIC APP (Independent from Admin Layout) */}
                        <Route path="/rider" element={
                            <ProtectedRoute>
                                <RequireRole allowedRoles={['rider', 'admin']}>
                                    <RiderLayout />
                                </RequireRole>
                            </ProtectedRoute>
                        }>
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<RiderHomeView />} />
                            <Route path="schedule" element={<RiderScheduleView />} />
                            <Route path="availability" element={<RiderAvailabilityView />} />
                            <Route path="profile" element={<RiderProfileView />} />
                            <Route path="profile/personal" element={<RiderPersonalDataView />} />
                            <Route path="profile/notifications" element={<RiderNotificationsView />} />
                            <Route path="profile/security" element={<RiderSecurityView />} />
                            <Route path="advisor" element={<RiderAdvisorView />} />
                        </Route>
                    </Routes>
                </Suspense>
            </ErrorBoundaryWithToast>

            {/* Global Toast Notifications */}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#1e293b',
                        color: '#f1f5f9',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        padding: '12px 16px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    },
                    success: {
                        iconTheme: { primary: '#10b981', secondary: '#f1f5f9' },
                    },
                    error: {
                        iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' },
                        duration: 5000,
                    },
                }}
            />

            {/* Debug Tool - solo en desarrollo */}
            {import.meta.env.DEV && <DebugFirestore />}
        </>
    );
}

export default App;
