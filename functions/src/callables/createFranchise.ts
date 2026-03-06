import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { UserRole } from '../utils/claims';

/**
 * Create Franchise (Admin Only)
 * 
 * Secure function to create franchises.
 * Only users with admin token claim can execute this function.
 * Uses Admin SDK to bypass client-side restrictions.
 */
export const createFranchise = functions.region('us-central1').https.onCall(async (data: any, context: functions.https.CallableContext) => {
    try {
        // 1. Authentication & Permission Check
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'No autenticado. Por favor, inicia sesión.');
        }

        const callerRole = (context.auth.token.role as UserRole) || 'user';
        if (callerRole !== 'admin') {
            throw new functions.https.HttpsError('permission-denied', 'Solo administradores pueden crear franquicias.');
        }

        // 2. Validate required fields
        const { name, slug, settings, location, contactEmail, contactPhone } = data;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            throw new functions.https.HttpsError('invalid-argument', 'El nombre de la franquicia es requerido.');
        }

        if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
            throw new functions.https.HttpsError('invalid-argument', 'El slug (URL) de la franquicia es requerido.');
        }

        if (!settings || typeof settings !== 'object') {
            throw new functions.https.HttpsError('invalid-argument', 'La configuración económica es requerida.');
        }

        if (!location || typeof location !== 'object') {
            throw new functions.https.HttpsError('invalid-argument', 'La ubicación es requerida.');
        }

        const zipCodes = location.zipCodes || [];
        if (!Array.isArray(zipCodes) || zipCodes.length === 0) {
            throw new functions.https.HttpsError('invalid-argument', 'Debes añadir al menos un código postal.');
        }

        const { minOrderAmount, shippingCost, isActive } = settings;

        if (typeof minOrderAmount !== 'number' || minOrderAmount < 0) {
            throw new functions.https.HttpsError('invalid-argument', 'El pedido mínimo debe ser un número positivo.');
        }

        if (typeof shippingCost !== 'number' || shippingCost < 0) {
            throw new functions.https.HttpsError('invalid-argument', 'El costo de envío debe ser un número positivo.');
        }

        // 3. Create franchise document
        const franchiseData = {
            name: name.trim(),
            slug: slug.trim().toLowerCase(),
            role: 'franchise', // Flag for identification
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

        console.log('[createFranchise] Creating franchise:', franchiseData.name);

        const docRef = await admin.firestore().collection('franchises').add(franchiseData);

        // 4. Audit Logging
        await admin.firestore().collection('audit_logs').add({
            action: 'CREATE_FRANCHISE_ENTITY',
            targetId: docRef.id,
            name: franchiseData.name,
            performedBy: context.auth.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('[createFranchise] Franchise created successfully:', docRef.id);

        return {
            success: true,
            data: { id: docRef.id }
        };

    } catch (error: any) {
        console.error('[createFranchise] Error creating franchise:', error);
        if (error.code) throw error;
        throw new functions.https.HttpsError('internal', error.message || 'Error interno al crear la franquicia.');
    }
});