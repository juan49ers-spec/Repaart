import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit, Timestamp } from 'firebase/firestore';
import { Bell, Ticket, DollarSign, AlertTriangle, ArrowRight, Lock, Check, ShieldAlert, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { markNotificationAsRead } from '../../lib/notifications';
import { notificationService, NotificationPayload } from '../../services/notificationService';
import { useNavigate } from 'react-router-dom';
import { formatTimeAgo } from '../../utils/dateHelpers';

// Unified UI Notification Interface
interface UINotification {
    id: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: Timestamp;
    link?: string;
    type?: string;
    // Admin specific
    franchiseName?: string;
    franchiseId?: string;
    priority?: 'low' | 'normal' | 'high';
    metadata?: Record<string, unknown>;
}

const NotificationsPage: React.FC = () => {
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<UINotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'high'>('all');

    useEffect(() => {
        console.log("🔔 [NotificationsPage] MOUNTED");
    }, []);

    useEffect(() => {
        if (!user) return;

        let unsubscribe: () => void;
        let mounted = true;

        try {
            if (isAdmin) {
                // --- ADMIN STREAM (admin_notifications) ---
                const q = query(
                    collection(db, "admin_notifications"),
                    orderBy("createdAt", "desc"),
                    limit(100)
                );

                unsubscribe = onSnapshot(q, (snapshot) => {
                    if (!mounted) return;
                    const list = snapshot.docs.map(doc => {
                        const data = doc.data() as NotificationPayload;
                        return {
                            id: doc.id,
                            title: data.title,
                            message: data.message,
                            read: data.read,
                            createdAt: data.createdAt,
                            type: data.type,
                            franchiseName: data.franchiseName,
                            franchiseId: data.franchiseId,
                            priority: data.priority,
                            metadata: data.metadata
                        } as UINotification;
                    });
                    setNotifications(list);
                    setLoading(false);
                }, (error) => {
                    console.warn("Admin Notification listener error:", error);
                    if (mounted) setLoading(false);
                });

            } else {
                // --- FRANCHISE/USER STREAM (notifications) ---
                const targetIds = [user.uid];
                if (user.franchiseId) targetIds.push(user.franchiseId);

                const q = query(
                    collection(db, "notifications"),
                    where("userId", "in", targetIds),
                    orderBy("createdAt", "desc"),
                    limit(100)
                );

                unsubscribe = onSnapshot(q, (snapshot) => {
                    if (!mounted) return;
                    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UINotification));
                    setNotifications(list);
                    setLoading(false);
                }, (error) => {
                    console.warn("Franchise Notification listener error:", error);
                    if (mounted) setLoading(false);
                });
            }
        } catch (err) {
            console.error("Error setting up listener", err);
            if (mounted) {
                setTimeout(() => setLoading(false), 0);
            }
        }

        return () => {
            mounted = false;
            if (unsubscribe) unsubscribe();
        };
    }, [user, isAdmin]);


    const handleNotificationClick = (notification: UINotification) => {
        // 1. Mark as read
        if (!notification.read) {
            if (isAdmin) notificationService.markAsRead(notification.id);
            else markNotificationAsRead(notification.id);
        }

        // 2. Navigate based on type/metadata
        if (isAdmin) {
            if (['FINANCE_CLOSING', 'RATE_CHANGE', 'UNLOCK_REQUEST', 'MONTH_UNLOCKED', 'UNLOCK_REJECTED'].includes(notification.type || '')) {
                const franchiseId = (notification.metadata?.franchiseId as string) || notification.franchiseId;
                if (franchiseId) {
                    navigate(`/admin/franchise/${franchiseId}`);
                }
            } else if (notification.type === 'SUPPORT_TICKET') {
                navigate('/admin/support');
            }
        } else {
            if (notification.type === 'SUPPORT_TICKET' && notification.link) {
                if (notification.link.startsWith('/')) {
                    navigate(notification.link);
                } else {
                    window.open(notification.link, '_blank');
                }
            } else if (notification.type === 'shift_change_request' || notification.type === 'incident') {
                navigate('/operations');
            } else if (notification.link) {
                if (notification.link.startsWith('/')) {
                    navigate(notification.link);
                } else {
                    window.open(notification.link, '_blank');
                }
            }
        }
    };

    const markAllAsRead = async () => {
        const unreadToUpdate = notifications.filter(n => !n.read);
        for (const notification of unreadToUpdate) {
            if (isAdmin) await notificationService.markAsRead(notification.id);
            else await markNotificationAsRead(notification.id);
        }
    };

    const getFilteredNotifications = () => {
        switch (activeTab) {
            case 'unread': return notifications.filter(n => !n.read);
            case 'high': return notifications.filter(n => n.priority === 'high');
            default: return notifications;
        }
    };

    const getIcon = (type?: string, read?: boolean) => {
        const baseClass = "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm transition-all duration-300";
        switch (type) {
            case 'FINANCE_CLOSING': return <div className={`${baseClass} bg-emerald-500/10 text-emerald-600 border-emerald-500/20`}><DollarSign className="w-5 h-5" /></div>;
            case 'RATE_CHANGE': return <div className={`${baseClass} bg-amber-500/10 text-amber-500 border-amber-500/20`}><AlertTriangle className="w-5 h-5" /></div>;
            case 'SUPPORT_TICKET': return <div className={`${baseClass} bg-blue-500/10 text-blue-500 border-blue-500/20`}><Ticket className="w-5 h-5" /></div>;
            case 'UNLOCK_REQUEST': return <div className={`${baseClass} bg-violet-500/10 text-violet-600 border-violet-500/20 animate-pulse`}><Lock className="w-5 h-5" /></div>;
            case 'MONTH_UNLOCKED': return <div className={`${baseClass} bg-emerald-500/10 text-emerald-600 border-emerald-500/20`}><Check className="w-5 h-5" /></div>;
            case 'UNLOCK_REJECTED': return <div className={`${baseClass} bg-rose-500/10 text-rose-600 border-rose-500/20`}><ShieldAlert className="w-5 h-5" /></div>;
            case 'GUIDE_TIP': return <div className={`${baseClass} bg-indigo-500/10 text-indigo-600 border-indigo-500/20`}><BookOpen className="w-5 h-5" /></div>;
            case 'shift_change_request': return <div className={`${baseClass} bg-amber-500/10 text-amber-600 border-amber-500/20`}><AlertTriangle className="w-5 h-5" /></div>;
            case 'shift_confirmed': return <div className={`${baseClass} bg-emerald-500/10 text-emerald-600 border-emerald-500/20`}><Check className="w-5 h-5" /></div>;
            case 'incident': return <div className={`${baseClass} bg-rose-500/10 text-rose-600 border-rose-500/20 animate-pulse`}><ShieldAlert className="w-5 h-5" /></div>;
            default: return <div className={`${baseClass} ${read ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'}`}><Bell className="w-5 h-5" /></div>;
        }
    };

    const filteredNotifications = getFilteredNotifications();
    const unreadCount = notifications.filter(n => !n.read).length;

    if (loading) {
        return (
            <div className="p-8 max-w-4xl mx-auto space-y-4 animate-pulse">
                <div className="h-8 bg-slate-200 rounded w-1/4 mb-8"></div>
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-slate-100 rounded-2xl"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-exhibit flex items-center gap-3">
                        Notificaciones
                        {unreadCount > 0 && (
                            <span className="text-sm font-bold text-white bg-indigo-500 px-3 py-1 rounded-full shadow-lg shadow-indigo-500/30">
                                {unreadCount} nuevas
                            </span>
                        )}
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Mantente al día con lo último de tu franquicia</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex p-1 bg-white rounded-xl border border-slate-200 shadow-sm">
                        {(['all', 'unread', 'high'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`
                                    px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 capitalise
                                    ${activeTab === tab
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }
                                `}
                            >
                                {tab === 'all' && 'Todas'}
                                {tab === 'unread' && 'No leídas'}
                                {tab === 'high' && 'Importantes'}
                            </button>
                        ))}
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors border border-transparent hover:border-indigo-100"
                        >
                            Marcar todo leído
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                    <div className="p-16 text-center flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm min-h-[400px]">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-1 ring-slate-100">
                            <Bell className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Estás al día</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">
                            {activeTab === 'all'
                                ? 'No tienes notificaciones pendientes en este momento.'
                                : 'No hay notificaciones que coincidan con este filtro.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {filteredNotifications.map(item => (
                            <div
                                key={item.id}
                                onClick={() => handleNotificationClick(item)}
                                className={`
                                    p-5 rounded-2xl transition-all duration-300 relative group cursor-pointer flex gap-5 border
                                    ${!item.read
                                        ? 'bg-white border-indigo-100 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(99,102,241,0.15)] hover:border-indigo-200'
                                        : 'bg-white/50 border-transparent hover:bg-white hover:border-slate-100 hover:shadow-lg'
                                    }
                                `}
                            >
                                {/* Unread Indicator */}
                                {!item.read && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-indigo-500 rounded-r-full" />
                                )}

                                {/* Icon */}
                                <div className="mt-1">
                                    {getIcon(item.type, item.read)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-2">
                                        <h3 className={`text-base font-bold truncate ${!item.read ? 'text-slate-900' : 'text-slate-700'}`}>
                                            {item.title}
                                        </h3>
                                        <span className="text-xs text-slate-400 font-medium whitespace-nowrap bg-slate-50 px-2 py-1 rounded-lg">
                                            {item.createdAt ? formatTimeAgo(item.createdAt.toDate()) : 'Reciente'}
                                        </span>
                                    </div>

                                    <p className={`text-sm leading-relaxed mb-3 ${!item.read ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                                        {item.message}
                                    </p>

                                    {/* Action Hints */}
                                    <div className="flex items-center gap-2">
                                        {item.type === 'UNLOCK_REQUEST' && (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 transition-transform group-hover:translate-x-1">
                                                Revisar Solicitud <ArrowRight className="w-3.5 h-3.5" />
                                            </span>
                                        )}
                                        {item.type === 'MONTH_UNLOCKED' && (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 transition-transform group-hover:translate-x-1">
                                                Ir al Histórico <ArrowRight className="w-3.5 h-3.5" />
                                            </span>
                                        )}
                                        {item.type === 'SUPPORT_TICKET' && (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-transform group-hover:translate-x-1">
                                                Ver Ticket <ArrowRight className="w-3.5 h-3.5" />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
