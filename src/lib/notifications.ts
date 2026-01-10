import { db } from './firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * Creates a new notification for a user.
 * @param {string} userId - The UID of the recipient.
 * @param {string} title - Short title.
 * @param {string} message - Content.
 * @param {string} type - 'info', 'success', 'warning', 'error'.
 * @param {string} link - Optional URL to redirect.
 */
export const createNotification = async (
    userId: string,
    title: string,
    message: string,
    type: NotificationType = 'info',
    link: string | null = null
): Promise<void> => {
    try {
        await addDoc(collection(db, "notifications"), {
            userId,
            title,
            message,
            type,
            link,
            read: false,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    try {
        await updateDoc(doc(db, "notifications", notificationId), {
            read: true
        });
    } catch (error) {
        console.error("Error marking notification as read:", error);
    }
};
