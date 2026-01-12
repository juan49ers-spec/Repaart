import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext'; // Verify path
import { supportService, SupportTicket, PremiumRequest } from '../../support/SupportService'; // Verify Import
import { notificationService } from '../../../services/notificationService';
import { MessageSquare, Star, Plus, Clock } from 'lucide-react';

const SERVICES_CATALOG = [
    {
        id: 'audit_advanced',
        name: 'Auditoría Avanzada',
        description: 'Análisis profundo de tus métricas operativas por un experto.',
        price: 'Consultar',
        icon: '📊'
    },
    {
        id: 'finance_consulting',
        name: 'Consultoría Financiera',
        description: 'Optimización de márgenes y costes con nuestro CFO.',
        price: 'Consultar',
        icon: '💰'
    },
    {
        id: 'marketing_boost',
        name: 'Impulso de Marketing',
        description: 'Campaña local para aumentar la visibilidad de tu franquicia.',
        price: 'Consultar',
        icon: '🚀'
    }
];

const SupportDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'tickets' | 'premium'>('tickets');
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [premiumRequests, setPremiumRequests] = useState<PremiumRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // New Ticket Form State
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [newTicket, setNewTicket] = useState({ subject: '', message: '', category: 'technical', priority: 'normal' });

    useEffect(() => {
        if (user?.uid) { // Use Franchise ID logic if user.uid is not enough
            loadData();
        }
    }, [user, activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Assume user has franchiseId or use user.uid as identifier for now
            // Ideally use user.franchiseId
            const fId = (user as any).franchiseId || user?.uid;

            if (activeTab === 'tickets') {
                const data = await supportService.getTickets(fId);
                setTickets(data);
            } else {
                const data = await supportService.getPremiumRequests(fId);
                setPremiumRequests(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async () => {
        const fId = (user as any).franchiseId || user?.uid;
        // Need franchise Name ideally
        const fName = (user as any).franchiseName || 'Mi Franquicia';

        await supportService.createTicket({
            franchiseId: fId,
            franchiseName: fName,
            subject: newTicket.subject,
            message: newTicket.message,
            category: newTicket.category as any,
            priority: newTicket.priority as any
        });

        // Notify Admin
        await notificationService.notify(
            'SUPPORT_TICKET',
            fId,
            fName,
            {
                title: 'Nuevo Ticket de Soporte',
                message: `${fName} ha creado un ticket: ${newTicket.subject}`,
                priority: newTicket.priority === 'high' ? 'high' : 'normal',
                metadata: { franchiseId: fId }
            }
        );

        setIsTicketModalOpen(false);
        setNewTicket({ subject: '', message: '', category: 'technical', priority: 'normal' });
        loadData();
    };

    const handleRequestService = async (service: typeof SERVICES_CATALOG[0]) => {
        const fId = (user as any).franchiseId || user?.uid;
        const fName = (user as any).franchiseName || 'Mi Franquicia';

        if (confirm(`¿Deseas solicitar el servicio: ${service.name}?`)) {
            await supportService.requestPremiumService({
                franchiseId: fId,
                franchiseName: fName,
                serviceId: service.id,
                serviceName: service.name,
            });

            // Notify Admin
            await notificationService.notify(
                'PREMIUM_SERVICE_REQUEST',
                fId,
                fName,
                {
                    title: 'Solicitud Servicio Premium',
                    message: `${fName} solicita: ${service.name}`,
                    priority: 'normal',
                    metadata: { franchiseId: fId, serviceName: service.name }
                }
            );

            alert("Solicitud enviada correctamente.");
            loadData();
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ayuda y Servicios</h1>
                    <p className="text-slate-500 mt-2">Gestiona tus consultas y accede a servicios exclusivos.</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('tickets')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'tickets' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
                    >
                        <MessageSquare className="w-4 h-4" /> Tickets
                    </button>
                    <button
                        onClick={() => setActiveTab('premium')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'premium' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500 hover:text-amber-600'}`}
                    >
                        <Star className="w-4 h-4" /> Servicios Premium
                    </button>
                </div>
            </div>

            {activeTab === 'tickets' && (
                <div className="animate-in fade-in duration-300">
                    <div className="flex justify-end mb-4">
                        <button onClick={() => setIsTicketModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-200">
                            <Plus className="w-4 h-4" /> Nuevo Ticket
                        </button>
                    </div>

                    <div className="space-y-4">
                        {loading ? <p className="text-center text-slate-400">Cargando...</p> : tickets.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="font-bold text-slate-900">No tienes tickets abiertos</p>
                                <p className="text-sm text-slate-500">Si tienes dudas, estamos aquí para ayudarte.</p>
                            </div>
                        ) : tickets.map(ticket => (
                            <div key={ticket.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${ticket.status === 'resolved' ? 'bg-emerald-500' : ticket.priority === 'high' ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${ticket.status === 'open' ? 'bg-indigo-50 text-indigo-600' : ticket.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {ticket.status === 'open' ? 'Abierto' : ticket.status === 'resolved' ? 'Resuelto' : 'En Progreso'}
                                            </span>
                                            <span className="text-xs text-slate-400 font-medium">#{ticket.id?.slice(0, 6)}</span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-lg">{ticket.subject}</h3>
                                        <p className="text-slate-600 text-sm mt-1 line-clamp-2">{ticket.message}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-slate-400 block mb-1">Actualizado hace X</span>
                                        {/* Status Badge */}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'premium' && (
                <div className="animate-in fade-in duration-300 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Active Requests Tracker */}
                    <div className="col-span-full mb-4">
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Solicitudes en Curso</h3>
                        {loading ? <p className="text-slate-400 text-sm">Cargando...</p> : premiumRequests.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">No tienes solicitudes activas.</p>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {premiumRequests.map(req => (
                                    <div key={req.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">{req.serviceName}</p>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">{req.status}</p>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {SERVICES_CATALOG.map(service => (
                        <div key={service.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 font-mono text-6xl group-hover:scale-110 transition-transform select-none">{service.icon}</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{service.name}</h3>
                            <p className="text-slate-500 text-sm mb-6 leading-relaxed">{service.description}</p>

                            <div className="flex items-center justify-between mt-auto">
                                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{service.price}</span>
                                <button onClick={() => handleRequestService(service)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-slate-200">
                                    Solicitar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* New Ticket Modal (Simplified for brevity, ideally a separate component) */}
            {isTicketModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-4">Nuevo Ticket</h2>
                        <input
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mb-3 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Asunto"
                            value={newTicket.subject}
                            onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                        />
                        <textarea
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-sm min-h-[120px] focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                            placeholder="Describe tu problema..."
                            value={newTicket.message}
                            onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIsTicketModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg">Cancelar</button>
                            <button onClick={handleCreateTicket} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">Enviar Ticket</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportDashboard;
