import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

// Interface for input data
interface CreateUserRequest {
    email: string;
    password: string;
    role: string;
    franchiseId?: string;
    displayName?: string;
    phoneNumber?: string;
    status?: string;
    [key: string]: any; // Allow other profile data
}

export const createUserManaged = functions.https.onCall(async (data: CreateUserRequest, context) => {
    // 1. Authentication Check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debe estar autenticado para crear usuarios.');
    }

    const callerUid = context.auth.uid;
    const callerRole = context.auth.token.role || 'user';
    const callerFranchiseId = context.auth.token.franchiseId;

    const { email, password, role, franchiseId, ...profileData } = data;

    // 2. Permission Check (Security Gate)
    if (callerRole === 'admin') {
        // Admin can create anything
    } else if (callerRole === 'franchise') {
        // Franchise specific checks
        if (role !== 'rider') {
            throw new functions.https.HttpsError('permission-denied', 'Las franquicias solo pueden crear Riders.');
        }
        if (franchiseId !== callerFranchiseId) {
            throw new functions.https.HttpsError('permission-denied', 'No puede crear usuarios para otra franquicia.');
        }
    } else {
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

        // 5. AUTO-GENERATE FRANCHISE ID (Correlative)
        let finalFranchiseId = franchiseId || null;

        if (role === 'franchise') {
            console.log(`[createUserManaged] Role is franchise, generating sequential ID...`);
            const counterRef = admin.firestore().collection('metadata').doc('counters');

            finalFranchiseId = await admin.firestore().runTransaction(async (transaction) => {
                const counterSnap = await transaction.get(counterRef);
                let nextNum = 1;

                if (counterSnap.exists) {
                    nextNum = (counterSnap.data()?.franchiseCount || 0) + 1;
                }

                transaction.set(counterRef, { franchiseCount: nextNum }, { merge: true });

                // Format: F-0001
                const paddedNum = String(nextNum).padStart(4, '0');
                return `F-${paddedNum}`;
            });
            console.log(`[createUserManaged] Generated ID: ${finalFranchiseId}`);
        }

        // 6. Set Custom Claims IMMEDIATE
        const claims = { role, franchiseId: finalFranchiseId };
        await admin.auth().setCustomUserClaims(newUid, claims);

        // 7. Create Firestore Profile
        const userProfile: any = {
            uid: newUid,
            email,
            role,
            franchiseId: finalFranchiseId,
            status: profileData.status || 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            ...profileData
        };

        // Clean undefineds
        Object.keys(userProfile).forEach(key => userProfile[key] === undefined && delete userProfile[key]);

        await admin.firestore().collection('users').doc(newUid).set(userProfile);

        // 7.1. CREATE PRACTICE RIDERS (If Franchise)
        if (role === 'franchise' && finalFranchiseId) {
            console.log(`[createUserManaged] Creating practice riders for franchise ${finalFranchiseId}...`);
            const practiceRiders = [
                { name: 'Ana García', color: 'bg-emerald-500' },
                { name: 'Carlos Ruiz', color: 'bg-blue-500' },
                { name: 'Lucía Mendez', color: 'bg-indigo-500' },
                { name: 'David Torres', color: 'bg-rose-500' }
            ];

            const batch = admin.firestore().batch();

            practiceRiders.forEach((rider, index) => {
                const riderId = `${finalFranchiseId}_rider_${index + 1}`;
                const riderRef = admin.firestore().collection('users').doc(riderId);

                batch.set(riderRef, {
                    uid: riderId,
                    email: `rider${index + 1}.${finalFranchiseId}@repaart.sim`, // Dummy email
                    displayName: rider.name,
                    role: 'rider',
                    franchiseId: finalFranchiseId,
                    status: 'active',
                    isSimulated: true, // Flag for easy cleanup
                    contractHours: 20, // Part-time simulation
                    licenseType: index % 2 === 0 ? '125cc' : '49cc', // Mixed fleet
                    metrics: {
                        totalDeliveries: 0,
                        rating: 5.0,
                        efficiency: 100,
                        joinedAt: admin.firestore.FieldValue.serverTimestamp()
                    },
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });

            await batch.commit();
            console.log(`✅ 4 Riders de práctica creados para ${finalFranchiseId}`);
        }

        console.log(`✅ Usuario creado exitosamente: ${email} (${role}) por ${callerUid}`);

        // 8. Send Welcome Email
        let emailSent = false;
        try {
            const gmailEmail = process.env.GMAIL_EMAIL;
            const gmailPassword = process.env.GMAIL_PASSWORD;

            if (gmailEmail && gmailPassword) {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: gmailEmail,
                        pass: gmailPassword
                    }
                });

                const loginUrl = 'https://repaartfinanzas.web.app';
                const mailOptions = {
                    from: 'Repaart App <noreply@repaart.com>',
                    to: email,
                    subject: '🚀 Bienvenido a Repaart - Tus Credenciales',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h1 style="color: #10b981;">Bienvenido a Repaart</h1>
                            <p>Hola <strong>${profileData.displayName || 'Usuario'}</strong>,</p>
                            <p>Tu cuenta ha sido creada exitosamente. Aquí tienes tus credenciales de acceso:</p>
                            
                            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 5px 0;"><strong>Usuario:</strong> ${email}</p>
                                <p style="margin: 5px 0;"><strong>Contraseña:</strong> ${password}</p>
                                <p style="margin: 5px 0;"><strong>Rol:</strong> ${role.toUpperCase()}</p>
                            </div>

                            <p>Puedes acceder a la plataforma aquí:</p>
                            <a href="${loginUrl}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                Ir a Repaart
                            </a>

                            <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
                                Por seguridad, te recomendamos cambiar tu contraseña al iniciar sesión por primera vez.
                            </p>
                        </div>
                    `
                };

                await transporter.sendMail(mailOptions);
                console.log(`📧 Email de bienvenida enviado a ${email}`);
                emailSent = true;
            } else {
                console.warn('⚠️ No hay credenciales de Gmail configuradas. Email de bienvenida no enviado.');
            }
        } catch (emailError) {
            console.error('❌ Error enviando email de bienvenida:', emailError);
            // No hacemos throw aquí para no fallar la creación del usuario si solo falla el email
        }

        return { uid: newUid, message: 'Usuario creado correctamente', emailSent };

    } catch (error: any) {
        console.error("❌ Error creando usuario gestionado:", error);

        // ROLLBACK Logic
        try {
            const userCheck = await admin.auth().getUserByEmail(email);
            if (userCheck) {
                await admin.auth().deleteUser(userCheck.uid);
                console.log(`↩️ Rollback exitoso: Usuario Auth eliminado tras fallo en BD.`);
            }
        } catch (rollbackError) {
            console.error("💀 FALLO CRÍTICO EN ROLLBACK: Usuario Auth huérfano posible.", rollbackError);
        }

        // Map errors
        if (error.code === 'auth/email-already-exists' || error.message?.includes('email-already-exists')) {
            throw new functions.https.HttpsError('already-exists', 'El email ya está en uso.');
        }
        throw new functions.https.HttpsError('internal', error.message || 'Error interno al crear usuario.');
    }
});
