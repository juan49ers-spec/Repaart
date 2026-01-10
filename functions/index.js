/* eslint-env node */
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Trigger: Cuando se crea o actualiza un usuario en Firestore (users_config),
 * sincronizamos su rol hacia Firebase Auth (Custom Claims).
 */
exports.syncUserRole = functions.firestore
    .document("users_config/{userId}")
    .onWrite(async (change, context) => {
        const userId = context.params.userId;

        // Si el documento fue borrado, revocamos permisos
        if (!change.after.exists) {
            console.log(`Revocando claims para usuario ${userId} (doc eliminado)`);
            return admin.auth().setCustomUserClaims(userId, null);
        }

        const newData = change.after.data();
        const oldData = change.before.exists ? change.before.data() : {};

        // Si el rol no ha cambiado, no hacemos nada (ahorramos cómputo)
        if (newData.role === oldData.role) {
            return null;
        }

        const role = newData.role;

        // Validación de seguridad: Solo permitimos roles conocidos
        const validRoles = ["admin", "franchise", "user"];

        if (!validRoles.includes(role)) {
            console.warn(`Rol inválido detectado: ${role} para usuario ${userId}`);
            return null;
        }

        try {
            // ESTA ES LA MAGIA: Asignamos el claim al token
            // También añadimos franchiseId si existe, para las reglas de tenencia
            const claims = {
                role: role,
                franchiseId: newData.franchiseId || null
            };

            await admin.auth().setCustomUserClaims(userId, claims);

            console.log(`Claims actualizados para ${userId}:`, claims);

            // Opcional: Forzar refresh de metadatos en Firestore para que el cliente sepa que ya ocurrió
            // await change.after.ref.set({ claimsSyncedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });


        } catch (error) {
            console.error("Error sincronizando claims:", error);
        }
    });

/**
 * EL VERDUGO AUTOMÁTICO Y LIMPIADOR 🪓🧹
 * 1. Borra de Auth.
 * 2. Borra el documento espejo en 'users_config' para no dejar basura.
 */
exports.deleteUserSync = functions.firestore
    .document('users/{userId}')
    .onDelete(async (snap, context) => {
        const userId = context.params.userId;
        const userData = snap.data(); // Guardamos data por si necesitamos logs

        console.log(`🗑️ Inicio de purga para usuario: ${userId} (${userData.email || 'No Email'})`);

        const promises = [];

        // 1. Borrar de Authentication (La llave)
        const deleteAuth = admin.auth().deleteUser(userId)
            .then(() => console.log(`✅ Auth eliminado: ${userId}`))
            .catch(err => {
                if (err.code === 'auth/user-not-found') console.log(`ℹ️ Auth ya no existía.`);
                else console.error(`❌ Error borrando Auth:`, err);
            });
        promises.push(deleteAuth);

        // 2. Borrar documento de configuración (La basura oculta)
        // Solo si tu arquitectura usa esta colección separada
        const deleteConfig = admin.firestore().collection('users_config').doc(userId).delete()
            .then(() => console.log(`✅ Configuración eliminada: ${userId}`))
            .catch(err => console.error(`❌ Error borrando Config:`, err));
        promises.push(deleteConfig);

        await Promise.all(promises);
        console.log(`🏁 Purga completada para ${userId}`);
    });


/**
 * EL AUDITOR MATEMÁTICO 🧮
 * Recalcula automáticamente las horas totales cada vez que cambian los turnos.
 * Garantiza que la facturación y nóminas se basen en datos reales, no en cálculos del frontend.
 */
exports.calculateWeekStats = functions.firestore
    .document('weeks/{weekId}')
    .onWrite(async (change, context) => {
        // 1. Si el documento fue borrado, no hay nada que calcular
        if (!change.after.exists) return null;

        const newData = change.after.data();
        const oldData = change.before.exists ? change.before.data() : {};

        // 2. Comprobación de Eficiencia:
        // Si el array de 'shifts' NO ha cambiado, no gastamos CPU recalculando.
        // Usamos JSON.stringify para una comparación rápida de contenido.
        const shiftsChanged = JSON.stringify(newData.shifts) !== JSON.stringify(oldData.shifts);

        if (!shiftsChanged) {
            return null;
        }

        console.log(`🔄 Cambio detectado en turnos de semana ${context.params.weekId}. Recalculando...`);

        // 3. La Matemática (La Verdad)
        let totalHours = 0;
        let totalShifts = 0;
        let assignedShifts = 0;

        if (newData.shifts && Array.isArray(newData.shifts)) {
            newData.shifts.forEach(shift => {
                if (shift.startAt && shift.endAt) {
                    const start = new Date(shift.startAt).getTime();
                    const end = new Date(shift.endAt).getTime();

                    // Diferencia en milisegundos
                    const durationMs = end - start;

                    // Convertir a horas (con decimales)
                    const durationHours = durationMs / (1000 * 60 * 60);

                    if (durationHours > 0) {
                        totalHours += durationHours;
                        totalShifts++;
                        if (shift.riderId) assignedShifts++;
                    }
                }
            });
        }

        // Redondear a 2 decimales para evitar errores de punto flotante (ej: 40.00)
        totalHours = Math.round(totalHours * 100) / 100;

        // 4. Protección contra bucles infinitos
        // Solo escribimos en la BD si el cálculo es diferente a lo que ya está guardado.
        if (totalHours === newData.totalHours && totalShifts === newData.totalShifts) {
            console.log(`✅ Los totales ya son correctos (${totalHours}h). Sin cambios.`);
            return null;
        }


        // 5. Estampar el Sello Oficial en la Semana
        await change.after.ref.update({
            totalHours: totalHours,
            totalShifts: totalShifts,
            assignedShifts: assignedShifts, // Útil para KPIs de ocupación
            statsUpdatedAt: admin.firestore.FieldValue.serverTimestamp() // Auditoría de tiempo
        });

        // 6. 🧠 EL CEREBRO FINANCIERO: Sincronización en Tiempo Real (Delta Update)
        // Calculamos la diferencia de horas para sumarla/restarla al mes correspondiente.
        const oldTotalHours = oldData.totalHours || 0;
        const deltaHours = totalHours - oldTotalHours;
        const deltaShifts = totalShifts - (oldData.totalShifts || 0);

        if (deltaHours === 0 && deltaShifts === 0) return null;

        console.log(`🧠 Sincronizando Finanzas: ${deltaHours}h delta para franquicia ${newData.franchiseId}`);

        try {
            const dateObj = new Date(newData.startDate);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // 01, 02...
            const financialDocId = `${newData.franchiseId}_${year}-${month}`;
            const financeRef = admin.firestore().collection('financial_data').doc(financialDocId);

            // Usamos set con merge para asegurar que el documento exista, 
            // pero increment es atómico, así que necesitamos saber si existe o inicializarlo.
            // Para ser atómicos "ciegos", usamos set con merge y FieldValue.increment

            await financeRef.set({
                franchiseId: newData.franchiseId,
                month: `${year}-${month}`,
                // Incrementamos atómicamente. Si el doc no existía, empieza en 0 + delta.
                totalOperationalHours: admin.firestore.FieldValue.increment(deltaHours),
                totalShiftsCount: admin.firestore.FieldValue.increment(deltaShifts),
                lastSyncAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log(`✅ Finanzas actualizadas: ${financialDocId}`);

        } catch (err) {
            console.error(`❌ Error sincronizando finanzas:`, err);
        }

        return null;
    });
