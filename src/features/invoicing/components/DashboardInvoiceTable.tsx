
import React from 'react';
import { InvoiceDTO } from '../../../types/invoicing';
import { formatCurrency } from '../../../utils/formatters';
import { FileText, Download, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Props {
    invoices: InvoiceDTO[];
}

export const DashboardInvoiceTable: React.FC<Props> = ({ invoices }) => {

    // Helper for status badges
    const getStatusBadge = (status: InvoiceDTO['status']) => {
        switch (status) {
            case 'paid':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle className="w-3 h-3" /> Pagada</span>;
            case 'issued':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"><Clock className="w-3 h-3" /> Emitida</span>;
            case 'draft':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"><FileText className="w-3 h-3" /> Borrador</span>;
            case 'cancelled':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400"><XCircle className="w-3 h-3" /> Cancelada</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">Desconocido</span>;
        }
    };

    // Helper for date formatting
    const formatDate = (timestamp: { _seconds: number }) => {
        if (!timestamp) return '-';
        return new Date(timestamp._seconds * 1000).toLocaleDateString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    if (invoices.length === 0) {
        return (
            <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                    <FileText className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No hay facturas</h3>
                <p className="text-sm">No se han encontrado facturas en este periodo.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                    <tr>
                        <th className="px-6 py-4">Factura</th>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4">Fecha Emisión</th>
                        <th className="px-6 py-4 text-right">Importe</th>
                        <th className="px-6 py-4 text-center">Estado</th>
                        <th className="px-6 py-4 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white font-mono">
                                {inv.fullNumber}
                            </td>
                            <td className="px-6 py-4">
                                <div className="font-medium text-slate-900 dark:text-white">{inv.customerSnapshot?.fiscalName}</div>
                                <div className="text-xs text-slate-500">{inv.customerSnapshot?.cif}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                                {formatDate(inv.issueDate)}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white font-mono">
                                {formatCurrency(inv.total)}
                            </td>
                            <td className="px-6 py-4 text-center">
                                {getStatusBadge(inv.status)}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <button
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title="Descargar PDF"
                                    aria-label={`Descargar factura ${inv.fullNumber}`}
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
