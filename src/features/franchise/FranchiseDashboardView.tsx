import React, { useState } from 'react';
import { PlayCircle, FileText, Sparkles, ChevronLeft, ChevronRight, Lock, Banknote } from 'lucide-react';
import { formatMoney, FinancialReport, MonthlyData } from '../../lib/finance';

// Components
import TaxVaultWidget from './finance/TaxVaultWidget';
import FinancialControlCenter from './FinancialControlCenter';
import FranchiseHistoryView from './finance/FranchiseHistoryView';
import ScenarioSimulator from './finance/ScenarioSimulator';
import DrillDownModal from '../admin/dashboard/DrillDownModal';
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
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { PageTitle } from '../../ui/primitives/Typography';

export interface DashboardTrendItem {
    month: string;
    revenue: number;
    expenses: number;
    [key: string]: any;
}

export interface BreakdownItem {
    label: string;
    amount: number;
    color: string;
}

export interface FranchiseDashboardViewProps {
    // Context & Config
    franchiseId?: string;
    effectiveMonth: string;
    readOnly: boolean;

    // Metrics & Data
    revenue: number;
    orders: number;
    totalExpenses: number;
    totalHours: number;
    // costPerHour removed
    revenueTrend: number;

    // Data Structures
    report: FinancialReport | null; // Using FinancialReport from lib/finance
    rawData: MonthlyData | null;
    trendData: any[]; // Raw trend data for sparklines
    formattedTrendData: DashboardTrendItem[];
    fullExpenseBreakdown: BreakdownItem[];

    // View State
    isWizardOpen: boolean;
    setIsWizardOpen: (open: boolean) => void;
    isSimulatorOpen: boolean;
    setIsSimulatorOpen: (open: boolean) => void;
    isHistoryView: boolean;
    setIsHistoryView: (view: boolean) => void;
    drillDown: string | null;
    setDrillDown: (val: string | null) => void;
    isLegendOpen: boolean;
    setIsLegendOpen: (open: boolean) => void;
    showGuide: boolean;
    setShowGuide: (show: boolean) => void;

    // Actions
    onMonthChange: (month: string) => void;
    onUpdateFinance: (data: any) => Promise<void>;
}

