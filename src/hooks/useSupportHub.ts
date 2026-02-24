import { useState, useEffect, useCallback, useMemo } from 'react';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, updateDoc, doc, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendTicketCreatedEmail } from '../lib/email';
import { logAction, AUDIT_ACTIONS } from '../lib/audit';
import { getSuggestions } from '../lib/knowledgeBase';
import { type Ticket } from '../types/support';
export type { Ticket };

export interface KnowledgeArticle {
    id: string;
    title: string;
    category?: string;
}

export interface CreateTicketParams {
    subject: string;
    message: string;
    urgency: Ticket['urgency'];
    category: string;
}

interface SupportUser {
    uid: string;
    email: string | null;
    role?: string;
    franchiseId?: string;
    displayName?: string | null;
}

export const useSupportHub = (user: SupportUser | null) => {
    const [myTickets, setMyTickets] = useState<Ticket[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'resolved'>('all');
    const [suggestions, setSuggestions] = useState<{ id: string; title: string; category: string }[]>([]);

    // --- REAL-TIME DATA ---
    useEffect(() => {
        if (!user) return;

        // Build target IDs: always include uid, add franchiseId if different
        const targetIds = [user.uid];
        if (user.franchiseId && user.franchiseId !== user.uid) {
            targetIds.push(user.franchiseId);
        }

        // Query tickets where userId matches any of our target IDs
        // This covers: tickets created by this user, or tickets linked to their franchise
        const qFilter = targetIds.length === 1
            ? where("userId", "==", targetIds[0])
            : where("userId", "in", targetIds);

        const q = query(
            collection(db, "tickets"),
            qFilter,
            orderBy("createdAt", "desc"),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tickets = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Ticket));
            setMyTickets(tickets);
            setLoadingTickets(false);
        }, (error) => {
            console.error("[useSupportHub] Query error:", error.code, error.message);
            setLoadingTickets(false);
        });

        return () => unsubscribe();
    }, [user]);

    // --- ACTIONS ---

    const handleSubjectChange = useCallback((text: string) => {
        if (text.length > 2) {
            const matches = getSuggestions(text);
            setSuggestions(matches.map((m: KnowledgeArticle) => ({
                id: m.id || Math.random().toString(),
                title: m.title || '',
                category: m.category || 'General'
            })));
        } else {
            setSuggestions([]);
        }
    }, []);

    const createTicket = useCallback(async ({ subject, message, urgency, category }: CreateTicketParams) => {
        if (!user || !subject || !message) return;

        setSending(true);
        try {
            const ticketData = {
                // Identity fields — both legacy and new
                uid: user.uid,
                userId: user.uid,
                franchiseId: user.franchiseId || user.uid,
                email: user.email,
                displayName: user.displayName || user.email,
                // Content
                subject,
                message,
                category,
                // Status
                urgency,
                priority: urgency, // Mirror for security rules compatibility
                status: 'open',
                read: false,
                hasAttachment: !!file,
                // Timestamps
                createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, "tickets"), ticketData);

            // Upload file if present
            let attachmentUrl: string | null = null;
            if (file) {
                setUploading(true);
                try {
                    const storageRef = ref(storage, `tickets/${docRef.id}/${file.name}`);
                    await uploadBytes(storageRef, file);
                    attachmentUrl = await getDownloadURL(storageRef);
                    await updateDoc(doc(db, "tickets", docRef.id), { attachmentUrl });
                } catch (uploadErr) {
                    console.error("Upload failed but ticket created:", uploadErr);
                } finally {
                    setUploading(false);
                }
            }

            // Background tasks (audit + email) — fire-and-forget
            Promise.all([
                logAction(user, AUDIT_ACTIONS.TICKET_CREATED, {
                    ticketId: docRef.id,
                    subject,
                    category,
                    urgency,
                    hasAttachment: !!file
                }),
                sendTicketCreatedEmail({
                    id: docRef.id,
                    email: user.email,
                    subject,
                    message: message + (attachmentUrl && file ? `\n\n[Adjunto: ${file.name}]` : ''),
                    urgency,
                    category
                })
            ]).catch(err => console.warn("Background tasks failed:", err));

            setSuccess(true);
            setFile(null);
            setSuggestions([]);
            setTimeout(() => setSuccess(false), 5000);

            return true;
        } catch (error) {
            console.error("Error creating ticket:", error);
            throw error;
        } finally {
            setSending(false);
        }
    }, [user, file]);

    // --- DERIVED STATE ---
    const filteredTickets = useMemo(() => {
        if (ticketFilter === 'all') return myTickets;
        if (ticketFilter === 'open') return myTickets.filter(t => t.status !== 'resolved');
        return myTickets.filter(t => t.status === 'resolved');
    }, [myTickets, ticketFilter]);

    return {
        tickets: filteredTickets,
        allTicketsCount: myTickets.length,
        loading: loadingTickets,
        sending,
        success,
        suggestions,
        setSuggestions,
        file,
        setFile,
        uploading,
        handleSubjectChange,
        createTicket,
        setTicketFilter,
        ticketFilter,
        setSuccess
    };
};
