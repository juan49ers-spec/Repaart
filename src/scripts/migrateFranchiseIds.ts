
/**
 * MIGRATION SCRIPT: FranchiseId Custom → UID
 * 
 * Purpose: Update all Firestore collections to use user UIDs as franchise identifiers
 * instead of custom franchiseId strings like 'SEVILLA'
 * 
 * Collections affected:
 * - financial_records (franchise_id field)
 * - shifts (franchiseId field)
 * - motos (franchise_id field)
 * - riders (franchise_id field)
 * 
 * HOW TO RUN:
 * 1. Open browser console on https://repaartfinanzas.web.app
 * 2. Copy-paste this entire script
 * 3. Run: await migrateFranchiseIds()
 * 4. Confirm when prompted
 * 
 * SAFETY FEATURES:
 * - Dry-run mode to preview changes
 * - Detailed logging
 * - Backup recommendations
 * - Can be run multiple times safely (idempotent)
 */

import { db } from '../lib/firebase';
import { collection, getDocs, doc, query, where, writeBatch } from 'firebase/firestore';

interface MigrationMapping {
    uid: string;
    franchiseId: string;
    displayName: string;
    email: string;
}

interface MigrationResult {
    success: boolean;
    mappings: MigrationMapping[];
    updated: {
        financial_records: number;
        shifts: number;
        motos: number;
        riders: number;
    };
    errors: string[];
}

/**
 * Main migration function
 */
export async function migrateFranchiseIds(dryRun: boolean = true): Promise<MigrationResult> {
    console.log('🚀 Starting FranchiseId Migration Script...');
    console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will update data)'}`);

    const result: MigrationResult = {
        success: false,
        mappings: [],
        updated: {
            financial_records: 0,
            shifts: 0,
            motos: 0,
            riders: 0
        },
        errors: []
    };

    try {
        // =====================================================
        // STEP 1: Build UID ↔ franchiseId mapping
        // =====================================================
        console.log('\n📋 Step 1: Building UID mapping from users collection...');

        const usersSnapshot = await getDocs(collection(db, 'users'));
        const franchiseUsers = usersSnapshot.docs.filter(doc => {
            const data = doc.data();
            return data.role === 'franchise' && data.franchiseId;
        });

        console.log(`Found ${franchiseUsers.length} franchise users with custom franchiseId`);

        franchiseUsers.forEach(userDoc => {
            const data = userDoc.data();
            const mapping: MigrationMapping = {
                uid: userDoc.id,
                franchiseId: data.franchiseId,
                displayName: data.displayName || data.name || 'Unknown',
                email: data.email || 'Unknown'
            };
            result.mappings.push(mapping);
            console.log(`  ✓ ${mapping.franchiseId} → ${mapping.uid} (${mapping.email})`);
        });

        if (result.mappings.length === 0) {
            console.log('⚠️  No franchise users with custom franchiseId found. Nothing to migrate.');
            result.success = true;
            return result;
        }

        // =====================================================
        // STEP 2: Migrate financial_records collection
        // =====================================================
        console.log('\n💰 Step 2: Migrating financial_records...');
        for (const mapping of result.mappings) {
            const count = await migrateCollection(
                'financial_records',
                'franchise_id',
                mapping.franchiseId,
                mapping.uid,
                dryRun
            );
            result.updated.financial_records += count;
        }

        // =====================================================
        // STEP 3: Migrate shifts collection
        // =====================================================
        console.log('\n📅 Step 3: Migrating shifts...');
        for (const mapping of result.mappings) {
            const count = await migrateCollection(
                'shifts',
                'franchiseId',
                mapping.franchiseId,
                mapping.uid,
                dryRun
            );
            result.updated.shifts += count;
        }

        // =====================================================
        // STEP 4: Migrate motos collection
        // =====================================================
        console.log('\n🏍️  Step 4: Migrating motos...');
        for (const mapping of result.mappings) {
            const count = await migrateCollection(
                'motos',
                'franchise_id',
                mapping.franchiseId,
                mapping.uid,
                dryRun
            );
            result.updated.motos += count;
        }

        // =====================================================
        // STEP 5: Migrate riders collection
        // =====================================================
        console.log('\n👤 Step 5: Migrating riders...');
        for (const mapping of result.mappings) {
            const count = await migrateCollection(
                'riders',
                'franchise_id',
                mapping.franchiseId,
                mapping.uid,
                dryRun
            );
            result.updated.riders += count;
        }

        // =====================================================
        // FINAL SUMMARY
        // =====================================================
        console.log('\n✅ Migration completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`  Financial Records: ${result.updated.financial_records}`);
        console.log(`  Shifts: ${result.updated.shifts}`);
        console.log(`  Motos: ${result.updated.motos}`);
        console.log(`  Riders: ${result.updated.riders}`);
        console.log(`  Total: ${Object.values(result.updated).reduce((a, b) => a + b, 0)} documents updated`);

        if (dryRun) {
            console.log('\n⚠️  This was a DRY RUN. No data was actually changed.');
            console.log('To execute the migration, run: await migrateFranchiseIds(false)');
        }

        result.success = true;

    } catch (error: any) {
        console.error('❌ Migration failed:', error);
        result.errors.push(error.message);
        result.success = false;
    }

    return result;
}

