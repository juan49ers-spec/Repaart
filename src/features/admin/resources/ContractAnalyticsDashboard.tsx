import React from 'react';
import { 
    BarChart3, 
    FileText, 
    Clock, 
    Sparkles,
    Download,
    TrendingUp,
    Calendar,
    Wifi,
    WifiOff,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { useContractAnalytics } from '../../../hooks/useContractAnalytics';

export const ContractAnalyticsDashboard: React.FC = () => {
    const { 
        metrics, 
        getCurrentMonthStats, 
        getTopSnippets,
        isLoading,
        isOnline,
        syncWithFirebase
    } = useContractAnalytics();

    const stats = getCurrentMonthStats();
    const topSnippets = getTopSnippets(5);

    // Formatear tiempo (segundos -> HH:MM:SS)
    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m ${secs}s`;
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <span className="ml-3 text-slate-500">Cargando métricas...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 rounded-2xl">
                        <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Analytics</h3>
                        <p className="text-xs text-slate-500">Métricas de uso del Smart Contract Orchestrator</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {isOnline ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-medium">
                            <Wifi className="w-3.5 h-3.5" />
                            <span>Online</span>
                        </div>
                    ) : (
                        <button
                            onClick={syncWithFirebase}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                        >
                            <WifiOff className="w-3.5 h-3.5" />
                            <span>Offline</span>
                            <RefreshCw className="w-3 h-3 ml-1" />
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs text-slate-500 uppercase font-bold">Este mes</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {stats.contracts}
                    </div>
                    <p className="text-xs text-slate-400">contratos generados</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs text-slate-500 uppercase font-bold">Total</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {stats.totalContracts}
                    </div>
                    <p className="text-xs text-slate-400">contratos totales</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span className="text-xs text-slate-500 uppercase font-bold">Tiempo promedio</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {formatTime(stats.avgTime)}
                    </div>
                    <p className="text-xs text-slate-400">por contrato</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span className="text-xs text-slate-500 uppercase font-bold">IA Aceptada</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {stats.aiAcceptanceRate}%
                    </div>
                    <p className="text-xs text-slate-400">de sugerencias</p>
                </div>
            </div>

            {topSnippets.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Cláusulas más usadas
                    </h4>
                    
                    <div className="space-y-2">
                        {topSnippets.map(([snippetId, count]) => (
                            <div 
                                key={snippetId}
                                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                            >
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {snippetId}
                                </span>
                                <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full font-bold">
                                    {count} usos
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {Object.keys(metrics.exportsByFormat).length > 0 && (
                <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Exportaciones por formato
                    </h4>
                    
                    <div className="grid grid-cols-3 gap-3">
                        {Object.entries(metrics.exportsByFormat).map(([format, count]) => (
                            <div 
                                key={format}
                                className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center"
                            >
                                <div className="text-lg font-bold text-slate-900 dark:text-white uppercase">
                                    {format}
                                </div>
                                <div className="text-xs text-slate-500">{count} exports</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!isOnline && (
                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <div className="flex items-start gap-3">
                        <WifiOff className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                                Modo sin conexión
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                                Las métricas se guardan localmente y se sincronizarán cuando vuelvas a estar online.
                            </p>
                            <button
                                onClick={syncWithFirebase}
                                className="mt-3 px-4 py-2 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors flex items-center gap-2"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Sincronizar ahora
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractAnalyticsDashboard;