
import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase'; // Correct path for this project

export interface FinancialData {
    totalOperationalHours: number;
    totalShiftsCount: number;
    [key: string]: any;
}

export interface FinancialTrendData extends FinancialData {
    monthLabel: string;
    month?: string;
}

export interface UseFinancialPulseReturn {
    currentMonthData: FinancialData | null;
    yearlyTrend: FinancialTrendData[];
    loading: boolean;
}

export const useFinancialPulse = (franchiseId: string | null): UseFinancialPulseReturn => {
    const [currentMonthData, setCurrentMonthData] = useState<FinancialData | null>(null);
    const [yearlyTrend, setYearlyTrend] = useState<FinancialTrendData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const date = new Date();
    const currentMonthId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const docId = franchiseId ? `${franchiseId}_${currentMonthId}` : null;

    useEffect(() => {
        if (!franchiseId || !docId) {
            // If no franchise selected, maybe we shouldn't be loading? 
            // Or just return empty
            return;
        }
        // Loading state initialized in useState, no need to set here

        // 1. ESCUCHA EN VIVO DEL MES ACTUAL (Real-time Socket) 🔴
        // Using 'financial_summaries' collection for monthly snapshots
        const unsubscribe = onSnapshot(doc(db, 'financial_summaries', docId), (docSnap) => {
            if (docSnap.exists()) {
                setCurrentMonthData(docSnap.data() as FinancialData);
            } else {
                // Mes nuevo o sin datos aún
                setCurrentMonthData({ totalOperationalHours: 0, totalShiftsCount: 0 });
            }
            setLoading(false);
        }, (_error) => {
            // Silently fail or minimal warn to avoid console spam on missing docs
            // console.warn("Waiting for financial data...", error.code);
            setLoading(false);
        });

        // 2. CARGA DEL HISTORIAL ANUAL (Para la Gráfica) 📊
        const fetchTrend = async () => {
            try {
                const q = query(
                    collection(db, 'financial_summaries'), // FIXED
                    where('franchiseId', '==', franchiseId)
                );
                const snap = await getDocs(q);

                const trend = snap.docs.map(d => {
                    const data = d.data();
                    const monthLabel = data.month ? (data.month as string).split('-')[1] : '??';
                    return {
                        ...data,
                        monthLabel
                    } as FinancialTrendData;
                }).sort((a, b) => (a.month || '').localeCompare(b.month || ''));

                setYearlyTrend(trend);
            } catch {
                // Historical data not critical - fail silently
            }
        };

        fetchTrend();

        return () => unsubscribe();
    }, [franchiseId, docId]);

    return { currentMonthData, yearlyTrend, loading };
};
