import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, ChevronLeft, ChevronRight, Lock, Banknote, Activity, Target, Bot } from 'lucide-react';
import { formatMoney, FinancialReport, MonthlyData } from '../../lib/finance';
import type { TrendItem } from '../../types/finance';
import type { FinancialRecord } from './finance/types';
import { TaxCalculations } from '../../hooks/useTaxCalculations';
import FinancialSyncStatus from './components/FinancialSyncStatus';

// Components
import TaxVaultWidget from './finance/TaxVaultWidget';
import FinancialControlCenter from './FinancialControlCenter';
import FranchiseHistoryView from './finance/FranchiseHistoryView';
import ScenarioSimulator from './finance/ScenarioSimulator';
import ExpenseBreakdownWidget from './dashboard/widgets/ExpenseBreakdownWidget';
import TakeHomeProfitWidget from './dashboard/widgets/TakeHomeProfitWidget';
import RevenueAreaChart from './dashboard/widgets/RevenueAreaChart';
import KPICard from './dashboard/widgets/KPICard';
import HourlyCostWidget from './dashboard/widgets/HourlyCostWidget';
import FinancialAdvisorWidget from './dashboard/widgets/FinancialAdvisorWidget';
import WidgetLegendModal from './dashboard/WidgetLegendModal';
import FinancialWorkflowGuide from './components/FinancialWorkflowGuide';
import { GoalSettingModal } from './components/GoalSettingModal';
import DynamicBanner from '../../components/common/DynamicBanner';
import ErrorBoundary from '../../components/ui/feedback/ErrorBoundary';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

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
    isRealTime?: boolean;
    lastUpdated?: Date;
    revenue: number;
    orders: number;
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
    isSimulatorOpen: boolean;
    setIsSimulatorOpen: (open: boolean) => void;
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
}

