import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';

export interface Notification {
    id: string;
    userId: string;
    type: 'shift_confirmed' | 'shift_change_request' | 'shift_modified' | 'shift_rejected' | 'availability_update' | 'week_closed' | 'FINANCE_CLOSING' | 'RATE_CHANGE' | 'SUPPORT_TICKET' | 'GUIDE_TIP';
    title: string;
    message: string;
    shiftId?: string;
    shiftData?: any;
    createdAt: Date;
    read: boolean;
    priority?: 'high' | 'medium' | 'low';
}

const useNotificationBadge = () => {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) return;

        const targetIds = [user.uid];
        if (user.franchiseId) targetIds.push(user.franchiseId);

        console.log('👤 [useNotificationBadge] User data:', { uid: user.uid, franchiseId: user.franchiseId, targetIds });

        const qFilter = targetIds.length === 1
            ? where('userId', '==', targetIds[0])
            : where('userId', 'in', targetIds);

        const q = query(
            collection(db, 'notifications'),
            qFilter,
            where('read', '==', false),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const count = snapshot.docs.length;
            setUnreadCount(count);
            setLoading(false);

            if (typeof window !== 'undefined') {
                const favicon = document.querySelector("link[rel*='icon']");
                if (favicon && count > 0) {
                    const originalHref = favicon.getAttribute('href');
                    favicon.setAttribute('href', originalHref + '?unread=' + count);
                }
            }
        }, (error) => {
            console.error('❌ [useNotificationBadge] Firestore error:', {
                code: error.code,
                message: error.message,
                uid: user.uid,
                targetIds
            });
            setLoading(false);
        });

        return () => {
            if (typeof window !== 'undefined') {
                const favicon = document.querySelector("link[rel*='icon']");
                if (favicon) {
                    const href = favicon.getAttribute('href') as string;
                    const cleanHref = href?.split('?')[0];
                    favicon.setAttribute('href', cleanHref);
                }
            }
            unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.uid, user?.franchiseId]);

    return {
        unreadCount,
        loading,
        hasUnread: unreadCount > 0
    };
};

export default useNotificationBadge;
export { useNotificationBadge };
