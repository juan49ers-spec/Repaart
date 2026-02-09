import type { FinancialRecord, RecordInput, MonthlyData, TrendItem, FinanceError } from '../../types/finance';
import { Result } from '../../types/result';
import { financeRecords } from './records';
import { financeSummary } from './summary';
import { financeInbox } from './inbox';
import { getFinancialTrend } from './trends';
import { formatFinanceError } from './helpers';

export const financeService = {
    // Helpers
    formatFinanceError,

    // Records
    subscribeToRecords: financeRecords.subscribeToRecords,
    addRecord: financeRecords.addRecord,
    updateStatus: financeRecords.updateStatus,
    deleteRecord: financeRecords.deleteRecord,

    // Inbox (Admin)
    getGlobalPendingRecords: financeInbox.getGlobalPendingRecords,
    lockMonth: financeInbox.lockMonth,
    rejectUnlock: financeInbox.rejectUnlock,

    // Summary
    getFinancialData: financeSummary.getFinancialData,
    updateFinancialData: financeSummary.updateFinancialData,
    fetchClosures: financeSummary.fetchClosures,
    getFinancialYearlyData: financeSummary.getFinancialYearlyData,
    unlockMonth: financeSummary.unlockMonth,
    requestUnlock: financeSummary.requestUnlock,
    deleteSummaryDocument: financeSummary.deleteSummaryDocument,
    resetMonthSummary: financeSummary.resetMonthSummary,
    recalculateMonthSummary: financeSummary.recalculateMonthSummary,

    // Trends
    getFinancialTrend,

    // Cleanup
    clearFinancialData: financeInbox.clearFinancialData,

    // Internal methods (for backward compatibility)
    _aggregateToSummary: financeInbox._aggregateToSummary
};

export type { FinancialRecord, RecordInput, MonthlyData, TrendItem, FinanceError, Result };