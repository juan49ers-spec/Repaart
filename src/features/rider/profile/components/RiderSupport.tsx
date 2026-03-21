import React, { useState, useEffect } from 'react';
import { useRiderSupport } from '../../hooks/useRiderSupport';
import { MessageSquare, Plus, Loader2, Send, AlertCircle, Award, ChevronRight, X } from 'lucide-react';
import RiderSkills from './RiderSkills';

interface RiderSupportProps {
    skills?: string[];
}

const RiderSupport: React.FC<RiderSupportProps> = ({ skills = [] }) => {
    const { tickets, isLoading, error, fetchTickets, createTicket } = useRiderSupport();
    const [isCreating, setIsCreating] = useState(false);
    const [newTicket, setNewTicket] = useState<{
        subject: string;
        category: 'question' | 'technical' | 'billing' | 'skills';
        message: string;
    }>({
        subject: '',
        category: 'question',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTicket.subject || !newTicket.message) return;

        setIsSubmitting(true);
        try {
            await createTicket(newTicket.subject, newTicket.category, newTicket.message);
            setIsCreating(false);
            setNewTicket({ subject: '', category: 'question', message: '' });
        } catch {
            // Error managed by hook
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestSkill = () => {
        setNewTicket({
            subject: 'Solicitud de Nueva Habilidad',
            category: 'skills',
            message: 'Hola, me gustaría solicitar que se añada la siguiente habilidad a mi perfil:\n\n- Habilidad: '
        });
        setIsCreating(true);
    };

    if (isCreating) {
        return (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-5">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Nuevo Ticket</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">Soporte Operativo</p>
                    </div>
                    <button 
                        onClick={() => setIsCreating(false)}
                        className="p-2 bg-slate-100/50 text-slate-500 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-200/50"
                        title="Cancelar creación de ticket"
                        aria-label="Cancelar creación de ticket"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 ml-1">Asunto del problema</label>
                        <input
                            type="text"
                            value={newTicket.subject}
                            onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                            className="w-full px-5 py-3.5 bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all font-medium text-slate-800 shadow-sm"
                            placeholder="Ej: Problema con el arranque de la moto"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 ml-1">Categoría</label>
                            <select
                                id="ticket-category"
                                value={newTicket.category}
                                onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as 'question' | 'technical' | 'billing' | 'skills' })}
                                className="w-full px-5 py-3.5 bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all font-medium text-slate-800 appearance-none shadow-sm cursor-pointer"
                                aria-label="Categoría"
                            >
                                <option value="question">Pregunta General</option>
                                <option value="technical">Problema Técnico</option>
                                <option value="billing">Pagos / Facturación</option>
                                <option value="skills">Habilidades / Skills</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 ml-1">Descripción detallada</label>
                        <textarea
                            value={newTicket.message}
                            onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                            className="w-full px-5 py-3.5 bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all font-medium text-slate-800 min-h-[140px] resize-none shadow-sm"
                            placeholder="Cuéntanos qué sucede..."
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl font-semibold text-sm shadow-xl shadow-slate-200/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                        {isSubmitting ? 'Enviando Reporte...' : 'Enviar Ticket de Soporte'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {error && (
                <div className="p-4 bg-rose-50/80 backdrop-blur-sm border border-rose-200/60 rounded-2xl flex items-center gap-3 text-rose-600 animate-bounce">
                    <AlertCircle size={20} />
                    <p className="text-sm font-semibold">{error}</p>
                </div>
            )}

            {/* Skills Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <Award size={20} className="text-emerald-500" /> Mis Habilidades
                        </h3>
                        <p className="text-sm font-medium text-slate-500 mt-0.5">Certificaciones de Campo</p>
                    </div>
                    <button 
                        onClick={handleRequestSkill} 
                        className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-semibold text-xs border border-emerald-100 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                    >
                        Solicitar Nueva
                    </button>
                </div>
                <div className="bg-white/40 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] border border-slate-200/60 shadow-inner">
                    <RiderSkills skills={skills} />
                </div>
            </section>

            {/* Tickets Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <MessageSquare size={20} className="text-sky-500" /> Historial de Soporte
                        </h3>
                        <p className="text-sm font-medium text-slate-500 mt-0.5">Gestión de Incidencias</p>
                    </div>
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="p-2 bg-slate-900 text-white rounded-xl hover:bg-sky-500 transition-all shadow-lg shadow-slate-200"
                        title="Crear nuevo ticket"
                        aria-label="Crear nuevo ticket"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {isLoading && !tickets.length ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="animate-spin text-emerald-500" size={32} />
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white/40 backdrop-blur-md border border-slate-200/60 rounded-[2rem] shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-4">
                            <MessageSquare size={32} className="opacity-40" />
                        </div>
                        <p className="font-semibold text-sm">Sin tickets activos</p>
                        <p className="text-xs font-medium opacity-80 mt-1">Todo funciona correctamente</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {tickets.map((ticket) => (
                            <button 
                                key={ticket.id} 
                                className="w-full flex items-center justify-between p-4 sm:p-5 bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-2xl hover:border-sky-300/60 hover:shadow-lg hover:shadow-sky-500/5 transition-all group"
                            >
                                <div className="flex items-center gap-4 sm:gap-5">
                                    <div className={`
                                        w-12 h-12 rounded-[1rem] flex items-center justify-center transition-all border
                                        ${ticket.status === 'resolved' ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : 'bg-sky-50 border-sky-100 text-sky-500'}
                                    `}>
                                        <MessageSquare size={20} />
                                    </div>
                                    <div className="text-left">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium text-slate-400">
                                                {ticket.updatedAt?.toDate().toLocaleDateString() || 'Reciente'}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                                ticket.status === 'resolved' ? 'border-emerald-100 text-emerald-700 bg-emerald-50' : 'border-sky-100 text-sky-700 bg-sky-50'
                                            }`}>
                                                {ticket.status === 'resolved' ? 'Resuelto' : 'En Gestión'}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold text-slate-800 text-sm group-hover:text-sky-700 transition-colors">
                                            {ticket.subject}
                                        </h4>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-slate-300 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
                            </button>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default RiderSupport;

