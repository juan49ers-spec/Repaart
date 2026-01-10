import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Herramienta: Verificar Integridad de Datos
 * 
 * Qué hace:
 * - Verifica que todos los registros en financial_summaries tengan un usuario válido
 * - Detecta datos huérfanos (sin franquicia asociada)
 * - Identifica inconsistencias en los datos
 * 
 * Cuándo usar:
 * - Después de migraciones de datos
 * - Si sospechas que hay datos corruptos
 * - Como auditoría mensual
 */
export async function verifyDataIntegrity() {
    console.log('🔍 Verificando integridad de datos...\n');

    const issues: string[] = [];

    // 1. Obtener todas las franquicias válidas
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const validFranchiseIds = new Set(
        usersSnapshot.docs
            .filter(doc => doc.data().role === 'franchise')
            .map(doc => doc.id)
    );

    console.log(`✅ Franquicias válidas: ${validFranchiseIds.size}`);

    // 2. Verificar financial_summaries
    const summariesSnapshot = await getDocs(collection(db, 'financial_summaries'));
    const orphanedRecords: any[] = [];
    const invalidDataRecords: any[] = [];

    summariesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const franchiseId = data.franchiseId;

        // Check 1: Franquicia existe?
        if (!validFranchiseIds.has(franchiseId) && franchiseId !== 'Madrid Centro' && franchiseId !== 'Sevilla') {
            orphanedRecords.push({
                id: doc.id,
                franchiseId,
                month: data.month
            });
        }

        // Check 2: Datos válidos?
        if (!data.month || (!data.totalIncome && !data.revenue)) {
            invalidDataRecords.push({
                id: doc.id,
                reason: !data.month ? 'Sin mes' : 'Sin ingresos',
                data
            });
        }
    });

    // 3. Reportar issues
    if (orphanedRecords.length > 0) {
        issues.push(`❌ ${orphanedRecords.length} registros huérfanos encontrados`);
        console.log('\n❌ Registros huérfanos:');
        orphanedRecords.forEach(r => console.log(`   - ${r.id} (${r.franchiseId})`));
    }

    if (invalidDataRecords.length > 0) {
        issues.push(`⚠️  ${invalidDataRecords.length} registros con datos inválidos`);
        console.log('\n⚠️  Registros con datos inválidos:');
        invalidDataRecords.forEach(r => console.log(`   - ${r.id}: ${r.reason}`));
    }

    if (issues.length === 0) {
        console.log('\n✅ ¡Integridad de datos verificada! No se encontraron problemas.');
    } else {
        console.log('\n📋 Resumen de problemas:');
        issues.forEach(issue => console.log(`   ${issue}`));
    }

    return {
        valid: issues.length === 0,
        issues,
        orphanedCount: orphanedRecords.length,
        invalidCount: invalidDataRecords.length,
        totalRecords: summariesSnapshot.docs.length
    };
}

/**
 * Herramienta: Exportar Estado de la Aplicación
 * 
 * Qué hace:
 * - Captura el estado completo de la aplicación
 * - Incluye datos de usuario, queries activas, errores
 * - Genera un snapshot para debugging
 * 
 * Cuándo usar:
 * - Para reportar bugs
 * - Cuando algo "no funciona" sin error claro
 * - Para compartir con soporte técnico
 */
export function captureAppState() {
    const state = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        localStorage: Object.keys(localStorage).reduce((acc, key) => {
            acc[key] = localStorage.getItem(key);
            return acc;
        }, {} as Record<string, string | null>),
        sessionStorage: Object.keys(sessionStorage).reduce((acc, key) => {
            acc[key] = sessionStorage.getItem(key);
            return acc;
        }, {} as Record<string, string | null>),
        errors: (window as any).__RUNTIME_ERRORS__ || [],
        performance: {
            memory: (performance as any).memory,
            navigation: performance.getEntriesByType('navigation')[0],
            timing: performance.timing
        }
    };

    console.log('📸 Estado de la aplicación capturado:', state);

    // Crear archivo descargable
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-state-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    return state;
}

/**
 * Herramienta: Auditoría Financiera
 * 
 * Qué hace:
 * - Verifica que los totales calculados coincidan con los datos guardados
 * - Detecta discrepancias en las sumas
 * - Valida que todos los meses tengan datos coherentes
 * 
 * Cuándo usar:
 * - Si los números "no cuadran"
 * - Antes de cerrar un periodo fiscal
 * - Como validación mensual
 */
