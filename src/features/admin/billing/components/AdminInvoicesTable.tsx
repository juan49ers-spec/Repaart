import React from 'react';
import { AdminInvoice } from '../../../../types/billing';
import {
    FileText, AlertCircle, Clock, CheckCircle2, XCircle, Ban, Copy, Trash2,
    Search, Download
} from 'lucide-react';
import { TabFilter } from '../types';

interface AdminInvoicesTableProps {
    invoices: AdminInvoice[];
    filteredInvoices: AdminInvoice[];
    loading: boolean;
    error: string | null;
    activeTab: TabFilter;
    setActiveTab: (tab: TabFilter) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    tabCounts: Record<TabFilter, number>;
    actionLoading: string | null;
    onSelectInvoice: (inv: AdminInvoice) => void;
    onQuickDuplicate: (e: React.MouseEvent, inv: AdminInvoice) => void;
    onQuickDelete: (e: React.MouseEvent, inv: AdminInvoice) => void;
    onRepairPermissions: () => void;
    isRepairing: boolean;
    onExportCSV: () => void;
}

const tabs: { key: TabFilter; label: string; color: string }[] = [
    { key: 'all', label: 'Todas', color: 'text-slate-600 dark:text-slate-300' },
    { key: 'draft', label: 'Borradores', color: 'text-slate-600 dark:text-slate-300' },
    { key: 'issued', label: 'Emitidas', color: 'text-blue-600 dark:text-blue-400' },
    { key: 'paid', label: 'Pagadas', color: 'text-emerald-600 dark:text-emerald-400' },
    { key: 'overdue', label: 'Vencidas', color: 'text-rose-600 dark:text-rose-400' },
    { key: 'void', label: 'Anuladas', color: 'text-slate-500 dark:text-slate-500' },
];

const isOverdue = (inv: AdminInvoice): boolean => {
    if (!inv.dueDate || inv.paymentStatus === 'paid') return false;
    const dueDate = new Date(inv.dueDate.seconds * 1000);
    return new Date().getTime() - dueDate.getTime() > 0;
};

const fmt = (v: number) => v.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

export const AdminInvoicesTable: React.FC<AdminInvoicesTableProps> = ({
    filteredInvoices, loading, error, activeTab, setActiveTab, searchTerm, setSearchTerm,
    tabCounts, actionLoading, onSelectInvoice, onQuickDuplicate, onQuickDelete,
    onRepairPermissions, isRepairing, onExportCSV
}) => {
    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                            activeTab === tab.key
                                ? 'bg-slate-900 dark:bg-slate-800 text-white'
                                : `${tab.color} hover:bg-slate-100 dark:hover:bg-slate-800/50`
                        }`}
                    >
                        {tab.label}
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                            activeTab === tab.key
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                            {tabCounts[tab.key]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Search + Export */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">Registro de Facturas</h3>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar facturas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 dark:focus:ring-slate-100 dark:focus:border-slate-100 transition-colors"
                        />
                    </div>
                    <button
                        onClick={onExportCSV}
                        disabled={filteredInvoices.length === 0}
                        title="Exportar facturas filtradas a CSV"
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
                    >
                        <Download className="w-4 h-4" />
                        CSV
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-9 gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Factura</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">F. Emisión</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vencimiento</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Base</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">IVA</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</div>
                </div>

                {/* Body */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-slate-800 dark:border-t-slate-200 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-sm font-medium text-slate-500">Cargando registros...</p>
                        </div>
                    ) : error ? (
                        <div className="p-12 text-center">
                            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white mb-4">Error de permisos</p>
                            <button
                                onClick={onRepairPermissions}
                                disabled={isRepairing}
                                className="px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                {isRepairing ? 'Reparando...' : 'Reparar Permisos'}
                            </button>
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="p-16 text-center text-slate-500">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 opacity-40" />
                            </div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">No hay facturas</p>
                            <p className="text-xs text-slate-500">Crea una nueva factura o ajusta los filtros de búsqueda.</p>
                        </div>
                    ) : (
                        filteredInvoices.map((inv) => (
                            <div
                                key={inv.id}
                                onClick={() => onSelectInvoice(inv)}
                                className="group grid grid-cols-9 gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors items-center"
                            >
                                {/* Factura & Franquicia */}
                                <div className="col-span-2 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                        <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                            {inv.franchiseName}
                                        </p>
                                        <p className="text-xs font-mono text-slate-500 truncate mt-0.5">
                                            {inv.invoiceNumber || 'BORRADOR'}
                                        </p>
                                    </div>
                                </div>

                                {/* Fecha Emisión */}
                                <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {inv.issueDate
                                            ? new Date(inv.issueDate.seconds * 1000).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                                            : '-'}
                                    </p>
                                </div>

                                {/* Vencimiento */}
                                <div>
                                    <p className={`text-sm font-medium ${
                                        isOverdue(inv) ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
                                    }`}>
                                        {inv.dueDate
                                            ? new Date(inv.dueDate.seconds * 1000).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                                            : '-'}
                                    </p>
                                </div>

                                {/* Estado */}
                                <div>
                                    {inv.documentStatus === 'draft' ? (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            Borrador
                                        </span>
                                    ) : inv.documentStatus === 'issued' ? (
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                            inv.paymentStatus === 'paid'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : inv.paymentStatus === 'overdue'
                                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                        }`}>
                                            {inv.paymentStatus === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : inv.paymentStatus === 'overdue' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                            {inv.paymentStatus === 'paid' ? 'Pagada' : inv.paymentStatus === 'overdue' ? 'Vencida' : 'Pendiente'}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                            <Ban className="w-3 h-3" />
                                            Anulada
                                        </span>
                                    )}
                                </div>

                                {/* Base */}
                                <div className="text-right">
                                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{fmt(inv.subtotal)}</p>
                                </div>

                                {/* IVA */}
                                <div className="text-right">
                                    <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">{fmt(inv.taxAmount)}</p>
                                </div>

                                {/* Total */}
                                <div className="text-right">
                                    <p className={`text-sm font-bold ${
                                        inv.balanceDue > 0 ? 'text-slate-900 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'
                                    }`}>
                                        {fmt(inv.total)}
                                    </p>
                                    {inv.balanceDue > 0 && inv.balanceDue !== inv.total && (
                                        <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
                                            Faltan {fmt(inv.balanceDue)}
                                        </p>
                                    )}
                                </div>

                                {/* Quick Actions */}
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => onQuickDuplicate(e, inv)}
                                        disabled={actionLoading === inv.id}
                                        title="Duplicar factura"
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    {inv.documentStatus === 'draft' && (
                                        <button
                                            onClick={(e) => onQuickDelete(e, inv)}
                                            disabled={actionLoading === inv.id}
                                            title="Eliminar borrador"
                                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
