import * as admin from 'firebase-admin';

// Initialize Firebase Admin globally to avoid cold start issues in triggers
if (admin.apps.length === 0) {
    admin.initializeApp();
}

// Export Triggers
export { syncUserRole } from './triggers/onUserWrite';
export { createUserManaged } from './callables/createUser';
export { calculateWeekStats } from './triggers/onWeekWrite';
export { onIncidentCreated } from './triggers/onIncident';
export { deleteUserSync } from './triggers/onUserDelete';
export { onSessionCreate } from './triggers/onSession';

// Export Callable Functions
export { createFranchise } from './callables/createFranchise';
export { archiveOldNotifications, archiveOldTickets, archiveOldAuditLogs, scheduledDataRetention } from './callables/dataRetention';
export { adminDeleteUser } from './callables/adminDeleteUser';
export { repairUser } from './callables/repairUser';

// Flyder Integration
export { getFlyderOrders, getFlyderOrdersStats } from './callables/getFlyderOrders';
export { 
  syncFlyderHistoricalOrders, 
  createFranchiseMapping, 
  listFranchiseMappings 
} from './callables/syncFlyderHistoricalOrders';
export { 
  importFlyderFranchises, 
  getImportStatus 
} from './callables/importFlyderFranchises';
export {
  assignFlyderIdsToFranchises
} from './callables/assignFlyderIds';
export {
  ensureMainFranchisesExist
} from './callables/ensureMainFranchises';
export {
  countRepaartOrders,
  getSyncStats
} from './callables/countOrders';
export {
  diagnoseOrders
} from './callables/diagnoseOrders';
export {
  getFlyderBusinessesWithOrders,
  createMissingMappings
} from './callables/verifyMappings';
export {
  syncFlyderOrdersByWeek
} from './callables/syncByWeek';
export {
  createTestFranchise
} from './callables/createTestFranchise';
export {
  syncAllRemainingOrders
} from './callables/syncAllRemaining';
export {
  cleanAndSyncAllOrders
} from './callables/cleanAndSync';
export {
  syncTestBusinessOrders
} from './callables/syncTestBusiness';

// Force rebuild - v2

// Push Notifications
export { subscribeToPush, unsubscribeFromPush, sendPushNotification } from './callables/pushNotifications';

