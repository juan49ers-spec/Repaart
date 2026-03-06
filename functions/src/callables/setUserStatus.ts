import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { buildClaims, UserRole, UserStatus } from '../utils/claims';
import { isLastAdmin } from '../utils/admin';

/**
 * Callable Function to update user status.
 * Prevents legacy pollution by rebuilding claims from scratch.
 */
export const setUserStatus = functions.region('us-central1').https.onCall(async (data, context) => {
    // 1. Authentication & Authorization
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado.');
    }

    if (context.auth.token.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Solo los administradores pueden cambiar el estado de un usuario.');
    }

    const { targetUid, newStatus } = data as { targetUid: string; newStatus: UserStatus };

    // 2. Validation
    if (!targetUid || !newStatus) {
        throw new functions.https.HttpsError('invalid-argument', 'targetUid y newStatus son obligatorios.');
    }

    const allowedStatuses: UserStatus[] = ['active', 'pending', 'banned', 'deleted'];
    if (!allowedStatuses.includes(newStatus)) {
        throw new functions.https.HttpsError('invalid-argument', `Estado inválido: ${newStatus}`);
    }

    // 3. Protection: Prevent admin self-ban or self-delete, and last admin protection
    if (newStatus === 'banned' || newStatus === 'deleted') {
        // Prevent self-ban or self-delete
        if (context.auth.uid === targetUid) {
            throw new functions.https.HttpsError('failed-precondition', 'No puedes bloquear o eliminar tu propia cuenta de administrador.');
        }

        // Prevent last admin protection
        const isTargetLastAdmin = await isLastAdmin(targetUid);
        if (isTargetLastAdmin) {
            throw new functions.https.HttpsError('failed-precondition', 'No se puede bloquear o eliminar al último administrador activo del sistema.');
        }
    }

    try {
        const targetAuth = await admin.auth().getUser(targetUid);
        const currentRole = (targetAuth.customClaims?.role as UserRole) || 'user';

        // 4. Build strict claims with resilient franchiseId fallback
        let finalFranchiseId = (targetAuth.customClaims?.franchiseId as string) || null;

        // If franchiseId is missing in claims but required by role, check Firestore
        if (!finalFranchiseId && (currentRole === 'franchise' || currentRole === 'rider')) {
            const userRef = admin.firestore().collection('users').doc(targetUid);
            const userSnap = await userRef.get();
            finalFranchiseId = userSnap.data()?.franchiseId || null;

            if (!finalFranchiseId) {
                console.error(`[setUserStatus] Critical Error: franchiseId missing for role ${currentRole} in both Auth and Firestore for user ${targetUid}`);
                throw new functions.https.HttpsError('failed-precondition', `El usuario con rol ${currentRole} no tiene una franquicia asociada válida.`);
            }
            console.log(`[setUserStatus] franchiseId missing in claims, fallback to Firestore: ${finalFranchiseId}`);
        }

        // 5. Build strict claims (SSoT) - Zero legacy tolerance
        const finalClaims = buildClaims({
            role: currentRole,
            status: newStatus,
            franchiseId: finalFranchiseId
        });

        // 6. Update Auth
        await admin.auth().setCustomUserClaims(targetUid, finalClaims);

        // 7. Update Firestore Mirror
        const userRef = admin.firestore().collection('users').doc(targetUid);
        await userRef.set({
            status: newStatus,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            statusAssignedBy: context.auth.uid
        }, { merge: true });

        // 8. Audit Logging
        await admin.firestore().collection('audit_logs').add({
            action: 'USER_STATUS_CHANGE',
            targetUid,
            newStatus,
            oldStatus: targetAuth.customClaims?.status || 'active',
            performedBy: context.auth.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, message: `Estado actualizado a ${newStatus} para ${targetUid}` };

    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            throw new functions.https.HttpsError('not-found', 'El usuario objetivo no existe.');
        }
        console.error('Error in setUserStatus:', error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError('internal', error.message || 'Error interno al cambiar el estado del usuario.');
    }
});
