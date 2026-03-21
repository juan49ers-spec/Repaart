import React, { useState, useMemo, useEffect } from 'react';
import { useAdminInvoices } from './hooks/useAdminInvoices';
import { AdminInvoice } from '../../../types/billing';
import { Plus, RefreshCcw, Euro, CreditCard, Activity, Users } from 'lucide-react';
import { InvoiceCreatorWizard } from './components/InvoiceCreatorWizard';
import { AdminInvoiceDetailModal } from './components/AdminInvoiceDetailModal';
import { InvoicePaymentModal } from './components/InvoicePaymentModal';
import { AdminBillingStatsCards } from './components/AdminBillingStatsCards';
import { AdminInvoicesTable } from './components/AdminInvoicesTable';
import { exportInvoicesToCsv } from './services/exportCsv';
import { useAuth } from '../../../context/AuthContext';
import { adminInvoicesService } from '../../../services/billing/adminInvoices';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebase';
import toast from 'react-hot-toast';
import { TabFilter } from './types';

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



  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col overflow-hidden">

      {/* Navigation Bar */}
      <nav className="h-16 sm:h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 md:px-8 flex-shrink-0">
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
          <AdminBillingStatsCards
            totalBilled={totalBilled}
            totalPending={totalPending}
            totalOverdue={totalOverdue}
            draftCount={draftCount}
            draftInProgress={draftInProgress}
            draftEmpty={draftEmpty}
          />

          {/* Invoices Table (tabs + search + table) */}
          <AdminInvoicesTable
            invoices={invoices}
            filteredInvoices={filteredInvoices}
            loading={loading}
            error={error?.message ?? null}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            tabCounts={tabCounts}
            actionLoading={actionLoading}
            onSelectInvoice={(inv) => setSelectedInvoice(inv)}
            onQuickDuplicate={handleQuickDuplicate}
            onQuickDelete={handleQuickDelete}
            onRepairPermissions={handleRepairPermissions}
            isRepairing={isRepairing}
            onExportCSV={() => exportInvoicesToCsv(filteredInvoices)}
          />

        </div>
      </div>

    </div>
  );
};

export default AdminBillingDashboard;
