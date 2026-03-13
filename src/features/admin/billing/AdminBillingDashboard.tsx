import React, { useState, useMemo, useEffect } from 'react';
import { useAdminInvoices } from './hooks/useAdminInvoices';
import { AdminInvoice } from '../../../types/billing';
import {
  FileText,
  Plus,
  RefreshCcw,
  Search,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  Euro,
  CreditCard,
  Users,
  Download,
  Copy,
  Trash2,
  Ban
} from 'lucide-react';
import { InvoiceCreatorWizard } from './components/InvoiceCreatorWizard';
import { AdminInvoiceDetailModal } from './components/AdminInvoiceDetailModal';

import { InvoicePaymentModal } from './components/InvoicePaymentModal';
import { useAuth } from '../../../context/AuthContext';
import { adminInvoicesService } from '../../../services/billing/adminInvoices';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebase';
import toast from 'react-hot-toast';

type TabFilter = 'all' | 'draft' | 'issued' | 'paid' | 'overdue' | 'void';

export const AdminBillingDashboard: React.FC = () => {
  const { invoices, loading, error, refresh } = useAdminInvoices();
  const { user, forceTokenRefresh } = useAuth();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<AdminInvoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<AdminInvoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRepairing, setIsRepairing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pendingSelectionId, setPendingSelectionId] = useState<string | null>(null);

  // Auto-seleccionar factura cuando aparece en la lista
  useEffect(() => {
    if (pendingSelectionId && invoices.length > 0) {
      const found = invoices.find(inv => inv.id === pendingSelectionId);
      if (found) {
        setSelectedInvoice(found);
        setPendingSelectionId(null);
      }
    }
  }, [invoices, pendingSelectionId]);

  const handleRepairPermissions = async () => {
    if (isRepairing) return;
    setIsRepairing(true);
    try {
      const repairFn = httpsCallable(functions, 'repairCustomClaims');
      await repairFn();
      await forceTokenRefresh();
      refresh();
      alert('Permisos reparados con éxito.');
    } catch (err) {
      console.error('Error repairing permissions:', err);
      alert('No se pudo reparar los permisos.');
    } finally {
      setIsRepairing(false);
    }
  };

  // KPIs
  const totalBilled = invoices
    .filter(inv => inv.documentStatus === 'issued')
    .reduce((acc, curr) => acc + curr.total, 0);

  const totalPending = invoices
    .filter(inv => inv.documentStatus === 'issued' && (inv.paymentStatus === 'unpaid' || inv.paymentStatus === 'partially_paid' || inv.paymentStatus === 'overdue'))
    .reduce((acc, curr) => acc + curr.balanceDue, 0);

  const totalOverdue = invoices
    .filter(inv => inv.documentStatus === 'issued' && inv.paymentStatus === 'overdue')
    .reduce((acc, curr) => acc + curr.balanceDue, 0);

  const draftCount = invoices.filter(inv => inv.documentStatus === 'draft').length;
  const draftInProgress = invoices.filter(inv => inv.documentStatus === 'draft' && inv.total > 0).length;
  const draftEmpty = invoices.filter(inv => inv.documentStatus === 'draft' && inv.total === 0).length;

  const billedChange = 12.5;
  const pendingChange = -3.2;

  function getDaysOverdue(inv: AdminInvoice): number {
    if (!inv.dueDate || inv.paymentStatus === 'paid') return 0;
    const dueDate = new Date(inv.dueDate.seconds * 1000);
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  function isOverdue(inv: AdminInvoice): boolean {
    return getDaysOverdue(inv) > 0;
  }

  // Tab counts
  const tabCounts = useMemo(() => ({
    all: invoices.length,
    draft: invoices.filter(i => i.documentStatus === 'draft').length,
    issued: invoices.filter(i => i.documentStatus === 'issued' && i.paymentStatus !== 'paid').length,
    paid: invoices.filter(i => i.documentStatus === 'issued' && i.paymentStatus === 'paid').length,
    overdue: invoices.filter(i => i.documentStatus === 'issued' && i.paymentStatus === 'overdue').length,
    void: invoices.filter(i => i.documentStatus === 'void').length,
  }), [invoices]);

  // Filtrado por tab + búsqueda
  const filteredInvoices = useMemo(() => {
    let result = invoices;

    // Tab filter
    switch (activeTab) {
      case 'draft':
        result = result.filter(i => i.documentStatus === 'draft');
        break;
      case 'issued':
        result = result.filter(i => i.documentStatus === 'issued' && i.paymentStatus !== 'paid');
        break;
      case 'paid':
        result = result.filter(i => i.documentStatus === 'issued' && i.paymentStatus === 'paid');
        break;
      case 'overdue':
        result = result.filter(i => i.documentStatus === 'issued' && i.paymentStatus === 'overdue');
        break;
      case 'void':
        result = result.filter(i => i.documentStatus === 'void');
        break;
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(inv =>
        inv.franchiseName.toLowerCase().includes(term) ||
        (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(term))
      );
    }

    return result;
  }, [invoices, activeTab, searchTerm]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Nº Factura', 'Franquicia', 'CIF', 'F. Emisión', 'F. Vencimiento', 'Base', 'IVA', 'Total', 'Estado', 'Pagado', 'Pendiente'];
    const rows = filteredInvoices.map(inv => [
      inv.invoiceNumber || 'BORRADOR',
      inv.franchiseName,
      inv.customerSnapshot?.taxId || '',
      inv.issueDate ? new Date(inv.issueDate.seconds * 1000).toLocaleDateString('es-ES') : '',
      inv.dueDate ? new Date(inv.dueDate.seconds * 1000).toLocaleDateString('es-ES') : '',
      inv.subtotal.toFixed(2).replace('.', ','),
      inv.taxAmount.toFixed(2).replace('.', ','),
      inv.total.toFixed(2).replace('.', ','),
      inv.documentStatus === 'void' ? 'Anulada' : inv.documentStatus === 'draft' ? 'Borrador' : inv.paymentStatus === 'paid' ? 'Pagada' : inv.paymentStatus === 'overdue' ? 'Vencida' : 'Pendiente',
      inv.amountPaid.toFixed(2).replace('.', ','),
      inv.balanceDue.toFixed(2).replace('.', ','),
    ]);

    // BOM + separador ; para compatibilidad con Excel ES
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

  // Quick actions
  const handleQuickDuplicate = async (e: React.MouseEvent, inv: AdminInvoice) => {
    e.stopPropagation();
    if (!inv.id || !user?.uid || actionLoading) return;
    setActionLoading(inv.id);
    try {
      const result = await adminInvoicesService.duplicateInvoice(inv.id, user.uid);
      if (result.success) {
        toast.success('Factura duplicada');
        refresh();
      } else {
        toast.error('Error: ' + result.error);
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  const handleQuickDelete = async (e: React.MouseEvent, inv: AdminInvoice) => {
    e.stopPropagation();
    if (!inv.id || !user?.uid || actionLoading) return;
    if (!window.confirm('¿Eliminar este borrador permanentemente?')) return;
    setActionLoading(inv.id);
    try {
      const result = await adminInvoicesService.deleteDraftInvoice(inv.id, user.uid);
      if (result.success) {
        toast.success('Borrador eliminado');
        refresh();
      } else {
        toast.error('Error: ' + result.error);
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };



  const tabs: { key: TabFilter; label: string; color: string }[] = [
    { key: 'all', label: 'Todas', color: 'text-slate-600 dark:text-slate-300' },
    { key: 'draft', label: 'Borradores', color: 'text-slate-600 dark:text-slate-300' },
    { key: 'issued', label: 'Emitidas', color: 'text-blue-600 dark:text-blue-400' },
    { key: 'paid', label: 'Pagadas', color: 'text-emerald-600 dark:text-emerald-400' },
    { key: 'overdue', label: 'Vencidas', color: 'text-rose-600 dark:text-rose-400' },
    { key: 'void', label: 'Anuladas', color: 'text-slate-500 dark:text-slate-500' },
  ];

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col overflow-hidden">

      {/* Navigation Bar */}
      <nav className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-700 dark:to-purple-800 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-lg">R</span>
            </div>
            <div>
              <h1 className="text-xl font-display font-black text-slate-900 dark:text-white tracking-tight">
                REPAART
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[
            { icon: Euro, active: false, label: 'Finanzas' },
            { icon: CreditCard, active: true, label: 'Facturación' },
            { icon: Activity, active: false, label: 'Operaciones' },
            { icon: Users, active: false, label: 'Franquicias' },
          ].map((item, idx) => (
            <div key={idx} className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              item.active
                ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-lg'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              <item.icon className="w-4 h-4" strokeWidth={2.5} />
              <span className={`text-[8px] font-bold uppercase ${
                item.active ? 'text-white' : 'text-slate-500'
              }`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
              Sistema Activo
            </span>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 rounded-lg flex items-center justify-center text-white font-bold text-xs">
            A
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-5 py-3">
        <div className="max-w-7xl mx-auto space-y-3">

          {/* Modals */}
          {isWizardOpen && (
            <InvoiceCreatorWizard
              onClose={() => setIsWizardOpen(false)}
              onSuccess={(invoiceId) => {
                setIsWizardOpen(false);
                refresh();
                setPendingSelectionId(invoiceId);
              }}
            />
          )}

          {selectedInvoice && !showPaymentModal && (
            <AdminInvoiceDetailModal
              invoice={selectedInvoice}
              onClose={() => setSelectedInvoice(null)}
              onUpdate={() => refresh()}
              onRegisterPayment={(inv: AdminInvoice) => setShowPaymentModal(inv)}
            />
          )}

          {showPaymentModal && (
            <InvoicePaymentModal
              invoice={showPaymentModal}
              onClose={() => setShowPaymentModal(null)}
              onSuccess={() => {
                setShowPaymentModal(null);
                refresh();
              }}
            />
          )}

          {/* Header */}
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
                Panel de Facturación
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestión centralizada de facturas</p>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => refresh()} 
                disabled={loading} 
                title="Refrescar datos"
                aria-label="Refrescar datos"
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
              >
                <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => setIsWizardOpen(true)} 
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white text-sm font-medium rounded-full transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Nueva Factura
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Facturado */}
            <div className="bg-emerald-50/80 dark:bg-emerald-900/20 p-6 rounded-[24px]">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Total Facturado</p>
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
                  {totalBilled.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </p>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <Activity className="w-3 h-3" />
                  <span>+{billedChange}%</span>
                </div>
              </div>
            </div>

            {/* Pendiente */}
            <div className="bg-sky-50/80 dark:bg-sky-900/20 p-6 rounded-[24px]">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Pendiente</p>
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
                  {totalPending.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </p>
                <div className="flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400">
                  <Activity className="w-3 h-3" />
                  <span>{pendingChange}%</span>
                </div>
              </div>
            </div>

            {/* Vencido */}
            <div className="bg-rose-50/80 dark:bg-rose-900/20 p-6 rounded-[24px]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Vencido</p>
                <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
              </div>
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-display font-bold text-rose-600 dark:text-rose-400 tracking-tight">
                  {totalOverdue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
            </div>

            {/* Borradores */}
            <div className="bg-indigo-50/80 dark:bg-indigo-900/20 p-6 rounded-[24px]">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Borradores</p>
              <div className="flex items-baseline gap-3 mb-1">
                <p className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
                  {draftCount}
                </p>
              </div>
              <div className="flex gap-2 text-xs font-medium">
                 <span className="text-slate-700 dark:text-slate-300">{draftInProgress} en progreso</span>
                 <span className="text-slate-400">|</span>
                 <span className="text-slate-700 dark:text-slate-300">{draftEmpty} vacíos</span>
              </div>
            </div>
          </div>

          {/* Tabs + Search + Export */}
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === tab.key
                      ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-md'
                      : `${tab.color} hover:bg-slate-50 dark:hover:bg-slate-800`
                  }`}
                >
                  {tab.label}
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
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
                    className="w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full pl-11 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 transition-all shadow-sm"
                  />
                </div>
                <button
                  onClick={handleExportCSV}
                  disabled={filteredInvoices.length === 0}
                  title="Exportar facturas filtradas a CSV"
                  className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-40"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
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
                     onClick={handleRepairPermissions}
                     disabled={isRepairing}
                     className="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-full hover:bg-slate-800 transition-colors shadow-sm"
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
                     onClick={() => setSelectedInvoice(inv)}
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
                       <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                         {inv.subtotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                       </p>
                     </div>

                     {/* IVA */}
                     <div className="text-right">
                       <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
                         {inv.taxAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                       </p>
                     </div>

                     {/* Total */}
                     <div className="text-right">
                       <p className={`text-sm font-bold ${
                         inv.balanceDue > 0
                           ? 'text-slate-900 dark:text-white'
                           : 'text-emerald-600 dark:text-emerald-400'
                       }`}>
                         {inv.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                       </p>
                       {inv.balanceDue > 0 && inv.balanceDue !== inv.total && (
                          <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
                            Faltan {inv.balanceDue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                          </p>
                       )}
                     </div>

                     {/* Quick Actions */}
                     <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button
                         onClick={(e) => handleQuickDuplicate(e, inv)}
                         disabled={actionLoading === inv.id}
                         title="Duplicar factura"
                         className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                       >
                         <Copy className="w-3.5 h-3.5" />
                       </button>
                       {inv.documentStatus === 'draft' && (
                         <button
                           onClick={(e) => handleQuickDelete(e, inv)}
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
      </div>

    </div>
  );
};

export default AdminBillingDashboard;
