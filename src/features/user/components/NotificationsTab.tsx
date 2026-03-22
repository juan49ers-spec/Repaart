import { useState, useEffect, type FC } from 'react';
import {
    Clock, DollarSign, Lock as LockIcon, Bell, Inbox, X, Check,
    AlertTriangle, Ticket, ShieldAlert, BookOpen, ArrowRight, Calendar
} from 'lucide-react';
import { doc, collection, query, where, orderBy, limit, getDocs, Timestamp, updateDoc, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { type User } from 'firebase/auth';
import { type AuthUser } from '../../../context/AuthContext';
import { formatTimeAgo } from '../../../utils/dateHelpers';
import { auditService } from '../../admin/services/auditService';

interface NotificationsTabProps {
    user: User;
    franchiseId?: string;
    isAdmin?: boolean;
    showMessage: (type: string, text: string) => void;
}

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: string;
    createdAt: Timestamp;
    read: boolean;
    priority?: 'high' | 'normal' | 'low';
    metadata?: Record<string, unknown>;
    status?: 'pending' | 'resolved' | 'rejected';
    // Admin specific fields
    franchiseName?: string;
    franchiseId?: string;
    userId?: string;
}

type FilterType = 'all' | 'actionable' | 'system' | 'history';

const NotificationsTab: FC<NotificationsTabProps> = ({ user, franchiseId, isAdmin = false, showMessage }) => {
    const [activeFilter, setActiveFilter] = useState<FilterType>('actionable');
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // --- LOAD DATA ---
    useEffect(() => {
        let unsubscribe: () => void;
        setLoading(true);

        try {
            let q;

            if (isAdmin) {
                // --- ADMIN QUERY ---
                console.log("Fetching ADMIN notifications");
                q = query(
                    collection(db, "admin_notifications"),
                    orderBy("createdAt", "desc"),
                    limit(50)
                );
            } else {
                // --- FRANCHISE QUERY ---
                const targetIds = [user.uid];
                // Safe franchise ID check
                if (franchiseId) targetIds.push(franchiseId);
                // Also check if user object has it attached
                if ((user as AuthUser).franchiseId && (user as AuthUser).franchiseId !== franchiseId) {
                    targetIds.push((user as AuthUser).franchiseId as string);
                }

                console.log("Fetching FRANCHISE notifications for:", targetIds);

                q = query(
                    collection(db, "notifications"),
                    where("userId", "in", targetIds),
                    orderBy("createdAt", "desc"),
                    limit(50)
                );
            }

            // Use onSnapshot for real-time updates
            unsubscribe = onSnapshot(q, (snapshot) => {
                const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationItem));
                setNotifications(list);
                setLoading(false);
            }, (error) => {
                console.error("Error loading notifications:", error);
                setLoading(false);
            });

        } catch (error) {
            console.error("Error setting up notifications listener:", error);
            setLoading(false);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user, franchiseId, isAdmin]);

    // --- ACTIONS (REAL BUSINESS LOGIC) ---
    const handleAction = async (id: string, action: 'approve' | 'reject', type: string, metadata?: Record<string, unknown>) => {
        setProcessingId(id);

        // 1. Optimistic Update (UI Feedback)
        const previousState = [...notifications];
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, status: action === 'approve' ? 'resolved' : 'rejected', read: true } : n
        ));

        // Determine collection based on role
        const collectionName = isAdmin ? "admin_notifications" : "notifications";

        try {
            // 2. Perform DB Update (Notification Status)
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, {
                status: action === 'approve' ? 'resolved' : 'rejected',
                read: true,
                resolvedAt: Timestamp.now()
            });

            console.log(`[Action] ${action.toUpperCase()} on notification ${id}`);

            // 3. EXECUTE BUSINESS LOGIC BASED ON TYPE
            if (type === 'UNLOCK_REQUEST') {
                const franchiseId = (metadata?.franchiseId || (user as AuthUser).franchiseId) as string | undefined;
                const monthYear = metadata?.monthYear as string | undefined; // Expected format: '01-2026' or similar

                if (action === 'approve' && franchiseId && monthYear) {
                    // A: Unlock the Financial Month
                    const closureId = `${franchiseId}_${monthYear}`;
                    const closureRef = doc(db, "finance_closures", closureId);

                    try {
                        await updateDoc(closureRef, {
                            status: 'open',
                            locked: false,
                            unlockedBy: user.uid,
                            unlockedAt: Timestamp.now()
                        });
                        console.log(`[Finance] Month ${monthYear} unlocked for ${franchiseId}`);

                        // --- AUDIT LOG ---
                        await auditService.logAction(user, 'APPROVE', 'finance_closure', closureId,
                            { after: { status: 'open', locked: false } },
                            { reason: 'Unlock Request Approved', notificationId: id, monthYear }
                        );

                    } catch (err) {
                        console.warn("Could not find direct closure doc, trying query fallback...", err);
                        // Fallback query if ID structure is different
                        const qClosure = query(
                            collection(db, "finance_closures"),
                            where("franchiseId", "==", franchiseId),
                            where("monthYear", "==", monthYear),
                            limit(1)
                        );
                        const snaps = await getDocs(qClosure);
                        if (!snaps.empty) {
                            await updateDoc(snaps.docs[0].ref, { status: 'open', locked: false });

                            // --- AUDIT LOG (Fallback) ---
                            await auditService.logAction(user, 'APPROVE', 'finance_closure', snaps.docs[0].id,
                                { after: { status: 'open', locked: false } },
                                { reason: 'Unlock Request Approved (Query)', notificationId: id }
                            );
                        }
                    }

                    // B: Send Feedback Notification to Franchise
                    await addDoc(collection(db, "notifications"), {
                        userId: franchiseId, // Notify the franchise
                        type: 'MONTH_UNLOCKED',
                        title: 'Solicitud Aprobada',
                        message: `Se ha desbloqueado el mes de ${(metadata?.monthLabel as string) || monthYear}. Ya puedes realizar modificaciones.`,
                        read: false,
                        createdAt: Timestamp.now(),
                        priority: 'high',
                        metadata: {
                            monthYear: monthYear,
                            approvedBy: user.uid
                        }
                    });
                } else if (action === 'reject' && franchiseId) {
                    // Notify Rejection
                    await addDoc(collection(db, "notifications"), {
                        userId: franchiseId,
                        type: 'UNLOCK_REJECTED',
                        title: 'Solicitud Rechazada',
                        message: `No se ha aprobado el desbloqueo del mes de ${(metadata?.monthLabel as string) || monthYear}. Contacta con soporte para más detalles.`,
                        read: false,
                        createdAt: Timestamp.now(),
                        priority: 'normal'
                    });

                    // --- AUDIT LOG ---
                    await auditService.logAction(user, 'REJECT', 'finance_closure', `${franchiseId}_${monthYear}`,
                        undefined,
                        { reason: 'Unlock Request Rejected', notificationId: id }
                    );
                }
            } else if (type === 'shift_change_request') {
                const shiftId = metadata?.shiftId as string | undefined;
                const newStart = metadata?.newStart as string | undefined; // ISO String
                const newEnd = metadata?.newEnd as string | undefined;     // ISO String
                const riderId = metadata?.riderId as string | undefined;

                if (action === 'approve' && shiftId && newStart && newEnd) {
                    // A: Update the Shift
                    const shiftRef = doc(db, "work_shifts", shiftId);
                    await updateDoc(shiftRef, {
                        startAt: Timestamp.fromDate(new Date(newStart)),
                        endAt: Timestamp.fromDate(new Date(newEnd)),
                        changeRequested: false, // Clear flag
                        changeReason: null,
                        status: 'scheduled', // Re-confirm status if needed
                        updatedAt: Timestamp.now()
                    });
                    console.log(`[Shift] Shift ${shiftId} updated to ${newStart} - ${newEnd}`);

                    // --- AUDIT LOG ---
                    await auditService.logAction(user, 'APPROVE', 'work_shift', shiftId as string,
                        { after: { startAt: newStart, endAt: newEnd, status: 'scheduled' } },
                        { reason: 'Shift Change Request Approved', notificationId: id }
                    );

                    // B: Notify Rider
                    if (riderId) {
                        await addDoc(collection(db, "notifications"), {
                            userId: riderId,
                            type: 'shift_confirmed', // Specialized type for rider feedback
                            title: 'Cambio de Turno Aprobado',
                            message: `Tu solicitud de cambio de horario ha sido aprobada.`,
                            read: false,
                            createdAt: Timestamp.now(),
                            priority: 'normal',
                            metadata: { shiftId }
                        });
                    }

                } else if (action === 'reject' && shiftId) {
                    // Just clear the flag without changing times
                    const shiftRef = doc(db, "work_shifts", shiftId as string);
                    await updateDoc(shiftRef, {
                        changeRequested: false,
                        changeReason: null, // Clear reason
                        updatedAt: Timestamp.now()
                    });

                    // --- AUDIT LOG ---
                    await auditService.logAction(user, 'REJECT', 'work_shift', shiftId as string,
                        { after: { changeRequested: false } },
                        { reason: 'Shift Change Request Rejected', notificationId: id }
                    );

                    // Notify Rider of Rejection
                    if (riderId) {
                        await addDoc(collection(db, "notifications"), {
                            userId: riderId,
                            type: 'incident', // Using 'incident' or generic alert for rejection
                            title: 'Cambio de Turno Rechazado',
                            message: `Tu solicitud de cambio ha sido rechazada. Se mantiene el horario original.`,
                            read: false,
                            createdAt: Timestamp.now(),
                            priority: 'normal',
                            metadata: { shiftId }
                        });
                    }
                }
            }

            showMessage(
                action === 'approve' ? 'success' : 'info',
                action === 'approve' ? 'Solicitud aprobada y procesada' : 'Solicitud rechazada'
            );

        } catch (error) {
            // Revert on error
            console.error("Action failed:", error);
            setNotifications(previousState);
            showMessage('error', 'No se pudo procesar la acción');
        } finally {
            setProcessingId(null);
        }
    };

    const markAsRead = async (id: string) => {
        // Optimistic
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        try {
            const collectionName = isAdmin ? "admin_notifications" : "notifications";
            await updateDoc(doc(db, collectionName, id), { read: true });
        } catch (e) {
            console.error("Read mark failed", e);
        }
    };

    // --- FILTERING LOGIC ---
    const filteredNotifications = notifications.filter(n => {
        // Common resolved statuses
        const isResolved = n.status === 'resolved' || n.status === 'rejected';

        // HISTORY: Only showing resolved/rejected
        if (activeFilter === 'history') return isResolved;

        // ACTIONABLE (PENDING = PENDIENTES):
        // 1. Specific actionable types (Unlock, Shift Change) that are NOT resolved
        // 2. OR any other notification that is UNREAD (Legacy behavior)
        if (activeFilter === 'actionable') {
            const isActionableType = n.type === 'UNLOCK_REQUEST' || n.type === 'shift_change_request';

            // If it's a request type, show it if it's NOT resolved (status pending or undefined)
            if (isActionableType) return !isResolved;

            // For everything else (System alerts, etc), show if UNREAD
            return !n.read;
        }

        // SYSTEM: Non-actionable types
        if (activeFilter === 'system') return n.type !== 'UNLOCK_REQUEST' && n.type !== 'shift_change_request';

        // ALL: Everything
        return true;
    });

    const pendingCount = notifications.filter(n => {
        const isResolved = n.status === 'resolved' || n.status === 'rejected';
        const isActionableType = n.type === 'UNLOCK_REQUEST' || n.type === 'shift_change_request';
        if (isActionableType) return !isResolved;
        return !n.read;
    }).length;

    // --- RENDER HELPERS ---
    const getIcon = (type: string) => {
        const base = "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm";
        switch (type) {
            case 'UNLOCK_REQUEST': return <div className={`${base} bg-indigo-50 text-indigo-600 border-indigo-100`}><LockIcon className="w-5 h-5" /></div>;
            case 'shift_change_request': return <div className={`${base} bg-amber-50 text-amber-600 border-amber-100`}><Clock className="w-5 h-5" /></div>;
            case 'RATE_CHANGE': return <div className={`${base} bg-blue-50 text-blue-600 border-blue-100`}><DollarSign className="w-5 h-5" /></div>;
            case 'FINANCE_CLOSING': return <div className={`${base} bg-emerald-50 text-emerald-600 border-emerald-100`}><DollarSign className="w-5 h-5" /></div>;
            case 'SUPPORT_TICKET': return <div className={`${base} bg-blue-50 text-blue-600 border-blue-100`}><Ticket className="w-5 h-5" /></div>;
            case 'incident': return <div className={`${base} bg-rose-50 text-rose-600 border-rose-100`}><ShieldAlert className="w-5 h-5" /></div>;
            case 'GUIDE_TIP': return <div className={`${base} bg-slate-50 text-slate-600 border-slate-100`}><BookOpen className="w-5 h-5" /></div>;
            default: return <div className={`${base} bg-slate-50 text-slate-400 border-slate-100`}><Bell className="w-5 h-5" /></div>;
        }
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-5xl mx-auto h-full flex flex-col">

            {/* --- HEADER & FILTERS --- */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        Buzón de Actividad
                        {pendingCount > 0 && <span className="bg-rose-500 text-white text-xs px-2 py-1 rounded-full">{pendingCount}</span>}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Gestiona solicitudes y revisa la actividad de tu franquicia.</p>
                </div>

                {/* Filter Tabs (Apple Style Segmented Control) */}
                <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                        onClick={() => setActiveFilter('actionable')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeFilter === 'actionable' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Pendientes
                    </button>
                    <button
                        onClick={() => setActiveFilter('history')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeFilter === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Historial
                    </button>
                    <button
                        onClick={() => setActiveFilter('all')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Todo
                    </button>
                </div>
            </div>

            {/* --- LIST AREA --- */}
            <div className="flex-1 space-y-4 pb-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                        <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                        <span className="text-sm font-medium">Sincronizando buzón...</span>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <Inbox className="w-10 h-10 text-slate-300" />
                        </div>
                        <p className="font-bold text-slate-900 text-lg">Buzón Vacío</p>
                        <p className="text-sm text-slate-500">No hay elementos que coincidan con este filtro.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`
                                    relative bg-white rounded-2xl p-5 border transition-all duration-300 group
                                    ${!notification.read ? 'border-indigo-100 shadow-md ring-1 ring-indigo-500/50' : 'border-slate-200 shadow-sm hover:border-slate-300'}
                                    ${processingId === notification.id ? 'opacity-50 pointer-events-none grayscale' : ''}
                                `}
                                onClick={() => !notification.read && markAsRead(notification.id)}
                            >
                                <div className="flex items-start gap-5">
                                    {/* Icon */}
                                    {getIcon(notification.type)}

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1.5">
                                            <h3 className={`text-base font-bold ${!notification.read ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                {notification.title}
                                            </h3>
                                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100 flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" />
                                                {notification.createdAt ? formatTimeAgo(notification.createdAt.toDate()) : 'Reciente'}
                                            </span>
                                        </div>

                                        <p className="text-sm text-slate-500 leading-relaxed mb-4">
                                            {notification.message}
                                        </p>

                                        {/* --- SMART CONTEXT DATA (If Applicable) --- */}
                                        {(notification.metadata || notification.franchiseName) && (
                                            <div className="mb-4 bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs">
                                                {/* Logic to display specific metadata based on type */}
                                                {notification.type === 'UNLOCK_REQUEST' && (
                                                    <div className="w-full">
                                                        <div className="flex items-center gap-4 mb-2">
                                                            <div>
                                                                <span className="block text-slate-400 uppercase tracking-wider font-bold text-[10px]">Cierre Auditado</span>
                                                                <span className="font-mono font-bold text-slate-700">{(notification.metadata?.monthLabel as string) || (notification.metadata?.monthYear as string) || '---'}</span>
                                                            </div>
                                                            <div className="w-px h-8 bg-slate-200"></div>
                                                            <div>
                                                                <span className="block text-slate-400 uppercase tracking-wider font-bold text-[10px]">Solicitante</span>
                                                                <span className="font-bold text-slate-700">{(notification.metadata?.requestorName as string) || notification.franchiseName || 'Usuario'}</span>
                                                            </div>
                                                        </div>
                                                        <ClosurePreview
                                                            franchiseId={(notification.metadata?.franchiseId || (user as AuthUser).franchiseId) as string}
                                                            monthYear={notification.metadata?.monthYear as string}
                                                            user={user}
                                                        />
                                                    </div>
                                                )}

                                                {/* SHIFT CHANGE VISUAL DIFF */}
                                                {notification.type === 'shift_change_request' && notification.metadata && (
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2 text-slate-500 font-medium pb-2 border-b border-slate-100">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            <span>Solicitud de Cambio de Turno</span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-2">
                                                            {/* Original (Left) */}
                                                            <div className="flex-1 bg-white p-2 rounded-lg border border-slate-100 shadow-sm opacity-60 grayscale">
                                                                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Turno Actual</span>
                                                                <div className="font-mono text-slate-700 font-bold">
                                                                    {notification.metadata.currentStart && notification.metadata.currentEnd
                                                                        ? `${new Date(notification.metadata.currentStart as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(notification.metadata.currentEnd as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                                                        : 'Sin asignar'}
                                                                </div>
                                                            </div>

                                                            <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />

                                                            {/* New (Right) - Highlighted */}
                                                            <div className="flex-1 bg-white p-2 rounded-lg border border-emerald-100 shadow-sm ring-1 ring-emerald-500/20">
                                                                <span className="block text-[9px] uppercase tracking-wider text-emerald-600 font-bold mb-1">Nuevo Horario</span>
                                                                <div className="font-mono text-emerald-700 font-black">
                                                                    {notification.metadata.newStart && notification.metadata.newEnd
                                                                        ? `${new Date(notification.metadata.newStart as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(notification.metadata.newEnd as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                                                        : '??:?? - ??:??'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {notification.metadata.reason && (
                                                            <div className="text-slate-500 italic bg-amber-50/50 p-2 rounded border border-amber-100/50">
                                                                &ldquo;{notification.metadata.reason as string}&rdquo;
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Generic fallback for Franchise/Context info */}
                                                {!notification.metadata && notification.franchiseName && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-400 font-bold">Franquicia:</span>
                                                        <span className="text-slate-700 font-bold">{notification.franchiseName}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* --- ACTION BUTTONS (Only for Actionable) --- */}
                                        {(notification.type === 'UNLOCK_REQUEST' || notification.type === 'shift_change_request') &&
                                            notification.status !== 'resolved' &&
                                            notification.status !== 'rejected' && (
                                                <div className="flex flex-wrap items-center gap-3 pt-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleAction(notification.id, 'approve', notification.type, notification.metadata); }}
                                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                        {notification.type === 'UNLOCK_REQUEST' ? 'Desbloquear Mes' : 'Aprobar Solicitud'}
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleAction(notification.id, 'reject', notification.type, notification.metadata); }}
                                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 text-xs font-bold rounded-xl transition-all active:scale-95"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                        Rechazar
                                                    </button>
                                                </div>
                                            )}

                                        {/* --- STATUS BADGES (For History) --- */}
                                        {(notification.status === 'resolved' || notification.status === 'rejected') && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${notification.status === 'resolved'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : 'bg-rose-50 text-rose-700 border-rose-100'
                                                    }`}>
                                                    {notification.status === 'resolved' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                                    {notification.status === 'resolved' ? 'Aprobado' : 'Rechazado'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Unread Indicator */}
                                    {!notification.read && (
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm mt-2"></div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const ClosurePreview: FC<{ franchiseId: string; monthYear: string; user: User }> = ({ franchiseId, monthYear, user }) => {
    const [data, setData] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClosure = async () => {
            // 1. Try Direct ID first
            const closureId = `${franchiseId}_${monthYear}`;
            const docRef = doc(db, "finance_closures", closureId);
            const snap = await getDocs(query(collection(db, "finance_closures"), where("franchiseId", "==", franchiseId), where("monthYear", "==", monthYear), limit(1))); // Fallback query is safer initially if IDs aren't guaranteed

            if (!snap.empty) {
                setData(snap.docs[0].data());
            } else {
                // Try getting by ID if query fails? Or just null
            }
            setLoading(false);
        };
        if (franchiseId && monthYear) fetchClosure();
    }, [franchiseId, monthYear]);

    if (loading) return (
        <div className="flex gap-4 animate-pulse">
            <div className="h-12 w-24 bg-slate-200 rounded-lg"></div>
            <div className="h-12 w-24 bg-slate-200 rounded-lg"></div>
            <div className="h-12 w-24 bg-slate-200 rounded-lg"></div>
        </div>
    );

    if (!data) return <div className="text-xs text-slate-400 italic">No se encontraron datos financieros para este periodo.</div>;

    const formatCurrency = (amount: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);

    const closureData = data as { totalRevenue: number; totalExpenses: number; netParam?: number; unlockedBy?: string };

    return (
        <div className="mt-2 bg-white/50 border border-slate-200 rounded-xl p-3 flex flex-wrap gap-4 shadow-sm backdrop-blur-sm">
            <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Ingresos</span>
                <span className="text-sm font-black text-emerald-600 font-mono">{formatCurrency(closureData.totalRevenue)}</span>
            </div>
            <div className="w-px h-8 bg-slate-200 self-center"></div>
            <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Gastos</span>
                <span className="text-sm font-black text-rose-500 font-mono">{formatCurrency(closureData.totalExpenses)}</span>
            </div>
            <div className="w-px h-8 bg-slate-200 self-center"></div>
            <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Beneficio Neto</span>
                <span className={`text-sm font-black font-mono ${(closureData.netParam ?? 0) > 0 ? 'text-indigo-600' : 'text-slate-600'}`}>
                    {formatCurrency(closureData.netParam || (closureData.totalRevenue - closureData.totalExpenses))}
                </span>
            </div>
            {closureData.unlockedBy && (
                <div className="ml-auto flex items-center gap-1 text-[9px] bg-amber-50 text-amber-600 px-2 py-1 rounded border border-amber-100">
                    <LockIcon size={10} />
                    PREVIAMENTE DESBLOQUEADO
                </div>
            )}
        </div>
    );
};

export default NotificationsTab;
