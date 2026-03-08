import React from 'react';
import { Navigate, Route } from 'react-router-dom';
import ProtectedRoute from '../features/auth/ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';
import RequireRole from '../layouts/RequireRole';
import RequireActiveStatus from '../layouts/RequireActiveStatus';
import DashboardSwitcher from '../layouts/components/DashboardSwitcher';
import UserProfile from '../features/user/UserProfile';
import DevSandbox from '../pages/DevSandbox';
import SupportHub from '../features/franchise/SupportHub';
import ResourcesPanel from '../features/franchise/ResourcesPanel';
import UserManagementPanel from '../features/admin/users/UserManagementPanel';
import AdminSupportPanel from '../features/admin/AdminSupportPanel';
import AdminResourcesPanel from '../features/admin/AdminResourcesPanel';
import AuditPanel from '../features/admin/AuditPanel';
import TariffEditor from '../features/admin/finance/TariffEditor';
import AnnouncementSystem from '../features/admin/AnnouncementSystem';
import WeeklyScheduler from '../features/operations/WeeklyScheduler';
import NotFound from '../layouts/pages/NotFound';
import DashboardSkeleton from '../components/ui/layout/DashboardSkeleton';

interface DashboardRouteComponents {
    OperationsPage: React.ComponentType;
    Academy: React.ComponentType;
    RidersView: React.ComponentType;
    KanbanBoard: React.ComponentType;
    AdminFranchiseView: React.ComponentType;
    AcademyAdmin: React.ComponentType;
}

interface DashboardAppRoutesProps {
    user: { role?: string } | null;
    layoutProps: Record<string, unknown>;
    outletContext: Record<string, unknown>;
    targetFranchiseId: string | null;
    components: DashboardRouteComponents;
}

export function renderDashboardRoutes({ user, layoutProps, outletContext, targetFranchiseId, components }: DashboardAppRoutesProps) {
    const { OperationsPage, Academy, RidersView, KanbanBoard, AdminFranchiseView, AcademyAdmin } = components;

    return (
        <Route
            path="/"
            element={
                <ProtectedRoute>
                    {['rider'].includes(user?.role || '') ? (
                        <Navigate to="/rider/dashboard" replace />
                    ) : (
                        <DashboardLayout {...layoutProps} outletContext={outletContext} />
                    )}
                </ProtectedRoute>
            }
        >
            <Route
                index
                element={
                    ['rider'].includes(user?.role || '')
                        ? <Navigate to="/rider/dashboard" replace />
                        : (user?.role === 'admin' || user?.role === 'franchise'
                            ? <Navigate to="/dashboard" replace />
                            : <Navigate to="/profile" replace />)
                }
            />
            <Route path="dashboard" element={<RequireRole allowedRoles={['admin', 'franchise']}><RequireActiveStatus><DashboardSwitcher /></RequireActiveStatus></RequireRole>} />
            <Route path="operations" element={<RequireRole allowedRoles={['admin', 'franchise']}><RequireActiveStatus><OperationsPage /></RequireActiveStatus></RequireRole>} />
            <Route path="academy" element={<RequireRole allowedRoles={['admin', 'franchise']}><Academy /></RequireRole>} />
            <Route path="academy/:moduleId" element={<RequireRole allowedRoles={['admin', 'franchise']}><Academy /></RequireRole>} />
            <Route path="fleet" element={<RequireRole allowedRoles={['admin', 'franchise']}><RequireActiveStatus><RidersView /></RequireActiveStatus></RequireRole>} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="demo/smart-input" element={<DevSandbox />} />
            <Route path="support" element={<RequireRole allowedRoles={['admin', 'franchise']}><SupportHub /></RequireRole>} />
            <Route path="resources" element={<RequireRole allowedRoles={['admin', 'franchise']}><ResourcesPanel /></RequireRole>} />
            <Route path="admin/users" element={<ProtectedRoute requireAdmin={true}><UserManagementPanel /></ProtectedRoute>} />
            <Route path="admin/support" element={<ProtectedRoute requireAdmin={true}><AdminSupportPanel /></ProtectedRoute>} />
            <Route path="admin/resources" element={<ProtectedRoute requireAdmin={true}><AdminResourcesPanel /></ProtectedRoute>} />
            <Route path="admin/audit" element={<ProtectedRoute requireAdmin={true}><AuditPanel /></ProtectedRoute>} />
            <Route path="admin/tariffs" element={<ProtectedRoute requireAdmin={true}><TariffEditor onClose={() => { }} /></ProtectedRoute>} />
            <Route path="admin/communications" element={<ProtectedRoute requireAdmin={true}><div className="p-5 md:p-8 space-y-6"><AnnouncementSystem /></div></ProtectedRoute>} />
            <Route path="admin/shifts" element={<ProtectedRoute requireAdmin={true}><div className="p-5 md:p-8 space-y-6 h-[calc(100vh-64px)] overflow-hidden"><WeeklyScheduler franchiseId={targetFranchiseId || ''} readOnly={false} /></div></ProtectedRoute>} />
            <Route path="admin/kanban" element={<ProtectedRoute requireAdmin={true}><div className="p-5 md:p-8 space-y-6 h-[calc(100vh-64px)] overflow-hidden"><React.Suspense fallback={<DashboardSkeleton />}><KanbanBoard /></React.Suspense></div></ProtectedRoute>} />
            <Route path="admin/franchise/:franchiseId" element={<ProtectedRoute requireAdmin={true}><AdminFranchiseView /></ProtectedRoute>} />
            <Route path="admin/academy" element={<ProtectedRoute requireAdmin={true}><AcademyAdmin /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
        </Route>
    );
}
