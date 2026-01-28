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

export const useSupportHub = (user: any) => {
    // --- STATE ---
    const [myTickets, setMyTickets] = useState<Ticket[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);

    // Upload State (Atomic)
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // Filters & Search
    const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'resolved'>('all');

    // Form Assistant
    const [suggestions, setSuggestions] = useState<{ id: string; title: string; category: string }[]>([]);

    // --- REAL-TIME DATA ---
    useEffect(() => {
        if (!user) return;

        const targetIds = [user.uid];
        if (user.franchiseId) targetIds.push(user.franchiseId);

        console.log("🔍 [useSupportHub] Fetching tickets for:", targetIds);

        // Try to match both legacy 'uid' and new 'userId'.
        // Using 'in' operator on 'userId' as it's the new standard from NewTicketForm.
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
            console.log("✅ [useSupportHub] Tickets snapshot received. Count:", snapshot.docs.length);
            const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
            // Sort manually if orderBy is disabled
            const sortedTickets = tickets.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                return dateB.getTime() - dateA.getTime();
            });
            setMyTickets(sortedTickets);
            setLoadingTickets(false);
        }, (error) => {
            console.error("❌ [useSupportHub] Firestore error details:", {
                code: error.code,
                message: error.message,
                uid: user.uid,
                targetIds
            });
            setLoadingTickets(false);
        });

        return () => unsubscribe();
    }, [user]);

    // --- ACTIONS ---

    const handleSubjectChange = useCallback((text: string) => {
        if (text.length > 2) {
            const matches = getSuggestions(text);
            setSuggestions(matches.map((m: any) => ({
                id: m.id || Math.random().toString(),
                title: m.title || m.subject || '',
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
            // 1. Initial Firestore Doc
            const ticketData = {
                uid: user.uid,
                email: user.email,
                subject,
                message,
                urgency,
                category,
                status: 'open',
                createdAt: serverTimestamp(),
                read: false,
                hasAttachment: !!file
            };

            const docRef = await addDoc(collection(db, "tickets"), ticketData);

            // 2. Upload File (if exists)
            let attachmentUrl: string | null = null;
            if (file) {
                setUploading(true);
                try {
                    const storageRef = ref(storage, `tickets / ${docRef.id}/${file.name}`);
                    await uploadBytes(storageRef, file);
                    attachmentUrl = await getDownloadURL(storageRef);

                    // Update ticket with URL
                    await updateDoc(doc(db, "tickets", docRef.id), { attachmentUrl });
                } catch (uploadErr) {
                    console.error("Upload failed but ticket created:", uploadErr);
                    // We don't fail the whole process if upload fails, but we might warn
                } finally {
                    setUploading(false);
                }
            }

            // 3. Post-Processing & Notifications (Parallelized)
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
            ]).catch(err => console.warn("Background tasks (Audit/Email) failed partially:", err));

            setSuccess(true);
            setFile(null); // Reset file
            setSuggestions([]);

            // Auto-hide success message
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
        // Data
        tickets: filteredTickets,
        allTicketsCount: myTickets.length,
        loading: loadingTickets,

        // Form State
        sending,
        success,
        suggestions,
        setSuggestions, // In case we need manual clear

        // Upload State
        file,
        setFile,
        uploading,

        // Actions
        handleSubjectChange,
        createTicket,
        setTicketFilter,
        ticketFilter,

        // Helper
        setSuccess
    };
};
