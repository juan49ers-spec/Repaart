import React, { useState } from 'react';
import { AdminInvoice } from '../../../../types/billing';
import { 
  X, 
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { adminInvoicesService } from '../../../../services/billing/adminInvoices';
import { useAuth } from '../../../../context/AuthContext';
import toast from 'react-hot-toast';

interface InvoicePaymentModalProps {
  invoice: AdminInvoice;
  onClose: () => void;
  onSuccess: () => void;
}

export const InvoicePaymentModal: React.FC<InvoicePaymentModalProps> = ({ invoice, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number>(invoice.balanceDue);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error("El importe debe ser mayor que 0");
      return;
    }

    if (!invoice.id || !user?.uid) return;

    setLoading(true);
    try {
      const result = await adminInvoicesService.registerPayment(invoice.id, amount, user.uid);
      if (result.success) {
        toast.success("Pago registrado correctamente");
        onSuccess();
        onClose();
      } else {
        toast.error("Error al registrar: " + result.error);
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 backdrop-blur-xl p-6 transition-all">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[3rem] shadow-[0_32px_128px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 border border-white/40 dark:border-slate-800/50 relative">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
        
        <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100/30 dark:border-slate-800/30">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/10 flex items-center justify-center shadow-inner">
              <CreditCard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-2xl font-display font-black text-slate-900 dark:text-white tracking-tight">
                Registrar <span className="text-emerald-600 dark:text-emerald-400">Pago</span>
              </h3>
              <p className="text-[11px] font-display font-black text-slate-400 uppercase tracking-widest">Transacción Financiera</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            title="Cerrar modal"
            className="p-3 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          <div className="p-7 bg-slate-100/30 dark:bg-slate-800/30 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 space-y-5 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity duration-1000 rotate-12">
              <CreditCard className="w-24 h-24 text-emerald-600" />
            </div>
            <div className="flex justify-between items-center text-[10px] font-display font-black text-slate-400 uppercase tracking-[0.2em]">
              <span>Referencia Factura</span>
              <span className="text-xs text-slate-900 dark:text-white tracking-normal font-mono">{invoice.invoiceNumber}</span>
            </div>
            <div className="h-px bg-slate-200/50 dark:bg-slate-700/30" />
            <div className="flex justify-between items-end text-[10px] font-display font-black text-slate-400 uppercase tracking-[0.2em]">
              <div className="space-y-1">
                <span>Saldo Pendiente</span>
                <div className="text-2xl text-rose-600 dark:text-rose-400 font-mono font-black tracking-tighter">
                  {invoice.balanceDue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-display font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] px-1 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              Importe a Ingresar
            </label>
            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none transition-transform group-focus-within:scale-125 duration-500">
                <span className="text-3xl font-mono font-black text-emerald-500/30">€</span>
              </div>
              <input 
                autoFocus
                type="number"
                step="0.01"
                max={invoice.balanceDue}
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-100/40 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50 rounded-[1.5rem] pl-16 pr-8 py-7 text-4xl font-mono font-black text-slate-900 dark:text-white focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300 group-hover:bg-white dark:group-hover:bg-slate-900 shadow-inner"
                title="Importe recibido"
                placeholder="0.00"
              />
            </div>
            {amount > invoice.balanceDue && (
              <div className="flex items-center gap-2 px-2 text-rose-500 animate-bounce py-2 bg-rose-500/5 rounded-xl border border-rose-500/10">
                <AlertCircle className="w-4 h-4" />
                <p className="text-[11px] font-display font-black uppercase tracking-wider">El importe excede el saldo pendiente</p>
              </div>
            )}
            <p className="text-[11px] font-body text-slate-400 dark:text-slate-500 leading-relaxed px-1 font-medium italic">
              * El cobro se aplicará inmediatamente al historial financiero de la franquicia <span className="text-slate-600 dark:text-slate-300 font-bold">{invoice.franchiseName}</span>.
            </p>
          </div>

          <div className="flex gap-5 bg-slate-50/50 dark:bg-slate-950/20 -mx-10 -mb-10 p-10 mt-10">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-5 text-[11px] font-display font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 dark:hover:text-white transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading || amount <= 0 || amount > invoice.balanceDue}
              className="flex-[1.5] py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-display font-black uppercase tracking-[0.2em] text-[11px] rounded-[1.5rem] disabled:opacity-10 disabled:grayscale transition-all shadow-[0_12px_24px_rgba(16,185,129,0.3)] active:scale-95 flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>LIQUIDAR PAGO</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
