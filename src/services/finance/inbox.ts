import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, getDocs, updateDoc, writeBatch, serverTimestamp, arrayUnion, increment, doc, setDoc, Timestamp } from 'firebase/firestore';
import type { FinancialRecord } from '../../types/finance';
import type { FinanceError } from '../../types/finance';
import { ok, err, Result } from '../../types/result';
import { mapToFinancialRecord } from './helpers';

const COLLECTION = 'financial_records';

export const financeInbox = {
    /**
     * Get ALL pending records across ALL franchises (Global Inbox)
     * REQUIRES INDEX: status (Asc) + date (Asc)
     */
    getGlobalPendingRecords: async (): Promise<FinancialRecord[]> => {
        const q = query(
            collection(db, COLLECTION),
            where('status', '==', 'submitted'),
            orderBy('date', 'asc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => mapToFinancialRecord(docSnap));
    },

    /**
     * FISCAL LOCK: Close a month preventing further edits
     */
    lockMonth: async (
        franchiseId: string,
        startDate: Date,
        endDate: Date
    ): Promise<void> => {
        const q = query(
            collection(db, COLLECTION),
            where('franchise_id', '==', franchiseId),
            where('date', '>=', startDate),
            where('date', '<=', endDate),
            where('status', '==', 'approved')
        );

        const snapshot = await getDocs(q);
        const batch = writeBatch(db);

        snapshot.docs.forEach(docSnap => {
            batch.update(docSnap.ref, {
                isLocked: true,
                is_locked: true,
                status: 'locked',
                updatedAt: serverTimestamp(),
                updated_at: serverTimestamp()
            });
        });

        await batch.commit();
    },

    /**
     * REJECT UNLOCK: Admin denies request
     */
    rejectUnlock: async (
        franchiseId: string,
        month: string,
        reason?: string
    ): Promise<Result<void, FinanceError>> => {
        const docId = `${franchiseId}_${month}`;
        const docRef = doc(db, 'financial_summaries', docId);

        await updateDoc(docRef, {
            status: 'locked',
            isLocked: true,
            is_locked: true,
            unlockReason: null,
            rejectionReason: reason || null,
            rejection_reason: reason || null,
            updatedAt: serverTimestamp(),
            updated_at: serverTimestamp(),
            statusHistory: arrayUnion({
                status: 'locked',
                timestamp: Timestamp.now(),
                reason: reason || 'No reason provided',
                action: 'rejected_by_admin'
            })
        });

        return ok(undefined);
    },

    /**
     * Aggregate record into monthly summary atomically
     * @internal
     */
    _aggregateToSummary: async (
        franchiseId: string,
        data: Partial<FinancialRecord> & { month?: string }
    ): Promise<void> => {
        try {
            let monthKey = data.month;

            if (!monthKey) {
                const date = data.date ? new Date(data.date) : new Date();
                monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }

            const docId = `${franchiseId}_${monthKey}`;
            const docRef = doc(db, 'financial_summaries', docId);

            const revenue = Number(data.revenue || (data.type === 'income' ? data.amount : 0) || 0);
            const expenses = Number(data.expenses || (data.type === 'expense' ? data.amount : 0) || 0);

            const updates: any = {
                franchiseId,
                franchise_id: franchiseId,
                month: monthKey,
                status: 'approved',
                updatedAt: serverTimestamp(),
                updated_at: serverTimestamp(),
                totalIncome: increment(revenue),
                totalExpenses: increment(expenses),
                grossIncome: increment(revenue)
            };

            if (data.breakdown) {
                if (data.breakdown.labor) {
                    updates['summary.totalExpenses'] = increment(expenses);
                }
                Object.keys(data.breakdown).forEach(key => {
                    updates[`breakdown.${key}`] = increment(Number(data.breakdown![key]) || 0);
                });
            }

            await setDoc(docRef, updates, { merge: true });
        } catch (error) {
            console.error("Error aggregating summary:", error);
        }
    },

    /**
     * DANGER: Elimina TODOS los registros financieros de una franquicia
     */
    clearFinancialData: async (
        franchiseId: string
    ): Promise<Result<void, FinanceError>> => {
        if (!franchiseId) {
            return err({ type: 'VALIDATION_ERROR', field: 'franchiseId', message: 'Franchise ID requerido' });
        }

        const batch = writeBatch(db);
        let operationCount = 0;

        const recordsQuery = query(
            collection(db, COLLECTION),
            where('franchise_id', '==', franchiseId)
        );
        const recordsSnapshot = await getDocs(recordsQuery);

        recordsSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
            operationCount++;
        });

        const summariesQuery = query(
            collection(db, 'financial_summaries'),
            where('franchiseId', '==', franchiseId)
        );
        const summariesSnapshot = await getDocs(summariesQuery);

        summariesSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
            operationCount++;
        });

        if (operationCount > 0) {
            await batch.commit();
        }

        console.log(`[Cleaner] Eliminados ${operationCount} documentos de ${franchiseId}`);
        return ok(undefined);
    }
};