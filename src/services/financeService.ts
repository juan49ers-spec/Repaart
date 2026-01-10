import { db } from '../lib/firebase';
import type { Result } from '../types/result';
import type { FinanceError } from '../types/finance';
import { ok, err } from '../types/result';
import {
    collection,
    query,
    where,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    onSnapshot,
    orderBy,
    getDoc,
    setDoc,
    getDocs,
    Unsubscribe,
    DocumentData,
    FieldValue,
    writeBatch,
    increment,
    arrayUnion,
    Timestamp
} from 'firebase/firestore';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface FinancialRecord {
    id: string;
    franchise_id: string;
    amount: number;
    date: Date;
    status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'locked';
    type: 'income' | 'expense';
    category?: string;
    description?: string;
    admin_notes?: string;

    // --- AUDIT TRAIL ---
    created_at?: Date | FieldValue;
    updated_at?: Date | FieldValue;
    submitted_at?: Date | FieldValue;
    approved_at?: Date | FieldValue;
    approved_by?: string; // Admin UID
    rejection_reason?: string;

    // --- CONTROLS ---
    is_locked?: boolean;
}

export interface RecordInput {
    amount: number | string;
    date?: Date | string;
    status?: 'pending' | 'approved' | 'rejected';
    type?: 'income' | 'expense';
    category?: string;
    description?: string;
}

export interface MonthlyData {
    totalIncome?: number;
    totalExpenses?: number;
    revenue?: number;
    expenses?: number;
    profit?: number;
    netProfit?: number;
    status?: string;
    recordCount?: number;
    franchiseId?: string;
    month?: string;
    totalHours?: number;
    updatedAt?: FieldValue;
    [key: string]: unknown; // Allow additional properties
}

// =====================================================
// SERVICE
// =====================================================

const COLLECTION = 'financial_records';

