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
import { LogisticsRate } from '../../types/franchise';

// --- HELPER: KM ESTIMATION (UPDATED) ---
const estimateTotalKm = (orders: OrderCounts, rates: LogisticsRate[]): number => {
    if (!rates || rates.length === 0) {
        const km0_4 = (orders['0-4 km'] || 0) * REAL_DIST_FACTORS.range_0_4;
        const km4_5 = (orders['4-5 km'] || 0) * REAL_DIST_FACTORS.range_4_5;
        const km5_6 = (orders['5-6 km'] || 0) * REAL_DIST_FACTORS.range_5_7;
        const km6_7 = (orders['6-7 km'] || 0) * REAL_DIST_FACTORS.range_5_7;
        const kmGt7 = (orders['>7 km'] || 0) * REAL_DIST_FACTORS.range_7_plus;
        return km0_4 + km4_5 + km5_6 + km6_7 + kmGt7;
    }

    let totalKm = 0;
    Object.entries(orders).forEach(([range, count]) => {
        const rate = rates.find(r => r.name === range || `${r.min}-${r.max} km` === range);
        if (rate) {
            const avgDist = (rate.min + rate.max) / 2;
            totalKm += count * avgDist;
        }
    });
    return totalKm;
};

// --- MAIN COMPONENT ---

interface FinancialControlCenterProps {
    franchiseId: string;
    month: string;
    onClose: () => void;
    onSave?: (data: FinancialRecord) => void;
    initialData?: Partial<FinancialRecord>;
    suggestedIncome?: number;
    onOpenGuide?: () => void;
}

