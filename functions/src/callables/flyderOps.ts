import * as functions from 'firebase-functions/v1';

import { db } from '../config/firebase';
import { getFlyderConnection } from '../utils/flyderUtils';
import { CallableContext } from 'firebase-functions/v1/https';
import { RowDataPacket } from 'mysql2/promise';

/**
 * Obtiene lista de negocios de Flyder que tienen pedidos
 */
export const getFlyderBusinessesWithOrders = functions.https.onCall(async (data: any, context: CallableContext) => {
    // Auth Check
    if (!context.auth || context.auth.token.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
    }

    let connection;
    try {
        connection = await getFlyderConnection();

        // Obtener franquicias con pedidos
        const [rows] = await connection.execute<RowDataPacket[]>(`
      SELECT 
        franchise_id as id,
        franchise_name as name,
        COUNT(*) as order_count,
        MAX(created_at) as last_order_date
      FROM orders
      WHERE status = 'completed'
      GROUP BY franchise_id, franchise_name
      ORDER BY order_count DESC
    `);

        // Obtener mapeos actuales para saber cuáles ya están mapeados
        const mappingsSnapshot = await db.collection('franchise_mappings').get();
        const mappedIds = new Set(mappingsSnapshot.docs.map(doc => doc.data().flyderBusinessId));

        const businesses = rows.map(row => ({
            id: row.id,
            name: row.name,
            orderCount: row.order_count,
            lastOrderDate: row.last_order_date,
            isMapped: mappedIds.has(row.id)
        }));

        return { businesses };

    } catch (error: any) {
        console.error('Error getting Flyder businesses:', error);
        throw new functions.https.HttpsError('internal', error.message);
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Cuenta total de pedidos en Repaart Firestore
 */
export const countRepaartOrders = functions.https.onCall(async (data: any, context: CallableContext) => {
    if (!context.auth || context.auth.token.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
    }

    try {
        const coll = db.collection('orders');
        const snapshot = await coll.count().get();

        // También contar por origen si es posible (requiere índices)
        // Por ahora solo total
        return {
            stats: {
                totalOrders: snapshot.data().count
            }
        };
    } catch (error: any) {
        console.error('Error counting orders:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Crea las franquicias principales (Mock para habilitar frontend)
 * TODO: Implementar lógica real si el usuario lo requiere, por ahora devuelve éxito para no bloquear.
 */
export const ensureMainFranchisesExist = functions.https.onCall(async (data: any, context: CallableContext) => {
    if (!context.auth || context.auth.token.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
    }

    // Placeholder: Implementar lógica real de creación de franquicias si es necesario
    return {
        results: {
            created: [],
            updated: []
        }
    };
});

export const assignFlyderIdsToFranchises = functions.https.onCall(async (data: any, context: CallableContext) => {
    if (!context.auth || context.auth.token.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
    }

    // Placeholder
    return {
        results: {
            updated: []
        }
    };
});

export const createMainFlyderFranchises = functions.https.onCall(async (data: any, context: CallableContext) => {
    if (!context.auth || context.auth.token.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
    }

    // Placeholder
    return {
        results: {
            created: []
        }
    };
});
