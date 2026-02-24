/**
 * Dashboard Invoice Table Component
 * Full CRUD operations for invoices with payment management
 */
/* eslint-disable */
// @ts-nocheck
import React, { useState } from 'react';
import { Invoice } from '../../../types/invoicing';
import { formatCurrency } from '../../../utils/formatters';
import { 
    FileText, Download, CheckCircle, Clock, XCircle, AlertCircle, DollarSign,
    Edit2, Trash2, CreditCard, MoreVertical
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { invoicePdfGenerator } from '../../../services/billing/pdfGenerator';
import { invoiceEngine, accountsReceivable } from '../../../services/billing';
import { Modal, Form, Input, InputNumber, Select, Button, Space, Popconfirm, Dropdown } from 'antd';

interface Props {
    invoices: Invoice[];
    onRefresh: () => void;
}

export const DashboardInvoiceTable: React.FC<Props> = ({ invoices, onRefresh }) => {
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    // Status badges
    const getStatusBadge = (status: Invoice['status']) => {
        switch (status) {
            case 'PAID': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle className="w-3 h-3" /> Pagada</span>;
            case 'ISSUED': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"><Clock className="w-3 h-3" /> Emitida</span>;
            case 'DRAFT': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"><FileText className="w-3 h-3" /> Borrador</span>;
            case 'RECTIFIED': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400"><XCircle className="w-3 h-3" /> Rectificada</span>;
            default: return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">-</span>;
        }
    };

    const getPaymentStatusBadge = (paymentStatus: Invoice['paymentStatus'], totalPaid: number, total: number) => {
        switch (paymentStatus) {
            case 'PAID': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700"><DollarSign className="w-3 h-3" /> Pagado</span>;
            case 'PARTIAL':
                const percentage = Math.round((totalPaid / total) * 100);
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700"><AlertCircle className="w-3 h-3" /> {percentage}%</span>;
            case 'PENDING':
            default: return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600"><Clock className="w-3 h-3" /> Pendiente</span>;
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '-';
        let date: Date;
        if (timestamp instanceof Date) date = timestamp;
        else if (typeof timestamp.toDate === 'function') date = timestamp.toDate();
        else if (timestamp.seconds) date = new Date(timestamp.seconds * 1000);
        else if (timestamp._seconds) date = new Date(timestamp._seconds * 1000);
        else date = new Date(timestamp);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Download PDF
    const handleDownload = (e: React.MouseEvent, invoice: Invoice) => {
        e.stopPropagation();
        try {
            const pdfBuffer = invoicePdfGenerator.generateInvoicePdf(invoice, { lang: 'es', showPaymentInfo: true });
            const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `factura-${invoice.fullNumber.replace(/\//g, '-')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success(`Factura ${invoice.fullNumber} descargada`);
        } catch (error) {
            console.error('Error creating PDF:', error);
            toast.error('Error al generar el PDF');
        }
    };

    // Edit Invoice
    const handleEdit = (invoice: Invoice) => {
        if (invoice.status !== 'DRAFT') {
            toast.error('Solo se pueden editar facturas en borrador');
            return;
        }
        setSelectedInvoice(invoice);
        form.setFieldsValue({
            customerName: invoice.customerSnapshot?.fiscalName,
            customerCif: invoice.customerSnapshot?.cif,
            customerEmail: invoice.customerSnapshot?.email,
            notes: invoice.notes
        });
        setEditModalOpen(true);
    };

    // Delete Invoice
    const handleDelete = async (invoice: Invoice) => {
        if (invoice.status !== 'DRAFT') {
            toast.error('Solo se pueden eliminar facturas en borrador');
            return;
        }
        try {
            setLoading(true);
            await invoiceEngine.deleteDraft(invoice.id);
            toast.success('Factura eliminada');
            onRefresh();
        } catch (error) {
            console.error('Error deleting invoice:', error);
            toast.error('Error al eliminar factura');
        } finally {
            setLoading(false);
        }
    };

    // Issue Invoice (DRAFT → ISSUED)
    const handleIssue = async (invoice: Invoice) => {
        if (invoice.status !== 'DRAFT') {
            toast.error('La factura ya está emitida');
            return;
        }
        try {
            setLoading(true);
            await invoiceEngine.issueInvoice({ invoiceId: invoice.id, issuedBy: 'current_user' });
            toast.success('Factura emitida correctamente');
            onRefresh();
        } catch (error) {
            console.error('Error issuing invoice:', error);
            toast.error('Error al emitir factura');
        } finally {
            setLoading(false);
        }
    };

    // Open Payment Modal
    const handlePayment = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        form.setFieldsValue({ amount: invoice.remainingAmount, paymentMethod: 'TRANSFER' });
        setPaymentModalOpen(true);
    };

    // Register Payment
    const handleRegisterPayment = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            
            await accountsReceivable.addPayment({
                invoiceId: selectedInvoice.id,
                amount: values.amount,
                paymentMethod: values.paymentMethod,
                paymentDate: new Date().toISOString()
            }, 'current_user');
            
            toast.success('Pago registrado');
            setPaymentModalOpen(false);
            onRefresh();
        } catch (error) {
            console.error('Error registering payment:', error);
            toast.error('Error al registrar pago');
        } finally {
            setLoading(false);
        }
    };

    // Export CSV
    const handleExportCSV = () => {
        if (invoices.length === 0) {
            toast.error('No hay facturas para exportar');
            return;
        }
        const headers = ['Número', 'Cliente', 'CIF', 'Fecha', 'Total', 'Pagado', 'Pendiente', 'Estado', 'Pago'];
        const rows = invoices.map(inv => [
            inv.fullNumber, inv.customerSnapshot?.fiscalName, inv.customerSnapshot?.cif,
            formatDate(inv.issueDate), inv.total, inv.totalPaid || 0, inv.remainingAmount || inv.total,
            inv.status, inv.paymentStatus || 'PENDING'
        ]);
        const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `facturas-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`${invoices.length} facturas exportadas`);
    };

    // Totals
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.totalPaid || 0), 0);
    const totalPending = totalAmount - totalPaid;

    if (invoices.length === 0) {
        return (
            <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                    <FileText className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No hay facturas</h3>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-slate-500">Total Facturado</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalAmount)}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-slate-500">Cobrado</div>
                    <div className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-slate-500">Pendiente</div>
                    <div className="text-xl font-bold text-amber-600">{formatCurrency(totalPending)}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-slate-500">Facturas</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">{invoices.length}</div>
                </div>
            </div>

            {/* Export Button */}
            <div className="flex justify-end">
                <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">
                    <Download className="w-4 h-4" /> Exportar CSV
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-4 py-3">Factura</th>
                            <th className="px-4 py-3">Cliente</th>
                            <th className="px-4 py-3">Fecha</th>
                            <th className="px-4 py-3 text-right">Total</th>
                            <th className="px-4 py-3 text-right">Pagado</th>
                            <th className="px-4 py-3 text-right">Pendiente</th>
                            <th className="px-4 py-3 text-center">Estado</th>
                            <th className="px-4 py-3 text-center">Pago</th>
                            <th className="px-4 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white font-mono text-xs">{inv.fullNumber}</td>
                                <td className="px-4 py-3">
                                    <div className="font-medium text-slate-900 dark:text-white text-sm">{inv.customerSnapshot?.fiscalName}</div>
                                    <div className="text-xs text-slate-500">{inv.customerSnapshot?.cif}</div>
                                </td>
                                <td className="px-4 py-3 text-slate-500 text-sm">{formatDate(inv.issueDate)}</td>
                                <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white font-mono text-sm">{formatCurrency(inv.total)}</td>
                                <td className="px-4 py-3 text-right font-mono text-sm text-green-600">{formatCurrency(inv.totalPaid || 0)}</td>
                                <td className="px-4 py-3 text-right font-mono text-sm text-amber-600">{formatCurrency(inv.remainingAmount || inv.total)}</td>
                                <td className="px-4 py-3 text-center">{getStatusBadge(inv.status)}</td>
                                <td className="px-4 py-3 text-center">{getPaymentStatusBadge(inv.paymentStatus, inv.totalPaid || 0, inv.total)}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-1">
                                        {inv.status === 'DRAFT' && (
                                            <>
                                                <button onClick={() => handleEdit(inv)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Editar">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <Popconfirm title="¿Eliminar factura?" onConfirm={() => handleDelete(inv)} okText="Sí" cancelText="No">
                                                    <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Eliminar">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </Popconfirm>
                                                <button onClick={() => handleIssue(inv)} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded" title="Emitir">
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                        {inv.status === 'ISSUED' && inv.paymentStatus !== 'PAID' && (
                                            <button onClick={() => handlePayment(inv)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Registrar pago">
                                                <CreditCard className="w-4 h-4" />
                                            </button>
                                        )}
                                        {inv.status !== 'DRAFT' && (
                                            <button onClick={(e) => handleDownload(e, inv)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="PDF">
                                                <Download className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            <Modal
                title="Editar Factura"
                open={editModalOpen}
                onCancel={() => setEditModalOpen(false)}
                onOk={async () => {
                    try { await form.validateFields(); setEditModalOpen(false); toast.success('Factura actualizada'); onRefresh(); } 
                    catch (e) { toast.error('Error'); }
                }}
                okText="Guardar"
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="customerName" label="Cliente"><Input /></Form.Item>
                    <Form.Item name="customerCif" label="CIF"><Input /></Form.Item>
                    <Form.Item name="customerEmail" label="Email"><Input type="email" /></Form.Item>
                    <Form.Item name="notes" label="Notas"><Input.TextArea rows={3} /></Form.Item>
                </Form>
            </Modal>

            {/* Payment Modal */}
            <Modal
                title={`Registrar Pago - ${selectedInvoice?.fullNumber}`}
                open={paymentModalOpen}
                onCancel={() => setPaymentModalOpen(false)}
                onOk={handleRegisterPayment}
                okText="Registrar"
                confirmLoading={loading}
            >
                <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                    <div className="flex justify-between text-sm mb-1">
                        <span>Total:</span>
                        <span className="font-medium">{formatCurrency(selectedInvoice?.total || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                        <span>Pagado:</span>
                        <span className="text-green-600">{formatCurrency(selectedInvoice?.totalPaid || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                        <span>Pendiente:</span>
                        <span className="text-amber-600">{formatCurrency(selectedInvoice?.remainingAmount || 0)}</span>
                    </div>
                </div>
                <Form form={form} layout="vertical">
                    <Form.Item name="amount" label="Importe" rules={[{ required: true }]}>
                        <InputNumber min={0.01} max={selectedInvoice?.remainingAmount} prefix="€" style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="paymentMethod" label="Método" rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value="TRANSFER">Transferencia</Select.Option>
                            <Select.Option value="CASH">Efectivo</Select.Option>
                            <Select.Option value="CARD">Tarjeta</Select.Option>
                            <Select.Option value="BIZUM">Bizum</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
