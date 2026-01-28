/**
 * @deprecated Use import from './finance' instead
 * This file is kept for backward compatibility only.
 * The actual implementation has been refactored into:
 * - src/services/finance/records.ts (CRUD operations)
 * - src/services/finance/summary.ts (Monthly summaries)
 * - src/services/finance/inbox.ts (Admin inbox & operations)
 * - src/services/finance/trends.ts (Financial trends & analytics)
 * - src/services/finance/helpers.ts (Data mapping utilities)
 *
 * To migrate your imports:
 * OLD: import { financeService } from '../services/financeService';
 * NEW: import { financeService } from '../services/finance';
 */

export { financeService } from './finance';

export type {
    FinancialRecord,
    RecordInput,
    MonthlyData,
    TrendItem,
    FinanceError
} from './finance';

export type {
    RecordStatus,
    RecordType,
    BreakdownData
} from '../types/finance';

export type { Result } from '../types/result';