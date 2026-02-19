import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { formatTimeAgo } from '../../../utils/dateHelpers';

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: string;
    createdAt: Timestamp;
    read: boolean;
    priority?: string;
}

const NotificationsTab = ({ user }: { user: { uid: string; franchiseId?: string } }) => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) return;

        const targetIds = [user.uid];
        if (user.franchiseId) targetIds.push(user.franchiseId);

        const q = query(
            collection(db, 'notifications'),
            where('userId', 'in', targetIds),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        getDocs(q)
            .then(snapshot => {
                const notifs = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        title: data.title || 'Notificación',
                        message: data.message || '',
                        type: data.type || 'SYSTEM',
                        createdAt: data.createdAt || Timestamp.now(),
                        read: data.read || false,
                        priority: data.priority
                    } as NotificationItem;
                });
                setNotifications(notifs);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading notifications:', error);
                setLoading(false);
            });
    }, [user]);

    const markAsRead = async (notificationId: string) => {
        try {
            await updateDoc(doc(db, 'notifications', notificationId), {
                read: true
            });
            setNotifications(prev => prev.map(n =>
                n.id === notificationId ? { ...n, read: true } : n
            ));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-slate-400">
                <p>Cargando notificaciones...</p>
            </div>
        );
    }

    if (notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">🔔</span>
                </div>
                <p className="font-bold text-slate-900">Todo al día</p>
                <p className="text-sm text-slate-500 mt-1">No hay notificaciones recientes</p>
            </div>
        );
    }

    const getIcon = (type?: string) => {
        const baseClass = "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border";
        switch (type) {
            case 'SUPPORT_TICKET': return <div className={`${baseClass} bg-blue-50 text-blue-500 border-blue-100`}><span className="text-lg">🎫</span></div>;
            case 'PREMIUM_SERVICE_REQUEST': return <div className={`${baseClass} bg-amber-50 text-amber-500 border-amber-100`}><span className="text-lg">⭐</span></div>;
            case 'shift_change_request': return <div className={`${baseClass} bg-amber-50 text-amber-600 border-amber-100`}><span className="text-lg">🔄</span></div>;
            case 'shift_confirmed': return <div className={`${baseClass} bg-emerald-50 text-emerald-600 border-emerald-100`}><span className="text-lg">✅</span></div>;
            case 'FINANCE_CLOSING': return <div className={`${baseClass} bg-emerald-50 text-emerald-500 border-emerald-100`}><span className="text-lg">💰</span></div>;
            case 'RATE_CHANGE': return <div className={`${baseClass} bg-amber-50 text-amber-500 border-amber-100`}><span className="text-lg">📈</span></div>;
            case 'incident': return <div className={`${baseClass} bg-rose-50 text-rose-600 border-rose-100`}><span className="text-lg">⚠️</span></div>;
            case 'security': return <div className={`${baseClass} bg-emerald-50 text-emerald-600 border-emerald-100`}><span className="text-lg">🔐</span></div>;
            default: return <div className={`${baseClass} bg-slate-50 text-slate-400 border-slate-100`}><span className="text-lg">🔔</span></div>;
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;
    const plural = unreadCount > 1 ? 'es' : unreadCount === 0 ? '' : 'ión';

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-black text-slate-800">Notificaciones</h2>
                <p className="text-sm text-slate-500 mt-1">
                    Tienes {unreadCount} notificación{plural} no leída
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {notifications.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => markAsRead(item.id)}
                        className={`p-4 flex gap-4 hover:bg-slate-50 transition-colors cursor-pointer ${!item.read ? 'bg-blue-50/30' : ''}`}
                    >
                        <div className="mt-1">
                            {getIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className={`font-bold text-sm ${!item.read ? 'text-slate-900' : 'text-slate-600'}`}>
                                    {item.title}
                                </h4>
                                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                    {item.createdAt ? formatTimeAgo(item.createdAt.toDate()) : '-'}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{item.message}</p>
                        </div>
                        {!item.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NotificationsTab;
