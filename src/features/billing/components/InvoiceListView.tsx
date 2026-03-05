/**
 * Invoice List View Component
 *
 * Displays a searchable, filterable table of invoices
 * with actions for viewing PDF, issuing, and rectifying.
 *
 * Features:
 * - Search and filter functionality
 * - Status badges with colors
 * - Quick actions (view PDF, issue, delete draft)
 * - Export to Excel/CSV
 * - Real-time status updates
 */
import './InvoiceListView.module.css';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Eye,
  Download,
  Trash2,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  MoreVertical,
  Lock,
  LockOpen,
  DollarSign,
  FileSpreadsheet,
  FileJson,
  FileCode,
  FileText,
  Edit,
  X,
  ChevronDown,
  FileBarChart,
} from 'lucide-react';
import {
  Table, Tag, Space, Button, Tooltip, Modal, message, Popconfirm, Select, Col, Input, Row, DatePicker, Dropdown, Divider, Slider, Progress
} from 'antd';
import type { Invoice, InvoiceStatus, PaymentStatus } from '../../../types/invoicing';
import { invoiceEngine, downloadExport, invoicePdfGenerator } from '../../../services/billing';
import { InvoicePreviewModal } from './InvoicePreviewModal';
import { EditInvoiceModal } from './EditInvoiceModal';
import { PaymentModal } from './PaymentModal';
import { RectificationModal } from './RectificationModal';

interface Props {
  franchiseId: string;
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export const InvoiceListView: React.FC<Props> = ({ franchiseId, refreshTrigger, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | 'ALL'>('ALL');
  const [dateRange, setDateRange] = useState<any>(null);
  const [customerFilter, setCustomerFilter] = useState<string | null>(null);
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 0]);
  const [amountFilterActive, setAmountFilterActive] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [rectificationModalOpen, setRectificationModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [issueConfirmModalOpen, setIssueConfirmModalOpen] = useState(false);
  const [invoiceToIssue, setInvoiceToIssue] = useState<Invoice | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [devModeModalOpen, setDevModeModalOpen] = useState(false);
  const [deleteReasonModalOpen, setDeleteReasonModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [quickFilter, setQuickFilter] = useState<'all' | 'draft' | 'issued' | 'unpaid'>('all');

  // Fetch invoices - Wrapped in useCallback to prevent re-renders
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const result = await invoiceEngine.getInvoicesByFranchise(franchiseId);
      if (result.success && result.data) {
        setInvoices(result.data);
      } else {
        console.error('[InvoiceListView] Error fetching invoices');
      }
    } catch (error) {
      console.error('[InvoiceListView] Exception fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  }, [franchiseId]);

  // Initial load
  useEffect(() => {
    fetchInvoices();
  }, [franchiseId, refreshTrigger]);

  // Unique customers list for the filter dropdown
  const uniqueCustomers = useMemo(() => {
    const map = new Map<string, string>();
    invoices.forEach(inv => {
      if (inv.customerSnapshot?.fiscalName) {
        map.set(inv.customerSnapshot.fiscalName, inv.customerSnapshot.cif || '');
      }
    });
    return Array.from(map.entries()).map(([name, cif]) => ({ name, cif }));
  }, [invoices]);

  // Max amount for slider
  const maxAmount = useMemo(() => {
    if (invoices.length === 0) return 10000;
    return Math.ceil(Math.max(...invoices.map(inv => inv.total)) / 100) * 100;
  }, [invoices]);

  // Initialize amount range when invoices load
  useEffect(() => {
    if (invoices.length > 0 && !amountFilterActive) {
      setAmountRange([0, maxAmount]);
    }
  }, [invoices, maxAmount, amountFilterActive]);

  // Count active filters for the badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchText) count++;
    if (statusFilter !== 'ALL') count++;
    if (paymentStatusFilter !== 'ALL') count++;
    if (customerFilter) count++;
    if (amountFilterActive) count++;
    if (dateRange && dateRange[0] && dateRange[1]) count++;
    return count;
  }, [searchText, statusFilter, paymentStatusFilter, customerFilter, amountFilterActive, dateRange]);

  // Apply all filters
  useEffect(() => {
    let filtered = [...invoices];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(inv =>
        inv.fullNumber.toLowerCase().includes(search) ||
        inv.customerSnapshot.fiscalName.toLowerCase().includes(search) ||
        inv.customerSnapshot.cif?.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }

    if (paymentStatusFilter !== 'ALL') {
      filtered = filtered.filter(inv => inv.paymentStatus === paymentStatusFilter);
    }

    if (customerFilter) {
      filtered = filtered.filter(inv =>
        inv.customerSnapshot.fiscalName === customerFilter
      );
    }

    if (amountFilterActive) {
      filtered = filtered.filter(inv =>
        inv.total >= amountRange[0] && inv.total <= amountRange[1]
      );
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf('day').toDate();
      const end = dateRange[1].endOf('day').toDate();
      filtered = filtered.filter(inv => {
        const issueDate = inv.issueDate instanceof Date
          ? inv.issueDate
          : new Date((inv.issueDate as any).seconds * 1000);
        return issueDate >= start && issueDate <= end;
      });
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchText, statusFilter, paymentStatusFilter, customerFilter, amountFilterActive, amountRange, dateRange]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchText('');
    setStatusFilter('ALL');
    setPaymentStatusFilter('ALL');
    setCustomerFilter(null);
    setAmountFilterActive(false);
    setAmountRange([0, maxAmount]);
    setDateRange(null);
    setQuickFilter('all');
  };

  // Bulk export (CSV/Excel)
  const handleBulkExport = (format: 'csv' | 'excel') => {
    const dataToExport = filteredInvoices;
    if (dataToExport.length === 0) {
      message.warning('No hay facturas para exportar con los filtros actuales');
      return;
    }

    const separator = format === 'excel' ? ';' : ',';
    const headers = ['Número', 'Serie', 'Cliente', 'CIF', 'Fecha Emisión', 'Fecha Vencimiento', 'Estado', 'Estado Pago', 'Base Imponible', 'IVA', 'Total', 'Cobrado', 'Pendiente'];
    const rows = dataToExport.map(inv => {
      const issueDate = inv.issueDate instanceof Date
        ? inv.issueDate
        : new Date((inv.issueDate as any).seconds * 1000);
      const dueDate = inv.dueDate instanceof Date
        ? inv.dueDate
        : new Date((inv.dueDate as any).seconds * 1000);
      return [
        inv.fullNumber,
        inv.series,
        `"${inv.customerSnapshot.fiscalName}"`,
        inv.customerSnapshot.cif || '',
        issueDate.toLocaleDateString('es-ES'),
        dueDate.toLocaleDateString('es-ES'),
        inv.status,
        inv.paymentStatus,
        inv.subtotal?.toFixed(2) || '0.00',
        ((inv.total || 0) - (inv.subtotal || 0)).toFixed(2),
        inv.total.toFixed(2),
        inv.totalPaid.toFixed(2),
        inv.remainingAmount.toFixed(2)
      ].join(separator);
    });

    const bom = '\uFEFF';
    const content = bom + headers.join(separator) + '\n' + rows.join('\n');
    const ext = format === 'excel' ? 'xlsx.csv' : 'csv';
    const mimeType = 'text/csv;charset=utf-8';

    // Smart filename
    const filterParts: string[] = ['facturas_repaart'];
    const now = new Date();
    if (dateRange && dateRange[0] && dateRange[1]) {
      filterParts.push(`${dateRange[0].format('DDMMYY')}-${dateRange[1].format('DDMMYY')}`);
    } else {
      filterParts.push(now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(' ', ''));
    }
    if (statusFilter !== 'ALL') filterParts.push(statusFilter.toLowerCase());
    if (customerFilter) filterParts.push(customerFilter.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20));
    const filename = `${filterParts.join('_')}.${ext}`;

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    message.success(`${dataToExport.length} facturas exportadas a ${format.toUpperCase()}`);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        // Only refresh if no major modals are open
        if (!paymentModalOpen && !rectificationModalOpen && !devModeModalOpen && !deleteReasonModalOpen && !issueConfirmModalOpen) {
          fetchInvoices();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fetchInvoices, paymentModalOpen, rectificationModalOpen, devModeModalOpen, deleteReasonModalOpen, issueConfirmModalOpen]);

  // Apply filters
  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) return;

