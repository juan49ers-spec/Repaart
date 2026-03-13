/**
 * Remediation script for exposed user credentials.
 * This script runs locally using the Admin SDK to:
 * 1. Read all users from Firestore.
 * 2. If a `password` field exists in the document:
 *    a. Force sync the password into Firebase Auth.
 *    b. Delete the `password` field permanently from Firestore.
 * 
 * Usage: node scripts/remediate_credentials.mjs
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Load Service Account correctly for ES Modules
const serviceAccount = JSON.parse(readFileSync(new URL('../service-account.json', import.meta.url)));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const auth = admin.auth();

async function remediateCredentials() {
    console.log("🚀 Iniciando remediación de credenciales (Data Scrubbing)...");
    
    let totalUsers = 0;
    let remediated = 0;
    let failed = 0;

    try {
        const usersSnapshot = await db.collection('users').get();
        totalUsers = usersSnapshot.size;
        console.log(`Encontrados ${totalUsers} documentos de usuario para auditar.\n`);

        for (const doc of usersSnapshot.docs) {
            const data = doc.data();
            const uid = doc.id;
            
            if (data.password) {
                console.log(`[!] Detectada contraseña expuesta en el usuario: ${uid} (${data.email || 'Sin email'})`);
                
                try {
                    // Paso 1: Sincronizar Auth
                    // Esto nos asegura que el franquiciado podrá entrar y soluciona el "Credenciales incorrectas"
                    await auth.updateUser(uid, {
                        password: data.password
                    });
                    console.log(`   [-_o] Auth actualizado con la contraseña comprometida.`);

                    // Paso 2: Limpieza de Firestore
                    await db.collection('users').doc(uid).update({
                        password: admin.firestore.FieldValue.delete()
                    });
                    console.log(`   [✓] Campo 'password' destruido en Firestore.`);
                    
                    remediated++;
                } catch (userError) {
                    console.error(`   [x] Error remediando usuario ${uid}:`, userError.message || userError);
                    failed++;
                }
            }
        }

        console.log('\n=======================================');
        console.log('🏁 REMEDIACIÓN COMPLETADA');
        console.log(`Total Auditados: ${totalUsers}`);
        console.log(`Usuarios Remediados Satisfactoriamente: ${remediated}`);
        console.log(`Fallos: ${failed}`);
        console.log('=======================================');

    } catch (error) {
        console.error("❌ Error fatal ejecutando remediación:", error);
    }
}

remediateCredentials()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
