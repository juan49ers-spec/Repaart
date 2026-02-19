import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { db } from '../config/firebase';
import { CallableContext } from 'firebase-functions/v1/https';

const mappingsCollection = db.collection('franchise_mappings');

interface FranchiseMapping {
    flyderBusinessId: number;
    flyderBusinessName: string;
    repaartFranchiseId: string;
    createdAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;
}

/**
 * Crea o actualiza un mapeo de Franquicia Flyder -> Repaart
 */
export const createFranchiseMapping = functions.https.onCall(async (data: any, context: CallableContext) => {
    // 1. Auth Check - Solo Admin
    if (!context.auth || context.auth.token.role !== 'admin') {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Solo administradores pueden gestionar mapeos'
        );
    }

    const { flyderBusinessId, flyderBusinessName, repaartFranchiseId } = data;

    if (!flyderBusinessId || !repaartFranchiseId) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Faltan datos requeridos (flyderBusinessId, repaartFranchiseId)'
        );
    }

    try {
        const mapping: FranchiseMapping = {
            flyderBusinessId,
            flyderBusinessName: flyderBusinessName || 'Unknown Flyder Business',
            repaartFranchiseId,
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
        };

        // Usamos el flyderBusinessId como documento ID para unicidad y búsqueda rápida
        await mappingsCollection.doc(String(flyderBusinessId)).set(mapping, { merge: true });

        return { success: true, mapping };
    } catch (error) {
        console.error('Error creating mapping:', error);
        throw new functions.https.HttpsError('internal', 'Error al crear mapeo');
    }
});

/**
 * Lista todos los mapeos existentes
 */
export const listFranchiseMappings = functions.https.onCall(async (data, context) => {
    if (!context.auth || context.auth.token.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
    }

    try {
        const snapshot = await mappingsCollection.get();
        const mappings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { success: true, mappings };
    } catch (error) {
        console.error('Error listing mappings:', error);
        throw new functions.https.HttpsError('internal', 'Error al listar mapeos');
    }
});

/**
 * Crea mapeos faltantes automáticamente detectando órdenes
 * (Esta es una utilidad avanzada para poblar la tabla inicial)
 */
export const createMissingMappings = functions.https.onCall(async (data, context) => {
    // Implementación futura si se requiere auto-discovery
    return { success: true, message: 'Not implemented yet' };
});
