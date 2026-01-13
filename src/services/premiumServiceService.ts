import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    getDocs,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';

export interface PremiumService {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: 'EUR';
    features: string[];
    active: boolean;
    stripePaymentLink?: string;
    type: 'consultancy' | 'recurring' | 'audit' | 'bundle';
    duration: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export type CreateServiceData = Omit<PremiumService, 'id' | 'createdAt' | 'updatedAt'>;

const COLLECTION_NAME = 'premium_services';

export const premiumServiceService = {
    // Get all services (active and inactive) for Admin
    getAllServices: async (): Promise<PremiumService[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PremiumService));
        } catch (error) {
            console.error("Error fetching all services:", error);
            return [];
        }
    },

    // Get only active services for Franchise
    getActiveServices: async (): Promise<PremiumService[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME), where('active', '==', true));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PremiumService));
        } catch (error) {
            console.error("Error fetching active services:", error);
            return [];
        }
    },

    // Create a new service
    createService: async (data: CreateServiceData) => {
        try {
            await addDoc(collection(db, COLLECTION_NAME), {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error("Error creating service:", error);
            throw error;
        }
    },

    // Update a service
    updateService: async (id: string, data: Partial<CreateServiceData>) => {
        try {
            const ref = doc(db, COLLECTION_NAME, id);
            await updateDoc(ref, {
                ...data,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error("Error updating service:", error);
            throw error;
        }
    },

    // Delete (or deactivate) a service
    deleteService: async (id: string) => {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
        } catch (error) {
            console.error("Error deleting service:", error);
            throw error;
        }
    }
};
