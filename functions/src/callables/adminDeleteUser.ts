import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { UserRole } from '../utils/claims';
import { isLastAdmin } from '../utils/admin';

/**
 * Admin Delete User
 * Elimina completamente un usuario de Auth y Firestore.
 * Solo puede ser llamada por usuarios con role 'admin'.
 * Implementa protección contra auto-eliminación de administradores.
 */
export const adminDeleteUser = functions.region('us-central1').https.onCall(async (data: { uid: string }, context: functions.https.CallableContext) => {
    const targetUid = data.uid;

    if (!targetUid || typeof targetUid !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'UID del usuario es requerido.');
    }

    // 1. Verify caller is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debe estar autenticado.');
    }

    const callerUid = context.auth.uid;
    const callerRole = (context.auth.token.role as UserRole) || 'user';

    // 2. Verify caller is Admin
    if (callerRole !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Solo administradores pueden eliminar usuarios.');
    }

    // 3. Prevent self-deletion of Admins (protection)
    if (targetUid === callerUid) {
        throw new functions.https.HttpsError('permission-denied', 'No puede eliminarse a sí mismo desde este panel. Contacte con otro administrador.');
    }

    // 3.1. Last Admin Protection
    const isTargetLastAdmin = await isLastAdmin(targetUid);
    if (isTargetLastAdmin) {
        throw new functions.https.HttpsError('failed-precondition', 'No se puede eliminar al último administrador activo del sistema.');
    }

    try {
        console.log(`🗑️ Iniciando eliminación completa del usuario: ${targetUid}`);

        // 4. Verification Check: Is target an Admin? (Additional Safety)
        const targetAuth = await admin.auth().getUser(targetUid);
        if (targetAuth.customClaims?.role === 'admin') {
            // In some systems, we might want to prevent deleting other admins, 
            // but for now we follow the same rule as setRole/setUserStatus: 
            // admins can manage others, but not themselves.
        }

        // 5. Delete from Firebase Auth
        try {
            await admin.auth().deleteUser(targetUid);
            console.log(`✅ Usuario ${targetUid} eliminado de Firebase Auth`);
        } catch (authError: any) {
            if (authError.code === 'auth/user-not-found') {
                console.log(`⚠️ Usuario ${targetUid} no existe en Firebase Auth, continuando con limpieza...`);
            } else {
                throw authError;
            }
        }

        // 6. Delete User Document and related records (Optional: archiving might be better, but we follow original intent)
        await admin.firestore().collection('users').doc(targetUid).delete();
        console.log(`✅ Documento de usuario ${targetUid} eliminado de Firestore`);

        // 7. Audit Logging
        await admin.firestore().collection('audit_logs').add({
            action: 'DELETE_USER',
            targetUid: targetUid,
            performedBy: callerUid,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, message: 'Usuario eliminado completamente.' };

    } catch (error: any) {
        console.error(`❌ Error eliminando usuario ${targetUid}:`, error);
        if (error.code) throw error;
        throw new functions.https.HttpsError('internal', error.message || 'Error al eliminar usuario.');
    }
});
