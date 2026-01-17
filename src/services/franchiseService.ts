import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Result } from '../types/result';
import type { FranchiseMetadata, FranchiseError } from '../types/franchise';
import { ok, err, isOk } from '../types/result';

/**
 * Fetch franchise data from Firestore
 * franchiseId should be the UID of the user document
 */
const fetchFromFirestore = async (franchiseId: string): Promise<FranchiseMetadata | null> => {
    try {
        // Use franchiseId as UID to lookup user document directly
        const docRef = doc(db, 'users', franchiseId);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) return null;

        const data = snapshot.data();

        // Verify this is a franchise user
        if (data.role !== 'franchise') return null;

        return {
            id: data.franchiseId || snapshot.id,
            name: data.name || data.displayName || 'Franquicia Sin Nombre',
            location: data.address || 'Sin dirección',
            ...data
        } as FranchiseMetadata;
    } catch (error) {
        console.error('Error fetching franchise:', error);
        return null;
    }
};

/**
 * FranchiseService - Clean production code
 * NO dev/mock logic here - use MSW or repository pattern for testing
 */
export const franchiseService = {
    /**
     * Get franchise metadata by ID
     * @param franchiseId - Unique franchise identifier (should be user UID)
     * @returns Result with FranchiseMetadata or specific error type
     * 
     * @example
     * ```ts
     * const result = await franchiseService.getFranchiseMeta('f-123');
     * if (isOk(result)) {
     *   console.log(result.data.name);
     * } else {
     *   // Handle result.error.type
     * }
     * ```
     */
    getFranchiseMeta: async (
        franchiseId: string
    ): Promise<Result<FranchiseMetadata, FranchiseError>> => {
        try {
            let data = await fetchFromFirestore(franchiseId);

            // FALLBACK: Try finding by NAME if ID lookup failed (Case Insensitive)
            if (!data) {
                console.warn(`Franchise ID '${franchiseId}' not found. Trying lookup by name...`);
                // Fetch all and find (small collection, safe for client-side filtering)
                const allResult = await franchiseService.getAllFranchises();

                if (isOk(allResult)) {
                    // Try matching by id (franchiseId field) first
                    let match = allResult.data.find((f: FranchiseMetadata) =>
                        f.id === franchiseId || (f as any).uid === franchiseId
                    );

                    // Then try matching by name (case insensitive)
                    if (!match) {
                        match = allResult.data.find((f: FranchiseMetadata) =>
                            f.name.toLowerCase().trim() === franchiseId.toLowerCase().trim()
                        );
                    }

                    if (match) {
                        data = match;
                        console.log(`Resolved '${franchiseId}' to franchise '${data.name}'`);
                    }
                }
            }

            if (!data) {
                return err({ type: 'NOT_FOUND', franchiseId });
            }

            return ok(data);

        } catch (error: any) {
            // Firebase permission errors
            if (error.code === 'permission-denied') {
                return err({ type: 'PERMISSION_DENIED', franchiseId });
            }

            // Network or unknown errors
            return err({
                type: 'NETWORK_ERROR',
                cause: error instanceof Error ? error : new Error(String(error))
            });
        }
    },

    /**
     * Get ALL franchises (from users collection where role='franchise')
     */
    getAllFranchises: async (): Promise<Result<FranchiseMetadata[], FranchiseError>> => {
        try {
            // Query users with role='franchise' instead of separate franchises collection
            const colRef = collection(db, 'users');
            const q = query(colRef, where('role', '==', 'franchise'));
            const snapshot = await getDocs(q);

            const franchises = snapshot.docs.map(doc => {
                const data = doc.data() as any; // Type assertion for Firestore data
                return {
                    id: data.franchiseId || doc.id, // Use franchiseId field or doc ID as fallback
                    name: data.name || data.displayName || data.email || 'Franquicia Sin Nombre',
                    location: data.address || data.location || 'Sin dirección',
                    status: data.status || 'active',
                    uid: doc.id, // User UID for compatibility
                    ...data
                } as FranchiseMetadata;
            });

            return ok(franchises);
        } catch (error: any) {
            console.error('Error fetching franchises from users:', error);
            return err({
                type: 'NETWORK_ERROR',
                cause: error instanceof Error ? error : new Error(String(error))
            });
        }
    }
};
