import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit, Timestamp } from 'firebase/firestore';
import { Bell, Ticket, DollarSign, AlertTriangle, Lock, Check, ShieldAlert, BookOpen, CheckCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { markNotificationAsRead } from '../../lib/notifications';
import { notificationService, NotificationPayload } from '../../services/notificationService';
import { useNavigate } from 'react-router-dom';
import { formatTimeAgo } from '../../utils/dateHelpers';

interface UINotification {
    id: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: Timestamp;
    link?: string;
    type?: string;
    franchiseName?: string;
    franchiseId?: string;
    priority?: 'low' | 'normal' | 'high';
    metadata?: Record<string, unknown>;
}

// Icon + color per notification type
const TYPE_CONFIG: Record<string, { icon: React.ElementType; bg: string; text: string; border: string }> = {
    FINANCE_CLOSING: { icon: DollarSign, bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20' },
    RATE_CHANGE: { icon: AlertTriangle, bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20' },
    SUPPORT_TICKET: { icon: Ticket, bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20' },
    UNLOCK_REQUEST: { icon: Lock, bg: 'bg-violet-500/10', text: 'text-violet-600', border: 'border-violet-500/20' },
    MONTH_UNLOCKED: { icon: Check, bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20' },
    UNLOCK_REJECTED: { icon: ShieldAlert, bg: 'bg-rose-500/10', text: 'text-rose-600', border: 'border-rose-500/20' },
    GUIDE_TIP: { icon: BookOpen, bg: 'bg-indigo-500/10', text: 'text-indigo-600', border: 'border-indigo-500/20' },
    shift_change_request: { icon: AlertTriangle, bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20' },
    shift_confirmed: { icon: Check, bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20' },
    incident: { icon: ShieldAlert, bg: 'bg-rose-500/10', text: 'text-rose-600', border: 'border-rose-500/20' },
};

const DEFAULT_CONFIG = { icon: Bell, bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-400', border: 'border-slate-200 dark:border-slate-700' };

const NotificationsPage: React.FC = () => {
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<UINotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        if (!user) return;
        let mounted = true;

        const q = isAdmin
            ? query(collection(db, "admin_notifications"), orderBy("createdAt", "desc"), limit(50))
            : query(collection(db, "notifications"), where("userId", "in", [user.uid, ...(user.franchiseId ? [user.franchiseId] : [])]), orderBy("createdAt", "desc"), limit(50));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!mounted) return;
            const list = snapshot.docs.map(d => {
                const data = d.data() as NotificationPayload;
                return {
                    id: d.id,
                    title: data.title,
                    message: data.message,
                    read: data.read,
                    createdAt: data.createdAt,
                    type: data.type,
                    franchiseName: data.franchiseName,
                    franchiseId: data.franchiseId,
                    priority: data.priority,
                    metadata: data.metadata,
                } as UINotification;
            });
            setNotifications(list);
            setLoading(false);
        }, () => { if (mounted) setLoading(false); });

        return () => { mounted = false; unsubscribe(); };
    }, [user, isAdmin]);

    const handleClick = (n: UINotification) => {
        // Mark as read
        if (!n.read) {
            if (isAdmin) notificationService.markAsRead(n.id);
            else markNotificationAsRead(n.id);
        }
        // Navigate
        if (isAdmin) {
            if (['FINANCE_CLOSING', 'RATE_CHANGE', 'UNLOCK_REQUEST', 'MONTH_UNLOCKED', 'UNLOCK_REJECTED'].includes(n.type || '')) {
                const fId = (n.metadata?.franchiseId as string) || n.franchiseId;
                if (fId) navigate(`/admin/franchise/${fId}`);
            } else if (n.type === 'SUPPORT_TICKET') navigate('/admin/support');
        } else {
            if (n.link?.startsWith('/')) navigate(n.link);
            else if (n.type === 'shift_change_request' || n.type === 'incident') navigate('/operations');
            else if (n.link) window.open(n.link, '_blank');
        }
    };

    const markAllAsRead = async () => {
        for (const n of notifications.filter(x => !x.read)) {
            if (isAdmin) await notificationService.markAsRead(n.id);
            else await markNotificationAsRead(n.id);
        }
    };

    const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;
    const unreadCount = notifications.filter(n => !n.read).length;

    if (loading) {
        return (
            <div className="p-8 max-w-3xl mx-auto space-y-3 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Notificaciones</h1>
                    {unreadCount > 0 && (
                        <span className="text-[10px] font-bold text-white bg-indigo-500 px-2 py-0.5 rounded-full">{unreadCount}</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {(['all', 'unread'] as const).map(tab => (
                        <button key={tab} onClick={() => setFilter(tab)}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${filter === tab
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}>
                            {tab === 'all' ? 'Todas' : 'No leídas'}
                        </button>
                    ))}
                    {unreadCount > 0 && (
                        <button onClick={markAllAsRead}
                            className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all">
                            <CheckCheck className="w-3.5 h-3.5" /> Leer todo
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
                    <Bell className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm font-semibold">Sin notificaciones</p>
                </div>
            ) : (
                <div className="space-y-1.5">
                    {filtered.map(n => {
                        const cfg = TYPE_CONFIG[n.type || ''] || DEFAULT_CONFIG;
                        const Icon = cfg.icon;
                        const time = n.createdAt ? formatTimeAgo(n.createdAt.toDate()) : '';

                        return (
                            <div
                                key={n.id}
                                onClick={() => handleClick(n)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-150 border group ${!n.read
                                        ? 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-700/50 shadow-sm hover:shadow-md'
                                        : 'bg-slate-50/50 dark:bg-slate-900/30 border-transparent hover:bg-white dark:hover:bg-slate-900 hover:border-slate-200/50 dark:hover:border-slate-700/30'
                                    }`}
                            >
                                {/* Unread dot */}
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${!n.read ? 'bg-indigo-500' : 'bg-transparent'}`} />

                                {/* Icon */}
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.border}`}>
                                    <Icon className={`w-4 h-4 ${cfg.text}`} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                        <p className={`text-sm font-semibold truncate ${!n.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                            {n.title}
                                        </p>
                                        {n.franchiseName && (
                                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider shrink-0">{n.franchiseName}</span>
                                        )}
                                    </div>
                                    <p className={`text-xs truncate mt-0.5 ${!n.read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400 dark:text-slate-600'}`}>
                                        {n.message}
                                    </p>
                                </div>

                                {/* Time */}
                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-600 shrink-0 whitespace-nowrap">{time}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
