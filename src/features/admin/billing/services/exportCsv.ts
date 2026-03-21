/**
 * Exporta facturas filtradas a CSV con formato compatible Excel ES.
 * BOM UTF-8 + separador punto y coma.
 */
import { AdminInvoice } from '../../../../types/billing';
import toast from 'react-hot-toast';

export const exportInvoicesToCsv = (invoices: AdminInvoice[]): void => {
    const headers = [
        'Nº Factura', 'Franquicia', 'CIF', 'F. Emisión', 'F. Vencimiento',
        'Base', 'IVA', 'Total', 'Estado', 'Pagado', 'Pendiente'
    ];

    const rows = invoices.map(inv => [
        inv.invoiceNumber || 'BORRADOR',
        inv.franchiseName,
        inv.customerSnapshot?.taxId || '',
        inv.issueDate ? new Date(inv.issueDate.seconds * 1000).toLocaleDateString('es-ES') : '',
        inv.dueDate ? new Date(inv.dueDate.seconds * 1000).toLocaleDateString('es-ES') : '',
        inv.subtotal.toFixed(2).replace('.', ','),
        inv.taxAmount.toFixed(2).replace('.', ','),
        inv.total.toFixed(2).replace('.', ','),
        getStatusLabel(inv),
        inv.amountPaid.toFixed(2).replace('.', ','),
        inv.balanceDue.toFixed(2).replace('.', ','),
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `facturas_repaart_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado');
};

const getStatusLabel = (inv: AdminInvoice): string => {
    if (inv.documentStatus === 'void') return 'Anulada';
    if (inv.documentStatus === 'draft') return 'Borrador';
    if (inv.paymentStatus === 'paid') return 'Pagada';
    if (inv.paymentStatus === 'overdue') return 'Vencida';
    return 'Pendiente';
};
