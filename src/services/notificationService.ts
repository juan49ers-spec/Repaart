import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, FieldValue, Timestamp } from 'firebase/firestore';
import { ServiceError } from '../utils/ServiceError';

export type NotificationType = 'FINANCE_CLOSING' | 'RATE_CHANGE' | 'SUPPORT_TICKET' | 'UNLOCK_REQUEST' | 'MONTH_UNLOCKED' | 'UNLOCK_REJECTED' | 'ALERT' | 'PREMIUM_SERVICE_REQUEST' | 'shift_confirmed' | 'shift_change_request' | 'incident' | 'SCHEDULE_PUBLISHED' | 'SYSTEM' | 'DOCUMENT_REQUEST';
export type NotificationPriority = 'low' | 'normal' | 'high';

export interface NotificationPayload {
    type: NotificationType;
    franchiseId: string;
    franchiseName: string; // Denormalized for easier display
    priority: NotificationPriority;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
    read: boolean;
    createdAt?: FieldValue | Timestamp;
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
            metadata?: Record<string, unknown>;
        }
    ): Promise<void> => {
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
            // Log with ServiceError for context, but don't rethrow to avoid blocking main action
            new ServiceError('notify', { cause: error });
            console.error('[NotificationService] Failed to send notification:', error);
        }
    },

    /**
     * Marks an admin notification as read
     */
    markAsRead: async (notificationId: string): Promise<void> => {
        try {
            const docRef = doc(db, 'admin_notifications', notificationId);
            await updateDoc(docRef, { read: true });
        } catch (error) {
            new ServiceError('markAsRead', { cause: error });
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
    ): Promise<void> => {
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
            console.log('📨 [notificationService] Sending notification to userId:', userId, 'payload:', payload);
            const docRef = await addDoc(collection(db, 'notifications'), payload);
            console.log('✅ [notificationService] Notification saved with ID:', docRef.id);
        } catch (error) {
            throw new ServiceError('notifyFranchise', { cause: error });
        }
    },

    /**
      * Notify about Rider Actions (Shift changes/incidents)
      * Sends notification to both franchise (for admin view) and rider (for rider view)
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
    ): Promise<void> => {
        try {
            // Send notification to franchise (admin view)
            await notificationService.notify(
                data.type,
                franchiseId,
                'REPAART Franchise',
                {
                    title: data.title,
                    message: data.message,
                    priority: 'normal',
                    metadata: {
                        riderId,
                        relatedShiftId: data.relatedShiftId
                    }
                }
            );

            // Send notification to rider (rider view)
            const riderPayload = {
                userId: riderId, // Rider receives notification with their own UID
                franchiseId,
                riderId,
                type: data.type,
                title: data.title,
                message: data.message,
                relatedShiftId: data.relatedShiftId || null,
                read: false,
                createdAt: serverTimestamp()
            };
            await addDoc(collection(db, 'notifications'), riderPayload);
        } catch (error) {
            new ServiceError('notifyRiderAction', { cause: error });
            console.error('[NotificationService] Failed to notify rider action:', error);
        }
    },
};

