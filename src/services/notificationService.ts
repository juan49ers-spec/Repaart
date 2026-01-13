import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

export type NotificationType = 'FINANCE_CLOSING' | 'RATE_CHANGE' | 'SUPPORT_TICKET' | 'UNLOCK_REQUEST' | 'MONTH_UNLOCKED' | 'UNLOCK_REJECTED' | 'ALERT' | 'PREMIUM_SERVICE_REQUEST' | 'shift_confirmed' | 'shift_change_request' | 'incident' | 'SCHEDULE_PUBLISHED' | 'SYSTEM' | 'DOCUMENT_REQUEST';
export type NotificationPriority = 'low' | 'normal' | 'high';

export interface NotificationPayload {
    type: NotificationType;
    franchiseId: string;
    franchiseName: string; // Denormalized for easier display
    priority: NotificationPriority;
    title: string;
    message: string;
    metadata?: Record<string, any>;
    read: boolean;
    createdAt?: any;
    riderId?: string;
    relatedShiftId?: string;
}

export const notificationService = {
    /**
     * Creates a new notification for Admins
     */
    notify: async (
        type: NotificationType,
        franchiseId: string,
        franchiseName: string,
        data: {
            title: string;
            message: string;
            priority?: NotificationPriority;
            metadata?: Record<string, any>;
        }
    ) => {
        try {
            const payload: NotificationPayload = {
                type,
                franchiseId,
                franchiseName,
                title: data.title,
                message: data.message,
                priority: data.priority || 'normal',
                metadata: data.metadata || {},
                read: false,
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, 'admin_notifications'), payload);
            console.log(`[NotificationService] Sent ${type}:`, payload);
        } catch (error) {
            console.error('[NotificationService] Failed to send notification:', error);
            // We don't throw here to avoid blocking the main user action if notification fails
        }
    },



    /**
     * Marks an admin notification as read
     */
    markAsRead: async (notificationId: string) => {
        try {
            const docRef = doc(db, 'admin_notifications', notificationId);
            await updateDoc(docRef, { read: true });
        } catch (error) {
            console.error('[NotificationService] Failed to mark as read:', error);
        }
    },

    /**
     * Notify a specific Franchise (User)
     */
    notifyFranchise: async (
        userId: string,
        data: {
            title: string;
            message: string;
            type?: NotificationType;
            priority?: NotificationPriority;
            link?: string;
        }
    ) => {
        try {
            const payload = {
                userId,
                title: data.title,
                message: data.message,
                type: data.type || 'SYSTEM',
                priority: data.priority || 'normal',
                link: data.link || '',
                read: false,
                createdAt: serverTimestamp()
            };
            await addDoc(collection(db, 'notifications'), payload);
        } catch (error) {
            console.error('[NotificationService] Failed to notify franchise:', error);
        }
    },

    /**
     * Notify about Rider Actions (Shift changes/incidents)
     */
    notifyRiderAction: async (
        franchiseId: string,
        riderId: string,
        data: {
            type: 'shift_confirmed' | 'shift_change_request' | 'incident';
            title: string;
            message: string;
            relatedShiftId?: string;
        }
    ) => {
        try {
            const payload = {
                userId: franchiseId, // Mapping franchiseId to userId for UI visibility
                franchiseId,
                riderId,
                type: data.type,
                title: data.title,
                message: data.message,
                relatedShiftId: data.relatedShiftId || null,
                read: false,
                createdAt: serverTimestamp()
            };
            // According to schema, this goes to 'notifications' collection
            await addDoc(collection(db, 'notifications'), payload);
        } catch (error) {
            console.error('[NotificationService] Failed to notify rider action:', error);
        }
    }
};
