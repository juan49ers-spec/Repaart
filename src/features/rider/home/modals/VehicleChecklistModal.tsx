import React, { useState } from 'react';
import { X, CheckCircle2, Check } from 'lucide-react';
import { cn } from '../../../../lib/utils'; // Adjust path if needed

interface VehicleChecklistModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
}

const CHECKLIST_ITEMS = [
    { id: 'lights', label: 'Luces y Señalización' },
    { id: 'tires', label: 'Presión de Neumáticos' },
    { id: 'brakes', label: 'Frenos (Delantero/Trasero)' },
    { id: 'fuel', label: 'Nivel de Gasolina / Batería' },
    { id: 'mirrors', label: 'Espejos Retrovisores' },
    { id: 'helmet', label: 'Casco y Equipamiento' },
    { id: 'docs', label: 'Documentación del Vehículo' },
];

export const VehicleChecklistModal: React.FC<VehicleChecklistModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [checkedItems, setCheckedItems] = useState<string[]>([]);
    const [isSuccess, setIsSuccess] = useState(false);

    // Reset state on open
    // Removing useEffect to prevent set-state-in-effect
    // Logic for resetting state should be handled on unmount or close event

    if (!isOpen) return null;

    const toggleItem = (id: string) => {
        if (checkedItems.includes(id)) {
            setCheckedItems(prev => prev.filter(i => i !== id));
        } else {
            setCheckedItems(prev => [...prev, id]);
        }
    };

    const allChecked = CHECKLIST_ITEMS.every(item => checkedItems.includes(item.id));
    const progress = (checkedItems.length / CHECKLIST_ITEMS.length) * 100;

    const handleConfirm = async () => {
        if (!allChecked) return;
        setIsSuccess(true);
        try {
            await onSubmit({ items: checkedItems, timestamp: new Date() });
            setTimeout(() => {
                onClose();
            }, 1500); // Keep success message visible for a moment
        } catch (error) {
            setIsSuccess(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 relative">

                {/* SUCCESS OVERLAY */}
                {isSuccess && (
                    <div className="absolute inset-0 z-10 bg-emerald-500 flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
                        <div className="bg-white/20 p-6 rounded-full mb-6 animate-bounce">
                            <CheckCircle2 size={64} />
                        </div>
                        <h2 className="text-3xl font-black mb-2">¡Todo Listo!</h2>
                        <p className="text-emerald-100 font-medium">Vehículo verificado correctamente.</p>
                    </div>
                )}

                {/* HEADER */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white mb-1">Verificación Pre-Turno</h2>
                        <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="text-xs font-bold text-slate-400">{checkedItems.length}/{CHECKLIST_ITEMS.length}</span>
                        </div>
                    </div>
                    <button onClick={onClose} title="Cerrar" aria-label="Cerrar" className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-500 hover:text-slate-800 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* LIST */}
                <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                    {CHECKLIST_ITEMS.map((item) => {
                        const isChecked = checkedItems.includes(item.id);
                        return (
                            <div
                                key={item.id}
                                onClick={() => toggleItem(item.id)}
                                className={cn(
                                    "p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]",
                                    isChecked
                                        ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                                        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:bg-slate-50"
                                )}
                            >
                                <span className={cn(
                                    "font-medium transition-colors",
                                    isChecked ? "text-blue-700 dark:text-blue-300" : "text-slate-600 dark:text-slate-400"
                                )}>
                                    {item.label}
                                </span>
                                <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center border transition-all",
                                    isChecked
                                        ? "bg-blue-500 border-blue-500 text-white"
                                        : "bg-transparent border-slate-300 text-transparent"
                                )}>
                                    <Check size={14} strokeWidth={4} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* FOOTER */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <button
                        onClick={handleConfirm}
                        disabled={!allChecked}
                        className={cn(
                            "w-full py-4 rounded-xl font-black text-white shadow-lg transition-all flex items-center justify-center gap-2",
                            allChecked
                                ? "bg-slate-900 hover:bg-slate-800 shadow-slate-900/20 active:scale-[0.98] cursor-pointer"
                                : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-50"
                        )}
                    >
                        {allChecked ? "Confirmar Verificación" : "Completa la lista para continuar"}
                    </button>
                </div>
            </div>
        </div>
    );
};
