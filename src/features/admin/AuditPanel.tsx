import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { User, Activity, ArrowRight, ShieldCheck, Search, Download, Loader2 } from 'lucide-react';
import EmptyState from '../../components/ui/feedback/EmptyState';
import { cn } from '../../lib/utils';

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
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
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
        if (!ts) return "RECIENTE";
        const d = ts.toDate();
        return d.toLocaleTimeString('es-ES', { hour12: false }) + ' ' + d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    };

    const getActionStyle = (action: string) => {
        if (action.includes('LOGIN')) return 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400';
        if (action.includes('REVOKE') || action.includes('DELETE')) return 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400';
        if (action.includes('APPROVED')) return 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400';
        if (action.includes('TICKET')) return 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400';
        return 'text-slate-500 bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400';
    };

    if (loading) {
        return (
            <div className="p-12 text-center flex flex-col items-center justify-center h-96">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Cargando registros...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1700px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900 dark:bg-white rounded-xl shadow-lg">
                        <ShieldCheck className="w-6 h-6 text-white dark:text-slate-900" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                            Registro de <span className="text-indigo-600">Auditoría</span>
                        </h2>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                            Historial completo de acciones y seguridad del sistema
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar registros..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-64"
                        />
                    </div>
                    
                    <button 
                        onClick={() => window.print()}
                        className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* HIGH DENSITY LOG TABLE */}
            <div className="workstation-card workstation-scanline overflow-hidden p-0 border-white/40 dark:border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                                <th className="w-40 px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">marca.tiempo</th>
                                <th className="w-64 px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">identidad.actor</th>
                                <th className="w-48 px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">protocolo.accion</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">traza.carga</th>
                                <th className="w-16 px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                            {logs.map(log => (
                                <tr key={log.id} className="group/row hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 tabular-nums font-mono italic">
                                                {formatTime(log.timestamp).split(' ')[0]}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400 font-mono mt-0.5">
                                                {formatTime(log.timestamp).split(' ')[1]}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-400 group-hover/row:scale-110 transition-transform">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 truncate leading-tight italic">{log.actorEmail}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">ID_{(log.actorId || '').slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "inline-flex px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                            getActionStyle(log.action)
                                        )}>
                                            {log.action.toLowerCase().replace(/_/g, '.')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="relative group/payload cursor-default">
                                            <code className="text-[10px] bg-slate-100 dark:bg-black/40 p-2 rounded-xl text-slate-500 dark:text-slate-400 break-all block max-w-full font-mono border border-slate-200 dark:border-white/5 transition-all group-hover/row:border-ruby-600/30">
                                                {JSON.stringify(log.details || {}).substring(0, 100)}{JSON.stringify(log.details || {}).length > 100 ? '...' : ''}
                                            </code>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                        <ArrowRight className="w-4 h-4 text-ruby-600" />
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-20">
                                        <EmptyState
                                            icon={ShieldCheck}
                                            title="LOG.BUFFER.EMPTY"
                                            description="No critical events detected in the current cycle."
                                            className="bg-transparent border-0 opacity-40 italic"
                                        />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SYSTEM ANALYTICS FOOTER */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="workstation-card p-5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">estado.integridad</p>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase italic">SISTEMA.NOMINAL</h4>
                    </div>
                </div>
                {/* Additional diagnostic slots could go here */}
            </div>
        </div>
    );
};

export default AuditPanel;
