import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { ShieldAlert, RefreshCcw, User } from 'lucide-react';
import EmptyState from '../../ui/feedback/EmptyState';

interface AuditLog {
    id: string;
    timestamp?: Timestamp;
    actorEmail?: string;
    actorId: string;
    action: string;
    details?: any;
    [key: string]: any;
}

const AuditPanel = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Query recent 100 logs
        const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(100));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedLogs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as AuditLog));
            setLogs(fetchedLogs);
            setLoading(false);
        }, (error) => {
            console.warn("Error fetching audit logs:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const formatTime = (ts?: Timestamp) => {
        if (!ts) return "Reciente...";
        return ts.toDate ? ts.toDate().toLocaleString() : new Date().toLocaleString();
    };

    const getActionColor = (action: string) => {
        if (action.includes('LOGIN')) return 'text-emerald-600 bg-emerald-50';
        if (action.includes('REVOKE') || action.includes('DELETE')) return 'text-rose-600 bg-rose-50';
        if (action.includes('APPROVED')) return 'text-indigo-600 bg-indigo-50';
        if (action.includes('TICKET')) return 'text-blue-600 bg-blue-50';
        return 'text-slate-600 bg-slate-50';
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Cargando auditoría...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in-up">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center">
                        <ShieldAlert className="w-8 h-8 mr-3 text-slate-700" /> Registro de Auditoría
                    </h2>
                    <p className="text-slate-500 mt-1">Historial inmutable de acciones críticas (Últimos 100 eventos).</p>
                </div>
                <div className="bg-slate-100 px-3 py-1 rounded-full flex items-center text-xs font-bold text-slate-500">
                    <RefreshCcw className="w-3 h-3 mr-2 animate-spin-slow" /> En vivo
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4 font-bold">Fecha / Hora</th>
                                <th className="px-6 py-4 font-bold">Actor (Usuario)</th>
                                <th className="px-6 py-4 font-bold">Acción</th>
                                <th className="px-6 py-4 font-bold">Detalles (JSON)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-3 text-sm font-bold text-slate-500 whitespace-nowrap uppercase tracking-wider">
                                        {formatTime(log.timestamp)}
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mr-3 text-slate-400">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{log.actorEmail}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">UID: {(log.actorId || '').slice(0, 6)}...</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-black uppercase ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <code className="text-[10px] bg-slate-100 p-1.5 rounded text-slate-600 break-all block max-w-xs font-bold uppercase tracking-widest">
                                            {JSON.stringify(log.details || {})}
                                        </code>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8">
                                        <EmptyState
                                            icon={ShieldAlert}
                                            title="Sin registros"
                                            description="No hay eventos de auditoría registrados todavía."
                                            className="bg-slate-50 border-0"
                                        />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditPanel;
