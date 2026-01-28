import { Timestamp } from 'firebase/firestore';
import type { FinancialRecord, MonthlyData } from '../../types/finance';

// Normalize dates from various formats (Date, string, Timestamp, Firebase Timestamp)
const normalizeDate = (date: Date | string | Timestamp | { toDate: () => Date }): Date => {
    if (date instanceof Date) return date;
    if (typeof date === 'string') return new Date(date);
    if ('toDate' in date) return date.toDate();
    return new Date();
};

// Normalize timestamps (ServerTimestamp or Firebase Timestamp)
const normalizeTimestamp = (ts: any): Date | null => {
    if (!ts) return null;
    if (ts instanceof Date) return ts;
    if (typeof ts === 'string') return new Date(ts);
    if ('toDate' in ts) return ts.toDate();
    return null;
};

// Map Firestore data to FinancialRecord (handle legacy field names)
export const mapToFinancialRecord = (docSnap: { id: string; data: () => any }): FinancialRecord => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        franchiseId: data.franchiseId || data.franchise_id || '',
        amount: Number(data.amount) || 0,
        date: normalizeDate(data.date),
        status: data.status,
        type: data.type,
        category: data.category || '',
        description: data.description || '',
        adminNotes: data.adminNotes || data.admin_notes || '',
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.profit,
        logisticsIncome: data.logisticsIncome,
        breakdown: data.breakdown,
        createdAt: normalizeTimestamp(data.createdAt || data.created_at) || undefined,
        updatedAt: normalizeTimestamp(data.updatedAt || data.updated_at) || undefined,
        submittedAt: normalizeTimestamp(data.submittedAt || data.submitted_at) || undefined,
        approvedAt: normalizeTimestamp(data.approvedAt || data.approved_at) || undefined,
        approvedBy: data.approvedBy || data.approved_by,
        rejectionReason: data.rejectionReason || data.rejection_reason,
        isLocked: data.isLocked ?? data.is_locked ?? false
    };
};

// Map Firestore data to MonthlyData (handle legacy field names)
export const mapToMonthlyData = (docSnap: { id: string; data: () => any }, franchiseId?: string): MonthlyData => {
    const data = docSnap.data();
    const revenue = Number(data.totalIncome || data.revenue || 0);
    const expenses = Number(data.totalExpenses || data.expenses || 0);

    return {
        ...data,
        id: docSnap.id,
        revenue,
        expenses,
        profit: revenue - expenses,
        totalIncome: revenue,
        totalExpenses: expenses,
        isLocked: data.isLocked ?? data.is_locked ?? false,
        franchiseId: data.franchiseId || data.franchise_id || franchiseId
    };
};

// Safe number conversion
export const getSafeNumber = (val: unknown): number => Number(val) || 0;

// Generate month key from Date or string (YYYY-MM format)
export const generateMonthKey = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};