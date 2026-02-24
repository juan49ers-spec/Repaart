
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

    console.log('[toggleInvoicingModule] Toggling module:', {
        franchiseId,
        enabled
    });

    try {
        // Try franchises collection first (with exact ID)
        const franchiseRef = db.collection('franchises').doc(franchiseId);
        const franchiseDoc = await franchiseRef.get();

        console.log('[toggleInvoicingModule] Franchise doc exists (exact):', franchiseDoc.exists);

        if (franchiseDoc.exists) {
            await franchiseRef.update({
                invoicingEnabled: enabled,
                invoicingActivatedAt: enabled ? new Date() : null,
                updatedAt: new Date()
            });
            console.log('[toggleInvoicingModule] Updated in franchises collection');
            return { success: true, enabled };
        }

        // Fallback to users collection - try exact ID first
        const userRef = db.collection('users').doc(franchiseId);
        const userDoc = await userRef.get();

        console.log('[toggleInvoicingModule] User doc exists (exact):', userDoc.exists, 'Role:', userDoc.data()?.role);

        if (userDoc.exists && userDoc.data()?.role === 'franchise') {
            await userRef.update({
                invoicingEnabled: enabled,
                invoicingActivatedAt: enabled ? new Date() : null,
                updatedAt: new Date()
            });
            console.log('[toggleInvoicingModule] Updated in users collection (exact ID)');
            return { success: true, enabled };
        }

        // If still not found, try lowercase (for backward compatibility)
        const lowerCaseId = franchiseId.toLowerCase();
        if (lowerCaseId !== franchiseId) {
            console.log('[toggleInvoicingModule] Trying with lowercase ID:', lowerCaseId);

            const lowerUserRef = db.collection('users').doc(lowerCaseId);
            const lowerUserDoc = await lowerUserRef.get();

            console.log('[toggleInvoicingModule] User doc exists (lowercase):', lowerUserDoc.exists, 'Role:', lowerUserDoc.data()?.role);

            if (lowerUserDoc.exists && lowerUserDoc.data()?.role === 'franchise') {
                await lowerUserRef.update({
                    invoicingEnabled: enabled,
                    invoicingActivatedAt: enabled ? new Date() : null,
                    updatedAt: new Date()
                });
                console.log('[toggleInvoicingModule] Updated in users collection (lowercase ID)');
                return { success: true, enabled };
            }
        }

        console.error('[toggleInvoicingModule] Franchise not found:', franchiseId);
        throw new functions.https.HttpsError('not-found', 'Franchise not found');

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
                         context.auth.uid.toLowerCase() === franchiseId.toLowerCase();

    if (!isAuthorized) {
        throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
    }

    console.log('[getInvoicingModuleStatus] Checking status for:', franchiseId);

    try {
        // Try franchises collection first (with exact ID)
        const franchiseDoc = await db.collection('franchises').doc(franchiseId).get();

        console.log('[getInvoicingModuleStatus] Franchise doc exists (exact):', franchiseDoc.exists, 'Data:', franchiseDoc.data()?.invoicingEnabled);

        if (franchiseDoc.exists) {
            const data = franchiseDoc.data();
            return {
                enabled: data?.invoicingEnabled || false,
                activatedAt: data?.invoicingActivatedAt || null
            };
        }

        // Fallback to users collection - try exact ID first
        const userRef = db.collection('users').doc(franchiseId);
        const userDoc = await userRef.get();

        console.log('[getInvoicingModuleStatus] User doc exists (exact):', userDoc.exists);

        if (userDoc.exists) {
            const data = userDoc.data();
            console.log('[getInvoicingModuleStatus] User data (exact) invoicingEnabled:', data?.invoicingEnabled);
            return {
                enabled: data?.invoicingEnabled || false,
                activatedAt: data?.invoicingActivatedAt || null
            };
        }

        // Try with lowercase as last resort (for backward compatibility)
        const lowerCaseId = franchiseId.toLowerCase();
        if (lowerCaseId !== franchiseId) {
            console.log('[getInvoicingModuleStatus] Trying with lowercase ID:', lowerCaseId);
            const lowerUserRef = db.collection('users').doc(lowerCaseId);
            const lowerUserDoc = await lowerUserRef.get();

            console.log('[getInvoicingModuleStatus] User doc exists (lowercase):', lowerUserDoc.exists);

            if (lowerUserDoc.exists) {
                const data = lowerUserDoc.data();
                console.log('[getInvoicingModuleStatus] User data (lowercase) invoicingEnabled:', data?.invoicingEnabled);
                return {
                    enabled: data?.invoicingEnabled || false,
                    activatedAt: data?.invoicingActivatedAt || null
                };
            }
        }

        console.log('[getInvoicingModuleStatus] No documents found, returning disabled');
        return { enabled: false, activatedAt: null };

    } catch (error: any) {
        console.error('Error getting invoicing status:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Error getting invoicing status');
    }
});
