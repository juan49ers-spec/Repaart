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
exports.adminDeleteUser = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
/**
 * Admin Delete User
 * Elimina completamente un usuario de Auth y Firestore
 * Solo puede ser llamada por usuarios con role 'admin'
 */
exports.adminDeleteUser = functions.https.onCall(async (data, context) => {
    var _a, _b;
    const uid = data.uid;
    if (!uid || typeof uid !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'UID del usuario es requerido');
    }
    // Verificar que el usuario que hace la llamada es admin
    const callerUid = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!callerUid) {
        throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
    }
    const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
    if (!callerDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Usuario no encontrado');
    }
    const callerRole = (_b = callerDoc.data()) === null || _b === void 0 ? void 0 : _b.role;
    if (callerRole !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Solo administradores pueden eliminar usuarios');
    }
    console.log(`🗑️ Iniciando eliminación completa del usuario: ${uid}`);
    try {
        // 1. Eliminar usuario de Firebase Auth
        try {
            await admin.auth().deleteUser(uid);
            console.log(`✅ Usuario ${uid} eliminado de Firebase Auth`);
        }
        catch (authError) {
            if (authError.code === 'auth/user-not-found') {
                console.log(`⚠️ Usuario ${uid} no existe en Firebase Auth, continuando...`);
            }
            else {
                throw authError;
            }
        }
        // 2. Eliminar documento de Firestore
        await admin.firestore().collection('users').doc(uid).delete();
        console.log(`✅ Documento de usuario ${uid} eliminado de Firestore`);
        return { success: true, message: 'Usuario eliminado completamente' };
    }
    catch (error) {
        console.error(`❌ Error eliminando usuario ${uid}:`, error);
        throw new functions.https.HttpsError('internal', 'Error al eliminar usuario');
    }
});
//# sourceMappingURL=adminDeleteUser.js.map