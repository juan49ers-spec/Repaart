import React, { useState, useEffect } from 'react';
import { 
  X, FileText, Download, Printer, Send, Trash2, 
  Save, Ban, Copy, CreditCard,
  User, StickyNote, Clock, ShieldCheck
} from 'lucide-react';
import { AdminInvoice as Invoice, AdminInvoiceItem as InvoiceItem } from '../../../../types/billing';
import { useAuth } from '../../../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { InvoiceItemsEditor } from './InvoiceItemsEditor';
import { adminInvoicesService } from '../../../../services/billing/adminInvoices';

interface AdminInvoiceDetailModalProps {
  invoice: Invoice;
  onClose: () => void;
  onUpdate?: () => void;
  onRegisterPayment?: (invoice: Invoice) => void;
}

export const AdminInvoiceDetailModal: React.FC<AdminInvoiceDetailModalProps> = ({ 
  invoice, 
  onClose,
  onUpdate,
  onRegisterPayment
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>(invoice.items || []);
  const [notes, setNotes] = useState(invoice.notes || '');

  const isDraft = invoice.documentStatus === 'draft';
  const isVoid = invoice.documentStatus === 'void';
  const isPaid = invoice.paymentStatus === 'paid';
  const isIssued = invoice.documentStatus === 'issued';

  useEffect(() => {
    setItems(invoice.items || []);
    setNotes(invoice.notes || '');
  }, [invoice]);

  const handleError = (error: unknown, context: string) => {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error(`Error in ${context}:`, error);
    
    if (message.includes('permission') || message.includes('permisos')) {
      toast.error(
        <div>
          <p className="font-bold">Error de Permisos</p>
          <p className="text-xs opacity-90">Tu sesión de administrador no tiene los privilegios necesarios en Firebase. Por favor, pulsa el botón de reparación en el panel de usuarios o contacta con soporte.</p>
        </div>,
        { duration: 6000 }
      );
    } else {
      toast.error(`Error al ${context}: ${message}`);
    }
  };

  const handleUpdateItems = (newItems: InvoiceItem[]) => {
    setItems(newItems);
  };

  const handleSaveDraft = async () => {
    if (!isDraft) return;
    setLoading(true);
    try {
      const result = await adminInvoicesService.updateDraftDetails(invoice.id!, {
        notes
      }, user?.uid || '');

      if (!result.success) throw result.error;
      
      const itemsResult = await adminInvoicesService.updateDraftItems(invoice.id!, items, user?.uid || '');
      if (!itemsResult.success) throw itemsResult.error;

      toast.success('Borrador actualizado correctamente');
      onUpdate?.();
    } catch (error: unknown) {
      handleError(error, 'guardar el borrador');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueInvoice = async () => {
    if (!isDraft) return;
    if (items.length === 0) {
      toast.error('La factura debe tener al menos un concepto');
      return;
    }
    
    setLoading(true);
    try {
      const result = await adminInvoicesService.issueInvoice(invoice.id!, user?.uid || '');
      if (!result.success) throw result.error;
      
      toast.success(`Factura emitida: ${result.data}`);
      onUpdate?.();
    } catch (error: unknown) {
      handleError(error, 'emitir la factura');
    } finally {
      setLoading(false);
    }
  };

  const handleVoidInvoice = async () => {
    if (isVoid || isPaid) return;
    setLoading(true);
    try {
      const reason = window.prompt('Motivo de la anulación:');
      if (!reason) {
        setLoading(false);
        return;
      }

      const result = await adminInvoicesService.voidInvoice(invoice.id!, reason, user?.uid || '');
      if (!result.success) throw result.error;

      toast.success('Factura anulada correctamente');
      onUpdate?.();
    } catch (error: unknown) {
      handleError(error, 'anular la factura');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!isDraft) return;
    setLoading(true);
    try {
      const result = await adminInvoicesService.deleteDraftInvoice(invoice.id!, user?.uid || '');
      if (!result.success) throw result.error;

      toast.success('Borrador eliminado permanentemente');
      onClose();
      onUpdate?.();
    } catch (error: unknown) {
      handleError(error, 'eliminar el borrador');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (invoice.documentStatus) {
      case 'draft': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
      case 'issued': return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'void': return 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getPaymentStatusColor = () => {
    switch (invoice.paymentStatus) {
      case 'paid': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'unpaid': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'partially_paid': return 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
      case 'overdue': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const statusLabels: Record<string, string> = {
    draft: 'Borrador',
    issued: 'Emitida',
    void: 'Anulada',
    paid: 'Pagada',
    unpaid: 'Pendiente',
    partially_paid: 'Pago Parcial',
    overdue: 'Vencida'
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/20 backdrop-blur-sm p-4 md:p-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-400 relative border border-slate-200 dark:border-slate-800 shadow-2xl">
        
        {/* Header Ultra-Limpio */}
        <div className="relative flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-xl font-display font-black text-slate-900 dark:text-white tracking-tight leading-none">
                  {invoice.invoiceNumber || 'Borrador Digital'}
                </h2>
                {invoice.duplicatedFrom && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-[8px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest">
                    <Copy className="w-2.5 h-2.5" />
                    Copia
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getStatusColor()} border border-transparent`}>
                  <div className="w-1 h-1 rounded-full bg-current" />
                  {statusLabels[invoice.documentStatus] || invoice.documentStatus}
                </div>
                {isIssued && (
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getPaymentStatusColor()} border border-transparent`}>
                    {statusLabels[invoice.paymentStatus] || invoice.paymentStatus}
                  </div>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all mechanical-press"
            title="Cerrar modal"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          {/* Alerta de Anulación Minimal */}
          {isVoid && (
            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/50 rounded-2xl p-4 flex items-start gap-4">
              <div className="p-2 bg-rose-500 rounded-lg shadow-sm">
                <Ban className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-rose-700 dark:text-rose-300 uppercase tracking-tight">Documento Invalidado</h4>
                {invoice.voidReason && (
                  <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-1 italic">
                    &quot;{invoice.voidReason}&quot;
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              {/* Fiscal Info Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Información Fiscal</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest uppercase">Cliente / Entidad</p>
                      <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">
                        {invoice.customerSnapshot.legalName}
                      </h3>
                      <div className="inline-flex items-center gap-2 text-[10px] font-mono font-bold text-slate-500">
                        <User className="w-3 h-3 text-indigo-500" />
                        {invoice.customerSnapshot.taxId}
                      </div>
                    </div>
                    <div className="space-y-1 text-right md:max-w-[200px]">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ubicación & Contacto</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                        {typeof invoice.customerSnapshot.address === 'string' 
                          ? invoice.customerSnapshot.address 
                          : `${invoice.customerSnapshot.address?.line1 || ''}, ${invoice.customerSnapshot.address?.city || ''}`}
                      </p>
                      <p className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {invoice.customerSnapshot.billingEmail || 'sin-email@repaart.com'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Items Editor Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3 bg-emerald-500 rounded-full" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Desglose de Conceptos</span>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                  <InvoiceItemsEditor 
                    items={items} 
                    onChange={handleUpdateItems} 
                    readOnly={!isDraft} 
                  />
                </div>
              </section>
            </div>

            {/* Sidebar Info - Refined Totals */}
            <div className="space-y-8">
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3 bg-amber-500 rounded-full" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado Financiero</span>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 space-y-6">
                  {/* Totals Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500 font-bold uppercase tracking-wider">Subtotal</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                        {invoice.subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500 font-bold uppercase tracking-wider">IVA (21%)</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                        {invoice.taxAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                      </span>
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-slate-700/50" />
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-0.5">Total Documento</span>
                      <span className="text-2xl font-mono font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                        {invoice.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                      </span>
                    </div>
                  </div>

                  {/* Payment Progress */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700/50 space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.1em]">
                      <span className="text-slate-400">Pagado</span>
                      <span className="text-emerald-500">-{invoice.amountPaid.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€</span>
                    </div>
                    
                    <div className="p-4 bg-white dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo Pendiente</p>
                        <p className={`text-xl font-mono font-black tabular-nums tracking-tighter ${invoice.balanceDue > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {invoice.balanceDue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                        </p>
                      </div>
                      <div className={`p-2 rounded-lg ${invoice.balanceDue > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {invoice.balanceDue > 0 ? <Clock className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Bitácora / Admin Notes */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Notas del Administrador</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                  {isDraft ? (
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Anotaciones técnicas o aclaraciones..."
                      rows={3}
                      className="w-full bg-white dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-[11px] font-medium text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all resize-none shadow-sm"
                    />
                  ) : (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic px-2">
                      {notes ? `"${notes}"` : 'Sin anotaciones adicionales registradas.'}
                    </p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Footer Minimal */}
        <div className="px-8 py-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDraft && (
                <>
                  <button 
                    onClick={handleSaveDraft}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    Guardar
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading}
                    className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                    title="Eliminar borrador"
                    aria-label="Eliminar borrador"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              {isIssued && !isVoid && (
                <>
                  <button 
                    onClick={handleVoidInvoice}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-xl border border-rose-200 dark:border-rose-800 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Ban className="w-4 h-4" />
                    Anular
                  </button>

                  {!isPaid && (
                    <button 
                      onClick={() => onRegisterPayment?.(invoice)}
                      disabled={loading}
                      className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <CreditCard className="w-4 h-4" />
                      Registrar Pago
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!isDraft && !isVoid && (
                <div className="flex items-center gap-2 mr-4 border-r border-slate-100 dark:border-slate-800 pr-4">
                  <button className="p-2.5 text-slate-400 hover:text-indigo-500 transition-colors" title="Imprimir">
                    <Printer className="w-4 h-4" />
                  </button>
                  <button className="p-2.5 text-slate-400 hover:text-indigo-500 transition-colors" title="Descargar PDF">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}

              {isDraft ? (
                <button 
                  onClick={handleIssueInvoice}
                  disabled={loading || items.length === 0}
                  className="flex items-center gap-3 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                >
                  <Send className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Emitir Factura</span>
                </button>
              ) : (
                <button 
                  onClick={onClose}
                  className="px-8 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Overlay */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-400">
              <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-xl font-display font-black text-slate-900 dark:text-white text-center mb-2 uppercase tracking-tight">¿Eliminar Borrador?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-8 leading-relaxed">
                Esta acción es irreversible y el registro desaparecerá permanentemente.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeleteDraft}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/20 transition-all"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// export default AdminInvoiceDetailModal;
