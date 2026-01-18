/* eslint-env node */
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Trigger: Cuando se crea o actualiza un usuario en Firestore (users_config),
 * sincronizamos su rol hacia Firebase Auth (Custom Claims).
 */
exports.syncUserRole = functions.firestore
    .document('users/{userId}')
    .onWrite(async (change, context) => {
        const userId = context.params.userId;

        // Si el documento fue borrado, no hacemos nada (deleteUserSync ya se encarga de limpiar Auth)
        if (!change.after.exists) return null;

        const newData = change.after.data();
        const role = newData.role;
        const franchiseId = newData.franchiseId;

        // Solo sincronizamos si hay rol
        if (!role) {
            console.log(`⚠️ Usuario ${userId} sin rol. Claims no actualizados.`);
            return null;
        }

        try {
            // Sincronizar Custom Claims
            const claims = { role, franchiseId: franchiseId || null };
            await admin.auth().setCustomUserClaims(userId, claims);
            console.log(`✅ Claims sincronizados para ${userId}:`, claims);
        } catch (error) {
            console.error(`❌ Error sincronizando claims para ${userId}:`, error);
        }

        return null;
    });


/**
 * CREACIÓN SEGURA DE USUARIOS (BACKEND AUTHORITY) 🛡️
 * Reemplaza la creación insegura desde el cliente via Auth secundario.
 * Valida roles y asigna claims desde el nacimiento.
 */
