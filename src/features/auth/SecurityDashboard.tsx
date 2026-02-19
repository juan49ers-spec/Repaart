import { useEffect, useState } from 'react';
import { useAuth, UserSession } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, where, limit } from 'firebase/firestore';
import { Shield, Smartphone, Monitor, Globe, Clock, LogOut, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export const SecurityDashboard = () => {
    const { user, sessionId: currentSessionId } = useAuth();
    const [sessions, setSessions] = useState<UserSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const sessionsRef = collection(db, "users", user.uid, "sessions");
        const q = query(sessionsRef, orderBy("lastActive", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedSessions = snapshot.docs.map(doc => ({
                sessionId: doc.id,
                ...doc.data()
            })) as UserSession[];
            setSessions(loadedSessions);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleRevokeSession = async (sessionIdToRevoke: string) => {
        if (!user) return;
        if (!window.confirm("¿Estás seguro de que quieres cerrar esta sesión remotamente?")) return;

        try {
            await deleteDoc(doc(db, "users", user.uid, "sessions", sessionIdToRevoke));
        } catch (error) {
            console.error("Error revoking session:", error);
            alert("Error al cerrar la sesión. Inténtalo de nuevo.");
        }
    };

    interface SecurityAlert {
        id: string;
        title: string;
        message: string;
        type: string;
        createdAt?: { toDate: () => Date };
    }

    const [recentAlerts, setRecentAlerts] = useState<SecurityAlert[]>([]);

    useEffect(() => {
        if (!user) return;

        const alertsRef = collection(db, "notifications");
        const q = query(
            alertsRef,
            where("userId", "==", user.uid),
            where("type", "==", "security"),
            orderBy("createdAt", "desc"),
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedAlerts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRecentAlerts(loadedAlerts as SecurityAlert[]);
        });

        return () => unsubscribe();
    }, [user]);

    if (loading) {
        return <div className="p-8 text-center text-slate-400 font-medium animate-pulse">Cargando información de seguridad...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 p-5 bg-slate-800/40 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                    <Shield className="text-emerald-500" size={28} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Panel de Seguridad</h2>
                    <p className="text-sm text-slate-400">Gestiona tus dispositivos y supervisa la actividad de tu cuenta.</p>
                </div>
            </div>

            {/* Active Sessions List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Monitor size={14} />
                        Sesiones Activas ({sessions.length})
                    </h3>
                </div>

                <div className="grid gap-3">
                    {sessions.map((session) => {
                        const isCurrent = session.sessionId === currentSessionId;
                        const isMobile = session.deviceType === 'mobile' || session.deviceType === 'tablet';

                        return (
                            <div
                                key={session.sessionId}
                                className={`
                                    group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300
                                    ${isCurrent
                                        ? 'bg-emerald-500/5 border-emerald-500/30 shadow-[0_8px_30px_rgba(16,185,129,0.05)]'
                                        : 'bg-slate-800/20 border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
                                    }
                                `}
                            >
                                {/* Device Icon */}
                                <div className={`p-3 rounded-xl transition-colors ${isCurrent ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/30 text-slate-400 group-hover:bg-slate-700/50'}`}>
                                    {isMobile ? <Smartphone size={24} /> : <Monitor size={24} />}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <h4 className="font-semibold text-slate-200 truncate">
                                            {isMobile ? 'Dispositivo Móvil' : 'Ordenador de Escritorio'}
                                        </h4>
                                        {isCurrent && (
                                            <span className="px-2 py-0.5 text-[10px] font-black text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center gap-1.5 uppercase tracking-tighter">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                Actual
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <Globe size={12} className="text-slate-600" />
                                            <span className="truncate max-w-[250px]" title={session.userAgent}>
                                                {session.userAgent}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <Clock size={12} className="text-slate-600" />
                                            <span>
                                                {session.lastActive?.toDate ? formatDistanceToNow(session.lastActive.toDate(), { addSuffix: true, locale: es }) : 'hace un momento'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                {!isCurrent && (
                                    <button
                                        onClick={() => handleRevokeSession(session.sessionId)}
                                        className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all active:scale-95"
                                        title="Cerrar sesión remotamente"
                                    >
                                        <LogOut size={18} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Security Activity */}
            {recentAlerts.length > 0 && (
                <div className="space-y-4 pt-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={14} />
                        Actividad Reciente
                    </h3>
                    <div className="bg-slate-800/10 border border-slate-800/50 rounded-2xl overflow-hidden">
                        {recentAlerts.map((alert, idx) => (
                            <div
                                key={alert.id}
                                className={`
                                    p-4 flex gap-4 items-start
                                    ${idx !== recentAlerts.length - 1 ? 'border-b border-slate-800/50' : ''}
                                `}
                            >
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 mt-0.5">
                                    <Shield size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                        <h5 className="text-sm font-semibold text-slate-200 italic">{alert.title}</h5>
                                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">
                                            {alert.createdAt?.toDate ? formatDistanceToNow(alert.createdAt.toDate(), { addSuffix: true, locale: es }) : 'ahora'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-tight">{alert.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Security Tips */}
            <div className="mt-4 p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex gap-4 group hover:bg-blue-500/[0.08] transition-colors">
                <div className="p-2.5 bg-blue-500/10 rounded-xl h-fit">
                    <AlertTriangle className="text-blue-400 group-hover:scale-110 transition-transform" size={20} />
                </div>
                <div className="text-sm leading-relaxed">
                    <p className="font-bold text-blue-400 mb-1 tracking-tight">Consejo de Seguridad</p>
                    <p className="text-slate-400">
                        Si ves una sesión que no reconoces, revócala inmediatamente dándole al icono de salida y <span className="text-blue-300 font-medium">cambia tu contraseña</span> para mantener tu cuenta protegida.
                    </p>
                </div>
            </div>
        </div>
    );
};