const FinancialControlCenter: React.FC<FinancialControlCenterProps> = ({
    franchiseId, month, onClose, onSave, initialData, suggestedIncome, onOpenGuide
}) => {
    const { user } = useAuth();

    // 1. Load Data Hook
    const {
        loading,
        logisticsRates,
        record,
        invoicedIncome,
        operativeHours,
        calculatedRiderExpenses
    } = useFinancialDataLoad({
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

    const isLocked = false; // El perfil franquicia siempre puede modificar

    // --- LOGIC ---

    // Calculate Income based on Logistics Rates
    useEffect(() => {
        if (logisticsRates.length > 0) {
            let calculatedIncome = 0;
            const normalize = (s: string) => s.toLowerCase().replace(/\s/g, '').replace(/,/g, '.').replace('.1-', '-');

            Object.entries(orders).forEach(([range, count]) => {
                const normRange = normalize(range);
                const rate = logisticsRates.find(r =>
                    normalize(r.name || '') === normRange ||
                    normalize(`${r.min}-${r.max} km`) === normRange
                );
                if (rate && typeof rate.price === 'number') calculatedIncome += count * rate.price;
            });

            // Auto Update Income ONLY if we have actual valid counts
            if (!isNaN(calculatedIncome)) {
                const hasOrderCounts = Object.values(orders).some(v => v > 0);

                // Only overwrite if we have counts (>0) OR if the subtotal was already calculated but changed
                // This prevents the 0-overwrite when invoices are loaded but orders are still 0
                if (hasOrderCounts && Math.abs(calculatedIncome - totalIncome) > 0.01) {
                    setTotalIncome(calculatedIncome);
                }
            }
        }
    }, [orders, logisticsRates, totalIncome]);

    // React to suggestedIncome changes if no initialData
    React.useEffect(() => {
        if (suggestedIncome && (!initialData?.revenue && !initialData?.totalIncome)) {
            setTotalIncome(suggestedIncome);
        }
    }, [suggestedIncome, initialData]);

    // Initialize State from Loaded Record or Invoiced Data
    useEffect(() => {
        if (record && Object.keys(record).length > 0) {
            mapDataToState(record);
        } else if (!loading && invoicedIncome && logisticsRates.length > 0) {
            const hasInvoicedData = invoicedIncome.subtotal > 0 || (invoicedIncome.ordersDetail && Object.keys(invoicedIncome.ordersDetail).length > 0);

            if (hasInvoicedData) {
                const normalize = (s: string) => s.toLowerCase().replace(/\s/g, '').replace(/,/g, '.').replace('.1-', '-');
                const activeRangeNames = logisticsRates.map(r => r.name || `${r.min}-${r.max} km`);

                const mappedOrders: OrderCounts = {};
                activeRangeNames.forEach(r => mappedOrders[r] = 0);

                if (invoicedIncome.ordersDetail) {
                    Object.entries(invoicedIncome.ordersDetail).forEach(([invKey, count]) => {
                        const normInv = normalize(invKey);
                        const match = activeRangeNames.find(r => normalize(r) === normInv);
                        if (match) {
                            mappedOrders[match] = (mappedOrders[match] || 0) + count;
                        } else {
                            mappedOrders[invKey] = count;
                        }
                    });
                }

                setOrders(mappedOrders);
                setTotalIncome(invoicedIncome.subtotal);
                setStatus('draft');
            }
        }
    }, [record, loading, invoicedIncome, logisticsRates]);

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
        const totalOrders = Object.values(orders).reduce((sum, count) => sum + count, 0);
        const estimatedKm = estimateTotalKm(orders, logisticsRates);
        return { totalExpenses, profit: grossMargin, fixedCosts, variableCosts, royaltyAmount, netResultAfterAmortization, totalOrders, estimatedKm };
    };

    const stats = calculateStats();

    const handleSaveData = async (shouldLock: boolean = false) => {
        if (!onSave) return;
        setSaving(true);
        try {
            const persistenceStatus = shouldLock ? 'approved' : status;
            const persistenceData: any = {
                month, totalHours, totalIncome, revenue: totalIncome, grossIncome: totalIncome,
                salaries: expenses.payroll, socialSecurity: expenses.socialSecurity, quota: expenses.quota, insurance: expenses.insurance,
                gasoline: expenses.fuel, repairs: expenses.repairs,
                motoCount: expenses.renting?.count ?? 0,
                rentingCost: (expenses.renting?.count ?? 0) * (expenses.renting?.pricePerUnit ?? 0),
                agencyFee: expenses.agencyFee, prlFee: expenses.prlFee, accountingFee: expenses.accountingFee, services: expenses.professionalServices,
                appFlyder: expenses.appFlyder, marketing: expenses.marketing, incidents: expenses.incidents, otherExpenses: expenses.other,
                repaartServices: expenses.repaartServices,
                totalExpenses: stats.totalExpenses, profit: stats.profit,
                orders: stats.totalOrders, ordersDetail: orders, cancelledOrders,
                status: persistenceStatus, is_locked: false,
                royaltyPercent: expenses.royaltyPercent, irpfPercent: expenses.irpfPercent,
                updatedAt: new Date().toISOString()
            };

            await onSave(persistenceData);
            if (shouldLock) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#4f46e5', '#818cf8', '#c7d2fe']
                });
                await notificationService.notify('FINANCE_CLOSING', franchiseId, 'Franquicia', {
                    title: `Cierre: ${month}`, message: 'Cierre procesado.', priority: 'normal',
                    metadata: { month, profit: stats.profit, status: 'approved' }
                });
                onClose();
            } else {
                alert("Guardado como borrador");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="text-sm font-bold animate-pulse text-indigo-600">Sincronizando Inteligencia Financiera...</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-md p-4 pt-8 lg:pt-12 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-[95vw] lg:max-w-[1200px] h-[85dvh] max-h-[800px] rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-slate-900/5 dark:ring-slate-800">

                <FinancialHeader
                    month={month}
                    step={step}
                    setStep={(s) => !isLocked && setStep(s)}
                    onClose={onClose}
                    isLocked={isLocked}
                    onOpenGuide={onOpenGuide}
                />

                <div className="flex-1 min-h-0 bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <div key="step-1" className="h-full">
                                <RevenueStep
                                    orders={orders}
                                    setOrders={setOrders}
                                    cancelledOrders={cancelledOrders}
                                    setCancelledOrders={setCancelledOrders}
                                    totalIncome={totalIncome}
                                    setTotalIncome={setTotalIncome}
                                    isLocked={isLocked}
                                    invoicedIncome={invoicedIncome}
                                    logisticsRates={logisticsRates}
                                />
                            </div>
                        )}

                        {step === 2 && (
                            <div key="step-2" className="h-full">
                                <ExpensesStep
                                    expenses={expenses}
                                    setExpenses={setExpenses}
                                    totalHours={totalHours}
                                    setTotalHours={setTotalHours}
                                    totalExpenses={stats.totalExpenses}
                                    royaltyAmount={stats.royaltyAmount}
                                    calculatedOperativeHours={operativeHours}
                                    calculatedRiderExpenses={calculatedRiderExpenses}
                                />
                            </div>
                        )}

                        {step === 3 && (
                            <div key="step-3" className="h-full overflow-y-auto custom-scrollbar pr-2">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
                                    <FinancialBreakdownChart
                                        stats={stats}
                                        expenses={expenses}
                                    />

                                    <div className="flex flex-col gap-4">
                                        {/* Result Card */}
                                        <div className="flex-1 bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 flex flex-col justify-center text-center">
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">
                                                Resultado Final
                                            </p>
                                            <p className={`text-4xl sm:text-5xl font-black tracking-tighter tabular-nums ${stats.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                                }`}>
                                                {stats.profit.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                            </p>
                                            <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                                                Beneficio Neto Estimado
                                            </p>

                                            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-3">
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Ingresos</p>
                                                    <p className="text-sm font-black text-slate-700 dark:text-slate-200 tabular-nums">
                                                        {totalIncome.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Gastos</p>
                                                    <p className="text-sm font-black text-rose-600 dark:text-rose-400 tabular-nums">
                                                        -{stats.totalExpenses.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Margen</p>
                                                    <p className={`text-sm font-black tabular-nums ${(stats.profit / (totalIncome || 1)) * 100 >= 15 ? 'text-emerald-600' : 'text-amber-600'
                                                        }`}>
                                                        {((stats.profit / (totalIncome || 1)) * 100).toFixed(1)}%
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                <FinancialFooter
                    step={step}
                    setStep={setStep}
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
