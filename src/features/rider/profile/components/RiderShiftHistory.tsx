import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { User } from 'firebase/auth';
import { Plus, Trash2, Edit3, FileText, Calendar, ChevronDown, ArrowUp, Clock } from 'lucide-react';
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

export interface ShiftChange {
    id: string;
    userId: string;
    shiftId: string;
    type: 'added' | 'removed' | 'modified' | 'requested';
    oldData?: any;
    newData?: any;
    createdAt: Date;
    reason?: string;
    franchiseId?: string;
    read: boolean;
}

interface RiderShiftHistoryProps {
    user: User;
    showMessage: (type: 'success' | 'error', text: string) => void;
}

const RiderShiftHistory: React.FC<RiderShiftHistoryProps> = ({ user, showMessage }) => {
    const navigate = useNavigate();
    const [shiftChanges, setShiftChanges] = useState<ShiftChange[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'added' | 'removed' | 'modified' | 'requested'>('all');
    const [showAll, setShowAll] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.uid) return;

        const q = query(
            collection(db, 'shift_changes'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(30)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const changes = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    userId: data.userId || user.uid,
                    shiftId: data.shiftId,
                    type: data.type || 'added',
                    oldData: data.oldData,
                    newData: data.newData,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    reason: data.reason,
                    franchiseId: data.franchiseId,
                    read: data.read || false
                } as ShiftChange;
            });

            setShiftChanges(changes);
            setLoading(false);
        }, (error) => {
            console.error('Error loading shift changes:', error);
            showMessage('error', 'Error al cargar historial');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, showMessage]);

    const markAsRead = async (changeId: string) => {
        try {
            await updateDoc(doc(db, 'shift_changes', changeId), {
                read: true
            });

            setShiftChanges(prev => prev.map(s =>
                s.id === changeId ? { ...s, read: true } : s
            ));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const getIcon = (type: string) => {
        const baseClass = "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-sm";

        switch (type) {
            case 'added':
                return <div className={`${baseClass} bg-emerald-50 text-emerald-600 border-emerald-100`}><Plus size={18} /></div>;
            case 'removed':
                return <div className={`${baseClass} bg-rose-50 text-rose-600 border-rose-100`}><Trash2 size={18} /></div>;
            case 'modified':
                return <div className={`${baseClass} bg-amber-50 text-amber-600 border-amber-100`}><Edit3 size={18} /></div>;
            case 'requested':
                return <div className={`${baseClass} bg-blue-50 text-blue-600 border-blue-100`}><FileText size={18} /></div>;
            default:
                return <div className={`${baseClass} bg-slate-50 text-slate-600 border-slate-100`}><Clock size={18} /></div>;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'added': return 'Turno agregado';
            case 'removed': return 'Turno eliminado';
            case 'modified': return 'Turno modificado';
            case 'requested': return 'Solicitud de cambio';
            default: return 'Cambio';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'added': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'removed': return 'text-rose-600 bg-rose-50 border-rose-100';
            case 'modified': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'requested': return 'text-blue-600 bg-blue-50 border-blue-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    const filteredChanges = shiftChanges.filter(c => {
        if (filter === 'all') return true;
        return c.type === filter;
    });

    const displayedChanges = showAll ? filteredChanges : filteredChanges.slice(0, 10);

    const handleViewShift = (shiftId: string) => {
        navigate(`/scheduler?shift=${shiftId}`);
    };

    const handleExpand = (changeId: string) => {
        setExpandedId(expandedId === changeId ? null : changeId);
    };

    return (
        <div className="rider-shift-history">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                    Historial de Turnos
                </h2>
            </div>

            <div className="glass-card rounded-2xl p-6 mb-6">
                <div className="flex flex-wrap gap-2 items-center mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${filter === 'all'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilter('added')}
                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${filter === 'added'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Agregados
                    </button>
                    <button
                        onClick={() => setFilter('removed')}
                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${filter === 'removed'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Eliminados
                    </button>
                    <button
                        onClick={() => setFilter('modified')}
                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${filter === 'modified'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Modificados
                    </button>
                    <button
                        onClick={() => setFilter('requested')}
                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${filter === 'requested'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Solicitudes
                    </button>
                </div>

                <div className="text-center mb-4">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-all"
                    >
                        <span>{showAll ? 'Ver menos' : 'Ver todos'}</span>
                        <ChevronDown size={16} className={showAll ? 'rotate-180' : ''} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col items-center gap-4">
                        <Calendar className="w-12 h-12 text-indigo-500 animate-pulse" />
                        <p className="text-slate-600 dark:text-slate-400">Cargando historial...</p>
                    </div>
                </div>
            ) : displayedChanges.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col items-center gap-4">
                        <FileText className="w-12 h-12 text-slate-400" />
                        <p className="font-bold text-slate-900 dark:text-white">No hay cambios recientes</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {filter === 'all'
                                ? 'No tienes cambios en tus turnos recientes.'
                                : 'No hay cambios de este tipo.'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {displayedChanges.map((change) => (
                        <div
                            key={change.id}
                            className={`
                                bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800
                                transition-all cursor-pointer hover:shadow-md
                                ${!change.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}
                            `}
                            onClick={() => !change.read && markAsRead(change.id)}
                        >
                            <div className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">
                                        {getIcon(change.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-sm font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${getTypeColor(change.type)}`}>
                                                {getTypeLabel(change.type)}
                                            </span>
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap ml-2">
                                                {formatTimeAgo(change.createdAt)}
                                            </span>
                                        </div>

                                        {change.reason && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                                <span className="font-medium">Motivo:</span> {change.reason}
                                            </p>
                                        )}

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleExpand(change.id);
                                            }}
                                            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                        >
                                            {expandedId === change.id ? 'Ocultar detalles' : 'Ver detalles'}
                                            <ArrowUp size={12} className={expandedId === change.id ? '' : 'rotate-180'} />
                                        </button>
                                    </div>
                                </div>

                                {expandedId === change.id && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {change.oldData && (
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Datos Anteriores</h4>
                                                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                                        <p className="text-sm text-slate-700 dark:text-slate-300">
                                                            <span className="font-medium">Fecha:</span> {change.oldData.startAt ? new Date(change.oldData.startAt).toLocaleDateString('es-ES') : 'N/A'}
                                                        </p>
                                                        <p className="text-sm text-slate-700 dark:text-slate-300">
                                                            <span className="font-medium">Hora inicio:</span> {change.oldData.startTime || 'N/A'}
                                                        </p>
                                                        <p className="text-sm text-slate-700 dark:text-slate-300">
                                                            <span className="font-medium">Hora fin:</span> {change.oldData.endTime || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {change.newData && (
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Datos Nuevos</h4>
                                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                                        <p className="text-sm text-slate-700 dark:text-slate-300">
                                                            <span className="font-medium">Fecha:</span> {change.newData.startAt ? new Date(change.newData.startAt).toLocaleDateString('es-ES') : 'N/A'}
                                                        </p>
                                                        <p className="text-sm text-slate-700 dark:text-slate-300">
                                                            <span className="font-medium">Hora inicio:</span> {change.newData.startTime || 'N/A'}
                                                        </p>
                                                        <p className="text-sm text-slate-700 dark:text-slate-300">
                                                            <span className="font-medium">Hora fin:</span> {change.newData.endTime || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-end pt-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewShift(change.shiftId);
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-all"
                                            >
                                                <Calendar size={14} />
                                                Ver turno
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RiderShiftHistory;
