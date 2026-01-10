/**
 * Encyclopedia Seeder Script
 * Carga completa de categorías, módulos y quizzes en Firestore
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inicializar Firebase Admin
const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, '../serviceAccountKey.json'), 'utf8')
);

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

// Cargar datos del seed
const seedDataPath = join(__dirname, '../src/data/encyclopediaSeed.js');
const seedContent = readFileSync(seedDataPath, 'utf8');

// Extraer el objeto de datos (simple parsing)
const dataMatch = seedContent.match(/export const ENCYCLOPEDIA_SEED_DATA = ({[\s\S]*});/);
if (!dataMatch) {
    console.error('❌ Error: No se pudo parsear encyclopediaSeed.js');
    process.exit(1);
}

const SEED_DATA = eval('(' + dataMatch[1] + ')');

console.log('📊 Datos cargados del seed:');
console.log(`   - Categorías: ${SEED_DATA.categories.length}`);
console.log(`   - Módulos: ${SEED_DATA.modules.length}`);
console.log(`   - Quizzes: ${SEED_DATA.quizzes.length}`);
console.log('');

async function seedCategories() {
    console.log('📦 Cargando categorías...');
    const batch = db.batch();

    SEED_DATA.categories.forEach(cat => {
        const ref = db.collection('encyclopedia_categories').doc(cat.id);
        batch.set(ref, { ...cat, updatedAt: new Date() }, { merge: true });
    });

    await batch.commit();
    console.log(`✅ ${SEED_DATA.categories.length} categorías sincronizadas`);
}

async function seedModules() {
    console.log('📚 Cargando módulos...');

    // Firestore permite máximo 500 operaciones por batch
    const BATCH_SIZE = 450;
    const chunks = [];

    for (let i = 0; i < SEED_DATA.modules.length; i += BATCH_SIZE) {
        chunks.push(SEED_DATA.modules.slice(i, i + BATCH_SIZE));
    }

    for (let i = 0; i < chunks.length; i++) {
        const batch = db.batch();

        chunks[i].forEach(mod => {
            const ref = db.collection('encyclopedia_modules').doc();
            batch.set(ref, { ...mod, createdAt: new Date() });
        });

        await batch.commit();
        console.log(`   ✓ Chunk ${i + 1}/${chunks.length} completado (${chunks[i].length} módulos)`);
    }

    console.log(`✅ ${SEED_DATA.modules.length} módulos cargados`);
}

async function seedQuizzes() {
    console.log('🎯 Cargando quizzes...');

    // Verificar primero cuántos ya existen
    const existingQuizzes = await db.collection('encyclopedia_quizzes').get();
    console.log(`   ℹ️  Quizzes existentes: ${existingQuizzes.size}`);

    // Limpiar quizzes existentes para evitar duplicados
    if (existingQuizzes.size > 0) {
        console.log('   🗑️  Limpiando quizzes antiguos...');
        const deleteBatch = db.batch();
        existingQuizzes.docs.forEach(doc => {
            deleteBatch.delete(doc.ref);
        });
        await deleteBatch.commit();
        console.log('   ✓ Limpieza completada');
    }

    // Cargar nuevos quizzes
    const BATCH_SIZE = 450;
    const chunks = [];

    for (let i = 0; i < SEED_DATA.quizzes.length; i += BATCH_SIZE) {
        chunks.push(SEED_DATA.quizzes.slice(i, i + BATCH_SIZE));
    }

    for (let i = 0; i < chunks.length; i++) {
        const batch = db.batch();

        chunks[i].forEach(quiz => {
            const ref = db.collection('encyclopedia_quizzes').doc();
            batch.set(ref, { ...quiz, createdAt: new Date() });
        });

        await batch.commit();
        console.log(`   ✓ Chunk ${i + 1}/${chunks.length} completado (${chunks[i].length} quizzes)`);
    }

    console.log(`✅ ${SEED_DATA.quizzes.length} quizzes cargados`);
}

async function verifyData() {
    console.log('');
    console.log('🔍 Verificando datos en Firestore...');

    const categories = await db.collection('encyclopedia_categories').get();
    const modules = await db.collection('encyclopedia_modules').get();
    const quizzes = await db.collection('encyclopedia_quizzes').get();

    console.log(`   - Categorías: ${categories.size}`);
    console.log(`   - Módulos: ${modules.size}`);
    console.log(`   - Quizzes: ${quizzes.size}`);

    const allCorrect =
        categories.size === SEED_DATA.categories.length &&
        modules.size >= SEED_DATA.modules.length && // >= porque pueden haber extras
        quizzes.size === SEED_DATA.quizzes.length;

    if (allCorrect) {
        console.log('');
        console.log('🎉 ¡CARGA COMPLETADA EXITOSAMENTE!');
        console.log('   Todos los datos están correctamente sincronizados.');
    } else {
        console.log('');
        console.log('⚠️  ADVERTENCIA: Hay discrepancias en los datos');
        if (categories.size !== SEED_DATA.categories.length) {
            console.log(`   - Categorías: esperadas ${SEED_DATA.categories.length}, obtenidas ${categories.size}`);
        }
        if (quizzes.size !== SEED_DATA.quizzes.length) {
            console.log(`   - Quizzes: esperados ${SEED_DATA.quizzes.length}, obtenidos ${quizzes.size}`);
        }
    }
}

async function main() {
    try {
        console.log('🌱 Iniciando proceso de seeding de Encyclopedia...');
        console.log('');

        await seedCategories();
        await seedModules();
        await seedQuizzes();
        await verifyData();

        console.log('');
        console.log('✨ Proceso completado. Puedes cerrar esta ventana.');
        process.exit(0);
    } catch (error) {
        console.error('');
        console.error('❌ ERROR FATAL:');
        console.error(error);
        process.exit(1);
    }
}

main();
