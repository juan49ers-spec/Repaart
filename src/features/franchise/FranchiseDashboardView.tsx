import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Activity, Bot } from 'lucide-react';
import { FinancialReport, MonthlyData } from '../../lib/finance';
import type { TrendItem } from '../../types/finance';
import type { FinancialRecord } from './finance/types';
import type { Invoice } from '../../types/invoicing';
import { TaxCalculations } from '../../hooks/useTaxCalculations';


import { cn } from '../../lib/utils';
import TaxVaultWidget from './finance/TaxVaultWidget';
import FinancialControlCenter from './FinancialControlCenter';
import FranchiseHistoryView from './finance/FranchiseHistoryView';

import ExpenseBreakdownWidget from './dashboard/widgets/ExpenseBreakdownWidget';
import TakeHomeProfitWidget from './dashboard/widgets/TakeHomeProfitWidget';
import RevenueAreaChart from './dashboard/widgets/RevenueAreaChart';
import HourlyCostWidget from './dashboard/widgets/HourlyCostWidget';


import WidgetLegendModal from './dashboard/WidgetLegendModal';
import FinancialWorkflowGuide from './components/FinancialWorkflowGuide';
import { GoalSettingModal } from './components/GoalSettingModal';
import DynamicBanner from '../../components/common/DynamicBanner';
import ErrorBoundary from '../../components/ui/feedback/ErrorBoundary';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { DashboardAlertBanner } from './dashboard/components/DashboardAlertBanner';

export interface DashboardTrendItem {
    month: string;
    revenue: number;
    expenses: number;
    fullDate?: string; // Explicitly add fullDate
    [key: string]: string | number | undefined;
}

export interface BreakdownItem {
    label: string;
    amount: number;
    color: string;
}

export interface FranchiseDashboardViewProps {
    franchiseId?: string;
    effectiveMonth: string;
    readOnly: boolean;
    revenue: number;
    orders?: number;
    totalExpenses: number;
    totalHours: number;
    revenueTrend: number;
    report: FinancialReport | null;
    rawData: MonthlyData | null;
    trendData: TrendItem[];
    formattedTrendData: DashboardTrendItem[];
    fullExpenseBreakdown: BreakdownItem[];
    taxes?: TaxCalculations;
    isWizardOpen: boolean;
    setIsWizardOpen: (open: boolean) => void;

    setIsAdvisorOpen: (open: boolean) => void;
    isHistoryView: boolean;
    setIsHistoryView: (view: boolean) => void;
    drillDown: string | null;
    setDrillDown: (val: string | null) => void;
    isLegendOpen: boolean;
    setIsLegendOpen: (open: boolean) => void;
    showGuide: boolean;
    setShowGuide: (show: boolean) => void;
    onMonthChange: (month: string) => void;
    onUpdateFinance: (data: Partial<MonthlyData>) => Promise<void>;
    monthlyInvoicedAmount?: number;
    currentInvoices?: Invoice[];
}

