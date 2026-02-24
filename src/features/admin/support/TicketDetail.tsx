import React, { memo, useState, useEffect } from 'react';
import {
    User, Clock, Download, Lock, Send, Loader2, MessageSquare, Tag,
    AlertTriangle, Building2, Mail, Hash, Paperclip, MessageCircle,
    ChevronDown, Timer
} from 'lucide-react';
import { getStatusConfig, TICKET_STATUSES, CANNED_RESPONSES, SLA_CONFIG } from '../../../lib/constants';
import { useSupport } from '../../../hooks/useSupport';
import { formatDate } from '../../../utils/formatDate';
import { Ticket, TicketMessage } from '../../../hooks/useSupportManager';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

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

// --- SLA Timer ---
const computeSLA = (createdAt: { toDate?: () => Date; seconds?: number } | null, status: string) => {
    if (status === 'resolved') return { elapsed: 'Resuelto', severity: 'ok' as const };
    const created = createdAt?.toDate?.() ?? (createdAt?.seconds ? new Date(createdAt.seconds * 1000) : null);
    if (!created) return { elapsed: '—', severity: 'ok' as const };
    const diffMs = Date.now() - created.getTime();
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    const severity = hours >= SLA_CONFIG.CRITICAL_HOURS ? 'critical' as const
        : hours >= SLA_CONFIG.WARNING_HOURS ? 'warning' as const : 'ok' as const;
    const elapsed = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    return { elapsed, severity };
};

