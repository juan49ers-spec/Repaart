"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledDataRetention = exports.archiveOldAuditLogs = exports.archiveOldTickets = exports.archiveOldNotifications = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const ARCHIVE_COLLECTION = 'archived_data';
const NOTIFICATIONS_RETENTION_MONTHS = 6;
const TICKETS_RETENTION_YEARS = 1;
const AUDIT_RETENTION_MONTHS = 6;
exports.archiveOldNotifications = functions.https.onCall(async (data, context) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - NOTIFICATIONS_RETENTION_MONTHS);
        console.log('[DataRetention] Archiving notifications older than', cutoffDate.toISOString());
        const notificationsSnap = await db.collection('notifications')
            .where('createdAt', '<', admin.firestore.Timestamp.fromDate(cutoffDate))
            .limit(500)
            .get();
        if (notificationsSnap.empty) {
            console.log('[DataRetention] No old notifications to archive');
            return { archived: 0, message: 'No notifications to archive' };
        }
        const batch = db.batch();
        let archivedCount = 0;
        notificationsSnap.docs.forEach(doc => {
            const docData = doc.data();
            const archivedRef = db.collection(ARCHIVE_COLLECTION).doc();
            batch.set(archivedRef, Object.assign(Object.assign({}, docData), { archivedAt: admin.firestore.FieldValue.serverTimestamp(), originalCollection: 'notifications', retentionPolicy: '6_months' }));
            batch.delete(doc.ref);
            archivedCount++;
        });
        await batch.commit();
        console.log('[DataRetention] Archived', archivedCount, 'notifications');
        return { archived: archivedCount, message: `Successfully archived ${archivedCount} notifications` };
    }
    catch (error) {
        console.error('[DataRetention] Error archiving notifications:', error);
        throw new functions.https.HttpsError('internal', 'Error archiving notifications');
    }
});
exports.archiveOldTickets = functions.https.onCall(async (data, context) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setFullYear(cutoffDate.getFullYear() - TICKETS_RETENTION_YEARS);
        console.log('[DataRetention] Archiving tickets older than', cutoffDate.toISOString());
        const ticketsSnap = await db.collection('tickets')
            .where('createdAt', '<', admin.firestore.Timestamp.fromDate(cutoffDate))
            .limit(500)
            .get();
        if (ticketsSnap.empty) {
            console.log('[DataRetention] No old tickets to archive');
            return { archived: 0, message: 'No tickets to archive' };
        }
        const batch = db.batch();
        let archivedCount = 0;
        ticketsSnap.docs.forEach(doc => {
            const docData = doc.data();
            const archivedRef = db.collection(ARCHIVE_COLLECTION).doc();
            batch.set(archivedRef, Object.assign(Object.assign({}, docData), { archivedAt: admin.firestore.FieldValue.serverTimestamp(), originalCollection: 'tickets', retentionPolicy: '1_year' }));
            batch.delete(doc.ref);
            archivedCount++;
        });
        await batch.commit();
        console.log('[DataRetention] Archived', archivedCount, 'tickets');
        return { archived: archivedCount, message: `Successfully archived ${archivedCount} tickets` };
    }
    catch (error) {
        console.error('[DataRetention] Error archiving tickets:', error);
        throw new functions.https.HttpsError('internal', 'Error archiving tickets');
    }
});
exports.archiveOldAuditLogs = functions.https.onCall(async (data, context) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - AUDIT_RETENTION_MONTHS);
        console.log('[DataRetention] Archiving audit logs older than', cutoffDate.toISOString());
        const auditSnap = await db.collection('audit_logs')
            .where('createdAt', '<', admin.firestore.Timestamp.fromDate(cutoffDate))
            .limit(1000)
            .get();
        if (auditSnap.empty) {
            console.log('[DataRetention] No old audit logs to archive');
            return { archived: 0, message: 'No audit logs to archive' };
        }
        const batch = db.batch();
        let archivedCount = 0;
        auditSnap.docs.forEach(doc => {
            const docData = doc.data();
            const archivedRef = db.collection(ARCHIVE_COLLECTION).doc();
            batch.set(archivedRef, Object.assign(Object.assign({}, docData), { archivedAt: admin.firestore.FieldValue.serverTimestamp(), originalCollection: 'audit_logs', retentionPolicy: '6_months' }));
            batch.delete(doc.ref);
            archivedCount++;
        });
        await batch.commit();
        console.log('[DataRetention] Archived', archivedCount, 'audit logs');
        return { archived: archivedCount, message: `Successfully archived ${archivedCount} audit logs` };
    }
    catch (error) {
        console.error('[DataRetention] Error archiving audit logs:', error);
        throw new functions.https.HttpsError('internal', 'Error archiving audit logs');
    }
});
exports.scheduledDataRetention = functions.pubsub
    .schedule('0 1 * * 0')
    .timeZone('UTC')
    .onRun(async (context) => {
    try {
        console.log('[DataRetention] Starting scheduled data retention...');
        const notificationsCutoff = new Date();
        notificationsCutoff.setMonth(notificationsCutoff.getMonth() - NOTIFICATIONS_RETENTION_MONTHS);
        const notificationsSnap = await db.collection('notifications')
            .where('createdAt', '<', admin.firestore.Timestamp.fromDate(notificationsCutoff))
            .limit(500)
            .get();
        if (!notificationsSnap.empty) {
            const batch = db.batch();
            notificationsSnap.docs.forEach(doc => {
                const archivedRef = db.collection(ARCHIVE_COLLECTION).doc();
                batch.set(archivedRef, Object.assign(Object.assign({}, doc.data()), { archivedAt: admin.firestore.FieldValue.serverTimestamp(), originalCollection: 'notifications', retentionPolicy: '6_months' }));
                batch.delete(doc.ref);
            });
            await batch.commit();
            console.log('[DataRetention] Archived', notificationsSnap.size, 'notifications');
        }
        const ticketsCutoff = new Date();
        ticketsCutoff.setFullYear(ticketsCutoff.getFullYear() - TICKETS_RETENTION_YEARS);
        const ticketsSnap = await db.collection('tickets')
            .where('createdAt', '<', admin.firestore.Timestamp.fromDate(ticketsCutoff))
            .limit(500)
            .get();
        if (!ticketsSnap.empty) {
            const batch = db.batch();
            ticketsSnap.docs.forEach(doc => {
                const archivedRef = db.collection(ARCHIVE_COLLECTION).doc();
                batch.set(archivedRef, Object.assign(Object.assign({}, doc.data()), { archivedAt: admin.firestore.FieldValue.serverTimestamp(), originalCollection: 'tickets', retentionPolicy: '1_year' }));
                batch.delete(doc.ref);
            });
            await batch.commit();
            console.log('[DataRetention] Archived', ticketsSnap.size, 'tickets');
        }
        console.log('[DataRetention] Data retention completed successfully');
    }
    catch (error) {
        console.error('[DataRetention] Error in scheduled data retention:', error);
        throw error;
    }
});
//# sourceMappingURL=dataRetention.js.map