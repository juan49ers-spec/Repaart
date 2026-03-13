import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { buildClaims, UserRole, UserStatus } from '../utils/claims';

/**
 * Trigger that syncs Firestore user document changes to Firebase Auth Custom Claims.
 * This ensures that security rules (which rely on tokens) are always in sync with the database.
 */
export const syncUserClaims = functions.region('us-central1').firestore
    .document('users/{userId}')
    .onWrite(async (change, context) => {
        const userId = context.params.userId;
        const newData = change.after.exists ? change.after.data() : null;
        const oldData = change.before.exists ? change.before.data() : null;

        // If deleted, we don't need to do anything (onUserDelete handles cleanup)
        if (!newData) {
            console.log(`👤 User ${userId} deleted. Skipping claim sync.`);
            return null;
        }

        // Check if critical fields changed to avoid unnecessary Auth updates
        const roleChanged = newData.role !== oldData?.role;
        const statusChanged = newData.status !== oldData?.status;
        const franchiseIdChanged = newData.franchiseId !== oldData?.franchiseId;

        if (!roleChanged && !statusChanged && !franchiseIdChanged && oldData !== null) {
            return null;
        }

        console.log(`🔄 Syncing claims for user ${userId}...`);

        try {
            const role = newData.role as UserRole;
            const status = (newData.status as UserStatus) || 'active';
            const franchiseId = newData.franchiseId as string | undefined;

            if (!role) {
                console.warn(`⚠️ User ${userId} has no role defined in Firestore.`);
                return null;
            }

            // Build claims using the standard helper
            const finalClaims = buildClaims({
                role,
                status,
                franchiseId: (role === 'franchise' || role === 'rider') ? franchiseId : null
            });

            // Update Auth Custom Claims
            await admin.auth().setCustomUserClaims(userId, finalClaims);
            
            console.log(`✅ Claims updated for ${userId}:`, finalClaims);

            // Optional: Log to audit logs for transparency
            await admin.firestore().collection('audit_logs').add({
                action: 'SYNC_CLAIMS_TRIGGER',
                targetUid: userId,
                claims: finalClaims,
                reason: roleChanged ? 'ROLE_CHANGE' : (statusChanged ? 'STATUS_CHANGE' : 'FRANCHISE_CHANGE'),
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

        } catch (error: any) {
            console.error(`❌ Error syncing claims for user ${userId}:`, error);
            
            // Log error to audit if possible
            await admin.firestore().collection('audit_logs').add({
                action: 'SYNC_CLAIMS_ERROR',
                targetUid: userId,
                error: error.message,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        return null;
    });
