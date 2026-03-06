
import * as functions from 'firebase-functions/v1';
import { db } from '../config/firebase';
import { CallableContext } from 'firebase-functions/v1/https';

/**
 * Toggle invoicing module for a franchise
 * Admin only - enables/disables the invoicing feature for a franchise
 */
export const toggleInvoicingModule = functions.https.onCall(async (data: any, context: CallableContext) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');

    // Admin only
    if (context.auth.token.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only admin can toggle invoicing module');
    }

    const { franchiseId, enabled } = data;
    if (!franchiseId || typeof enabled !== 'boolean') {
        throw new functions.https.HttpsError('invalid-argument', 'Missing franchiseId or enabled');
    }

    let targetIds = [franchiseId];
    console.log('[toggleInvoicingModule] Toggling module for:', franchiseId);

    try {
        const franchisesCol = db.collection('franchises');
        const usersCol = db.collection('users');

        // Fallback: If not found by ID, try finding by name field
        const byNameFranchise = await franchisesCol.where('name', '==', franchiseId).get();
        if (!byNameFranchise.empty) {
            targetIds.push(byNameFranchise.docs[0].id);
        }

        const byNameUser = await usersCol.where('role', '==', 'franchise').where('name', '==', franchiseId).get();
        if (!byNameUser.empty) {
            targetIds.push(byNameUser.docs[0].id);
        }

        // Add variation of the primary ID
        const finalIds = Array.from(new Set([
            ...targetIds,
            franchiseId.toLowerCase(),
            franchiseId.toUpperCase()
        ]));

        const updateData = {
            invoicingEnabled: enabled,
            invoicingActivatedAt: enabled ? new Date() : null,
            'modules.billing.active': enabled,
            updatedAt: new Date()
        };

        let totalUpdatedCount = 0;

        // 1. Update direct documents IDs in both collections
        for (const id of finalIds) {
            // Update franchises
            const fRef = franchisesCol.doc(id);
            const fDoc = await fRef.get();
            if (fDoc.exists) {
                await fRef.update(updateData);
                console.log(`[toggleInvoicingModule] Updated franchises/${id}`);
                totalUpdatedCount++;
            }

            // Update users
            const uRef = usersCol.doc(id);
            const uDoc = await uRef.get();
            if (uDoc.exists) {
                await uRef.update(updateData);
                console.log(`[toggleInvoicingModule] Updated users/${id}`);
                totalUpdatedCount++;
            }
        }

        // 2. Update all users where the FIELD franchiseId matches (case-insensitive search)
        for (const id of finalIds) {
            const usersByField = await usersCol.where('franchiseId', '==', id).get();
            if (!usersByField.empty) {
                const batch = db.batch();
                usersByField.docs.forEach(doc => {
                    batch.update(doc.ref, updateData);
                });
                await batch.commit();
                console.log(`[toggleInvoicingModule] Updated ${usersByField.size} users with franchiseId field: ${id}`);
                totalUpdatedCount += usersByField.size;
            }
        }

        if (totalUpdatedCount === 0) {
            console.error('[toggleInvoicingModule] Franchise not found in any collection or field:', franchiseId);
            throw new functions.https.HttpsError('not-found', 'Franchise not found');
        }

        return { success: true, enabled };

    } catch (error: any) {
        console.error('Error toggling invoicing module:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Error toggling invoicing module');
    }
});

/**
 * Check if invoicing module is enabled for a franchise
 */
export const getInvoicingModuleStatus = functions.https.onCall(async (data: any, context: CallableContext) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');

    const { franchiseId } = data;
    if (!franchiseId) throw new functions.https.HttpsError('invalid-argument', 'Missing franchiseId');

    // Allow access if admin or the franchise itself (case-insensitive)
    const isAuthorized = context.auth.token.role === 'admin' ||
        (context.auth.token.franchiseId && context.auth.token.franchiseId.toLowerCase() === franchiseId.toLowerCase());

    if (!isAuthorized) {
        throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
    }

    console.log('[getInvoicingModuleStatus] Checking status for:', franchiseId);




    try {
        let targetIds = [franchiseId];

        // Fallback: If not found by ID, try finding by name field to resolve real ID
        const byNameUser = await db.collection('users').where('role', '==', 'franchise').where('name', '==', franchiseId).get();
        if (!byNameUser.empty) {
            targetIds.push(byNameUser.docs[0].id);
            const fId = byNameUser.docs[0].data().franchiseId;
            if (fId) targetIds.push(fId);
        }

        const searchIds = Array.from(new Set([
            ...targetIds,
            franchiseId.toLowerCase(),
            franchiseId.toUpperCase()
        ]));

        console.log('[getInvoicingModuleStatus] Searching for:', franchiseId);

        // 1. Try users collection FIRST (prioritize user doc keyed by UID)
        for (const id of searchIds) {
            const doc = await db.collection('users').doc(id).get();
            if (doc.exists) {
                const data = doc.data();
                // Check multiple possible fields for robustness
                const isEnabled = data?.invoicingEnabled === true ||
                    data?.modules?.billing?.active === true ||
                    false;

                console.log(`[getInvoicingModuleStatus] Found in users/${id}, enabled:`, isEnabled);
                return {
                    enabled: isEnabled,
                    activatedAt: data?.invoicingActivatedAt || null
                };
            }
        }

        // 2. Try searching by franchiseId FIELD in users collection
        for (const id of searchIds) {
            const usersByField = await db.collection('users').where('franchiseId', '==', id).get();
            if (!usersByField.empty) {
                const data = usersByField.docs[0].data();
                const isEnabled = data?.invoicingEnabled === true ||
                    data?.modules?.billing?.active === true ||
                    false;

                console.log(`[getInvoicingModuleStatus] Found in users by franchiseId field (${id}), enabled:`, isEnabled);
                return {
                    enabled: isEnabled,
                    activatedAt: data?.invoicingActivatedAt || null
                };
            }
        }

        // 3. Last fallback: Try franchises collection
        for (const id of searchIds) {
            const doc = await db.collection('franchises').doc(id).get();
            if (doc.exists) {
                const data = doc.data();
                const isEnabled = data?.invoicingEnabled === true ||
                    data?.modules?.billing?.active === true ||
                    false;

                console.log(`[getInvoicingModuleStatus] Found in franchises/${id}, enabled:`, isEnabled);
                return {
                    enabled: isEnabled,
                    activatedAt: data?.invoicingActivatedAt || null
                };
            }
        }

        console.log('[getInvoicingModuleStatus] No data found for:', franchiseId);
        return { enabled: false, activatedAt: null };

    } catch (error: any) {
        console.error('Error getting invoicing status:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Error getting invoicing status');
    }
});
