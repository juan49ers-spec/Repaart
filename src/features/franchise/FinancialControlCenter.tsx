import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { RevenueStep } from './finance/components/RevenueStep';
import { ExpensesStep } from './finance/components/ExpensesStep';
import { FinancialHeader } from './finance/components/FinancialHeader';
import { FinancialFooter } from './finance/components/FinancialFooter';
import { FinancialBreakdownChart } from './finance/components/FinancialBreakdownChart';
import { useFinancialDataLoad } from './finance/hooks/useFinancialDataLoad';
import { useFinancialSave } from './finance/hooks/useFinancialSave';
import { FinancialRecord, OrderCounts, ExpenseData } from './finance/types';
import {
    calculateStats,
    calculateIncomeFromOrders,
    mapInvoicedDataToOrders,
    mapRecordToExpenses,
    mapRecordToOrders
} from './finance/services/financeCalculations';

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

    const {
        loading, logisticsRates, record, invoicedIncome, operativeHours, calculatedRiderExpenses, franchisePack
    } = useFinancialDataLoad({ franchiseId, month, initialData, user });

    const { saving, handleSave } = useFinancialSave({ franchiseId, month, onSave, onClose });

    const [status, setStatus] = useState<'pending' | 'draft' | 'submitted' | 'approved' | 'unlock_requested' | 'locked' | 'open'>(
        (initialData?.status as 'pending' | 'draft' | 'submitted' | 'approved' | 'unlock_requested' | 'locked' | 'open') || 'open'
    );
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [orders, setOrders] = useState<OrderCounts>({});
    const [cancelledOrders, setCancelledOrders] = useState(0);
    const [totalIncome, setTotalIncome] = useState(initialData?.revenue || initialData?.totalIncome || suggestedIncome || 0);
    const [totalHours, setTotalHours] = useState(0);

    // Calculamos el royalty que le corresponde a ESTA franquicia
    const defaultRoyalty = franchisePack === 'premium' ? 3 : 1;

    const [expenses, setExpenses] = useState<ExpenseData>({
        payroll: 0, quota: 0, insurance: 0, fuel: 0, repairs: 0,
        renting: { count: 0, pricePerUnit: 0 },
        agencyFee: 0, prlFee: 0, accountingFee: 0, professionalServices: 0,
        appFlyder: 0, marketing: 0, incidents: 0, other: 0,
        royaltyPercent: defaultRoyalty, irpfPercent: 20, repaartServices: 0, socialSecurity: 0
    });

    const isLocked = false;

    // --- Auto-cálculo de ingresos desde pedidos ---
    useEffect(() => {
        if (logisticsRates.length === 0) return;
        const calculatedIncome = calculateIncomeFromOrders(orders, logisticsRates);
        if (!isNaN(calculatedIncome)) {
            const hasOrderCounts = Object.values(orders).some(v => v > 0);
            if (hasOrderCounts && Math.abs(calculatedIncome - totalIncome) > 0.01) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setTotalIncome(calculatedIncome);
            }
        }
    }, [orders, logisticsRates, totalIncome]);

    // --- Reaccionar a suggestedIncome si no hay initialData ---
    useEffect(() => {
        if (suggestedIncome && (!initialData?.revenue && !initialData?.totalIncome)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTotalIncome(suggestedIncome);
        }
    }, [suggestedIncome, initialData]);

    // --- Inicializar estado desde record cargado o datos de facturación ---
    useEffect(() => {
        if (record && Object.keys(record).length > 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTotalIncome(record.revenue || record.totalIncome || 0);
            setTotalHours(record.totalHours || 0);
            setCancelledOrders(record.cancelledOrders || 0);
            setStatus(record.status || 'draft');
            setOrders(mapRecordToOrders(record));
            
            // Forzamos siempre el Royalty correcto según su plan actual (1% o 3%)
            // esto reescribe un "5" obsoleto si había quedado guardado en borradores previos.
            const mappedParams = mapRecordToExpenses(record, defaultRoyalty);
            mappedParams.royaltyPercent = defaultRoyalty; 
            
            setExpenses(mappedParams);
        } else if (!loading && invoicedIncome && logisticsRates.length > 0) {
            const hasInvoicedData = invoicedIncome.subtotal > 0 ||
                (invoicedIncome.ordersDetail && Object.keys(invoicedIncome.ordersDetail).length > 0);

            if (hasInvoicedData) {
                const activeRangeNames = logisticsRates.map(r => r.name || `${r.min}-${r.max} km`);
                if (invoicedIncome.ordersDetail) {
                    setOrders(mapInvoicedDataToOrders(invoicedIncome.ordersDetail, activeRangeNames));
                }
                setTotalIncome(invoicedIncome.subtotal);
                setStatus('open');
            }
        }
        
        // Efecto secundario: si no había record pero ya tenemos el pack, 
        // asegurar que 'expenses' tenga el porcentaje del plan correspondiente
        setExpenses(prev => ({ ...prev, royaltyPercent: defaultRoyalty }));
        
    }, [record, loading, invoicedIncome, logisticsRates, defaultRoyalty]);

    // --- Stats calculadas (lógica pura) ---
    const stats = calculateStats(totalIncome, expenses, orders, logisticsRates);

    // --- Handlers de guardado ---
    const handleSaveData = (shouldLock: boolean) => {
        handleSave({
            shouldLock,
            totalIncome,
            totalHours,
            expenses,
            orders,
            cancelledOrders,
            status,
            stats
        });
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
            <div className="bg-white dark:bg-slate-900 w-full max-w-[95vw] lg:max-w-[900px] h-[85dvh] max-h-[700px] rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-slate-900/5 dark:ring-slate-800">

                <FinancialHeader
                    month={month}
                    step={step}
                    setStep={(s) => !isLocked && setStep(s)}
                    onClose={onClose}
                    isLocked={isLocked}
                    status={status}
                    onOpenGuide={onOpenGuide}
                />

                <div className="flex-1 min-h-0 bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <div key="step-1" className="h-full">
                                <RevenueStep
                                    orders={orders}
                                    setOrders={setOrders}
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

                                    <div className="flex flex-col h-full">
                                        <div className="flex-1 bg-white dark:bg-slate-900/50 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-white/5 flex flex-col relative overflow-hidden shadow-sm">
                                            {/* Main Centered Content */}
                                            <div className="flex-1 flex flex-col justify-center items-center text-center pb-4">
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                                                    Resultado Final
                                                </p>
                                                <p className={`text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight tabular-nums ${stats.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                    {stats.profit.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                </p>
                                                <p className={`text-[10px] font-bold mt-2 uppercase tracking-widest ${stats.profit >= 0 ? 'text-emerald-600/80 dark:text-emerald-400/80' : 'text-rose-600/80 dark:text-rose-400/80'}`}>
                                                    Beneficio Operativo (EBITDA)
                                                </p>
                                            </div>

                                            {/* Bottom Stats Grid */}
                                            <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-3 gap-4 text-center">
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Ingresos</p>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                                                        {totalIncome.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Gastos</p>
                                                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                                                        -{stats.totalExpenses.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">M. Ventas</p>
                                                    <p className={`text-sm font-bold tabular-nums ${stats.profit > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                        {totalIncome > 0 ? ((stats.profit / totalIncome) * 100).toFixed(1) : 0}%
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
                    status={status}
                />
            </div>
        </div>
    );
};

export default FinancialControlCenter;
