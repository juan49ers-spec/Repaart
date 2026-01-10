import React, { useState, useEffect } from 'react';
import { X, Trash2, Download } from 'lucide-react';
import { FirestoreQuery, clearQueries, subscribeToQueries, exportQueries, formatQueryDuration, getQueryStats } from '../../../scripts/firestoreMonitor';
import { startNetworkCapture } from '../../../scripts/networkInterceptor';

interface NetworkMonitorProps {
    isOpen: boolean;
    onClose: () => void;
}

const NetworkMonitor: React.FC<NetworkMonitorProps> = ({ isOpen, onClose }) => {
    const [queries, setQueries] = useState<FirestoreQuery[]>([]);
    const [filterType, setFilterType] = useState<string>('all');

    useEffect(() => {
        // Start capturing network requests
        startNetworkCapture();
        const unsubscribe = subscribeToQueries(setQueries);
        return unsubscribe;
    }, []);

    if (!isOpen) return null;

    const filteredQueries = filterType === 'all'
        ? queries
        : filterType === 'slow'
            ? queries.filter(q => q.isSlow)
            : filterType === 'error'
                ? queries.filter(q => q.status === 'error')
                : queries.filter(q => q.type === filterType);

    const stats = getQueryStats();

    const typeColors = {
        getDocs: 'text-blue-300 bg-blue-900/20',
        getDoc: 'text-cyan-300 bg-cyan-900/20',
        setDoc: 'text-green-300 bg-green-900/20',
        updateDoc: 'text-yellow-300 bg-yellow-900/20',
        deleteDoc: 'text-red-300 bg-red-900/20',
        addDoc: 'text-emerald-300 bg-emerald-900/20'
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
                    <div className="flex items-center gap-3">
                        <div className="text-2xl">🌐</div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Network Monitor</h3>
                            <p className="text-xs text-slate-400">
                                {filteredQueries.length} queries · Avg: {stats.avgDuration}ms
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Stats */}
                        <div className="flex items-center gap-3 mr-2">
                            <div className="text-xs">
                                <span className="text-slate-500">Total: </span>
                                <span className="text-white font-bold">{stats.total}</span>
                            </div>
                            <div className="text-xs">
                                <span className="text-amber-500">Slow: </span>
                                <span className="text-amber-300 font-bold">{stats.slow}</span>
                            </div>
                            <div className="text-xs">
                                <span className="text-red-500">Errors: </span>
                                <span className="text-red-300 font-bold">{stats.errors}</span>
                            </div>
                        </div>

                        {/* Filter */}
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-white text-xs rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            title="Filtrar queries"
                        >
                            <option value="all">Todas</option>
                            <option value="slow">🐌 Lentas (&gt;1s)</option>
                            <option value="error">❌ Errores</option>
                            <option value="getDocs">getDocs</option>
                            <option value="getDoc">getDoc</option>
                            <option value="setDoc">setDoc</option>
                            <option value="updateDoc">updateDoc</option>
                            <option value="deleteDoc">deleteDoc</option>
                            <option value="addDoc">addDoc</option>
                        </select>

                        {/* Clear */}
                        <button
                            onClick={clearQueries}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                            title="Limpiar queries"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>

                        {/* Export */}
                        <button
                            onClick={exportQueries}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                            title="Exportar queries"
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

                {/* Queries */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredQueries.length === 0 ? (
                        <div className="text-center text-slate-500 py-12">
                            <p className="text-4xl mb-2">📡</p>
                            <p>No hay queries capturadas</p>
                            <p className="text-xs mt-1">Las queries de Firestore aparecerán aquí</p>
                        </div>
                    ) : (
                        filteredQueries.map(query => (
                            <div
                                key={query.id}
                                className={`p-3 rounded-lg border-l-4 ${query.status === 'error' ? 'border-red-500 bg-red-900/10' :
                                    query.isSlow ? 'border-amber-500 bg-amber-900/10' :
                                        'border-blue-500 bg-slate-800/30'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs px-2 py-0.5 rounded ${typeColors[query.type]}`}>
                                                {query.type}
                                            </span>
                                            <span className="text-sm font-mono text-white">
                                                {query.collection}
                                            </span>
                                            {query.isSlow && (
                                                <span className="text-xs text-amber-500">🐌 SLOW</span>
                                            )}
                                            {query.status === 'error' && (
                                                <span className="text-xs text-red-500">❌ ERROR</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-400">
                                            <span>{query.timestamp.toLocaleTimeString()}</span>
                                            <span className={query.isSlow ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                                                {formatQueryDuration(query.duration)}
                                            </span>
                                            {query.resultCount !== undefined && (
                                                <span>{query.resultCount} docs</span>
                                            )}
                                        </div>
                                        {query.error && (
                                            <p className="text-xs text-red-400 mt-1 font-mono">
                                                {query.error}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NetworkMonitor;
