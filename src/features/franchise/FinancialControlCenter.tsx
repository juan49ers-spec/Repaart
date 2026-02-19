import React, { useState, useEffect } from 'react';

import { AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import { RevenueStep } from './finance/components/RevenueStep';
import { ExpensesStep } from './finance/components/ExpensesStep';
import { FinancialHeader } from './finance/components/FinancialHeader';
import { FinancialFooter } from './finance/components/FinancialFooter';
import { FinancialBreakdownChart } from './finance/components/FinancialBreakdownChart';
import { useFinancialDataLoad } from './finance/hooks/useFinancialDataLoad';
import { FinancialRecord, OrderCounts, ExpenseData, FRANCHISE_CONFIG, REAL_DIST_FACTORS } from './finance/types';

// --- HELPER: KM ESTIMATION (UPDATED) ---
const estimateTotalKm = (orders: OrderCounts): number => {
    const km0_4 = (orders['0-4 km'] || 0) * REAL_DIST_FACTORS.range_0_4;
    const km4_5 = (orders['4-5 km'] || 0) * REAL_DIST_FACTORS.range_4_5;
    const km5_6 = (orders['5-6 km'] || 0) * REAL_DIST_FACTORS.range_5_7;
    const km6_7 = (orders['6-7 km'] || 0) * REAL_DIST_FACTORS.range_5_7;
    const kmGt7 = (orders['>7 km'] || 0) * REAL_DIST_FACTORS.range_7_plus;
    return km0_4 + km4_5 + km5_6 + km6_7 + kmGt7;
};

// --- MAIN COMPONENT ---

interface FinancialControlCenterProps {
    franchiseId: string;
    month: string;
    onClose: () => void;
    onSave?: (data: FinancialRecord) => void;
    initialData?: Partial<FinancialRecord>;
    suggestedIncome?: number;
}

const FinancialControlCenter: React.FC<FinancialControlCenterProps> = ({
    franchiseId, month, onClose, onSave, initialData, suggestedIncome
}) => {
    const { user } = useAuth();

    // 1. Load Data Hook
    const { loading, logisticsRates, record, prevMonthsYtd } = useFinancialDataLoad({
        franchiseId, month, initialData, user
    });

    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<'pending' | 'draft' | 'submitted' | 'approved' | 'unlock_requested' | 'locked' | 'open'>('draft');
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // State
    const [orders, setOrders] = useState<OrderCounts>({});
    const [cancelledOrders, setCancelledOrders] = useState(0);
    const [totalIncome, setTotalIncome] = useState(initialData?.revenue || initialData?.totalIncome || suggestedIncome || 0);
    const [totalHours, setTotalHours] = useState(0);
    const [expenses, setExpenses] = useState<ExpenseData>({
        payroll: 0, quota: 0, insurance: 0, fuel: 0, repairs: 0,
        renting: { count: 0, pricePerUnit: 0 },
        agencyFee: 0, prlFee: 0, accountingFee: 0, professionalServices: 0,
        appFlyder: 0, marketing: 0, incidents: 0, other: 0,
        royaltyPercent: 5, irpfPercent: 20, repaartServices: 0, socialSecurity: 0
    });

    const isLocked = status === 'submitted' || status === 'approved' || status === 'unlock_requested' || status === 'locked';

    // --- LOGIC ---

    // Calculate Income based on Logistics Rates
    useEffect(() => {
        if (logisticsRates.length > 0) {
            let calculatedIncome = 0;
            Object.entries(orders).forEach(([range, count]) => {
                const rate = logisticsRates.find(r => r.name === range || `${r.min}-${r.max} km` === range);
                if (rate && typeof rate.price === 'number') calculatedIncome += count * rate.price;
            });
            // Auto Update Income if calculated
            if (!isNaN(calculatedIncome) && calculatedIncome !== totalIncome) {
                if (calculatedIncome > 0 || Object.keys(orders).length > 0) setTotalIncome(calculatedIncome);
            }
        }
    }, [orders, logisticsRates, totalIncome]);

    // React to suggestedIncome changes if no initialData
    React.useEffect(() => {
        if (suggestedIncome && (!initialData?.revenue && !initialData?.totalIncome)) {
            setTotalIncome(suggestedIncome);
        }
    }, [suggestedIncome, initialData]);

    // Initialize State from Loaded Record
    useEffect(() => {
        if (record && Object.keys(record).length > 0) {
            mapDataToState(record);
        }
    }, [record]);

    const mapDataToState = (data: FinancialRecord) => {
        setTotalIncome(data.revenue || data.totalIncome || 0);
        setTotalHours(data.totalHours || 0);
        setCancelledOrders(data.cancelledOrders || 0);
        setStatus(data.status || 'draft');

        const reconstructedOrders: OrderCounts = {};
        if (data.ordersDetail) Object.assign(reconstructedOrders, data.ordersDetail);
        else {
            if (data.ordersNew0To4) reconstructedOrders['0-4 km'] = data.ordersNew0To4;
            if (data.ordersNew4To5) reconstructedOrders['4-5 km'] = data.ordersNew4To5;
            if (data.ordersNew5To6) reconstructedOrders['5-6 km'] = data.ordersNew5To6;
            if (data.ordersNew6To7) reconstructedOrders['6-7 km'] = data.ordersNew6To7;
            if (data.ordersNewGt7) reconstructedOrders['>7 km'] = data.ordersNewGt7;
        }
        setOrders(reconstructedOrders);
        setExpenses({
            payroll: data.salaries || 0, quota: data.quota || 0, insurance: data.insurance || 0,
            fuel: data.gasoline || 0, repairs: data.repairs || 0,
            renting: { count: data.motoCount || 0, pricePerUnit: (data.motoCount && Number.isFinite(Number(data.rentingCost))) ? Number(data.rentingCost) / data.motoCount : 154 },
            agencyFee: data.agencyFee || 0, prlFee: data.prlFee || 0, accountingFee: data.accountingFee || 0,
            professionalServices: data.services || 0, appFlyder: data.appFlyder || 0, marketing: data.marketing || 0,
            incidents: data.incidents || 0, other: data.otherExpenses || 0,
            royaltyPercent: data.royaltyPercent ?? 5, irpfPercent: data.irpfPercent ?? 20,
            repaartServices: data.repaartServices || 0, socialSecurity: data.socialSecurity || 0
        });
    };

    const calculateStats = () => {
        const rentingTotal = (expenses.renting?.count ?? 0) * (expenses.renting?.pricePerUnit ?? 0);
        const royaltyAmount = totalIncome * ((expenses.royaltyPercent || 5) / 100);
        const fixedCosts = (expenses.payroll ?? 0) + (expenses.socialSecurity ?? 0) + (expenses.quota ?? 0) +
            (expenses.insurance ?? 0) + (expenses.agencyFee ?? 0) + (expenses.prlFee ?? 0) +
            (expenses.accountingFee ?? 0) + (expenses.professionalServices ?? 0) + (expenses.appFlyder ?? 0) + (expenses.marketing ?? 0) +
            (expenses.repaartServices ?? 0);
        const variableCosts = (expenses.fuel ?? 0) + (expenses.repairs ?? 0) + rentingTotal + (expenses.incidents ?? 0) + (expenses.other ?? 0) + royaltyAmount;
        const totalExpenses = fixedCosts + variableCosts;
        const grossMargin = totalIncome - totalExpenses;
        const amortizationCost = FRANCHISE_CONFIG.entryFee / FRANCHISE_CONFIG.amortizationMonths;
        const netResultAfterAmortization = grossMargin - amortizationCost;
        const safeToSpend = grossMargin > 0 ? grossMargin * 0.80 : 0;
        const totalOrders = Object.values(orders).reduce((sum, count) => sum + count, 0);
        const estimatedKm = estimateTotalKm(orders);
        return { totalExpenses, profit: grossMargin, grossMargin, amortizationCost, netResultAfterAmortization, safeToSpend, fixedCosts, variableCosts, royaltyAmount, totalOrders, estimatedKm };
    };

    const stats = calculateStats();

    // Save Logic (Simplified for brevity but functional)
    const handleSaveData = async (shouldLock: boolean = false) => {
        if (!onSave) return;
        setSaving(true);
        try {
            const persistenceStatus = shouldLock ? 'locked' : (status === 'locked' ? 'locked' : 'draft');
            const persistenceData: Record<string, unknown> = { // Using Record to reuse existing mapping structure easily
                month, totalHours, totalIncome, revenue: totalIncome, grossIncome: totalIncome,
                salaries: expenses.payroll, socialSecurity: expenses.socialSecurity, quota: expenses.quota, insurance: expenses.insurance,
                gasoline: expenses.fuel, repairs: expenses.repairs,
                motoCount: expenses.renting?.count ?? 0,
                rentingCost: (expenses.renting?.count ?? 0) * (expenses.renting?.pricePerUnit ?? 0),
                agencyFee: expenses.agencyFee, prlFee: expenses.prlFee, accountingFee: expenses.accountingFee, services: expenses.professionalServices,
                appFlyder: expenses.appFlyder, marketing: expenses.marketing, incidents: expenses.incidents, otherExpenses: expenses.other,
                repaartServices: expenses.repaartServices,
                totalExpenses: stats.totalExpenses, expenses: stats.totalExpenses, profit: stats.profit,
                orders: stats.totalOrders, ordersDetail: orders, cancelledOrders,
                status: persistenceStatus, is_locked: shouldLock,
                royaltyPercent: expenses.royaltyPercent, irpfPercent: expenses.irpfPercent,
                updatedAt: new Date().toISOString()
            };

            // Legacy mapping
            if (orders['0-4 km']) persistenceData.ordersNew0To4 = orders['0-4 km'];
            if (orders['4-5 km']) persistenceData.ordersNew4To5 = orders['4-5 km'];
            if (orders['5-6 km']) persistenceData.ordersNew5To6 = orders['5-6 km'];
            if (orders['6-7 km']) persistenceData.ordersNew6To7 = orders['6-7 km'];
            if (orders['>7 km']) persistenceData.ordersNewGt7 = orders['>7 km'];

            await onSave(persistenceData);
            if (shouldLock) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#4f46e5', '#818cf8', '#c7d2fe']
                });
                await notificationService.notify('FINANCE_CLOSING', franchiseId, 'Franquicia', {
                    title: `Cierre: ${month}`, message: 'Cierre enviado.', priority: 'normal',
                    metadata: { month, profit: stats.profit, status: 'locked' }
                });
            }
            if (shouldLock) onClose();
            else alert("Guardado como borrador");
        } catch (e) { console.error(e); } finally { setSaving(false); }
    };

    if (loading) return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Cargando datos financieros...</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-md p-4 pt-8 lg:pt-12 animate-in fade-in duration-200">
            {/* CHANGED: h-[85vh] -> h-[85dvh] for mobile safe areas */}
            <div className="bg-white dark:bg-slate-900 w-full max-w-[95vw] lg:max-w-[1200px] h-[85dvh] max-h-[800px] rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-slate-900/5 dark:ring-slate-800">

                {/* --- HEADER --- */}
                <FinancialHeader
                    month={month}
                    step={step}
                    setStep={(s) => !isLocked && setStep(s)}
                    onClose={onClose}
                    isLocked={isLocked}
                />

                {/* Main Content - Zero Scroll Layout */}
                <div className="flex-1 min-h-0 bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {/* STEP 1: REVENUE */}
                        {step === 1 && (
                            <div role="tabpanel" id="panel-revenue" className="h-full">
                                <RevenueStep
                                    orders={orders}
                                    setOrders={setOrders}
                                    cancelledOrders={cancelledOrders}
                                    setCancelledOrders={setCancelledOrders}
                                    totalIncome={totalIncome}
                                    setTotalIncome={setTotalIncome}
                                    isLocked={isLocked}
                                />
                            </div>
                        )}

                        {/* STEP 2: EXPENSES */}
                        {step === 2 && (
                            <div role="tabpanel" id="panel-expenses" className="h-full">
                                <ExpensesStep
                                    expenses={expenses}
                                    setExpenses={setExpenses}
                                    totalHours={totalHours}
                                    setTotalHours={setTotalHours}
                                    totalExpenses={stats.totalExpenses}
                                    royaltyAmount={stats.royaltyAmount}
                                />
                            </div>
                        )}

                        {/* STEP 3: REVIEW (NEW) */}
                        {step === 3 && (
                            <div role="tabpanel" id="panel-review" className="h-full flex flex-col md:flex-row gap-6 p-4 overflow-y-auto">
                                <div className="flex-1 space-y-4">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Resumen del Mes</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Total Ingresos</p>
                                            <p className="text-2xl font-bold text-indigo-900 dark:text-white">{totalIncome.toFixed(2)}€</p>
                                        </div>
                                        <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-100 dark:border-pink-800">
                                            <p className="text-xs font-semibold text-pink-600 dark:text-pink-400">Total Gastos</p>
                                            <p className="text-2xl font-bold text-pink-900 dark:text-white">{stats.totalExpenses.toFixed(2)}€</p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Beneficio Neto (Antes Amort.)</span>
                                        <span className={`text-xl font-bold ${stats.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {stats.profit.toFixed(2)}€
                                        </span>
                                    </div>

                                    {prevMonthsYtd !== 0 && (
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800">
                                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Acumulado Anual (YTD)</p>
                                            <p className="text-lg font-bold text-blue-900 dark:text-white">{(prevMonthsYtd + stats.netResultAfterAmortization).toFixed(2)}€</p>
                                            <p className="text-[10px] text-slate-500 mt-1">Incluyendo este mes</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 h-[300px] md:h-auto">
                                    <FinancialBreakdownChart stats={stats} expenses={expenses} />
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* --- FOOTER --- */}
                <FinancialFooter
                    step={step}
                    setStep={(s) => setStep(s)}
                    onClose={onClose}
                    onSaveDraft={() => handleSaveData(false)}
                    onConfirm={() => handleSaveData(true)}
                    isLocked={isLocked}
                    saving={saving}
                />
            </div>
        </div>
    );
};

export default FinancialControlCenter;
