import { getFunctions, httpsCallable } from 'firebase/functions';
import {
    collection,
    updateDoc,
    doc,
    getDocs,
    getDoc,
    serverTimestamp,
    query,
    where,
    onSnapshot,
    deleteDoc,
    setDoc,
    QueryDocumentSnapshot,
    DocumentData
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Rider } from '../store/useFleetStore';
import { notificationService } from './notificationService';
import {
    Vehicle,
    VehicleStatus,
    CreateVehicleInput,
    toVehicleId
} from '../schemas/fleet';
import { ServiceError, validationError, notFoundError, permissionError } from '../utils/ServiceError';

const RIDERS_COLLECTION = 'users'; // UNIFIED DATA SOURCE
const ASSETS_COLLECTION = 'fleet_assets';

/**
 * Mappers to ensure data consistency between Firestore and UI
 */
const mapDocToRider = (docSnap: QueryDocumentSnapshot<DocumentData>): Rider => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        fullName: data.displayName || data.fullName || 'Rider sin nombre',
        email: data.email,
        phone: data.phoneNumber || data.phone || '',
        status: data.status || 'active',
        contractHours: data.contractHours,
        licenseType: data.licenseType || '125cc', // Default to 125cc if missing
        metrics: {
            totalDeliveries: data.metrics?.totalDeliveries || 0,
            rating: data.metrics?.rating || 0,
            efficiency: data.metrics?.efficiency || 0,
            joinedAt: data.metrics?.joinedAt?.toDate?.().toISOString() || data.metrics?.joinedAt || data.createdAt?.toDate?.().toISOString() || new Date().toISOString()
        },
        franchiseId: data.franchiseId,
        avatarUrl: data.photoURL,
        skills: data.skills || []
    };
};

const mapDocToVehicle = (docSnap: QueryDocumentSnapshot<DocumentData>): Vehicle => {
    const data = docSnap.data();
    let status = data.status || data.estado || 'active';

    // Translate legacy Spanish status values
    if (status === 'activo') status = 'active';
    if (status === 'mantenimiento') status = 'maintenance';
    if (status === 'fuera_de_servicio') status = 'out_of_service';

    return {
        id: toVehicleId(docSnap.id),
        franchiseId: data.franchiseId || data.franchise_id,
        plate: data.plate || data.matricula || '',
        brand: data.brand || '',
        model: data.model || data.modelo || '',
        currentKm: data.currentKm || data.km_actuales || 0,
        nextRevisionKm: data.nextRevisionKm || data.proxima_revision_km || 5000,
        status: status as VehicleStatus,
        type: data.type || 'vehicle',
        createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.().toISOString() || new Date().toISOString()
    } as Vehicle;
};