const SLAIndicator = ({ createdAt, status }: { createdAt: { toDate?: () => Date; seconds?: number } | null; status: string }) => {
    const [tick, setTick] = useState(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tick is intentional: drives periodic recomputation
    const { elapsed, severity } = React.useMemo(() => computeSLA(createdAt, status), [createdAt, status, tick]);

    useEffect(() => {
        if (status === 'resolved') return;
        const interval = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(interval);
    }, [status]);

    const colors = {
        ok: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        warning: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
        critical: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 animate-pulse',
    };

    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${colors[severity]}`}>
            <Timer className="w-3 h-3" />
            <span>{elapsed}</span>
            {severity === 'critical' && <span>• SLA</span>}
        </div>
    );
};

// --- Status History Timeline ---
interface HistoryEntry {
    id: string;
    status: string;
    previousStatus?: string;
    changedBy?: string;
    changedAt: { toDate?: () => Date } | null;
}

const StatusTimeline = ({ ticketId }: { ticketId: string }) => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);

    useEffect(() => {
        if (!ticketId) return;
        const q = query(
            collection(db, 'tickets', ticketId, 'history'),
            orderBy('changedAt', 'desc')
        );
        const unsub = onSnapshot(q, (snap) => {
            setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as HistoryEntry)));
        }, () => { /* silently ignore if subcollection doesn't exist yet */ });
        return () => unsub();
    }, [ticketId]);

    if (history.length === 0) {
        return (
            <div className="text-[10px] text-slate-400 dark:text-slate-600 italic px-1">
                Sin cambios de estado registrados
            </div>
        );
    }

    return (
        <div className="space-y-0">
            {history.map((h, i) => {
                const statusCfg = getStatusConfig(h.status);
                const time = h.changedAt?.toDate ? formatDate(h.changedAt as unknown as Parameters<typeof formatDate>[0]) : '—';
                return (
                    <div key={h.id} className="flex items-start gap-2 py-1.5 relative">
                        {/* Vertical line */}
                        {i < history.length - 1 && (
                            <div className="absolute left-[5px] top-6 w-px h-full bg-slate-200 dark:bg-slate-800" />
                        )}
                        <div className={`w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 border-2 ${statusCfg.border} ${statusCfg.bg}`} />
                        <div className="flex-1 min-w-0">
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${statusCfg.text}`}>
                                {statusCfg.label}
                            </span>
                            <p className="text-[9px] text-slate-400 dark:text-slate-600 truncate">{time}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// --- Canned Response Picker ---
const CannedResponsePicker = ({ onSelect }: { onSelect: (text: string) => void }) => {
    const [open, setOpen] = useState(false);

    const categories = [
        { id: 'greeting', label: '👋 Saludo' },
        { id: 'info', label: '❓ Info' },
        { id: 'progress', label: '⚙️ Progreso' },
        { id: 'resolution', label: '✅ Resolución' },
        { id: 'escalation', label: '🔺 Escalado' },
    ];

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all"
            >
                <MessageCircle className="w-3 h-3" />
                Respuesta rápida
                <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute bottom-full left-0 mb-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Plantillas de respuesta</p>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        {categories.map(cat => {
                            const items = CANNED_RESPONSES.filter(r => r.category === cat.id);
                            if (items.length === 0) return null;

                            return (
                                <div key={cat.id}>
                                    <p className="px-3 pt-2 pb-1 text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">{cat.label}</p>
                                    {items.map(r => (
                                        <button
                                            key={r.id}
                                            onClick={() => { onSelect(r.text); setOpen(false); }}
                                            className="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors group"
                                        >
                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {r.label}
                                            </p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">{r.text}</p>
                                        </button>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Message Item ---
interface MessageItemProps {
    msg: TicketMessage;
    senderName?: string;
}

const MessageItem = memo(({ msg, senderName }: MessageItemProps) => {
    const senderIsAdmin = msg.senderRole === 'admin';

    if (msg.isInternal) {
        return (
            <div className="flex justify-center my-3">
                <div className="bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/10 text-amber-800 dark:text-amber-400 px-4 py-2.5 rounded-2xl max-w-xl text-sm flex items-start gap-2.5 shadow-sm">
                    <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-[8px] font-bold uppercase tracking-widest opacity-60 mb-0.5">Nota Interna</p>
                        <div className="prose prose-sm prose-amber dark:prose-invert leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.text }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex ${senderIsAdmin ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-200`}>
            <div className={`max-w-[80%] ${senderIsAdmin ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
                <div className={`flex items-center gap-2 mb-1 px-1 ${senderIsAdmin ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${senderIsAdmin ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'}`}>
                        {senderIsAdmin ? 'Soporte HQ' : (msg.senderName || senderName || 'Cliente')}
                    </span>
                    <span className="text-[9px] font-medium text-slate-400 dark:text-slate-600">{formatDate(msg.createdAt)}</span>
                </div>
                <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${senderIsAdmin
                    ? 'bg-indigo-600 text-white rounded-br-sm shadow-md shadow-indigo-500/15'
                    : 'bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 rounded-bl-sm shadow-sm'
                    }`}>
                    <div className={`prose prose-sm ${senderIsAdmin ? 'prose-invert' : 'prose-slate dark:prose-invert'}`} dangerouslySetInnerHTML={{ __html: msg.text }} />
                </div>
            </div>
        </div>
    );
});
MessageItem.displayName = 'MessageItem';

// --- Urgency helpers ---
const getUrgencyConfig = (urgency?: string) => {
    const configs: Record<string, { label: string; bg: string; text: string }> = {
        critical: { label: 'Crítica', bg: 'bg-rose-100 dark:bg-rose-500/15', text: 'text-rose-700 dark:text-rose-400' },
        high: { label: 'Alta', bg: 'bg-amber-100 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-400' },
        medium: { label: 'Media', bg: 'bg-blue-100 dark:bg-blue-500/15', text: 'text-blue-700 dark:text-blue-400' },
        low: { label: 'Baja', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' },
    };
    return configs[urgency || 'low'] || configs.low;
};

// --- Ticket Info Panel (side panel) ---
const TicketInfoPanel = ({ ticket }: { ticket: Ticket }) => {
    const urgency = getUrgencyConfig(ticket.urgency || ticket.priority);

    const infoRows = [
        { icon: Building2, label: 'Solicitante', value: ticket.displayName || ticket.email?.split('@')[0] || 'Desconocido' },
        { icon: Mail, label: 'Email', value: ticket.email || '—' },
        { icon: Tag, label: 'Categoría', value: ticket.category || '—' },
        { icon: Hash, label: 'Ref', value: `#${ticket.id.slice(-6).toUpperCase()}` },
        { icon: Clock, label: 'Creado', value: ticket.createdAt ? formatDate(ticket.createdAt) : '—' },
    ];

    return (
        <div className="space-y-3">
            {/* SLA Timer */}
            <SLAIndicator createdAt={ticket.createdAt} status={ticket.status} />

            {/* Urgency */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl ${urgency.bg}`}>
                <AlertTriangle className={`w-3 h-3 ${urgency.text}`} />
                <span className={`text-[9px] font-bold uppercase tracking-wider ${urgency.text}`}>
                    {urgency.label}
                </span>
            </div>

            {/* Info rows */}
            <div className="space-y-0.5">
                {infoRows.map(row => (
                    <div key={row.label} className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <row.icon className="w-3 h-3 text-slate-400 dark:text-slate-600 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider block">{row.label}</span>
                            <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 truncate block">{row.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Attachment */}
            {ticket.attachmentUrl && (
                <a href={ticket.attachmentUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-[9px] font-bold uppercase tracking-wider hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all">
                    <Paperclip className="w-3 h-3" />
                    Ver Adjunto
                    <Download className="w-3 h-3 ml-auto" />
                </a>
            )}

            {/* Status History */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/50">
                <p className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-2 px-1">Historial</p>
                <StatusTimeline ticketId={ticket.id} />
            </div>
        </div>
    );
};

// --- MAIN DETAIL INNER ---

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
    selectedTicket, messages, onStatusChange,
    reply, setReply, isInternal, setIsInternal,
    onReply, isSendingReply, onDelete, messagesEndRef
}: TicketDetailInnerProps) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    if (!selectedTicket) {
        return (
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-800/50 overflow-hidden flex flex-col h-full">
                <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                    <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/5">
                        <MessageSquare className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">Atención al Cliente</p>
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-2">Selecciona un caso para gestionarlo</p>
                </div>
            </div>
        );
    }

    const ticketStatus = getStatusConfig(selectedTicket.status);

    const handleDelete = async () => {
        setIsDeleting(true);
        try { await onDelete(selectedTicket.id); }
        catch (error) { console.error(error); }
        finally { setIsDeleting(false); setShowDeleteConfirm(false); }
    };

    const ticketDescription = selectedTicket.message || selectedTicket.description || 'Sin descripción';
    const senderName = selectedTicket.displayName || selectedTicket.email?.split('@')[0] || 'Cliente';

    return (
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden flex flex-col h-full">
            <div className="h-full flex flex-col animate-in fade-in duration-200">

                {/* === HEADER === */}
                <div className="px-5 py-3 border-b border-slate-100/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40 flex justify-between items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-wider border ${ticketStatus.bg} ${ticketStatus.text} ${ticketStatus.border}`}>
                                {ticketStatus.label}
                            </span>
                            <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-widest">
                                #{selectedTicket.id.slice(-6).toUpperCase()}
                            </span>
                            <SLAIndicator createdAt={selectedTicket.createdAt} status={selectedTicket.status} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">{selectedTicket.subject}</h2>
                        <p className="text-[9px] font-medium text-slate-400 dark:text-slate-500">
                            {senderName} • {formatDate(selectedTicket.createdAt)}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        {!showDeleteConfirm ? (
                            <button onClick={() => setShowDeleteConfirm(true)}
                                className="p-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 rounded-lg transition-all" title="Eliminar">
                                <Download className="w-3.5 h-3.5 rotate-180" />
                            </button>
                        ) : (
                            <div className="flex items-center gap-1 animate-in slide-in-from-right-2 duration-200">
                                <span className="text-[8px] font-bold text-rose-600 uppercase">¿Borrar?</span>
                                <button onClick={handleDelete} disabled={isDeleting} className="px-2 py-1 bg-rose-600 text-white rounded text-[8px] font-bold disabled:opacity-50">
                                    {isDeleting ? '...' : 'SÍ'}
                                </button>
                                <button onClick={() => setShowDeleteConfirm(false)} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded text-[8px] font-bold">NO</button>
                            </div>
                        )}

                        <select
                            value={selectedTicket.status || 'open'}
                            onChange={(e) => onStatusChange(selectedTicket.id, e.target.value)}
                            aria-label="Cambiar estado"
                            className="bg-white/60 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                        >
                            {Object.values(TICKET_STATUSES).map(s => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* === BODY === */}
                <div className="flex-1 flex overflow-hidden">

                    {/* LEFT: Info Panel */}
                    <div className="w-52 border-r border-slate-100/50 dark:border-slate-800/50 p-3 overflow-y-auto bg-slate-50/30 dark:bg-slate-950/20 shrink-0">
                        <TicketInfoPanel ticket={selectedTicket} />
                    </div>

                    {/* RIGHT: Chat */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50/10 dark:bg-slate-950/10 scroll-smooth">
                            {/* Original description */}
                            <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-100/60 dark:border-slate-800/50 shadow-sm relative">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/60 rounded-l-2xl" />
                                <div className="flex items-center gap-2.5 mb-2">
                                    <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                        <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">{senderName}</p>
                                        <p className="text-[8px] font-medium text-slate-400">Descripción inicial</p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed pl-9">
                                    {ticketDescription}
                                </p>
                            </div>

                            {messages.map(msg => (
                                <MessageItem key={msg.id} msg={msg} senderName={senderName} />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply Box */}
                        {selectedTicket.status !== 'resolved' && (
                            <div className="px-4 py-3 border-t border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/60">
                                <div className={`rounded-2xl border transition-all overflow-hidden ${isInternal
                                    ? 'bg-amber-50/50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20'
                                    : 'bg-white dark:bg-slate-950 border-slate-200/50 dark:border-white/5 focus-within:border-indigo-500'
                                    }`}>
                                    <textarea
                                        value={reply}
                                        onChange={(e) => setReply(e.target.value)}
                                        placeholder={isInternal ? 'Nota interna (solo staff)...' : 'Respuesta al cliente...'}
                                        className="w-full min-h-[70px] p-3.5 text-sm font-medium focus:outline-none bg-transparent text-slate-900 dark:text-slate-200 placeholder:text-slate-400 resize-none"
                                    />
                                    <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50/50 dark:bg-black/20 border-t border-inherit/30">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsInternal(!isInternal)}
                                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-all ${isInternal
                                                    ? 'bg-amber-500 text-white shadow-sm'
                                                    : 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 hover:bg-slate-300/50'
                                                    }`}
                                            >
                                                <Lock size={10} />
                                                {isInternal ? 'Interna' : 'Hacer Interna'}
                                            </button>

                                            {/* Canned Responses */}
                                            <CannedResponsePicker onSelect={(text) => setReply(reply ? `${reply}\n\n${text}` : text)} />
                                        </div>

                                        <button
                                            onClick={onReply}
                                            disabled={isSendingReply || !reply.trim()}
                                            className={`flex items-center gap-2 px-5 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${isSendingReply || !reply.trim()
                                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                                : `text-white active:scale-95 shadow-md ${isInternal ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/15'}`
                                                }`}
                                        >
                                            {isSendingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                            {isSendingReply ? 'Enviando' : isInternal ? 'Registrar' : 'Enviar'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});
TicketDetailInner.displayName = 'TicketDetailInner';

// --- CONTAINER ---
const TicketDetail = () => {
    const {
        selectedTicket, messages, handleStatusChange,
        reply, setReply, isInternal, setIsInternal, handleReply,
        isSendingReply, handleDeleteTicket, messagesEndRef
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
