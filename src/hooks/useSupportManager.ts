import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, addDoc, limit, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logAction, AUDIT_ACTIONS } from '../lib/audit';
import { sendTicketReplyEmail } from '../lib/email';
import { createNotification } from '../lib/notifications';
import { Ticket } from './useSupportHub';
export type { Ticket };

export interface Vehicle {
    id: string;
    plate: string;
    model: string;
    alias?: string;
    status: 'active' | 'maintenance' | 'stopped' | 'sold';
    currentKm: number;
    nextRevisionKm: number;
    franchise_id: string;
    [key: string]: unknown;
}

export interface TicketMessage {
    id: string;
    text: string;
    senderId: string;
    senderRole: string;
    createdAt: any;
    isInternal: boolean;
    [key: string]: any;
}

export interface SupportMetrics {
    total: number;
    open: number;
    pending: number;
    investigating: number;
    resolved: number;
    unread: number;
    critical: number;
    high: number;
    avgResponseMinutes: number;
    byCategory: {
        operativa: number;
        finanzas: number;
        tecnico: number;
        accidente: number;
    };
}

export const useSupportManager = (currentUser: any) => {
    // --- STATE ---
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [reply, setReply] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [isSendingReply, setIsSendingReply] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTab, setFilterTab] = useState<'all' | 'open' | 'resolved' | 'high' | 'unread'>('all');
    const [categoryFilter] = useState('all');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- REAL-TIME TICKETS ---
    useEffect(() => {
        const q = query(
            collection(db, "tickets"),
            orderBy("createdAt", "desc"),
            limit(50)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const t = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
            setTickets(t);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching tickets:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // --- DERIVED SELECTED TICKET ---
    const selectedTicket = useMemo(() =>
        tickets.find(t => t.id === selectedTicketId),
        [tickets, selectedTicketId]);

    // --- REAL-TIME MESSAGES (For Selected) ---
    useEffect(() => {
        if (!selectedTicketId) {
            setMessages([]);
            return;
        }
        const q = query(
            collection(db, "tickets", selectedTicketId, "messages"),
            orderBy("createdAt", "asc")
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketMessage));
            setMessages(msgs);
        }, (error) => {
            console.error("Error fetching messages:", error);
        });
        return () => unsubscribe();
    }, [selectedTicketId]);

    // --- ACTIONS ---

    const handleSelectTicket = useCallback((id: string) => {
        setSelectedTicketId(id);
    }, []);

    const handleToggleRead = useCallback(async (e: React.MouseEvent | undefined, id: string, currentReadStatus: boolean) => {
        if (e) e.stopPropagation();

        // Optimistic UI Update
        setTickets(prev => prev.map(t => t.id === id ? { ...t, read: !currentReadStatus } : t));

        try {
            await updateDoc(doc(db, "tickets", id), { read: !currentReadStatus });
        } catch (error) {
            console.error("Error toggling read:", error);
            // Revert on error (could be handled better but ok for now)
            setTickets(prev => prev.map(t => t.id === id ? { ...t, read: currentReadStatus } : t));
        }
    }, []);

    const handleStatusChange = useCallback(async (id: string, newStatus: string) => {
        try {
            // Get the current ticket to record previous status
            const currentTicket = tickets.find(t => t.id === id);
            const previousStatus = currentTicket?.status || 'unknown';

            await updateDoc(doc(db, "tickets", id), {
                status: newStatus,
                lastUpdated: serverTimestamp(),
                ...(newStatus === 'resolved' ? { resolvedAt: serverTimestamp() } : {})
            });

            // Record status change in history subcollection
            await addDoc(collection(db, "tickets", id, "history"), {
                status: newStatus,
                previousStatus,
                changedBy: currentUser?.email || currentUser?.uid || 'system',
                changedAt: serverTimestamp()
            });

            if (currentUser) {
                logAction(currentUser, AUDIT_ACTIONS.TICKET_UPDATE, { ticketId: id, status: newStatus });
            }
        } catch (error) {
            console.error("Error updating status:", error);
            throw new Error("No se pudo actualizar el estado.");
        }
    }, [currentUser, tickets]);

    const handleReply = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!reply || !selectedTicket) return;

        setIsSendingReply(true);
        try {
            // 1. Send Email (only if public)
            if (!isInternal && selectedTicket.email) {
                await sendTicketReplyEmail(
                    selectedTicket.email,
                    selectedTicket.subject,
                    reply,
                    selectedTicket.message || '',
                    selectedTicket.id
                );
            }

            // 2. Add to Messages Subcollection
            await addDoc(collection(db, "tickets", selectedTicket.id, "messages"), {
                text: reply,
                senderId: currentUser.uid,
                senderRole: 'admin',
                createdAt: serverTimestamp(),
                isInternal: isInternal
            });

            // 3. Update Parent Ticket
            const newStatus = isInternal ? selectedTicket.status : 'pending_user';

            // Safe cast if selectTicket is not strictly typed to include 'response' yet, 
            // but we added [key: string]: any to Ticket interface so it should be fine.
            await updateDoc(doc(db, "tickets", selectedTicket.id), {
                status: newStatus,
                response: isInternal ? selectedTicket.response : reply,
                respondedAt: serverTimestamp(),
                read: true,
                lastMessageAt: serverTimestamp()
            });

            if (currentUser) {
                logAction(currentUser, isInternal ? AUDIT_ACTIONS.TICKET_NOTE : AUDIT_ACTIONS.TICKET_REPLIED, { ticketId: selectedTicket.id });
            }

            // Notification
            if (!isInternal && selectedTicket.uid) {
                createNotification(
                    selectedTicket.uid,
                    'Nueva respuesta de Soporte',
                    `Han respondido a tu ticket: ${selectedTicket.subject}`,
                    'info',
                    `/support`
                );
            }

            setReply('');
            setIsInternal(false);
        } catch (error) {
            console.error("Reply error:", error);
            throw error;
        } finally {
            setIsSendingReply(false);
        }
    }, [reply, selectedTicket, currentUser, isInternal]);

    const handleDeleteTicket = useCallback(async (id: string) => {
        try {
            // The user said "elimina todos los tickets", usually they mean hard delete in these types of apps.
            // I'll do a hard delete as it's cleaner for "starting over".
            // 1. Prepare batch
            const batch = writeBatch(db);

            // 2. Queue messages for deletion
            const msgsSnap = await getDocs(collection(db, "tickets", id, "messages"));
            msgsSnap.forEach(mDoc => batch.delete(mDoc.ref));

            // 3. Queue ticket for deletion
            batch.delete(doc(db, "tickets", id));

            // 4. Commit all at once
            await batch.commit();

            if (currentUser) {
                logAction(currentUser, AUDIT_ACTIONS.TICKET_UPDATE, { ticketId: id, action: 'deleted' });
            }
            if (selectedTicketId === id) setSelectedTicketId(null);
        } catch (error) {
            console.error("Delete error:", error);
            throw new Error("No se pudo eliminar el ticket.");
        }
    }, [currentUser, selectedTicketId]);

    const handleClearAllTickets = useCallback(async () => {
        try {
            const { getDocs, writeBatch } = await import('firebase/firestore');
            const snapshot = await getDocs(collection(db, "tickets"));
            const batch = writeBatch(db);

            for (const tDoc of snapshot.docs) {
                // Delete messages subcollection for each ticket
                const msgsSnap = await getDocs(collection(db, "tickets", tDoc.id, "messages"));
                msgsSnap.forEach(mDoc => batch.delete(mDoc.ref));
                batch.delete(tDoc.ref);
            }

            await batch.commit();
            setSelectedTicketId(null);

            if (currentUser) {
                logAction(currentUser, AUDIT_ACTIONS.TICKET_UPDATE, { action: 'clear_all' });
            }
        } catch (error) {
            console.error("Clear all error:", error);
            throw new Error("No se pudo reiniciar el centro de soporte.");
        }
    }, [currentUser]);

    // --- FILTER & METRICS LOGIC ---

    const filteredTickets = useMemo(() => {
        let result = tickets;

        if (filterTab === 'open') result = result.filter(t => t.status !== 'resolved');
        else if (filterTab === 'resolved') result = result.filter(t => t.status === 'resolved');
        else if (filterTab === 'high') result = result.filter(t => t.urgency === 'high' || t.urgency === 'critical');
        else if (filterTab === 'unread') result = result.filter(t => !t.read);

        if (categoryFilter !== 'all') result = result.filter(t => t.category === categoryFilter);

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.subject?.toLowerCase().includes(q) ||
                t.email?.toLowerCase().includes(q) ||
                t.message?.toLowerCase().includes(q)
            );
        }
        return result;
    }, [tickets, filterTab, categoryFilter, searchQuery]);

    const metrics = useMemo((): SupportMetrics => {
        // Calculation logic extracted precisely from original
        const total = tickets.length;
        const open = tickets.filter(t => t.status === 'open' || !t.status).length;
        const pending = tickets.filter(t => t.status === 'pending_user').length;
        const investigating = tickets.filter(t => t.status === 'investigating').length;
        const resolved = tickets.filter(t => t.status === 'resolved').length;
        const unread = tickets.filter(t => !t.read).length;
        const critical = tickets.filter(t => t.urgency === 'critical').length;
        const high = tickets.filter(t => t.urgency === 'high').length;

        const resolvedWithTime = tickets.filter(t => t.respondedAt && t.createdAt);
        const avgResponseMinutes = resolvedWithTime.length > 0
            ? resolvedWithTime.reduce((acc, t) => {
                const created = t.createdAt?.toDate ? t.createdAt.toDate() : new Date();
                const responded = t.respondedAt?.toDate ? t.respondedAt.toDate() : new Date();
                return acc + (responded.getTime() - created.getTime()) / (1000 * 60);
            }, 0) / resolvedWithTime.length
            : 0;

        const byCategory = {
            operativa: tickets.filter(t => t.category === 'operativa').length,
            finanzas: tickets.filter(t => t.category === 'finanzas').length,
            tecnico: tickets.filter(t => t.category === 'tecnico').length,
            accidente: tickets.filter(t => t.category === 'accidente').length,
        };

        return { total, open, pending, investigating, resolved, unread, critical, high, avgResponseMinutes, byCategory };
    }, [tickets]);

    // CSV Export
    const exportToCSV = useCallback(() => {
        const headers = ['ID', 'Email', 'Asunto', 'Categoría', 'Urgencia', 'Estado', 'Fecha Creación', 'Respuesta'];
        const rows = filteredTickets.map(t => [
            t.id,
            t.email,
            t.subject,
            t.category || 'N/A',
            t.urgency,
            t.status,
            t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString() : 'Pendiente',
            t.response || 'Sin respuesta'
        ]);

        const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tickets_export_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    }, [filteredTickets]);

    return {
        // State
        tickets,
        filteredTickets,
        loading,
        selectedTicketId,
        selectedTicket,
        messages,
        metrics,

        // Filter State
        searchQuery, setSearchQuery,
        filterTab, setFilterTab,

        // Input State
        reply, setReply,
        isInternal, setIsInternal,
        isSendingReply,

        // Actions
        handleSelectTicket,
        handleToggleRead,
        handleStatusChange,
        handleReply,
        handleDeleteTicket,
        handleClearAllTickets,
        exportToCSV,
        messagesEndRef
    };
};
