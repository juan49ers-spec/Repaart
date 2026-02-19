import { db } from '../lib/firebase';
import { collection, getDocs, writeBatch, doc, query, where, serverTimestamp, QueryDocumentSnapshot, DocumentData, deleteField } from 'firebase/firestore';

export const migrationService = {
    /**
     * Misión: Encontrar registros antiguos sin 'status' y curarlos.
     */
    fixZombieData: async () => {
        console.log("🧟 Iniciando búsqueda de datos zombis...");
        try {
            const snapshot = await getDocs(collection(db, 'financial_records'));
            const batch = writeBatch(db);
            let count = 0;

            snapshot.docs.forEach(d => {
                const data = d.data();
                if (!data.status) {
                    const ref = doc(db, 'financial_records', d.id);
                    batch.update(ref, {
                        status: 'approved',
                        isLocked: true,
                        is_locked: true,
                        updatedAt: serverTimestamp(),
                        _migrated: true
                    });
                    count++;
                }
            });

            if (count > 0) {
                await batch.commit();
                console.log(`✅ ÉXITO: Se han curado ${count} registros zombis.`);
                return { success: true, count };
            }
            return { success: true, count: 0 };
        } catch (error) {
            console.error("❌ ERROR en fixZombieData:", error);
            return { success: false, error };
        }
    },

    /**
     * Misión: Migrar colecciones mal nombradas.
     */
    migrateCollections: async () => {
        console.log("🚚 Iniciando migración de colecciones...");
        try {
            const batch = writeBatch(db);
            let count = 0;

            const financeSnap = await getDocs(collection(db, 'financial_data'));
            financeSnap.forEach(d => {
                const newRef = doc(db, 'financial_records', d.id);
                batch.set(newRef, { ...d.data(), _migratedFrom: 'financial_data' });
                count++;
            });

            const academySnap = await getDocs(collection(db, 'academy_modules'));
            academySnap.forEach(d => {
                const newRef = doc(db, 'academy_courses', d.id);
                batch.set(newRef, { ...d.data(), _migratedFrom: 'academy_modules' });
                count++;
            });

            if (count > 0) {
                await batch.commit();
                return { success: true, count };
            }
            return { success: true, count: 0 };
        } catch (error) {
            console.error("❌ ERROR en migrateCollections:", error);
            return { success: false, error };
        }
    },

    /**
     * Misión: Eliminar turnos de riders inexistentes.
     */
    cleanOrphanedShifts: async (_franchiseId?: string) => {
        console.log("👻 Buscando turnos fantasmas...");
        let report = "";
        const log = (msg: string) => { console.log(msg); report += msg + "\n"; };

        try {
            const batch = writeBatch(db);
            let deletedCount = 0;

            // UNIFIED: All riders live in /users/ with role='rider'
            const usersSnap = await getDocs(query(
                collection(db, 'users'),
                where('role', '==', 'rider')
            ));

            const activeRiderIds = new Set<string>();
            const inactiveRiderIds = new Set<string>();

            const process = (d: QueryDocumentSnapshot<DocumentData>) => {
                const data = d.data();
                if (data.status === 'inactive' || data.status === 'deleted') {
                    inactiveRiderIds.add(d.id);
                } else {
                    activeRiderIds.add(d.id);
                }
            };

            usersSnap.forEach(process);

            const collections = ['shifts', 'work_shifts', 'franchise_shifts'];
            for (const coll of collections) {
                const snap = await getDocs(collection(db, coll));
                snap.forEach(d => {
                    const data = d.data();
                    const riderId = data.riderId || data.rider_id;
                    if (riderId && (inactiveRiderIds.has(riderId) || !activeRiderIds.has(riderId))) {
                        batch.delete(d.ref);
                        deletedCount++;
                    }
                });
            }

            if (deletedCount > 0) await batch.commit();
            return { success: true, count: deletedCount, report };
        } catch (error) {
            log(`❌ ERROR: ${error instanceof Error ? error.message : String(error)}`);
            return { success: false, error };
        }
    },

    /**
     * Misión: Eliminar turnos duplicados.
     */
    cleanDuplicateShifts: async (franchiseId: string) => {
        console.log("👯 Buscando duplicados para:", franchiseId);
        try {
            const batch = writeBatch(db);
            let deletedCount = 0;
            const q = query(collection(db, 'work_shifts'), where('franchise_id', '==', franchiseId));
            const snap = await getDocs(q);
            const seen = new Set<string>();

            snap.docs.forEach(d => {
                const data = d.data();
                const key = `${data.rider_id}_${data.start_time?.toDate?.().getTime()}`;
                if (seen.has(key)) {
                    batch.delete(d.ref);
                    deletedCount++;
                } else {
                    seen.add(key);
                }
            });

            if (deletedCount > 0) await batch.commit();
            return { success: true, count: deletedCount };
        } catch (error) {
            console.error("❌ ERROR en cleanDuplicateShifts:", error);
            return { success: false, error };
        }
    },

    /**
     * Misión: Migrar campos snake_case a CamelCase en Finanzas.
     */
    migrateFinanceLegacyFields: async (dryRun: boolean = true) => {
        console.log(`🧹 [Finance] Migración de campos (${dryRun ? 'VISTA PREVIA' : 'EJECUCIÓN'})...`);
        try {
            const batch = writeBatch(db);
            let count = 0;

            // 1. Records
            const recordsSnap = await getDocs(collection(db, 'financial_records'));
            recordsSnap.forEach(d => {
                const data = d.data();
                const updates: Record<string, unknown> = {};
                const map: Record<string, string> = {
                    franchise_id: 'franchiseId',
                    admin_notes: 'adminNotes',
                    created_at: 'createdAt',
                    updated_at: 'updatedAt',
                    submitted_at: 'submittedAt',
                    approved_at: 'approvedAt',
                    approved_by: 'approvedBy',
                    rejection_reason: 'rejectionReason',
                    is_locked: 'isLocked'
                };

                Object.entries(map).forEach(([oldKey, newKey]) => {
                    const val = (data as Record<string, unknown>)[oldKey];
                    const newVal = (data as Record<string, unknown>)[newKey];
                    if (val !== undefined && newVal === undefined) {
                        updates[newKey] = val;
                        if (!dryRun) updates[oldKey] = deleteField();
                    }
                });

                if (Object.keys(updates).length > 0) {
                    if (!dryRun) batch.update(d.ref, updates);
                    count++;
                }
            });

            // 2. Summaries
            const summariesSnap = await getDocs(collection(db, 'financial_summaries'));
            summariesSnap.forEach(d => {
                const data = d.data();
                const updates: Record<string, unknown> = {};
                const map: Record<string, string> = {
                    franchise_id: 'franchiseId',
                    is_locked: 'isLocked',
                    updated_at: 'updatedAt'
                };

                Object.entries(map).forEach(([oldKey, newKey]) => {
                    const val = (data as Record<string, unknown>)[oldKey];
                    const newVal = (data as Record<string, unknown>)[newKey];
                    if (val !== undefined && newVal === undefined) {
                        updates[newKey] = val;
                        if (!dryRun) updates[oldKey] = deleteField();
                    }
                });

                if (Object.keys(updates).length > 0) {
                    if (!dryRun) batch.update(d.ref, updates);
                    count++;
                }
            });

            if (count > 0 && !dryRun) await batch.commit();
            return { success: true, count };
        } catch (error) {
            console.error("❌ ERROR en migrateFinanceLegacyFields:", error);
            return { success: false, error };
        }
    },

    /**
     * Misión: Migrar campos snake_case a CamelCase en Fleet.
     */
    migrateFleetLegacyFields: async (dryRun: boolean = true) => {
        console.log(`🧹 [Fleet] Migración de campos (${dryRun ? 'VISTA PREVIA' : 'EJECUCIÓN'})...`);
        try {
            const batch = writeBatch(db);
            let count = 0;
            const assetsSnap = await getDocs(collection(db, 'fleet_assets'));
            assetsSnap.forEach(d => {
                const data = d.data();
                const updates: Record<string, unknown> = {};
                const map: Record<string, string> = {
                    matricula: 'plate',
                    modelo: 'model',
                    km_actuales: 'currentKm',
                    proxima_revision_km: 'nextRevisionKm',
                    estado: 'status'
                };

                Object.entries(map).forEach(([oldKey, newKey]) => {
                    const val = (data as Record<string, unknown>)[oldKey];
                    const newVal = (data as Record<string, unknown>)[newKey];
                    if (val !== undefined && newVal === undefined) {
                        updates[newKey] = val;
                        if (!dryRun) updates[oldKey] = deleteField();
                    }
                });

                if (Object.keys(updates).length > 0) {
                    if (!dryRun) batch.update(d.ref, updates);
                    count++;
                }
            });

            if (count > 0 && !dryRun) await batch.commit();
            return { success: true, count };
        } catch (error) {
            console.error("❌ ERROR en migrateFleetLegacyFields:", error);
            return { success: false, error };
        }
    },

    /**
     * Misión: Migrar campos snake_case a CamelCase en Usuarios.
     */
    migrateUserLegacyFields: async (dryRun: boolean = true) => {
        console.log(`🧹 [Users] Migración de campos (${dryRun ? 'VISTA PREVIA' : 'EJECUCIÓN'})...`);
        try {
            const batch = writeBatch(db);
            let count = 0;
            const snap = await getDocs(collection(db, 'users'));
            snap.forEach(d => {
                const data = d.data();
                const updates: Record<string, unknown> = {};
                const map: Record<string, string> = {
                    phone: 'phoneNumber',
                    created_at: 'createdAt',
                    updated_at: 'updatedAt',
                    goal: 'monthlyRevenueGoal'
                };

                Object.entries(map).forEach(([oldKey, newKey]) => {
                    const val = (data as Record<string, unknown>)[oldKey];
                    const newVal = (data as Record<string, unknown>)[newKey];
                    if (val !== undefined && newVal === undefined) {
                        updates[newKey] = val;
                        if (!dryRun) updates[oldKey] = deleteField();
                    }
                });

                if (Object.keys(updates).length > 0) {
                    if (!dryRun) batch.update(d.ref, updates);
                    count++;
                }
            });

            if (count > 0 && !dryRun) await batch.commit();
            return { success: true, count };
        } catch (error) {
            console.error("❌ ERROR en migrateUserLegacyFields:", error);
            return { success: false, error };
        }
    },

    /**
     * Misión: Migrar campos snake_case a CamelCase en Franquicias.
     */
    migrateFranchiseLegacyFields: async (dryRun: boolean = true) => {
        console.log(`🧹 [Franchises] Migración de campos (${dryRun ? 'VISTA PREVIA' : 'EJECUCIÓN'})...`);
        try {
            const batch = writeBatch(db);
            let count = 0;
            const snap = await getDocs(collection(db, 'franchises'));
            snap.forEach(d => {
                const data = d.data();
                const updates: Record<string, unknown> = {};
                const map: Record<string, string> = {
                    active: 'isActive',
                    created_at: 'createdAt',
                    updated_at: 'updatedAt'
                };

                Object.entries(map).forEach(([oldKey, newKey]) => {
                    const val = (data as Record<string, unknown>)[oldKey];
                    const newVal = (data as Record<string, unknown>)[newKey];
                    if (val !== undefined && newVal === undefined) {
                        updates[newKey] = val;
                        if (!dryRun) updates[oldKey] = deleteField();
                    }
                });

                if (Object.keys(updates).length > 0) {
                    if (!dryRun) batch.update(d.ref, updates);
                    count++;
                }
            });

            if (count > 0 && !dryRun) await batch.commit();
            return { success: true, count };
        } catch (error) {
            console.error("❌ ERROR en migrateFranchiseLegacyFields:", error);
            return { success: false, error };
        }
    }
};
