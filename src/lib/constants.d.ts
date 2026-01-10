// Type declarations for constants.js

interface StatusConfig {
    id: string;
    label: string;
    color: string;
    bg: string;
    text: string;
    border: string;
}

interface RoleConfig {
    label: string;
    bg: string;
    text: string;
    border: string;
}

export const TICKET_STATUSES: {
    open: StatusConfig;
    pending_user: StatusConfig;
    investigating: StatusConfig;
    resolved: StatusConfig;
};

export const COST_ITEM_NAMES: {
    salaries: string;
    renting: string;
    insurance: string;
    services: string;
    quota: string;
    other: string;
    gasoline: string;
    repairs: string;
    flyderFee: string;
    royalty: string;
};

export const ALERT_THRESHOLDS: {
    MIN_PROFIT_MARGIN: number;
    MAX_EXPENSE_RATIO: number;
    MAX_COST_PER_KM: number;
    MAX_REVENUE_DROP: number;
    EXCELLENT_MARGIN: number;
    BREAKEVEN_MULTIPLIER: number;
};

export const HEALTH_INDICATORS: {
    PROFIT_PER_ORDER: {
        EXCELLENT: number;
        ACCEPTABLE: number;
    };
    COST_PER_KM: {
        OPTIMAL: number;
        NORMAL: number;
    };
};

export const ROLE_CONFIG: {
    admin: RoleConfig;
    franchisee: RoleConfig;
    user: RoleConfig;
};

export function getStatusConfig(status?: string): StatusConfig;
export function getRoleConfig(role?: string): RoleConfig;
