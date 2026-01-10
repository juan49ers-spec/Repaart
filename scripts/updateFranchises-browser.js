/**
 * Script para ejecutar en la CONSOLA DEL NAVEGADOR
 * mientras estés logueado como ADMIN en la aplicación
 * 
 * INSTRUCCIONES:
 * 1. Inicia sesión en https://repaartfinanzas.web.app como ADMIN
 * 2. Abre la consola del navegador (F12 > Console)
 * 3. Copia y pega TODO este código
 * 4. Presiona Enter
 * 5. Espera a que termine la migración
 */

(async function updateFranchises() {
    console.log('🚀 Iniciando migración de franquicias...\n');

    // Importar Firebase desde el contexto de la app
    const { getFirestore, collection, doc, getDoc, updateDoc } = window.firebase.firestore;
    const db = getFirestore();

    // Lista de franquicias a actualizar
    const franchiseEmails = [
        'franquicia3@repaart.es',
        'franquicia4@repaart.es'
    ];

    let updated = 0;
    let alreadyCorrect = 0;
    let errors = 0;

    for (const email of franchiseEmails) {
        try {
            console.log(`\n📝 Procesando: ${email}`);

            // Obtener documento
            const docRef = doc(db, 'users', email);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                console.log(`❌ No existe el documento para ${email}`);
                errors++;
                continue;
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

            // 1. Role
            if (currentData.role !== 'franchise') {
                updates.role = 'franchise';
                needsUpdate = true;
                console.log('✏️  Actualizando role → franchise');
            }

            // 2. Status
            if (!currentData.status || currentData.status === 'deleted') {
                updates.status = 'active';
                needsUpdate = true;
                console.log('✏️  Actualizando status → active');
            }

            // 3. DisplayName
            if (!currentData.displayName) {
                const franchiseNumber = email.match(/\d+/)?.[0] || '';
                updates.displayName = `Franquicia ${franchiseNumber}`;
                needsUpdate = true;
                console.log(`✏️  Agregando displayName → ${updates.displayName}`);
            }

            // 4. Email
            if (!currentData.email) {
                updates.email = email;
                needsUpdate = true;
                console.log(`✏️  Agregando email → ${email}`);
            }

            // Aplicar cambios
            if (needsUpdate) {
                await updateDoc(docRef, updates);
                console.log('✅ Perfil actualizado exitosamente');
                updated++;
            } else {
                console.log('✓ El perfil ya está correcto');
                alreadyCorrect++;
            }

        } catch (error) {
            console.error(`❌ Error con ${email}:`, error.message);
            errors++;
        }
    }

    // Resumen
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN DE LA MIGRACIÓN');
    console.log('='.repeat(50));
    console.log(`✅ Perfiles actualizados: ${updated}`);
    console.log(`✓  Perfiles ya correctos: ${alreadyCorrect}`);
    console.log(`❌ Errores: ${errors}`);
    console.log('='.repeat(50));

    if (updated > 0) {
        console.log('\n🎉 ¡Migración completada! Recarga la página para ver los cambios.');
    }
})();
