import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

export type NotificationType = 'FINANCE_CLOSING' | 'RATE_CHANGE' | 'SUPPORT_TICKET' | 'UNLOCK_REQUEST' | 'MONTH_UNLOCKED' | 'UNLOCK_REJECTED' | 'ALERT' | 'PREMIUM_SERVICE_REQUEST';
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

            await addDoc(collection(db, 'notifications'), payload);
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
    }
};