export const fleetService = {
    // =====================================================
    // 👤 RIDER MANAGEMENT
    // =====================================================

    /**
     * Get all active riders for a specific franchise
     */
    getRiders: async (franchiseId?: string): Promise<Rider[]> => {
        try {
            let q;
            if (franchiseId && franchiseId.trim() !== '') {
                q = query(
                    collection(db, RIDERS_COLLECTION),
                    where('franchiseId', '==', franchiseId),
                    where('role', '==', 'rider') // Filter by role
                );
            } else {
                // Admin view: all riders
                q = query(
                    collection(db, RIDERS_COLLECTION),
                    where('role', '==', 'rider')
                );
            }

            const querySnapshot = await getDocs(q);
            const riders = querySnapshot.docs.map(mapDocToRider);

            return riders.filter(r => r.status !== 'deleted');
        } catch (error: unknown) {
            console.error('[FleetService] Error fetching riders:', error);
            throw new ServiceError('getRiders', { cause: error });
        }
    },

    /**
     * Subscribe to riders by franchise
     */
    subscribeToRiders: (franchiseId: string, callback: (riders: Rider[]) => void) => {
        const q = query(
            collection(db, RIDERS_COLLECTION),
            where('franchiseId', '==', franchiseId),
            where('role', '==', 'rider')
        );

        return onSnapshot(q, (snapshot) => {
            const riders = snapshot.docs.map(mapDocToRider);
            callback(riders.filter(r => r.status !== 'deleted'));
        }, (error) => {
            console.error('[FleetService] Error in riders subscription:', error);
            new ServiceError('subscribeToRiders', { cause: error, code: 'NETWORK' });
        });
    },

    /**
     * Create a new rider (Auth + Firestore) via Secure Backend
     */
    createRider: async (riderData: Omit<Rider, 'id' | 'metrics'> & { password?: string; joinedAt?: string; licenseType?: '49cc' | '125cc' }): Promise<Rider> => {
        try {
            if (!riderData.password) throw validationError('createRider', "Contraseña requerida para nuevos riders");

            const functions = getFunctions();
            const createUserManaged = httpsCallable(functions, 'createUserManaged');

            // Payload must match what useUserManager sends and what Cloud Function expects
            const payload = {
                email: riderData.email,
                password: riderData.password,
                role: 'rider',
                franchiseId: riderData.franchiseId,
                displayName: riderData.fullName,
                phoneNumber: riderData.phone ? (riderData.phone.startsWith('+') ? riderData.phone : `+34${riderData.phone}`) : undefined,
                contractHours: riderData.contractHours,
                licenseType: riderData.licenseType || '125cc',
                status: 'active',
                metrics: {
                    totalDeliveries: 0,
                    rating: 5.0,
                    efficiency: 100,
                    joinedAt: riderData.joinedAt || new Date().toISOString() // Use provided date or now
                }
            };

            const result = await createUserManaged(payload);
            const response = result.data as { uid: string, message: string };
            const uid = response.uid;

            // Return optimistic rider object for UI
            return {
                id: uid,
                fullName: riderData.fullName,
                email: riderData.email,
                phone: riderData.phone,
                franchiseId: riderData.franchiseId,
                status: 'active',
                contractHours: riderData.contractHours,
                licenseType: riderData.licenseType || '125cc',
                metrics: { totalDeliveries: 0, rating: 5, efficiency: 100, joinedAt: riderData.joinedAt || new Date().toISOString() }
            };

        } catch (error: any) {
            console.error('[FleetService] Error creating rider:', error);

            // Map Cloud Function errors to friendlier UI messages
            if (error.message?.includes('already-exists') || error.code === 'already-exists') {
                throw validationError('createRider', 'Este email ya está registrado en el sistema.');
            }
            if (error.message?.includes('permission-denied') || error.code === 'permission-denied') {
                throw permissionError('createRider', 'No tienes permisos para crear este tipo de usuario o para esta franquicia.');
            }

            throw new ServiceError('createRider', { cause: error });
        }
    },

    updateRider: async (id: string, data: Partial<Rider>): Promise<void> => {
        try {
            await updateDoc(doc(db, RIDERS_COLLECTION, id), {
                ...data,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            throw new ServiceError('updateRider', { cause: error });
        }
    },

    deleteRider: async (id: string): Promise<void> => {
        try {
            await updateDoc(doc(db, RIDERS_COLLECTION, id), {
                status: 'inactive',
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            throw new ServiceError('deleteRider', { cause: error });
        }
    },

    // =====================================================
    // 🏍️ ASSET MANAGEMENT (MOTOS / VEHICLES)
    // =====================================================

    /**
     * Subscribe to all assets for a franchise
     */
    subscribeToFleet: (franchiseId: string, callback: (assets: Vehicle[]) => void) => {
        const q = query(
            collection(db, ASSETS_COLLECTION),
            where('franchiseId', '==', franchiseId)
        );

        return onSnapshot(q, (snap) => {
            const assets = snap.docs.map(mapDocToVehicle);
            callback(assets);
        }, (error) => {
            console.error('[FleetService] Error in fleet subscription:', error);
            new ServiceError('subscribeToFleet', { cause: error, code: 'NETWORK' });
        });
    },

    /**
     * Create a new Vehicle with validation
     */
    createVehicle: async (franchiseId: string, data: CreateVehicleInput): Promise<Vehicle> => {
        try {
            const newRef = doc(collection(db, ASSETS_COLLECTION));

            const payload = {
                ...data,
                franchiseId,
                status: 'active',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await setDoc(newRef, payload);

            return {
                id: toVehicleId(newRef.id),
                ...data,
                franchiseId,
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            } as Vehicle;
        } catch (error) {
            throw new ServiceError('createVehicle', { cause: error });
        }
    },

    /**
     * Update Vehicle details with Predictive Maintenance Logic
     */
    updateVehicle: async (id: string, data: Partial<Vehicle>): Promise<void> => {
        try {
            const ref = doc(db, ASSETS_COLLECTION, id);
            const snap = await getDoc(ref);
            if (!snap.exists()) throw notFoundError('updateVehicle', "Vehicle not found");

            const current = snap.data();
            const newKm = data.currentKm ?? current.currentKm ?? 0;
            const limitKm = data.nextRevisionKm ?? current.nextRevisionKm ?? 5000;
            let newStatus = data.status ?? current.status;

            // Predictive Maintenance Logic
            if (newKm >= limitKm && newStatus !== 'maintenance') {
                newStatus = 'maintenance';
                await notificationService.notifyFranchise(current.franchiseId, {
                    title: '🚨 MANTENIMIENTO OBLIGATORIO',
                    message: `Vehículo ${current.plate || current.matricula} alcanzó ${limitKm}km. Bloqueado.`,
                    type: 'ALERT',
                    priority: 'high'
                });
            }

            await updateDoc(ref, {
                ...data,
                status: newStatus,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            if (error instanceof ServiceError) throw error;
            throw new ServiceError('updateVehicle', { cause: error });
        }
    },

    deleteVehicle: async (id: string): Promise<void> => {
        try {
            await deleteDoc(doc(db, ASSETS_COLLECTION, id));
        } catch (error) {
            throw new ServiceError('deleteVehicle', { cause: error });
        }
    },

    // Aliases for backward compatibility
    subscribeToMotos(franchiseId: string, callback: (assets: Vehicle[]) => void) {
        return this.subscribeToFleet(franchiseId, callback);
    },
    async updateMoto(id: string, data: Partial<Vehicle>): Promise<void> {
        return this.updateVehicle(id, data);
    },

    // Vehicle store compatibility
    async getVehicles(franchiseId: string): Promise<Vehicle[]> {
        try {
            const q = query(collection(db, ASSETS_COLLECTION), where('franchiseId', '==', franchiseId));
            const snap = await getDocs(q);
            return snap.docs.map(mapDocToVehicle);
        } catch (error) {
            throw new ServiceError('getVehicles', { cause: error });
        }
    },
    async createMoto(franchiseId: string, data: Record<string, any>): Promise<Vehicle> {
        try {
            // Standardize input if it uses snake_case (Legacy Vehicle store)
            const standardized: CreateVehicleInput = {
                plate: data.matricula || data.plate,
                brand: data.brand || '',
                model: data.modelo || data.model,
                currentKm: data.km_actuales || data.currentKm || 0,
                nextRevisionKm: data.proxima_revision_km || data.nextRevisionKm || 5000,
                status: (data.estado === 'activo' ? 'active' : (data.estado === 'mantenimiento' ? 'maintenance' : (data.estado || 'active'))),
                type: 'vehicle'
            };
            return await this.createVehicle(franchiseId, standardized);
        } catch (error) {
            if (error instanceof ServiceError) throw error;
            throw new ServiceError('createMoto', { cause: error });
        }
    }
};

// Aliases for backward compatibility during migration
export const FleetService = fleetService;
export const vehicleService = fleetService;
