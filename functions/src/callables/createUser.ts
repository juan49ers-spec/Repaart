import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

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

        console.log(`✅ Usuario creado exitosamente: ${email} (${role}) por ${callerUid}`);

        return { uid: newUid, message: 'Usuario creado correctamente' };

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
