import * as admin from 'firebase-admin';

// Initialize Firebase Admin globally to avoid cold start issues in triggers
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Export Triggers
export { syncUserRole } from './triggers/onUserWrite';
export { calculateWeekStats } from './triggers/onWeekWrite';
export { onIncidentCreated } from './triggers/onIncident';
export { deleteUserSync } from './triggers/onUserDelete';

// Export Callable Functions
export { createUserManaged } from './callables/createUser';
export { createFranchise } from './callables/createFranchise';
export { archiveOldNotifications, archiveOldTickets, archiveOldAuditLogs, scheduledDataRetention } from './callables/dataRetention';
export { adminDeleteUser } from './callables/adminDeleteUser';

// Flyder Integration
export { getFlyderOrders, getFlyderOrdersStats } from './callables/getFlyderOrders';

// Push Notifications
export { subscribeToPush, unsubscribeFromPush, sendPushNotification } from './callables/pushNotifications';
