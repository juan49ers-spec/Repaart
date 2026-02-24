import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, ChevronLeft, ChevronRight, Banknote, Activity, Bot } from 'lucide-react';
import { formatMoney, FinancialReport, MonthlyData } from '../../lib/finance';
import type { TrendItem } from '../../types/finance';
import type { FinancialRecord } from './finance/types';
import { TaxCalculations } from '../../hooks/useTaxCalculations';


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
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 mt-4 relative">
                    {/* Month Navigator */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-white dark:bg-slate-800 rounded-2xl p-1 shadow-sm border border-slate-200 dark:border-slate-700">
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
                    </div>

                    {/* View Switcher Capsule (Centered) */}
                    <div className="static lg:absolute lg:left-1/2 lg:-translate-x-1/2 flex bg-blue-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-blue-100 dark:border-slate-700 mx-auto">
                        <button
                            onClick={() => setIsHistoryView(false)}
                            className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all mechanical-press ${!isHistoryView
                                ? 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-100 shadow-sm border border-blue-300 dark:border-blue-800'
                                : 'text-blue-400 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300'
                                }`}
                        >
                            mensual
                        </button>
                        <button
                            onClick={() => setIsHistoryView(true)}
                            className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all mechanical-press ${isHistoryView
                                ? 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-100 shadow-sm border border-blue-300 dark:border-blue-800'
                                : 'text-blue-400 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300'
                                }`}
                        >
                            histórico
                        </button>
                    </div>


                    <div className="flex flex-wrap items-center gap-3">
                        {/* Simulation Tool */}
                        <button
                            onClick={() => setIsSimulatorOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border border-slate-200"
                        >
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Simulación</span>
                        </button>

                        {/* AI Advisor */}
                        <button
                            onClick={() => setIsAdvisorOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-blue-200 shadow-sm"
                        >
                            <Bot className="w-4 h-4" />
                            <span>Tu Asesor</span>
                        </button>

                        {/* Action Primary: Close Month */}
                        {!readOnly && (
                            <button
                                onClick={() => setIsWizardOpen(true)}
                                className="px-8 py-3.5 rounded-2xl text-[12px] font-black uppercase tracking-[0.15em] transition-all mechanical-press shadow-md flex items-center gap-2.5 bg-red-400 hover:bg-red-500 text-white border border-red-300 hover:shadow-lg hover:scale-[1.02]"
                            >
                                <Activity className="w-4 h-4" />
                                <span>ejecutar.cierre</span>
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

                            {(() => {
                                // Live Fallbacks for Dashboard before Month Close
                                const liveRevenue = revenue > 0 ? revenue : (monthlyInvoicedAmount || 0);
                                const liveLaborCost = Number(rawData?.salaries || 0) > 0 ? Number(rawData?.salaries) : totalHours * 7.5; // Base 7.5€/h estimation
                                const liveTotalExpenses = totalExpenses > 0 ? totalExpenses : liveLaborCost;

                                return (
                                    <>
                                        {/* Core KPIs */}
                                        <ErrorBoundary>
                                            <div onClick={() => {
                                                if (readOnly) return;
                                                setGoalModalMode('default');
                                                setShowGoalModal(true);
                                            }} className="h-full">
                                                <KPICard
                                                    title="Ingresos Netos"
                                                    value={formatMoney(liveRevenue) + '€'}
                                                    trend={Number(revenueTrend.toFixed(1))}
                                                    trendData={trendData?.map(d => d.revenue || 0)}
                                                    icon={<Banknote />}
                                                    color="ruby"
                                                    monthlyGoal={monthlyGoal}
                                                    rawValue={liveRevenue}
                                                    orders={orders}
                                                    totalHours={totalHours}
                                                    bestDay="FRIDAY"
                                                />
                                            </div>
                                        </ErrorBoundary>

                                        {/* Operating Profit / Wallet */}
                                        <ErrorBoundary>
                                            <div className="h-full">
                                                <TakeHomeProfitWidget
                                                    revenue={liveRevenue}
                                                    totalExpenses={liveTotalExpenses}
                                                    annualNetProfit={report?.metrics?.profitPerRider || 0}
                                                    onDetailClick={() => setIsWizardOpen(true)}
                                                />
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
                                                    totalCost={liveTotalExpenses}
                                                    totalHours={totalHours}
                                                    trend={0}
                                                    laborCost={liveLaborCost}
                                                    otherCosts={liveTotalExpenses - liveLaborCost}
                                                />
                                            </div>
                                        </ErrorBoundary>
                                    </>
                                );
                            })()}
                        </motion.div>

                        {/* ANALYTICS RADAR LAYER */}
                        <motion.div
                            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                            variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
                        >
                            {(() => {
                                const liveRevenue = revenue > 0 ? revenue : (monthlyInvoicedAmount || 0);
                                const liveLaborCost = Number(rawData?.salaries || 0) > 0 ? Number(rawData?.salaries) : totalHours * 7.5;
                                const liveTotalExpenses = totalExpenses > 0 ? totalExpenses : liveLaborCost;

                                return (
                                    <>
                                        {/* Financial Health Score */}
                                        <ErrorBoundary>
                                            <div className="lg:col-span-5">
                                                <FinancialAdvisorWidget
                                                    revenue={liveRevenue}
                                                    expenses={liveTotalExpenses}
                                                    margin={liveRevenue > 0 ? ((liveRevenue - liveTotalExpenses) / liveRevenue) * 100 : 0}
                                                    hourlyCost={totalHours > 0 ? liveTotalExpenses / totalHours : 0}
                                                    taxReserve={liveRevenue * 0.21}
                                                    trend={revenueTrend}
                                                    onOpenAdvisor={() => setIsAdvisorOpen(true)}
                                                />
                                            </div>
                                        </ErrorBoundary>

                                        {/* Breakdown Terminal */}
                                        <ErrorBoundary>
                                            <div className="lg:col-span-7 h-full">
                                                <ExpenseBreakdownWidget breakdown={fullExpenseBreakdown.length > 0 ? fullExpenseBreakdown : [{ label: 'Carga Laboral', amount: liveLaborCost, color: '#f59e0b' }]} />
                                            </div>
                                        </ErrorBoundary>
                                    </>
                                );
                            })()}
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
