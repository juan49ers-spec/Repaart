import { db } from '../lib/firebase';
import { collection, getDocs, writeBatch, doc, query, where, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const migrationService = {
    /**
     * Misión: Encontrar registros antiguos sin 'status' y curarlos.
     * Acción: status -> 'approved', is_locked -> true.
     */
    fixZombieData: async () => {
        console.log("🧟 Iniciando búsqueda de datos zombis...");

        try {
            // 1. Obtener TODO (Para una app pequeña/mediana esto está bien. 
            // Para miles de registros se necesitaría paginación).
            const snapshot = await getDocs(collection(db, 'financial_records'));

            // Firestore Batch solo permite 500 operaciones por lote.
            // Aquí hacemos una implementación simple. Si tienes >500 registros antiguos,
            // avísame para darte la versión paginada.
            const batch = writeBatch(db);
            let count = 0;

            snapshot.docs.forEach(d => {
                const data = d.data();

                // DETECTOR DE ZOMBIS: ¿Le falta el status?
                if (!data.status) {
                    const ref = doc(db, 'financial_records', d.id);
                    batch.update(ref, {
                        status: 'approved', // Asumimos que lo viejo es válido
                        is_locked: true,    // Lo cerramos para protegerlo
                        updated_at: new Date(),
                        _migrated: true     // Marca de agua para saber que fuimos nosotros
                    });
                    count++;
                }
            });

            // 2. Ejecutar la cura
            if (count > 0) {
                await batch.commit();
                console.log(`✅ ÉXITO: Se han curado ${count} registros zombis.`);
                return { success: true, count };
            } else {
                console.log("✨ LIMPIO: No se encontraron registros antiguos.");
                return { success: true, count: 0 };
            }

        } catch (error) {
            console.error("❌ ERROR en Migración:", error);
            return { success: false, error };
        }
    },

    /**
     * Misión: Migrar colecciones mal nombradas a la estructura correcta V12.
     * 1. financial_data -> financial_records
     * 2. academy_modules -> academy_courses
     */
    migrateCollections: async () => {
        console.log("🚚 Iniciando migración de colecciones...");
        try {
            const batch = writeBatch(db);
            let count = 0;

            // --- 1. Finance Migration ---
            const financeSnap = await getDocs(collection(db, 'financial_data'));
            if (!financeSnap.empty) {
                console.log(`Found ${financeSnap.size} financial_data records. Moving...`);
                financeSnap.forEach(d => {
                    const data = d.data();
                    const newRef = doc(db, 'financial_records', d.id);
                    batch.set(newRef, { ...data, _migratedFrom: 'financial_data' });
                    // Optional: Delete old doc? Keeping it safer for manual deletion later
                    // batch.delete(d.ref); 
                    count++;
                });
            }

            // --- 2. Academy Migration ---
            const academySnap = await getDocs(collection(db, 'academy_modules'));
            if (!academySnap.empty) {
                console.log(`Found ${academySnap.size} academy_modules records. Moving...`);
                academySnap.forEach(d => {
                    const data = d.data();
                    const newRef = doc(db, 'academy_courses', d.id);
                    batch.set(newRef, { ...data, _migratedFrom: 'academy_modules' });
                    count++;
                });
            }

            if (count > 0) {
                await batch.commit();
                console.log(`✅ MIGRACIÓN EXITOSA: ${count} documentos movidos.`);
                return { success: true, count };
            } else {
                console.log("✨ Nada que migrar.");
                return { success: true, count: 0 };
            }

        } catch (error) {
            console.error("❌ ERROR en Migración de Colecciones:", error);
            return { success: false, error };
        }
    },

    /**
     * Misión: Eliminar turnos de riders que ya no existen en la colección 'users'.
     * Problema: El planificador muestra "Fantasmas" porque encuentra turnos huérfanos.
     */
    cleanOrphanedShifts: async (franchiseId?: string, _weekId?: string) => {
        console.log("👻 Buscando turnos fantasmas (GOD MODE)...");
        let report = "";
        const log = (msg: string) => { console.log(msg); report += msg + "\n"; };

        try {
            // --- PREPARACIÓN ---
            const batch = writeBatch(db);
            let deletedCount = 0;

            // 1. OBTENER RIDERS ACTIVOS E INACTIVOS (De ambas colecciones posibles)
            const ridersSnap = await getDocs(collection(db, 'riders'));
            const usersSnap = await getDocs(collection(db, 'users'));

            const activeRiderFranchiseMap = new Map<string, string>();
            const inactiveRiderIds = new Set<string>();

            const processRiderDoc = (d: any, collectionName: string) => {
                const data = d.data();
                const name = (data.fullName || data.displayName || "").toLowerCase();
                const email = (data.email || "").toLowerCase();
                const isValentino = name.includes('valentino') || email.includes('valentino') || d.id === 'valentino';

                if (isValentino) {
                    log(`🎯 DETECTADO VALENTINO en ${collectionName}: ID=${d.id}, Status=${data.status}`);
                    // Si está activo, lo marcamos para borrar/desactivar
                    if (data.status !== 'inactive' && data.status !== 'deleted') {
                        inactiveRiderIds.add(d.id);
                        // No lo borramos del tirón para dejar rastro pero lo desactivamos
                        log(`   ⚔️ Desactivando Valentino en ${collectionName}...`);
                        batch.update(d.ref, { status: 'inactive', _ghostBusted: serverTimestamp() });
                        deletedCount++;
                    } else {
                        inactiveRiderIds.add(d.id);
                    }
                } else if (data.status === 'inactive' || data.status === 'deleted') {
                    inactiveRiderIds.add(d.id);
                } else {
                    activeRiderFranchiseMap.set(d.id, data.franchiseId);
                }
            };

            ridersSnap.forEach(d => processRiderDoc(d, 'riders'));
            usersSnap.forEach(d => processRiderDoc(d, 'users'));

            log(`📊 Riders Activos: ${activeRiderFranchiseMap.size}`);
            log(`❌ Riders Inactivos/Borrados: ${inactiveRiderIds.size}`);

            // 2. LIMPIEZA DE TURNOS EN COLECCIONES PLANAS
            const collectionsToScan = ['shifts', 'work_shifts', 'franchise_shifts'];

            for (const collName of collectionsToScan) {
                log(`🧹 Escaneando colección: ${collName}...`);
                const snap = await getDocs(collection(db, collName));

                snap.forEach(d => {
                    const data = d.data();
                    const riderId = data.riderId || data.rider_id;
                    const riderName = (data.riderName || data.rider_name || "").toLowerCase();
                    const shiftFranchiseId = data.franchiseId || data.franchise_id;

                    let shouldDelete = false;

                    // Criterio 1: Nombre contiene Valentino
                    if (riderName.includes('valentino')) {
                        log(`   👻 Eliminando turno por NOMBRE en ${collName}: ${riderName} (ID: ${d.id})`);
                        shouldDelete = true;
                    }
                    // Criterio 2: Rider ID inactivo o desconocido
                    else if (riderId) {
                        if (inactiveRiderIds.has(riderId)) {
                            log(`   🗑️ Eliminando turno en ${collName} de rider inactivo: ${riderId}`);
                            shouldDelete = true;
                        } else if (!activeRiderFranchiseMap.has(riderId)) {
                            log(`   🗑️ Eliminando turno en ${collName} de rider inexistente: ${riderId}`);
                            shouldDelete = true;
                        } else {
                            // Criterio 3: Mismatch de franquicia
                            const riderFranchiseId = activeRiderFranchiseMap.get(riderId);
                            if (shiftFranchiseId && riderFranchiseId && shiftFranchiseId !== riderFranchiseId) {
                                log(`   👻 Eliminando turno GHOST (Mismatch) en ${collName}: shift in ${shiftFranchiseId}, rider in ${riderFranchiseId}`);
                                shouldDelete = true;
                            }
                        }
                    }

                    if (shouldDelete) {
                        batch.delete(d.ref);
                        deletedCount++;
                    }
                });
            }

            // 3. LEGACY CLEANUP (SCAN ALL WEEKS)
            // Esto toca los arrays internos de los documentos de la colección 'weeks'
            if (franchiseId) {
                log(`🧹 Escaneando TODAS las semanas en: franchises/${franchiseId}/weeks`);
                const weeksRef = collection(db, 'franchises', franchiseId, 'weeks');
                const weeksSnap = await getDocs(weeksRef);

                for (const weekDoc of weeksSnap.docs) {
                    const weekData = weekDoc.data();
                    const weekId = weekDoc.id;
                    const fullJson = JSON.stringify(weekData).toLowerCase();

                    if (fullJson.includes('valentino')) {
                        log(`🚨 MATCH FOUND in week [${weekId}]! Analyzing shifts array...`);

                        const currentShifts = weekData.shifts || [];
                        let legacyDeleted = 0;

                        const cleanShifts = currentShifts.filter((s: any) => {
                            const json = JSON.stringify(s).toLowerCase();
                            if (json.includes('valentino')) {
                                log(`   👻 Eliminando turno Valentino en array de [${weekId}]: ${json.substring(0, 100)}...`);
                                legacyDeleted++;
                                return false;
                            }
                            return true;
                        });

                        await updateDoc(weekDoc.ref, { shifts: cleanShifts, _ghostBusted: serverTimestamp() });
                        deletedCount += legacyDeleted;
                        log(`✅ Limpiados ${legacyDeleted} turnos en array de semana ${weekId}`);
                    } else {
                        // FORCE CACHE REFRESH anyway to be sure
                        await updateDoc(weekDoc.ref, { _ghostBusted: serverTimestamp() });
                    }
                }
            }

            // --- TRABAJO FINAL ---
            if (deletedCount > 0) {
                await batch.commit();
                log(`✅ LIMPIEZA COMPLETADA: ${deletedCount} operaciones realizadas.`);
                return { success: true, count: deletedCount, report };
            } else {
                log("✨ Nada que limpiar. Todo parece en orden.");
                return { success: true, count: 0, report };
            }

        } catch (error: any) {
            console.error("❌ ERROR en Limpieza de Fantasmas:", error);
            return { success: false, error, report: report + `\nERROR: ${error.message}` };
        }
    },

    /**
     * Misión: Eliminar turnos duplicados (mismo rider, misma hora de inicio).
     */
    cleanDuplicateShifts: async (franchiseId: string) => {
        console.log("👯 Buscando duplicados para la franquicia:", franchiseId);
        let report = `DEDUP REPORT - ${new Date().toISOString()}\n`;
        const log = (msg: string) => { console.log(msg); report += msg + "\n"; };

        try {
            const batch = writeBatch(db);
            let deletedCount = 0;

            // 1. OBTENER TODOS LOS TURNOS DE LA FRANQUICIA
            const q = query(collection(db, 'work_shifts'), where('franchise_id', '==', franchiseId));
            const snap = await getDocs(q);

            log(`📊 Analizando ${snap.size} turnos...`);

            // Agrupar por rider y tiempo de inicio
            const seen = new Map<string, string>(); // key: riderId_startTime, value: firstFoundDocId

            snap.docs.forEach(d => {
                const data = d.data();
                const riderId = data.rider_id;
                const startTime = data.start_time?.toDate().getTime();

                if (riderId && startTime) {
                    const key = `${riderId}_${startTime}`;
                    if (seen.has(key)) {
                        log(`   👯 DUPLICADO DETECTADO: Rider=${riderId}, Inicio=${new Date(startTime).toLocaleString()}. Borrando doc ${d.id}`);
                        batch.delete(d.ref);
                        deletedCount++;
                    } else {
                        seen.set(key, d.id);
                    }
                }
            });

            if (deletedCount > 0) {
                await batch.commit();
                log(`✅ DEDUPLICACIÓN COMPLETADA: ${deletedCount} turnos eliminados.`);
                return { success: true, count: deletedCount, report };
            } else {
                log("✨ No se encontraron duplicados exactos.");
                return { success: true, count: 0, report };
            }

        } catch (error: any) {
            console.error("❌ ERROR en Deduplicación:", error);
            return { success: false, error, report: report + `\nERROR: ${error.message}` };
        }
    }
};
