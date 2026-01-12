import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import {
    collection,
    setDoc,
    updateDoc,
    doc,
    getDocs,
    getDoc,
    serverTimestamp,
    query,
    where,
    onSnapshot,
    deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Rider } from '../store/useFleetStore';
import { notificationService } from './notificationService';
import {
    Moto,
    CreateMotoInput,
    toMotoId
} from '../schemas/fleet';

const RIDERS_COLLECTION = 'users'; // UNIFIED DATA SOURCE
const ASSETS_COLLECTION = 'fleet_assets';

// SECONDARY APP INITIALIZATION (For Admin-Side Rider Creation)
// This avoids logging out the current admin when creating a new auth user
const secondaryApp = initializeApp(db.app.options, 'SecondaryFleet');
const secondaryAuth = getAuth(secondaryApp);

/**
 * Mappers to ensure data consistency between Firestore and UI
 */
const mapDocToRider = (docSnap: any): Rider => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        fullName: data.displayName || data.fullName || 'Rider sin nombre',
        email: data.email,
        phone: data.phoneNumber || data.phone || '',
        status: data.status || 'active',
        contractHours: data.contractHours,
        metrics: {
            totalDeliveries: data.metrics?.totalDeliveries || 0,
            rating: data.metrics?.rating || 0,
            efficiency: data.metrics?.efficiency || 0,
            joinedAt: data.metrics?.joinedAt?.toDate?.().toISOString() || data.createdAt?.toDate?.().toISOString() || new Date().toISOString()
        },
        franchiseId: data.franchiseId,
        avatarUrl: data.photoURL
    };
};

