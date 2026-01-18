import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

export const syncUserRole = functions.firestore.document('users/{userId}').onWrite(async (change, context) => {
    const userId = context.params.userId;

    // If deleted
    if (!change.after.exists) return;

    const newData = change.after.data();
    if (!newData) return;

    const role = newData.role;
    const franchiseId = newData.franchiseId;

    if (!role) {
        console.log(`⚠️ Usuario ${userId} sin rol. Claims no actualizados.`);
        return;
    }

    try {
        const claims = { role, franchiseId: franchiseId || null };
        await admin.auth().setCustomUserClaims(userId, claims);
        console.log(`✅ Claims sincronizados para ${userId}:`, claims);
    } catch (error) {
        console.error(`❌ Error sincronizando claims para ${userId}:`, error);
    }
});
