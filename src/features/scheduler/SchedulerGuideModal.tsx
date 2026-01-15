
import React from 'react';
import { X, Calendar, Zap, MousePointer2 } from 'lucide-react';

interface SchedulerGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SchedulerGuideModal: React.FC<SchedulerGuideModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
                {/* HEAD */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Guía Maestra del Programador</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Manual oficial para Franquicias</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">

                    {/* Intro */}
                    <div className="prose dark:prose-invert max-w-none">
                        <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                            Esta herramienta es tu <strong>centro de mando inteligente</strong>. No es solo un calendario, es el motor que optimiza tu operativa, reduce costes y asegura que tu flota esté siempre lista.
                        </p>
                    </div>

                    {/* Section 1: Features */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Zap className="text-amber-500" size={20} />
                                Acciones Rápidas
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                                    <span className="font-bold text-slate-900 dark:text-white min-w-[80px]">Crear:</span>
                                    <span>Doble click para insertar un turno rápido predefinido.</span>
                                </li>
                                <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                                    <span className="font-bold text-slate-900 dark:text-white min-w-[80px]">Duplicar:</span>
                                    <span>Usa <code>Ctrl + D</code> para clonar un turno al siguiente hueco.</span>
                                </li>
                                <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                                    <span className="font-bold text-slate-900 dark:text-white min-w-[80px]">Borrar:</span>
                                    <span>Tecla <code>Supr</code> o <code>Backspace</code> para eliminar al instante.</span>
                                </li>
                            </ul>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <MousePointer2 className="text-indigo-500" size={20} />
                                Menú Inteligente
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">Haz <strong>Click Derecho</strong> sobre cualquier turno:</p>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-2 text-xs font-medium">
                                <div className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-slate-800 rounded shadow-sm text-emerald-600">✅ Validar</div>
                                <div className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-slate-800 rounded shadow-sm text-slate-600 dark:text-slate-300">📑 Duplicar</div>
                                <div className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-slate-800 rounded shadow-sm text-slate-600 dark:text-slate-300">✏️ Editar</div>
                                <div className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-slate-800 rounded shadow-sm text-red-500">🗑️ Eliminar</div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Visual Dictionary */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Diccionario Visual</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                                <div className="h-2 w-full bg-gradient-to-r from-amber-400 to-amber-500 rounded mb-2 animate-pulse" />
                                <h4 className="font-bold text-sm text-amber-600 mb-1">Amarillo Zig-Zag</h4>
                                <p className="text-xs text-slate-500">Requiere atención. Cambios solicitados o incidencias.</p>
                            </div>
                            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                                <div className="h-2 w-full bg-rose-500 rounded mb-2" />
                                <h4 className="font-bold text-sm text-rose-600 mb-1">Línea Roja</h4>
                                <p className="text-xs text-slate-500">Hora actual. Indica quién debe estar trabajando ahora.</p>
                            </div>
                            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                                <div className="h-2 w-full bg-indigo-500/30 border-2 border-indigo-400/50 border-dashed rounded mb-2" />
                                <h4 className="font-bold text-sm text-indigo-500 mb-1">Ghost Snap</h4>
                                <p className="text-xs text-slate-500">Proyección fantasma al arrastrar para alinear con precisión.</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Tip */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 flex gap-4 items-start">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0">
                            <Zap size={20} fill="currentColor" />
                        </div>
                        <div>
                            <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm">Consejo Pro</h4>
                            <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">
                                Usa la <strong>Barra de Cobertura</strong> al final de la pantalla. Si ves tramos en rojo, significa que te faltan riders para cubrir el mínimo operativo de esa hora.
                            </p>
                        </div>
                    </div>

                </div>

                {/* FOOTER */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-white/90 transition-colors shadow-lg shadow-slate-200 dark:shadow-none"
                    >
                        Entendido, ¡a programar!
                    </button>
                </div>
            </div>
        </div>
    );
};
