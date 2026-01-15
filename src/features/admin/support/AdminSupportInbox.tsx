import { useState, useEffect, useCallback } from 'react';
import { supportService, SupportTicket, PremiumRequest } from '../../support/SupportService';
import { notificationService } from '../../../services/notificationService';
import { MessageSquare, Star, Reply, CheckCircle2, XCircle } from 'lucide-react';
import { formatTimeAgo } from '../../../utils/dateHelpers';

const AdminSupportInbox = () => {
    const [activeTab, setActiveTab] = useState<'tickets' | 'premium'>('tickets');
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [premiumRequests, setPremiumRequests] = useState<PremiumRequest[]>([]);

    // Reply State
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyMesssage, setReplyMessage] = useState('');

    const loadData = useCallback(async () => {
        if (activeTab === 'tickets') {
            const data = await supportService.getAllTicketsForAdmin();
            setTickets(data);
        } else {
            const data = await supportService.getAllPremiumRequests();
            setPremiumRequests(data);
        }
    }, [activeTab]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleReply = async (ticketId: string) => {
        if (!replyMesssage.trim()) return;

        await supportService.replyToTicket(ticketId, {
            senderId: 'admin',
            senderName: 'Soporte Admin',
            message: replyMesssage,
            isAdmin: true
        });

        // Notify Franchise about the reply
        // We need the franchiseId from the ticket, sadly we only have ticketId here.
        // But we have the 'tickets' state array!
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket && ticket.franchiseId) {
            await notificationService.notifyFranchise(ticket.franchiseId, {
                title: 'Nueva Respuesta en Soporte',
                message: `Admin ha respondido a tu ticket: ${ticket.subject}`,
                type: 'SUPPORT_TICKET',
                link: '/support' // Or relevant path
            });
        }

        setReplyingTo(null);
        setReplyMessage('');
        loadData(); // Refresh
    };

    const handleUpdatePremiumStatus = async (reqId: string, status: PremiumRequest['status']) => {
        await supportService.updatePremiumStatus(reqId, status);

        // Notify Franchise about status change
        const request = premiumRequests.find(r => r.id === reqId);
        if (request && request.franchiseId) {
            await notificationService.notifyFranchise(request.franchiseId, {
                title: `Solicitud Premium ${status === 'approved' ? 'Aprobada' : 'Rechazada'}`,
                message: `Tu solicitud para ${request.serviceName} ha sido ${status === 'approved' ? 'aprobada' : 'rechazada'}.`,
                type: 'PREMIUM_SERVICE_REQUEST',
                priority: status === 'approved' ? 'high' : 'normal',
                link: '/support'
            });
        }

        loadData();
    };

    return (
        <div className="h-full bg-slate-50 p-6 flex flex-col overflow-hidden">
            <header className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Centro de Soporte</h1>
                    <p className="text-slate-500 text-sm">Gestiona tickets y solicitudes de servicio.</p>
                </div>

                <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex">
                    <button
                        onClick={() => setActiveTab('tickets')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'tickets' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-indigo-600'}`}
                    >
                        <MessageSquare className="w-4 h-4" /> Tickets
                        {tickets.filter(t => t.status === 'open').length > 0 && (
                            <span className="bg-rose-500 text-white text-[10px] px-1.5 rounded-full">{tickets.filter(t => t.status === 'open').length}</span>
                        )}
                    </button>
                    <div className="w-px bg-slate-100 mx-1" />
                    <button
                        onClick={() => setActiveTab('premium')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'premium' ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:text-amber-600'}`}
                    >
                        <Star className="w-4 h-4" /> Premium
                        {premiumRequests.filter(r => r.status === 'pending').length > 0 && (
                            <span className="bg-amber-500 text-white text-[10px] px-1.5 rounded-full">{premiumRequests.filter(r => r.status === 'pending').length}</span>
                        )}
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {activeTab === 'tickets' && (
                    <div className="space-y-4">
                        {tickets.map(ticket => (
                            <div key={ticket.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                                <div className="flex justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                                        <span className="font-bold text-slate-900">{ticket.franchiseName || 'Franquicia Desconocida'}</span>
                                        <span className="text-xs text-slate-400">• {formatTimeAgo(ticket.createdAt?.toDate())}</span>
                                    </div>
                                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded-md uppercase">{ticket.category}</span>
                                </div>

                                <h3 className="font-bold text-lg mb-2">{ticket.subject}</h3>
                                <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">{ticket.message}</p>

                                {/* Quick Reply Area */}
                                {replyingTo === ticket.id ? (
                                    <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                        <textarea
                                            className="w-full p-3 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none mb-2 bg-indigo-50/30"
                                            placeholder="Escribe tu respuesta..."
                                            rows={3}
                                            value={replyMesssage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setReplyingTo(null)} className="text-xs font-bold text-slate-500 px-3 py-2">Cancelar</button>
                                            <button onClick={() => handleReply(ticket.id!)} className="text-xs font-bold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Enviar Respuesta</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-end">
                                        <button onClick={() => setReplyingTo(ticket.id!)} className="flex items-center gap-2 text-indigo-600 font-bold text-xs hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors">
                                            <Reply className="w-4 h-4" /> Responder
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'premium' && (
                    <div className="grid gap-4">
                        {premiumRequests.map(req => (
                            <div key={req.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-slate-900">{req.franchiseName}</span>
                                        <span className="text-xs text-slate-400">• {formatTimeAgo(req.createdAt?.toDate())}</span>
                                    </div>
                                    <p className="text-lg font-bold text-indigo-900">{req.serviceName}</p>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1 flex items-center gap-1">
                                        Estado: <span className={req.status === 'approved' ? 'text-emerald-600' : req.status === 'rejected' ? 'text-rose-600' : 'text-amber-600'}>{req.status}</span>
                                    </p>
                                </div>

                                {req.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleUpdatePremiumStatus(req.id!, 'rejected')} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors" title="Rechazar">
                                            <XCircle className="w-6 h-6" />
                                        </button>
                                        <button onClick={() => handleUpdatePremiumStatus(req.id!, 'approved')} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 hover:scale-105 transition-all" title="Aprobar Solicitud">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </button>
                                    </div>
                                )}
                                {req.status === 'approved' && <div className="bg-emerald-50 text-emerald-600 p-2 rounded-full"><CheckCircle2 className="w-6 h-6" /></div>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSupportInbox;
