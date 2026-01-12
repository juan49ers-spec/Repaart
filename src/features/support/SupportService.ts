import { collection, addDoc, updateDoc, doc, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// Types
export interface SupportTicket {
    id?: string;
    franchiseId: string;
    franchiseName: string;
    subject: string;
    message: string;
    status: 'open' | 'in_progress' | 'resolved';
    priority: 'low' | 'normal' | 'high';
    category: 'technical' | 'billing' | 'question';
    createdAt: Timestamp;
    updatedAt: Timestamp;
    replies?: SupportReply[];
}

export interface SupportReply {
    id: string;
    senderId: string; // 'admin' or franchiseUID
    senderName: string;
    message: string;
    createdAt: Timestamp;
    isAdmin: boolean;
}

export interface PremiumRequest {
    id?: string;
    franchiseId: string;
    franchiseName: string;
    serviceId: string;
    serviceName: string;
    status: 'pending' | 'in_review' | 'approved' | 'rejected';
    createdAt: Timestamp;
    updatedAt: Timestamp;
    notes?: string;
}

export const supportService = {
    // Tickets
    async createTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'status'>) {
        const docRef = await addDoc(collection(db, 'support_tickets'), {
            ...ticket,
            status: 'open',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            replies: []
        });
        return docRef.id;
    },

    async getTickets(franchiseId: string) {
        const q = query(
            collection(db, 'support_tickets'),
            where('franchiseId', '==', franchiseId),
            orderBy('updatedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportTicket));
    },

    async getAllTicketsForAdmin() {
        const q = query(collection(db, 'support_tickets'), orderBy('updatedAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportTicket));
    },

    async replyToTicket(ticketId: string, reply: Omit<SupportReply, 'id' | 'createdAt'>) {
        const ticketRef = doc(db, 'support_tickets', ticketId);
        // We actually need to use arrayUnion or similar, but for simplicity let's read-modify-write for deep object or simply store replies as subcollection. 
        // For simplicity in this stack, let's keep it simple: generic update logic would be better if we had valid array union for objects.
        // Let's assume we pass the full new array or let the backend handle it. 
        // A better approach for scalability is a subcollection 'replies'.
        // However, given the prompt constraints, I'll assume we can just update the array for now or use a simpler structure.

        // Let's trust we can fetch-update
        // THIS IS A SIMPLIFICATION. In production, use subcollections.
        // I will implement subcollections logic if preferred, but single doc is easier for "Inbox" view.

        // Actually, let's use a subcollection, it's cleaner.
        const repliesRef = collection(db, 'support_tickets', ticketId, 'replies');
        await addDoc(repliesRef, {
            ...reply,
            createdAt: Timestamp.now()
        });

        await updateDoc(ticketRef, {
            updatedAt: Timestamp.now(),
            status: reply.isAdmin ? 'in_progress' : 'open' // Re-open if user replies
        });
    },

    async updateTicketStatus(ticketId: string, status: SupportTicket['status']) {
        await updateDoc(doc(db, 'support_tickets', ticketId), {
            status,
            updatedAt: Timestamp.now()
        });
    },

    // Premium Requests
    async requestPremiumService(request: Omit<PremiumRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>) {
        await addDoc(collection(db, 'premium_requests'), {
            ...request,
            status: 'pending',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
    },

    async getPremiumRequests(franchiseId: string) {
        const q = query(
            collection(db, 'premium_requests'),
            where('franchiseId', '==', franchiseId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PremiumRequest));
    },

    async getAllPremiumRequests() {
        const q = query(collection(db, 'premium_requests'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PremiumRequest));
    },

    async updatePremiumStatus(requestId: string, status: PremiumRequest['status']) {
        await updateDoc(doc(db, 'premium_requests', requestId), {
            status,
            updatedAt: Timestamp.now()
        });
    }
};
