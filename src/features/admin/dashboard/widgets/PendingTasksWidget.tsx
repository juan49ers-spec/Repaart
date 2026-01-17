import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { financeService } from '../../../../services/financeService';
import type { FinancialRecord } from '../../../../types/finance';
import { userService } from '../../../../services/userService';

// Helper for date to string
const dateToString = (date: Date | any): string => {
    if (date instanceof Date) return date.toLocaleDateString();
    return new Date(date).toLocaleDateString();
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
            } catch (err: any) {
                console.error("Error loading pending tasks:", err);
                // Si falla, es probable que sea por el índice
                if (err.code === 'failed-precondition') {
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
        <div className={`bg-emerald-900/10 border border-emerald-500/20 rounded-xl flex items-center justify-between ${compact ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center gap-4">
                <div className={`bg-emerald-500/20 rounded-full flex items-center justify-center ${compact ? 'p-2' : 'p-3'}`}>
                    <CheckCircle2 className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} text-emerald-400`} />
                </div>
                <div>
                    <h3 className={`${compact ? 'text-sm' : 'text-lg'} font-bold text-emerald-900 dark:text-white`}>Todo al día</h3>
                    {!compact && <p className="text-emerald-700/70 dark:text-slate-400 text-sm">No hay transacciones pendientes de revisión.</p>}
                </div>
            </div>
        </div>
    );

    // ESTADO: Hay Trabajo
    return (
        <div className={`bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-500/30 overflow-hidden relative group shadow-sm dark:shadow-none transition-colors ${compact ? 'p-0' : 'p-0'}`}>
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />

            <div className={`${compact ? 'p-4' : 'p-6'}`}>
                <div className={`flex justify-between items-start ${compact ? 'mb-2' : 'mb-4'}`}>
                    <div>
                        <h3 className={`${compact ? 'text-sm' : 'text-lg'} font-bold text-slate-900 dark:text-white flex items-center gap-2 transition-colors`}>
                            <AlertCircle className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600 dark:text-blue-400 fill-blue-500/10`} />
                            Tareas Pendientes
                        </h3>
                        {!compact && (
                            <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors">
                                Tienes <span className="text-blue-600 dark:text-blue-400 font-bold">{pendingRecords.length}</span> transacciones esperando aprobación.
                            </p>
                        )}
                        {compact && (
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-1 transition-colors">
                                <span className="text-blue-600 dark:text-blue-400 font-bold">{pendingRecords.length}</span> pendientes
                            </p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    {pendingRecords.slice(0, limit).map(record => (
                        <div key={record.id} className={`bg-slate-50 dark:bg-slate-900/50 rounded-lg flex justify-between items-center border border-slate-100 dark:border-slate-700/50 transition-colors ${compact ? 'p-2 text-xs' : 'p-3 text-sm'}`}>
                            <div>
                                <div className="text-slate-900 dark:text-white font-medium truncate max-w-[120px] transition-colors">
                                    {franchiseNames[record.franchise_id] || record.franchise_id.slice(0, 8) + '...'}
                                </div>
                                <div className="text-slate-400 dark:text-slate-500 text-[10px] text-left transition-colors">
                                    {dateToString(record.date)}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-black text-emerald-600 dark:text-emerald-400 transition-colors">
                                    {record.amount.toFixed(record.amount < 1000 ? 2 : 0)}€
                                </div>
                                {!compact && (
                                    <button
                                        onClick={() => navigate(`/admin/franchise/${record.franchise_id}`)}
                                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold uppercase tracking-wide mt-1 flex items-center justify-end gap-1 transition-colors"
                                    >
                                        Revisar <ArrowRight className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {pendingRecords.length > limit && (
                        <div className="text-center pt-2">
                            <span className="text-[10px] text-slate-500">
                                + {pendingRecords.length - limit} más...
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PendingTasksWidget;
