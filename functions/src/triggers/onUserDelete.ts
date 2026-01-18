import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

export const deleteUserSync = functions.auth.user().onDelete(async (user) => {
    const uid = user.uid;
    console.log(`🗑️ Usuario Auth eliminado: ${uid}. Limpiando Firestore...`);

    try {
        await admin.firestore().collection('users').doc(uid).delete();
        console.log(`✅ Perfil de usuario ${uid} eliminado de Firestore.`);
    } catch (error) {
        console.error(`❌ Error eliminando perfil de ${uid}:`, error);
    }
});
