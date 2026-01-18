const admin = require("firebase-admin");
const serviceAccount = require("../service-account.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateCollection(collectionName, fieldMap) {
    console.log(`🧹 Aggressive Cleanup: ${collectionName}...`);
    const snapshot = await db.collection(collectionName).get();
    let count = 0;

    const batch = db.batch();

    snapshot.forEach(doc => {
        const data = doc.data();
        const updates = {};
        let needsUpdate = false;

        for (const [oldKey, newKey] of Object.entries(fieldMap)) {
            // If legacy key exists, we definitely need an update (at least to delete it)
            if (data[oldKey] !== undefined) {
                // If new key is missing, copy the value
                if (data[newKey] === undefined) {
                    updates[newKey] = data[oldKey];
                }
                // Always delete the old key
                updates[oldKey] = admin.firestore.FieldValue.delete();
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            batch.update(doc.ref, updates);
            count++;
        }
    });

    if (count > 0) {
        await batch.commit();
        console.log(`✅ ${collectionName}: Cleaned ${count} docs.`);
    } else {
        console.log(`✅ ${collectionName}: Already clean.`);
    }
}

async function runAll() {
    try {
        // Finance
        await migrateCollection('financial_records', {
            franchise_id: 'franchiseId',
            admin_notes: 'adminNotes',
            created_at: 'createdAt',
            updated_at: 'updatedAt',
            submitted_at: 'submittedAt',
            approved_at: 'approvedAt',
            approved_by: 'approvedBy',
            rejection_reason: 'rejectionReason',
            is_locked: 'isLocked'
        });

        await migrateCollection('financial_summaries', {
            franchise_id: 'franchiseId',
            is_locked: 'isLocked',
            updated_at: 'updatedAt'
        });

        // Fleet
        await migrateCollection('fleet_assets', {
            matricula: 'plate',
            modelo: 'model',
            km_actuales: 'currentKm',
            proxima_revision_km: 'nextRevisionKm',
            estado: 'status'
        });

        // Users
        await migrateCollection('users', {
            phone: 'phoneNumber',
            created_at: 'createdAt',
            updated_at: 'updatedAt',
            goal: 'monthlyRevenueGoal'
        });

        // Franchises
        await migrateCollection('franchises', {
            active: 'isActive',
            created_at: 'createdAt',
            updated_at: 'updatedAt'
        });

        console.log("\n🚀 AGGRESSIVE CLEANUP COMPLETE!");
    } catch (error) {
        console.error("❌ CLEANUP FAILED:", error);
    }
}

runAll();
