import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { buildClaims, UserRole, UserStatus } from '../utils/claims';

/**
 * Repair custom claims for a user by syncing from Firestore.
 * This is useful when custom claims get out of sync or during migrations.
 * Validates against strict buildClaims rules to avoid legacy residues.
 */
export const repairCustomClaims = functions.region('us-central1').https.onCall(async (data: any, context: functions.https.CallableContext) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debe estar autenticado.');
    }

    const targetUserId = data?.targetUserId;
    const callerRole = (context.auth.token.role as UserRole) || 'user';

    // Only admin can repair other users' claims
    // Users can repair their own claims
    const isOwnClaims = !targetUserId || targetUserId === context.auth.uid;
    const isAdmin = callerRole === 'admin';

    if (!isOwnClaims && !isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Solo los administradores pueden reparar claims de otros usuarios.');
    }

    const userIdToRepair = targetUserId || context.auth.uid;

    try {
        // Fetch user from Firestore (The Mirror)
        const userDoc = await admin.firestore().collection('users').doc(userIdToRepair).get();

        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Documento de usuario no encontrado en Firestore.');
        }

        const userData = userDoc.data();
        if (!userData) {
            throw new functions.https.HttpsError('not-found', 'Datos de usuario vacíos.');
        }

        const role = userData.role as UserRole;
        const status = (userData.status as UserStatus) || 'active';
        const franchiseId = userData.franchiseId as string | undefined;

        if (!role) {
            throw new functions.https.HttpsError('failed-precondition', 'El usuario no tiene un rol asignado en Firestore.');
        }

        // Build strict claims (SSoT) using the same helper as callables
        const finalClaims = buildClaims({
            role,
            status,
            franchiseId: (role === 'franchise' || role === 'rider') ? franchiseId : null
        });

        // Update Auth
        await admin.auth().setCustomUserClaims(userIdToRepair, finalClaims);

        // Audit Logging
        await admin.firestore().collection('audit_logs').add({
            action: 'REPAIR_CLAIMS',
            targetUid: userIdToRepair,
            claims: finalClaims,
            performedBy: context.auth.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Custom claims repaired for ${userIdToRepair}:`, finalClaims);

        return {
            success: true,
            userId: userIdToRepair,
            claims: finalClaims,
            message: 'Custom claims reparados exitosamente. Cierre sesión y vuelva a entrar para refrescar el token.'
        };

    } catch (error: any) {
        console.error(`❌ Error repairing custom claims for ${userIdToRepair}:`, error);

        // Propagate known HttpsErrors
        if (error instanceof functions.https.HttpsError) throw error;

        // Detect validation errors from buildClaims
        if (error.message && error.message.includes('franchiseId is required')) {
            throw new functions.https.HttpsError('failed-precondition', error.message);
        }

        throw new functions.https.HttpsError('internal', error.message || 'Error interno al reparar custom claims.');
    }
});
