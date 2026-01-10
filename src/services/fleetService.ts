import { db } from '../lib/firebase';
import {
    collection,
    query,
    where,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';

const COLLECTION_NAME = 'fleet_assets';

export interface Vehicle {
    id?: string;
    franchise_id: string;
    plate: string;
    model: string;
    alias?: string;
    status: 'active' | 'maintenance' | 'stopped' | 'sold';
    currentKm: number;
    nextRevisionKm: number;
    created_at?: Timestamp;
    updated_at?: Timestamp;
    [key: string]: any;
}

export const fleetService = {
    /**
     * Suscripción en tiempo real a la flota de una franquicia
     * @param {string} franchiseId - ID obligatorio
     * @param {function} callback - Función que recibe el array de vehículos
     * @returns {function} Unsubscribe function
     */
    subscribeToFleet: (franchiseId: string, callback: (vehicles: Vehicle[]) => void) => {
        if (!franchiseId) {
            console.warn("fleetService: No franchiseId provided for subscription");
            return () => { };
        }

        // Query simple y directa: Dame los coches de ESTA franquicia
        const q = query(
            collection(db, COLLECTION_NAME),
            where('franchise_id', '==', franchiseId)
            // Podrías añadir orderBy('plate') si creas un índice compuesto, 
            // pero por ahora dejémoslo simple para evitar errores de índice.
        );

        return onSnapshot(q, (snapshot) => {
            const vehicles = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Vehicle[];
            callback(vehicles);
        }, (error) => {
            console.error("Error subscribing to fleet:", error);
        });
    },

    /**
     * Añadir vehículo asegurando la vinculación
     */
    addVehicle: async (franchiseId: string, vehicleData: Partial<Vehicle>) => {
        if (!franchiseId) throw new Error("Franchise ID is required");

        // Limpieza de datos antes de enviar
        const cleanData = {
            plate: vehicleData.plate?.toUpperCase() || 'NO-PLATE',
            model: vehicleData.model || 'Unknown Model',
            alias: vehicleData.alias || '',
            status: vehicleData.status || 'active',
            currentKm: Number(vehicleData.currentKm) || 0,
            nextRevisionKm: Number(vehicleData.nextRevisionKm) || 0,
            franchise_id: franchiseId, // <--- LA CLAVE
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
        };

        return await addDoc(collection(db, COLLECTION_NAME), cleanData);
    },

    /**
     * Actualizar vehículo
     */
    updateVehicle: async (vehicleId: string, updates: Partial<Vehicle>) => {
        if (!vehicleId) throw new Error("Vehicle ID is required");

        const docRef = doc(db, COLLECTION_NAME, vehicleId);
        return await updateDoc(docRef, {
            ...updates,
            updated_at: serverTimestamp()
        });
    },

    /**
     * Eliminar vehículo
     */
    deleteVehicle: async (vehicleId: string) => {
        if (!vehicleId) throw new Error("Vehicle ID is required");
        return await deleteDoc(doc(db, COLLECTION_NAME, vehicleId));
    }
};
