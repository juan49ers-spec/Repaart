import React from 'react';
import {
    FileText, Lock, Unlock, Trash2, CheckCircle, X,
    Clock, RefreshCw, Bell, ShieldAlert
} from 'lucide-react';

interface FinancialWorkflowGuideProps {
    isOpen: boolean;
    onClose: () => void;
}

const FinancialWorkflowGuide: React.FC<FinancialWorkflowGuideProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="relative z-[100]">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto animate-in zoom-in-95 duration-300">

                    {/* Header */}
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                    <FileText className="w-6 h-6" />
                                </div>
                                Guía de Gestión Financiera
                            </h2>
                            <p className="text-sm text-slate-500 mt-1 ml-14">
                                Domina el ciclo de vida de tus cierres: Creación, Bloqueo y Modificación.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors z-10"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-indigo-50/50 to-transparent pointer-events-none" />
                    </div>

                    {/* Scrollable Body */}
                    <div className="p-0 overflow-y-auto flex-1 bg-slate-50/50">

                        <div className="p-8 space-y-10">

                            {/* SECTION 1: VISUAL LIFECYCLE */}
                            <section>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Ciclo de Vida Mensual
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* STATE: OPEN */}
                                    <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <FileText className="w-24 h-24 text-emerald-600" />
                                        </div>
                                        <div className="relative z-10">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 mb-4">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                1. ABIERTO
                                            </span>
                                            <h4 className="font-bold text-slate-900 mb-2">Modo Borrador</h4>
                                            <p className="text-sm text-slate-600 leading-relaxed mb-4">
                                                El mes está activo. Puedes registrar ingresos, ajustar gastos y guardar cambios tantas veces como necesites.
                                            </p>
                                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 p-3 rounded-lg">
                                                <CheckCircle className="w-4 h-4" />
                                                Acceso Total: Editar y Borrar
                                            </div>
                                        </div>
                                    </div>

                                    {/* STATE: ACTION */}
                                    <div className="flex items-center justify-center py-4 md:py-0">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <div className="w-px h-8 bg-slate-300 md:hidden" />
                                            <div className="h-px w-16 bg-slate-300 hidden md:block" />
                                            <span className="text-xs font-bold uppercase tracking-wider bg-slate-200 px-2 py-1 rounded text-slate-600">
                                                Al Cerrar Mes
                                            </span>
                                            <div className="h-px w-16 bg-slate-300 hidden md:block" />
                                            <div className="w-px h-8 bg-slate-300 md:hidden" />
                                        </div>
                                    </div>

                                    {/* STATE: LOCKED */}
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                                        <div className="absolute top-0 right-0 p-4 opacity-5">
                                            <Lock className="w-24 h-24 text-slate-900" />
                                        </div>
                                        <div className="relative z-10">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 mb-4">
                                                <Lock className="w-3 h-3" />
                                                2. CERRADO
                                            </span>
                                            <h4 className="font-bold text-slate-900 mb-2">Solo Lectura</h4>
                                            <p className="text-sm text-slate-600 leading-relaxed mb-4">
                                                La información se ha enviado y procesado. Para garantizar la integridad contable, el mes se bloquea.
                                            </p>
                                            <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <ShieldAlert className="w-4 h-4 shrink-0 text-slate-400" />
                                                <span>No puedes editar ni borrar sin autorización previa.</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <hr className="border-slate-200" />

                            {/* SECTION 2: HOW TO FIX MISTAKES */}
                            <section>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4" /> ¿Te has equivocado? Solicitar Cambios
                                </h3>

                                <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
                                    <div className="grid grid-cols-1 md:grid-cols-2">

                                        {/* SCENARIO A: EDIT */}
                                        <div className="p-6 md:border-r border-slate-100">
                                            <h4 className="text-base font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                                <Unlock className="w-5 h-5 text-indigo-500" />
                                                Caso A: Quiero Corregir un Dato
                                            </h4>
                                            <div className="space-y-4">
                                                <div className="flex gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                                                    <p className="text-sm text-slate-600">
                                                        Busca el mes en la tabla y pulsa el botón <strong className="text-slate-800">Solicitar Desbloqueo</strong> (icono <Unlock className="w-3 h-3 inline" />).
                                                    </p>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                                                    <p className="text-sm text-slate-600">
                                                        Explica el motivo (ej: "Olvidé subir la factura de la luz").
                                                    </p>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                                                    <p className="text-sm text-slate-600">
                                                        El Administrador revisará tu solicitud. Si la aprueba, recibirás una <strong className="text-indigo-600">Notificación</strong> y el mes se abrirá de nuevo.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SCENARIO B: DELETE */}
                                        <div className="p-6 bg-rose-50/30">
                                            <h4 className="text-base font-bold text-rose-900 mb-4 flex items-center gap-2">
                                                <Trash2 className="w-5 h-5 text-rose-500" />
                                                Caso B: Quiero Borrar el Mes
                                            </h4>
                                            <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm">
                                                <p className="text-sm text-slate-600 mb-3">
                                                    Por seguridad, <strong className="text-rose-600">no puedes borrar un mes cerrado</strong> directamente.
                                                </p>
                                                <p className="text-sm text-slate-700 font-medium mb-2">Pasos a seguir:</p>
                                                <ul className="space-y-2">
                                                    <li className="flex items-start gap-2 text-xs text-slate-600">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5" />
                                                        Contacta al soporte o administrador.
                                                    </li>
                                                    <li className="flex items-start gap-2 text-xs text-slate-600">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5" />
                                                        El administrador puede borrarlo por ti (recibirás una alerta).
                                                    </li>
                                                    <li className="flex items-start gap-2 text-xs text-slate-600">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5" />
                                                        O puede desbloquearlo para que lo borres tú manualmente.
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </section>

                            {/* SECTION 3: NOTIFICATIONS */}
                            <section>
                                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex gap-4 items-start">
                                    <div className="p-3 bg-white rounded-xl shadow-sm border border-blue-50 text-blue-500">
                                        <Bell className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-blue-900 mb-1">Sistema de Notificaciones</h4>
                                        <p className="text-sm text-blue-800/80 leading-relaxed mb-3">
                                            No necesitas estar pendiente refrescando la página. El sistema te avisará automáticamente:
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 bg-white/50 px-3 py-2 rounded-lg border border-blue-100">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                Solicitud Aprobada
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 bg-white/50 px-3 py-2 rounded-lg border border-blue-100">
                                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                                Solicitud Rechazada
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 bg-white/50 px-3 py-2 rounded-lg border border-blue-100">
                                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                                Mes Eliminado por Admin
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-5 border-t border-slate-200 bg-white flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-900/20 active:scale-95"
                        >
                            Entendido, ¡Gracias!
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialWorkflowGuide;
