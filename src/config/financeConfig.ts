export const FINANCE_CONFIG = {
    // 1. Tax Variables
    TAXES: {
        IRPF_DEFAULT_PERCENTAGE: 20, // To be overridden by franchise db if required
        IVA_PERCENTAGE: 21,
    },
    
    // 2. Operational Benchmarks
    BENCHMARKS: {
        HOURLY_COST_MIN: 15,
        HOURLY_COST_MAX: 16,
        NETWORK_AVG_HOURLY_COST: 14.20, // Mocked P2P Benchmark (Fase 4)
        TARGET_PROFIT_MARGIN: 15, // %
    },
    
    // 3. Tax Calendar (Spain)
    TAX_CALENDAR: {
        PAYMENT_MONTHS: [0, 3, 6, 9], // January, April, July, October (0-indexed)
        DEADLINE_DAY: 20, // 20th of the month
        CRITICAL_WARNING_DAYS: 15, // Warn 15 days before the deadline
    }
};
