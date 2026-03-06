import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { buildClaims, UserRole, UserStatus } from '../utils/claims';
import { isLastAdmin } from '../utils/admin';

/**
 * Callable Function to set user roles.
 * Single Source of Truth: Auth Custom Claims.
 * Mirror: Firestore 'users' collection.
 */
export const setRole = functions.region('us-central1').https.onCall(async (data, context) => {
    // 1. Authentication & Authorization
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado.');
    }

    if (context.auth.token.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Solo los administradores pueden asignar roles.');
    }

    const { targetUid, newRole, franchiseId } = data as { targetUid: string; newRole: UserRole; franchiseId?: string | null };

    // 2. Validation
    if (!targetUid || !newRole) {
        throw new functions.https.HttpsError('invalid-argument', 'targetUid y newRole son obligatorios.');
    }

    const allowedRoles: UserRole[] = ['admin', 'franchise', 'rider', 'user'];
    if (!allowedRoles.includes(newRole)) {
        throw new functions.https.HttpsError('invalid-argument', `Rol inválido: ${newRole}`);
    }

    // 3. Operational Logic: franchiseId requirement
    if ((newRole === 'franchise' || newRole === 'rider') && !franchiseId) {
        throw new functions.https.HttpsError('invalid-argument', 'franchiseId es obligatorio para roles franchise y rider.');
    }

    // 4. Protection: Prevent admin self-degradation or last admin degradation
    if (newRole !== 'admin') {
        // Prevent self-degradation
        if (context.auth.uid === targetUid) {
            throw new functions.https.HttpsError('failed-precondition', 'No puedes degradar tu propio rol de administrador.');
        }

        // Prevent last admin degradation
        const isTargetLastAdmin = await isLastAdmin(targetUid);
        if (isTargetLastAdmin) {
            throw new functions.https.HttpsError('failed-precondition', 'No se puede degradar al último administrador activo del sistema.');
        }
    }

    try {
        const targetAuth = await admin.auth().getUser(targetUid);
        const oldRole = (targetAuth.customClaims?.role as UserRole) || 'user';

        // 5. Build strict claims with resilient status fallback (Auth -> Firestore -> active)
        let finalStatus = (targetAuth.customClaims?.status as UserStatus);
        if (!finalStatus) {
            const userRef = admin.firestore().collection('users').doc(targetUid);
            const userSnap = await userRef.get();
            finalStatus = (userSnap.data()?.status as UserStatus) || 'active';
            console.log(`[setRole] Status claim missing, fallback to Firestore: ${finalStatus}`);
        }

        const finalClaims = buildClaims({
            role: newRole,
            status: finalStatus,
            franchiseId: (newRole === 'franchise' || newRole === 'rider') ? franchiseId : null
        });

        // 6. Update Auth
        await admin.auth().setCustomUserClaims(targetUid, finalClaims);

        // 7. Update Firestore Mirror
        const userRef = admin.firestore().collection('users').doc(targetUid);
        const mirrorPayload: any = {
            role: newRole,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            roleAssignedBy: context.auth.uid
        };

        if (newRole === 'franchise' || newRole === 'rider') {
            mirrorPayload.franchiseId = franchiseId;
        } else {
            // Clean legacy franchiseId residues
            mirrorPayload.franchiseId = admin.firestore.FieldValue.delete();
        }

        await userRef.set(mirrorPayload, { merge: true });

        // 8. Audit Logging
        await admin.firestore().collection('audit_logs').add({
            action: 'USER_ROLE_CHANGE',
            targetUid,
            oldRole,
            newRole,
            franchiseId: (newRole === 'franchise' || newRole === 'rider') ? franchiseId : null,
            performedBy: context.auth.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, message: `Rol actualizado a ${newRole} para ${targetUid}` };

    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            throw new functions.https.HttpsError('not-found', 'El usuario objetivo no existe.');
        }
        console.error('Error in setRole:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Error interno al asignar rol.');
    }
});
