import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { Clock, AlertCircle, ChevronRight, ShieldCheck } from 'lucide-react';
import { type Ticket } from '../../../types/support';
import { getStatusBadgeStyle, formatRelativeTime } from '../../../components/support/SharedMessage';
import { cn } from '../../../lib/utils';


export interface TicketHistoryProps {
    onSelectTicket?: (ticketId: string) => void;

    // Controlled Mode Props (from SupportHub)
    tickets?: Ticket[];
    loading?: boolean;
    filter?: string;
    setFilter?: (f: any) => void;
    allCount?: number;
    filteredCount?: number;
}

const SkeletonTicket = () => (
    <div className="bg-white/40 dark:bg-slate-900/40 border border-white/20 dark:border-slate-800 rounded-2xl p-5 space-y-3 animate-pulse">
        <div className="flex justify-between items-start">
            <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="space-y-2">
            <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
    </div>
);

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            Sin Tickets Recientes
        </h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[200px]">
            No hay historial de consultas abierto en este momento.
        </p>
    </div>
);

const TicketHistory: React.FC<TicketHistoryProps> = ({
    onSelectTicket,
    tickets: propTickets,
    loading: propLoading
}) => {
    const { user } = useAuth();
    
    // Mode Detection: If propTickets provided, it's Controlled (by SupportHub). 
    // Otherwise, Self-Managed (fetches own data).
    const isControlled = propTickets !== undefined;

    const [fetchedTickets, setFetchedTickets] = useState<Ticket[]>([]);
    const [internalLoading, setInternalLoading] = useState(true);

    useEffect(() => {
        if (isControlled || !user?.uid) return;

        // Filter by userId or franchiseId
        const targetIds = [user.uid];
        if (user.franchiseId) targetIds.push(user.franchiseId);

        const q = query(
            collection(db, "tickets"),
            where("userId", "in", targetIds),
            orderBy("lastUpdated", "desc"),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Ticket[];
            setFetchedTickets(data);
            setInternalLoading(false);
        });
        return () => unsubscribe();
    }, [isControlled, user?.uid, user?.franchiseId]);

    const displayTickets = isControlled ? propTickets : fetchedTickets;
    const isLoading = isControlled ? propLoading : internalLoading;

    const getStatusBadge = (status: string) => {
        const statusStyle = getStatusBadgeStyle(status);
        const labels: Record<string, string> = {
            open: 'Abierto',
            resolved: 'Resuelto',
            closed: 'Cerrado',
            investigating: 'Revisando',
            pending_user: 'Respondido'
        };
 
        return (
            <span className={cn(
                "px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-black border",
                statusStyle.bg,
                statusStyle.text,
                statusStyle.border
            )}>
                {labels[status] || status}
            </span>
        );
    };

    const getPriorityBadge = (priority: string | undefined) => {
        const lowStyle = { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', icon: ShieldCheck };
        const style = priority && priority !== 'undefined' 
            ? {
                high: { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', icon: AlertCircle },
                medium: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', icon: Clock }
            }[priority] || lowStyle
            : lowStyle;
        const PriorityIcon = style.icon;
        
        return (
            <span className={cn("flex items-center gap-1.5 text-[9px] font-black px-2.5 py-1 rounded-full border", style.bg, style.text)}>
                <PriorityIcon className="w-3 h-3" />
                {priority === 'high' ? 'Crítico' : priority === 'medium' ? 'Alta' : 'Normal'}
            </span>
        );
    };

    // --- Loading State ---
    if (isLoading) {
        return (
            <div className="space-y-4">
                <SkeletonTicket />
                <SkeletonTicket />
                <SkeletonTicket />
            </div>
        );
    }

    // --- Empty State ---
    if (!displayTickets || displayTickets.length === 0) {
        return <EmptyState />;
    }

    // --- List Render ---
    return (
        <div className="flex flex-col space-y-4">
            {displayTickets.map((ticket) => (
                <div
                    key={ticket.id}
                    onClick={() => onSelectTicket && onSelectTicket(ticket.id)}
                    className={cn(
                        "group relative bg-white/70 dark:bg-slate-900/40 border border-white/50 dark:border-slate-800 backdrop-blur-md",
                        "rounded-2xl p-5 transition-all duration-300 shadow-sm",
                        onSelectTicket ? "hover:border-indigo-400/50 dark:hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 cursor-pointer" : ""
                    )}
                >
                        <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            {getStatusBadge(ticket.status || 'open')}
                            {ticket.priority && getPriorityBadge(ticket.priority)}
                        </div>
                        <span className="text-[10px] text-slate-400/80 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(ticket.lastUpdated || ticket.createdAt)}
                        </span>
                    </div>
 
                    <div className="flex justify-between items-center mt-2 pl-1">
                        <div className="min-w-0 pr-4">
                            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1 truncate uppercase tracking-tight">
                                {ticket.subject}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate opacity-80 font-medium">
                                {ticket.description || ticket.message || 'Sin descripción'}
                            </p>
                        </div>
                        {onSelectTicket && (
                            <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center opacity-60 group-hover:opacity-100 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 group-hover:text-indigo-600 transition-all transform group-hover:scale-110 shadow-sm">
                                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors" />
                            </div>
                        )}
                    </div>
 
                    {/* Hover Glow */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-indigo-500/0 group-hover:border-indigo-500/5 pointer-events-none transition-all" />
                </div>
            ))}
        </div>
    );
};
export default TicketHistory;
