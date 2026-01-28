import { db } from '../../lib/firebase';
import { collection, query, where, addDoc, updateDoc, deleteDoc, onSnapshot, orderBy, getDoc, doc, serverTimestamp, increment, setDoc } from 'firebase/firestore';
import type { FinancialRecord, RecordInput } from '../../types/finance';
import { mapToFinancialRecord, generateMonthKey } from './helpers';

const COLLECTION = 'financial_records';

export const financeRecords = {
    /**
     * Suscripción a los registros financieros de una franquicia
     */
    subscribeToRecords: (
        franchiseId: string,
        callback: (records: FinancialRecord[]) => void
    ): (() => void) => {
        if (!franchiseId) return () => { };

        const q = query(
            collection(db, COLLECTION),
            where('franchise_id', '==', franchiseId),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const records = snapshot.docs.map(docSnap => mapToFinancialRecord(docSnap));
            callback(records);
        });

        return unsubscribe;
    },

    /**
     * Añadir transacción (Gasto o Ingreso)
     */
    addRecord: async (
        franchiseId: string,
        recordData: RecordInput,
        isDraft: boolean = false
    ): Promise<string> => {
        if (!franchiseId) throw new Error("Franchise ID required");

        const dataToSave = {
            ...recordData,
            franchise_id: franchiseId,
            franchiseId,
            amount: Number(recordData.amount),
            date: recordData.date ? new Date(recordData.date) : new Date(),
            status: isDraft ? 'draft' : 'approved',
            isLocked: false,
            is_locked: false,

            createdAt: serverTimestamp(),
            created_at: serverTimestamp(),
            updatedAt: serverTimestamp(),
            updated_at: serverTimestamp(),
            submittedAt: isDraft ? null : serverTimestamp(),
            submitted_at: isDraft ? null : serverTimestamp()
        };

        const docRef = await addDoc(collection(db, COLLECTION), dataToSave);
        return docRef.id;
    },

    /**
     * Update Record Status (Admin Approval/Rejection)
     */
    updateStatus: async (
        id: string,
        newStatus: 'approved' | 'rejected',
        adminUid?: string,
        reason?: string
    ): Promise<void> => {
        const docRef = doc(db, COLLECTION, id);

        const updates: any = {
            status: newStatus,
            updatedAt: serverTimestamp(),
            updated_at: serverTimestamp()
        };

        if (newStatus === 'approved') {
            updates.approvedAt = serverTimestamp();
            updates.approved_at = serverTimestamp();
            if (adminUid) {
                updates.approvedBy = adminUid;
                updates.approved_by = adminUid;
            }
        }

        if (newStatus === 'rejected' && reason) {
            updates.rejectionReason = reason;
            updates.rejection_reason = reason;
        }

        await updateDoc(docRef, updates);
    },

    /**
     * Delete a record and reverse its contribution to summary
     */
    deleteRecord: async (recordId: string): Promise<void> => {
        const docRef = doc(db, COLLECTION, recordId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return;

        const data = docSnap.data();
        const franchiseId = data.franchise_id;

        if (franchiseId) {
            let monthKey = data.month;
            if (!monthKey && data.date) {
                const d = data.date.toDate ? data.date.toDate() : new Date(data.date);
                if (!isNaN(d.getTime())) {
                    monthKey = generateMonthKey(d);
                }
            }

            if (monthKey) {
                await financeRecords._reverseAggregation(franchiseId, monthKey, data);
            }
        }

        await deleteDoc(docRef);
    },

    /**
     * Reverse aggregation when deleting a record
     * @internal
     */
    _reverseAggregation: async (
        franchiseId: string,
        monthKey: string,
        data: any
    ): Promise<void> => {
        const summaryId = `${franchiseId}_${monthKey}`;
        const summaryRef = doc(db, 'financial_summaries', summaryId);
        const getSafeNum = (val: unknown) => Number(val) || 0;

        const revenue = getSafeNum(data.revenue) || (data.type === 'income' ? getSafeNum(data.amount) : 0);
        const expenses = getSafeNum(data.expenses) || (data.type === 'expense' ? getSafeNum(data.amount) : 0);
        const profit = getSafeNum(data.profit);
        const logisticsIncome = getSafeNum(data.logisticsIncome);

        const updates: any = {
            totalIncome: increment(-revenue),
            totalExpenses: increment(-expenses),
            grossIncome: increment(-revenue),
            revenue: increment(-revenue),
            expenses: increment(-expenses),
            profit: increment(-profit),
            logisticsIncome: increment(-logisticsIncome),
            updatedAt: serverTimestamp(),
            updated_at: serverTimestamp()
        };

        if (data.breakdown) {
            Object.keys(data.breakdown).forEach(key => {
                const val = getSafeNum(data.breakdown[key]);
                if (val > 0) {
                    updates[`breakdown.${key}`] = increment(-val);
                }
            });
        }

        await setDoc(summaryRef, updates, { merge: true });
    }
};