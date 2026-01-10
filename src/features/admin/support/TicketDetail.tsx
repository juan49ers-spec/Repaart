import React, { memo } from 'react';
import { User, Clock, Download, Lock, Send, Loader2, MessageSquare } from 'lucide-react';
import { getStatusConfig, TICKET_STATUSES } from '../../../lib/constants';
import { useSupport } from '../../../hooks/useSupport';
import { formatDate } from '../../../utils/formatDate';
import { Ticket, TicketMessage } from '../../../hooks/useSupportManager';

// Define Context Interface
interface SupportContextDetailValue {
    selectedTicket: Ticket | null;
    messages: TicketMessage[];
    handleStatusChange: (id: string, status: string) => void;
    reply: string;
    setReply: (val: string) => void;
    isInternal: boolean;
    setIsInternal: (val: boolean) => void;
    handleReply: () => void;
    isSendingReply: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement>;
}

// --- SUB-COMPONENTS FOR PERFORMANCE ---

interface MessageItemProps {
    msg: TicketMessage;
    email?: string;
    isAdmin?: boolean;
}

const MessageItem = memo(({ msg, email }: MessageItemProps) => {
    const isInternal = msg.isInternal;
    // msg.senderRole can be 'admin' or 'user' or 'system'
    const senderIsAdmin = msg.senderRole === 'admin';

    if (isInternal) {
        return (
            <div className="flex justify-center my-6">
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-400 p-4 rounded-2xl max-w-lg text-sm flex items-start gap-3 shadow-sm transition-colors">
                    <Lock className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-black text-[10px] uppercase mb-1.5 tracking-widest opacity-70">Nota Interna (Sólo Admin)</p>
                        <div
                            className='prose prose-sm prose-amber dark:prose-invert'
                            dangerouslySetInnerHTML={{ __html: msg.text }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex ${senderIsAdmin ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`p-5 rounded-2xl max-w-[85%] shadow-sm transition-all ${senderIsAdmin
                ? 'bg-slate-900 dark:bg-indigo-600 text-white rounded-tr-sm shadow-indigo-500/10'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-sm'
                }`}>
                <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${senderIsAdmin ? 'text-slate-400 dark:text-indigo-200' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        {senderIsAdmin ? 'Soporte HQ' : email}
                    </span>
                    <span className={`text-[10px] font-bold ${senderIsAdmin ? 'text-slate-500 dark:text-indigo-300/50' : 'text-slate-400 dark:text-slate-500'}`}>
                        {formatDate(msg.createdAt)}
                    </span>
                </div>
                <div
                    className={`prose prose-sm ${senderIsAdmin ? 'prose-invert' : 'prose-slate dark:prose-invert font-medium text-slate-700 dark:text-slate-200'}`}
                    dangerouslySetInnerHTML={{ __html: msg.text }}
                />
            </div>
        </div>
    );
});

MessageItem.displayName = 'MessageItem';

// --- PURE PRESENTATIONAL COMPONENT ---

interface TicketDetailInnerProps {
    selectedTicket: Ticket | null;
    messages: TicketMessage[];
    onStatusChange: (id: string, status: string) => void;
    reply: string;
    setReply: (val: string) => void;
    isInternal: boolean;
    setIsInternal: (val: boolean) => void;
    onReply: () => void;
    isSendingReply: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement>;
}

const TicketDetailInner = memo(({
    selectedTicket,
    messages,
    onStatusChange,
    reply,
    setReply,
    isInternal,
    setIsInternal,
    onReply,
    isSendingReply,
    messagesEndRef
}: TicketDetailInnerProps) => {

    if (!selectedTicket) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full relative transition-colors">
                <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 bg-slate-50/30 dark:bg-slate-950/20">
                    <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-slate-200/50 dark:shadow-none transition-transform hover:scale-110 duration-500">
                        <MessageSquare className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Atención al Cliente</p>
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-2">Selecciona un caso para comenzar la gestión</p>
                    <div className="mt-8 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-3 shadow-sm">
                        <kbd className="font-black bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded textxs text-slate-600 dark:text-slate-400 transition-colors">⌘K</kbd>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Búsqueda Rápida</span>
                    </div>
                </div>
            </div>
        );
    }

    const ticketStatus = getStatusConfig(selectedTicket.status);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full relative transition-colors">
            <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Detail Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-start">
                    <div className="max-w-xl">
                        <div className="flex items-center gap-3 mb-3">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${ticketStatus.bg} ${ticketStatus.text} ${ticketStatus.border} dark:bg-opacity-20 transition-colors`}>
                                {ticketStatus.label}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700 font-bold">•</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">ID: {selectedTicket.id.slice(0, 8)}</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 leading-tight">{selectedTicket.subject}</h2>
                        <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-bold">
                            <span className="flex items-center gap-2 group transition-colors hover:text-indigo-500">
                                <User className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                {selectedTicket.email}
                            </span>
                            <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                                {formatDate(selectedTicket.createdAt)}
                            </span>
                        </div>
                    </div>

                    {/* Status Selector */}
                    <div className="flex flex-col items-end gap-2">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Actualizar Estado</label>
                        <select
                            value={selectedTicket.status || 'open'}
                            onChange={(e) => onStatusChange(selectedTicket.id, e.target.value)}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-black text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer transition-all hover:bg-white dark:hover:bg-slate-900"
                        >
                            {Object.values(TICKET_STATUSES).map(s => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Content Scrollable - CHAT MODE */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/30 dark:bg-slate-950/20">
                    {/* Original Ticket Info Block */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all group hover:shadow-md">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center transition-colors">
                                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Consulta Inicial</p>
                                {/* @ts-ignore - Firestore timestamp handling */}
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Enviado hace {selectedTicket.createdAt?.toDate ? Math.floor((new Date().getTime() - selectedTicket.createdAt.toDate().getTime()) / (1000 * 60 * 60)) : 0} horas</p>
                            </div>
                        </div>
                        <div className="pl-12">
                            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-medium leading-relaxed text-sm">
                                {selectedTicket.message}
                            </p>

                            {selectedTicket.attachmentUrl && (
                                <div className="mt-6 pt-5 border-t border-slate-50 dark:border-slate-800">
                                    <a href={selectedTicket.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2.5 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm">
                                        <Download className="w-4 h-4" /> Ver Archivo Adjunto
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Messages Feed */}
                    <div className="space-y-6">
                        {messages.map(msg => (
                            <MessageItem key={msg.id} msg={msg} email={selectedTicket.email} />
                        ))}
                    </div>
                    <div ref={messagesEndRef} />
                </div>

                {/* Reply Box */}
                {selectedTicket.status !== 'resolved' && (
                    <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative z-20">
                        <div className="max-w-4xl mx-auto relative group">
                            <div className={`rounded-2xl border-2 transition-all duration-300 shadow-sm overflow-hidden focus-within:shadow-xl focus-within:shadow-indigo-500/5 ${isInternal
                                ? "bg-amber-50/30 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/30 focus-within:border-amber-400"
                                : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-within:border-indigo-500 dark:focus-within:border-indigo-400"}`}>
                                <textarea
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    placeholder={isInternal ? "Escribe una nota interna privada (sólo visible para el staff)..." : "Redacta tu respuesta al cliente..."}
                                    className={`w-full min-h-[140px] p-5 text-sm font-medium focus:outline-none bg-transparent text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none transition-colors`}
                                    style={{ fontFamily: 'inherit' }}
                                />
                                <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 border-t border-inherit">
                                    <button
                                        type="button"
                                        onClick={() => setIsInternal(!isInternal)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${isInternal
                                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <Lock className="w-3.5 h-3.5" />
                                        <span>{isInternal ? 'Nota Interna' : 'Hacer Interna'}</span>
                                    </button>

                                    <button
                                        onClick={onReply}
                                        disabled={isSendingReply || !reply.trim()}
                                        className={`flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${isSendingReply || !reply.trim()
                                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                                            : `text-white hover:scale-[1.02] active:scale-95 ${isInternal ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'}`
                                            }`}
                                    >
                                        {isSendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        <span>{isSendingReply ? 'Enviando' : isInternal ? 'Registrar Nota' : 'Enviar Respuesta'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

TicketDetailInner.displayName = 'TicketDetailInner';

// --- CONTAINER COMPONENT ---

const TicketDetail = () => {
    const {
        selectedTicket,
        messages,
        handleStatusChange,
        reply,
        setReply,
        isInternal,
        setIsInternal,
        handleReply,
        isSendingReply,
        messagesEndRef
    } = useSupport() as unknown as SupportContextDetailValue;

    return (
        <TicketDetailInner
            selectedTicket={selectedTicket}
            messages={messages}
            onStatusChange={handleStatusChange}
            reply={reply}
            setReply={setReply}
            isInternal={isInternal}
            setIsInternal={setIsInternal}
            onReply={handleReply}
            isSendingReply={isSendingReply}
            messagesEndRef={messagesEndRef}
        />
    );
};

export default TicketDetail;
