/**
 * Finance Domain Types
 */

import type { FieldValue, Timestamp } from 'firebase/firestore';

// --- RECORD TYPES (Individual Transactions) ---

export type RecordStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'locked' | 'pending';
export type RecordType = 'income' | 'expense';

export interface FinancialRecord {
    id: string;
    franchiseId: string;
    amount: number;
    date: Date;
    status: RecordStatus;
    type: RecordType;
    category?: string;
    description?: string;
    adminNotes?: string;

    // Revenue specific
    revenue?: number;
    expenses?: number;
    profit?: number;
    logisticsIncome?: number;
    breakdown?: Record<string, number>;

    // --- AUDIT TRAIL ---
    createdAt?: Date | FieldValue | Timestamp;
    updatedAt?: Date | FieldValue | Timestamp;
    submittedAt?: Date | FieldValue | Timestamp;
    approvedAt?: Date | FieldValue | Timestamp;
    approvedBy?: string; // Admin UID
    rejectionReason?: string;

    // --- CONTROLS ---
    isLocked?: boolean;
}

export interface RecordInput {
    amount: number | string;
    date?: Date | string;
    status?: RecordStatus;
    type?: RecordType;
    category?: string;
    description?: string;
    breakdown?: Record<string, number>;
}

// --- SUMMARY TYPES (Monthly Aggregations) ---

export interface BreakdownData {
    [category: string]: number;
}

export interface MonthlyData {
    id?: string;
    franchiseId?: string; // Optional in some contexts
    month?: string;  // YYYY-MM format

    // --- REVENUE METRICS ---
    revenue?: number;
    totalIncome?: number; // Alias
    grossIncome?: number; // Legacy Alias

    // Orders & Activity
    orders?: number;
    ordersNew0To4?: number;
    ordersNew4To5?: number;
    ordersNew5To6?: number;
    ordersNew6To7?: number;
    ordersNewGt7?: number;
    ordersOld0To35?: number;
    ordersOldGt35?: number;

    contractedRiders?: number;
    totalHours?: number;
    totalKm?: number;
    motoCount?: number;

    // --- EXPENSES ---
    expenses?: number;
    totalExpenses?: number; // Alias

    salaries?: number;
    insurance?: number;
    services?: number;
    agencyFee?: number;
    prlFee?: number;
    accountingFee?: number;
    gasoline?: number;
    gasolinePrice?: number;
    repairs?: number;
    marketing?: number;
    incidents?: number;
    otherExpenses?: number;
    appFlyder?: number; // Manual override for franchise fee
    quota?: number;
    royaltyPercent?: number;

    // --- TAXES & PROFIT ---
    profit?: number;
    netProfit?: number;
    margin?: number;
    irpfPercent?: number;

    // Operational
    totalOperationalHours?: number;
    totalShiftsCount?: number;

    // --- STATE & METADATA ---
    status?: string | 'pending' | 'draft' | 'submitted' | 'approved' | 'locked' | 'unlock_requested' | 'deleted';
    isLocked?: boolean;
    unlockReason?: string | null;
    rejectionReason?: string | null;
    statusHistory?: any[]; // Could be stricter
    recordCount?: number;
    logisticsIncome?: number;

    breakdown?: BreakdownData;
    updatedAt?: FieldValue | Date | Timestamp;

    [key: string]: unknown; // Allow additional properties
}

export interface TrendItem {
    name: string;
    month: string;
    income: number;
    revenue: number;
    expenses: number;
    profit: number;
    orders: number;
    totalHours: number;
    logisticsIncome: number;
    breakdown: BreakdownData;
    fullDate: string;
}

/**
 * Discriminated union of all possible finance errors
 * Each error type carries specific context for debugging and UX
 */
export type FinanceError =
    | { type: 'PERMISSION_DENIED'; franchiseId: string }
    | { type: 'VALIDATION_ERROR'; field: string; message: string }
    | { type: 'NOT_FOUND'; franchiseId: string; month?: string }
    | { type: 'NETWORK_ERROR'; cause: Error }
    | { type: 'INVALID_FORMAT'; field: string; expected: string; received: string };