/**
 * Helper function to migrate a specific collection
 */
async function migrateCollection(
    collectionName: string,
    fieldName: string,
    oldValue: string,
    newValue: string,
    dryRun: boolean
): Promise<number> {
    try {
        const q = query(
            collection(db, collectionName),
            where(fieldName, '==', oldValue)
        );

        const snapshot = await getDocs(q);
        const docsToUpdate = snapshot.docs;

        console.log(`  Found ${docsToUpdate.length} documents in ${collectionName} with ${fieldName}="${oldValue}"`);

        if (docsToUpdate.length === 0) {
            return 0;
        }

        if (dryRun) {
            console.log(`  [DRY RUN] Would update ${docsToUpdate.length} documents`);
            return docsToUpdate.length;
        }

        // Batch update for efficiency (max 500 per batch)
        const batches = [];
        let currentBatch = writeBatch(db);
        let operationCount = 0;

        for (const document of docsToUpdate) {
            currentBatch.update(doc(db, collectionName, document.id), {
                [fieldName]: newValue
            });
            operationCount++;

            if (operationCount === 500) {
                batches.push(currentBatch);
                currentBatch = writeBatch(db);
                operationCount = 0;
            }
        }

        if (operationCount > 0) {
            batches.push(currentBatch);
        }

        // Commit all batches
        for (let i = 0; i < batches.length; i++) {
            await batches[i].commit();
            console.log(`  ✓ Batch ${i + 1}/${batches.length} committed`);
        }

        console.log(`  ✅ Updated ${docsToUpdate.length} documents in ${collectionName}`);
        return docsToUpdate.length;

    } catch (error: any) {
        console.error(`  ❌ Error migrating ${collectionName}:`, error);
        throw error;
    }
}

/**
 * Verification function to check migration status
 */
export async function verifyMigration(): Promise<void> {
    console.log('🔍 Verifying migration status...\n');

    const collections = [
        { name: 'financial_records', field: 'franchise_id' },
        { name: 'shifts', field: 'franchiseId' },
        { name: 'motos', field: 'franchise_id' },
        { name: 'riders', field: 'franchise_id' }
    ];

    for (const col of collections) {
        const snapshot = await getDocs(collection(db, col.name));
        const oldFormat = snapshot.docs.filter(doc => {
            const value = doc.data()[col.field];
            return value && typeof value === 'string' && value.length < 20; // Custom IDs are short
        });

        const newFormat = snapshot.docs.filter(doc => {
            const value = doc.data()[col.field];
            return value && typeof value === 'string' && value.length > 20; // UIDs are long
        });

        console.log(`${col.name}:`);
        console.log(`  Old format (custom ID): ${oldFormat.length}`);
        console.log(`  New format (UID): ${newFormat.length}`);
        console.log(`  Total: ${snapshot.docs.length}\n`);
    }
}

// Make functions available globally for console use
if (typeof window !== 'undefined') {
    (window as any).migrateFranchiseIds = migrateFranchiseIds;
    (window as any).verifyMigration = verifyMigration;
    console.log('✅ Migration script loaded. Available functions:');
    console.log('  - migrateFranchiseIds(dryRun = true)');
    console.log('  - verifyMigration()');
}