    const selectedInvoices = invoices.filter(inv => selectedRowKeys.includes(inv.id));
    const draftInvoices = selectedInvoices.filter(inv => inv.status === 'DRAFT');

    if (draftInvoices.length === 0) {
      message.warning('Solo puedes eliminar facturas en estado BORRADOR');
      return;
    }

    if (draftInvoices.length !== selectedInvoices.length) {
      message.warning(`Solo ${draftInvoices.length} de ${selectedInvoices.length} facturas seleccionadas son borradores`);
    }

    Modal.confirm({
      title: `🗑️ Eliminar ${draftInvoices.length} facturas borrador`,
      content: `¿Estás seguro de eliminar ${draftInvoices.length} facturas borrador? Esta acción no se puede deshacer.`,
      okText: 'Sí, eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          let successCount = 0;
          let errorCount = 0;

          for (const invoice of draftInvoices) {
            const result = await invoiceEngine.deleteDraft(invoice.id);
            if (result.success) successCount++;
            else errorCount++;
          }

          if (successCount > 0) {
            message.success(`✅ ${successCount} facturas eliminadas`);
            setSelectedRowKeys([]);
            await fetchInvoices();
          }
          if (errorCount > 0) {
            message.error(`${errorCount} facturas no pudieron eliminarse`);
          }
        } catch (error: any) {
          message.error(`Error al eliminar: ${error.message}`);
        }
      }
    });
  };

  const handleBulkIssue = async () => {
    if (selectedRowKeys.length === 0) return;

    const selectedInvoices = invoices.filter(inv => selectedRowKeys.includes(inv.id));
    const draftInvoices = selectedInvoices.filter(inv => inv.status === 'DRAFT');

    if (draftInvoices.length === 0) {
      message.warning('Solo puedes emitir facturas en estado BORRADOR');
      return;
    }

    Modal.confirm({
      title: `✅ Emitir ${draftInvoices.length} facturas`,
      content: `¿Emitir ${draftInvoices.length} facturas borrador? Se generarán los números legales y PDFs.`,
      okText: 'Sí, emitir',
      okType: 'primary',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          let successCount = 0;
          let errorCount = 0;

          for (const invoice of draftInvoices) {
            const result = await invoiceEngine.issueInvoice({
              invoiceId: invoice.id,
              issuedBy: 'current_user'
            });
            if (result.success) successCount++;
            else errorCount++;
          }

          if (successCount > 0) {
            message.success(`✅ ${successCount} facturas emitidas`);
            setSelectedRowKeys([]);
            await fetchInvoices();
            if (onRefresh) onRefresh();
          }
          if (errorCount > 0) {
            message.error(`${errorCount} facturas no pudieron emitirse`);
          }
        } catch (error: any) {
          message.error(`Error al emitir: ${error.message}`);
        }
      }
    });
  };

  // Open preview modal before issuing
  const openPreviewModal = (invoice: Invoice) => {
    setPreviewInvoice(invoice);
    setPreviewModalOpen(true);
  };

  // Issue invoice from preview
  const handleIssueInvoice = async (invoiceId: string) => {
    try {
      const result = await invoiceEngine.issueInvoice({
        invoiceId,
        issuedBy: 'current_user'
      });

      if (result.success) {
        message.success('Factura emitida correctamente');
        setPreviewModalOpen(false);
        setPreviewInvoice(null);
        await fetchInvoices();
        if (onRefresh) onRefresh();
      } else {
        message.error(`Error: ${result.error.type}`);
      }
    } catch (error: any) {
      message.error(`Error al emitir factura: ${error.message}`);
    }
  };

  // Delete draft invoice
  const handleDeleteDraft = async (invoiceId: string) => {
    try {
      const result = await invoiceEngine.deleteDraft(invoiceId);

      if (result.success) {
        message.success('Factura eliminada correctamente');
        await fetchInvoices();
        if (onRefresh) onRefresh();
      } else {
        message.error(`Error: ${result.error.type}`);
      }
    } catch (error: any) {
      message.error(`Error al eliminar factura: ${error.message}`);
    }
  };

  // Open delete reason modal for development mode
  const openDeleteReasonModal = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteReasonModalOpen(true);
  };

  // Open edit modal for draft invoices
  const openEditModal = (invoice: Invoice) => {
    if (invoice.status !== 'DRAFT') {
      message.error('Solo se pueden editar facturas en estado BORRADOR');
      return;
    }
    setEditInvoice(invoice);
    setEditModalOpen(true);
  };

  // Force delete any invoice (DANGEROUS - only for development)
  const handleForceDelete = async () => {
    if (!invoiceToDelete || !deleteReason || deleteReason.trim().length === 0) {
      message.error('Debe proporcionar un motivo claro para eliminar la factura');
      return;
    }

    try {
      console.log('[InvoiceListView] Force delete requested for invoice:', invoiceToDelete.fullNumber);
      console.log('[InvoiceListView] Delete reason:', deleteReason);

      const result = await invoiceEngine.deleteInvoiceForced(invoiceToDelete.id, true);

      if (result.success) {
        message.warning(`⚠️ Factura ${invoiceToDelete.fullNumber} eliminada (modo desarrollo)`);
        console.warn('[InvoiceListView] Invoice deleted with reason:', deleteReason);

        setDeleteReasonModalOpen(false);
        setInvoiceToDelete(null);
        setDeleteReason('');
        await fetchInvoices();
        if (onRefresh) onRefresh();
      } else {
        message.error(`Error: ${result.error.type}`);
      }
    } catch (error: any) {
      message.error(`Error al eliminar factura: ${error.message}`);
    }
  };

  // View PDF
  const handleViewPdf = (invoice: Invoice) => {
    if (invoice.pdfUrl) {
      setPreviewPdfUrl(invoice.pdfUrl);
    } else {
      message.warning('PDF no disponible. La factura debe estar emitida para tener PDF.');
    }
  };

  // Export functions - Multi-format support
  const handleExport = (invoice: Invoice, format: 'excel' | 'csv' | 'json' | 'xml') => {
    try {
      downloadExport(invoice, format);
      message.success(`Factura exportada a ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      message.error(`Error al exportar a ${format.toUpperCase()}`);
    }
  };

  const handleDownloadPdf = (invoice: Invoice) => {
    try {
      invoicePdfGenerator.downloadInvoicePdf(invoice, {
        template: 'modern',
        lang: 'es'
      });
      message.success('PDF descargado');
    } catch (error) {
      console.error('PDF download error:', error);
      message.error('Error al descargar PDF');
    }
  };

  // Export menu items
  const getExportMenuItems = (invoice: Invoice) => [
    {
      key: 'view-pdf',
      label: (
        <span onClick={() => handleViewPdf(invoice)} className="flex items-center">
          <Eye className="w-3.5 h-3.5 mr-2" />
          Ver PDF
        </span>
      )
    },
    {
      key: 'download-pdf',
      label: (
        <span onClick={() => handleDownloadPdf(invoice)} className="flex items-center">
          <Download className="w-3.5 h-3.5 mr-2" />
          Descargar PDF
        </span>
      )
    },
    { type: 'divider' as const },
    {
      key: 'export-excel',
      label: (
        <span onClick={() => handleExport(invoice, 'excel')} className="flex items-center">
          <FileSpreadsheet className="w-3.5 h-3.5 mr-2" />
          Exportar Excel
        </span>
      )
    },
    {
      key: 'export-csv',
      label: (
        <span onClick={() => handleExport(invoice, 'csv')} className="flex items-center">
          <FileText className="w-3.5 h-3.5 mr-2" />
          Exportar CSV
        </span>
      )
    },
    {
      key: 'export-json',
      label: (
        <span onClick={() => handleExport(invoice, 'json')} className="flex items-center">
          <FileJson className="w-3.5 h-3.5 mr-2" />
          Exportar JSON
        </span>
      )
    },
    {
      key: 'export-xml',
      label: (
        <span onClick={() => handleExport(invoice, 'xml')} className="flex items-center">
          <FileCode className="w-3.5 h-3.5 mr-2" />
          Exportar XML
        </span>
      )
    }
  ];

  // Columns for the table - ULTRA COMPACT
  const columns = [
    {
      title: 'Número',
      dataIndex: 'fullNumber',
      key: 'fullNumber',
      width: 120,
      sorter: (a: Invoice, b: Invoice) => a.fullNumber.localeCompare(b.fullNumber),
      render: (text: string, record: Invoice) => (
        <div className="flex items-center gap-1 whitespace-nowrap">
          <Tag color="blue" className="!m-0 !text-[10px] !px-1 !h-[18px] !leading-[18px] flex items-center">
            {record.series}
          </Tag>
          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{text}</span>
        </div>
      )
    },
    {
      title: 'Cliente',
      dataIndex: 'customerSnapshot',
      key: 'customer',
      width: 200,
      ellipsis: true,
      render: (customer: any) => (
        <div className="min-w-0">
          <div className="font-bold truncate text-[11px] text-slate-900 dark:text-slate-100" title={customer.fiscalName}>
            {customer.fiscalName}
          </div>
          <div className="text-[10px] font-medium text-slate-500 truncate">{customer.cif}</div>
        </div>
      )
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      width: 95,
      filters: [
        { text: 'DRAFT', value: 'DRAFT' },
        { text: 'ISSUED', value: 'ISSUED' },
        { text: 'RECTIFIED', value: 'RECTIFIED' }
      ],
      render: (status: InvoiceStatus) => {
        const statusConfig = {
          DRAFT: { color: 'default', icon: <Clock />, text: 'BORRADOR' },
          ISSUED: { color: 'success', icon: <CheckCircle />, text: 'EMITIDA' },
          RECTIFIED: { color: 'error', icon: <AlertCircle />, text: 'RECTIF.' }
        };

        const config = statusConfig[status];
        return (
          <Tag color={config.color} icon={config.icon} className="m-0 text-[10px] px-1 line-height-18">
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: 'Estado Pago',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 110,
      filters: [
        { text: 'Pendiente', value: 'PENDING' },
        { text: 'Parcial', value: 'PARTIAL' },
        { text: 'Pagado/Cobrado', value: 'PAID' }
      ],
      render: (status: PaymentStatus, record: Invoice) => {
        const isRectification = record.status === 'RECTIFIED';
        const statusConfig = {
          PENDING: { color: 'default', text: 'Pendiente' },
          PARTIAL: { color: 'warning', text: 'Parcial' },
          PAID: { color: 'success', text: isRectification ? 'Pagado' : 'Cobrado' }
        };

        const config = statusConfig[status];
        return (
          <Tag color={config.color} className="m-0 text-[10px] px-1 line-height-18">
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: 'Resumen Financiero',
      key: 'financialSummary',
      width: 180,
      render: (_: any, record: Invoice) => (
        <div className="flex items-center justify-between gap-2 p-1 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-100 dark:border-slate-800">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[10px] uppercase text-slate-400 font-bold w-12">Total</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">€{record.total.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[10px] uppercase text-slate-400 font-bold w-12">Cobrado</span>
              <span className="text-xs font-semibold text-emerald-600">€{record.totalPaid.toFixed(2)}</span>
            </div>
            {record.remainingAmount > 0 && (
              <div className="flex items-center gap-1.5 leading-none border-t border-slate-200 dark:border-slate-700 mt-1 pt-1">
                <span className="text-[10px] uppercase text-red-400 font-bold w-12">Deuda</span>
                <span className="text-xs font-bold text-red-600">€{record.remainingAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700">
            <Tooltip title="Ver PDF">
              <Button
                type="text"
                size="small"
                icon={<Eye style={{ width: 14 }} />}
                disabled={!record.pdfUrl}
                onClick={() => handleViewPdf(record)}
                className="h-7 w-7 flex items-center justify-center p-0 text-indigo-600 hover:bg-indigo-50"
              />
            </Tooltip>
            {!record.pdfUrl && <span className="text-[8px] text-slate-400">Sin PDF</span>}
          </div>
        </div>
      )
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: Invoice) => (
        <Space size={4} align="center" className="flex-nowrap">
          {record.status === 'DRAFT' && (
            <>
              <Tooltip title="Vista Previa y Emitir">
                <Button
                  type="primary"
                  size="small"
                  icon={<Eye style={{ width: 12 }} />}
                  onClick={() => openPreviewModal(record)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-[10px] h-5 px-1.5"
                />
              </Tooltip>
              <Tooltip title="Editar Borrador">
                <Button
                  size="small"
                  icon={<Edit style={{ width: 12 }} />}
                  onClick={() => openEditModal(record)}
                  className="text-[10px] h-5 px-1.5"
                />
              </Tooltip>
              <Popconfirm
                title="¿Eliminar borrador?"
                onConfirm={() => handleDeleteDraft(record.id)}
              >
                <Tooltip title="Eliminar Borrador">
                  <Button
                    danger
                    size="small"
                    icon={<Trash2 style={{ width: 12 }} />}
                    className="text-[10px] h-5 px-1.5"
                  />
                </Tooltip>
              </Popconfirm>
            </>
          )}

          {record.status === 'ISSUED' && (
            <>
              <Dropdown
                menu={{ items: getExportMenuItems(record) }}
                placement="bottomRight"
                trigger={['click']}
              >
                <Tooltip title="Exportar / Descargar">
                  <Button
                    size="small"
                    icon={<Download style={{ width: 12 }} />}
                    className="text-[10px] h-5 px-1.5"
                  />
                </Tooltip>
              </Dropdown>
              {record.remainingAmount > 0 && (
                <Tooltip title="Registrar Cobro">
                  <Button
                    size="small"
                    type="primary"
                    icon={<DollarSign style={{ width: 12 }} />}
                    onClick={() => {
                      setSelectedInvoice(record);
                      setPaymentModalOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 border-none text-[10px] h-5.5 px-2"
                  >
                    COBRO
                  </Button>
                </Tooltip>
              )}
            </>
          )}

          {/* Development mode: Force delete for ISSUED invoices */}
          {devMode && record.status === 'ISSUED' && (
            <Tooltip title="Eliminar factura emitida (modo desarrollo)">
              <Button
                size="small"
                danger
                icon={<Trash2 style={{ width: 12 }} />}
                onClick={() => openDeleteReasonModal(record)}
                className="text-xs text-[10px] h-5 px-1.5"
              >
                Eliminar
              </Button>
            </Tooltip>
          )}

          {record.status === 'RECTIFIED' && (
            <>
              <Dropdown
                menu={{ items: getExportMenuItems(record) }}
                placement="bottomRight"
                trigger={['click']}
              >
                <Tooltip title="Exportar / Descargar">
                  <Button
                    size="small"
                    icon={<Download style={{ width: 12 }} />}
                    className="text-[10px] h-5 px-1.5"
                  />
                </Tooltip>
              </Dropdown>
              {record.remainingAmount > 0 && (
                <Tooltip title="Registrar devolución">
                  <Button
                    type="primary"
                    size="small"
                    icon={<CreditCard style={{ width: 12 }} />}
                    onClick={() => {
                      setSelectedInvoice(record);
                      setPaymentModalOpen(true);
                    }}
                    className="bg-orange-500 text-[10px] h-5 px-1.5"
                  >
                    Devolver
                  </Button>
                </Tooltip>
              )}
            </>
          )}

          {/* Development mode: Force delete for RECTIFIED invoices */}
          {devMode && record.status === 'RECTIFIED' && (
            <Tooltip title="Eliminar factura rectificada (modo desarrollo)">
              <Button
                size="small"
                danger
                icon={<Trash2 style={{ width: 12 }} />}
                onClick={() => openDeleteReasonModal(record)}
                className="text-xs text-[10px] h-5 px-1.5"
              >
                Eliminar
              </Button>
            </Tooltip>
          )}
        </Space>
      )
    },
    {
      title: 'Estado Cobro',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 120,
      render: (status: string) => {
        let color = 'default';
        let text = status;

        if (status === 'PAID') { color = 'success'; text = 'COBRADO'; }
        else if (status === 'PARTIAL') { color = 'processing'; text = 'PARCIAL'; }
        else if (status === 'PENDING') { color = 'warning'; text = 'PENDIENTE'; }

        return <Tag color={color} className="text-[10px]">{text}</Tag>;
      }
    }
  ];

  return (
    <div className="space-y-3">
      {/* Header Section - Removed to keep it minimalist as per user request */}


      {/* Bulk Actions - Ultra Compact */}
      {selectedRowKeys.length > 0 && (
        <div className="p-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shadow-md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-white">
                {selectedRowKeys.length} seleccionadas
              </span>
            </div>
            <Space size="small">
              <Button
                size="small"
                icon={<CheckCircle className="w-3.5 h-3.5" />}
                onClick={handleBulkIssue}
                className="bg-emerald-500 hover:bg-emerald-600 border-0 text-white"
              >
                Emitir
              </Button>
              <Button
                size="small"
                danger
                icon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={handleBulkDelete}
                className="bg-white/10 hover:bg-white/20 border-0 text-white"
              >
                Eliminar
              </Button>
              <Button
                size="small"
                onClick={() => setSelectedRowKeys([])}
                className="bg-white/10 hover:bg-white/20 border-0 text-white"
              >
                Cancelar
              </Button>
            </Space>
          </div>
        </div>
      )}

      {/* Quick Filters + Date Presets */}
      <div className="flex flex-wrap items-center gap-1">
        <Button
          size="small"
          type={quickFilter === 'all' ? 'primary' : 'text'}
          onClick={() => { setQuickFilter('all'); setStatusFilter('ALL'); setPaymentStatusFilter('ALL'); }}
          className={`px-3 text-[11px] h-6 ${quickFilter === 'all' ? 'bg-indigo-600' : 'text-slate-500'}`}
        >
          Todas ({invoices.length})
        </Button>
        <Button
          size="small"
          type={quickFilter === 'draft' ? 'primary' : 'text'}
          onClick={() => { setQuickFilter('draft'); setStatusFilter('DRAFT' as InvoiceStatus | 'ALL'); setPaymentStatusFilter('ALL'); }}
          className={`px-3 text-[11px] h-6 ${quickFilter === 'draft' ? 'bg-pink-600' : 'text-slate-500'}`}
        >
          Borradores ({invoices.filter(i => i.status === 'DRAFT').length})
        </Button>
        <Button
          size="small"
          type={quickFilter === 'issued' ? 'primary' : 'text'}
          onClick={() => { setQuickFilter('issued'); setStatusFilter('ISSUED' as InvoiceStatus | 'ALL'); setPaymentStatusFilter('ALL'); }}
          className={`px-3 text-[11px] h-6 ${quickFilter === 'issued' ? 'bg-emerald-600' : 'text-slate-500'}`}
        >
          Emitidas ({invoices.filter(i => i.status === 'ISSUED').length})
        </Button>
        <Button
          size="small"
          type={quickFilter === 'unpaid' ? 'primary' : 'text'}
          onClick={() => { setQuickFilter('unpaid'); setPaymentStatusFilter('PENDING' as PaymentStatus | 'ALL'); setStatusFilter('ALL'); }}
          className={`px-3 text-[11px] h-6 ${quickFilter === 'unpaid' ? 'bg-amber-600' : 'text-slate-500'}`}
        >
          Deuda ({invoices.filter(i => i.remainingAmount > 0).length})
        </Button>

        <div className="border-l border-slate-200 h-4 mx-1" />

        {/* Results counter */}
        <span className="text-[10px] text-slate-400 font-medium ml-auto">
          {filteredInvoices.length !== invoices.length
            ? `Mostrando ${filteredInvoices.length} de ${invoices.length}`
            : `${invoices.length} facturas`
          }
        </span>
      </div>

      {/* Filters Row */}
      <Row gutter={[8, 8]} align="middle">
        <Col xs={24} md={6}>
          <Input
            size="small"
            placeholder="🔍 Buscar... (F)"
            prefix={<Filter className="w-3.5 h-3.5 text-slate-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="text-xs"
          />
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Select
            size="small"
            placeholder="Estado"
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-full text-xs"
          >
            <Select.Option value="ALL">📋 Todos</Select.Option>
            <Select.Option value="DRAFT">📝 Borradores</Select.Option>
            <Select.Option value="ISSUED">✅ Emitidas</Select.Option>
            <Select.Option value="RECTIFIED">❌ Rectificadas</Select.Option>
          </Select>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Select
            size="small"
            placeholder="Pago"
            value={paymentStatusFilter}
            onChange={setPaymentStatusFilter}
            className="w-full text-xs"
          >
            <Select.Option value="ALL">💰 Todos</Select.Option>
            <Select.Option value="PENDING">⏳ Pendiente</Select.Option>
            <Select.Option value="PARTIAL">📊 Parcial</Select.Option>
            <Select.Option value="PAID">✅ Pagado</Select.Option>
          </Select>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Select
            size="small"
            placeholder="👤 Cliente"
            value={customerFilter}
            onChange={(val) => setCustomerFilter(val || null)}
            className="w-full"
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
            }
            options={uniqueCustomers.map(c => ({ value: c.name, label: `${c.name} (${c.cif})` }))}
            style={{ fontSize: '12px' }}
          />
        </Col>
        <Col xs={24} md={8}>
          <div className="flex gap-1.5">
            <DatePicker.RangePicker
              size="small"
              className="flex-1"
              format="DD/MM/YYYY"
              placeholder={['Inicio', 'Fin']}
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              style={{ fontSize: '12px' }}
            />
            <Dropdown
              trigger={['click']}
              menu={{
                items: [
                  {
                    key: 'export-csv',
                    icon: <FileText className="w-3.5 h-3.5" />,
                    label: `Exportar CSV (${filteredInvoices.length})`,
                    onClick: () => handleBulkExport('csv')
                  },
                  {
                    key: 'export-excel',
                    icon: <FileSpreadsheet className="w-3.5 h-3.5" />,
                    label: `Exportar Excel (${filteredInvoices.length})`,
                    onClick: () => handleBulkExport('excel')
                  },
                  { type: 'divider' as const },
                  {
                    key: 'amount-filter',
                    icon: <FileBarChart className="w-3.5 h-3.5" />,
                    label: amountFilterActive ? '💰 Quitar filtro importe' : '💰 Filtrar por importe',
                    onClick: () => {
                      if (amountFilterActive) {
                        setAmountFilterActive(false);
                        setAmountRange([0, maxAmount]);
                      } else {
                        setAmountFilterActive(true);
                      }
                    }
                  },
                  { type: 'divider' as const },
                  {
                    key: 'devmode',
                    icon: devMode ? <LockOpen className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />,
                    label: devMode ? '🔓 Dev ON' : '🔒 Dev OFF',
                    onClick: () => {
                      if (!devMode) setDevModeModalOpen(true);
                      else {
                        setDevMode(false);
                        message.info('Dev OFF');
                      }
                    }
                  }
                ]
              }}
            >
              <Button size="small" icon={<MoreVertical className="w-3.5 h-3.5" />} />
            </Dropdown>
          </div>
        </Col>
      </Row>

      {/* Amount Slider (conditional) */}
      {amountFilterActive && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-amber-800">Rango de importe</span>
            <span className="text-[11px] text-amber-600 font-medium">
              {formatCurrency(amountRange[0])} – {formatCurrency(amountRange[1])}
            </span>
          </div>
          <Slider
            range
            min={0}
            max={maxAmount}
            value={amountRange}
            onChange={(val) => setAmountRange(val as [number, number])}
            step={50}
            className="mx-1"
          />
        </div>
      )}

      {/* Active Filters Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Filtros:</span>
          {searchText && (
            <Tag closable onClose={() => setSearchText('')} className="text-[10px] m-0">
              Búsqueda: &ldquo;{searchText}&rdquo;
            </Tag>
          )}
          {statusFilter !== 'ALL' && (
            <Tag closable onClose={() => setStatusFilter('ALL')} color="blue" className="text-[10px] m-0">
              Estado: {statusFilter}
            </Tag>
          )}
          {paymentStatusFilter !== 'ALL' && (
            <Tag closable onClose={() => setPaymentStatusFilter('ALL')} color="orange" className="text-[10px] m-0">
              Pago: {paymentStatusFilter}
            </Tag>
          )}
          {customerFilter && (
            <Tag closable onClose={() => setCustomerFilter(null)} color="purple" className="text-[10px] m-0">
              Cliente: {customerFilter.substring(0, 20)}
            </Tag>
          )}
          {amountFilterActive && (
            <Tag closable onClose={() => { setAmountFilterActive(false); setAmountRange([0, maxAmount]); }} color="gold" className="text-[10px] m-0">
              Importe: {formatCurrency(amountRange[0])} – {formatCurrency(amountRange[1])}
            </Tag>
          )}
          {dateRange && dateRange[0] && dateRange[1] && (
            <Tag closable onClose={() => setDateRange(null)} color="cyan" className="text-[10px] m-0">
              {dateRange[0].format('DD/MM')} – {dateRange[1].format('DD/MM')}
            </Tag>
          )}
          <Button
            type="link"
            size="small"
            onClick={clearAllFilters}
            className="text-[10px] text-slate-400 hover:text-red-500 p-0 h-auto"
          >
            <X className="w-3 h-3 mr-0.5" /> Limpiar
          </Button>
        </div>
      )}

      {/* Table with Expandable Rows */}
      <Table
        size="small"
        columns={columns}
        dataSource={filteredInvoices}
        rowKey="id"
        loading={loading}
        tableLayout="fixed"
        rowClassName={(record) => {
          let classes = '';
          if (record.status === 'DRAFT') classes += 'bg-blue-50/50 ';
          if (record.paymentStatus === 'PAID') classes += 'opacity-60 grayscale-[0.3] ';
          return classes;
        }}
        rowSelection={{
          selectedRowKeys,
          onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
          getCheckboxProps: (record: Invoice) => ({
            disabled: record.status === 'RECTIFIED',
            name: record.fullNumber
          })
        }}
        expandable={{
          expandedRowKeys,
          onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as React.Key[]),
          expandedRowRender: (record: Invoice) => {
            const issueDate = record.issueDate instanceof Date
              ? record.issueDate
              : new Date((record.issueDate as any).seconds * 1000);
            const dueDate = record.dueDate instanceof Date
              ? record.dueDate
              : new Date((record.dueDate as any).seconds * 1000);
            const paymentPercent = record.total > 0
              ? Math.round((record.totalPaid / record.total) * 100)
              : 0;

            return (
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 -mx-2 space-y-4">
                {/* Header info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Cliente</span>
                    <p className="text-xs font-semibold text-slate-900">{record.customerSnapshot?.fiscalName}</p>
                    <p className="text-[10px] text-slate-500">{record.customerSnapshot?.cif}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Emisión</span>
                    <p className="text-xs font-medium text-slate-700">{issueDate.toLocaleDateString('es-ES')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Vencimiento</span>
                    <p className="text-xs font-medium text-slate-700">{dueDate.toLocaleDateString('es-ES')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Dirección</span>
                    <p className="text-[10px] text-slate-600">
                      {record.customerSnapshot?.address
                        ? `${(record.customerSnapshot.address as any).street || ''}, ${(record.customerSnapshot.address as any).city || ''}`
                        : 'Sin dirección'
                      }
                    </p>
                  </div>
                </div>

                {/* Payment progress bar */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Progreso de cobro</span>
                    <span className="text-xs font-bold text-slate-900">
                      {formatCurrency(record.totalPaid)} / {formatCurrency(record.total)}
                    </span>
                  </div>
                  <Progress
                    percent={paymentPercent}
                    status={paymentPercent >= 100 ? 'success' : paymentPercent > 0 ? 'active' : 'normal'}
                    size="small"
                    strokeColor={paymentPercent >= 100 ? '#10b981' : paymentPercent > 0 ? '#3b82f6' : '#94a3b8'}
                  />
                </div>

                {/* Invoice lines table */}
                {record.lines && record.lines.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Líneas de factura</span>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left text-[10px] text-slate-400 font-semibold py-1 uppercase">Concepto</th>
                          <th className="text-right text-[10px] text-slate-400 font-semibold py-1 uppercase w-16">Uds</th>
                          <th className="text-right text-[10px] text-slate-400 font-semibold py-1 uppercase w-20">Precio</th>
                          <th className="text-right text-[10px] text-slate-400 font-semibold py-1 uppercase w-16">IVA</th>
                          <th className="text-right text-[10px] text-slate-400 font-semibold py-1 uppercase w-20">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {record.lines.map((line, idx) => (
                          <tr key={idx} className="border-b border-slate-100 last:border-0">
                            <td className="py-1.5 text-slate-700">{line.description}</td>
                            <td className="text-right text-slate-600 py-1.5">{line.quantity}</td>
                            <td className="text-right text-slate-600 py-1.5">{formatCurrency(line.unitPrice)}</td>
                            <td className="text-right text-slate-500 py-1.5">{line.taxRate || 21}%</td>
                            <td className="text-right font-semibold text-slate-900 py-1.5">{formatCurrency(line.quantity * line.unitPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-300">
                          <td colSpan={3} />
                          <td className="text-right text-[10px] text-slate-500 font-bold py-1.5 uppercase">Total</td>
                          <td className="text-right text-sm font-bold text-emerald-600 py-1.5">{formatCurrency(record.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* Payment timeline — payments may be enriched from Firestore at runtime */}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(record as any).payments?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Historial de pagos</span>
                    <div className="relative pl-4 space-y-2">
                      <div className="absolute left-1.5 top-1 bottom-1 w-px bg-emerald-200" />
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(record as any).payments.map((payment: any, idx: number) => {
                        const payDate = payment.date?.toDate ? payment.date.toDate() : new Date(payment.date);
                        return (
                          <div key={idx} className="flex items-center gap-3 relative">
                            <div className="absolute -left-2.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white shadow" />
                            <span className="text-[10px] text-slate-500 w-20">{payDate.toLocaleDateString('es-ES')}</span>
                            <span className="text-xs font-semibold text-emerald-700">{formatCurrency(payment.amount)}</span>
                            {payment.method && <Tag className="text-[9px] m-0" style={{ lineHeight: '14px', padding: '0 4px' }}>{payment.method}</Tag>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quick actions */}
                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  {record.pdfUrl && (
                    <Button size="small" icon={<Eye className="w-3 h-3" />} onClick={() => handleViewPdf(record)} style={{ fontSize: '11px' }}>
                      Ver PDF
                    </Button>
                  )}
                  {record.status === 'ISSUED' && record.remainingAmount > 0 && (
                    <Button
                      size="small"
                      type="primary"
                      icon={<DollarSign className="w-3 h-3" />}
                      className="bg-emerald-600 hover:bg-emerald-700 border-none"
                      onClick={() => { setSelectedInvoice(record); setPaymentModalOpen(true); }}
                      style={{ fontSize: '11px' }}
                    >
                      Registrar Cobro
                    </Button>
                  )}
                  {record.status === 'DRAFT' && (
                    <Button
                      size="small"
                      type="primary"
                      icon={<CheckCircle className="w-3 h-3" />}
                      className="bg-blue-600 hover:bg-blue-700 border-none"
                      onClick={() => openPreviewModal(record)}
                      style={{ fontSize: '11px' }}
                    >
                      Emitir
                    </Button>
                  )}
                </div>
              </div>
            );
          },
          expandIcon: ({ expanded, onExpand, record }) => (
            <Button
              type="text"
              size="small"
              className="p-0 w-5 h-5 flex items-center justify-center"
              onClick={(e) => onExpand(record, e)}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              />
            </Button>
          ),
        }}
        pagination={{
          pageSize: 25,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} de ${total}`,
          pageSizeOptions: ['10', '25', '50', '100'],
          size: 'small'
        }}
        scroll={{ x: 1300 }}
        locale={{
          emptyText: (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-600 mb-1">Sin facturas{activeFilterCount > 0 ? ' con estos filtros' : ''}</p>
              <p className="text-xs text-slate-400 mb-3">
                {activeFilterCount > 0
                  ? 'Prueba modificando los filtros o limpiándolos'
                  : 'Crea tu primera factura para empezar a facturar'
                }
              </p>
              {activeFilterCount > 0 && (
                <Button size="small" onClick={clearAllFilters} icon={<X className="w-3 h-3" />}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          )
        }}
      />

      {/* PDF Preview Modal */}
      <Modal
        title="Vista Previa de PDF"
        open={!!previewPdfUrl}
        onCancel={() => setPreviewPdfUrl(null)}
        width={{ xs: '98%', sm: '95%', md: 800 }}
        footer={[
          <Button key="close" onClick={() => setPreviewPdfUrl(null)}>
            Cerrar
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<Download />}
            onClick={() => window.open(previewPdfUrl!, '_blank')}
          >
            Descargar
          </Button>
        ]}
      >
        <div className="pdf-container">
          <iframe
            src={previewPdfUrl || ''}
            className="pdf-iframe"
            title="Vista previa de PDF"
          />
        </div>
      </Modal>

      {/* Payment Modal */}
      {selectedInvoice && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedInvoice(null);
          }}
          onSuccess={() => {
            console.log('[InvoiceListView] Payment successful, refreshing invoice list');
            setPaymentModalOpen(false);
            setSelectedInvoice(null);

            // Wait a bit for Firestore to update, then refresh
            setTimeout(() => {
              console.log('[InvoiceListView] Fetching invoices after payment');
              fetchInvoices();
              if (onRefresh) onRefresh();
            }, 1000);
          }}
          invoice={selectedInvoice}
        />
      )}

      {/* Rectification Modal */}
      {selectedInvoice && (
        <RectificationModal
          isOpen={rectificationModalOpen}
          onClose={() => {
            setRectificationModalOpen(false);
            setSelectedInvoice(null);
          }}
          onSuccess={() => {
            setRectificationModalOpen(false);
            setSelectedInvoice(null);
            fetchInvoices();
            if (onRefresh) onRefresh();
          }}
          invoice={selectedInvoice}
        />
      )}

      {/* Modal de Confirmación para Emitir Factura */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span>Confirmar Emisión de Factura</span>
          </div>
        }
        open={issueConfirmModalOpen}
        onCancel={() => {
          setIssueConfirmModalOpen(false);
          setInvoiceToIssue(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setIssueConfirmModalOpen(false);
            setInvoiceToIssue(null);
          }}>
            Cancelar
          </Button>,
          <Button
            key="issue"
            type="primary"
            className="bg-emerald-500 hover:bg-emerald-600"
            onClick={async () => {
              if (invoiceToIssue) {
                await handleIssueInvoice(invoiceToIssue.id);
                setIssueConfirmModalOpen(false);
                setInvoiceToIssue(null);
              }
            }}
          >
            Sí, Emitir Factura
          </Button>
        ]}
        width={600}
      >
        {invoiceToIssue && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-800">¡Atención!</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Una vez emitida, la factura no podrá ser modificada. Se generará el número legal
                    y el PDF oficial.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-slate-900">Resumen de la Factura</h4>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Cliente:</span>
                  <p className="font-medium">{invoiceToIssue.customerSnapshot?.fiscalName}</p>
                </div>
                <div>
                  <span className="text-slate-500">CIF/NIF:</span>
                  <p className="font-medium">{invoiceToIssue.customerSnapshot?.cif}</p>
                </div>
                <div>
                  <span className="text-slate-500">Fecha de emisión:</span>
                  <p className="font-medium">
                    {new Date(invoiceToIssue.issueDate instanceof Date
                      ? invoiceToIssue.issueDate
                      : invoiceToIssue.issueDate.seconds * 1000).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Fecha de vencimiento:</span>
                  <p className="font-medium">
                    {new Date(invoiceToIssue.dueDate instanceof Date
                      ? invoiceToIssue.dueDate
                      : invoiceToIssue.dueDate.seconds * 1000).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>

              <Divider className="my-3" />

              <div className="space-y-2">
                <h5 className="font-medium text-slate-700">Conceptos:</h5>
                {invoiceToIssue.lines?.map((line, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-slate-600">{line.description}</span>
                    <span className="font-medium">{line.quantity} x {line.unitPrice.toFixed(2)}€</span>
                  </div>
                ))}
              </div>

              <Divider className="my-3" />

              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-slate-900">TOTAL:</span>
                <span className="text-2xl font-bold text-emerald-600">{invoiceToIssue.total.toFixed(2)}€</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Dev Mode Activation Warning Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <span className="text-red-600 font-bold">⚠️ ADVERTENCIA: Modo Desarrollo</span>
          </div>
        }
        open={devModeModalOpen}
        onCancel={() => setDevModeModalOpen(false)}
        width={700}
        footer={[
          <Button key="cancel" onClick={() => setDevModeModalOpen(false)}>
            Cancelar
          </Button>,
          <Button
            key="activate"
            type="primary"
            danger
            onClick={() => {
              setDevModeModalOpen(false);
              setDevMode(true);
              message.warning('⚠️ Modo desarrollo ACTIVADO - Funciones peligrosas disponibles');
            }}
          >
            Entiendo los riesgos, activar
          </Button>
        ]}
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="font-bold text-red-800 mb-2">⛔ REGLAS OBLIGATORIAS:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-red-700">
              <li>
                <strong>NO puedes borrar facturas sin un MOTIVO CLARO</strong>
              </li>
              <li>
                Debes proporcionar una NOTA DETALLADA explicando por qué necesitas borrar la factura
              </li>
              <li>
                Solo usar para <strong>facturas de PRUEBA o DESARROLLO</strong>
              </li>
              <li>
                <strong>NUNCA</strong> borrar facturas reales de clientes
              </li>
              <li>
                Esta acción es <strong>IRREVERSIBLE</strong> y puede causar problemas contables
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="font-semibold text-yellow-800 mb-2">📝 Motivos válidos:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
              <li>Factura creada por error durante pruebas</li>
              <li>Datos incorrectos en factura de prueba</li>
              <li>Errores en el proceso de desarrollo</li>
            </ul>
          </div>

          <div className="bg-slate-100 border border-slate-300 rounded-lg p-4">
            <p className="font-semibold text-slate-800 mb-2">❓ Al intentar eliminar:</p>
            <p className="text-sm text-slate-700">
              Debes introducir obligatoriamente un motivo claro y detallado. Sin motivo, <strong>no se podrá eliminar</strong> la factura.
            </p>
          </div>
        </div>
      </Modal>

      {/* Delete Reason Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-orange-600" />
            <span className="text-orange-600 font-bold">🗑️ Motivo de Eliminación</span>
          </div>
        }
        open={deleteReasonModalOpen}
        onCancel={() => {
          setDeleteReasonModalOpen(false);
          setInvoiceToDelete(null);
          setDeleteReason('');
        }}
        width={600}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setDeleteReasonModalOpen(false);
              setInvoiceToDelete(null);
              setDeleteReason('');
            }}
          >
            Cancelar
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            onClick={handleForceDelete}
            disabled={!deleteReason || deleteReason.trim().length < 10}
          >
            🗑️ Eliminar Factura
          </Button>
        ]}
      >
        {invoiceToDelete && (
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="font-bold text-orange-800 mb-2">⚠️ Vas a eliminar:</p>
              <div className="text-sm text-orange-700 space-y-1">
                <p><strong>Número:</strong> {invoiceToDelete.fullNumber}</p>
                <p><strong>Cliente:</strong> {invoiceToDelete.customerSnapshot.fiscalName}</p>
                <p><strong>Importe:</strong> €{invoiceToDelete.total.toFixed(2)}</p>
                <p><strong>Estado:</strong> {invoiceToDelete.status}</p>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-2">
                📝 Motivo de eliminación <span className="text-red-600">*</span>
              </label>
              <Input.TextArea
                rows={4}
                placeholder="Explica CLARAMENTE por qué necesitas eliminar esta factura. Mínimo 10 caracteres.

Ejemplos válidos:
- Factura de prueba creada por error al validar el flujo de facturación
- Datos de cliente incorrectos en factura de desarrollo XYZ
- Factura duplicada generada durante pruebas de integración"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                maxLength={500}
                showCount
              />
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-700">
                <strong>Recuerda:</strong> Sin un motivo claro y detallado, no podrás eliminar la factura.
                Esta acción es irreversible y quedará registrada.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal
        invoice={previewInvoice}
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setPreviewInvoice(null);
        }}
        onConfirm={() => {
          if (previewInvoice) {
            handleIssueInvoice(previewInvoice.id);
          }
        }}
        onTemplateChange={(template) => {
          if (previewInvoice) {
            previewInvoice.template = template as any;
          }
        }}
      />

      {/* Edit Invoice Modal */}
      <EditInvoiceModal
        invoice={editInvoice}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditInvoice(null);
        }}
        onSuccess={() => {
          fetchInvoices();
          if (onRefresh) onRefresh();
        }}
        franchiseId={franchiseId}
      />
    </div>
  );
};

export default InvoiceListView;
