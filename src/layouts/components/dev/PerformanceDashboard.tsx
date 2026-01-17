import React, { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, Monitor, Database, Activity } from 'lucide-react';
import { getPerformanceSnapshot, PerformanceMetrics } from '../../../scripts/performanceTracker';

interface PerformanceDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ isOpen, onClose }) => {
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

    const refreshMetrics = useCallback(() => {
        setMetrics(getPerformanceSnapshot());
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTimeout(refreshMetrics, 0);
            // Auto-refresh every 2 seconds
            const interval = setInterval(refreshMetrics, 2000);
            return () => clearInterval(interval);
        }
    }, [isOpen, refreshMetrics]);

    if (!isOpen || !metrics) return null;

    const getScoreColor = (val: number, good: number, bad: number) => {
        if (val <= good) return 'text-green-400';
        if (val <= bad) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-gradient-to-r from-emerald-900/20 to-teal-900/20">
                    <div className="flex items-center gap-3">
                        <div className="text-2xl">⚡</div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Performance Dashboard</h3>
                            <p className="text-xs text-slate-400">Monitor de recursos y memoria</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={refreshMetrics}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                            title="Actualizar"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                            title="Cerrar"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Memory */}
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                            <h4 className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                                <Database className="w-4 h-4" /> Memoria JS (Heap)
                            </h4>
                            {metrics.memory ? (
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-white">{metrics.memory.usedJSHeapSize}</span>
                                        <span className="text-sm text-slate-500">MB usados</span>
                                    </div>
                                    <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="bg-purple-500 h-full transition-all duration-500"
                                            style={{ width: `${(metrics.memory.usedJSHeapSize / metrics.memory.totalJSHeapSize) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Total: {metrics.memory.totalJSHeapSize} MB (Límite: {metrics.memory.jsHeapSizeLimit} MB)
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 italic">No disponible en este navegador</p>
                            )}
                        </div>

                        {/* Load Time */}
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                            <h4 className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                                <Activity className="w-4 h-4" /> Carga Inicial (Load)
                            </h4>
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-2xl font-bold ${getScoreColor(metrics.navigation.windowLoad, 1000, 2500)}`}>
                                        {metrics.navigation.windowLoad}
                                    </span>
                                    <span className="text-sm text-slate-500">ms</span>
                                </div>
                                <div className="flex justify-between text-xs mt-3">
                                    <div className="text-center">
                                        <span className="block text-slate-500">TTFB</span>
                                        <span className={`font-bold ${getScoreColor(metrics.navigation.ttfb, 200, 600)}`}>
                                            {metrics.navigation.ttfb}ms
                                        </span>
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-slate-500">DOM</span>
                                        <span className={`font-bold ${getScoreColor(metrics.navigation.domLoad, 800, 2000)}`}>
                                            {metrics.navigation.domLoad}ms
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Assets Count */}
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                            <h4 className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                                <Monitor className="w-4 h-4" /> Recursos Lentos
                            </h4>
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-white">
                                        {metrics.resources.filter(r => r.duration > 100).length}
                                    </span>
                                    <span className="text-sm text-slate-500">requests {'>'} 100ms</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Top 20 recursos más pesados analizados
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Slowest Resources Table */}
                    <div className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                            <h4 className="font-bold text-white text-sm">Recursos más lentos (Top 10)</h4>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-900/50">
                                    <tr>
                                        <th className="px-4 py-3">Nombre</th>
                                        <th className="px-4 py-3">Tipo</th>
                                        <th className="px-4 py-3 text-right">Tamaño</th>
                                        <th className="px-4 py-3 text-right">Duración</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {metrics.resources.slice(0, 10).map((resource, idx) => (
                                        <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="px-4 py-2 font-mono text-xs text-slate-300 truncate max-w-[200px]" title={resource.name}>
                                                {resource.name}
                                            </td>
                                            <td className="px-4 py-2 text-slate-500 text-xs">
                                                {resource.type}
                                            </td>
                                            <td className="px-4 py-2 text-right text-slate-400 font-mono text-xs">
                                                {resource.size ? `${resource.size} KB` : '-'}
                                            </td>
                                            <td className={`px-4 py-2 text-right font-mono text-xs font-bold ${getScoreColor(resource.duration, 100, 500)}`}>
                                                {resource.duration}ms
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerformanceDashboard;
