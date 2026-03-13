import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { CustomerSnapshot } from '../../../../types/billing';
import { useAuth } from '../../../../context/AuthContext';
import { 
  X, 
  CheckCircle2,
  ChevronDown,
  Building2,
  Calendar as CalendarIcon,
  FileText,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

interface InvoiceCreatorWizardProps {
  onClose: () => void;
  onSuccess: (invoiceId: string) => void;
}

interface FranchiseListItem {
  id: string;
  name: string;
  cif?: string;
  address?: {
    line1?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  email?: string;
}

export const InvoiceCreatorWizard: React.FC<InvoiceCreatorWizardProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [franchises, setFranchises] = useState<FranchiseListItem[]>([]);
  
  // Form State
  const [selectedFranchiseId, setSelectedFranchiseId] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    const fetchFranchises = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'franchise'));
        const snap = await getDocs(q); 
        const data: FranchiseListItem[] = snap.docs
          .map(d => {
            const docData = d.data();
            if (docData.status === 'deleted') return null;
            return { 
              id: d.id, 
              name: docData.displayName || docData.name || docData.legalName || 'Sin nombre',
              cif: docData.cif,
              address: docData.address,
              email: docData.email
            };
          })
          .filter(Boolean) as FranchiseListItem[];
        setFranchises(data);
      } catch (err) {
        console.error("Error fetching franchises", err);
        toast.error("Error al cargar lista de franquicias");
      }
    };
    fetchFranchises();
  }, []);

  const handleCreateDraft = async () => {
    if (!selectedFranchiseId || !dueDate || !user?.uid) {
      toast.error("Selecciona franquicia y fecha de vencimiento");
      return;
    }

    setLoading(true);
    const selected = franchises.find(f => f.id === selectedFranchiseId);
    
    if (!selected) {
      setLoading(false);
      return;
    }

    // Adaptar a CustomerSnapshot (src/types/billing.ts)
    const snapshot: CustomerSnapshot = {
      legalName: selected.name,
      taxId: selected.cif || 'No definido',
      billingEmail: selected.email || 'hq@hq.com',
      address: typeof selected.address === 'object' ? selected.address : { line1: selected.address || 'No definida' }
    };

    const dateObj = new Date(dueDate);

    try {
      const { adminInvoicesService } = await import('../../../../services/billing/adminInvoices');
      
      const result = await adminInvoicesService.createDraftInvoice(
        selected.id,
        selected.name,
        user.uid,
        snapshot,
        dateObj
      );

      if (result.success) {
        toast.success("Borrador creado correctamente");
        onSuccess(result.data);
      } else {
        toast.error("Error al crear borrador");
        console.error(result.error);
      }
    } catch (err) {
      console.error("Error creating draft", err);
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/20 backdrop-blur-sm p-4 md:p-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md flex flex-col animate-in zoom-in-95 duration-400 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
        

        {/* Header Minimal */}
        <div className="relative px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                  Nueva Factura
                </h2>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Apertura de Borrador</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all mechanical-press"
              title="Cerrar asistente"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-7 custom-scrollbar relative">
          
          {/* Franchise Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
              <Building2 className="w-4 h-4 text-indigo-500/80" />
              Franquicia
            </label>
            <div className="relative group">
              <select 
                id="franchise-select"
                title="Seleccionar franquicia"
                value={selectedFranchiseId}
                onChange={e => setSelectedFranchiseId(e.target.value)}
                className="w-full bg-white/50 dark:bg-slate-800/40 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl px-6 py-4.5 text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 shadow-sm"
              >
                <option value="" className="text-slate-400 bg-white dark:bg-slate-950">Seleccionar franquicia destino...</option>
                {franchises.map(f => (
                  <option key={f.id} value={f.id} className="bg-white dark:bg-slate-950">{f.name}</option>
                ))}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-indigo-500 transition-colors">
                <ChevronDown className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-3">
            <label htmlFor="due-date-input" className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
              <CalendarIcon className="w-4 h-4 text-indigo-500/80" />
              Fecha de Vencimiento
            </label>
            <div className="relative">
              <input 
                id="due-date-input"
                title="Fecha de vencimiento"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-white/50 dark:bg-slate-800/40 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl px-6 py-4.5 text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all hover:border-indigo-300 dark:hover:border-indigo-600 shadow-sm custom-calendar-icon"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Contextual Spark */}
          {selectedFranchiseId && (
            <div className="relative overflow-hidden rounded-3xl bg-indigo-500/5 border border-indigo-500/10 p-5 mt-2 animate-in slide-in-from-bottom-2 duration-500">
              <div className="flex gap-4 relative">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-indigo-900 dark:text-indigo-100 uppercase tracking-tight mb-1">
                    Instantánea Tributaria
                  </p>
                  <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 leading-relaxed font-medium">
                    Se generará un registro inmutable de los datos fiscales actuales de la franquicia para auditoría permanente.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Minimal */}
        <div className="px-8 py-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="flex-1 py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 transition-all mechanical-press"
              title="Cancelar operación"
            >
              Cancelar
            </button>
            <button 
              onClick={handleCreateDraft}
              disabled={loading || !selectedFranchiseId || !dueDate}
              className="flex-[2] py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 mechanical-press relative overflow-hidden group/btn"
              title="Aperturar factura borrador"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="relative z-10">Aperturar Borrador</span>
                  <CheckCircle2 className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
