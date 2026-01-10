import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

/**
 * Script para investigar los datos en financial_summaries
 * Ejecutar desde consola del navegador o mediante un botón temporal
 */
export async function investigateFinancialData() {
    console.log('🔍 Investigando financial_summaries...');

    // 1. Obtener TODOS los documentos de financial_summaries
    const allQuery = query(collection(db, 'financial_summaries'));
    const allSnapshot = await getDocs(allQuery);

    console.log(`📊 Total documentos en financial_summaries: ${allSnapshot.docs.length}`);

    // 2. Agrupar por mes
    const byMonth = new Map();

    allSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const month = data.month || 'sin-mes';

        if (!byMonth.has(month)) {
            byMonth.set(month, []);
        }

        byMonth.get(month).push({
            id: doc.id,
            franchiseId: data.franchiseId,
            totalIncome: data.totalIncome || data.revenue || 0,
            totalExpenses: data.totalExpenses || 0
        });
    });

    // 3. Mostrar resumen por mes
    console.log('\n📅 Datos por mes:');
    Array.from(byMonth.entries())
        .sort(([a], [b]) => b.localeCompare(a)) // Más reciente primero
        .forEach(([month, records]: [string, any[]]) => {
            const totalIncome = records.reduce((sum: number, r: any) => sum + (r.totalIncome || 0), 0);
            const franchises = [...new Set(records.map((r: any) => r.franchiseId))];

            console.log(`\n${month}:`);
            console.log(`  - Registros: ${records.length}`);
            console.log(`  - Franquicias únicas: ${franchises.length}`);
            console.log(`  - Total ingresos: ${totalIncome.toLocaleString()}€`);
            console.log(`  - Detalles:`, records);
        });

    // 4. Buscar específicamente 2026-01
    console.log('\n🎯 Buscando específicamente mes 2026-01:');
    const jan2026Query = query(
        collection(db, 'financial_summaries'),
        where('month', '==', '2026-01')
    );
    const jan2026Snapshot = await getDocs(jan2026Query);

    console.log(`Encontrados ${jan2026Snapshot.docs.length} registros para 2026-01:`);
    jan2026Snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log({
            id: doc.id,
            franchiseId: data.franchiseId,
            totalIncome: data.totalIncome || data.revenue,
            totalExpenses: data.totalExpenses,
            allData: data
        });
    });

    return {
        totalDocs: allSnapshot.docs.length,
        byMonth: Object.fromEntries(byMonth),
        jan2026Count: jan2026Snapshot.docs.length
    };
}

// Para ejecutar desde consola:
// import { investigateFinancialData } from './scripts/investigateFinancialData';
// investigateFinancialData();
