import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit, Timestamp } from 'firebase/firestore';
import { Bell, Ticket, DollarSign, AlertTriangle, ArrowRight, Lock, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { markNotificationAsRead } from '../../lib/notifications';
import { notificationService, NotificationPayload } from '../../services/notificationService';
import { useNavigate } from 'react-router-dom';
import { formatTimeAgo } from '../../utils/dateHelpers';
import { ShieldAlert, BookOpen } from 'lucide-react';

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
    metadata?: any;
    // Legacy specific
    userId?: string;
}

interface NotificationsProps {
    isAdmin?: boolean;
}

const Notifications: React.FC<NotificationsProps> = ({ isAdmin = false }) => {
    const { user } = useAuth();
    console.log('👤 [Notifications] User data:', { uid: user?.uid, franchiseId: user?.franchiseId, email: user?.email });
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<UINotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'high'>('all');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    useEffect(() => {
        if (!user) return;

        let unsubscribe: () => void;

        try {
            if (isAdmin) {
                // --- ADMIN STREAM (admin_notifications) ---
                const q = query(
                    collection(db, "admin_notifications"),
                    orderBy("createdAt", "desc"),
                    limit(50)
                );

                unsubscribe = onSnapshot(q, (snapshot) => {
                    const list = snapshot.docs.map(doc => {
                        const data = doc.data() as NotificationPayload;
                        return {
                            id: doc.id,
                            title: data.title, // In admin_notifications, title is event title
                            message: data.message,
                            read: data.read,
                            createdAt: data.createdAt,
                            type: data.type,
                            franchiseName: data.franchiseName,
                            franchiseId: data.franchiseId, // Crucial for navigation
                            priority: data.priority,
                            metadata: data.metadata
                        } as UINotification;
                    });
                    setNotifications(list);
                    setUnreadCount(list.filter(n => !n.read).length);
                }, (error) => {
                    console.warn("Admin Notification listener error:", error);
                });

            } else {
                // --- FRANCHISE/USER STREAM (notifications) ---
                const targetIds = [user.uid];
                if (user.franchiseId) targetIds.push(user.franchiseId);

                const q = query(
                    collection(db, "notifications"),
                    where("userId", "in", targetIds),
                    orderBy("createdAt", "desc"),
                    limit(50)
                );

                unsubscribe = onSnapshot(q, (snapshot) => {
                    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UINotification));
                    console.log('🔔 [Notifications] Franchise notifications received:', list.length, 'items:', list);
                    setNotifications(list);
                    setUnreadCount(list.filter(n => !n.read).length);
                }, (error) => {
                    console.warn("Franchise Notification listener error:", error);
                });
            }
        } catch (err) {
            console.error("Error setting up listener", err);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.uid, user?.franchiseId, isAdmin]);


    const handleNotificationClick = (notification: UINotification) => {
        // 1. Mark as read
        if (!notification.read) {
            if (isAdmin) notificationService.markAsRead(notification.id);
            else markNotificationAsRead(notification.id);
        }

        // 2. Navigate based on type/metadata
        setIsOpen(false);

        if (isAdmin) {
            if (notification.type === 'FINANCE_CLOSING' || notification.type === 'RATE_CHANGE' || notification.type === 'UNLOCK_REQUEST' || notification.type === 'MONTH_UNLOCKED' || notification.type === 'UNLOCK_REJECTED') {
                // Navigate to franchise detail
                if (notification.metadata?.franchiseId) {
                    navigate(`/admin/franchise/${notification.metadata.franchiseId}`);
                } else if ((notification as any).franchiseId) {
                    navigate(`/admin/franchise/${(notification as any).franchiseId}`);
                }
            } else if (notification.type === 'SUPPORT_TICKET') {
                navigate('/admin/support');
            }
        } else {
            if (notification.type === 'SUPPORT_TICKET' && notification.link) {
                // For support tickets, navigate to support page
                if (notification.link.startsWith('/')) {
                    navigate(notification.link);
                } else {
                    window.open(notification.link, '_blank');
                }
            } else if (notification.type === 'shift_change_request' || notification.type === 'incident') {
                // Navigate to scheduler
                navigate('/operations');
            } else if (notification.link) {
                // Use navigate for internal routes, otherwise open in new tab
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
        const baseClass = "w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm transition-all duration-300";
        switch (type) {
            case 'FINANCE_CLOSING': return <div className={`${baseClass} bg-emerald-500/10 text-emerald-600 border-emerald-500/20`}><DollarSign className="w-4 h-4" /></div>;
            case 'RATE_CHANGE': return <div className={`${baseClass} bg-amber-500/10 text-amber-500 border-amber-500/20`}><AlertTriangle className="w-4 h-4" /></div>;
            case 'SUPPORT_TICKET': return <div className={`${baseClass} bg-blue-500/10 text-blue-500 border-blue-500/20`}><Ticket className="w-4 h-4" /></div>;
            case 'UNLOCK_REQUEST': return <div className={`${baseClass} bg-violet-500/10 text-violet-600 border-violet-500/20 animate-pulse`}><Lock className="w-4 h-4" /></div>;
            case 'MONTH_UNLOCKED': return <div className={`${baseClass} bg-emerald-500/10 text-emerald-600 border-emerald-500/20`}><Check className="w-4 h-4" /></div>;
            case 'UNLOCK_REJECTED': return <div className={`${baseClass} bg-rose-500/10 text-rose-600 border-rose-500/20`}><ShieldAlert className="w-4 h-4" /></div>;
            case 'GUIDE_TIP': return <div className={`${baseClass} bg-indigo-500/10 text-indigo-600 border-indigo-500/20`}><BookOpen className="w-4 h-4" /></div>;
            case 'shift_change_request': return <div className={`${baseClass} bg-amber-500/10 text-amber-600 border-amber-500/20`}><AlertTriangle className="w-4 h-4" /></div>;
            case 'shift_confirmed': return <div className={`${baseClass} bg-emerald-500/10 text-emerald-600 border-emerald-500/20`}><Check className="w-4 h-4" /></div>;
            case 'incident': return <div className={`${baseClass} bg-rose-500/10 text-rose-600 border-rose-500/20 animate-pulse`}><ShieldAlert className="w-4 h-4" /></div>;
            default: return <div className={`${baseClass} ${read ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'}`}><Bell className="w-4 h-4" /></div>;
        }
    };

    const filteredNotifications = getFilteredNotifications();

    return (
        <div className="relative mr-2" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    p-2.5 rounded-full transition-all duration-300 relative group
                    ${isOpen
                        ? 'bg-indigo-50 text-indigo-600 ring-2 ring-indigo-500/20'
                        : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                    }
                `}
                title="Notificaciones"
            >
                <Bell className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-12 scale-110' : 'group-hover:scale-110'}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white ring-2 ring-rose-500/20 animate-pulse" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-[420px] bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 ring-1 ring-black/5 origin-top-right">

                    {/* Header */}
                    <div className="p-5 border-b border-slate-100/50 bg-white/50">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <h4 className="font-exhibit font-black text-slate-900 text-lg tracking-tight">Notificaciones</h4>
                                {unreadCount > 0 && (
                                    <span className="text-[10px] font-bold text-white bg-indigo-500 px-2 py-0.5 rounded-full shadow-sm shadow-indigo-500/30">
                                        {unreadCount} nuevas
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={markAllAsRead}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
                            >
                                Marcar leídas
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex p-1 bg-slate-100/50 rounded-xl backdrop-blur-sm">
                            {(['all', 'unread', 'high'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`
                                        flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 capitalise
                                        ${activeTab === tab
                                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                        }
                                    `}
                                >
                                    {tab === 'all' && 'Todas'}
                                    {tab === 'unread' && 'No leídas'}
                                    {tab === 'high' && 'Importantes'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[450px] overflow-y-auto custom-scrollbar bg-slate-50/30">
                        {filteredNotifications.length === 0 ? (
                            <div className="p-16 text-center flex flex-col items-center justify-center min-h-[300px]">
                                <div className="w-16 h-16 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full flex items-center justify-center mb-4 shadow-inner ring-1 ring-white">
                                    <Bell className="w-6 h-6 text-slate-300" />
                                </div>
                                <p className="text-sm text-slate-900 font-bold mb-1">Todo al día</p>
                                <p className="text-xs text-slate-400 font-medium max-w-[200px] leading-relaxed">
                                    {activeTab === 'all'
                                        ? 'No tienes notificaciones pendientes en este momento.'
                                        : 'No hay notificaciones que coincidan con este filtro.'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {filteredNotifications.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleNotificationClick(item)}
                                        className={`
                                            p-4 transition-all hover:bg-white relative group cursor-pointer flex gap-4
                                            ${!item.read ? 'bg-indigo-50/30' : 'bg-transparent opacity-75 hover:opacity-100'}
                                        `}
                                    >
                                        {/* Unread Dot */}
                                        {!item.read && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-12 bg-indigo-500 rounded-r-full" />
                                        )}

                                        {/* Icon */}
                                        <div className="mt-1">
                                            {getIcon(item.type, item.read)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1 gap-2">
                                                <h5 className={`text-sm font-bold truncate ${!item.read ? 'text-slate-900' : 'text-slate-600'}`}>
                                                    {item.title}
                                                </h5>
                                                {/* Date */}
                                                <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap pt-0.5 font-medium">
                                                    {item.createdAt ? formatTimeAgo(item.createdAt.toDate()) : 'Reciente'}
                                                </span>
                                            </div>

                                            <p className={`text-xs leading-relaxed mb-2.5 line-clamp-2 ${!item.read ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                                                {item.message}
                                            </p>

                                            {/* Action Hints */}
                                            {item.type === 'UNLOCK_REQUEST' && (
                                                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100/50 shadow-sm transition-transform group-hover:translate-x-1">
                                                    <span>Revisar Solicitud</span>
                                                    <ArrowRight className="w-3 h-3" />
                                                </div>
                                            )}
                                            {item.type === 'MONTH_UNLOCKED' && (
                                                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100/50 shadow-sm transition-transform group-hover:translate-x-1">
                                                    <span>Ir al Histórico</span>
                                                    <ArrowRight className="w-3 h-3" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notifications;
