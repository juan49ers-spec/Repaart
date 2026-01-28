import { db } from '../../lib/firebase';
import { collection, query, where, doc, getDoc, setDoc, updateDoc, getDocs, serverTimestamp, arrayUnion, Timestamp, deleteDoc, writeBatch } from 'firebase/firestore';
import type { MonthlyData } from '../../types/finance';
import { ok, err, Result } from '../../types/result';
import type { FinanceError } from '../../types/finance';
import { mapToMonthlyData } from './helpers';

export const financeSummary = {
    /**
     * Obtener resumen financiero mensual
     */
    getFinancialData: async (
        franchiseId: string,
        month: string
    ): Promise<MonthlyData | null> => {
        if (!franchiseId || !month) return null;

        const docId = `${franchiseId}_${month}`;
        const docRef = doc(db, 'financial_summaries', docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return mapToMonthlyData(docSnap, franchiseId);
        }

        return null;
    },

    /**
     * Guardar/Actualizar resumen mensual
     */
    updateFinancialData: async (
        franchiseId: string,
        month: string,
        data: Partial<MonthlyData>
    ): Promise<Result<void, FinanceError>> => {
        if (!franchiseId) {
            return err({ type: 'PERMISSION_DENIED', franchiseId: franchiseId || 'unknown' });
        }

        if (!month) {
            return err({ type: 'VALIDATION_ERROR', field: 'month', message: 'Month is required' });
        }

        if (!month.match(/^\d{4}-\d{2}$/)) {
            return err({ type: 'INVALID_FORMAT', field: 'month', expected: 'YYYY-MM', received: month });
        }

        const docId = `${franchiseId}_${month}`;
        const docRef = doc(db, 'financial_summaries', docId);

        const existingSnap = await getDoc(docRef);
        const existing: any = existingSnap.exists() ? existingSnap.data() : {};

        const existingRevenue = Number(existing.totalIncome ?? existing.revenue ?? 0);
        const existingExpenses = Number(existing.totalExpenses ?? existing.expenses ?? 0);
        const existingStatus = existing.status;
        const existingIsLocked = existing.isLocked ?? existing.is_locked ?? false;

        const hasIncome = data.totalIncome !== undefined || data.revenue !== undefined;
        const hasExpenses = data.totalExpenses !== undefined || data.expenses !== undefined;

        const nextRevenue = Number(hasIncome ? (data.totalIncome ?? data.revenue ?? 0) : existingRevenue);
        const nextExpenses = Number(hasExpenses ? (data.totalExpenses ?? data.expenses ?? 0) : existingExpenses);
        const nextProfit = nextRevenue - nextExpenses;

        const nextStatus = (data.status ?? existingStatus ?? 'approved') as any;

        let nextIsLocked = (data.isLocked ?? (data as any).is_locked ?? existingIsLocked) as boolean;

        if (nextStatus === 'open') nextIsLocked = false;
        else if (['submitted', 'locked', 'unlock_requested', 'approved'].includes(nextStatus)) {
            nextIsLocked = true;
        }

        const sanitizedData: any = {
            ...data,
            totalIncome: nextRevenue,
            totalExpenses: nextExpenses,
            grossIncome: nextRevenue,
            revenue: nextRevenue,
            expenses: nextExpenses,
            profit: nextProfit,
            isLocked: nextIsLocked,
            is_locked: nextIsLocked
        };

        if (data.breakdown !== undefined) {
            sanitizedData.breakdown = Object.fromEntries(
                Object.entries(data.breakdown || {}).map(([k, v]) => [k, Number(v) || 0])
            );
        }

        await setDoc(docRef, {
            ...sanitizedData,
            franchiseId,
            franchise_id: franchiseId,
            month,
            status: nextStatus,
            updatedAt: serverTimestamp(),
            updated_at: serverTimestamp()
        }, { merge: true });

        return ok(undefined);
    },

    /**
     * Obtener historial de cierres
     */
    fetchClosures: async (
        franchiseId: string
    ): Promise<Result<MonthlyData[], FinanceError>> => {
        if (!franchiseId) {
            return err({ type: 'PERMISSION_DENIED', franchiseId: 'unknown' });
        }

        const q = query(
            collection(db, 'financial_summaries'),
            where('franchiseId', '==', franchiseId)
        );

        const snapshot = await getDocs(q);

        const data = snapshot.docs
            .map(docSnap => mapToMonthlyData(docSnap, franchiseId))
            .filter(item => item.status !== 'deleted');

        return ok(data);
    },

    /**
     * Get financial data for a specific year
     */
    getFinancialYearlyData: async (
        franchiseId: string,
        year: number
    ): Promise<MonthlyData[]> => {
        if (!franchiseId) return [];

        const result = await financeSummary.fetchClosures(franchiseId);

        if (!result.success) {
            console.error("Error fetching yearly data:", result.error);
            return [];
        }

        return result.data.filter((record: any) => {
            if (record.month) {
                return record.month.startsWith(`${year}-`);
            }
            if (record.date) {
                const d = record.date instanceof Date ? record.date : (record.date as any).toDate();
                return d.getFullYear() === year;
            }
            return false;
        });
    },

    /**
     * UNLOCK MONTH: Allow franchise to edit closed month
     */
    unlockMonth: async (
        franchiseId: string,
        month: string
    ): Promise<Result<void, FinanceError>> => {
        if (!franchiseId || !month) {
            return err({ type: 'VALIDATION_ERROR', field: 'month', message: 'Missing args' });
        }

        const docId = `${franchiseId}_${month}`;
        const docRef = doc(db, 'financial_summaries', docId);

        await updateDoc(docRef, {
            status: 'open',
            isLocked: false,
            is_locked: false,
            updatedAt: serverTimestamp(),
            updated_at: serverTimestamp(),
            statusHistory: arrayUnion({
                status: 'open',
                timestamp: Timestamp.now(),
                action: 'unlocked_by_admin'
            })
        });

        return ok(undefined);
    },

    /**
     * REQUEST UNLOCK: Franchise requests to edit a locked month
     */
    requestUnlock: async (
        franchiseId: string,
        month: string,
        reason: string
    ): Promise<Result<void, FinanceError>> => {
        const docId = `${franchiseId}_${month}`;
        const docRef = doc(db, 'financial_summaries', docId);

        await updateDoc(docRef, {
            status: 'unlock_requested',
            unlockReason: reason,
            updatedAt: serverTimestamp(),
            statusHistory: arrayUnion({
                status: 'unlock_requested',
                timestamp: Timestamp.now(),
                reason: reason,
                action: 'requested_by_franchise'
            })
        });

        return ok(undefined);
    },

    /**
     * DELETE SUMMARY BY ID
     */
    deleteSummaryDocument: async (docId: string): Promise<void> => {
        const docRef = doc(db, 'financial_summaries', docId);
        await deleteDoc(docRef);
    },

    /**
     * Reset month summary (delete all records and summary)
     */
    resetMonthSummary: async (
        franchiseId: string,
        monthKey: string
    ): Promise<void> => {
        const batch = writeBatch(db);

        const [year, month] = monthKey.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const recordsQuery = query(
            collection(db, 'financial_records'),
            where('franchise_id', '==', franchiseId),
            where('date', '>=', startDate),
            where('date', '<=', endDate)
        );

        const recordsSnap = await getDocs(recordsQuery);
        recordsSnap.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        const docId = `${franchiseId}_${monthKey}`;
        const summaryRef = doc(db, 'financial_summaries', docId);
        batch.delete(summaryRef);

        await batch.commit();
        console.log(`[Finance] Month data destroyed successfully.`);
    },

    /**
     * FORCE SYNC: Recalculates summary for a specific month
     */
    recalculateMonthSummary: async (
        franchiseId: string,
        monthKey: string
    ): Promise<void> => {
        console.log(`[Finance] Force Syncing for ${franchiseId} - ${monthKey}`);

        const [year, month] = monthKey.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const q = query(
            collection(db, 'financial_records'),
            where('franchise_id', '==', franchiseId),
            where('date', '>=', startDate),
            where('date', '<=', endDate)
        );

        const snap = await getDocs(q);

        let totalIncome = 0;
        let totalExpenses = 0;
        let accRevenue = 0;
        let accExpenses = 0;
        let accProfit = 0;
        let accLogisticsOnly = 0;

        const breakdown: any = {};

        snap.docs.forEach(doc => {
            const d = doc.data();
            if (d.status === 'draft' || d.status === 'rejected') return;

            const rev = Number(d.revenue || (d.type === 'income' ? d.amount : 0) || 0);
            const exp = Number(d.expenses || (d.type === 'expense' ? d.amount : 0) || 0);
            const prof = Number(d.profit || (rev - exp) || 0);

            accRevenue += rev;
            accExpenses += exp;
            accProfit += prof;
            if (d.logisticsIncome) accLogisticsOnly += Number(d.logisticsIncome);

            totalIncome += rev;
            totalExpenses += exp;

            if (d.breakdown) {
                Object.keys(d.breakdown).forEach(k => {
                    breakdown[k] = (breakdown[k] || 0) + (Number(d.breakdown[k]) || 0);
                });
            }
        });

        console.log(`[Finance] Recalculated: Income=${totalIncome}, Expenses=${totalExpenses}, Profit=${accProfit}. Docs found: ${snap.size}`);

        const summaryId = `${franchiseId}_${monthKey}`;
        const summaryRef = doc(db, 'financial_summaries', summaryId);

        await setDoc(summaryRef, {
            franchiseId,
            franchise_id: franchiseId,
            month: monthKey,
            status: 'approved',
            totalIncome,
            totalExpenses,
            grossIncome: totalIncome,
            revenue: accRevenue,
            expenses: accExpenses,
            profit: accProfit,
            logisticsIncome: accLogisticsOnly,
            breakdown,
            updatedAt: serverTimestamp(),
            updated_at: serverTimestamp(),
            lastForceSync: serverTimestamp()
        }, { merge: true });
    }
};