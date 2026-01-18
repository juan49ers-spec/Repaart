import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

export const calculateWeekStats = functions.firestore.document('weeks/{weekId}').onWrite(async (change, context) => {
    // 1. If deleted
    if (!change.after.exists) return;

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
        newData.shifts.forEach((shift: any) => {
            if (shift.startAt && shift.endAt) {
                const start = new Date(shift.startAt).getTime();
                const end = new Date(shift.endAt).getTime();
                const durationMs = end - start;
                const durationHours = durationMs / (1000 * 60 * 60);

                if (durationHours > 0) {
                    totalHours += durationHours;
                    totalShifts++;
                    if (shift.riderId) assignedShifts++;
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

    if (deltaHours === 0 && deltaShifts === 0) return;

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
        } catch (err) {
            console.error(`❌ Error sincronizando finanzas:`, err);
        }
    }
});
