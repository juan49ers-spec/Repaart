import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save as SaveIcon, X, Layout, Type, AlignLeft, Hash } from 'lucide-react';
import { AcademyModule } from '../../../../services/academyService';
import { cn } from '../../../../lib/utils';

interface ModuleEditorModalProps {
    isOpen: boolean;
    module: AcademyModule | null;
    onClose: () => void;
    onSave: (data: Partial<AcademyModule>) => Promise<void>;
    onChange: (data: Partial<AcademyModule>) => void;
}

const ModuleEditorModal: React.FC<ModuleEditorModalProps> = ({
    isOpen,
    module,
    onClose,
    onSave,
    onChange
}) => {
    if (!isOpen || !module) return null;

    const handleSave = async () => {
        if (!module.title?.trim()) {
            alert('El título es obligatorio');
            return;
        }
        if (!module.description?.trim()) {
            alert('La descripción es obligatoria');
            return;
        }
        try {
            await onSave(module);
        } catch (error) {
            console.error('[ModuleEditorModal] Error al guardar:', error);
            alert('Error al guardar el módulo');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                        <Layout className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                            Editar Módulo
                                        </h2>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase tracking-widest">
                                            Módulo {module.order}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    aria-label="Cerrar"
                                >
                                    <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-5">
                            {/* Order Number */}
                            <div>
                                <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                                    Orden
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                        <Hash className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                    </div>
                                    <input
                                        type="number"
                                        min="1"
                                        value={module.order}
                                        onChange={(e) => onChange({ order: parseInt(e.target.value) || 1 })}
                                        className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                                    Título
                                </label>
                                <input
                                    type="text"
                                    value={module.title}
                                    onChange={(e) => onChange({ title: e.target.value })}
                                    placeholder="Ej: Fundamentos de Logística"
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                                    Descripción
                                </label>
                                <textarea
                                    value={module.description}
                                    onChange={(e) => onChange({ description: e.target.value })}
                                    placeholder="Describe brevemente el contenido de este módulo..."
                                    rows={4}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600 leading-relaxed"
                                />
                            </div>

                            {/* Status Toggle */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <Type className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                            Estado de publicación
                                        </p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                            Borrador = no visible, Activo = visible
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onChange({ status: module.status === 'active' ? 'draft' : 'active' })}
                                    className={cn(
                                        "px-5 py-2.5 rounded-lg font-semibold text-xs uppercase tracking-wider transition-all flex items-center gap-2",
                                        module.status === 'active'
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                            : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700"
                                    )}
                                >
                                    {module.status === 'active' ? (
                                        <>
                                            <AlignLeft className="w-4 h-4" />
                                            Desactivar
                                        </>
                                    ) : (
                                        <>
                                            <Layout className="w-4 h-4" />
                                            Publicar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 rounded-lg font-semibold text-xs uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <SaveIcon className="w-4 h-4" />
                                Guardar Cambios
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ModuleEditorModal;
