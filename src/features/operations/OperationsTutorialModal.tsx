import React from 'react';
import { X, Users, Calendar, ArrowRight, Link } from 'lucide-react';

interface OperationsTutorialModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const OperationsTutorialModal: React.FC<OperationsTutorialModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">¿Cómo funciona el Centro de Operaciones?</h2>
                        <p className="text-slate-500">Guía rápida de 3 pasos para organizar tu flota.</p>
                    </div>
                    <button onClick={onClose} title="Cerrar tutorial" className="text-slate-400 hover:text-slate-700 transition-colors">
                        <X size={32} />
                    </button>
                </div>

                {/* Steps Container */}
                <div className="p-8 overflow-y-auto custom-scrollbar space-y-12 bg-slate-50">

                    {/* STEP 1 */}
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="flex-shrink-0 w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-2xl border border-blue-200">
                            1
                        </div>
                        <div className="flex-1 space-y-2 text-center md:text-left">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center justify-center md:justify-start gap-2">
                                <Users size={20} /> Registra tu Equipo
                            </h3>
                            <p className="text-slate-600">
                                Primero, ve a las pestañas <b>&quot;Gestión Riders&quot;</b> y <b>&quot;Gestión Motos&quot;</b>.
                                Crea tus perfiles. Si no tienes riders ni motos, ¡no puedes asignarlos!
                            </p>
                        </div>
                        <div className="w-full md:w-1/3 bg-white p-4 rounded-lg border border-slate-200 shadow-sm opacity-90">
                            <div className="flex gap-2 mb-2">
                                <div className="h-2 w-20 bg-slate-200 rounded" />
                            </div>
                            <div className="space-y-2">
                                <div className="h-8 bg-slate-100 rounded w-full" />
                                <div className="h-8 bg-slate-100 rounded w-full" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center text-slate-300"><ArrowRight className="rotate-90 md:rotate-0" size={32} /></div>

                    {/* STEP 2 */}
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="flex-shrink-0 w-16 h-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-2xl border border-purple-200">
                            2
                        </div>
                        <div className="flex-1 space-y-2 text-center md:text-left">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center justify-center md:justify-start gap-2">
                                <Calendar size={20} /> Ve al Planificador
                            </h3>
                            <p className="text-slate-600">
                                Abre la pestaña <b>&quot;Planificador&quot;</b>. Aquí verás tu semana.
                                Haz <b>Click en cualquier columna (día)</b> o usa el botón &quot;Añadir Turno&quot;.
                            </p>
                        </div>
                        <div className="w-full md:w-1/3 bg-white p-4 rounded-lg border border-slate-200 shadow-sm opacity-90 grid grid-cols-3 gap-1">
                            <div className="bg-slate-100 h-20 rounded" />
                            <div className="bg-slate-100 h-20 rounded border-2 border-purple-200" />
                            <div className="bg-slate-100 h-20 rounded" />
                        </div>
                    </div>

                    <div className="flex justify-center text-slate-300"><ArrowRight className="rotate-90 md:rotate-0" size={32} /></div>

                    {/* STEP 3 */}
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="flex-shrink-0 w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-2xl border border-emerald-200">
                            3
                        </div>
                        <div className="flex-1 space-y-2 text-center md:text-left">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center justify-center md:justify-start gap-2">
                                <Link size={20} /> Crea el Vínculo (El Turno)
                            </h3>
                            <p className="text-slate-600">
                                El sistema te preguntará:
                                <ul className="list-disc list-inside mt-2 text-slate-500">
                                    <li>¿Quién trabaja? (Eliges al Rider)</li>
                                    <li>¿Qué vehículo usa? (Eliges la Moto)</li>
                                    <li>¿De qué hora a qué hora?</li>
                                </ul>
                                <br />
                                Al guardar, <b>has vinculado al Rider con la Moto</b> para ese horario específico.
                            </p>
                        </div>
                        <div className="w-full md:w-1/3 bg-white p-4 rounded-lg border border-slate-200 shadow-sm opacity-90 flex flex-col gap-2">
                            <div className="h-8 bg-blue-50 border border-blue-100 rounded flex items-center px-2 text-xs text-blue-700">Rider: Juan Pérez</div>
                            <div className="h-8 bg-orange-50 border border-orange-100 rounded flex items-center px-2 text-xs text-orange-700">Moto: 1234 ABC</div>
                            <div className="h-8 bg-emerald-600 text-white font-bold rounded flex items-center justify-center text-sm shadow-md shadow-emerald-500/20">GUARDAR</div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-slate-200 flex justify-center">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all text-lg"
                    >
                        ¡Entendido!
                    </button>
                </div>

            </div>
        </div>
    );
};

export default OperationsTutorialModal;