const FranchiseDashboardView: React.FC<FranchiseDashboardViewProps> = ({
    franchiseId,
    effectiveMonth,
    readOnly,
    revenue,
    orders,
    totalExpenses,
    totalHours,
    // costPerHour removed
    revenueTrend,
    report,
    rawData,
    trendData,
    formattedTrendData,
    fullExpenseBreakdown,
    isWizardOpen,
    setIsWizardOpen,
    isSimulatorOpen,
    setIsSimulatorOpen,
    isHistoryView,
    setIsHistoryView,
    drillDown,
    setDrillDown,
    isLegendOpen,
    setIsLegendOpen,
    showGuide,
    setShowGuide,
    onMonthChange,
    onUpdateFinance
}) => {
    const { user } = useAuth();
    const [monthlyGoal, setMonthlyGoal] = useState(16000);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [goalModalMode, setGoalModalMode] = useState<'default' | 'monthly_kickoff'>('default');

    // Monthly Kickoff Check & Goal Load
    React.useEffect(() => {
        const checkKickoffAndLoadGoal = async () => {
            if (user?.uid) {
                // 1. Load Goal
                const profile = await userService.getUserProfile(user.uid);
                if (profile && profile.monthlyRevenueGoal) {
                    setMonthlyGoal(Number(profile.monthlyRevenueGoal));
                }

                // 2. Check Kickoff (Local Storage for simplicity per device)
                const currentMonthKey = `kickoff_seen_${effectiveMonth}`;
                const hasSeenKickoff = localStorage.getItem(currentMonthKey);

                if (!hasSeenKickoff) {
                    // Small delay for better UX
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
        <div className="min-h-screen bg-[#fafbfc] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-900/30 transition-colors duration-300">
            <div className="max-w-[1600px] mx-auto px-4 py-3 space-y-4">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-1">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm">
                            <button
                                onClick={() => {
                                    const date = new Date(effectiveMonth + '-01');
                                    date.setMonth(date.getMonth() - 1);
                                    onMonthChange(date.toISOString().slice(0, 7));
                                }}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
                                title="Mes Anterior"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <PageTitle as="h2" className="text-lg px-4 min-w-[180px] text-center uppercase tabular-nums font-bold">
                                {new Date(effectiveMonth + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                            </PageTitle>
                            <button
                                onClick={() => {
                                    const date = new Date(effectiveMonth + '-01');
                                    date.setMonth(date.getMonth() + 1);
                                    onMonthChange(date.toISOString().slice(0, 7));
                                }}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
                                title="Mes Siguiente"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>


                    <div className="flex items-center gap-3">
                        {/* Help Button */}
                        <button
                            onClick={() => setIsLegendOpen(true)}
                            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-700 text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm hover:shadow flex items-center gap-1.5"
                            title="Guía Financiera"
                        >
                            <Banknote className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            <span className="hidden sm:inline">Guía</span>
                        </button>

                        {/* Workflow Guide Button - Only visible in History View */}
                        {isHistoryView && (
                            <button
                                onClick={() => setShowGuide(true)}
                                className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center gap-2 animate-in fade-in slide-in-from-right-4"
                                title="Guía del Proceso de Cierre"
                            >
                                <FileText className="w-4 h-4" />
                                <span className="hidden sm:inline">Guía</span>
                            </button>
                        )}

                        {/* Simulator Trigger - Striking Amber Style (viewable in readOnly for analysis) */}
                        <button
                            onClick={() => setIsSimulatorOpen(true)}
                            className="relative group overflow-hidden bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 flex items-center gap-1.5 border border-amber-400/50"
                        >
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                            <PlayCircle className="w-4 h-4 text-amber-100 group-hover:rotate-12 transition-transform" />
                            <span>Simular</span>
                        </button>

                        <button
                            onClick={() => setIsHistoryView(!isHistoryView)}
                            className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all shadow-sm ${isHistoryView
                                ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-lg shadow-slate-800/20 hover:bg-slate-900 dark:hover:bg-slate-600'
                                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:border-slate-200 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                            title={isHistoryView ? "Cambiar a Vista Mensual" : "Cambiar a Vista Histórica"}
                        >
                            {isHistoryView ? 'Mensual' : 'Histórico'}
                        </button>

                        {!readOnly && (
                            <button
                                onClick={() => setIsWizardOpen(true)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-sm hover:shadow border ${rawData?.is_locked || rawData?.status === 'submitted' || rawData?.status === 'approved' || rawData?.status === 'locked'
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                                title={rawData?.is_locked ? "Ver Cierre (Bloqueado)" : "Iniciar Cierre de Mes"}
                            >
                                {rawData?.is_locked || rawData?.status === 'submitted' || rawData?.status === 'approved' || rawData?.status === 'locked' ? (
                                    <>
                                        <Lock className="w-4 h-4 text-emerald-500" />
                                        <span>Ver Cierre</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 text-indigo-500" />
                                        <span>Cerrar Mes</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* CONTENT AREA */}
                {!isHistoryView ? (
                    <div className="space-y-4 animate-in fade-in duration-300 slide-in-from-bottom-2">

                        {/* --- DYNAMIC BANNER (Admin Controlled) --- */}
                        <DynamicBanner />

                        {/* ROW 1: CORE METRICS & WEALTH */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 gap-4">
                            {/* 1. Ingresos */}
                            <div onClick={() => {
                                if (readOnly) return; // Disabled in impersonation mode
                                setGoalModalMode('default');
                                setShowGoalModal(true);
                            }} className={`${readOnly ? '' : 'cursor-pointer hover:z-10 transition-all transform hover:-translate-y-1 duration-300 ring-2 ring-transparent hover:ring-indigo-500/20'} group/goal relative rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800`}>
                                <KPICard
                                    title="Ingresos"
                                    value={formatMoney(revenue || 0) + '€'}
                                    trend={Number(revenueTrend.toFixed(1))}
                                    trendData={trendData.map((d: any) => d.revenue)}
                                    icon={<Banknote />}
                                    color="blue"

                                    subtext={undefined}
                                    monthlyGoal={monthlyGoal} // Dynamic Goal
                                    lastYearValue={revenue > 0 ? revenue * 0.85 : undefined}
                                    showPrediction={false}
                                    rawValue={revenue || 0}
                                    orders={orders}
                                    totalHours={totalHours}
                                    bestDay="Viernes"
                                    alignHeader="left"
                                />
                                {!readOnly && (
                                    <div className="absolute top-3 right-3 bg-indigo-50 dark:bg-indigo-500/20 p-2 rounded-full text-indigo-600 dark:text-indigo-400 shadow-sm pointer-events-none">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                )}
                            </div>

                            {/* 2. Tu Bolsillo */}
                            <div className="h-full">
                                {(() => {
                                    // Calculate Annual Net Profit (YTD)
                                    // Calculate Annual Net Profit (YTD) - Hybrid (History + Current)
                                    const currentYear = effectiveMonth.split('-')[0];

                                    // 1. Calculate Historical Profit (excluding current view month to avoid double counting if present)
                                    const historicalProfit = formattedTrendData
                                        .filter((month: any) =>
                                            month.month &&
                                            month.month.startsWith(currentYear) &&
                                            month.month !== effectiveMonth
                                        )
                                        .reduce((sum, month) => {
                                            const opProfit = month.revenue - month.expenses;
                                            const tax = opProfit > 0 ? opProfit * (rawData?.irpfPercent || 20) / 100 : 0;
                                            return sum + (opProfit - tax);
                                        }, 0);

                                    // 2. Calculate Current View Month Profit (Live Data)
                                    const currentOpProfit = (revenue || 0) - totalExpenses;
                                    const currentTax = currentOpProfit > 0 ? currentOpProfit * (rawData?.irpfPercent || 20) / 100 : 0;
                                    const currentNetProfit = currentOpProfit - currentTax;

                                    // 3. Total YTD = History + Current
                                    // Only add current profit if the current viewed month belongs to the analyzed year
                                    const annualNetProfit = effectiveMonth.startsWith(currentYear)
                                        ? historicalProfit + currentNetProfit
                                        : historicalProfit;

                                    return (
                                        <TakeHomeProfitWidget
                                            revenue={revenue || 0}
                                            totalExpenses={totalExpenses}
                                            irpfPercent={rawData?.irpfPercent || 20}
                                            trend={trendData.map((d: any) => d.profit || 0)}
                                            annualNetProfit={annualNetProfit} // Passing calculated YTD
                                            onDetailClick={() => setIsWizardOpen(true)}
                                        />
                                    );
                                })()}
                            </div>

                            {/* 3. La Hucha */}
                            <div className="h-full">
                                <TaxVaultWidget
                                    taxes={report?.taxes || {
                                        ivaRepercutido: 0,
                                        ivaSoportado: 0,
                                        ivaAPagar: 0,
                                        irpfPago: 0,
                                        totalReserve: 0,
                                        irpfPercent: 20,
                                        netProfitPostTax: 0,
                                        netProfit: 0,
                                        margin: 0,
                                        vat: { toPay: 0 }
                                    }}
                                    minimal
                                    currentMonth={effectiveMonth}
                                    historicalData={trendData}
                                />
                            </div>

                            {/* 4. Coste por Hora */}
                            <div className="h-full">
                                <HourlyCostWidget
                                    totalCost={totalExpenses}
                                    totalHours={totalHours}
                                    trend={0} // Trend calculation logic moved out or simplified
                                    laborCost={Number(rawData?.salaries || 0)}
                                    otherCosts={totalExpenses - Number(rawData?.salaries || 0)}
                                />
                            </div>
                        </div>

                        {/* ROW 2: DETAILED ANALYSIS & TOOLS */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            {/* Left Column: Historical Evolution */}
                            <div className="lg:col-span-3 h-[280px]">
                                <RevenueAreaChart data={formattedTrendData} />
                            </div>

                            {/* Center Column: Financial Advisor */}
                            <div className="lg:col-span-6 h-[280px]">
                                <FinancialAdvisorWidget
                                    revenue={revenue}
                                    expenses={totalExpenses}
                                    margin={revenue > 0 ? ((revenue - totalExpenses) / revenue) * 100 : 0}
                                    hourlyCost={totalHours > 0 ? totalExpenses / totalHours : 0}
                                    taxReserve={revenue * 0.21}
                                    trend={revenueTrend}
                                />
                            </div>

                            {/* Right Column: Breakdown - Same width as cards above (3 cols) */}
                            <div className="lg:col-span-3 h-fit">
                                <ExpenseBreakdownWidget breakdown={fullExpenseBreakdown} />
                            </div>
                        </div>

                    </div>
                ) : (
                    <FranchiseHistoryView franchiseId={franchiseId || ''} />
                )}

                {isWizardOpen && (
                    <FinancialControlCenter
                        franchiseId={franchiseId || ''}
                        month={effectiveMonth}
                        onClose={() => setIsWizardOpen(false)}
                        onSave={async (data) => {
                            try {
                                await onUpdateFinance(data);
                                setIsWizardOpen(false);
                            } catch (error) {
                                console.error('Error saving financial data:', error);
                            }
                        }}
                        initialData={rawData as any}
                    />
                )}

                <ScenarioSimulator
                    isOpen={isSimulatorOpen}
                    onClose={() => setIsSimulatorOpen(false)}
                    currentData={{
                        ...report,
                        revenue: revenue || (report as any)?.totalIncome || 0,
                        orders: orders || 0,
                        totalExpenses: report?.totalExpenses || 0,
                        // Ensure required props for ScenarioSimulator (it might expect more strict types now)
                        fixed: report?.fixed || { total: 0, salaries: 0, renting: 0, insurance: 0, services: 0, quota: 0, other: 0 },
                        variable: report?.variable || { total: 0, gasoline: 0, repairs: 0, flyderFee: 0, royalty: 0 },
                        netProfit: report?.netProfit || 0,
                        taxes: report?.taxes || { ivaRepercutido: 0, ivaSoportado: 0, ivaAPagar: 0, irpfPago: 0, totalReserve: 0, irpfPercent: 20, netProfitPostTax: 0, netProfit: 0, margin: 0, vat: { toPay: 0 } },
                        metrics: report?.metrics || { avgTicket: 0, costPerOrder: 0, breakEvenOrders: 0, profitMargin: 0, activeRiders: 0, productivity: 0, revenuePerHour: 0, costPerHour: 0, profitPerRider: 0, totalKm: 0, revenuePerKm: 0, costPerKm: 0, dropDensity: 0, safetyMargin: 0, laborRatio: 0, incidentRatio: 0, marketingSpend: 0, incidentCost: 0 },
                        breakdown: report?.breakdown || []
                    }}
                />

                <DrillDownModal
                    isOpen={!!drillDown}
                    onClose={() => setDrillDown(null)}
                    title={drillDown === 'revenue' ? 'Desglose de Ingresos' : 'Desglose de Gastos'}
                    data={drillDown === 'revenue' ? (
                        Object.entries(rawData || {})
                            .filter(([key, val]) => typeof val === 'number' && key !== 'totalHours' && val > 0)
                            .map(([key, val]) => ({
                                label: key,
                                value: `${val} pedidos`,
                                pct: 0,
                                trend: 'up'
                            }))
                    ) : (
                        fullExpenseBreakdown.map((item: any) => ({
                            label: item.label,
                            value: formatMoney(item.amount) + '€',
                            pct: Math.round((item.amount / (totalExpenses || 1)) * 100),
                            trend: 'down'
                        }))
                    )}
                />
            </div>

            {/* Widget Legend Modal */}
            <WidgetLegendModal
                isOpen={isLegendOpen}
                onClose={() => setIsLegendOpen(false)}
            />
            {/* Workflow Guide */}
            <FinancialWorkflowGuide
                isOpen={showGuide}
                onClose={() => setShowGuide(false)}
            />

            {/* Goal Setting Modal */}
            {showGoalModal && (
                <GoalSettingModal
                    currentGoal={monthlyGoal}
                    currentRevenue={revenue || 0}
                    onClose={() => setShowGoalModal(false)}
                    onSave={(newGoal) => setMonthlyGoal(newGoal)}
                    mode={goalModalMode}
                />
            )}
        </div>
    );
};

export default FranchiseDashboardView;
