```
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, ShieldCheck, Clock, Paperclip, CheckCircle } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { doc, updateDoc, arrayUnion, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { notificationService } from '../../../services/notificationService'; // IMPORT ADDED
import { useAuth } from '../../../context/AuthContext';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'support' | 'system';
    timestamp?: string | any;
    createdAt?: number;
}

interface Ticket {
    id: string;
    subject: string;
    priority: 'low' | 'medium' | 'high';
    status: 'open' | 'resolved' | 'closed' | 'investigating' | 'pending_user';
    description: string;
    createdAt?: Timestamp;
    lastUpdated?: Timestamp;
    messages: Message[];
}

interface TicketDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticketId: string | null;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ isOpen, onClose, ticketId }) => {
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Fetch Ticket
    useEffect(() => {
        if (!isOpen || !ticketId) return;
        const unsubscribe = onSnapshot(doc(db, "tickets", ticketId), (docSnap) => {
            if (docSnap.exists()) {
                setTicket({ id: docSnap.id, ...docSnap.data() } as Ticket);
            }
        });
        return () => unsubscribe();
    }, [isOpen, ticketId]);

    // 2. Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [ticket?.messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending || !ticketId) return;
        setSending(true);
        try {
            const messageData: Message = {
                id: Date.now().toString(),
                text: newMessage,
                sender: 'user',
                timestamp: new Date().toISOString(),
                createdAt: Date.now()
            };
            await updateDoc(doc(db, "tickets", ticketId), {
                messages: arrayUnion(messageData),
                lastUpdated: serverTimestamp(),
                status: 'open' // Reabrir si escribe de nuevo
            });
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSending(false);
        }
    };

    // --- MEJORA: Handler para resolver ticket ---
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
        }
    };

    if (!isOpen) return null;
    if (!ticket) return null; // Or loader

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden relative transition-colors">

                {/* --- HEADER --- */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                        {/* Priority Icon */}
                        <div className={`p - 3 rounded - xl border transition - colors ${
    ticket.priority === 'high'
        ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-100 dark:border-rose-500/20' :
        ticket.priority === 'medium'
            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' :
            'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20'
} `}>
                            <ShieldCheck className="w-6 h-6" />
                        </div>

                        {/* Title & Meta */}
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                {ticket.subject}
                                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-black uppercase tracking-widest">
                                    #{ticket.id.slice(-6)}
                                </span>
                            </h2>
                            <div className="flex items-center gap-4 text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    {ticket.createdAt?.seconds ? new Date(ticket.createdAt.seconds * 1000).toLocaleDateString() : 'Reciente'}
                                </span>
                                {ticket.status === 'resolved' && (
                                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle className="w-3.5 h-3.5" /> RESUELTO
                                    </span>
                                )}
                                <span className="text-slate-200 dark:text-slate-800">•</span>
                                <span className="text-indigo-500 dark:text-indigo-400">Canal: App Móvil</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* MEJORA: Botón Resolver (Solo si está abierto) */}
                        {ticket.status !== 'resolved' && (
                            <button
                                onClick={handleResolve}
                                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest shadow-sm hover:shadow-md"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Marcar Resuelto
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 rounded-xl transition-all group border border-transparent hover:border-rose-100 dark:hover:border-rose-500/20"
                            title="Cerrar modal"
                        >
                            <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>
                </div>

                {/* --- CHAT BODY --- */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30 dark:bg-slate-950 scroll-smooth">
                    {/* Mensaje Inicial */}
                    <div className="flex justify-start">
                        <div className="max-w-[85%]">
                            <div className="flex items-center gap-2 mb-2 ml-1">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest border-l-2 border-indigo-500 pl-2">Descripción Inicial del Caso</span>
                            </div>
                            <div className="p-5 rounded-2xl rounded-tl-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm leading-relaxed shadow-sm transition-colors">
                                {ticket.description}
                            </div>
                        </div>
                    </div>

                    {/* Mensajes */}
                    {ticket.messages && ticket.messages.map((msg, index) => {
                        const isUser = msg.sender === 'user';
                        const timestamp = msg.createdAt
                            ? new Date(msg.createdAt)
                            : (msg.timestamp ? new Date(msg.timestamp) : new Date());

                        return (
                            <div key={index} className={`flex ${ isUser ? 'justify-end' : 'justify-start' } animate -in fade -in slide -in -from - bottom - 2 duration - 300`}>
                                <div className={`max - w - [85 %] ${ isUser ? 'order-1' : 'order-2' } `}>
                                    <div className={`flex items - center gap - 3 mb - 1.5 ${ isUser ? 'justify-end mr-1' : 'ml-1' } `}>
                                        <span className={`text - [10px] font - black uppercase tracking - widest ${ isUser ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600' } `}>{isUser ? 'Tú' : 'Soporte HQ'}</span>
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600">{timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className={`p - 4 rounded - 2xl text - sm shadow - md leading - relaxed transition - all ${
    isUser
        ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-600 dark:to-blue-700 text-white rounded-tr-sm border border-indigo-500/20 shadow-indigo-500/10'
        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-sm border border-slate-200 dark:border-slate-700'
} `}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* --- FOOTER --- */}
                {ticket.status === 'resolved' ? (
                    <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-4 animate-in slide-in-from-bottom-4 transition-colors">
                        <div className="flex items-center gap-3 px-6 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            <p className="text-emerald-800 dark:text-emerald-400 text-sm font-black uppercase tracking-widest">
                                El equipo ha marcado este caso como resuelto.
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
                            className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 uppercase tracking-[0.2em] border-b-2 border-indigo-100 dark:border-indigo-500/20 hover:border-indigo-500 pb-1 transition-all"
                        >
                            ¿Necesitas más ayuda? Reabrir Ticket
                        </button>
                    </div>
                ) : (
                    <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 transition-colors">
                        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-end gap-3">
                            <button
                                type="button"
                                className="p-3.5 text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                title="Adjuntar archivo"
                            >
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <div className="flex-1 relative group">
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                    placeholder="Escribe tu mensaje aquí..."
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl py-4 px-5 pr-14 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 resize-none h-[60px] min-h-[60px] max-h-[150px] scrollbar-hide placeholder:text-slate-400 dark:placeholder:text-slate-700 font-medium transition-all"
                                />
                                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                                    {/* Send Indicator dots if needed */}
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || sending}
                                className={`h - [60px] w - [60px] rounded - 2xl flex items - center justify - center transition - all ${
    !newMessage.trim() || sending
        ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed'
        : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 hover:scale-[1.05] active:scale-95'
} `}
                                title="Enviar mensaje"
                            >
                                <Send className={`w - 6 h - 6 ${ sending ? 'animate-pulse' : '' } `} />
                            </button>
                        </form>
                        <p className="mt-3 text-center text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Presiona Enter para enviar</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketDetailModal;
