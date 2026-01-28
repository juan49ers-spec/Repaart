import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Clock, Paperclip, CheckCircle, AlertTriangle, User, Download, FileText } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { doc, updateDoc, onSnapshot, serverTimestamp, Timestamp, collection, query, orderBy, addDoc } from 'firebase/firestore';
import SharedMessage, { Message, formatRelativeTime, getStatusBadgeStyle } from '../../../components/support/SharedMessage';
import { cn } from '../../../lib/utils';
import { useAuth } from '../../../context/AuthContext';

interface TicketDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticketId: string | null;
}

interface Ticket {
    id: string;
    subject: string;
    priority: 'low' | 'medium' | 'high';
    status: 'open' | 'resolved' | 'closed' | 'investigating' | 'pending_user';
    description: string;
    category?: string;
    email?: string;
    createdAt?: Timestamp;
    lastUpdated?: Timestamp;
    attachmentUrl?: string;
    attachmentName?: string;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ isOpen, onClose, ticketId }) => {
    const { user } = useAuth();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen || !ticketId) return;

        // Listen to ticket document
        const ticketUnsubscribe = onSnapshot(doc(db, "tickets", ticketId), (docSnap) => {
            if (docSnap.exists()) {
                setTicket({ id: docSnap.id, ...docSnap.data() } as Ticket);
            }
        });

        // Listen to messages subcollection
        const messagesQuery = query(
            collection(db, "tickets", ticketId, "messages"),
            orderBy("createdAt", "asc")
        );
        const messagesUnsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const msgs = snapshot.docs
                .map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        text: data.text || '',
                        senderRole: data.senderRole || 'user',
                        senderName: data.senderRole === 'admin' ? 'Soporte' : (data.senderName || undefined),
                        isInternal: data.isInternal || false,
                        createdAt: data.createdAt,
                        timestamp: data.createdAt,
                        attachmentUrl: data.attachmentUrl,
                        attachmentName: data.attachmentName
                    } as Message;
                })
                .filter(msg => !msg.isInternal); // Safety: Never show internal notes to franchise
            setMessages(msgs);
        });

        return () => {
            ticketUnsubscribe();
            messagesUnsubscribe();
        };
    }, [isOpen, ticketId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending || !ticketId) return;
        setSending(true);
        try {
            const messageData = {
                text: newMessage,
                senderId: user?.uid,
                senderRole: 'user',
                senderName: user?.displayName || 'Franquicia',
                createdAt: serverTimestamp(),
                timestamp: Date.now(),
                isInternal: false
            };

            // Save to messages subcollection
            await addDoc(collection(db, "tickets", ticketId, "messages"), messageData);

            // Update ticket
            await updateDoc(doc(db, "tickets", ticketId), {
                lastUpdated: serverTimestamp(),
                status: 'open'
            });

            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
            alert('Error al enviar el mensaje');
        } finally {
            setSending(false);
        }
    };

    const handleResolve = async () => {
        if (!ticketId) return;
        if (!confirm("¿Estás seguro de que quieres cerrar este ticket?")) return;
        try {
            await updateDoc(doc(db, "tickets", ticketId), {
                status: 'resolved',
                lastUpdated: serverTimestamp()
            });
        } catch (error) {
            console.error("Error resolving ticket:", error);
            alert('Error al resolver el ticket');
        }
    };

    const getPriorityStyle = (priority: string) => {
        const styles: Record<string, { bg: string; text: string; border: string; icon: React.ElementType }> = {
            high: { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-100 dark:border-rose-500/20', icon: AlertTriangle },
            medium: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-500/20', icon: Clock },
            low: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-500/20', icon: CheckCircle }
        };
        return styles[priority] || styles.low;
    };

    const getStatusLabel = (status: string): string => {
        const labels: Record<string, string> = {
            open: 'Abierto',
            resolved: 'Resuelto',
            closed: 'Cerrado',
            investigating: 'Revisando',
            pending_user: 'Pendiente Info'
        };
        return labels[status] || status;
    };

    if (!isOpen) return null;
    if (!ticket) return null;

    const ticketStatus = getStatusBadgeStyle(ticket.status);
    const priorityStyle = getPriorityStyle(ticket.priority);
    const PriorityIcon = priorityStyle.icon;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden relative transition-colors">

                {/* HEADER */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={cn(
                            "p-2.5 rounded-xl border transition-all shrink-0",
                            priorityStyle.bg,
                            priorityStyle.text,
                            priorityStyle.border
                        )}>
                            <PriorityIcon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate leading-tight">
                                    {ticket.subject}
                                </h2>
                                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-semibold uppercase tracking-widest whitespace-nowrap flex-shrink-0">
                                    #{ticket.id.slice(-6)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
                                <span className={cn("px-2 py-0.5 rounded-lg border font-semibold", ticketStatus.bg, ticketStatus.text, ticketStatus.border)}>
                                    {getStatusLabel(ticket.status)}
                                </span>
                                <span className="text-slate-200 dark:text-slate-700">•</span>
                                <span className={cn("px-2 py-0.5 rounded-lg border font-semibold uppercase", priorityStyle.bg, priorityStyle.text, priorityStyle.border)}>
                                    {ticket.priority === 'high' ? 'Alta' : ticket.priority === 'medium' ? 'Media' : 'Baja'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                            <button
                                onClick={handleResolve}
                                className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-xl transition-all text-[10px] font-semibold uppercase tracking-wider shadow-sm hover:shadow-md active:scale-95"
                            >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Resolver</span>
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-500/20 active:scale-95"
                            title="Cerrar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* CHAT BODY */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950">
                    {/* Original Ticket Description */}
                    <div className="flex justify-start mb-8">
                        <div className="max-w-[90%] md:max-w-[80%]">
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                                    <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider border-l-2 border-indigo-500 pl-2">
                                    Descripción Inicial
                                </span>
                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-600 uppercase tracking-wide ml-auto">
                                    {formatRelativeTime(ticket.createdAt)}
                                </span>
                            </div>
                            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-sm leading-relaxed shadow-sm">
                                {ticket.description}
                                {ticket.attachmentUrl && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <a
                                            href={ticket.attachmentUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all shadow-sm hover:shadow-md active:scale-95"
                                        >
                                            <FileText className="w-4 h-4" />
                                            {ticket.attachmentName || 'Ver Archivo'}
                                            <Download className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="space-y-6">
                        {messages.map((msg) => (
                            <SharedMessage key={msg.id} msg={msg} />
                        ))}
                    </div>
                    <div ref={messagesEndRef} />
                </div>

                {/* FOOTER */}
                {ticket.status === 'resolved' || ticket.status === 'closed' ? (
                    <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center gap-3 shrink-0 animate-in slide-in-from-bottom-4 transition-colors">
                        <div className="flex items-center gap-2.5 px-5 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                                Ticket Resuelto
                            </p>
                        </div>
                        <button
                            onClick={async () => {
                                if (!ticketId) return;
                                await updateDoc(doc(db, "tickets", ticketId), {
                                    status: 'open',
                                    lastUpdated: serverTimestamp()
                                });
                            }}
                            className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 uppercase tracking-wider border-b-2 border-transparent hover:border-indigo-500 pb-0.5 transition-all"
                        >
                            ¿Necesitas más ayuda? Reabrir ticket
                        </button>
                    </div>
                ) : (
                    <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors shrink-0">
                        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
                            <div className="flex items-end gap-3">
                                <button
                                    type="button"
                                    className="p-3 text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shrink-0"
                                    title="Adjuntar archivo"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <div className="flex-1 relative group">
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => {
                                            setNewMessage(e.target.value);
                                            setIsTyping(e.target.value.length > 0);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(e);
                                            }
                                        }}
                                        placeholder="Escribe tu respuesta aquí..."
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl py-3.5 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 resize-none h-[60px] min-h-[60px] max-h-[150px] placeholder:text-slate-400 dark:placeholder:text-slate-700 font-medium transition-all shadow-sm"
                                    />
                                    <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
                                        {isTyping && (
                                            <div className="flex gap-0.5">
                                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-typing-1" />
                                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-typing-2" />
                                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-typing-3" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || sending}
                                    className={cn(
                                        "h-[52px] w-[52px] rounded-xl flex items-center justify-center transition-all shrink-0",
                                        !newMessage.trim() || sending
                                            ? "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed"
                                            : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:scale-95"
                                    )}
                                    title="Enviar mensaje"
                                >
                                    {sending ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                    <span>Enter para enviar</span>
                                    <span className="text-slate-300 dark:text-slate-700">•</span>
                                    <span>Shift+Enter para nueva línea</span>
                                </p>
                                <span className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400">
                                    {newMessage.length}/500
                                </span>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketDetailModal;
