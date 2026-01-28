import { useState, useEffect, useMemo } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc, serverTimestamp, addDoc, Timestamp } from 'firebase/firestore';
import { MessageSquare, Star, Reply, CheckCircle2, XCircle } from 'lucide-react';
import { logAction, AUDIT_ACTIONS } from '../../../lib/audit';
import { notificationService } from '../../../services/notificationService';
import { formatTimeAgo } from '../../../utils/dateHelpers';

interface Ticket {
    id: string;
    subject: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    category: string;
    status: 'open' | 'resolved' | 'closed' | 'investigating' | 'pending_user';
    userId?: string;
    franchiseId?: string;
    createdAt?: Timestamp;
    lastUpdated?: Timestamp;
    origin?: string;
}



interface PremiumRequest {
    id: string;
    franchiseId: string;
    franchiseName: string;
    serviceId: string;
    serviceName: string;
    status: 'pending' | 'in_review' | 'approved' | 'rejected';
    createdAt: Timestamp;
}

const AdminSupportInbox = () => {
    const [activeTab, setActiveTab] = useState<'tickets' | 'premium'>('tickets');
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [premiumRequests, setPremiumRequests] = useState<PremiumRequest[]>([]);

    // Reply State
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [sending, setSending] = useState(false);

    // --- OPTIMIZED FILTERING ---
    const filteredTickets = useMemo(() => {
        return tickets.filter(t => t.status === 'open');
    }, [tickets]);

    const activePremiumCount = useMemo(() => {
        return premiumRequests.filter(r => r.status === 'pending').length;
    }, [premiumRequests]);

    useEffect(() => {
        // 1. Listen to tickets (Always active)
        const qTickets = query(
            collection(db, 'tickets'),
            orderBy('createdAt', 'desc')
        );
        const unsubTickets = onSnapshot(qTickets, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
            setTickets(list);
        }, (error) => {
            console.error("❌ [AdminSupportInbox] Tickets listener error:", error);
        });

        // 2. Listen to premium_requests (Always active)
        const qPremium = query(
            collection(db, 'premium_requests'),
            orderBy('createdAt', 'desc')
        );
        const unsubPremium = onSnapshot(qPremium, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PremiumRequest));
            setPremiumRequests(list);
        }, (error) => {
            console.error("❌ [AdminSupportInbox] Premium requests listener error:", error);
        });

        return () => {
            unsubTickets();
            unsubPremium();
        };
    }, []); // Run only once on mount

    const handleReply = async (ticketId: string) => {
        if (!replyMessage.trim()) return;

        setSending(true);
        try {
            // Add message to messages subcollection
            const messagesRef = collection(db, 'tickets', ticketId, 'messages');
            await addDoc(messagesRef, {
                text: replyMessage,
                senderRole: 'admin',
                senderName: 'Soporte Admin',
                senderId: 'admin',
                isInternal: false,
                createdAt: serverTimestamp(),
                timestamp: Date.now()
            });

            // Update ticket
            await updateDoc(doc(db, 'tickets', ticketId), {
                lastUpdated: serverTimestamp(),
                status: 'open'
            });

            // Fetch ticket data to get userId/franchiseId
            const ticketDoc = await getDoc(doc(db, 'tickets', ticketId));
            if (!ticketDoc.exists()) {
                console.error('Ticket not found:', ticketId);
                return;
            }

            const ticket = ticketDoc.data() as Ticket;
            const targetUserId = ticket.userId || ticket.franchiseId;

            console.log('🔔 [AdminSupportInbox] Sending notification to:', targetUserId, 'for ticket:', ticketId);
            console.log('🔔 [AdminSupportInbox] Ticket data:', JSON.stringify({ id: ticket.id, userId: ticket.userId, franchiseId: ticket.franchiseId, subject: ticket.subject }));

            if (targetUserId) {
                await Promise.all([
                    notificationService.notifyFranchise(targetUserId, {
                        title: 'Nueva Respuesta en Soporte',
                        message: `Admin ha respondido a tu ticket: ${ticket.subject}`,
                        type: 'SUPPORT_TICKET',
                        link: '/support',
                        priority: 'normal'
                    }),
                    logAction({ uid: 'admin' }, AUDIT_ACTIONS.TICKET_REPLIED, {
                        ticketId,
                        messageSnippet: replyMessage.slice(0, 100)
                    })
                ]);
                console.log('✅ [AdminSupportInbox] Reply sent and audited.');
            } else {
                console.warn('⚠️ [AdminSupportInbox] No userId or franchiseId found for ticket:', ticketId, ticket);
            }

            setReplyingTo(null);
            setReplyMessage('');
        } catch (error) {
            console.error('Error sending reply:', error);
            alert('Error al enviar la respuesta');
        } finally {
            setSending(false);
        }
    };

    const handleUpdatePremiumStatus = async (reqId: string, status: PremiumRequest['status']) => {
        try {
            await updateDoc(doc(db, 'premium_requests', reqId), {
                status,
                updatedAt: serverTimestamp()
            });

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
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error al actualizar el estado');
        }
    };

    return (
        <div className="h-full bg-slate-50 p-6 flex flex-col overflow-hidden">
            <header className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1">Centro de Soporte</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest pl-0.5">Gestión de tickets y servicios premium</p>
                </div>

                <div className="bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-300/50 dark:border-white/10 backdrop-blur-md shadow-inner flex">
                    <button
                        onClick={() => setActiveTab('tickets')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all duration-300 ${activeTab === 'tickets' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm luxury-shadow-md' : 'text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                    >
                        <MessageSquare className="w-3.5 h-3.5" /> Tickets
                        {filteredTickets.length > 0 && (
                            <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">{filteredTickets.length}</span>
                        )}
                    </button>
                    <div className="w-px bg-slate-100 mx-1" />
                    <button
                        onClick={() => setActiveTab('premium')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all duration-300 ${activeTab === 'premium' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm luxury-shadow-md' : 'text-slate-500 hover:text-amber-600 dark:hover:text-amber-400'}`}
                    >
                        <Star className="w-3.5 h-3.5" /> Premium
                        {activePremiumCount > 0 && (
                            <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">{activePremiumCount}</span>
                        )}
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {activeTab === 'tickets' && (
                    <div className="grid grid-cols-1 gap-4">
                        {tickets.map(ticket => (
                            <div key={ticket.id} className="glass-premium-v2 rounded-3xl p-6 border border-slate-200/50 dark:border-white/10 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <span className={`block w-3 h-3 rounded-full ${ticket.status === 'open' ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)] animate-pulse' : 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]'}`} />
                                            {ticket.status === 'open' && <div className="absolute -inset-1 bg-rose-500/20 rounded-full animate-ping" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">Ticket #{ticket.id?.slice(-6) || 'N/A'}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{ticket.createdAt ? formatTimeAgo(ticket.createdAt.toDate()) : 'Reciente'}</span>
                                            </div>
                                            {ticket.origin && <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">Origen: {ticket.origin}</p>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black px-2 py-1 rounded-lg uppercase tracking-widest border border-slate-200/50 dark:border-white/5">{ticket.category}</span>
                                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border border-current/20 ${ticket.priority === 'high' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                                            ticket.priority === 'medium' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                                'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                            }`}>
                                            {ticket.priority === 'high' ? 'PRIO ALTA' : ticket.priority === 'medium' ? 'PRIO MEDIA' : 'PRIO BAJA'}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="font-black text-xl text-slate-900 dark:text-white mb-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{ticket.subject}</h3>
                                <div className="relative">
                                    <p className="text-slate-600 dark:text-slate-400 text-sm bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5 mb-4 line-clamp-2 leading-relaxed italic">
                                        &ldquo;{ticket.description}&rdquo;
                                    </p>
                                    <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white/0 dark:from-slate-900/0 to-transparent pointer-events-none" />
                                </div>

                                {/* Quick Reply Area */}
                                {replyingTo === ticket.id ? (
                                    <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                        <textarea
                                            className="w-full p-3 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none mb-2 bg-indigo-50/30 resize-none"
                                            placeholder="Escribe tu respuesta..."
                                            rows={3}
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setReplyingTo(null);
                                                    setReplyMessage('');
                                                }}
                                                className="text-xs font-bold text-slate-500 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors"
                                                disabled={sending}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={() => handleReply(ticket.id)}
                                                className="text-xs font-bold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                                disabled={!replyMessage.trim() || sending}
                                            >
                                                {sending ? (
                                                    <>
                                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        <span>Enviando...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Reply className="w-3 h-3" />
                                                        <span>Enviar Respuesta</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setReplyingTo(ticket.id)}
                                            className="flex items-center gap-2 text-indigo-600 font-bold text-xs hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors"
                                        >
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
                                        <span className="text-xs text-slate-400">• {req.createdAt ? formatTimeAgo(req.createdAt.toDate()) : 'Reciente'}</span>
                                    </div>
                                    <p className="text-lg font-bold text-indigo-900">{req.serviceName}</p>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1 flex items-center gap-1">
                                        Estado: <span className={req.status === 'approved' ? 'text-emerald-600' : req.status === 'rejected' ? 'text-rose-600' : 'text-amber-600'}>{req.status}</span>
                                    </p>
                                </div>

                                {req.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleUpdatePremiumStatus(req.id, 'rejected')} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors" title="Rechazar">
                                            <XCircle className="w-6 h-6" />
                                        </button>
                                        <button onClick={() => handleUpdatePremiumStatus(req.id, 'approved')} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 hover:scale-105 transition-all" title="Aprobar Solicitud">
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
