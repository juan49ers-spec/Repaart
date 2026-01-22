import React, { useEffect, useState } from 'react';
import { Terminal, Activity, ShieldCheck, Zap } from 'lucide-react';

interface LogEntry {
    id: string;
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
}

const SystemConsole: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([
        { id: '1', timestamp: '20:50:22', message: 'Sistema Repaart OS v4.1.0 inicializado', type: 'info' },
        { id: '2', timestamp: '20:50:23', message: 'Sincronización con Mapbox API activa', type: 'success' },
        { id: '3', timestamp: '20:51:05', message: 'Carga de red madrid-central: 84.2%', type: 'warning' },
    ]);

    useEffect(() => {
        const messages = [
            'Webhook de pago procesado',
            'Unidad M-30: Posición actualizada',
            'Consultando métricas de rentabilidad...',
            'Nueva orden detectada en App Cliente',
            'SLA de entrega: Estable (22.4 min)',
            'Base de datos: Query optimizada'
        ];

        const interval = setInterval(() => {
            const newLog: LogEntry = {
                id: Math.random().toString(36).substr(2, 9),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                message: messages[Math.floor(Math.random() * messages.length)],
                type: Math.random() > 0.8 ? 'success' : 'info'
            };
            setLogs(prev => [newLog, ...prev].slice(0, 50));
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <aside className="hidden 2xl:flex flex-col w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 transition-all duration-300">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sistema Live</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-[10px] font-bold text-emerald-500">SYNC</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide space-y-3">
                {/* System Status Summary */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Seguridad</span>
                        <span className="text-[10px] font-black text-slate-900 dark:text-white">ACTIVA</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Latency</span>
                        <span className="text-[10px] font-black text-slate-900 dark:text-white">14ms</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Registro de Eventos</h4>
                    <div className="space-y-2.5">
                        {logs.map((log) => (
                            <div key={log.id} className="group animate-in fade-in slide-in-from-right-2 duration-500">
                                <div className="flex items-start gap-2 text-[10px] leading-relaxed">
                                    <span className="text-slate-400 font-mono flex-shrink-0">[{log.timestamp}]</span>
                                    <span className={`
                                    flex-1 font-medium
                                    ${log.type === 'success' ? 'text-emerald-500' : ''}
                                    ${log.type === 'warning' ? 'text-amber-500' : ''}
                                    ${log.type === 'error' ? 'text-ruby-600' : ''}
                                    ${log.type === 'info' ? 'text-slate-600 dark:text-slate-300' : ''}
                                `}>
                                        {log.message}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 mt-auto">
                <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-indigo-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">CPU LOAD: 12.4%</span>
                </div>
            </div>
        </aside>
    );
};

export default SystemConsole;
