import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

interface DraftData {
    templateId: string;
    restaurantId: string;
    restaurantName: string;
    variables: Record<string, string>;
    finalContent: string;
    step: number;
    updatedAt: Date;
}

interface UseContractDraftReturn {
    draft: DraftData | null;
    loading: boolean;
    saveDraft: (data: Omit<DraftData, 'updatedAt'>) => Promise<void>;
    clearDraft: () => Promise<void>;
    hasDraft: boolean;
}

const DRAFT_COLLECTION = 'contract_drafts';
const AUTO_SAVE_INTERVAL = 15_000; // 15 seconds

export function useContractDraft(userId: string | undefined): UseContractDraftReturn {
    const [draft, setDraft] = useState<DraftData | null>(null);
    const [loading, setLoading] = useState(true);
    const pendingSave = useRef<Omit<DraftData, 'updatedAt'> | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

    // Load draft on mount
    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const loadDraft = async () => {
            try {
                const snap = await getDoc(doc(db, DRAFT_COLLECTION, userId));
                if (snap.exists()) {
                    const data = snap.data();
                    setDraft({
                        templateId: data.templateId,
                        restaurantId: data.restaurantId,
                        restaurantName: data.restaurantName,
                        variables: data.variables || {},
                        finalContent: data.finalContent || '',
                        step: data.step || 2,
                        updatedAt: data.updatedAt?.toDate?.() || new Date()
                    });
                }
            } catch (err) {
                console.error('[Draft] Error loading:', err);
            } finally {
                setLoading(false);
            }
        };

        loadDraft();
    }, [userId]);

    const saveDraft = useCallback(async (data: Omit<DraftData, 'updatedAt'>) => {
        if (!userId) return;
        pendingSave.current = data;
    }, [userId]);

    // Flush pending saves periodically
    useEffect(() => {
        if (!userId) return;

        const flush = async () => {
            const data = pendingSave.current;
            if (!data) return;
            pendingSave.current = null;

            try {
                await setDoc(doc(db, DRAFT_COLLECTION, userId), {
                    ...data,
                    updatedAt: serverTimestamp()
                }, { merge: true });
            } catch (err) {
                console.error('[Draft] Error saving:', err);
            }
        };

        timerRef.current = setInterval(flush, AUTO_SAVE_INTERVAL);
        return () => clearInterval(timerRef.current);
    }, [userId]);

    const clearDraft = useCallback(async () => {
        if (!userId) return;
        try {
            await deleteDoc(doc(db, DRAFT_COLLECTION, userId));
            setDraft(null);
        } catch (err) {
            console.error('[Draft] Error clearing:', err);
        }
    }, [userId]);

    return {
        draft,
        loading,
        saveDraft,
        clearDraft,
        hasDraft: draft !== null
    };
}
