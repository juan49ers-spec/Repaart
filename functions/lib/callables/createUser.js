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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserManaged = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
exports.createUserManaged = functions.https.onCall(async (data, context) => {
    var _a;
    // 1. Authentication Check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debe estar autenticado para crear usuarios.');
    }
    const callerUid = context.auth.uid;
    const callerRole = context.auth.token.role || 'user';
    const callerFranchiseId = context.auth.token.franchiseId;
    const { email, password, role, franchiseId } = data, profileData = __rest(data, ["email", "password", "role", "franchiseId"]);
    // 2. Permission Check (Security Gate)
    if (callerRole === 'admin') {
        // Admin can create anything
    }
    else if (callerRole === 'franchise') {
        // Franchise specific checks
        if (role !== 'rider') {
            throw new functions.https.HttpsError('permission-denied', 'Las franquicias solo pueden crear Riders.');
        }
        if (franchiseId !== callerFranchiseId) {
            throw new functions.https.HttpsError('permission-denied', 'No puede crear usuarios para otra franquicia.');
        }
    }
    else {
        throw new functions.https.HttpsError('permission-denied', 'No tiene permisos para crear usuarios.');
    }
    // 3. Validation
    if (!email || !password || !role) {
        throw new functions.https.HttpsError('invalid-argument', 'Faltan datos requeridos (email, password, role).');
    }
    try {
        // 4. Create Auth User
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: profileData.displayName || '',
            phoneNumber: profileData.phoneNumber || undefined,
            disabled: false
        });
        const newUid = userRecord.uid;
        // 5. Set Custom Claims IMMEDIATE
        const claims = { role, franchiseId: franchiseId || null };
        await admin.auth().setCustomUserClaims(newUid, claims);
        // 6. Create Firestore Profile
        const userProfile = Object.assign({ uid: newUid, email,
            role, franchiseId: franchiseId || null, status: profileData.status || 'active', createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, profileData);
        // Clean undefineds
        Object.keys(userProfile).forEach(key => userProfile[key] === undefined && delete userProfile[key]);
        await admin.firestore().collection('users').doc(newUid).set(userProfile);
        console.log(`✅ Usuario creado exitosamente: ${email} (${role}) por ${callerUid}`);
        return { uid: newUid, message: 'Usuario creado correctamente' };
    }
    catch (error) {
        console.error("❌ Error creando usuario gestionado:", error);
        // ROLLBACK Logic
        try {
            const userCheck = await admin.auth().getUserByEmail(email);
            if (userCheck) {
                await admin.auth().deleteUser(userCheck.uid);
                console.log(`↩️ Rollback exitoso: Usuario Auth eliminado tras fallo en BD.`);
            }
        }
        catch (rollbackError) {
            console.error("💀 FALLO CRÍTICO EN ROLLBACK: Usuario Auth huérfano posible.", rollbackError);
        }
        // Map errors
        if (error.code === 'auth/email-already-exists' || ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('email-already-exists'))) {
            throw new functions.https.HttpsError('already-exists', 'El email ya está en uso.');
        }
        throw new functions.https.HttpsError('internal', error.message || 'Error interno al crear usuario.');
    }
});
//# sourceMappingURL=createUser.js.map