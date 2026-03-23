import { db } from '../lib/firebase';
import { collection, getDocs, writeBatch } from 'firebase/firestore';

/**
 * Script para eliminar datos huérfanos de financial_summaries
 * 
 * DATOS A ELIMINAR:
 * - Madrid Centro (sin usuario asociado)
 * - Sevilla (sin usuario asociado)
 * 
 * DATOS A MANTENER:
 * - IAvDv9ZdFzWgF0osu986OCYWu0A3 (franquicia3@repaart.es)
 * - S5DLjXdrAyfQxDGbLsARIp1sufD3 (franquicia4@repaart.es)
 */

export async function cleanupOrphanedFinancialData() {
    console.log('🧹 Iniciando limpieza de datos huérfanos...\n');

    const ORPHANED_IDS = ['Madrid Centro', 'Sevilla'];
    const VALID_IDS = [
        'IAvDv9ZdFzWgF0osu986OCYWu0A3',  // franquicia3
        'S5DLjXdrAyfQxDGbLsARIp1sufD3'   // franquicia4
    ];

    // 1. Buscar documentos a eliminar
    const summariesSnapshot = await getDocs(collection(db, 'financial_summaries'));

    const toDelete: { ref: import('firebase/firestore').DocumentReference; id: string; franchiseId: string; month: string; totalIncome: number | undefined }[] = [];
    const toKeep: { id: string; franchiseId: string; month: string; totalIncome: number | undefined }[] = [];

    summariesSnapshot.docs.forEach(doc => {
        const franchiseId = doc.data().franchiseId;
        const docData = {
            id: doc.id,
            franchiseId,
            month: doc.data().month,
            totalIncome: doc.data().totalIncome || doc.data().revenue
        };

        if (ORPHANED_IDS.includes(franchiseId)) {
            toDelete.push({ ref: doc.ref, ...docData });
        } else if (VALID_IDS.includes(franchiseId)) {
            toKeep.push(docData);
        } else {
            console.warn(`⚠️  Documento con franchiseId desconocido: ${franchiseId}`);
        }
    });

    console.log(`📊 Resumen de limpieza:`);
    console.log(`   ✅ A mantener: ${toKeep.length} documentos`);
    console.log(`   ❌ A eliminar: ${toDelete.length} documentos\n`);

    console.log('📋 Documentos a eliminar:');
    toDelete.forEach(d => {
        console.log(`   - ${d.id} (${d.franchiseId}, ${d.month})`);
    });

    console.log('\n📋 Documentos a mantener:');
    toKeep.forEach(d => {
        console.log(`   - ${d.id} (${d.franchiseId}, ${d.month})`);
    });

    // 2. Ejecutar eliminación
    if (toDelete.length === 0) {
        console.log('\n✅ No hay datos huérfanos para eliminar');
        return { deleted: 0, kept: toKeep.length };
    }

    console.log('\n⚠️  ¿Proceder con la eliminación?');
    console.log('   Los datos se eliminarán PERMANENTEMENTE');

    return {
        toDelete,
        toKeep,
        summary: {
            willDelete: toDelete.length,
            willKeep: toKeep.length
        },
        execute: async () => {
            console.log('\n🗑️  Ejecutando eliminación...');

            const batch = writeBatch(db);

            toDelete.forEach(item => {
                batch.delete(item.ref);
            });

            await batch.commit();

            console.log(`\n✅ Eliminados ${toDelete.length} documentos huérfanos`);
            console.log(`✅ Mantenidos ${toKeep.length} documentos válidos`);

            // Verificación
            const afterSnapshot = await getDocs(collection(db, 'financial_summaries'));
            console.log(`\n📊 Total documentos después de limpieza: ${afterSnapshot.docs.length}`);

            return {
                deleted: toDelete.length,
                kept: toKeep.length,
                totalAfter: afterSnapshot.docs.length
            };
        }
    };
}

// Wrapper para usar desde botón
export async function executeCleanup() {
    const result = await cleanupOrphanedFinancialData();

    if (result.execute) {
        console.log('\n🚀 Ejecutando limpieza automática...');
        return await result.execute();
    }

    return result;
}
