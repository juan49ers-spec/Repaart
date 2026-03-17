import React, { useState, useEffect } from 'react';
import { useRiderSupport } from '../../hooks/useRiderSupport';
import { MessageSquare, Plus, Loader2, Send, AlertCircle, Award, ChevronRight, X } from 'lucide-react';
import RiderSkills from './RiderSkills';

interface RiderSupportProps {
    skills?: string[];
}

/**
 * RiderSupport: Rediseño "Clean Apple"
 * Sistema de soporte integrado con habilidades.
 * Enfoque en claridad de estados y facilidad de creación de tickets.
 */
export const RiderSupport: React.FC<RiderSupportProps> = ({ skills = [] }) => {
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
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Nuevo Ticket</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Soporte Operativo</p>
                    </div>
                    <button 
                        onClick={() => setIsCreating(false)}
                        className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all"
                        title="Cancelar creación de ticket"
                        aria-label="Cancelar creación de ticket"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Asunto del problema</label>
                        <input
                            type="text"
                            value={newTicket.subject}
                            onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-bold text-slate-800"
                            placeholder="Ej: Problema con el arranque de la moto"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Categoría</label>
                            <select
                                id="ticket-category"
                                value={newTicket.category}
                                onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as 'question' | 'technical' | 'billing' | 'skills' })}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-bold text-slate-800 appearance-none"
                                aria-label="Categoría"
                            >
                                <option value="question">Pregunta General</option>
                                <option value="technical">Problema Técnico</option>
                                <option value="billing">Pagos / Facturación</option>
                                <option value="skills">Habilidades / Skills</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Descripción detallada</label>
                        <textarea
                            value={newTicket.message}
                            onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-bold text-slate-800 min-h-[160px] resize-none"
                            placeholder="Cuéntanos qué sucede..."
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-5 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-200/50 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                        {isSubmitting ? 'Enviando Reporte...' : 'Enviar Ticket de Soporte'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-bounce">
                    <AlertCircle size={20} />
                    <p className="text-xs font-black uppercase tracking-tight">{error}</p>
                </div>
            )}

            {/* Skills Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                            <Award size={20} className="text-emerald-500" /> Mis Habilidades
                        </h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Certificaciones de Campo</p>
                    </div>
                    <button 
                        onClick={handleRequestSkill} 
                        className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
                    >
                        Solicitar Nueva
                    </button>
                </div>
                <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
                    <RiderSkills skills={skills} />
                </div>
            </section>

            {/* Tickets Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                            <MessageSquare size={20} className="text-sky-500" /> Historial de Soporte
                        </h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Gestión de Incidencias</p>
                    </div>
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-sky-500 transition-all shadow-lg shadow-slate-200"
                        title="Crear nuevo ticket"
                        aria-label="Crear nuevo ticket"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {isLoading && !tickets.length ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-emerald-500" size={32} />
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-300 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare size={32} className="opacity-20" />
                        </div>
                        <p className="font-black uppercase text-[10px] tracking-widest">Sin tickets activos</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">Todo funciona correctamente</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {tickets.map((ticket) => (
                            <button 
                                key={ticket.id} 
                                className="w-full flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-sky-200 hover:shadow-xl hover:shadow-sky-500/5 transition-all group group"
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`
                                        w-12 h-12 rounded-2xl flex items-center justify-center transition-all
                                        ${ticket.status === 'resolved' ? 'bg-emerald-50 text-emerald-500' : 'bg-sky-50 text-sky-500'}
                                    `}>
                                        <MessageSquare size={20} />
                                    </div>
                                    <div className="text-left">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                {ticket.updatedAt?.toDate().toLocaleDateString() || 'Reciente'}
                                            </span>
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                                ticket.status === 'resolved' ? 'border-emerald-100 text-emerald-600 bg-emerald-50/50' : 'border-sky-100 text-sky-600 bg-sky-50/50'
                                            }`}>
                                                {ticket.status === 'resolved' ? 'Resuelto' : 'En Gestión'}
                                            </span>
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase text-[11px] tracking-tight group-hover:text-sky-600 transition-colors">
                                            {ticket.subject}
                                        </h4>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-sky-400 group-hover:translate-x-2 transition-all" />
                            </button>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default RiderSupport;
