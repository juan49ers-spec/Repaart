import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

/**
 * Admin Delete User
 * Elimina completamente un usuario de Auth y Firestore
 * Solo puede ser llamada por usuarios con role 'admin'
 */
export const adminDeleteUser = functions.https.onCall(async (data, context) => {
    const uid = data.uid;

    if (!uid || typeof uid !== 'string') {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'UID del usuario es requerido'
        );
    }

    // Verificar que el usuario que hace la llamada es admin
    const callerUid = context.auth?.uid;
    if (!callerUid) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'No autenticado'
        );
    }

    const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
    if (!callerDoc.exists) {
        throw new functions.https.HttpsError(
            'not-found',
            'Usuario no encontrado'
        );
    }

    const callerRole = callerDoc.data()?.role;
    if (callerRole !== 'admin') {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Solo administradores pueden eliminar usuarios'
        );
    }

    console.log(`🗑️ Iniciando eliminación completa del usuario: ${uid}`);

    try {
        // 1. Eliminar usuario de Firebase Auth
        try {
            await admin.auth().deleteUser(uid);
            console.log(`✅ Usuario ${uid} eliminado de Firebase Auth`);
        } catch (authError: any) {
            // Si el usuario no existe en Auth, continuar con eliminación de Firestore
            if (authError.code === 'auth/user-not-found') {
                console.log(`⚠️ Usuario ${uid} no existe en Firebase Auth, continuando...`);
            } else {
                throw authError;
            }
        }

        // 2. Eliminar documento de Firestore
        await admin.firestore().collection('users').doc(uid).delete();
        console.log(`✅ Documento de usuario ${uid} eliminado de Firestore`);

        // 3. Eliminar registros relacionados (opcional)
        // - schedules
        // - shifts
        // - incidents
        // Estos pueden ser limpiados por data retention policies

        return { success: true, message: 'Usuario eliminado completamente' };
    } catch (error) {
        console.error(`❌ Error eliminando usuario ${uid}:`, error);
        throw new functions.https.HttpsError(
            'internal',
            'Error al eliminar usuario'
        );
    }
});
