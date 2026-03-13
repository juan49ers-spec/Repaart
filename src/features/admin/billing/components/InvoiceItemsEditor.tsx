import React from 'react';
import { AdminInvoiceItem as InvoiceItem } from '../../../../types/billing';
import { 
  Plus, 
  Trash2, 
  Calculator,
  ChevronDown,
  Tag
} from 'lucide-react';

interface InvoiceItemsEditorProps {
  items: InvoiceItem[];
  onChange: (items: InvoiceItem[]) => void;
  readOnly?: boolean;
}

export type AdminInvoiceItemCategory = 'royalty' | 'marketing' | 'consulting' | 'other';

const CATEGORIES: { value: AdminInvoiceItemCategory; label: string }[] = [
  { value: 'royalty', label: 'Royalties' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'consulting', label: 'Consuloría' },
  { value: 'other', label: 'Otros' }
];

export const InvoiceItemsEditor: React.FC<InvoiceItemsEditorProps> = ({ items, onChange, readOnly = false }) => {

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      category: 'other',
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 21,
      subtotal: 0,
      taxAmount: 0,
      total: 0
    };
    onChange([...items, newItem]);
  };

  const removeItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<InvoiceItem>) => {
    onChange(items.map(item => {
      if (item.id !== id) return item;
      
      const updated = { ...item, ...updates };

      // Recalcular líneas
      updated.subtotal = (updated.quantity || 0) * (updated.unitPrice || 0);
      updated.taxAmount = updated.subtotal * ((updated.taxRate || 21) / 100);
      updated.total = updated.subtotal + updated.taxAmount;

      return updated;
    }));
  };

  return (
    <div className="space-y-4">
      {/* Header Minimalista */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <Tag className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
            Líneas de Factura
          </span>
        </div>
        {!readOnly && (
          <button
            onClick={addItem}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-200 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Añadir Línea
          </button>
        )}
      </div>

      {/* Tabla / Lista Minimalista */}
      <div className="bg-white dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800/50 overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-50 dark:divide-slate-800/30">
          {items.length === 0 ? (
            <div className="px-6 py-12 text-center bg-slate-50/10 dark:bg-slate-900/5">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  <Calculator className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                    Esperando conceptos
                  </p>
                  <p className="text-[10px] text-slate-400/60 dark:text-slate-600">
                    Añade un concepto para comenzar la liquidación
                  </p>
                </div>
              </div>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="group relative hover:bg-slate-50/50 dark:hover:bg-indigo-500/5 transition-all duration-300">
                <div className="flex items-center gap-6 px-6 py-5">
                  {/* Categoría - Selector Minimal */}
                  <div className="relative flex-shrink-0 w-36">
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-indigo-400 transition-colors" />
                    <select
                      disabled={readOnly}
                      value={item.category}
                      onChange={(e) => updateItem(item.id, { category: e.target.value as AdminInvoiceItemCategory })}
                      className="w-full appearance-none bg-slate-100/50 dark:bg-slate-800/30 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-xl px-4 py-2.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all cursor-pointer pr-10"
                      title="Seleccionar categoría"
                      aria-label="Categoría del concepto"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Descripción - Input Minimal */}
                  <div className="flex-1 min-w-0">
                    <input
                      readOnly={readOnly}
                      type="text"
                      placeholder="Descripción del cargo financiero..."
                      value={item.description}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      className="w-full bg-transparent border-none p-0 text-[13px] font-bold text-slate-800 dark:text-slate-100 focus:ring-0 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 transition-all"
                    />
                  </div>

                  {/* Precio & Cantidad Grouped */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center bg-slate-100/50 dark:bg-slate-800/30 border border-transparent rounded-xl h-11 px-1 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-slate-200 dark:focus-within:border-slate-700 transition-all">
                      <div className="flex items-center px-2">
                        <span className="text-[9px] font-black text-slate-400 mr-2">CANT.</span>
                        <input
                          readOnly={readOnly}
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                          className="w-10 bg-transparent border-none text-[12px] text-center font-black text-slate-800 dark:text-white focus:ring-0 outline-none tabular-nums"
                          title="Cantidad"
                          aria-label="Cantidad"
                        />
                      </div>
                      <div className="w-px h-5 bg-slate-200 dark:bg-slate-700/50 mx-1" />
                      <div className="flex items-center px-3">
                        <input
                          readOnly={readOnly}
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                          className="w-20 bg-transparent border-none text-[13px] text-right font-mono font-black text-slate-900 dark:text-white focus:ring-0 outline-none tabular-nums"
                          placeholder="0.00"
                        />
                        <span className="text-[11px] font-black text-slate-400 ml-2">€</span>
                      </div>
                    </div>
                  </div>

                  {/* Total Linea */}
                  <div className="flex-shrink-0 w-28 text-right">
                    <div className="text-[15px] font-mono font-black text-slate-950 dark:text-white tabular-nums tracking-tighter">
                      {item.total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-tighter">
                      IVA {item.taxRate}% INC.
                    </div>
                  </div>

                  {/* Acción rápida */}
                  {!readOnly && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2.5 text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                      title="Eliminar concepto"
                      aria-label="Eliminar concepto"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// export default InvoiceItemsEditor;
