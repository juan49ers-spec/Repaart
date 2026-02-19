import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { db } from '../config/firebase';
import { getFlyderConnection, mapFlyderStatusToStandard, detectAnomalies, calculateUnitEconomics } from '../utils/flyderUtils';

const BATCH_SIZE_LIMIT = 450; // Firestore limit is 500, keeping buffer

export const syncFlyderHistoricalOrders = functions.https.onCall(async (data, context) => {
    // 1. Auth Check - Solo Admin
    if (!context.auth || context.auth.token.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
    }

    const { startDate, endDate, limit = 1000, offset = 0 } = data;

    if (!startDate || !endDate) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing date range');
    }

    const stats = {
        totalFetched: 0,
        syncedOrders: 0,
        skippedOrders: 0,
        failedOrders: 0,
        newStoresCreated: 0,
        errors: [] as string[]
    };

    let connection;

    try {
        // 2. Load Mappings Cache
        const mappingsSnapshot = await db.collection('franchise_mappings').get();
        const franchiseMap = new Map<number, string>(); // FlyderID -> RepaartUUID
        mappingsSnapshot.docs.forEach(doc => {
            const d = doc.data();
            franchiseMap.set(d.flyderBusinessId, d.repaartFranchiseId);
        });

        // 3. Connect & Query Flyder
        connection = await getFlyderConnection();

        // Consulta optimizada con rango de fechas
        const [rows] = await connection.execute(
            `SELECT o.*, 
        s.name as store_name, 
        s.business_id as business_id
       FROM orders o 
       JOIN stores s ON o.store_id = s.id
       WHERE o.created_at >= ? AND o.created_at <= ?
       ORDER BY o.created_at ASC
       LIMIT ? OFFSET ?`,
            [startDate, endDate, limit, offset]
        ) as any[];

        stats.totalFetched = rows.length;

        // 4. Process Orders in Batches
        let batch = db.batch();
        let opCount = 0;

        // Cache local de stores creados en esta ejecución para no intentar crearlos 2 veces
        const createdStoresCache = new Set<string>();

        for (const row of rows) {
            try {
                const flyderId = String(row.id);
                const flyderBusinessId = row.business_id;
                const franchiseId = franchiseMap.get(flyderBusinessId);

                // A. Validate Mapping
                if (!franchiseId) {
                    stats.skippedOrders++;
                    // Opcional: Loggear missing mapping
                    continue;
                }

                // B. Lazy Store Creation
                const flyderStoreId = String(row.store_id);
                const storeRef = db.collection('stores').doc(`flyder_${flyderStoreId}`);

                // Si no lo hemos procesado en esta ejecución (optimista)
                if (!createdStoresCache.has(flyderStoreId)) {
                    const storeDoc = await storeRef.get();
                    if (!storeDoc.exists) {
                        batch.set(storeRef, {
                            id: `flyder_${flyderStoreId}`,
                            name: row.store_name || `Store ${flyderStoreId}`,
                            franchiseId: franchiseId,
                            flyderId: row.store_id, // Metadata
                            status: 'active',
                            createdAt: admin.firestore.Timestamp.now(),
                            source: 'flyder_auto_import'
                        });
                        opCount++;
                        stats.newStoresCreated++;
                        createdStoresCache.add(flyderStoreId);
                    } else {
                        createdStoresCache.add(flyderStoreId); // Ya existe, lo marcamos
                    }
                }

                // C. Prepare Order Document
                const orderRef = db.collection('orders').doc(flyderId);

                const repaartStatus = mapFlyderStatusToStandard(row.status);
                const anomalies = detectAnomalies(row);
                const economics = calculateUnitEconomics(row);

                const orderData = {
                    id: flyderId,
                    flyderId: row.id, // Int original
                    franchiseId: franchiseId,
                    storeId: `flyder_${flyderStoreId}`, // Referencia al documento Store

                    // Core Data
                    status: repaartStatus,
                    originalStatus: row.status,
                    createdAt: admin.firestore.Timestamp.fromDate(new Date(row.created_at)),
                    updatedAt: admin.firestore.Timestamp.fromDate(new Date(row.updated_at)),

                    // Financials
                    amount: parseFloat(row.amount || 0),
                    paymentMethod: row.payment_method,
                    economics: economics, // 💰 TOP Feature: Unit Economics

                    // Logistics
                    distance: row.distance,
                    duration: row.duration,
                    customer: {
                        address: row.customer_addr_street, // Anonimizado si viene null
                        city: row.customer_addr_city,
                        zip: row.customer_addr_postal_code,
                        lat: row.customer_latitude,
                        lng: row.customer_longitude
                    },

                    // Quality
                    anomalies: anomalies, // 🛡️ TOP Feature: Quality Gate
                    hasAnomalies: anomalies.length > 0,

                    source: 'flyder_import'
                };

                batch.set(orderRef, orderData, { merge: true });
                opCount++;
                stats.syncedOrders++;

                // D. Commit Batch if full
                if (opCount >= BATCH_SIZE_LIMIT) {
                    await batch.commit();
                    batch = db.batch();
                    opCount = 0;
                }

            } catch (err: any) {
                console.error(`Error processing order ${row.id}:`, err);
                stats.failedOrders++;
                stats.errors.push(`Order ${row.id}: ${err.message}`);
            }
        }

        // Commit remaining operations
        if (opCount > 0) {
            await batch.commit();
        }

        return { success: true, progress: stats };

    } catch (error: any) {
        console.error('Sync Fatal Error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    } finally {
        if (connection) await connection.end();
    }
});
