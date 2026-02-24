import React, { useState, useMemo } from 'react';
import { formatMoney } from '../../../lib/finance';
import { TrendingUp, TrendingDown, Calendar, Edit3, Eye, Search, X, GitCompare, Trash2, Lock, Shield, CheckCircle, AlertTriangle, FileText, Clock } from 'lucide-react';
import { financeService } from '../../../services/financeService';
import { notificationService } from '../../../services/notificationService';
import FinancialControlCenter from '../FinancialControlCenter';
import { MonthlyRecord, useFranchiseHistory } from '../../../hooks/useFranchiseHistory';
import { formatTimeAgo } from '../../../utils/dateHelpers';
import { useAuth } from '../../../context/AuthContext'; // Added context
import { userService } from '../../../services/userService'; // Import userService
import QuickViewPanel from './QuickViewPanel';
import MonthComparisonModal from './MonthComparisonModal';

interface MonthlyHistoryTableProps {
    franchiseId: string;
    onUpdate?: () => void;
    records?: MonthlyRecord[];
}

const MonthlyHistoryTable: React.FC<MonthlyHistoryTableProps> = ({ franchiseId, onUpdate, records: externalRecords }) => {
    const { records: fetchedRecords, loading: fetching, refresh } = useFranchiseHistory(externalRecords ? undefined : franchiseId);

    const records = externalRecords || fetchedRecords;
    const loading = externalRecords ? false : fetching;

    const [editingMonth, setEditingMonth] = useState<string | null>(null);
    const [quickViewRecord, setQuickViewRecord] = useState<MonthlyRecord | null>(null);
    const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
    const [showComparison, setShowComparison] = useState(false);
    const [deleteConfirmMonth, setDeleteConfirmMonth] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { user } = useAuth();
    // Safe check for admin role
    const isAdmin = (user as any)?.role === 'admin' || (user as any)?.customClaims?.role === 'admin' || (user?.email?.includes('admin'));


    // Filters state
    const [searchTerm, setSearchTerm] = useState('');
    const [yearFilter, setYearFilter] = useState<string>('');

    const handleSaveEdit = async (data: any) => {
        if (!editingMonth) return;
        try {
            console.log("Saving edited month:", editingMonth, data);
            await financeService.updateFinancialData(franchiseId, editingMonth, {
                ...data,
                status: 'approved', // Mantenemos como aprobado en lugar de cerrado
                isLocked: false
            });
            if (refresh) await refresh();
            setEditingMonth(null);
            onUpdate?.();
        } catch (error) {
            console.error("Error saving month:", error);
            alert("Error al guardar los cambios.");
        }
    };

    const handleDeleteRequest = (e: React.MouseEvent, month: string) => {
        e.stopPropagation();
        e.preventDefault();
        console.log('[MonthlyHistoryTable] Delete requested for month:', month, 'franchiseId:', franchiseId);
        setDeleteConfirmMonth(month);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirmMonth) return;
        const month = deleteConfirmMonth;
        setIsDeleting(true);
        try {
            console.log('[MonthlyHistoryTable] Executing delete for:', month, 'franchiseId:', franchiseId);
            await financeService.resetMonthSummary(franchiseId, month);
            console.log('[MonthlyHistoryTable] Delete successful');

            // Only notify if Admin performs the deletion (Audit/Alert for Franchise)
            if (isAdmin) {
                const franchiseUser = await userService.getUserByFranchiseId(franchiseId);
                const targetUid = franchiseUser?.uid || franchiseId;

                await notificationService.notifyFranchise(targetUid, {
                    title: `Cierre Eliminado: ${month}`,
                    message: `El administrador ha eliminado el cierre del mes de ${month}.`,
                    type: 'ALERT',
                    priority: 'high',
                    link: '/dashboard/finance'
                });
            }
            if (refresh) await refresh();
            onUpdate?.();
        } catch (error) {
            console.error('[MonthlyHistoryTable] Error deleting record:', error);
            alert('Error al eliminar el registro.');
        } finally {
            setIsDeleting(false);
            setDeleteConfirmMonth(null);
        }
    };

    // Get unique years from records
    const availableYears = useMemo(() => {
        const years = new Set(records.map(r => r.month.split('-')[0]));
        return Array.from(years).sort().reverse();
    }, [records]);

    // Filtered records with search and filters
    const filteredRecords = useMemo(() => {
        return records.filter(record => {
            const matchesSearch = record.month.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesYear = !yearFilter || record.month.startsWith(yearFilter);
            return matchesSearch && matchesYear;
        });
    }, [records, searchTerm, yearFilter]);

    const handleResetFilters = () => {
        setSearchTerm('');
        setYearFilter('');
    };

    const hasActiveFilters = searchTerm || yearFilter;

    const toggleComparison = (month: string) => {
        setSelectedForComparison(prev => {
            if (prev.includes(month)) {
                return prev.filter(m => m !== month);
            }
            if (prev.length < 2) {
                return [...prev, month];
            }
            // Replace first if already 2 selected
            return [prev[1], month];
        });
    };

    if (loading) {
        return (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full"></div>
                    <div className="h-4 bg-slate-100 rounded w-32"></div>
                </div>
            </div>
        );
    }

    if (!records || records.length === 0) {
        return (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center gap-4">
                <div className="p-4 bg-slate-50 rounded-full text-slate-400">
                    <Calendar className="w-8 h-8" />
                </div>
                <div>
                    <p className="text-slate-800 font-medium text-lg">Sin historial disponible</p>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">
                        Los cierres mensuales que realices aparecerán aquí detallados.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* FILTERS BAR - Compact */}
            <div className="bg-white border border-slate-100 rounded-xl p-2 mb-4 flex flex-wrap gap-2 shadow-sm items-center">
                {/* Search */}
                <div className="flex-1 min-w-[200px] relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar periodo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border-0 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-indigo-100 focus:bg-white transition-all font-medium"
                    />
                </div>

                {/* Year Filter */}
                <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="bg-slate-50 border-0 rounded-lg px-3 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-indigo-100 focus:bg-white transition-all font-bold cursor-pointer hover:bg-slate-100"
                    aria-label="Filtrar por año"
                >
                    <option value="">Todo el histórico</option>
                    {availableYears.map(year => (
                        <option key={year} value={year}>Año {year}</option>
                    ))}
                </select>

                {/* Reset Button */}
                {hasActiveFilters && (
                    <button
                        onClick={handleResetFilters}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all hover:-translate-y-0.5"
                        title="Limpiar filtros"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}

                {/* Results Counter - Now more subtle */}
                <div className="px-3 py-1 text-[10px] text-slate-400 font-medium hidden md:block">
                    <span className="font-mono font-bold text-slate-600">{filteredRecords.length}</span> resultados
                </div>

                {/* Comparison Button - Prominent */}
                {selectedForComparison.length === 2 && (
                    <button
                        className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-indigo-500/20 hover:shadow-md hover:shadow-indigo-500/30 hover:-translate-y-0.5 animate-in fade-in slide-in-from-right-2"
                        onClick={() => setShowComparison(true)}
                    >
                        <GitCompare className="w-3.5 h-3.5" />
                        Comparar
                    </button>
                )}
            </div>

            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Periodo
                                </th>
                                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                    Ingresos
                                </th>
                                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                    Gastos
                                </th>
                                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                    Resultado
                                </th>
                                <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredRecords.map((record) => {
                                const isPositive = record.profit >= 0;
                                const margin = record.revenue > 0 ? (record.profit / record.revenue) * 100 : 0;
                                const isSelected = selectedForComparison.includes(record.month);

                                return (
                                    <tr
                                        key={record.id}
                                        className={`group transition-all duration-200 ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleComparison(record.month)}
                                                        className={`w-4 h-4 rounded border-2 transition-all cursor-pointer ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
                                                        title="Comparar"
                                                    />
                                                </div>

                                                <div className={`p-1.5 rounded-lg transition-colors ${isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-indigo-600 group-hover:shadow-sm'}`}>
                                                    <Calendar className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`font-mono text-sm font-bold tracking-tight transition-colors capitalize ${isSelected ? 'text-indigo-900' : 'text-slate-700 group-hover:text-slate-900'}`}>
                                                        {(() => {
                                                            const [y, m] = record.month.split('-');
                                                            const date = new Date(parseInt(y), parseInt(m) - 1);
                                                            return date.toLocaleDateString('es-ES', { month: 'long', year: '2-digit' }).replace(' de ', '-').replace(' ', '-');
                                                        })()}
                                                    </span>
                                                    {record.updatedAt && (
                                                        <span className="text-[9px] text-slate-400 font-medium">
                                                            {formatTimeAgo(record.updatedAt)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <div className="font-mono text-slate-700 font-medium group-hover:text-indigo-600 transition-colors text-sm tracking-tight">
                                                {formatMoney(record.revenue)}€
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <div className="font-mono text-slate-500 text-sm tracking-tight">
                                                {formatMoney(record.totalExpenses)}€
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <div className="flex flex-col items-end gap-0.5">
                                                <div className={`font-mono font-bold text-sm tracking-tight flex items-center gap-1.5 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {formatMoney(record.profit)}€
                                                    {record.updatedAt && (
                                                        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-normal">
                                                            <Clock className="w-2.5 h-2.5" />
                                                            {formatTimeAgo(record.updatedAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                    {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                                    {margin.toFixed(1)}%
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {(() => {
                                                const status = record.status || (record.isLocked ? 'locked' : 'draft');

                                                const getStatusConfig = (s: string) => {
                                                    switch (s) {
                                                        case 'locked': return {
                                                            label: 'Cerrado',
                                                            icon: <Lock className="w-3 h-3" />,
                                                            className: 'bg-slate-100 text-slate-600 border-slate-200'
                                                        };
                                                        case 'approved': return {
                                                            label: 'Aprobado',
                                                            icon: <CheckCircle className="w-3 h-3" />,
                                                            className: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                                                        };
                                                        case 'draft': return {
                                                            label: 'Borrador',
                                                            icon: <FileText className="w-3 h-3" />,
                                                            className: 'bg-yellow-50 text-yellow-700 border-yellow-200 border-dashed'
                                                        };
                                                        case 'open': return {
                                                            label: 'Abierto',
                                                            icon: <Edit3 className="w-3 h-3" />,
                                                            className: 'bg-indigo-50 text-indigo-600 border-indigo-200'
                                                        };
                                                        case 'unlock_requested': return {
                                                            label: 'Solicitado',
                                                            icon: <Clock className="w-3 h-3 animate-pulse" />,
                                                            className: 'bg-amber-50 text-amber-700 border-amber-200'
                                                        };
                                                        case 'rejected': return {
                                                            label: 'Rechazado',
                                                            icon: <AlertTriangle className="w-3 h-3" />,
                                                            className: 'bg-rose-50 text-rose-700 border-rose-200'
                                                        };
                                                        default: return {
                                                            label: s,
                                                            icon: <Shield className="w-3 h-3" />,
                                                            className: 'bg-slate-50 text-slate-500 border-slate-200'
                                                        };
                                                    }
                                                };

                                                const config = getStatusConfig(status);

                                                return (
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${config.className}`} title={config.label}>
                                                            {config.icon}
                                                            {config.label}
                                                        </span>
                                                        {record.rejectionReason && (
                                                            <span className="flex items-center gap-1 text-[9px] text-rose-500 font-medium bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 max-w-[100px] truncate" title={record.rejectionReason}>
                                                                <X className="w-2.5 h-2.5" />
                                                                Rechazado
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2 opacity-100 transition-all duration-200">

                                                {/* QUICK VIEW */}
                                                <button
                                                    onClick={() => setQuickViewRecord(record)}
                                                    className="p-2 bg-white hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded-lg transition-all shadow-sm"
                                                    title="Ver Detalle Mensual"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>

                                                {/* EDIT */}
                                                <button
                                                    onClick={() => setEditingMonth(record.month)}
                                                    className="p-2 bg-white hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded-lg transition-all shadow-sm"
                                                    title="Editar Datos"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>

                                                {/* DELETE */}
                                                <button
                                                    onClick={(e) => handleDeleteRequest(e, record.month)}
                                                    className="p-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg transition-all shadow-sm group relative z-10"
                                                    title="Eliminar registro"
                                                    type="button"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 group-hover:shake" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Historial Completo</span>
                    <span className="text-[10px] text-slate-500 font-medium">Mostrando {filteredRecords.length} registros</span>
                </div>
            </div>

            {editingMonth && (
                <FinancialControlCenter
                    franchiseId={franchiseId}
                    month={editingMonth}
                    onClose={() => setEditingMonth(null)}
                    onSave={handleSaveEdit}
                />
            )}

            {quickViewRecord && (
                <QuickViewPanel
                    record={quickViewRecord}
                    onClose={() => setQuickViewRecord(null)}
                    onEdit={() => {
                        setEditingMonth(quickViewRecord.month);
                        setQuickViewRecord(null);
                    }}
                    canEdit={true}
                />
            )}

            {showComparison && selectedForComparison.length === 2 && (() => {
                const month1Record = records.find(r => r.month === selectedForComparison[0]);
                const month2Record = records.find(r => r.month === selectedForComparison[1]);

                if (month1Record && month2Record) {
                    return (
                        <MonthComparisonModal
                            month1={month1Record}
                            month2={month2Record}
                            onClose={() => {
                                setShowComparison(false);
                                setSelectedForComparison([]);
                            }}
                        />
                    );
                }
                return null;
            })()}

            {/* DELETE CONFIRMATION MODAL */}
            {deleteConfirmMonth && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={() => setDeleteConfirmMonth(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-rose-100 rounded-xl">
                                <Trash2 className="w-5 h-5 text-rose-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Eliminar Cierre</h3>
                        </div>
                        <p className="text-sm text-slate-600 mb-6">
                            ¿Estás seguro de que deseas eliminar permanentemente el cierre de <strong className="text-slate-900">{deleteConfirmMonth}</strong>? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteConfirmMonth(null)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                                disabled={isDeleting}
                                type="button"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-all shadow-sm disabled:opacity-50"
                                disabled={isDeleting}
                                type="button"
                            >
                                {isDeleting ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
};

export default MonthlyHistoryTable;