const FranchiseDashboardView: React.FC<FranchiseDashboardViewProps> = ({
    franchiseId,
    effectiveMonth,
    readOnly,
    isRealTime = false,
    lastUpdated,
    revenue,
    orders,
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
    isSimulatorOpen,
    setIsSimulatorOpen,
    setIsAdvisorOpen,
    isHistoryView,
    setIsHistoryView,
    isLegendOpen,
    setIsLegendOpen,
    showGuide,
    setShowGuide,
    onMonthChange,
    onUpdateFinance,
    monthlyInvoicedAmount
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

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
            <div className="max-w-[1700px] mx-auto px-4 md:px-8 py-6">

                {/* TACTICAL HEADER */}
                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 mb-8">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Month Selector Island */}
                        <div className="flex items-center gap-1 p-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm">
                            <button
                                onClick={() => {
                                    const date = new Date(effectiveMonth + '-01');
                                    date.setMonth(date.getMonth() - 1);
                                    onMonthChange(date.toISOString().slice(0, 7));
                                }}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all mechanical-press text-slate-500"
                                aria-label="Mes anterior"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="px-5 py-1 text-center">
                                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                    {new Date(effectiveMonth + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase())}
                                </h2>
                            </div>
                            <button
                                onClick={() => {
                                    const date = new Date(effectiveMonth + '-01');
                                    date.setMonth(date.getMonth() + 1);
                                    onMonthChange(date.toISOString().slice(0, 7));
                                }}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all mechanical-press text-slate-500"
                                aria-label="Mes siguiente"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* View Switcher Capsule */}
                        <div className="flex bg-slate-200/50 dark:bg-white/5 p-1 rounded-2xl border border-slate-300/30 dark:border-white/5">
                            <button
                                onClick={() => setIsHistoryView(false)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mechanical-press ${!isHistoryView
                                    ? 'bg-white dark:bg-slate-800 text-ruby-600 shadow-sm border border-slate-200 dark:border-white/10'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                mensual
                            </button>
                            <button
                                onClick={() => setIsHistoryView(true)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mechanical-press ${isHistoryView
                                    ? 'bg-white dark:bg-slate-800 text-ruby-600 shadow-sm border border-slate-200 dark:border-white/10'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                histórico
                            </button>
                        </div>
                    </div>


                    <div className="flex flex-wrap items-center gap-3">
                        {/* Real-Time Status */}
                        <FinancialSyncStatus
                            isRealTime={isRealTime}
                            lastUpdated={lastUpdated}
                        />

                        {/* Simulation Tool */}
                        <button
                            onClick={() => setIsSimulatorOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mechanical-press shadow-lg shadow-amber-500/20 border border-amber-400/50"
                        >
                            <PlayCircle className="w-4 h-4" />
                            <span>Simulación</span>
                        </button>

                        {/* AI Advisor */}
                        <button
                            onClick={() => setIsAdvisorOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mechanical-press shadow-lg shadow-indigo-500/20 border border-indigo-400/50"
                        >
                            <Bot className="w-4 h-4" />
                            <span>Tu Asesor</span>
                        </button>

                        {/* Help Protocol */}
                        <button
                            onClick={() => setShowGuide(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-ruby-600 dark:hover:text-ruby-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mechanical-press shadow-sm"
                        >
                            <Target className="w-4 h-4" />
                            <span>Guía</span>
                        </button>

                        {/* Action Primary: Close Month */}
                        {!readOnly && (
                            <button
                                onClick={() => setIsWizardOpen(true)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all mechanical-press shadow-xl flex items-center gap-2 ${rawData?.isLocked || rawData?.status === 'submitted' || rawData?.status === 'approved' || rawData?.status === 'locked'
                                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600'
                                    : 'bg-ruby-600 hover:bg-ruby-700 text-white shadow-ruby-600/20 border border-ruby-500/50'
                                    }`}
                            >
                                {rawData?.isLocked || rawData?.status === 'submitted' || rawData?.status === 'approved' || rawData?.status === 'locked' ? (
                                    <>
                                        <Lock className="w-3.5 h-3.5" />
                                        <span>Cierre Mensual</span>
                                    </>
                                ) : (
                                    <>
                                        <Activity className="w-3.5 h-3.5" />
                                        <span>ejecutar.cierre</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* MAIN COCKPIT GRID */}
                {!isHistoryView ? (
                    <motion.div
                        className="space-y-6"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.08 } }
                        }}
                    >

                        <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
                            <DynamicBanner />
                        </motion.div>

                        {/* CORE TELEMETRY ROW */}
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                            variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
                        >
                            {/* Revenue Cockpit */}
                            <ErrorBoundary>
                                <div onClick={() => {
                                    if (readOnly) return;
                                    setGoalModalMode('default');
                                    setShowGoalModal(true);
                                }} className="h-full">
                                    <KPICard
                                        title="Ingresos Netos"
                                        value={formatMoney(revenue || 0) + '€'}
                                        trend={Number(revenueTrend.toFixed(1))}
                                        trendData={trendData.map((d) => d.revenue)}
                                        icon={<Banknote />}
                                        color="ruby"
                                        monthlyGoal={monthlyGoal}
                                        rawValue={revenue || 0}
                                        orders={orders}
                                        totalHours={totalHours}
                                        bestDay="FRIDAY"
                                    />
                                </div>
                            </ErrorBoundary>

                            {/* Net Profit Unit */}
                            <ErrorBoundary>
                                <div className="h-full">
                                    {(() => {
                                        const currentYear = effectiveMonth.split('-')[0];
                                        const historicalProfit = formattedTrendData
                                            .filter((month) => {
                                                const monthKey = month.fullDate || month.month;
                                                return monthKey && (monthKey as string).startsWith(currentYear) && monthKey !== effectiveMonth;
                                            })
                                            .reduce((sum, month) => {
                                                const opProfit = month.revenue - month.expenses;
                                                const tax = opProfit > 0 ? opProfit * (rawData?.irpfPercent || 20) / 100 : 0;
                                                return sum + (opProfit - tax);
                                            }, 0);

                                        const currentOpProfit = (revenue || 0) - totalExpenses;
                                        const currentTax = currentOpProfit > 0 ? currentOpProfit * (rawData?.irpfPercent || 20) / 100 : 0;
                                        const currentNetProfit = currentOpProfit - currentTax;
                                        const annualNetProfit = effectiveMonth.startsWith(currentYear) ? historicalProfit + currentNetProfit : historicalProfit;

                                        return (
                                            <TakeHomeProfitWidget
                                                revenue={revenue || 0}
                                                totalExpenses={totalExpenses}
                                                irpfPercent={rawData?.irpfPercent || 20}
                                                trend={trendData.map((d) => d.profit || 0)}
                                                annualNetProfit={annualNetProfit}
                                                year={currentYear}
                                                onDetailClick={() => setIsWizardOpen(true)}
                                            />
                                        );
                                    })()}
                                </div>
                            </ErrorBoundary>

                            {/* Tax Vault Station */}
                            <ErrorBoundary>
                                <div className="h-full">
                                    <TaxVaultWidget
                                        taxes={taxes || null}
                                        minimal
                                        currentMonth={effectiveMonth}
                                        historicalData={formattedTrendData as any}
                                    />
                                </div>
                            </ErrorBoundary>

                            {/* Resource Efficiency */}
                            <ErrorBoundary>
                                <div className="h-full">
                                    <HourlyCostWidget
                                        totalCost={totalExpenses}
                                        totalHours={totalHours}
                                        trend={0}
                                        laborCost={Number(rawData?.salaries || 0)}
                                        otherCosts={totalExpenses - Number(rawData?.salaries || 0)}
                                    />
                                </div>
                            </ErrorBoundary>
                        </motion.div>

                        {/* ANALYTICS RADAR LAYER */}
                        <motion.div
                            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                            variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
                        >
                            {/* Financial Health Score */}
                            <ErrorBoundary>
                                <div className="lg:col-span-5">
                                    <FinancialAdvisorWidget
                                        revenue={revenue}
                                        expenses={totalExpenses}
                                        margin={revenue > 0 ? ((revenue - totalExpenses) / revenue) * 100 : 0}
                                        hourlyCost={totalHours > 0 ? totalExpenses / totalHours : 0}
                                        taxReserve={revenue * 0.21}
                                        trend={revenueTrend}
                                        onOpenAdvisor={() => setIsAdvisorOpen(true)}
                                    />
                                </div>
                            </ErrorBoundary>

                            {/* Breakdown Terminal */}
                            <ErrorBoundary>
                                <div className="lg:col-span-7 h-full">
                                    <ExpenseBreakdownWidget breakdown={fullExpenseBreakdown} />
                                </div>
                            </ErrorBoundary>
                        </motion.div>

                        {/* TIMELINE EVOLUTION */}
                        <ErrorBoundary>
                            <motion.div
                                className="workstation-card workstation-scanline p-6"
                                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-6 w-1 bg-ruby-600 rounded-full" />
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[.3em]">Evolución Temporal</h3>
                                </div>
                                <div className="h-[300px]">
                                    <RevenueAreaChart data={formattedTrendData} />
                                </div>
                            </motion.div>
                        </ErrorBoundary>

                    </motion.div>
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

                <ScenarioSimulator
                    isOpen={isSimulatorOpen}
                    onClose={() => setIsSimulatorOpen(false)}
                    currentData={{
                        ...report,
                        revenue: revenue || report?.revenue || 0,
                        orders: orders || 0,
                        totalExpenses: report?.totalExpenses || 0,
                        fixed: report?.fixed || { total: 0, salaries: 0, renting: 0, insurance: 0, services: 0, quota: 0, other: 0 },
                        variable: report?.variable || { total: 0, gasoline: 0, repairs: 0, flyderFee: 0, royalty: 0 },
                        netProfit: report?.netProfit || 0,
                        taxes: report?.taxes || { ivaRepercutido: 0, ivaSoportado: 0, ivaAPagar: 0, irpfPago: 0, totalReserve: 0, irpfPercent: 20, netProfitPostTax: 0, netProfit: 0, margin: 0, vat: { toPay: 0 } },
                        metrics: report?.metrics || { avgTicket: 0, costPerOrder: 0, breakEvenOrders: 0, profitMargin: 0, activeRiders: 0, productivity: 0, revenuePerHour: 0, costPerHour: 0, profitPerRider: 0, totalKm: 0, revenuePerKm: 0, costPerKm: 0, dropDensity: 0, safetyMargin: 0, laborRatio: 0, incidentRatio: 0, marketingSpend: 0, incidentCost: 0 },
                        breakdown: report?.breakdown || []
                    }}
                />

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
