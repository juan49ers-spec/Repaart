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

import React, { useState, useEffect, useCallback } from 'react';
import {
  Eye,
  Download,
  Trash2,
  Filter,
  DownloadCloud,
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
} from 'lucide-react';
import {
  Table, Tag, Space, Button, Tooltip, Modal, message, Popconfirm, Select, Col, Input, Row, DatePicker, Dropdown, Divider
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
  const [devMode, setDevMode] = useState(false); // Development mode for dangerous actions
  const [devModeModalOpen, setDevModeModalOpen] = useState(false); // Modal for dev mode activation
  const [deleteReasonModalOpen, setDeleteReasonModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
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

  // Apply filters
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

    setFilteredInvoices(filtered);
  }, [invoices, searchText, statusFilter, paymentStatusFilter, dateRange]);

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
        <span onClick={() => handleViewPdf(invoice)}>
          <Eye style={{ width: 14, marginRight: 8 }} />
          Ver PDF
        </span>
      )
    },
    {
      key: 'download-pdf',
      label: (
        <span onClick={() => handleDownloadPdf(invoice)}>
          <Download style={{ width: 14, marginRight: 8 }} />
          Descargar PDF
        </span>
      )
    },
    { type: 'divider' as const },
    {
      key: 'export-excel',
      label: (
        <span onClick={() => handleExport(invoice, 'excel')}>
          <FileSpreadsheet style={{ width: 14, marginRight: 8 }} />
          Exportar Excel
        </span>
      )
    },
    {
      key: 'export-csv',
      label: (
        <span onClick={() => handleExport(invoice, 'csv')}>
          <FileText style={{ width: 14, marginRight: 8 }} />
          Exportar CSV
        </span>
      )
    },
    {
      key: 'export-json',
      label: (
        <span onClick={() => handleExport(invoice, 'json')}>
          <FileJson style={{ width: 14, marginRight: 8 }} />
          Exportar JSON
        </span>
      )
    },
    {
      key: 'export-xml',
      label: (
        <span onClick={() => handleExport(invoice, 'xml')}>
          <FileCode style={{ width: 14, marginRight: 8 }} />
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
          <Tag color="blue" style={{ margin: 0, fontSize: '10px', padding: '0 4px', lineHeight: '18px' }}>
            {record.series}
          </Tag>
          <span style={{ fontSize: '11px' }}>{text}</span>
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
        <div>
          <div className="font-medium truncate" style={{ fontSize: '11px' }} title={customer.fiscalName}>{customer.fiscalName}</div>
          <div className="text-xs text-gray-500 truncate">{customer.cif}</div>
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
          <Tag color={config.color} icon={config.icon} style={{ margin: 0, fontSize: '10px', padding: '0 4px', lineHeight: '18px' }}>
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
          <Tag color={config.color} style={{ margin: 0, fontSize: '10px', padding: '0 4px', lineHeight: '18px' }}>
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
                  className="bg-emerald-500 hover:bg-emerald-600"
                  style={{ fontSize: '10px', height: '20px', padding: '0 6px' }}
                />
              </Tooltip>
              <Tooltip title="Editar Borrador">
                <Button
                  size="small"
                  icon={<Edit style={{ width: 12 }} />}
                  onClick={() => openEditModal(record)}
                  style={{ fontSize: '10px', height: '20px', padding: '0 6px' }}
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
                    style={{ fontSize: '10px', height: '20px', padding: '0 6px' }}
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
                    style={{ fontSize: '10px', height: '20px', padding: '0 6px' }}
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
                    className="bg-emerald-600 hover:bg-emerald-700 border-none"
                    style={{ fontSize: '10px', height: '22px', padding: '0 8px' }}
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
                className="text-xs"
                style={{ fontSize: '10px', height: '20px', padding: '0 6px' }}
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
                    style={{ fontSize: '10px', height: '20px', padding: '0 6px' }}
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
                    className="bg-orange-500"
                    style={{ fontSize: '10px', height: '20px', padding: '0 6px' }}
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
                className="text-xs"
                style={{ fontSize: '10px', height: '20px', padding: '0 6px' }}
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

        return <Tag color={color} style={{ fontSize: '10px' }}>{text}</Tag>;
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

      {/* Quick Filters - Ultra Compact Pills */}
      <div className="flex flex-wrap gap-1">
        <Button
          size="small"
          type={quickFilter === 'all' ? 'primary' : 'text'}
          onClick={() => setQuickFilter('all')}
          className={`px-3 ${quickFilter === 'all' ? 'bg-indigo-600' : 'text-slate-500'}`}
          style={{ fontSize: '11px', height: '24px' }}
        >
          Todas ({invoices.length})
        </Button>
        <Button
          size="small"
          type={quickFilter === 'draft' ? 'primary' : 'text'}
          onClick={() => {
            setQuickFilter('draft');
            setStatusFilter('DRAFT' as InvoiceStatus | 'ALL');
          }}
          className={`px-3 ${quickFilter === 'draft' ? 'bg-pink-600' : 'text-slate-500'}`}
          style={{ fontSize: '11px', height: '24px' }}
        >
          Borradores ({invoices.filter(i => i.status === 'DRAFT').length})
        </Button>
        <Button
          size="small"
          type={quickFilter === 'issued' ? 'primary' : 'text'}
          onClick={() => {
            setQuickFilter('issued');
            setStatusFilter('ISSUED' as InvoiceStatus | 'ALL');
          }}
          className={`px-3 ${quickFilter === 'issued' ? 'bg-emerald-600' : 'text-slate-500'}`}
          style={{ fontSize: '11px', height: '24px' }}
        >
          Emitidas ({invoices.filter(i => i.status === 'ISSUED').length})
        </Button>
        <Button
          size="small"
          type={quickFilter === 'unpaid' ? 'primary' : 'text'}
          onClick={() => {
            setQuickFilter('unpaid');
            setPaymentStatusFilter('PENDING' as PaymentStatus | 'ALL');
          }}
          className={`px-3 ${quickFilter === 'unpaid' ? 'bg-amber-600' : 'text-slate-500'}`}
          style={{ fontSize: '11px', height: '24px' }}
        >
          Deuda ({invoices.filter(i => i.remainingAmount > 0).length})
        </Button>
      </div>

      {/* Filters Row - Ultra Compact */}
      <Row gutter={[8, 8]} align="middle">
        <Col xs={24} md={8}>
          <Input
            size="small"
            placeholder="🔍 Buscar... (F)"
            prefix={<Filter className="w-3.5 h-3.5 text-slate-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ fontSize: '13px' }}
          />
        </Col>
        <Col xs={24} sm={8} md={4}>
          <Select
            size="small"
            placeholder="Estado"
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-full"
            allowClear
            style={{ fontSize: '13px' }}
          >
            <Select.Option value="ALL">📋 Todos ({invoices.length})</Select.Option>
            <Select.Option value="DRAFT">📝 Borradores ({invoices.filter(i => i.status === 'DRAFT').length})</Select.Option>
            <Select.Option value="ISSUED">✅ Emitidas ({invoices.filter(i => i.status === 'ISSUED').length})</Select.Option>
            <Select.Option value="RECTIFIED">❌ Rectificadas ({invoices.filter(i => i.status === 'RECTIFIED').length})</Select.Option>
          </Select>
        </Col>
        <Col xs={24} sm={8} md={4}>
          <Select
            size="small"
            placeholder="Pago"
            value={paymentStatusFilter}
            onChange={setPaymentStatusFilter}
            className="w-full"
            allowClear
            style={{ fontSize: '13px' }}
          >
            <Select.Option value="ALL">💰 Todos</Select.Option>
            <Select.Option value="PENDING">⏳ Pendiente</Select.Option>
            <Select.Option value="PARTIAL">📊 Parcial</Select.Option>
            <Select.Option value="PAID">✅ Pagado</Select.Option>
          </Select>
        </Col>
        <Col xs={24} md={8}>
          <div className="flex gap-1.5">
            <DatePicker.RangePicker
              size="small"
              className="flex-1"
              format="DD/MM/YYYY"
              placeholder={['Inicio', 'Fin']}
              onChange={(dates) => setDateRange(dates)}
              style={{ fontSize: '13px' }}
            />
            <Dropdown
              trigger={['click']}
              menu={{
                items: [
                  {
                    key: 'export',
                    icon: <DownloadCloud className="w-3.5 h-3.5" />,
                    label: 'Exportar Todas (CSV)',
                    onClick: () => message.info('Exportación masiva próximamente')
                  },
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

      {/* Table - Ultra Compact */}
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
        pagination={{
          pageSize: 25,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} de ${total}`,
          pageSizeOptions: ['10', '25', '50', '100'],
          size: 'small'
        }}
        scroll={{ x: 1300 }}
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
