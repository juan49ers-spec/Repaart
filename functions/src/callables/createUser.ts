import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import { buildClaims, UserRole, UserStatus } from '../utils/claims';

// Interface for input data
interface CreateUserRequest {
    email: string;
    password: string;
    role: UserRole;
    franchiseId?: string;
    displayName?: string;
    phoneNumber?: string;
    status?: UserStatus;
    [key: string]: any; // Allow other profile data
}

export const createUserManaged = functions.region('us-central1').https.onCall(async (data: CreateUserRequest, context) => {
    // 1. Authentication Check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debe estar autenticado para crear usuarios.');
    }

    const callerRole = (context.auth.token.role as UserRole) || 'user';
    const callerFranchiseId = context.auth.token.franchiseId as string | undefined;

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

    // Validation for franchise/rider roles: franchiseId is mandatory
    if ((role === 'franchise' || role === 'rider') && !franchiseId && role !== 'franchise') {
        // If role is franchise, we generate the ID later, but for rider it must be provided or taken from caller
        if (!franchiseId && callerRole !== 'franchise') {
            throw new functions.https.HttpsError('invalid-argument', 'franchiseId es obligatorio para el rol Rider.');
        }
    }

    let newUid: string | null = null;
    let finalFranchiseId: string | null = null;

    try {
        // 4. Create Auth User
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: profileData.displayName || '',
            phoneNumber: profileData.phoneNumber || undefined,
            disabled: false
        });

        newUid = userRecord.uid;

        // 5. AUTO-GENERATE FRANCHISE ID (Correlative) for new franchises
        finalFranchiseId = franchiseId || (callerRole === 'franchise' ? (callerFranchiseId ?? null) : null);

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

        // 6. Set Custom Claims IMMEDIATE using buildClaims (SSoT)
        const finalStatus = (profileData.status as UserStatus) || 'active';
        const claims = buildClaims({
            role,
            status: finalStatus,
            franchiseId: finalFranchiseId
        });

        await admin.auth().setCustomUserClaims(newUid, claims);

        // 7. Create Firestore Mirror
        // SECURITY: Strict whitelist to prevent injecting unsanitized data (e.g. passwords)
        const allowedFields = ['displayName', 'phoneNumber', 'cif', 'legalName', 'address', 'pack', 'settings'];
        const sanitizedProfileData: any = {};
        
        for (const field of allowedFields) {
            if (profileData[field] !== undefined) {
                sanitizedProfileData[field] = profileData[field];
            }
        }

        const userProfile: any = {
            uid: newUid,
            email,
            role,
            status: finalStatus,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: context.auth.uid,
            ...sanitizedProfileData
        };

        if (finalFranchiseId) {
            userProfile.franchiseId = finalFranchiseId;
        }

        // Clean undefineds
        Object.keys(userProfile).forEach(key => userProfile[key] === undefined && delete userProfile[key]);

        await admin.firestore().collection('users').doc(newUid).set(userProfile);

        // 7.1. CREATE PRACTICE RIDERS (If Franchise)
        if (role === 'franchise' && finalFranchiseId) {
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
                    email: `rider${index + 1}.${finalFranchiseId}@repaart.sim`,
                    displayName: rider.name,
                    role: 'rider',
                    franchiseId: finalFranchiseId,
                    status: 'active',
                    isSimulated: true,
                    contractHours: 20,
                    licenseType: index % 2 === 0 ? '125cc' : '49cc',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });
            await batch.commit();
        }

        // 8. Audit Logging
        await admin.firestore().collection('audit_logs').add({
            action: 'CREATE_USER',
            targetUid: newUid,
            role,
            email,
            performedBy: context.auth.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // 9. Send Welcome Email (logic unchanged)
        try {
            const gmailEmail = process.env.GMAIL_EMAIL;
            const gmailPassword = process.env.GMAIL_PASSWORD;
            if (gmailEmail && gmailPassword) {
                const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: gmailEmail, pass: gmailPassword } });
                const loginUrl = 'https://repaartfinanzas.web.app';
                const mailOptions = {
                    from: 'Repaart App <noreply@repaart.com>',
                    to: email,
                    subject: '🚀 Bienvenido a Repaart - Tus Credenciales',
                    html: `<h1>Bienvenido a Repaart</h1><p>Tu cuenta ha sido creada. Usuario: ${email}, Password: ${password}</p><a href="${loginUrl}">Ir a Repaart</a>`
                };
                await transporter.sendMail(mailOptions);
            }
        } catch (e) { console.error('Email error:', e); }

        return { uid: newUid, message: 'Usuario creado correctamente' };

    } catch (error: any) {
        console.error("❌ Error creando usuario gestionado:", error);

        // Rollback Completo: Auth User, Firestore User Document & Practice Riders
        if (newUid && error.code !== 'auth/email-already-exists') {
            try {
                // 1. Rollback Auth
                await admin.auth().deleteUser(newUid);
                console.log(`[createUserManaged] Rollback exitoso para Auth user: ${newUid}`);

                // 2. Rollback Firestore User Doc
                await admin.firestore().collection('users').doc(newUid).delete();
                console.log(`[createUserManaged] Rollback exitoso para Firestore doc users/${newUid}`);

                // 3. Rollback Practice Riders (si es franquicia y se generó un ID)
                if (role === 'franchise' && finalFranchiseId) {
                    const batch = admin.firestore().batch();
                    for (let i = 1; i <= 4; i++) {
                        const riderId = `${finalFranchiseId}_rider_${i}`;
                        const riderRef = admin.firestore().collection('users').doc(riderId);
                        batch.delete(riderRef);
                    }
                    await batch.commit();
                    console.log(`[createUserManaged] Rollback exitoso para practice riders de franquicia ${finalFranchiseId}`);
                }
            } catch (rollbackError) {
                console.error(`[createUserManaged] CRÍTICO: Fallo al hacer rollback completo del usuario: ${newUid}`, rollbackError);
            }
        }

        if (error.code === 'auth/email-already-exists') {
            throw new functions.https.HttpsError('already-exists', 'El email ya está en uso.');
        }
        throw new functions.https.HttpsError('internal', error.message || 'Error interno al crear usuario.');
    }
});
