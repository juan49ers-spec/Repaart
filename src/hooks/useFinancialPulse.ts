
import { useState, useEffect } from 'react';
import { onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase'; // Correct path for this project

export interface FinancialData {
    totalOperationalHours: number;
    totalShiftsCount: number;
    [key: string]: unknown;
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
        // Strategy change: Fetch ALL summaries for the month and find OURS in memory.
        // This bypasses Firestore's strict exact-string and case-sensitive filtering failures
        // when valid data exists but has casing/whitespace mismatches.
        const q = query(
            collection(db, 'financial_summaries'),
            where('month', '==', currentMonthId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const targetId = franchiseId.trim().toLowerCase();

                // Find the doc that matches our franchise ID (normalized)
                const docSnap = snapshot.docs.find(d => {
                    const data = d.data();
                    const dataId = data.franchiseId ? String(data.franchiseId).trim().toLowerCase() : '';
                    return dataId === targetId;
                });

                if (docSnap) {
                    setCurrentMonthData(docSnap.data() as FinancialData);
                } else {
                    // Try fallback: Check if doc.id CONTAINS the franchise ID (normalized)
                    const fallbackSnap = snapshot.docs.find(d => d.id.toLowerCase().includes(targetId));
                    if (fallbackSnap) {
                        setCurrentMonthData(fallbackSnap.data() as FinancialData);
                    } else {
                        setCurrentMonthData({ totalOperationalHours: 0, totalShiftsCount: 0 });
                    }
                }
            } else {
                // Mes nuevo o sin datos aún
                setCurrentMonthData({ totalOperationalHours: 0, totalShiftsCount: 0 });
            }
            setLoading(false);
        }, (error) => {
            console.error("❌ [useFinancialPulse] Firestore error:", {
                code: error.code,
                message: error.message,
                franchiseId,
                currentMonthId
            });
            setLoading(false);
        });

        // 2. CARGA DEL HISTORIAL ANUAL (Para la Gráfica) 📊
        const fetchTrend = async () => {
            try {
                const q = query(
                    collection(db, 'financial_summaries'),
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
    }, [franchiseId, currentMonthId, docId]);

    return { currentMonthData, yearlyTrend, loading };
};
