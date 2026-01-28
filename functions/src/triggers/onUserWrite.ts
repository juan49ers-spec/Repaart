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

        // 2. Cascading Deletion: If a franchise is deleted, delete its riders
        if (role === 'franchise' && newData.status === 'deleted') {
            console.log(`🚨 Franquicia ${userId} eliminada. Buscando riders para eliminar en cascada...`);

            const ridersSnap = await admin.firestore()
                .collection('users')
                .where('franchiseId', '==', userId.toUpperCase()) // Check both cases to be safe
                .get();

            const ridersSnapLower = await admin.firestore()
                .collection('users')
                .where('franchiseId', '==', userId)
                .get();

            const allRiderDocs = [...ridersSnap.docs, ...ridersSnapLower.docs];

            if (allRiderDocs.length > 0) {
                const batch = admin.firestore().batch();
                allRiderDocs.forEach(riderDoc => {
                    const riderData = riderDoc.data();
                    if (riderData.status !== 'deleted') {
                        batch.update(riderDoc.ref, {
                            status: 'deleted',
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                        console.log(`  - Marcando rider ${riderDoc.id} (${riderData.email}) como eliminado.`);
                    }
                });
                await batch.commit();
                console.log(`✅ Borrado en cascada completado para ${allRiderDocs.length} perfiles.`);
            } else {
                console.log(`ℹ️ No se encontraron riders asociados para la franquicia ${userId}.`);
            }
        }
    } catch (error) {
        console.error(`❌ Error en syncUserRole para ${userId}:`, error);
    }
});
