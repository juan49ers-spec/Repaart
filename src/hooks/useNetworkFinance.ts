import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { franchiseService } from '../services/franchiseService';
import { isOk } from '../types/result';
import type { MonthlyData } from '../types/finance';


export type NetworkStatus = 'submitted' | 'pending' | 'late';

export interface FranchiseFinancialStatus {
    franchiseId: string;
    franchiseName: string;
    report?: MonthlyData;
    status: NetworkStatus;
    riskScore: number; // 0-100 (High is bad)
    riskFactors: string[];
}

export interface NetworkAggregates {
    totalRevenue: number;
    totalExpenses: number;
    totalProfit: number;
    totalTaxVault: number;
    activeFranchises: number;
    submittedCount: number;
}

export const useNetworkFinance = (selectedMonth: string) => {
    const [loading, setLoading] = useState(true);
    const [networkData, setNetworkData] = useState<FranchiseFinancialStatus[]>([]);
    const [aggregates, setAggregates] = useState<NetworkAggregates>({
        totalRevenue: 0,
        totalExpenses: 0,
        totalProfit: 0,
        totalTaxVault: 0,
        activeFranchises: 0,
        submittedCount: 0
    });

    useEffect(() => {
        const fetchNetworkData = async () => {
            setLoading(true);
            try {
                // 1. Fetch All Franchises
                const franchisesResult = await franchiseService.getAllFranchises();
                if (!isOk(franchisesResult)) throw new Error("Failed to fetch franchises");
                const franchises = franchisesResult.data;

                // 2. Fetch All Financial Records for the Month
                const summariesQuery = query(
                    collection(db, 'financial_summaries'),
                    where('month', '==', selectedMonth)
                );
                const summariesSnapshot = await getDocs(summariesQuery);
                const summariesMap = new Map<string, MonthlyData>();

                summariesSnapshot.docs.forEach(doc => {
                    const data = doc.data() as MonthlyData;
                    if (data.franchiseId) {
                        summariesMap.set(data.franchiseId, data);
                    }
                });

                // 3. Combine & Calculate Aggregates
                const combinedData: FranchiseFinancialStatus[] = [];
                let aggRevenue = 0;
                let aggExpenses = 0;
                let aggProfit = 0;
                let aggSubmitted = 0;

                franchises.forEach(f => {
                    const report = summariesMap.get(f.id);
                    let status: NetworkStatus = 'pending';
                    let risk = 0;
                    const factors: string[] = [];

                    if (report) {
                        status = 'submitted';
                        aggSubmitted++;

                        const revenue = Number(report.totalIncome || report.revenue || 0);
                        const expenses = Number(report.totalExpenses || report.expenses || 0);
                        const profit = revenue - expenses;

                        aggRevenue += revenue;
                        aggExpenses += expenses;
                        aggProfit += profit;

                        // Simple Risk Calculation
                        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

                        if (margin < 10) {
                            risk += 50;
                            factors.push(`Margen Crítico (<10%): ${margin.toFixed(1)}%`);
                        } else if (margin < 15) {
                            risk += 20;
                            factors.push(`Margen Bajo (<15%): ${margin.toFixed(1)}%`);
                        }

                        if (expenses > revenue) {
                            risk += 100;
                            factors.push("Pérdidas Operativas");
                        }
                    } else {
                        risk += 20; // No report yet
                        factors.push("Informe Pendiente");
                    }

                    combinedData.push({
                        franchiseId: f.id,
                        franchiseName: f.name,
                        report,
                        status,
                        riskScore: Math.min(risk, 100),
                        riskFactors: factors
                    });
                });

                // Calculate Tax Vault (Approximate: 21% VAT + 15% Corp Tax + 20% Income Tax on Profit?)
                // For now, let's just sum the 'taxes' field if we had it, or estimate.
                // Reusing TaxVault logic: VAT (21% of Rev) - VAT_Ded (21% of Exp) ...
                // Let's keep it simple: 21% of Net Profit for now + 21% of Expenses (assuming deductible).
                // Wait, Tax Vault is usually money SET ASIDE. 
                // Let's use a rough estimate: 20% of Revenue is usually tax liability buffer.
                const estimatedTaxVault = aggRevenue * 0.15;

                setNetworkData(combinedData.sort((a, b) => b.riskScore - a.riskScore)); // Highest risk first
                setAggregates({
                    totalRevenue: aggRevenue,
                    totalExpenses: aggExpenses,
                    totalProfit: aggProfit,
                    totalTaxVault: estimatedTaxVault,
                    activeFranchises: franchises.length,
                    submittedCount: aggSubmitted
                });

            } catch (err) {
                console.error("Error fetching network finance:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchNetworkData();
    }, [selectedMonth]);

    return { loading, networkData, aggregates };
};
