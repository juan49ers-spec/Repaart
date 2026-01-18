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
exports.calculateWeekStats = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
exports.calculateWeekStats = functions.firestore.document('weeks/{weekId}').onWrite(async (change, context) => {
    // 1. If deleted
    if (!change.after.exists)
        return;
    const newData = change.after.data() || {};
    const oldData = change.before.data() || {};
    // 2. Efficiency Check
    if (JSON.stringify(newData.shifts) === JSON.stringify(oldData.shifts)) {
        return;
    }
    console.log(`🔄 Cambio detectado en turnos de semana ${context.params.weekId}. Recalculando...`);
    // 3. Math Logic
    let totalHours = 0;
    let totalShifts = 0;
    let assignedShifts = 0;
    if (newData.shifts && Array.isArray(newData.shifts)) {
        newData.shifts.forEach((shift) => {
            if (shift.startAt && shift.endAt) {
                const start = new Date(shift.startAt).getTime();
                const end = new Date(shift.endAt).getTime();
                const durationMs = end - start;
                const durationHours = durationMs / (1000 * 60 * 60);
                if (durationHours > 0) {
                    totalHours += durationHours;
                    totalShifts++;
                    if (shift.riderId)
                        assignedShifts++;
                }
            }
        });
    }
    // Round to 2 decimals
    totalHours = Math.round(totalHours * 100) / 100;
    // 4. Infinite Loop Protection
    if (totalHours === newData.totalHours && totalShifts === newData.totalShifts) {
        console.log(`✅ Los totales ya son correctos (${totalHours}h). Sin cambios.`);
        return;
    }
    // 5. Update Week Document
    await change.after.ref.update({
        totalHours: totalHours,
        totalShifts: totalShifts,
        assignedShifts: assignedShifts,
        statsUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    // 6. Financial Sync (Delta Update)
    const oldTotalHours = oldData.totalHours || 0;
    const deltaHours = totalHours - oldTotalHours;
    const deltaShifts = totalShifts - (oldData.totalShifts || 0);
    if (deltaHours === 0 && deltaShifts === 0)
        return;
    if (newData.franchiseId) {
        console.log(`🧠 Sincronizando Finanzas: ${deltaHours}h delta para franquicia ${newData.franchiseId}`);
        try {
            const dateObj = new Date(newData.startDate);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const financialDocId = `${newData.franchiseId}_${year}-${month}`;
            const financeRef = admin.firestore().collection('financial_data').doc(financialDocId);
            await financeRef.set({
                franchiseId: newData.franchiseId,
                month: `${year}-${month}`,
                totalOperationalHours: admin.firestore.FieldValue.increment(deltaHours),
                totalShiftsCount: admin.firestore.FieldValue.increment(deltaShifts),
                lastSyncAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log(`✅ Finanzas actualizadas: ${financialDocId}`);
        }
        catch (err) {
            console.error(`❌ Error sincronizando finanzas:`, err);
        }
    }
});
//# sourceMappingURL=onWeekWrite.js.map