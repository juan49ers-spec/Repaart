/**
 * Finance Domain Types
 */

import type { FieldValue } from 'firebase/firestore';

export interface MonthlyData {
    id?: string;
    franchiseId: string;
    month: string;  // YYYY-MM format
    totalIncome?: number;
    totalExpenses?: number;
    netProfit?: number;
    recordCount?: number;
    revenue?: number;
    expenses?: number;
    profit?: number;
    margin?: number;
    breakdown?: any[];
    status?: string;
    updatedAt?: FieldValue | Date;
    [key: string]: unknown; // Allow additional properties for flexibility
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
