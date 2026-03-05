import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

/**
 * Repair custom claims for a user by syncing from Firestore
 * This is useful when custom claims get out of sync
 */
export const repairCustomClaims = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const { targetUserId } = data;

    // Only admin can repair other users' claims
    // Users can repair their own claims
    const isOwnClaims = !targetUserId || targetUserId === context.auth.uid;
    const isAdmin = context.auth.token.role === 'admin';

    if (!isOwnClaims && !isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Only admin can repair other users claims');
    }

    const userIdToRepair = targetUserId || context.auth.uid;

    try {
        // Fetch user from Firestore
        const userDoc = await admin.firestore().collection('users').doc(userIdToRepair).get();

        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User document not found in Firestore');
        }

        const userData = userDoc.data();
        if (!userData) {
            throw new functions.https.HttpsError('not-found', 'User data is empty');
        }

        const role = userData.role;
        const franchiseId = userData.franchiseId;

        if (!role) {
            throw new functions.https.HttpsError('failed-precondition', 'User has no role in Firestore');
        }

        // Set custom claims
        const claims: any = { role };

        if (franchiseId) {
            claims.franchiseId = franchiseId;
        }

        await admin.auth().setCustomUserClaims(userIdToRepair, claims);

        console.log(`✅ Custom claims repaired for ${userIdToRepair}:`, claims);

        return {
            success: true,
            userId: userIdToRepair,
            claims,
            message: 'Custom claims repaired successfully. Please sign out and sign in again to refresh token.'
        };

    } catch (error: any) {
        console.error(`❌ Error repairing custom claims for ${userIdToRepair}:`, error);

        if (error.code) {
            throw error;
        }

        throw new functions.https.HttpsError('internal', error.message || 'Error repairing custom claims');
    }
});
