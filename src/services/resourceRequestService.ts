import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    orderBy,
    getDocs,
    serverTimestamp,
    getDoc
} from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';
import { notificationService } from './notificationService';

export interface DocumentRequest {
    id: string;
    franchiseId: string;
    franchiseName: string;
    category: string;
    explanation: string;
    priority: 'normal' | 'urgent';
    status: 'pending' | 'fulfilled' | 'rejected';
    rejectionReason?: string;
    resourceId?: string;
    fulfilledBy?: string;
    fulfilledAt?: Timestamp;
    createdAt: Timestamp;
}

export type CreateRequestData = Omit<DocumentRequest, 'id' | 'status' | 'createdAt' | 'fulfilledAt' | 'rejectionReason' | 'resourceId' | 'fulfilledBy'>;

const COLLECTION_NAME = 'document_requests';

export const resourceRequestService = {

    // Create a new request
    createRequest: async (data: CreateRequestData) => {
        try {
            await addDoc(collection(db, COLLECTION_NAME), {
                ...data,
                status: 'pending',
                createdAt: serverTimestamp(),
            });

            // Notify Admins
            await notificationService.notify(
                'ALERT', // Using ALERT generic type as DOCUMENT_REQUEST is not in type definition yet
                data.franchiseId,
                data.franchiseName,
                {
                    title: 'Nueva Solicitud de Documento',
                    message: `${data.franchiseName} ha solicitado documentación de categoría ${data.category}`,
                    priority: data.priority === 'urgent' ? 'high' : 'normal'
                }
            );
        } catch (error) {
            console.error("Error creating document request:", error);
            throw error;
        }
    },

    // Get requests for a specific franchise (History)
    getUserRequests: async (franchiseId: string) => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('franchiseId', '==', franchiseId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentRequest));
        } catch (error) {
            console.error("Error fetching user requests:", error);
            return [];
        }
    },

    // Get all pending requests for Admin
    getPendingRequests: async () => {
        try {
            // Note: In a real app we might want pagination, but for pending list it's okay
            const q = query(
                collection(db, COLLECTION_NAME),
                where('status', '==', 'pending'),
                orderBy('createdAt', 'asc') // Oldest first, though UI might sort by Priority
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentRequest));
        } catch (error) {
            console.error("Error fetching pending requests:", error);
            return [];
        }
    },

    // Fulfill a request with a resource
    fulfillRequest: async (requestId: string, resourceId: string, adminId: string, categoryName?: string) => {
        try {
            const ref = doc(db, COLLECTION_NAME, requestId);
            await updateDoc(ref, {
                status: 'fulfilled',
                resourceId,
                fulfilledBy: adminId,
                fulfilledAt: serverTimestamp(),
            });

            // Fetch request details to get franchiseId
            const docSnap = await getDoc(ref);
            if (docSnap.exists()) {
                const data = docSnap.data() as DocumentRequest;
                await notificationService.notifyFranchise(
                    data.franchiseId,
                    {
                        title: 'Documento Disponible',
                        message: `Hemos completado tu solicitud sobre "${data.explanation}". El documento ya está disponible en tu Bóveda (Categoría: ${categoryName || data.category}).`,
                        type: 'SYSTEM',
                        priority: 'normal'
                    }
                );
            }
        } catch (error) {
            console.error("Error fulfilling request:", error);
            throw error;
        }
    },

    // Reject a request
    rejectRequest: async (requestId: string, reason: string, adminId: string) => {
        try {
            const ref = doc(db, COLLECTION_NAME, requestId);
            await updateDoc(ref, {
                status: 'rejected',
                rejectionReason: reason,
                fulfilledBy: adminId,
                fulfilledAt: serverTimestamp(),
            });

            // Fetch request details to get franchiseId
            const docSnap = await getDoc(ref);
            if (docSnap.exists()) {
                const data = docSnap.data() as DocumentRequest;
                await notificationService.notifyFranchise(
                    data.franchiseId,
                    {
                        title: 'Solicitud Rechazada',
                        message: `Tu solicitud ha sido rechazada. Motivo: ${reason}`,
                        type: 'ALERT',
                        priority: 'high'
                    }
                );
            }
        } catch (error) {
            console.error("Error rejecting request:", error);
            throw error;
        }
    }
};
