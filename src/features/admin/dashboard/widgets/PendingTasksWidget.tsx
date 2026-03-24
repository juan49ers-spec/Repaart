import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { financeService } from '../../../../services/financeService';
import type { FinancialRecord } from '../../../../types/finance';
import { userService } from '../../../../services/userService';

// Helper for date to string
const dateToString = (date: unknown): string => {
    if (date instanceof Date) return date.toLocaleDateString();
    return new Date(date as string | number).toLocaleDateString();
};

interface PendingTasksWidgetProps {
    limit?: number;
    compact?: boolean;
}

const PendingTasksWidget: React.FC<PendingTasksWidgetProps> = ({ limit = 3, compact = false }) => {
    const navigate = useNavigate();
    const [pendingRecords, setPendingRecords] = useState<FinancialRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [franchiseNames, setFranchiseNames] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Cargar tareas pendientes
                const records = await financeService.getGlobalPendingRecords();
                setPendingRecords(records);

                // 2. Si hay tareas, cargar nombres de franquicias para no mostrar IDs feos
                if (records.length > 0) {
                    const franchises = await userService.fetchFranchises();
                    const namesMap: Record<string, string> = {};
                    franchises.forEach(f => {
                        namesMap[f.id] = f.name || 'Franquicia Desconocida';
                    });
                    setFranchiseNames(namesMap);
                }
            } catch (err: unknown) {
                console.error("Error loading pending tasks:", err);
                // Si falla, es probable que sea por el índice
                if ((err as { code?: string }).code === 'failed-precondition') {
                    setError("Falta Índice en Firestore");
                } else {
                    setError("Error cargando tareas");
                }
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) return (
        <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse flex items-center justify-center ${compact ? 'p-4 h-[100px]' : 'p-6 h-[200px]'}`}>
            <Loader2 className="w-6 h-6 text-slate-400 dark:text-slate-500 animate-spin" />
        </div>
    );

    if (error) return (
        <div className="bg-rose-900/20 border border-rose-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 text-rose-400 font-bold mb-2">
                <AlertCircle className="w-5 h-5" />
                Error de Configuración
            </div>
            <p className="text-sm text-rose-300/80">{error}. Verifica la consola y crea el índice compuesto.</p>
        </div>
    );

    // ESTADO: Todo Limpio
    if (pendingRecords.length === 0) return (
        <div className={`bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-xl flex items-center justify-between ${compact ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center gap-4">
                <div className={`bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center ${compact ? 'p-2' : 'p-3'}`}>
                    <CheckCircle2 className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} text-emerald-600 dark:text-emerald-400`} />
                </div>
                <div>
                    <h3 className={`${compact ? 'text-sm' : 'text-lg'} font-bold text-emerald-900 dark:text-emerald-300`}>Todo al día</h3>
                    {!compact && <p className="text-emerald-700/70 dark:text-emerald-400/60 text-sm font-mono mt-0.5">No hay transacciones pendientes de revisión.</p>}
                </div>
            </div>
        </div>
    );

    // ESTADO: Hay Trabajo
    return (
        <div className={`bg-white dark:bg-[#0B0E14] rounded-xl border border-blue-200 dark:border-white/5 overflow-hidden relative group/card shadow-sm dark:shadow-none transition-all hover:border-blue-300 dark:hover:border-blue-500/30 ${compact ? 'p-0' : 'p-0'}`}>
            {/* Ambient Base Layer */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 dark:opacity-100 pointer-events-none" />

            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 dark:bg-blue-500/50" />

            <div className={`${compact ? 'p-4' : 'p-6'} relative z-10`}>
                <div className={`flex justify-between items-start ${compact ? 'mb-2' : 'mb-4'}`}>
                    <div>
                        <h3 className={`${compact ? 'text-sm' : 'text-lg'} font-bold text-slate-900 dark:text-white flex items-center gap-2 transition-colors`}>
                            <AlertCircle className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600 dark:text-blue-400`} />
                            Tareas Pendientes
                        </h3>
                        {!compact && (
                            <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors mt-1 font-mono">
                                <span className="text-blue-600 dark:text-blue-400 font-bold">{pendingRecords.length}</span> transacciones esperando aprobación
                            </p>
                        )}
                        {compact && (
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-1 transition-colors font-mono">
                                <span className="text-blue-600 dark:text-blue-400 font-bold">{pendingRecords.length}</span> pendientes
                            </p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    {pendingRecords.slice(0, limit).map(record => (
                        <div key={record.id} className={`bg-slate-50 dark:bg-white/5 rounded-lg flex justify-between items-center border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-white/10 dark:hover:border-white/10 transition-all cursor-pointer group/item ${compact ? 'p-2 text-xs' : 'p-3 text-sm'}`}>
                            <div className="min-w-0 flex-1 pr-3">
                                <div className="text-slate-900 dark:text-white font-bold truncate transition-colors font-mono">
                                    {franchiseNames[record.franchiseId] || record.franchiseId.slice(0, 8) + '...'}
                                </div>
                                <div className="text-slate-400 dark:text-slate-500 text-[10px] text-left transition-colors font-mono mt-0.5">
                                    {dateToString(record.date)}
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="flex items-center gap-2 mt-auto">
                                    <button
                                        onClick={() => navigate(`/admin/franchise/${record.franchiseId}`)}
                                        className="text-[10px] text-blue-600 dark:text-white dark:bg-white/5 dark:border dark:border-white/10 dark:px-2 dark:py-1 dark:rounded dark:hover:bg-white/10 hover:text-blue-700 font-bold uppercase tracking-wide flex items-center justify-end gap-1 transition-all"
                                    >
                                        Revisar <ArrowRight className="w-3 h-3 group-hover/item:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {pendingRecords.length > limit && (
                        <div className="text-center pt-2">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                                + {pendingRecords.length - limit} más
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PendingTasksWidget;
