import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

const db = admin.firestore();

const ARCHIVE_COLLECTION = 'archived_data';
const NOTIFICATIONS_RETENTION_MONTHS = 6;
const TICKETS_RETENTION_YEARS = 1;
const AUDIT_RETENTION_MONTHS = 6;

export const archiveOldNotifications = functions.https.onCall(async (data, context) => {
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
            batch.set(archivedRef, {
                ...docData,
                archivedAt: admin.firestore.FieldValue.serverTimestamp(),
                originalCollection: 'notifications',
                retentionPolicy: '6_months'
            });
            batch.delete(doc.ref);
            archivedCount++;
        });

        await batch.commit();

        console.log('[DataRetention] Archived', archivedCount, 'notifications');

        return { archived: archivedCount, message: `Successfully archived ${archivedCount} notifications` };
    } catch (error) {
        console.error('[DataRetention] Error archiving notifications:', error);
        throw new functions.https.HttpsError('internal', 'Error archiving notifications');
    }
});

export const archiveOldTickets = functions.https.onCall(async (data, context) => {
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
            batch.set(archivedRef, {
                ...docData,
                archivedAt: admin.firestore.FieldValue.serverTimestamp(),
                originalCollection: 'tickets',
                retentionPolicy: '1_year'
            });
            batch.delete(doc.ref);
            archivedCount++;
        });

        await batch.commit();

        console.log('[DataRetention] Archived', archivedCount, 'tickets');

        return { archived: archivedCount, message: `Successfully archived ${archivedCount} tickets` };
    } catch (error) {
        console.error('[DataRetention] Error archiving tickets:', error);
        throw new functions.https.HttpsError('internal', 'Error archiving tickets');
    }
});

export const archiveOldAuditLogs = functions.https.onCall(async (data, context) => {
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
            batch.set(archivedRef, {
                ...docData,
                archivedAt: admin.firestore.FieldValue.serverTimestamp(),
                originalCollection: 'audit_logs',
                retentionPolicy: '6_months'
            });
            batch.delete(doc.ref);
            archivedCount++;
        });

        await batch.commit();

        console.log('[DataRetention] Archived', archivedCount, 'audit logs');

        return { archived: archivedCount, message: `Successfully archived ${archivedCount} audit logs` };
    } catch (error) {
        console.error('[DataRetention] Error archiving audit logs:', error);
        throw new functions.https.HttpsError('internal', 'Error archiving audit logs');
    }
});

export const scheduledDataRetention = functions.pubsub
    .schedule('0 2 * *')
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
                    batch.set(archivedRef, {
                        ...doc.data(),
                        archivedAt: admin.firestore.FieldValue.serverTimestamp(),
                        originalCollection: 'notifications',
                        retentionPolicy: '6_months'
                    });
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
                    batch.set(archivedRef, {
                        ...doc.data(),
                        archivedAt: admin.firestore.FieldValue.serverTimestamp(),
                        originalCollection: 'tickets',
                        retentionPolicy: '1_year'
                    });
                    batch.delete(doc.ref);
                });
                await batch.commit();
                console.log('[DataRetention] Archived', ticketsSnap.size, 'tickets');
            }

            console.log('[DataRetention] Data retention completed successfully');

        } catch (error) {
            console.error('[DataRetention] Error in scheduled data retention:', error);
            throw error;
        }
    });