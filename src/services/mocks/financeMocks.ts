/**
 * Mock data generator for financial closures.
 * Used for development and testing purposes when backend is unavailable or for prototyping.
 */

export const CLOSURE_STATUS = {
    VERIFIED: 'verified',
    CLOSED: 'closed',
    DRAFT: 'draft'
} as const;

export interface MockClosure {
    id: string;
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
    margin: number;
    status: typeof CLOSURE_STATUS[keyof typeof CLOSURE_STATUS];
    editor: string;
    submittedAt: string;
    documents: any[];
    breakdown: {
        labor: number;
        marketing: number;
        cogs: number;
    };
}

export const generateMockData = (count: number): MockClosure[] => Array.from({ length: count }).map((_, i) => {
    // Generate valid revenue and expenses first
    const revenue = Math.floor(15000 + Math.random() * 8000);
    const expenses = Math.floor(10000 + Math.random() * 4000);

    // Calculate derived values for consistency
    const profit = revenue - expenses;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
        id: `closure-${i}`,
        month: `202${3 - Math.floor(i / 12)}-${String(12 - (i % 12)).padStart(2, '0')}`,
        revenue,
        expenses,
        profit,
        margin,
        status: i > 2 ? CLOSURE_STATUS.VERIFIED : (i === 0 ? CLOSURE_STATUS.DRAFT : CLOSURE_STATUS.CLOSED),
        editor: 'Admin',
        submittedAt: new Date().toISOString(),
        documents: [],
        breakdown: { labor: Math.floor(expenses * 0.4), marketing: Math.floor(expenses * 0.2), cogs: Math.floor(expenses * 0.4) }
    };
});
