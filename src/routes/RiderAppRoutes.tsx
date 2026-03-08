import React from 'react';
import { Navigate, Route } from 'react-router-dom';
import ProtectedRoute from '../features/auth/ProtectedRoute';
import RequireRole from '../layouts/RequireRole';
import { RiderLayout } from '../layouts/RiderLayout';

interface RiderRouteComponents {
    RiderHomeView: React.ComponentType;
    RiderScheduleView: React.ComponentType;
    RiderAvailabilityView: React.ComponentType;
    RiderProfileView: React.ComponentType;
    RiderPersonalDataView: React.ComponentType;
    RiderNotificationsView: React.ComponentType;
    RiderSecurityView: React.ComponentType;
}

interface RiderAppRoutesProps {
    components: RiderRouteComponents;
}

export function renderRiderRoutes({ components }: RiderAppRoutesProps) {
    const {
        RiderHomeView,
        RiderScheduleView,
        RiderAvailabilityView,
        RiderProfileView,
        RiderPersonalDataView,
        RiderNotificationsView,
        RiderSecurityView,
    } = components;

    return (
        <Route
            path="/rider"
            element={
                <ProtectedRoute>
                    <RequireRole allowedRoles={['rider', 'admin']}>
                        <RiderLayout />
                    </RequireRole>
                </ProtectedRoute>
            }
        >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<RiderHomeView />} />
            <Route path="schedule" element={<RiderScheduleView />} />
            <Route path="availability" element={<RiderAvailabilityView />} />
            <Route path="profile" element={<RiderProfileView />} />
            <Route path="profile/personal" element={<RiderPersonalDataView />} />
            <Route path="profile/notifications" element={<RiderNotificationsView />} />
            <Route path="profile/security" element={<RiderSecurityView />} />
        </Route>
    );
}
