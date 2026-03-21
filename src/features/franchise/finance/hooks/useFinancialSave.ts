/**
 * Hook de persistencia para el Centro de Control Financiero.
 * Encapsula: generar reporte → construir payload → guardar → confeti → notificar.
 */
import { useState, useCallback } from 'react';
import { message } from 'antd';
import confetti from 'canvas-confetti';
import { notificationService } from '../../../../services/notificationService';
import { calculateExpenses } from '../../../../lib/finance';
import { FinancialRecord, OrderCounts, ExpenseData } from '../types';
import { buildPersistencePayload, FinancialStats } from '../services/financeCalculations';

interface UseFinancialSaveParams {
    franchiseId: string;
    month: string;
    onSave?: (data: FinancialRecord) => void;
    onClose: () => void;
}

export const useFinancialSave = ({ franchiseId, month, onSave, onClose }: UseFinancialSaveParams) => {
    const [saving, setSaving] = useState(false);

    const handleSave = useCallback(async (params: {
        shouldLock: boolean;
        totalIncome: number;
        totalHours: number;
        expenses: ExpenseData;
        orders: OrderCounts;
        cancelledOrders: number;
        status: FinancialRecord['status'];
        stats: FinancialStats;
    }) => {
        if (!onSave) return;
        setSaving(true);

        try {
            const { shouldLock, totalIncome, totalHours, expenses, orders, cancelledOrders, status, stats } = params;

            const report = calculateExpenses(totalIncome || 0, stats.totalOrders || 0, {
                ...expenses,
                totalHours
            });

            const persistenceData = buildPersistencePayload({
                month,
                totalIncome,
                totalHours,
                expenses,
                orders,
                cancelledOrders,
                status,
                shouldLock,
                reportTotalExpenses: report.totalExpenses,
                reportNetProfitPostTax: report.taxes.netProfitPostTax,
                totalOrders: stats.totalOrders
            });

            await onSave(persistenceData);

            if (shouldLock) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#4f46e5', '#818cf8', '#c7d2fe']
                });
                await notificationService.notify('FINANCE_CLOSING', franchiseId, 'Franquicia', {
                    title: `Cierre: ${month}`,
                    message: 'Cierre procesado.',
                    priority: 'normal',
                    metadata: { month, profit: stats.profit, status: 'approved' }
                });
                onClose();
            } else {
                message.success('Guardado como borrador');
            }
        } catch (e) {
            console.error('Error al guardar datos financieros:', e);
        } finally {
            setSaving(false);
        }
    }, [franchiseId, month, onSave, onClose]);

    return { saving, handleSave };
};
