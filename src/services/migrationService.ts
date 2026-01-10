import { db } from '../lib/firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

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
    }
};
