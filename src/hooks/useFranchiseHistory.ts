import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface MonthlyRecord {
    id: string;
    month: string;
    revenue: number;
    totalExpenses: number;
    profit: number;
    updatedAt?: Date | string;
    status: 'draft' | 'pending' | 'approved' | 'rejected' | 'locked' | 'unlock_requested';
    isLocked?: boolean;
    unlockReason?: string;
    rejectionReason?: string;
}

export const useFranchiseHistory = (franchiseId?: string) => {
    const [records, setRecords] = useState<MonthlyRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadRecords = useCallback(async () => {
        if (!franchiseId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const q = query(
                collection(db, 'financial_summaries'),
                where('franchiseId', '==', franchiseId),
                orderBy('month', 'desc')
            );

            const snapshot = await getDocs(q);
            const data = snapshot.docs
                .map(doc => {
                    const d = doc.data();
                    const revenue = d.revenue || d.totalIncome || d.grossIncome || 0;
                    const expenses = d.totalExpenses || d.expenses || 0;

                    return {
                        id: doc.id,
                        month: d.month,
                        revenue,
                        totalExpenses: expenses,
                        profit: revenue - expenses,
                        updatedAt: d.updatedAt?.toDate?.() || d.updatedAt || new Date(),
                        status: d.status || (d.isLocked ? 'locked' : 'draft'),
                        isLocked: d.isLocked || false,
                        unlockReason: d.unlockReason,
                        rejectionReason: d.rejectionReason
                    } as MonthlyRecord;
                });

            setRecords(data);
        } catch (err: any) {
            console.error('Error loading monthly records:', err);
            setError(err.message || 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, [franchiseId]);

    useEffect(() => {
        loadRecords();
    }, [loadRecords]);

    return { records, loading, error, refresh: loadRecords };
};
