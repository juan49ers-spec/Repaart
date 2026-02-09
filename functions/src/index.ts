import * as admin from 'firebase-admin';

admin.initializeApp();

// Export Triggers
export { syncUserRole } from './triggers/onUserWrite';
export { createUserManaged } from './callables/createUser';
export { calculateWeekStats } from './triggers/onWeekWrite';
export { onIncidentCreated } from './triggers/onIncident';
export { deleteUserSync } from './triggers/onUserDelete';

// Export Callable Functions
export { createFranchise } from './callables/createFranchise';
export { archiveOldNotifications, archiveOldTickets, archiveOldAuditLogs, scheduledDataRetention } from './callables/dataRetention';
export { adminDeleteUser } from './callables/adminDeleteUser';

// Flyder Integration
export { getFlyderOrders, getFlyderOrdersStats } from './callables/getFlyderOrders';

// Force rebuild - v2

// Push Notifications
export { subscribeToPush, unsubscribeFromPush, sendPushNotification } from './callables/pushNotifications';