export const financeService = {
    /**
     * Suscripción a los registros financieros de una franquicia
     */
    subscribeToRecords: (
        franchiseId: string,
        callback: (records: FinancialRecord[]) => void
    ): Unsubscribe => {
        if (!franchiseId) return () => { };

        const q = query(
            collection(db, COLLECTION),
            where('franchise_id', '==', franchiseId),
            orderBy('date', 'desc') // Ordenar por fecha, más reciente primero
        );

        return onSnapshot(q, (snapshot) => {
            const records: FinancialRecord[] = snapshot.docs.map(doc => {
                const data = doc.data() as DocumentData;
                return {
                    id: doc.id,
                    ...data,
                    // Normalizamos la fecha para evitar errores en UI
                    date: data.date?.toDate ? data.date.toDate() : new Date(data.date)
                } as FinancialRecord;
            });
            callback(records);
        });
    },

    /**
     * Añadir transacción (Gasto o Ingreso)
     */
    addRecord: async (franchiseId: string, recordData: RecordInput, isDraft: boolean = false): Promise<void> => {
        if (!franchiseId) throw new Error("Franchise ID required");

        await addDoc(collection(db, COLLECTION), {
            ...recordData,
            franchise_id: franchiseId,
            amount: Number(recordData.amount),
            date: recordData.date ? new Date(recordData.date) : new Date(),
            status: isDraft ? 'draft' : 'approved', // FIXED: Auto-approve for franchise inputs
            is_locked: false,

            // Timestamps
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
            submitted_at: isDraft ? null : serverTimestamp()
        });

        // FIXED: Atomic aggregation to keep widgets in sync

        // Only aggregate if NOT a draft (but now we force approved, so always aggregate)
        if (!isDraft) {
            await financeService._aggregateToSummary(franchiseId, recordData);
        }
    },

    /**
     * Update Record Status (Admin Approval/Rejection)
     */
    updateStatus: async (id: string, newStatus: 'approved' | 'rejected', adminUid?: string, reason?: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION, id);

            const updates: any = {
                status: newStatus,
                updated_at: serverTimestamp()
            };

            if (newStatus === 'approved') {
                updates.approved_at = serverTimestamp();
                if (adminUid) updates.approved_by = adminUid;
            }

            if (newStatus === 'rejected' && reason) {
                updates.rejection_reason = reason;
            }

            await updateDoc(docRef, updates);
        } catch (error) {
            console.error("Error updating status:", error);
            throw error;
        }
    },

    deleteRecord: async (recordId: string): Promise<void> => {
        const docRef = doc(db, COLLECTION, recordId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            // Decrement stats from summary (Reverse operation)
            // We pass negative numbers to increment() effectively decrementing
            // We need to fetch the record data first to know which month and amounts to subtract.

            // To reuse _aggregateToSummary, we can construct a "negative" data object?
            // Or better, let _aggregateToSummary handle a 'multiplier' arg?
            // Let's manually do it here to be explicit and safe.

            // const date = data.date?.toDate ? data.date.toDate() : new Date(data.date); // UNUSED
            // const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // UNUSED - Shadowed below
            const franchiseId = data.franchise_id;

            if (franchiseId) {
                // Use month field if available (trusted from UI), else derived from date
                let monthKey = data.month;
                if (!monthKey && data.date) {
                    const d = data.date.toDate ? data.date.toDate() : new Date(data.date);
                    if (!isNaN(d.getTime())) {
                        monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    }
                }

                if (monthKey) {
                    const summaryId = `${franchiseId}_${monthKey}`;
                    const summaryRef = doc(db, 'financial_summaries', summaryId);

                    // Helper to safely get number
                    const getNum = (val: any) => Number(val) || 0;

                    // Determine values to subtract (Reverse of aggregation)
                    // Check specific fields first (revenue/expenses), then fall back to amount/type
                    const revenue = getNum(data.revenue) || (data.type === 'income' ? getNum(data.amount) : 0);
                    const expenses = getNum(data.expenses) || (data.type === 'expense' ? getNum(data.amount) : 0);

                    const profit = getNum(data.profit);
                    const logisticsIncome = getNum(data.logisticsIncome);

                    const updates: any = {
                        totalIncome: increment(-revenue),
                        totalExpenses: increment(-expenses),
                        grossIncome: increment(-revenue), // Legacy

                        // EXPLICIT FIELDS (Fix for Zombie Data)
                        revenue: increment(-revenue),
                        expenses: increment(-expenses),
                        profit: increment(-profit),
                        logisticsIncome: increment(-logisticsIncome),

                        updatedAt: serverTimestamp()
                    };

                    if (data.breakdown) {
                        // Update flat breakdown keys
                        Object.keys(data.breakdown).forEach(key => {
                            const val = getNum(data.breakdown[key]);
                            if (val > 0) {
                                updates[`breakdown.${key}`] = increment(-val);
                            }
                        });

                        // Legacy support: if labor/cogs were top level in some versions?
                        // Assuming breakdown object is the source of truth now.
                    }


                    await setDoc(summaryRef, updates, { merge: true });
                } else {
                    console.warn("[Finance] Could not determine monthKey for deletion", data);
                }
            }
        }

        await deleteDoc(docRef);
    },

    // --- ADMIN TOOLS ---

    /**
     * Get ALL pending records across ALL franchises (Global Inbox)
     * REQUIRES INDEX: status (Asc) + date (Asc)
     */
    getGlobalPendingRecords: async (): Promise<FinancialRecord[]> => {
        try {
            const q = query(
                collection(db, COLLECTION),
                where('status', '==', 'submitted'),
                orderBy('date', 'asc') // FIFO (First In, First Out)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as FinancialRecord));
        } catch (error) {
            console.error("Error fetching global pending records:", error);
            return [];
        }
    },

    /**
     * FISCAL LOCK: Close a month preventing further edits
     */
    lockMonth: async (franchiseId: string, startDate: Date, endDate: Date): Promise<void> => {
        try {
            const q = query(
                collection(db, COLLECTION),
                where('franchise_id', '==', franchiseId),
                where('date', '>=', startDate),
                where('date', '<=', endDate),
                where('status', '==', 'approved') // Only lock approved records
            );

            const snapshot = await getDocs(q);
            const batch = writeBatch(db);

            snapshot.docs.forEach(doc => {
                batch.update(doc.ref, {
                    is_locked: true,
                    status: 'locked'
                });
            });

            await batch.commit();
        } catch (error) {
            console.error("Error locking month:", error);
            throw error;
        }
    },

    /**
     * Obtener resumen financiero mensual (Snapshot)
     * Collection: financial_summaries -> DocID: {franchiseId}_{month}
     */
    getFinancialData: async (franchiseId: string, month: string): Promise<MonthlyData | null> => {
        if (!franchiseId || !month) return null;
        const docId = `${franchiseId}_${month}`;
        const docRef = doc(db, 'financial_summaries', docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as MonthlyData;
        }
        return null;
    },

    /**
     * Guardar/Actualizar resumen mensual
     * @returns Result with void on success or specific error
     */
    updateFinancialData: async (
        franchiseId: string,
        month: string,
        data: MonthlyData
    ): Promise<Result<void, FinanceError>> => {
        try {
            // Validation
            if (!franchiseId) {
                return err({ type: 'PERMISSION_DENIED', franchiseId: franchiseId || 'unknown' });
            }

            if (!month) {
                return err({
                    type: 'VALIDATION_ERROR',
                    field: 'month',
                    message: 'Month is required'
                });
            }

            // Validate month format (YYYY-MM)
            if (!month.match(/^\d{4}-\d{2}$/)) {
                return err({
                    type: 'INVALID_FORMAT',
                    field: 'month',
                    expected: 'YYYY-MM',
                    received: month
                });
            }

            const docId = `${franchiseId}_${month}`;
            const docRef = doc(db, 'financial_summaries', docId);

            // Sanitize Data: Ensure numbers are numbers and keys are consistent
            const validRevenue = Number(data.totalIncome || data.revenue || 0);
            const validExpenses = Number(data.totalExpenses || data.expenses || 0);
            const validProfit = validRevenue - validExpenses;

            const sanitizedData = {
                ...data, // Keep original fields
                totalIncome: validRevenue,
                totalExpenses: validExpenses,
                grossIncome: validRevenue, // Legacy sync
                revenue: validRevenue, // Ensure these exist for UI
                expenses: validExpenses,
                profit: validProfit,
                // Ensure breakdown values are numbers if they exist
                breakdown: data.breakdown ? Object.fromEntries(
                    Object.entries(data.breakdown).map(([k, v]) => [k, Number(v) || 0])
                ) : {}
            };

            // Usamos setDoc con merge para no borrar campos si actualizamos parcial
            await setDoc(docRef, {
                ...sanitizedData,
                franchiseId,
                month,
                status: data.status || 'approved', // Respect input status (e.g. 'submitted' from franchise)
                is_locked: data.is_locked || (data.status === 'submitted' || data.status === 'locked'), // Auto-lock if submitted/locked
                updatedAt: serverTimestamp()
            }, { merge: true });

            return ok(undefined);

        } catch (error: any) {
            // Firebase permission errors
            if (error.code === 'permission-denied') {
                return err({ type: 'PERMISSION_DENIED', franchiseId });
            }

            // Network or unknown errors
            return err({
                type: 'NETWORK_ERROR',
                cause: error instanceof Error ? error : new Error(String(error))
            });
        }
    },

    /**
     * UNLOCK MONTH: Allow franchise to edit closed month.
     * Admin Action.
     */
    unlockMonth: async (franchiseId: string, month: string): Promise<Result<void, FinanceError>> => {
        try {
            if (!franchiseId || !month) return err({ type: 'VALIDATION_ERROR', field: 'month', message: 'Missing args' });

            const docId = `${franchiseId}_${month}`;
            const docRef = doc(db, 'financial_summaries', docId);

            await updateDoc(docRef, {
                status: 'open',
                is_locked: false,
                updatedAt: serverTimestamp(),
                statusHistory: arrayUnion({
                    status: 'open',
                    timestamp: Timestamp.now(),
                    action: 'unlocked_by_admin'
                })
            });

            return ok(undefined);
        } catch (error: any) {
            console.error("Error unlocking month:", error);
            return err({ type: 'NETWORK_ERROR', cause: error });
        }
    },

    /**
     * REQUEST UNLOCK: Franchise requests to edit a locked month.
     */
    requestUnlock: async (franchiseId: string, month: string, reason: string): Promise<Result<void, FinanceError>> => {
        try {
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
        } catch (error) {
            console.error("Error requesting unlock:", error);
            return err({ type: 'NETWORK_ERROR', cause: error instanceof Error ? error : new Error(String(error)) });
        }
    },

    /**
     * REJECT UNLOCK: Admin denies request.
     */
    rejectUnlock: async (franchiseId: string, month: string, reason?: string): Promise<Result<void, FinanceError>> => {
        try {
            const docId = `${franchiseId}_${month}`;
            const docRef = doc(db, 'financial_summaries', docId);

            await updateDoc(docRef, {
                status: 'locked', // Revert to locked
                is_locked: true, // Re-lock
                unlockReason: null, // Clear request reason
                rejectionReason: reason || null, // Store rejection reason
                updatedAt: serverTimestamp(),
                statusHistory: arrayUnion({
                    status: 'locked',
                    timestamp: Timestamp.now(),
                    reason: reason || 'No reason provided',
                    action: 'rejected_by_admin'
                })
            });

            return ok(undefined);
        } catch (error) {
            console.error("Error rejecting unlock:", error);
            return err({ type: 'NETWORK_ERROR', cause: error instanceof Error ? error : new Error(String(error)) });
        }
    },

    /**
     * Obtener historial de cierres (Resúmenes Financieros)
     * @returns Result with MonthlyData array or specific error
     */
    fetchClosures: async (franchiseId: string): Promise<Result<MonthlyData[], FinanceError>> => {
        try {
            // Validation
            if (!franchiseId) {
                return err({ type: 'PERMISSION_DENIED', franchiseId: 'unknown' });
            }

            const q = query(
                collection(db, 'financial_summaries'),
                where('franchiseId', '==', franchiseId)
            );
            const snapshot = await getDocs(q);

            const data = snapshot.docs
                .map(doc => {
                    const d = doc.data();
                    // Normalize Data for UI: Ensure revenue/expenses/profit exist
                    const revenue = Number(d.totalIncome || d.revenue || 0);
                    const expenses = Number(d.totalExpenses || d.expenses || 0);
                    const profit = revenue - expenses;

                    return {
                        ...d,
                        id: doc.id,
                        revenue,
                        expenses,
                        profit,
                        // Ensure totals match if checks rely on them
                        totalIncome: revenue,
                        totalExpenses: expenses
                    } as MonthlyData;
                })
                .filter(item => item.status !== 'deleted'); // Filter soft-deleted items

            return ok(data);
        } catch (error: any) {
            console.error("Error fetching closures:", error);
            // Return appropriate FinanceError
            return err({
                type: 'NETWORK_ERROR',
                cause: error instanceof Error ? error : new Error(String(error))
            });
        }
    },

    /**
     * DASHBOARD: Obtener tendencia financiera de los últimos X meses
     * Agrega los datos en el cliente (Client-Side Aggregation)
     */
    getFinancialTrend: async (franchiseId: string | null, monthsBack: number = 6): Promise<any[]> => {
        try {
            // 1. Calcular fecha (meses atrás) - pero las summaries usan string "YYYY-MM"
            // Necesitamos generar las keys "YYYY-MM" de los últimos X meses
            const monthlyStats = new Map<string, { income: number, expense: number, date: Date, orders?: number, totalHours?: number, breakdown?: any, logisticsIncome?: number }>();
            const today = new Date();
            const summaryKeys: string[] = [];

            for (let i = monthsBack; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                monthlyStats.set(key, { income: 0, expense: 0, date: d, totalHours: 0 });
                summaryKeys.push(key);
            }

            // 2. Query 'financial_summaries'
            // LIMITATION: 'in' query supports max 10 values. If monthsBack > 9, we might need multiple queries or just fetch range.
            // Since docId is "franchiseId_YYYY-MM", we can't easily range-query without a separate simple "month" field.
            // But we added "month" field to the doc! It is "YYYY-MM".

            // Construct query
            const constraints: any[] = [
                where('month', 'in', summaryKeys) // Only valid if <= 10 keys
            ];

            if (monthsBack > 9) {
                // Fallback: Query all summaries for franchise (usually small enough dataset per franchise)
                // or Query by date range if we had a date field. We have 'updatedAt' but strictly 'month' is the key.
                // Let's stick to <= 10 for now or just fetch all for franchise if specific.
                constraints.length = 0; // Clear
                // Use simply order by month string? "2023-01" < "2023-02". Yes.
                const startKey = summaryKeys[0];
                constraints.push(where('month', '>=', startKey));
            }

            if (franchiseId) {
                constraints.push(where('franchiseId', '==', franchiseId));
            }

            const q = query(
                collection(db, 'financial_summaries'),
                ...constraints
            );

            const snapshot = await getDocs(q);

            snapshot.docs.forEach(doc => {
                const data = doc.data() as MonthlyData;
                if (!data.month) return;

                if (monthlyStats.has(data.month)) {
                    const current = monthlyStats.get(data.month)!;
                    // Mapeo de campos nuevos + compatibilidad
                    // Cast to any to access dynamic/legacy properties
                    const anyData = data as any;
                    const income = data.totalIncome || data.revenue || anyData.summary?.grossIncome || 0;
                    const expense = data.totalExpenses || (typeof anyData.expenses === 'number' ? anyData.expenses : anyData.expenses?.total) || anyData.summary?.totalExpenses || 0;
                    const orders = Number(anyData.orders || 0);
                    const totalHours = Number(anyData.totalHours || 0);

                    // CRITICAL FIX: Use += to SUM multiple franchises, not = to overwrite
                    current.income += Number(income);
                    current.expense += Number(expense);

                    // Aggregate extra metadata
                    if (!current.breakdown) current.breakdown = {};
                    if (!current.orders) current.orders = 0;
                    if (!current.totalHours) current.totalHours = 0;

                    current.orders += orders;
                    current.totalHours += totalHours;

                    // Aggregate detailed breakdown if present (taxes, labor, etc)
                    if (anyData.breakdown) {
                        Object.entries(anyData.breakdown).forEach(([key, val]) => {
                            current.breakdown![key] = (current.breakdown![key] || 0) + Number(val || 0);
                        });
                    }

                    // Aggregate Logistics Income specifically (Fee)
                    if (anyData.logisticsIncome) {
                        current.logisticsIncome = (current.logisticsIncome || 0) + Number(anyData.logisticsIncome);
                    }
                }
            });

            // 4. Formatear para Recharts
            const result = Array.from(monthlyStats.values()).map(stat => {
                const profit = stat.income - stat.expense;
                const monthName = stat.date.toLocaleDateString('es-ES', { month: 'short' });

                return {
                    name: monthName.charAt(0).toUpperCase() + monthName.slice(1), // "Ene"
                    income: stat.income,
                    revenue: stat.income, // Dual support
                    expenses: stat.expense,
                    profit: profit,
                    orders: stat.orders || 0,
                    totalHours: stat.totalHours || 0,
                    logisticsIncome: stat.logisticsIncome || 0,
                    breakdown: stat.breakdown || {},
                    fullDate: stat.date.toISOString(),
                };
            });

            return result;

        } catch (error) {
            console.error("Error calculating financial trend:", error);
            return []; // Fail gracefully
        }
    },

    /**
     * DANGER: Elimina TODOS los registros financieros de una franquicia.
     * Uso exclusivo para resetear datos de prueba o limpieza solicitada por usuario.
     */
    clearFinancialData: async (franchiseId: string): Promise<Result<void, FinanceError>> => {
        try {
            if (!franchiseId) return err({ type: 'VALIDATION_ERROR', field: 'franchiseId', message: 'Franchise ID requerido' });

            const batch = writeBatch(db);
            let operationCount = 0;

            // 1. Get all records (financial_records)
            const recordsQuery = query(collection(db, COLLECTION), where('franchise_id', '==', franchiseId));
            const recordsSnapshot = await getDocs(recordsQuery);

            recordsSnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
                operationCount++;
            });

            // 2. Get all summaries (financial_summaries)
            const summariesQuery = query(collection(db, 'financial_summaries'), where('franchiseId', '==', franchiseId));
            const summariesSnapshot = await getDocs(summariesQuery);

            summariesSnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
                operationCount++;
            });

            // 3. Commit
            if (operationCount > 0) {
                await batch.commit();
            }
            console.log(`[Cleaner] Eliminados ${operationCount} documentos (registros y resúmenes) de ${franchiseId}`);

            return ok(undefined);
        } catch (error: any) {
            console.error("Error limpiando datos:", error);
            return err({
                type: 'NETWORK_ERROR',
                cause: error instanceof Error ? error : new Error(String(error))
            });
        }
    },

    /**
     * INTERNAL: Aggregate Record into Monthly Summary atomically
     */
    _aggregateToSummary: async (franchiseId: string, data: any): Promise<void> => {
        try {
            // Priority: Explicit month field > Derived from Date > Current Month
            let monthKey = data.month;

            if (!monthKey) {
                const date = data.date ? new Date(data.date) : new Date();
                monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }

            const docId = `${franchiseId}_${monthKey}`;

            const docRef = doc(db, 'financial_summaries', docId);

            // Determine values (Safe Fallbacks)
            const revenue = Number(data.revenue || (data.type === 'income' ? data.amount : 0) || 0);
            const expenses = Number(data.expenses || (data.type === 'expense' ? data.amount : 0) || 0);



            // Prepare Updates
            const updates: any = {
                franchiseId,
                month: monthKey,
                status: 'approved', // FIXED: Resurrect document if it was deleted
                updatedAt: serverTimestamp(),
                totalIncome: increment(revenue),
                totalExpenses: increment(expenses),
                // Legacy support
                grossIncome: increment(revenue),
            };

            // Aggregate Breakdown if present
            if (data.breakdown) {
                if (data.breakdown.labor) updates['summary.totalExpenses'] = increment(expenses); // Ensure total matches
                Object.keys(data.breakdown).forEach(key => {
                    updates[`breakdown.${key}`] = increment(Number(data.breakdown[key]) || 0);
                });

                // Also update legacy fields if needed, or just rely on 'breakdown' object structure
                // 'expenses' field in summary might be an object in some versions?
                // Let's stick to flat 'breakdown.x' which is cleaner.
            }

            // Use setDoc with merge to ensure document exists
            await setDoc(docRef, updates, { merge: true });

        } catch (error) {
            console.error("Error aggregating summary:", error);
            // Don't throw, so we don't break the record creation flow if aggregation fails
        }
    },

    /**
     * DELETE SUMMARY BY ID: Explicitly delete a summary document
     */
    /**
     * SOFT DELETE SUMMARY: Update status to 'deleted' instead of actual deletion (permissions workaround)
     */
    deleteSummaryDocument: async (docId: string): Promise<void> => {
        try {

            // HARD DELETE to prevent zombie data
            const docRef = doc(db, 'financial_summaries', docId);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting summary:", error);
            throw error;
        }
    },

    resetMonthSummary: async (franchiseId: string, monthKey: string): Promise<void> => {
        try {

            const batch = writeBatch(db);

            // 1. Calculate Date Range
            const [year, month] = monthKey.split('-').map(Number);
            const startDate = new Date(year, month - 1, 1);
            const endDate = endOfMonth(startOfMonth(parseISO(monthKey)));

            // 2. Queue Deletion of ALL compatible Records
            const recordsQuery = query(
                collection(db, COLLECTION),
                where('franchise_id', '==', franchiseId),
                where('date', '>=', startDate),
                where('date', '<=', endDate)
            );

            const recordsSnap = await getDocs(recordsQuery);
            recordsSnap.docs.forEach(doc => {
                batch.delete(doc.ref);
            });


            // 3. Queue Deletion of Summary
            const docId = `${franchiseId}_${monthKey}`;
            const summaryRef = doc(db, 'financial_summaries', docId);
            batch.delete(summaryRef);

            // 4. Execute atomic batch
            await batch.commit();
            console.log(`[Finance] Month data destroyed successfully.`);
        } catch (error) {
            console.error("Error resetting month summary:", error);
            throw error;
        }
    },

    /**
     * FORCE SYNC: Recalculates the summary for a specific month by reading ALL records.
     * Use this to fix drift/sync issues.
     */
    recalculateMonthSummary: async (franchiseId: string, monthKey: string): Promise<void> => {
        try {
            console.log(`[Finance] Force Syncing for ${franchiseId} - ${monthKey}`);

            // 1. Calculate Date Range for the Month
            const [year, month] = monthKey.split('-').map(Number);
            const startDate = new Date(year, month - 1, 1);
            const endDate = endOfMonth(startOfMonth(parseISO(monthKey)));

            console.log(`[Finance] Recalculating for ${franchiseId} range: ${startDate} to ${endDate}`);

            // 2. Fetch ALL records for this range
            const recordsRef = collection(db, 'financial_records');
            const q = query(
                recordsRef,
                where('franchise_id', '==', franchiseId),
                where('date', '>=', startDate),
                where('date', '<=', endDate)
            );

            const snap = await getDocs(q);

            let totalIncome = 0;
            let totalExpenses = 0;
            // Explicit Accumulators
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

                // Track explicitly
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

            // 3. Overwrite the Summary
            const summaryId = `${franchiseId}_${monthKey}`;
            const summaryRef = doc(db, 'financial_summaries', summaryId);

            await setDoc(summaryRef, {
                franchiseId,
                month: monthKey,
                status: 'approved', // FIXED: Resurrect if it was deleted
                totalIncome,
                totalExpenses,
                grossIncome: totalIncome, // Legacy

                // EXPLICIT FIELDS (Normalized)
                revenue: accRevenue,
                expenses: accExpenses,
                profit: accProfit,
                logisticsIncome: accLogisticsOnly,

                breakdown,
                updatedAt: serverTimestamp(),
                lastForceSync: serverTimestamp()
            }, { merge: true });

        } catch (error) {
            console.error("Error recalculating summary:", error);
            throw error;
        }
    }
};
