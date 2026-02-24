import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { User } from 'firebase/auth';
import { CheckCircle, AlertTriangle, Clock, DollarSign, CheckCircle2, Bell, X, ChevronDown, Check, BellRing, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 7) {
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    } else if (days > 0) {
        return `hace ${days} día${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
        return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else {
        return 'ahora mismo';
    }
};

export interface RiderNotification {
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

interface RiderNotificationsProps {
    user: User;
    toast?: {
        success: (msg: string) => void;
        error: (msg: string) => void;
        info: (msg: string) => void;
        warning: (msg: string) => void;
    };
}

const RiderNotifications: React.FC<RiderNotificationsProps> = ({ user, toast }) => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<RiderNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'shifts' | 'availability' | 'general'>('all');
    const [showAllRead, setShowAllRead] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user?.uid) return;

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    userId: data.userId || user.uid,
                    type: data.type || 'GUIDE_TIP',
                    title: data.title || 'Notificación',
                    message: data.message || '',
                    shiftId: data.shiftId,
                    shiftData: data.shiftData,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    read: data.read || false,
                    priority: data.priority || 'medium'
                } as RiderNotification;
            });

            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
            setLoading(false);
        }, (error) => {
            console.error('Error loading notifications:', error);
            toast?.error('Error al cargar notificaciones');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const markAsRead = async (notificationId: string) => {
        try {
            await updateDoc(doc(db, 'notifications', notificationId), {
                read: true
            });

            setNotifications(prev => prev.map(n =>
                n.id === notificationId ? { ...n, read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unreadNotifs = notifications.filter(n => !n.read);

            await Promise.all(
                unreadNotifs.map(n =>
                    updateDoc(doc(db, 'notifications', n.id), { read: true })
                )
            );

            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            toast?.success('Todas las notificaciones marcadas como leídas');
        } catch (error) {
            console.error('Error marking all as read:', error);
            toast?.error('Error al marcar todas como leídas');
        }
    };

    const deleteNotification = async (notificationId: string) => {
        if (!confirm('¿Eliminar esta notificación?')) return;

        try {
            await updateDoc(doc(db, 'notifications', notificationId), {
                deleted: true,
                deletedAt: new Date()
            });

            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            toast?.success('Notificación eliminada');
        } catch (error) {
            console.error('Error deleting notification:', error);
            toast?.error('Error al eliminar notificación');
        }
    };

    const getIcon = (type: string) => {
        const baseClass = "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm";

        switch (type) {
            case 'shift_confirmed':
                return <div className={`${baseClass} bg-emerald-50 text-emerald-600 border-emerald-100`}><CheckCircle size={16} /></div>;
            case 'shift_change_request':
            case 'shift_modified':
                return <div className={`${baseClass} bg-amber-50 text-amber-600 border-amber-100`}><AlertTriangle size={16} /></div>;
            case 'shift_rejected':
                return <div className={`${baseClass} bg-rose-50 text-rose-600 border-rose-100`}><X size={16} /></div>;
            case 'availability_update':
                return <div className={`${baseClass} bg-blue-50 text-blue-600 border-blue-100`}><Clock size={16} /></div>;
            case 'week_closed':
                return <div className={`${baseClass} bg-purple-50 text-purple-600 border-purple-100`}><CheckCircle2 size={16} /></div>;
            case 'FINANCE_CLOSING':
                return <div className={`${baseClass} bg-emerald-50 text-emerald-600 border-emerald-100`}><DollarSign size={16} /></div>;
            case 'SUPPORT_TICKET':
                return <div className={`${baseClass} bg-indigo-50 text-indigo-600 border-indigo-100`}><Bell size={16} /></div>;
            case 'GUIDE_TIP':
                return <div className={`${baseClass} bg-cyan-50 text-cyan-600 border-cyan-100`}><BookOpen size={16} /></div>;
            default:
                return <div className={`${baseClass} bg-slate-50 text-slate-600 border-slate-100`}><Bell size={16} /></div>;
        }
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'high': return 'border-l-4 border-l-rose-500';
            case 'low': return 'border-l-4 border-l-slate-300';
            default: return 'border-l-4 border-l-amber-500';
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'shifts') return ['shift_confirmed', 'shift_change_request', 'shift_modified', 'shift_rejected'].includes(n.type);
        if (filter === 'availability') return ['availability_update', 'week_closed'].includes(n.type);
        return !['shift_confirmed', 'shift_change_request', 'shift_modified', 'shift_rejected', 'availability_update', 'week_closed'].includes(n.type);
    });

    return (
        <div className="rider-notifications">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                    Notificaciones
                    {unreadCount > 0 && (
                        <span className="ml-2 px-3 py-1 rounded-full bg-rose-500 text-white text-[10px] font-bold uppercase tracking-widest">
                            {unreadCount} nueva{unreadCount > 1 ? 's' : ''}
                        </span>
                    )}
                </h2>
            </div>

            <div className="glass-card rounded-2xl p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${filter === 'all'
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            Todas
                        </button>
                        <button
                            onClick={() => setFilter('shifts')}
                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${filter === 'shifts'
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            Turnos
                        </button>
                        <button
                            onClick={() => setFilter('availability')}
                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${filter === 'availability'
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            Disponibilidad
                        </button>
                        <button
                            onClick={() => setFilter('general')}
                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${filter === 'general'
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            General
                        </button>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-all"
                        >
                            <Check size={14} />
                            Marcar todas como leídas
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col items-center gap-4">
                        <BellRing className="w-12 h-12 text-indigo-500 animate-pulse" />
                        <p className="text-slate-600 dark:text-slate-400">Cargando notificaciones...</p>
                    </div>
                </div>
            ) : filteredNotifications.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col items-center gap-4">
                        <Bell className="w-12 h-12 text-slate-400" />
                        <p className="font-bold text-slate-900 dark:text-white">No hay notificaciones</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {filter === 'all'
                                ? 'No tienes notificaciones recientes.'
                                : 'No hay notificaciones en esta categoría.'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    {filteredNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => !notification.read && markAsRead(notification.id)}
                            className={`
                                p-4 flex gap-4 border-b border-slate-100 dark:border-slate-800
                                hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer
                                ${notification.read ? 'opacity-60' : 'opacity-100'}
                                ${getPriorityColor(notification.priority)}
                            `}
                        >
                            <div className="mt-1">
                                {getIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{notification.title}</h4>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap ml-2">
                                        {formatTimeAgo(notification.createdAt)}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {notification.message}
                                </p>
                                {notification.shiftId && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/scheduler?shift=${notification.shiftId}`);
                                        }}
                                        className="mt-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                        Ver turno
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                {notification.read && (
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                        <Check size={10} />
                                        <span>Leído</span>
                                    </div>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification.id);
                                    }}
                                    className="text-slate-400 hover:text-rose-600 transition-colors"
                                    title="Eliminar notificación"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredNotifications.length > 0 && (
                <div className="mt-4 text-center">
                    <button
                        onClick={() => setShowAllRead(!showAllRead)}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-all"
                    >
                        <span>{showAllRead ? 'Ocultar' : 'Ver'} leídas</span>
                        <ChevronDown size={16} className={showAllRead ? 'rotate-180' : ''} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default RiderNotifications;