const mapDocToMoto = (docSnap: any): Moto => {
    const data = docSnap.data();
    return {
        id: toMotoId(docSnap.id),
        franchiseId: data.franchiseId,
        plate: data.plate || data.matricula || '', // Support legacy matricula field
        brand: data.brand || '',
        model: data.model || data.modelo || '', // Support legacy modelo field
        currentKm: data.currentKm || data.km_actuales || 0,
        nextRevisionKm: data.nextRevisionKm || data.proxima_revision_km || 5000,
        status: data.status || data.estado || 'active',
        createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.().toISOString() || new Date().toISOString()
    } as Moto;
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

            // Filter status in memory if needed, but 'users' might have non-riders if query fails
            return riders.filter(r => r.status !== 'deleted');
        } catch (error) {
            console.error('[FleetService] Error fetching riders:', error);
            throw error;
        }
    },

    /**
     * Subscribe to riders by franchise
     */
    subscribeToRiders: (franchiseId: string, callback: (riders: Rider[]) => void) => {
        const q = query(
            collection(db, RIDERS_COLLECTION),
            where('franchiseId', '==', franchiseId)
        );

        return onSnapshot(q, (snapshot) => {
            const riders = snapshot.docs.map(mapDocToRider);
            callback(riders);
        }, (error) => {
            console.error('[FleetService] Error in riders subscription:', error);
        });
    },

    /**
     * Create a new rider (Auth + Firestore)
     */
    createRider: async (riderData: Omit<Rider, 'id' | 'metrics'> & { password?: string }): Promise<Rider> => {
        try {
            // Check for existing profile in Firestore
            const q = query(
                collection(db, RIDERS_COLLECTION),
                where('email', '==', riderData.email)
            );
            const existing = await getDocs(q);

            if (!existing.empty) {
                const docSnap = existing.docs[0];
                const data = docSnap.data();

                if (data.status === 'inactive' || data.status === 'deleted') {
                    console.log(`[Resurrection] Reactivating rider ${riderData.email}`);
                    const uid = docSnap.id;
                    await updateDoc(doc(db, RIDERS_COLLECTION, uid), {
                        displayName: riderData.fullName,
                        phoneNumber: riderData.phone,
                        franchiseId: riderData.franchiseId,
                        contractHours: riderData.contractHours,
                        status: 'active',
                        role: 'rider', // Ensure role is set
                        updatedAt: serverTimestamp()
                    });
                    return mapDocToRider(await getDoc(doc(db, RIDERS_COLLECTION, uid)));
                } else {
                    // Already exists and is active
                    throw new Error(`auth/email-already-in-use: El usuario con email ${riderData.email} ya existe.`);
                }
            }

            if (!riderData.password) throw new Error("Contraseña requerida para nuevos riders");

            const credential = await createUserWithEmailAndPassword(secondaryAuth, riderData.email, riderData.password);
            const uid = credential.user.uid;

            const payload = {
                email: riderData.email,
                displayName: riderData.fullName, // Unified field
                phoneNumber: riderData.phone,    // Unified field
                franchiseId: riderData.franchiseId,
                contractHours: riderData.contractHours,
                photoURL: '',
                status: 'active',
                role: 'rider',
                metrics: {
                    totalDeliveries: 0,
                    rating: 5.0,
                    efficiency: 100,
                    joinedAt: serverTimestamp()
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            // Remove helper fields if any
            delete (payload as any).password;
            delete (payload as any).fullName;
            delete (payload as any).phone;

            await setDoc(doc(db, RIDERS_COLLECTION, uid), payload);
            return {
                id: uid,
                fullName: riderData.fullName,
                email: riderData.email,
                phone: riderData.phone,
                franchiseId: riderData.franchiseId,
                status: 'active',
                contractHours: riderData.contractHours,
                metrics: { totalDeliveries: 0, rating: 5, efficiency: 100, joinedAt: new Date().toISOString() }
            };
        } catch (error: any) {
            console.error('[FleetService] Error creating rider:', error);
            // Re-throw standardized error for UI
            if (error.code === 'auth/email-already-in-use') {
                throw new Error('auth/email-already-in-use: El usuario ya existe en el sistema de autenticación pero no tiene perfil en la base de datos (Usuario Fantasma). Contacta con soporte.');
            }
            throw error;
        }
    },

    updateRider: async (id: string, data: Partial<Rider>): Promise<void> => {
        await updateDoc(doc(db, RIDERS_COLLECTION, id), {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    deleteRider: async (id: string): Promise<void> => {
        await updateDoc(doc(db, RIDERS_COLLECTION, id), {
            status: 'inactive',
            updatedAt: serverTimestamp()
        });
    },

    // =====================================================
    // 🏍️ ASSET MANAGEMENT (MOTOS / VEHICLES)
    // =====================================================

    /**
     * Subscribe to all assets for a franchise
     */
    subscribeToFleet: (franchiseId: string, callback: (assets: Moto[]) => void) => {
        const q = query(
            collection(db, ASSETS_COLLECTION),
            where('franchiseId', '==', franchiseId)
        );

        return onSnapshot(q, (snap) => {
            const assets = snap.docs.map(mapDocToMoto);
            callback(assets);
        });
    },

    /**
     * Create a new Moto with validation
     */
    createMoto: async (franchiseId: string, data: CreateMotoInput): Promise<Moto> => {
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
            id: toMotoId(newRef.id),
            ...data,
            franchiseId,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        } as Moto;
    },

    /**
     * Update Moto details with Predictive Maintenance Logic
     */
    updateVehicle: async (id: string, data: Partial<Moto>): Promise<void> => {
        const ref = doc(db, ASSETS_COLLECTION, id);
        const snap = await getDoc(ref);
        if (!snap.exists()) throw new Error("Moto not found");

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
    },

    deleteVehicle: async (id: string): Promise<void> => {
        await deleteDoc(doc(db, ASSETS_COLLECTION, id));
    },

    // Aliases for backward compatibility
    subscribeToMotos(franchiseId: string, callback: (assets: Moto[]) => void) {
        return this.subscribeToFleet(franchiseId, callback);
    },
    async updateMoto(id: string, data: Partial<Moto>): Promise<void> {
        return this.updateVehicle(id, data);
    },

    // Vehicle store compatibility
    async getVehicles(franchiseId: string): Promise<any[]> {
        const q = query(collection(db, ASSETS_COLLECTION), where('franchiseId', '==', franchiseId));
        const snap = await getDocs(q);
        return snap.docs.map(mapDocToMoto);
    },
    async createVehicle(franchiseId: string, data: any): Promise<any> {
        // Standardize input if it uses snake_case (Legacy Vehicle store)
        const standardized: CreateMotoInput = {
            plate: data.matricula || data.plate,
            brand: data.brand || '',
            model: data.modelo || data.model,
            currentKm: data.km_actuales || data.currentKm || 0,
            nextRevisionKm: data.proxima_revision_km || data.nextRevisionKm || 5000,
            status: (data.estado === 'activo' ? 'active' : (data.estado === 'mantenimiento' ? 'maintenance' : (data.estado || 'active'))) as any
        };
        return this.createMoto(franchiseId, standardized);
    }
};

// Aliases for backward compatibility during migration
export const FleetService = fleetService;
export const vehicleService = fleetService;
