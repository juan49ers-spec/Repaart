import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    serverTimestamp,
    DocumentData
} from 'firebase/firestore';

export type IncidentType = 'accident' | 'breakdown' | 'traffic' | 'other';

export interface IncidentReport {
    riderId: string;
    franchiseId?: string;
    type: IncidentType;
    description: string;
    isUrgent: boolean;
    photoUrl?: string; // Placeholder for future upload
    status: 'open' | 'investigating' | 'resolved';
    createdAt: any;
}

export interface VehicleChecklist {
    riderId: string;
    vehicleId?: string; // Optional if not assigned
    items: string[]; // List of checked IDs
    allClear: boolean;
    createdAt: any;
}

const COLLECTIONS = {
    INCIDENTS: 'incidents',
    CHECKS: 'vehicle_checks'
};

export const riderService = {
    /**
     * Report a new incident
     */
    reportIncident: async (
        riderId: string,
        data: {
            type: IncidentType;
            description: string;
            isUrgent: boolean;
            franchiseId?: string
        }
    ): Promise<DocumentData> => {
        const payload: IncidentReport = {
            riderId,
            franchiseId: data.franchiseId,
            type: data.type,
            description: data.description,
            isUrgent: data.isUrgent,
            status: 'open',
            createdAt: serverTimestamp()
        };
        return await addDoc(collection(db, COLLECTIONS.INCIDENTS), payload);
    },

    /**
     * Submit a vehicle pre-shift checklist
     */
    submitChecklist: async (
        riderId: string,
        data: {
            items: string[];
            vehicleId?: string;
        }
    ): Promise<DocumentData> => {
        const payload: VehicleChecklist = {
            riderId,
            vehicleId: data.vehicleId,
            items: data.items,
            allClear: true, // If they submitted, it's because they checked everything (UI enforced)
            createdAt: serverTimestamp()
        };
        return await addDoc(collection(db, COLLECTIONS.CHECKS), payload);
    }
};