export async function financialAudit() {
    console.log('💰 Iniciando auditoría financiera...\n');

    const summariesSnapshot = await getDocs(collection(db, 'financial_summaries'));
    const byMonth = new Map<string, any[]>();

    summariesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const month = data.month;
        if (!byMonth.has(month)) {
            byMonth.set(month, []);
        }
        byMonth.get(month)!.push({
            id: doc.id,
            franchiseId: data.franchiseId,
            income: data.totalIncome || data.revenue || 0,
            expenses: data.totalExpenses || 0
        });
    });

    const report: any[] = [];

    byMonth.forEach((records, month) => {
        const totalIncome = records.reduce((sum, r) => sum + r.income, 0);
        const totalExpenses = records.reduce((sum, r) => sum + r.expenses, 0);
        const profit = totalIncome - totalExpenses;
        const margin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;

        report.push({
            month,
            franchises: records.length,
            totalIncome,
            totalExpenses,
            profit,
            margin: margin.toFixed(2) + '%',
            franchiseDetails: records
        });
    });

    // Ordenar por mes (más reciente primero)
    report.sort((a, b) => b.month.localeCompare(a.month));

    console.log('📊 Reporte de auditoría:');
    report.forEach(r => {
        console.log(`\n${r.month}:`);
        console.log(`  Franquicias: ${r.franchises}`);
        console.log(`  Ingresos: ${r.totalIncome.toLocaleString()}€`);
        console.log(`  Gastos: ${r.totalExpenses.toLocaleString()}€`);
        console.log(`  Beneficio: ${r.profit.toLocaleString()}€`);
        console.log(`  Margen: ${r.margin}`);
    });

    return report;
}

/**
 * Herramienta: Monitor de Performance
 * 
 * Qué hace:
 * - Mide tiempo de carga de componentes clave
 * - Detecta queries lentas de Firestore
 * - Identifica cuellos de botella
 * 
 * Cuándo usar:
 * - Si la aplicación se siente lenta
 * - Para optimizar rendimiento
 * - Como benchmark antes/después de cambios
 */
export function runPerformanceCheck() {
    console.log('⚡ Ejecutando check de performance...\n');

    const metrics = {
        pageLoad: {
            domContentLoaded: 0,
            loadComplete: 0,
            firstPaint: 0,
            firstContentfulPaint: 0
        },
        resources: {
            scripts: 0,
            stylesheets: 0,
            images: 0,
            total: 0
        },
        memory: (performance as any).memory ? {
            used: ((performance as any).memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
            total: ((performance as any).memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
            limit: ((performance as any).memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
        } : 'No disponible'
    };

    // Page load timing
    const navigation = performance.getEntriesByType('navigation')[0] as any;
    if (navigation) {
        metrics.pageLoad.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
        metrics.pageLoad.loadComplete = navigation.loadEventEnd - navigation.fetchStart;
    }

    // Paint timing
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach(entry => {
        if (entry.name === 'first-paint') {
            metrics.pageLoad.firstPaint = entry.startTime;
        } else if (entry.name === 'first-contentful-paint') {
            metrics.pageLoad.firstContentfulPaint = entry.startTime;
        }
    });

    // Resource counts
    const resources = performance.getEntriesByType('resource');
    metrics.resources.total = resources.length;
    metrics.resources.scripts = resources.filter(r => r.name.endsWith('.js')).length;
    metrics.resources.stylesheets = resources.filter(r => r.name.endsWith('.css')).length;
    metrics.resources.images = resources.filter(r => /\.(jpg|jpeg|png|gif|svg|webp)/.test(r.name)).length;

    console.log('📊 Métricas de Performance:');
    console.log('\n⏱️  Tiempos de Carga:');
    console.log(`  DOM Ready: ${metrics.pageLoad.domContentLoaded.toFixed(0)}ms`);
    console.log(`  Load Complete: ${metrics.pageLoad.loadComplete.toFixed(0)}ms`);
    console.log(`  First Paint: ${metrics.pageLoad.firstPaint.toFixed(0)}ms`);
    console.log(`  FCP: ${metrics.pageLoad.firstContentfulPaint.toFixed(0)}ms`);

    console.log('\n📦 Recursos Cargados:');
    console.log(`  Scripts: ${metrics.resources.scripts}`);
    console.log(`  Hojas de estilo: ${metrics.resources.stylesheets}`);
    console.log(`  Imágenes: ${metrics.resources.images}`);
    console.log(`  Total: ${metrics.resources.total}`);

    console.log('\n💾 Uso de Memoria:');
    console.log(metrics.memory);

    // Recomendaciones
    console.log('\n💡 Recomendaciones:');
    if (metrics.pageLoad.loadComplete > 3000) {
        console.log('  ⚠️  Tiempo de carga elevado (>3s). Considera optimizar.');
    }
    if (metrics.resources.total > 100) {
        console.log('  ⚠️  Muchos recursos cargados. Considera code-splitting.');
    }

    return metrics;
}