const FranchiseDashboardView: React.FC<FranchiseDashboardViewProps> = ({
    franchiseId,
    effectiveMonth,
    readOnly,
    revenue,
    orders: _orders,
    totalExpenses,
    totalHours,
    revenueTrend,
    report,
    rawData,
    trendData,
    formattedTrendData,
    fullExpenseBreakdown,
    taxes,
    isWizardOpen,
    setIsWizardOpen,

    setIsAdvisorOpen,
    isHistoryView,
    setIsHistoryView,
    isLegendOpen,
    setIsLegendOpen,
    showGuide,
    setShowGuide,
    onMonthChange,
    onUpdateFinance,
    monthlyInvoicedAmount,
    currentInvoices
}: FranchiseDashboardViewProps) => {
    const { user } = useAuth();

    const [monthlyGoal, setMonthlyGoal] = useState(16000);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [goalModalMode, setGoalModalMode] = useState<'default' | 'monthly_kickoff'>('default');

    React.useEffect(() => {
        const checkKickoffAndLoadGoal = async () => {
            if (user?.uid) {
                const profile = await userService.getUserProfile(user.uid);
                if (profile && profile.monthlyRevenueGoal) {
                    setMonthlyGoal(Number(profile.monthlyRevenueGoal));
                }

                const currentMonthKey = `kickoff_seen_${effectiveMonth}`;
                const hasSeenKickoff = localStorage.getItem(currentMonthKey);

                if (!hasSeenKickoff) {
                    setTimeout(() => {
                        setGoalModalMode('monthly_kickoff');
                        setShowGoalModal(true);
                        localStorage.setItem(currentMonthKey, 'true');
                    }, 1500);
                }
            }
        };
        checkKickoffAndLoadGoal();
    }, [user?.uid, effectiveMonth]);

    const alertFinancialData = report ? {
        revenue,
        expenses: totalExpenses,
        profit: revenue - totalExpenses,
        margin: revenue > 0 ? ((revenue - totalExpenses) / revenue) * 100 : 0,
        orders: _orders ?? 0,
        month: effectiveMonth,
    } : null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
            <div className="max-w-[1700px] mx-auto px-4 md:px-8 py-6">

                {/* TACTICAL HEADER */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4 mt-2 relative">
                    {/* Month Navigator */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl p-0.5 shadow-sm border border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => {
                                    const date = new Date(effectiveMonth + '-01');
                                    date.setMonth(date.getMonth() - 1);
                                    onMonthChange(date.toISOString().slice(0, 7));
                                }}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-all mechanical-press text-slate-400"
                                aria-label="Mes anterior"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="px-3 py-0.5 text-center">
                                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                                    {new Date(effectiveMonth + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase())}
                                </h2>
                            </div>
                            <button
                                onClick={() => {
                                    const date = new Date(effectiveMonth + '-01');
                                    date.setMonth(date.getMonth() + 1);
                                    onMonthChange(date.toISOString().slice(0, 7));
                                }}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-all mechanical-press text-slate-400"
                                aria-label="Mes siguiente"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* View Switcher Capsule (Centered) */}
                    <div className="static lg:absolute lg:left-1/2 lg:-translate-x-1/2 flex bg-blue-50 dark:bg-slate-800 p-1 rounded-xl border border-blue-100 dark:border-slate-700 mx-auto">
                        <button
                            onClick={() => setIsHistoryView(false)}
                            className={`px-5 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all mechanical-press ${!isHistoryView
                                ? 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-100 shadow-sm border border-blue-300 dark:border-blue-800'
                                : 'text-blue-400 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300'
                                }`}
                        >
                            mensual
                        </button>
                        <button
                            onClick={() => setIsHistoryView(true)}
                            className={`px-5 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all mechanical-press ${isHistoryView
                                ? 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-100 shadow-sm border border-blue-300 dark:border-blue-800'
                                : 'text-blue-400 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300'
                                }`}
                        >
                            histórico
                        </button>
                    </div>


                    <div className="flex flex-wrap items-center gap-3">


                        {/* AI Advisor */}
                        {(() => {
                            const liveRevenue = revenue > 0 ? revenue : (monthlyInvoicedAmount || 0);
                            const liveLaborCost = Number(rawData?.salaries || 0) > 0 ? Number(rawData?.salaries) : totalHours * 7.5;
                            const liveTotalExpenses = totalExpenses > 0 ? totalExpenses : liveLaborCost;
                            const margin = liveRevenue > 0 ? (((liveRevenue - liveTotalExpenses) - ((liveRevenue - liveTotalExpenses) > 0 ? (liveRevenue - liveTotalExpenses) * 0.20 : 0)) / liveRevenue) * 100 : 0;
                            const expenseRatio = liveRevenue > 0 ? liveTotalExpenses / liveRevenue : 0;
                            const hourlyCost = totalHours > 0 ? liveTotalExpenses / totalHours : 0;
                            const hasAlerts = margin < 15 || expenseRatio > 0.7 || hourlyCost > 22 || revenueTrend < -3 || (liveRevenue > 0 && liveTotalExpenses > liveRevenue);

                            return (
                                <button
                                    onClick={() => setIsAdvisorOpen(true)}
                                    className={cn(
                                        "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all border shadow-sm",
                                        hasAlerts 
                                            ? "bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-300 ring-2 ring-amber-400/50 shadow-amber-200/50" 
                                            : "bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                                    )}
                                >
                                    <Bot className={cn("w-3.5 h-3.5", hasAlerts && "animate-pulse")} />
                                    <span>Tu Asesor</span>
                                    {hasAlerts && (
                                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                                        </span>
                                    )}
                                </button>
                            );
                        })()}

                        {/* Action Primary: Close Month */}
                        {!readOnly && (() => {
                            // Using type assertion to any to access potentially missing fields in rawData
                            const rawDataAny = rawData as Record<string, unknown>;
                            const rawStatus = rawDataAny?.status;
                            const rawLocked = rawDataAny?.isLocked;
                            const hasData = rawDataAny?.revenue || rawDataAny?.totalIncome;
                            
                            const status = rawStatus || (rawLocked ? 'locked' : (!hasData ? 'open' : 'draft'));
                            
                            return (
                                <div className="relative">
                                    <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-800 dark:bg-slate-700 text-white rounded shadow-md border border-slate-700/50 flex items-center gap-1.5 whitespace-nowrap z-40 pointer-events-none animate-in fade-in slide-in-from-bottom-1">
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Estado:</span>
                                        <span className="text-[9px] font-bold uppercase tracking-wider">
                                            {status === 'draft' && <span className="flex items-center gap-1 text-yellow-400"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span> Borrador</span>}
                                            {status === 'approved' && <span className="flex items-center gap-1 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Aprobado</span>}
                                            {status === 'locked' && <span className="flex items-center gap-1 text-slate-300"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Cerrado</span>}
                                            {status === 'open' && <span className="flex items-center gap-1 text-indigo-300"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> Abierto</span>}
                                        </span>
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 dark:bg-slate-700 border-r border-b border-slate-700/50 rotate-45"></div>
                                    </div>

                                    <button
                                        onClick={() => setIsWizardOpen(true)}
                                        className="px-4 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all mechanical-press shadow-sm flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white border border-red-400 hover:shadow-md hover:scale-[1.01]"
                                    >
                                        <Activity className="w-3.5 h-3.5" />
                                        <span>ejecutar.cierre</span>
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                </div>


                {/* MAIN COCKPIT HORIZONTAL MODULES */}
                {!isHistoryView ? (
                    <div className="flex flex-col gap-6">
                        <DashboardAlertBanner
                            franchiseId={franchiseId ?? ''}
                            financialData={alertFinancialData}
                            shiftsData={null}
                            ridersData={null}
                            onOpenAdvisor={() => setIsAdvisorOpen(true)}
                        />
                        <DynamicBanner />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {(() => {
                                const liveRevenue = revenue > 0 ? revenue : (monthlyInvoicedAmount || 0);
                                const liveLaborCost = Number(rawData?.salaries || 0) > 0 ? Number(rawData?.salaries) : totalHours * 7.5;
                                const liveTotalExpenses = totalExpenses > 0 ? totalExpenses : liveLaborCost;

                                // Sync IRPF to match live values displayed in TakeHomeProfitWidget
                                const operatingProfit = liveRevenue - liveTotalExpenses;
                                const irpfPercent = report?.taxes?.irpfPercent || 20;
                                const liveIrpfPayable = operatingProfit > 0 ? (operatingProfit * irpfPercent) / 100 : 0;

                                const syncedTaxes = taxes ? {
                                    ...taxes,
                                    irpfPayable: liveIrpfPayable,
                                    totalTaxLiability: taxes.ivaPayable + liveIrpfPayable,
                                    safeToSpend: (report?.netProfit || 0) - (taxes.ivaPayable + liveIrpfPayable)
                                } : null;

                                return (
                                    <>
                                        {/* Row 1: Core Metrics & Intelligence (3 Columns) */}
                                        <div className="col-span-1">
                                            <ErrorBoundary>
                                                <div className="h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700">
                                                    <TakeHomeProfitWidget
                                                        revenue={liveRevenue}
                                                        totalExpenses={liveTotalExpenses}
                                                        irpfPercent={irpfPercent}
                                                        annualNetProfit={report?.metrics?.profitPerRider || 0}
                                                        onDetailClick={() => setIsWizardOpen(true)}
                                                    />
                                                </div>
                                            </ErrorBoundary>
                                        </div>

                                        <div className="col-span-1">
                                            <ErrorBoundary>
                                                <div className="h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700">
                                                    <TaxVaultWidget
                                                        taxes={syncedTaxes}
                                                        minimal
                                                        currentMonth={effectiveMonth}
                                                        historicalData={trendData as unknown as DashboardTrendItem[]}
                                                        currentInvoices={currentInvoices}
                                                    />
                                                </div>
                                            </ErrorBoundary>
                                        </div>

                                        <div className="col-span-1">
                                            <ErrorBoundary>
                                                <div className="h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700">
                                                    <HourlyCostWidget
                                                        totalCost={liveTotalExpenses}
                                                        totalHours={totalHours}
                                                        trend={0}
                                                        laborCost={liveLaborCost}
                                                        otherCosts={liveTotalExpenses - liveLaborCost}
                                                    />
                                                </div>
                                            </ErrorBoundary>
                                        </div>

                                        {/* Row 2: Charts and Breakdowns */}
                                        <div className="col-span-1 md:col-span-2 lg:col-span-2 p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 transition-all hover:border-slate-300 dark:hover:border-slate-700">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-3 w-1 bg-indigo-500 rounded-full" />
                                                    <h3 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[.2em]">Evolución Mensual</h3>
                                                </div>
                                            </div>
                                            <div className="h-[280px]">
                                                <RevenueAreaChart data={formattedTrendData} />
                                            </div>
                                        </div>

                                        <div className="col-span-1 md:col-span-2 lg:col-span-1">
                                            <ErrorBoundary>
                                                <div className="h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700">
                                                    <ExpenseBreakdownWidget breakdown={fullExpenseBreakdown.length > 0 ? fullExpenseBreakdown : [{ label: 'Carga Laboral', amount: liveLaborCost, color: '#6366f1' }]} />
                                                </div>
                                            </ErrorBoundary>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                ) : (
                    <FranchiseHistoryView franchiseId={franchiseId || ''} />
                )}


                {/* MODALS & OVERLAYS */}
                {isWizardOpen && (
                    <FinancialControlCenter
                        franchiseId={franchiseId || ''}
                        month={effectiveMonth}
                        onClose={() => setIsWizardOpen(false)}
                        onSave={async (data) => {
                            try {
                                await onUpdateFinance(data as unknown as Partial<MonthlyData>);
                                setIsWizardOpen(false);
                            } catch (error) {
                                console.error('Error saving financial data:', error);
                            }
                        }}
                        initialData={rawData as unknown as Partial<FinancialRecord>}
                        suggestedIncome={monthlyInvoicedAmount}
                    />
                )}



                {showGoalModal && (
                    <GoalSettingModal
                        currentGoal={monthlyGoal}
                        currentRevenue={revenue || 0}
                        onClose={() => setShowGoalModal(false)}
                        onSave={(newGoal) => setMonthlyGoal(newGoal)}
                        mode={goalModalMode}
                    />
                )}

                <FinancialWorkflowGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
                <WidgetLegendModal isOpen={isLegendOpen} onClose={() => setIsLegendOpen(false)} />
            </div>
        </div>
    );
};

export default FranchiseDashboardView;
