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
exports.adminDeleteUser = exports.scheduledDataRetention = exports.archiveOldAuditLogs = exports.archiveOldTickets = exports.archiveOldNotifications = exports.createFranchise = exports.deleteUserSync = exports.onIncidentCreated = exports.calculateWeekStats = exports.createUserManaged = exports.syncUserRole = void 0;
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
// Export Triggers
var onUserWrite_1 = require("./triggers/onUserWrite");
Object.defineProperty(exports, "syncUserRole", { enumerable: true, get: function () { return onUserWrite_1.syncUserRole; } });
var createUser_1 = require("./callables/createUser");
Object.defineProperty(exports, "createUserManaged", { enumerable: true, get: function () { return createUser_1.createUserManaged; } });
var onWeekWrite_1 = require("./triggers/onWeekWrite");
Object.defineProperty(exports, "calculateWeekStats", { enumerable: true, get: function () { return onWeekWrite_1.calculateWeekStats; } });
var onIncident_1 = require("./triggers/onIncident");
Object.defineProperty(exports, "onIncidentCreated", { enumerable: true, get: function () { return onIncident_1.onIncidentCreated; } });
var onUserDelete_1 = require("./triggers/onUserDelete");
Object.defineProperty(exports, "deleteUserSync", { enumerable: true, get: function () { return onUserDelete_1.deleteUserSync; } });
// Export Callable Functions
var createFranchise_1 = require("./callables/createFranchise");
Object.defineProperty(exports, "createFranchise", { enumerable: true, get: function () { return createFranchise_1.createFranchise; } });
var dataRetention_1 = require("./callables/dataRetention");
Object.defineProperty(exports, "archiveOldNotifications", { enumerable: true, get: function () { return dataRetention_1.archiveOldNotifications; } });
Object.defineProperty(exports, "archiveOldTickets", { enumerable: true, get: function () { return dataRetention_1.archiveOldTickets; } });
Object.defineProperty(exports, "archiveOldAuditLogs", { enumerable: true, get: function () { return dataRetention_1.archiveOldAuditLogs; } });
Object.defineProperty(exports, "scheduledDataRetention", { enumerable: true, get: function () { return dataRetention_1.scheduledDataRetention; } });
var adminDeleteUser_1 = require("./callables/adminDeleteUser");
Object.defineProperty(exports, "adminDeleteUser", { enumerable: true, get: function () { return adminDeleteUser_1.adminDeleteUser; } });
// Force rebuild - v2
//# sourceMappingURL=index.js.map