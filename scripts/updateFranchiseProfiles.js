/**
 * Script para actualizar los perfiles de franquicias existentes
 * 
 * Este script actualiza los documentos de franquicias en Firestore para asegurar que:
 * 1. Tienen el campo role: 'franchise'
 * 2. Tienen el campo status activo
 * 3. Tienen displayName configurado
 * 
 * USO:
 * node scripts/updateFranchiseProfiles.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';

// Configuración de Firebase (usa las mismas credenciales que la app)
const firebaseConfig = {
    apiKey: "AIzaSyA4JbODv-CmbhJ3_yy_mPIGGSQCu6XcRcU",
    authDomain: "repaartfinanzas.firebaseapp.com",
    projectId: "repaartfinanzas",
    storageBucket: "repaartfinanzas.firebasestorage.app",
    messagingSenderId: "850848530697",
    appId: "1:850848530697:web:29f3b89e14f7f6fc37f8dd",
    measurementId: "G-VT84LDHTQD"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Lista de emails de franquicias conocidas
const FRANCHISE_EMAILS = [
    'franquicia3@repaart.es',
    'franquicia4@repaart.es'
];

/**
 * Actualiza un perfil de franquicia
 */
async function updateFranchiseProfile(email) {
    try {
        console.log(`\n📝 Procesando: ${email}`);

        // Buscar el documento por email (el UID es el email en Firebase Auth)
        const docRef = doc(db, 'users', email);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            console.log(`❌ No se encontró el documento para ${email}`);
            return false;
        }

        const currentData = docSnap.data();
        console.log('📊 Datos actuales:', {
            email: currentData.email,
            role: currentData.role,
            status: currentData.status,
            displayName: currentData.displayName
        });

        // Preparar actualizaciones
        const updates = {};
        let needsUpdate = false;

        // 1. Verificar/agregar role
        if (currentData.role !== 'franchise') {
            updates.role = 'franchise';
            needsUpdate = true;
            console.log('✏️  Actualizando role → franchise');
        }

        // 2. Verificar/agregar status
        if (!currentData.status || currentData.status === 'deleted') {
            updates.status = 'active';
            needsUpdate = true;
            console.log('✏️  Actualizando status → active');
        }

        // 3. Verificar/agregar displayName
        if (!currentData.displayName) {
            // Generar nombre basado en email
            const franchiseNumber = email.match(/\d+/)?.[0] || '';
            updates.displayName = `Franquicia ${franchiseNumber}`;
            needsUpdate = true;
            console.log(`✏️  Agregando displayName → ${updates.displayName}`);
        }

        // 4. Asegurar que tenga email
        if (!currentData.email) {
            updates.email = email;
            needsUpdate = true;
            console.log(`✏️  Agregando email → ${email}`);
        }

        // Aplicar actualizaciones si es necesario
        if (needsUpdate) {
            await updateDoc(docRef, {
                ...updates,
                updated_at: new Date()
            });
            console.log('✅ Perfil actualizado exitosamente');
            return true;
        } else {
            console.log('✓ El perfil ya está correcto, no necesita cambios');
            return false;
        }

    } catch (error) {
        console.error(`❌ Error actualizando ${email}:`, error.message);
        return false;
    }
}

/**
 * Función principal
 */
async function main() {
    console.log('🚀 Iniciando actualización de perfiles de franquicias...\n');
    console.log('📋 Franquicias a procesar:', FRANCHISE_EMAILS);

    let updated = 0;
    let alreadyCorrect = 0;
    let errors = 0;

    for (const email of FRANCHISE_EMAILS) {
        const result = await updateFranchiseProfile(email);
        if (result === true) {
            updated++;
        } else if (result === false) {
            errors++;
        } else {
            alreadyCorrect++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN DE LA MIGRACIÓN');
    console.log('='.repeat(50));
    console.log(`✅ Perfiles actualizados: ${updated}`);
    console.log(`✓  Perfiles ya correctos: ${alreadyCorrect}`);
    console.log(`❌ Errores: ${errors}`);
    console.log('='.repeat(50));

    if (updated > 0) {
        console.log('\n🎉 ¡Migración completada! Las franquicias ahora deberían aparecer en el dashboard.');
    }

    // Cerrar la conexión
    process.exit(0);
}

// Ejecutar
main().catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
});
