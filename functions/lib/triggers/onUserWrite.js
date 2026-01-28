"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncUserRole = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
exports.syncUserRole = functions.firestore.document('users/{userId}').onWrite(async (change, context) => {
    const userId = context.params.userId;
    // If deleted
    if (!change.after.exists)
        return;
    const newData = change.after.data();
    if (!newData)
        return;
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
            }
            else {
                console.log(`ℹ️ No se encontraron riders asociados para la franquicia ${userId}.`);
            }
        }
    }
    catch (error) {
        console.error(`❌ Error en syncUserRole para ${userId}:`, error);
    }
});
//# sourceMappingURL=onUserWrite.js.map