"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDeleteUser = void 0;
var functions = require("firebase-functions/v1");
var admin = require("firebase-admin");
/**
 * Admin Delete User
 * Elimina completamente un usuario de Auth y Firestore
 * Solo puede ser llamada por usuarios con role 'admin'
 */
exports.adminDeleteUser = functions.https.onCall(function (data, context) { return __awaiter(void 0, void 0, void 0, function () {
    var uid, callerUid, callerDoc, callerRole, authError_1, error_1;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                uid = data.uid;
                if (!uid || typeof uid !== 'string') {
                    throw new functions.https.HttpsError('invalid-argument', 'UID del usuario es requerido');
                }
                callerUid = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid;
                if (!callerUid) {
                    throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
                }
                return [4 /*yield*/, admin.firestore().collection('users').doc(callerUid).get()];
            case 1:
                callerDoc = _c.sent();
                if (!callerDoc.exists) {
                    throw new functions.https.HttpsError('not-found', 'Usuario no encontrado');
                }
                callerRole = (_b = callerDoc.data()) === null || _b === void 0 ? void 0 : _b.role;
                if (callerRole !== 'admin') {
                    throw new functions.https.HttpsError('permission-denied', 'Solo administradores pueden eliminar usuarios');
                }
                console.log("\uD83D\uDDD1\uFE0F Iniciando eliminaci\u00F3n completa del usuario: ".concat(uid));
                _c.label = 2;
            case 2:
                _c.trys.push([2, 8, , 9]);
                _c.label = 3;
            case 3:
                _c.trys.push([3, 5, , 6]);
                return [4 /*yield*/, admin.auth().deleteUser(uid)];
            case 4:
                _c.sent();
                console.log("\u2705 Usuario ".concat(uid, " eliminado de Firebase Auth"));
                return [3 /*break*/, 6];
            case 5:
                authError_1 = _c.sent();
                // Si el usuario no existe en Auth, continuar con eliminación de Firestore
                if (authError_1.code === 'auth/user-not-found') {
                    console.log("\u26A0\uFE0F Usuario ".concat(uid, " no existe en Firebase Auth, continuando..."));
                }
                else {
                    throw authError_1;
                }
                return [3 /*break*/, 6];
            case 6: 
            // 2. Eliminar documento de Firestore
            return [4 /*yield*/, admin.firestore().collection('users').doc(uid).delete()];
            case 7:
                // 2. Eliminar documento de Firestore
                _c.sent();
                console.log("\u2705 Documento de usuario ".concat(uid, " eliminado de Firestore"));
                // 3. Eliminar registros relacionados (opcional)
                // - schedules
                // - shifts
                // - incidents
                // Estos pueden ser limpiados por data retention policies
                return [2 /*return*/, { success: true, message: 'Usuario eliminado completamente' }];
            case 8:
                error_1 = _c.sent();
                console.error("\u274C Error eliminando usuario ".concat(uid, ":"), error_1);
                throw new functions.https.HttpsError('internal', 'Error al eliminar usuario');
            case 9: return [2 /*return*/];
        }
    });
}); });
