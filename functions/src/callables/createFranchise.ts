import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';



/**
 * Create Franchise (Admin Only)
 * 
 * Secure function to create franchises.
 * Only users with admin token claim can execute this function.
 * Uses Admin SDK to bypass client-side restrictions.
 * 
 * @param data - Franchise data including:
 *   - name: string
 *   - slug: string
 *   - settings: object { minOrderAmount, shippingCost, isActive }
 *   - location: object { address, city, zipCodes[] }
 *   - contactEmail?: string
 *   - contactPhone?: string
 * 
 * @returns { success: boolean, data?: { id: string }, error?: string }
 */
export const createFranchise = functions.https.onCall(async (data, context) => {
    try {
        // 1. Verify admin claim
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'No autenticado. Por favor, inicia sesión.'
            );
        }

        if (!context.auth.token.admin) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'Solo administradores pueden crear franquicias.'
            );
        }

        // 2. Validate required fields
        const { name, slug, settings, location, contactEmail, contactPhone } = data;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'El nombre de la franquicia es requerido.'
            );
        }

        if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'El slug (URL) de la franquicia es requerido.'
            );
        }

        if (!settings || typeof settings !== 'object') {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'La configuración económica es requerida.'
            );
        }

        if (!location || typeof location !== 'object') {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'La ubicación es requerida.'
            );
        }

        // Validate zip codes
        const zipCodes = location.zipCodes || [];
        if (!Array.isArray(zipCodes) || zipCodes.length === 0) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Debes añadir al menos un código postal.'
            );
        }

        // Validate settings
        const { minOrderAmount, shippingCost, isActive } = settings;

        if (typeof minOrderAmount !== 'number' || minOrderAmount < 0) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'El pedido mínimo debe ser un número positivo.'
            );
        }

        if (typeof shippingCost !== 'number' || shippingCost < 0) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'El costo de envío debe ser un número positivo.'
            );
        }

        // 3. Create franchise document using Admin SDK
        const franchiseData = {
            name: name.trim(),
            slug: slug.trim().toLowerCase(),
            role: 'franchise',
            status: 'active',
            isActive: typeof isActive === 'boolean' ? isActive : true,
            settings: {
                minOrderAmount: minOrderAmount || 0,
                shippingCost: shippingCost || 0
            },
            location: {
                address: location.address?.trim() || '',
                city: location.city?.trim() || '',
                zipCodes: zipCodes
            },
            contactEmail: contactEmail?.trim(),
            contactPhone: contactPhone?.trim(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        console.log('[createFranchise] Creating franchise:', {
            name: franchiseData.name,
            slug: franchiseData.slug,
            creator: context.auth.uid
        });

        // Use Admin SDK to write to franchises collection
        const docRef = await admin.firestore().collection('franchises').add(franchiseData);

        console.log('[createFranchise] Franchise created successfully:', docRef.id);

        // 4. Return success
        return {
            success: true,
            data: {
                id: docRef.id
            }
        };

    } catch (error) {
        console.error('[createFranchise] Error creating franchise:', error);

        if (error instanceof functions.https.HttpsError) {
            // Re-throw if it's already an HttpsError
            throw error;
        }

        // Convert other errors to HttpsError
        throw new functions.https.HttpsError(
            'internal',
            error instanceof Error ? error.message : 'Error interno al crear la franquicia.'
        );
    }
});