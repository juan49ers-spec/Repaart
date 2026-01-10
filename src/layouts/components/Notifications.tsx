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
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<UINotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
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
                            title: data.title, // In admin_notifications, title is the event title
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
                // --- FRANCHISE STREAM (legacy notifications) ---
                const q = query(
                    collection(db, "notifications"),
                    where("userId", "==", user.uid),
                    orderBy("createdAt", "desc"),
                    limit(20)
                );

                unsubscribe = onSnapshot(q, (snapshot) => {
                    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UINotification));
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
    }, [user, isAdmin]);



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
            // Legacy link support
            if (notification.link) {
                window.location.href = notification.link;
            }
        }
    };

    const getIcon = (type?: string, read?: boolean) => {
        const baseClass = "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border";
        switch (type) {
            case 'FINANCE_CLOSING': return <div className={`${baseClass} bg-emerald-50 text-emerald-600 border-emerald-100`}><DollarSign className="w-4 h-4" /></div>;
            case 'RATE_CHANGE': return <div className={`${baseClass} bg-amber-50 text-amber-500 border-amber-100`}><AlertTriangle className="w-4 h-4" /></div>;
            case 'SUPPORT_TICKET': return <div className={`${baseClass} bg-blue-50 text-blue-500 border-blue-100`}><Ticket className="w-4 h-4" /></div>;
            case 'UNLOCK_REQUEST': return <div className={`${baseClass} bg-amber-50 text-amber-600 border-amber-100 shadow-sm animate-pulse`}><Lock className="w-4 h-4" /></div>;
            case 'MONTH_UNLOCKED': return <div className={`${baseClass} bg-emerald-50 text-emerald-600 border-emerald-100`}><Check className="w-4 h-4" /></div>;
            case 'UNLOCK_REJECTED': return <div className={`${baseClass} bg-rose-50 text-rose-600 border-rose-100`}><ShieldAlert className="w-4 h-4" /></div>;
            case 'GUIDE_TIP': return <div className={`${baseClass} bg-indigo-50 text-indigo-600 border-indigo-100`}><BookOpen className="w-4 h-4" /></div>;
            default: return <div className={`${baseClass} ${read ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-indigo-50 text-indigo-500 border-indigo-100'}`}><Bell className="w-4 h-4" /></div>;
        }
    };

    return (
        <div className="relative mr-2" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-full transition-colors relative ${isOpen ? 'bg-indigo-100/50 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}
                title="Notificaciones"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white animate-pulse shadow-sm" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/60 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-slate-900/5">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h4 className="font-exhibit font-bold text-slate-800 text-sm tracking-tight">Centro de Notificaciones</h4>
                        {unreadCount > 0 && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100/50 shadow-sm">{unreadCount} nuevas</span>}
                    </div>

                    <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                    <Bell className="w-6 h-6 text-slate-300" />
                                </div>
                                <p className="text-sm text-slate-900 font-bold">Todo tranquilo</p>
                                <p className="text-xs text-slate-400 font-medium mt-1">No tienes notificaciones pendientes</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {notifications.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleNotificationClick(item)}
                                        className={`
                                            p-4 transition-all hover:bg-slate-50 relative group cursor-pointer border-l-4 flex gap-3
                                            ${!item.read ? 'bg-indigo-50/10 border-indigo-500' : 'bg-transparent border-transparent opacity-80 hover:opacity-100'}
                                            ${item.priority === 'high' && !item.read ? '!bg-rose-50/20 !border-rose-500' : ''}
                                        `}
                                    >
                                        {/* Icon */}
                                        {getIcon(item.type, item.read)}

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <h5 className={`text-xs font-bold truncate pr-2 ${!item.read ? 'text-slate-900' : 'text-slate-600'}`}>
                                                    {item.title}
                                                </h5>
                                                {/* Date */}
                                                <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                                                    {item.createdAt ? formatTimeAgo(item.createdAt.toDate()) : 'Reciente'}
                                                </span>
                                            </div>

                                            <p className={`text-xs leading-relaxed mb-2 line-clamp-2 ${!item.read ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                                                {item.message}
                                            </p>

                                            {/* Action Hints */}
                                            {item.type === 'UNLOCK_REQUEST' && (
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block">
                                                    <span>Revisar Solicitud</span>
                                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            )}
                                            {item.type === 'MONTH_UNLOCKED' && (
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block">
                                                    <span>Ir al Histórico</span>
                                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Unread Indicator Dot */}
                                        {!item.read && (
                                            <div className="absolute top-4 right-2 w-2 h-2 rounded-full bg-indigo-500" />
                                        )}
                                    </div>

                                ))}
                            </div>
                        )}
                    </div>
                </div >
            )}
        </div >
    );
};

export default Notifications;