exports.createUserManaged = functions.https.onCall(async (data, context) => {
    // 1. Verificación de Autenticación
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debe estar autenticado para crear usuarios.');
    }

    const callerUid = context.auth.uid;
    const callerRole = context.auth.token.role || 'user';
    const callerFranchiseId = context.auth.token.franchiseId;

    const { email, password, role, franchiseId, ...profileData } = data;

    // 2. Validación de Permisos (Security Gate)
    if (callerRole === 'admin') {
        // Admin puede crear cualquier cosa
    } else if (callerRole === 'franchise') {
        // Franquicia SOLO puede crear 'rider' y SOLO para su propia franquicia
        if (role !== 'rider') {
            throw new functions.https.HttpsError('permission-denied', 'Las franquicias solo pueden crear Riders.');
        }
        if (franchiseId !== callerFranchiseId) {
            throw new functions.https.HttpsError('permission-denied', 'No puede crear usuarios para otra franquicia.');
        }
    } else {
        throw new functions.https.HttpsError('permission-denied', 'No tiene permisos para crear usuarios.');
    }

    // 3. Validación de Datos Mínimos
    if (!email || !password || !role) {
        throw new functions.https.HttpsError('invalid-argument', 'Faltan datos requeridos (email, password, role).');
    }

    try {
        // 4. Crear Usuario en Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: profileData.displayName || '',
            phoneNumber: profileData.phoneNumber || undefined,
            disabled: false
        });

        const newUid = userRecord.uid;

        // 5. Asignar Custom Claims INMEDIATAMENTE (Sin esperar al sync)
        const claims = { role, franchiseId: franchiseId || null };
        await admin.auth().setCustomUserClaims(newUid, claims);

        // 6. Crear Perfil en Firestore (Single Source of Truth)
        const userProfile = {
            uid: newUid,
            email,
            role,
            franchiseId: franchiseId || null,
            status: profileData.status || 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            // Copiar resto de datos (name, cif, etc. si vienen)
            ...profileData
        };

        // Limpiar undefineds
        Object.keys(userProfile).forEach(key => userProfile[key] === undefined && delete userProfile[key]);

        await admin.firestore().collection('users').doc(newUid).set(userProfile);

        console.log(`✅ Usuario creado exitosamente: ${email} (${role}) por ${callerUid}`);

        return { uid: newUid, message: 'Usuario creado correctamente' };

    } catch (error) {
        console.error("❌ Error creando usuario gestionado:", error);

        // ROLLBACK: If Auth was created but Firestore failed, delete the Orphan Auth User
        try {
            const userCheck = await admin.auth().getUserByEmail(email);
            if (userCheck) {
                await admin.auth().deleteUser(userCheck.uid);
                console.log(`↩️ Rollback exitoso: Usuario Auth eliminado tras fallo en BD.`);
            }
        } catch (rollbackError) {
            console.error("💀 FALLO CRÍTICO EN ROLLBACK: Usuario Auth huérfano posible.", rollbackError);
        }

        // Mapear errores de Auth a HttpsError
        if (error.code === 'auth/email-already-exists') {
            throw new functions.https.HttpsError('already-exists', 'El email ya está en uso.');
        }
        throw new functions.https.HttpsError('internal', error.message || 'Error interno al crear usuario.');
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

/**
 * 🚨 INCIDENT ALERT TRIGGER 🚨
 * Notifies admin/franchise immediately when a rider reports an issue.
 */
exports.onIncidentCreated = functions.firestore
    .document('incidents/{incidentId}')
    .onCreate(async (snap, context) => {
        const data = snap.data();
        const incidentId = context.params.incidentId;

        console.log(`🚨 Nuevo Incidente Reportado [${incidentId}]`);
        console.log(`👤 Rider ID: ${data.riderId}`);
        console.log(`🏢 Franquicia: ${data.franchiseId || 'N/A'}`);
        console.log(`⚠️ Tipo: ${data.type} (${data.isUrgent ? 'URGENTE' : 'Normal'})`);
        console.log(`📝 Descripción: ${data.description}`);

        // Create In-App Notification for Franchise
        if (data.franchiseId) {
            // 🔍 Recuperar nombre del Rider para personalizar mensaje
            let riderName = 'Rider';
            try {
                if (data.riderId) {
                    const riderSnap = await admin.firestore().collection('users').doc(data.riderId).get();
                    if (riderSnap.exists) {
                        const rData = riderSnap.data();
                        riderName = rData.displayName || rData.email || 'Rider';
                    }
                }
            } catch (err) {
                console.error("⚠️ Error recuperando nombre rider:", err);
            }

            const notificationPayload = {
                userId: data.franchiseId, // Target the franchise user
                type: 'incident',
                priority: data.isUrgent ? 'high' : 'normal',
                title: `Nuevo Incidente: ${data.isUrgent ? '🚨 URGENTE' : 'Reporte'}`,
                message: `${riderName} reportó: ${data.description.substring(0, 50)}${data.description.length > 50 ? '...' : ''}`,
                link: '/franchise/incidents', // Deeplink (conceptual)
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                metadata: {
                    incidentId: incidentId,
                    riderId: data.riderId,
                    vehicleId: data.vehicleId || null
                }
            };

            await admin.firestore().collection('notifications').add(notificationPayload);
            console.log(`🔔 Notificación enviada a Franquicia: ${data.franchiseId}`);
        } else {
            // Notify Global Admin if no franchise (or fallback)
            const adminNotification = {
                type: 'ALERT',
                franchiseId: 'GLOBAL',
                franchiseName: 'System',
                priority: 'high',
                title: 'Incidente sin Franquicia',
                message: `Incidente ${incidentId} sin franchiseId asignado. Revisar inmediatamente.`,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };
            await admin.firestore().collection('admin_notifications').add(adminNotification);
        }

        // 📧 EMAIL NOTIFICATION (Only for Urgent)
        if (data.isUrgent) {
            try {
                // Configurar transporter (Usar Variables de Entorno en Prod)
                const nodemailer = require('nodemailer');
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER || 'alertas@repaart.es',
                        pass: process.env.EMAIL_PASS || 'tu_password_app'
                    }
                });

                // Buscar email de la Franquicia
                let franchiseEmail = 'admin@repaart.es'; // Fallback
                if (data.franchiseId) {
                    const franchiseSnap = await admin.firestore().collection('users').doc(data.franchiseId).get();
                    if (franchiseSnap.exists) {
                        franchiseEmail = franchiseSnap.data().email;
                    }
                }

                const mailOptions = {
                    from: '"Repaart Ops 🚨" <alertas@repaart.es>',
                    to: franchiseEmail,
                    subject: `🚨 INCIDENTE URGENTE: ${data.vehicleId || 'Vehículo'}`,
                    html: `
                        <h3>Nuevo Incidente Urgente</h3>
                        <p><strong>Rider:</strong> ${riderName} (ID: ${data.riderId})</p>
                        <p><strong>Vehículo:</strong> ${data.vehicleId || 'N/A'}</p>
                        <p><strong>Descripción:</strong> ${data.description}</p>
                        <p><strong>Hora:</strong> ${new Date().toLocaleString()}</p>
                        <br>
                        <a href="https://repaartfinanzas.firebaseapp.com/franchise/incidents">Ver en Panel</a>
                    `
                };

                // Enviar (Solo si tenemos credenciales reales, envuelto en try para no romper la función)
                if (process.env.EMAIL_USER) {
                    await transporter.sendMail(mailOptions);
                    console.log(`📧 Email urgente enviado a: ${franchiseEmail}`);
                } else {
                    console.log(`ℹ️ Email skipped (Missing EMAIL_USER env var). Would send to: ${franchiseEmail}`);
                }

            } catch (emailError) {
                console.error("❌ Error enviando email:", emailError);
            }
        }

        return null;
    });
