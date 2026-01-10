import React, { useState, useEffect } from 'react';
import { X, Trash2, Download } from 'lucide-react';
import { ConsoleLog, LogLevel, clearLogs, subscribeToLogs, exportLogs, formatLogTime, startConsoleCapture } from '../../../scripts/consoleCapture';

interface ConsoleViewerProps {
    isOpen: boolean;
    onClose: () => void;
}

const ConsoleViewer: React.FC<ConsoleViewerProps> = ({ isOpen, onClose }) => {
    const [logs, setLogs] = useState<ConsoleLog[]>([]);
    const [filterLevel, setFilterLevel] = useState<LogLevel | 'all'>('all');

    useEffect(() => {
        // Start capturing console on mount
        startConsoleCapture();

        // Subscribe to log updates
        const unsubscribe = subscribeToLogs(setLogs);

        return unsubscribe;
    }, []);

    if (!isOpen) return null;

    const filteredLogs = filterLevel === 'all'
        ? logs
        : logs.filter(log => log.level === filterLevel);

    const levelColors = {
        log: 'text-slate-300 bg-slate-800/30',
        info: 'text-blue-300 bg-blue-900/20',
        warn: 'text-amber-300 bg-amber-900/20',
        error: 'text-red-300 bg-red-900/20'
    };

    const levelIcons = {
        log: '📝',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌'
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-gradient-to-r from-slate-800 to-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="text-2xl">🖥️</div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Console Live</h3>
                            <p className="text-xs text-slate-400">{filteredLogs.length} mensajes</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Filter */}
                        <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value as any)}
                            className="bg-slate-800 border border-slate-700 text-white text-xs rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            title="Filtrar por nivel"
                        >
                            <option value="all">Todos</option>
                            <option value="log">Log</option>
                            <option value="info">Info</option>
                            <option value="warn">Warning</option>
                            <option value="error">Error</option>
                        </select>

                        {/* Clear */}
                        <button
                            onClick={clearLogs}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                            title="Limpiar logs"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>

                        {/* Export */}
                        <button
                            onClick={exportLogs}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                            title="Exportar logs"
                        >
                            <Download className="w-4 h-4" />
                        </button>

                        {/* Close */}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                            title="Cerrar"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Logs */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-xs">
                    {filteredLogs.length === 0 ? (
                        <div className="text-center text-slate-500 py-12">
                            <p className="text-4xl mb-2">📭</p>
                            <p>No hay logs capturados</p>
                            <p className="text-xs mt-1">Los nuevos logs aparecerán aquí en tiempo real</p>
                        </div>
                    ) : (
                        filteredLogs.map(log => (
                            <div
                                key={log.id}
                                className={`p-2 rounded border-l-2 ${log.level === 'error' ? 'border-red-500' :
                                    log.level === 'warn' ? 'border-amber-500' :
                                        log.level === 'info' ? 'border-blue-500' :
                                            'border-slate-600'
                                    } ${levelColors[log.level]}`}
                            >
                                <div className="flex items-start gap-2">
                                    <span>{levelIcons[log.level]}</span>
                                    <span className="text-slate-500 text-[10px] mt-0.5 flex-shrink-0">
                                        {formatLogTime(log.timestamp)}
                                    </span>
                                    <pre className="flex-1 whitespace-pre-wrap break-all">
                                        {log.message}
                                    </pre>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConsoleViewer;
