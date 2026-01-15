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
    handleDeleteTicket: (id: string) => void;
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
            <div className="flex justify-center my-8">
                <div className="bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/10 text-amber-800 dark:text-amber-400 p-5 rounded-3xl max-w-xl text-sm flex items-start gap-4 shadow-sm transition-all animate-in fade-in zoom-in-95 duration-500 underline-offset-4 decoration-amber-500/30">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                        <Lock className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="font-semibold text-[10px] uppercase mb-2 tracking-widest opacity-60">Nota Interna (Privado)</p>
                        <div
                            className='prose prose-sm prose-amber dark:prose-invert font-medium leading-relaxed'
                            dangerouslySetInnerHTML={{ __html: msg.text }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex ${senderIsAdmin ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-400`}>
            <div className={`p-6 rounded-3xl max-w-[85%] lg:max-w-[75%] shadow-sm transition-all ${senderIsAdmin
                ? 'bg-slate-900 dark:bg-indigo-600 text-white rounded-tr-none shadow-indigo-500/10'
                : 'bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 rounded-tl-none'
                }`}>
                <div className="flex items-center gap-3 mb-2.5">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${senderIsAdmin ? 'text-indigo-200/70' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        {senderIsAdmin ? 'Soporte HQ' : email}
                    </span>
                    <span className={`text-[10px] font-medium opacity-50 ${senderIsAdmin ? 'text-indigo-100' : 'text-slate-500'}`}>
                        {formatDate(msg.createdAt)}
                    </span>
                </div>
                <div
                    className={`prose prose-sm leading-relaxed ${senderIsAdmin ? 'prose-invert' : 'prose-slate dark:prose-invert font-medium text-slate-700 dark:text-slate-200'}`}
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
    onDelete: (id: string) => void;
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
    onDelete,
    messagesEndRef
}: TicketDetailInnerProps) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);

    if (!selectedTicket) {
        return (
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-lg border border-slate-200/50 dark:border-slate-800/50 overflow-hidden flex flex-col h-full relative transition-all">
                <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 bg-slate-50/20 dark:bg-slate-950/20">
                    <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/10 dark:shadow-none transition-transform hover:scale-110 duration-700">
                        <MessageSquare className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Atención al Cliente</p>
                    <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-2.5">Selecciona un caso para comenzar la gestión</p>
                    <div className="mt-10 px-5 py-2.5 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-4 shadow-sm backdrop-blur-sm">
                        <kbd className="font-bold bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg text-[10px] text-slate-600 dark:text-slate-400 transition-colors">⌘K</kbd>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">Búsqueda Rápida</span>
                    </div>
                </div>
            </div>
        );
    }

    const ticketStatus = getStatusConfig(selectedTicket.status);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete(selectedTicket.id);
        } catch (error) {
            console.error(error);
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden flex flex-col h-full relative transition-all">
            <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Detail Header */}
                <div className="p-8 border-b border-slate-100/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40 flex justify-between items-start">
                    <div className="max-w-xl">
                        <div className="flex items-center gap-4 mb-4">
                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold uppercase tracking-wider border ${ticketStatus.bg} ${ticketStatus.text} ${ticketStatus.border} dark:bg-opacity-20 transition-all`}>
                                {ticketStatus.label}
                            </span>
                            <span className="text-slate-200 dark:text-slate-700 font-bold">•</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-[0.2em]">Ref: {selectedTicket.id.slice(0, 8)}</span>
                        </div>
                        <h2 className="text-3xl font-semibold text-slate-900 dark:text-white mb-3 leading-tight tracking-tight">{selectedTicket.subject}</h2>
                        <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                            <span className="flex items-center gap-2.5 group transition-colors hover:text-indigo-500">
                                <User className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                <span className="uppercase">{selectedTicket.email}</span>
                            </span>
                            <span className="flex items-center gap-2.5">
                                <Clock className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                                <span>{formatDate(selectedTicket.createdAt)}</span>
                            </span>
                        </div>
                    </div>

                    {/* Actions Header */}
                    <div className="flex flex-col items-end gap-4">
                        <div className="flex items-center gap-3">
                            {!showDeleteConfirm ? (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl transition-all active:scale-95"
                                    title="Eliminar Ticket"
                                >
                                    <Download className="w-4 h-4 rotate-180" />
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-300">
                                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mr-1">¿Confirmar borrado?</span>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-rose-700 transition-all disabled:opacity-50"
                                    >
                                        {isDeleting ? '...' : 'SÍ'}
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] font-bold uppercase hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                    >
                                        NO
                                    </button>
                                </div>
                            )}

                            <div className="w-px h-8 bg-slate-100 dark:bg-slate-800 mx-1" />

                            <div className="flex flex-col items-end">
                                <select
                                    value={selectedTicket.status || 'open'}
                                    onChange={(e) => onStatusChange(selectedTicket.id, e.target.value)}
                                    aria-label="Cambiar estado del ticket"
                                    className="bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 cursor-pointer transition-all hover:bg-white dark:hover:bg-slate-900 shadow-sm appearance-none min-w-[160px]"
                                >
                                    {Object.values(TICKET_STATUSES).map(s => (
                                        <option key={s.id} value={s.id}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Scrollable - CHAT MODE */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 bg-slate-50/20 dark:bg-slate-950/20 scroll-smooth">
                    {/* Original Ticket Info Block */}
                    <div className="bg-white/80 dark:bg-slate-900/80 p-8 rounded-3xl border border-slate-100/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden transition-all group hover:shadow-lg backdrop-blur-sm">
                        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500/80" />
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center transition-colors shadow-inner">
                                <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-widest mb-1">Descripción del Problema</p>
                                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Iniciado {(selectedTicket.createdAt as any)?.toDate ? formatDate(selectedTicket.createdAt) : 'hace poco'}</p>
                            </div>
                        </div>
                        <div className="pl-16">
                            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-medium leading-relaxed text-[15px]">
                                {selectedTicket.message}
                            </p>

                            {selectedTicket.attachmentUrl && (
                                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/50">
                                    <a href={selectedTicket.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 px-5 py-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-2xl text-[10px] font-semibold uppercase tracking-widest transition-all shadow-sm active:scale-95">
                                        <Download className="w-4 h-4" /> Ver Material Adjunto
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Messages Feed */}
                    <div className="space-y-8 pb-4">
                        {messages.map(msg => (
                            <MessageItem key={msg.id} msg={msg} email={selectedTicket.email} />
                        ))}
                    </div>
                    <div ref={messagesEndRef} />
                </div>

                {/* Reply Box */}
                {selectedTicket.status !== 'resolved' && (
                    <div className="p-8 border-t border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl relative z-20">
                        <div className="max-w-4xl mx-auto relative group">
                            <div className={`rounded-3xl border-2 transition-all duration-300 shadow-sm overflow-hidden focus-within:shadow-2xl focus-within:shadow-indigo-500/10 ${isInternal
                                ? "bg-amber-50/50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 focus-within:border-amber-400"
                                : "bg-white dark:bg-slate-950 border-slate-200/50 dark:border-white/5 focus-within:border-indigo-500 dark:focus-within:border-indigo-400"}`}>
                                <textarea
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    placeholder={isInternal ? "Escribe una nota interna privada (sólo visible para el staff)..." : "Redacta tu respuesta al cliente..."}
                                    className={`w-full min-h-[160px] p-6 text-sm font-medium focus:outline-none bg-transparent text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none transition-colors`}
                                />
                                <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-black/20 border-t border-inherit/50">
                                    <button
                                        type="button"
                                        onClick={() => setIsInternal(!isInternal)}
                                        className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all font-semibold text-[10px] uppercase tracking-[0.15em] ${isInternal
                                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                                            : 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <Lock size={14} className={isInternal ? 'animate-pulse' : ''} />
                                        <span>{isInternal ? 'Nota Interna' : 'Hacer Interna'}</span>
                                    </button>

                                    <button
                                        onClick={onReply}
                                        disabled={isSendingReply || !reply.trim()}
                                        className={`flex items-center justify-center gap-3 px-10 py-3 rounded-2xl font-semibold text-[10px] uppercase tracking-widest transition-all shadow-xl ${isSendingReply || !reply.trim()
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
        handleDeleteTicket,
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
            onDelete={handleDeleteTicket}
            messagesEndRef={messagesEndRef}
        />
    );
};

export default TicketDetail;
