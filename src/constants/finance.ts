export const FINANCE_STATUS = {
    VERIFIED: 'verified',
    CLOSED: 'closed',
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    LOCKED: 'locked',
    PENDING: 'pending'
} as const;

export type FinanceStatus = typeof FINANCE_STATUS[keyof typeof FINANCE_STATUS];
