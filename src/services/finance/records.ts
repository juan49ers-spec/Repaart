import { db } from '../../lib/firebase';
import { collection, query, where, addDoc, updateDoc, deleteDoc, onSnapshot, orderBy, getDoc, doc, serverTimestamp, increment, setDoc } from 'firebase/firestore';
import type { FinancialRecord, RecordInput, FinanceError } from '../../types/finance';
import { mapToFinancialRecord, generateMonthKey } from './helpers';
import { Result, ok, err } from '../../types/result';

const COLLECTION = 'financial_records';

export const financeRecords = {
    /**
     * Subscribe to financial records for a franchise
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
        }, (error) => {
            console.error("Error subscribing to records:", error);
            callback([]); // Fallback safely
        });

        return unsubscribe;
    },

    /**
     * Add transaction (Expense or Income)
     */
    addRecord: async (
        franchiseId: string,
        recordData: RecordInput,
        isDraft: boolean = false
    ): Promise<Result<string, FinanceError>> => {
        if (!franchiseId) {
            return err({ type: 'VALIDATION_ERROR', field: 'franchiseId', message: "Franchise ID required" });
        }

        try {
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
            return ok(docRef.id);
        } catch (error: any) {
            console.error("Error adding record:", error);
            return err({ type: 'UNKNOWN_ERROR', message: error.message || "Failed to add record", cause: error });
        }
    },

    /**
     * Update Record Status (Admin Approval/Rejection)
     */
    updateStatus: async (
        id: string,
        newStatus: 'approved' | 'rejected',
        adminUid?: string,
        reason?: string
    ): Promise<Result<void, FinanceError>> => {
        try {
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
            return ok(undefined);
        } catch (error: any) {
            console.error("Error updating status:", error);
            return err({ type: 'UNKNOWN_ERROR', message: error.message || "Failed to update record status", cause: error });
        }
    },

    /**
     * Delete a record and reverse its contribution to summary
     */
    deleteRecord: async (recordId: string): Promise<Result<void, FinanceError>> => {
        try {
            const docRef = doc(db, COLLECTION, recordId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                // If not found, technically it's already "deleted" or never existed.
                // But following the pattern, we return NOT_FOUND.
                // Since we don't have franchiseId, we put 'unknown' or handle it.
                // Actually, if it's not found, we can't really do anything else.
                return err({ type: 'NOT_FOUND', franchiseId: 'unknown', message: "Record not found" });
            }

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
            return ok(undefined);
        } catch (error: any) {
            console.error("Error deleting record:", error);
            return err({ type: 'UNKNOWN_ERROR', message: error.message || "Failed to delete record", cause: error });
        }
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
        try {
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
        } catch (e) {
            console.error("Error reversing aggregation (non-fatal):", e);
        }
    }
};