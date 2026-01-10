import { db } from '../lib/firebase';
import { collection, getDocs, query, where, doc, writeBatch } from 'firebase/firestore';

/**
 * Script para identificar y limpiar franquicias obsoletas
 * 
 * Franquicias válidas:
 * - franquicia3@repaart.es
 * - franquicia4@repaart.es
 */

export async function investigateAllFranchises() {
    console.log('🔍 Investigando todas las franquicias...\n');

    // 1. Obtener todos los usuarios con role='franchise'
    const usersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'franchise')
    );
    const usersSnapshot = await getDocs(usersQuery);

    console.log(`📊 Total usuarios con role='franchise': ${usersSnapshot.docs.length}\n`);

    const franchises = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        email: doc.data().email,
        name: doc.data().name,
        status: doc.data().status,
        active: doc.data().active,
        allData: doc.data()
    }));

    console.log('📋 Franquicias encontradas:');
    franchises.forEach((f, index) => {
        console.log(`\n${index + 1}. ${f.email || 'Sin email'}`);
        console.log(`   UID: ${f.uid}`);
        console.log(`   Name: ${f.name || 'Sin nombre'}`);
        console.log(`   Status: ${f.status || 'no definido'}`);
        console.log(`   Active: ${f.active}`);
    });

    // 2. Verificar datos en financial_summaries
    console.log('\n\n💰 Verificando financial_summaries...');
    const summariesSnapshot = await getDocs(collection(db, 'financial_summaries'));

    const summariesByFranchise = new Map();
    summariesSnapshot.docs.forEach(doc => {
        const franchiseId = doc.data().franchiseId;
        if (!summariesByFranchise.has(franchiseId)) {
            summariesByFranchise.set(franchiseId, []);
        }
        summariesByFranchise.get(franchiseId).push(doc.id);
    });

    console.log('\n📈 Resumen por franquicia:');
    Array.from(summariesByFranchise.entries()).forEach(([franchiseId, docs]) => {
        const franchise = franchises.find(f => f.uid === franchiseId || f.name === franchiseId || f.email === franchiseId);
        console.log(`\n- ${franchiseId}`);
        if (franchise) {
            console.log(`  Email: ${franchise.email}`);
        }
        console.log(`  Documentos: ${docs.length}`);
    });

    return {
        users: franchises,
        summaries: Object.fromEntries(summariesByFranchise)
    };
}

export async function cleanupObsoleteFranchises() {
    console.log('🧹 Iniciando limpieza de franquicias obsoletas...\n');

    const VALID_EMAILS = [
        'franquicia3@repaart.es',
        'franquicia4@repaart.es'
    ];

    // 1. Obtener todas las franquicias
    const data = await investigateAllFranchises();

    // 2. Identificar obsoletas
    const obsolete = data.users.filter(f => !VALID_EMAILS.includes(f.email));

    console.log(`\n\n⚠️  Franquicias a eliminar: ${obsolete.length}`);
    obsolete.forEach(f => {
        console.log(`   - ${f.email} (${f.uid})`);
    });

    // 3. Confirmar con usuario
    console.log('\n\n❓ ¿Proceder con la eliminación?');
    console.log('   Ejecuta: cleanupObsoleteFranchises.execute()');

    return {
        toDelete: obsolete,
        toKeep: data.users.filter(f => VALID_EMAILS.includes(f.email)),
        execute: async () => {
            console.log('\n🗑️  Eliminando datos...\n');

            const batch = writeBatch(db);
            let deleteCount = 0;

            for (const franchise of obsolete) {
                // Buscar todos los IDs posibles (UID, email, name)
                const possibleIds = [
                    franchise.uid,
                    franchise.email,
                    franchise.name
                ].filter(Boolean);

                console.log(`\nEliminando datos de: ${franchise.email}`);

                // Eliminar financial_summaries
                const summariesQuery = query(
                    collection(db, 'financial_summaries'),
                    where('franchiseId', 'in', possibleIds)
                );
                const summariesSnapshot = await getDocs(summariesQuery);

                console.log(`  - ${summariesSnapshot.docs.length} financial_summaries`);
                summariesSnapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                    deleteCount++;
                });

                // Nota: NO eliminamos el usuario, solo lo marcamos como inactivo
                const userRef = doc(db, 'users', franchise.uid);
                batch.update(userRef, {
                    status: 'deleted',
                    active: false,
                    deletedAt: new Date()
                });
            }

            await batch.commit();
            console.log(`\n✅ Eliminados ${deleteCount} documentos`);
            console.log(`✅ Marcadas ${obsolete.length} franquicias como 'deleted'`);

            return { deletedDocs: deleteCount, markedUsers: obsolete.length };
        }
    };
}

// Para ejecutar desde consola:
// import('/src/scripts/cleanupFranchises.ts').then(m => m.investigateAllFranchises())
// import('/src/scripts/cleanupFranchises.ts').then(m => m.cleanupObsoleteFranchises().then(r => r.execute()))
