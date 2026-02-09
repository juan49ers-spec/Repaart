import React, { useState, useEffect } from 'react';
import { useRiderSupport } from '../../hooks/useRiderSupport';
import { Badge } from '../../../../components/ui/primitives/Badge';
import { Card } from '../../../../components/ui/primitives/Card';
import { Button } from '../../../../components/ui/primitives/Button';
import { MessageSquare, Plus, Loader2, Send, AlertCircle, Award } from 'lucide-react';
import RiderSkills from './RiderSkills';

interface RiderSupportProps {
    skills?: string[];
}

export const RiderSupport: React.FC<RiderSupportProps> = ({ skills = [] }) => {
    const { tickets, isLoading, error, fetchTickets, createTicket } = useRiderSupport();
    const [isCreating, setIsCreating] = useState(false);
    const [newTicket, setNewTicket] = useState({
        subject: '',
        category: 'question' as const,
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
        } catch (err) {
            // Error handled in hook
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestSkill = () => {
        setNewTicket({
            subject: 'Solicitud de Nueva Habilidad',
            category: 'skills' as any,
            message: 'Hola, me gustaría solicitar que se añada la siguiente habilidad a mi perfil:\n\n- Habilidad: '
        });
        setIsCreating(true);
    };

    // Removed early return for loading to show Skills section immediately

    if (isCreating) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Nuevo Ticket</h3>
                    <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                        Cancelar
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Asunto</label>
                        <input
                            type="text"
                            value={newTicket.subject}
                            onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                            placeholder="Resumen del problema..."
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Categoría</label>
                        <select
                            value={newTicket.category}
                            onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as any })}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium appearance-none"
                        >
                            <option value="question">Pregunta General</option>
                            <option value="technical">Problema Técnico</option>
                            <option value="billing">Pagos / Facturación</option>
                            <option value="skills">Habilidades / Skills</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Mensaje</label>
                        <textarea
                            value={newTicket.message}
                            onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium min-h-[150px] resize-none"
                            placeholder="Describe tu consulta en detalle..."
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                    >
                        {isSubmitting ? (
                            <Loader2 className="animate-spin mr-2" size={20} />
                        ) : (
                            <Send className="mr-2" size={20} />
                        )}
                        {isSubmitting ? 'Enviando...' : 'Enviar Ticket'}
                    </Button>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3 text-rose-600 dark:text-rose-400">
                    <AlertCircle size={20} />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Skills Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Award size={16} /> Mis Habilidades
                    </h3>
                    <Button variant="ghost" size="sm" onClick={handleRequestSkill} className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                        <Plus size={16} className="mr-1" />
                        Solicitar Nueva
                    </Button>
                </div>
                <div className="bg-white dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                    <RiderSkills skills={skills} />
                </div>
            </div>

            {/* Tickets Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <MessageSquare size={16} /> Mis Tickets
                    </h3>
                    <Button variant="secondary" size="sm" onClick={() => setIsCreating(true)}>
                        <Plus size={16} className="mr-1" />
                        Nuevo
                    </Button>
                </div>

                {isLoading && !tickets.length ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-emerald-500" size={32} />
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <MessageSquare size={48} className="mb-4 opacity-20" />
                        <p className="text-sm font-medium">No tienes tickets abiertos</p>
                        <p className="text-xs opacity-60 mt-1">Si tienes dudas, crea un nuevo ticket</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tickets.map((ticket) => (
                            <Card key={ticket.id} className="p-4 hover:border-emerald-500/30 transition-colors cursor-pointer group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <Badge intent={
                                            ticket.status === 'resolved' ? 'success' :
                                                ticket.status === 'in_progress' ? 'info' :
                                                    ticket.category === 'skills' ? 'accent' : 'warning'
                                        } size="sm">
                                            {ticket.status === 'resolved' ? 'Resuelto' :
                                                ticket.status === 'in_progress' ? 'En Progreso' :
                                                    ticket.category === 'skills' ? 'Habilidades' : 'Abierto'}
                                        </Badge>
                                        <span className="text-xs text-slate-400">
                                            {ticket.updatedAt?.toDate().toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1 group-hover:text-emerald-500 transition-colors">
                                    {ticket.subject}
                                </h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                    {ticket.message}
                                </p>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RiderSupport;
