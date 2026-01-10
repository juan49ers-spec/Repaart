import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PlayCircle, FileText, HelpCircle, Sparkles, ChevronLeft, ChevronRight, Lock, TrendingUp } from 'lucide-react';

// Components
import DashboardSkeleton from '../../ui/layout/DashboardSkeleton';
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

import WidgetLegendModal from './dashboard/WidgetLegendModal';
import FinancialWorkflowGuide from './components/FinancialWorkflowGuide';
import WeatherWidget from './dashboard/widgets/WeatherWidget';
// import SimulatorWidgetAdvanced from './dashboard/widgets/SimulatorWidgetAdvanced'; // Keep for future use if needed, but commented out for linting

import { formatMoney } from '../../lib/finance';
import { AuthUser } from '../../context/AuthContext';
import { useFranchiseFinance } from '../../hooks/useFranchiseFinance';

// TYPE DEFINITIONS
interface DashboardContextType {
    user: AuthUser | null;
    franchiseId?: string;
    selectedMonth: string;
    handleUpdate?: () => Promise<void>;
    setSelectedMonth: (month: string) => void;
}

// PROPS for Admin usage (Optional)
interface FranchiseDashboardProps {
    franchiseId?: string;
    readOnly?: boolean;
}

const FranchiseDashboard: React.FC<FranchiseDashboardProps> = ({ franchiseId: propId, readOnly = false }) => {
    // Try to get context, but don't fail if it's missing (Admin usage)
    const context = useOutletContext<DashboardContextType | null>();

    // If no props and no context, we are lost
    if (!propId && !context) return <DashboardSkeleton />;

    // Derive values
    const selectedMonth = context?.selectedMonth || new Date().toISOString().slice(0, 7);
    const user = context?.user || null;
    const activeFranchiseId = propId || context?.franchiseId || user?.uid;

    // Helper for Admin Date Switch
    const [localMonth, setLocalMonth] = useState(selectedMonth);
    const effectiveMonth = propId ? localMonth : selectedMonth;
    const effectiveSetMonth = propId ? setLocalMonth : (context?.setSelectedMonth || (() => { }));

    // --- UNIFIED FINANCE HOOK ---
    const {
        accounting,
        rawData,
        trendData,
        loading,
        updateFinance
    } = useFranchiseFinance({
        franchiseId: activeFranchiseId,
        month: effectiveMonth
    });



    // RE-CALL HOOK with effective values (React Rules of Hooks technically allows this if dependencies are stable)
    // To be safe, let's just use the effective values in the FIRST hook call above
    // I will replace the hook call block in the full replace. Use the code below.

    const { report, revenue, orders } = accounting;
    const handleUpdate = updateFinance;

    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
    const [isHistoryView, setIsHistoryView] = useState(false);
    const [drillDown, setDrillDown] = useState<string | null>(null);
    const [isLegendOpen, setIsLegendOpen] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

    if (loading) return <DashboardSkeleton />;

    // --- METRICS CALCULATION ---
    const totalExpenses = report?.totalExpenses || 0;



    // Cost Per Hour
    const totalHours = Number(rawData?.totalHours || 0);
    const costPerHour = totalHours > 0 ? totalExpenses / totalHours : 0;

    // Trends (Mocked for now depending on API, or calculated from trendData)
    // Assuming trendData has previous month
    const previousMonthData = trendData.length > 1 ? trendData[trendData.length - 2] : null;
    const revenueTrend = previousMonthData ? ((revenue - previousMonthData.revenue) / previousMonthData.revenue) * 100 : 0;

    // Expense Breakdown Preparation
    // Ensure Royalty is present (Max Strategy: Use biggest of Report vs Storage vs 5% Fallback)
    let breakdownList = [...(report?.breakdown || [])];

    // 1. Find existing Royalty item
    const royaltyIndex = breakdownList.findIndex(i => i.name.includes('Royalty'));

    // 2. Calculate the robust value (Never be less than 5% if revenue exists)
    const storedRoyalty = Number(rawData?.breakdown?.['Royalty'] || rawData?.breakdown?.['Royalty Flyder'] || 0);
    const fallbackRoyalty = (revenue || 0) * 0.05;
    const currentReportRoyalty = breakdownList[royaltyIndex]?.value || 0;

    const finalRoyaltyValue = Math.max(currentReportRoyalty, storedRoyalty, fallbackRoyalty);

    if (royaltyIndex >= 0) {
        // Update existing item with robust value
        breakdownList[royaltyIndex] = { ...breakdownList[royaltyIndex], value: finalRoyaltyValue };
    } else if (finalRoyaltyValue > 0) {
        // Add if missing
        breakdownList.push({ name: 'Royalty Flyder', value: finalRoyaltyValue, type: 'variable' });
    }



    const fullExpenseBreakdown = breakdownList
        .filter(item => item.value > 0) // Only show actual expenses
        .sort((a, b) => b.value - a.value) // Sort highest first
        .map((item, index) => ({
            label: item.name,
            amount: item.value,
            // Assign premium palette colors cyclically
            color: ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'][index % 8]
        }));



    // Historical Chart Data
    // Historical Chart Data
    const formattedTrendData = trendData.map((d: any) => ({
        month: d.name || d.monthName || d.month || 'Mes',
        revenue: d.revenue || d.income || 0,
        expenses: d.expenses || d.totalExpenses || 0
    }));

    return (
        <div className="min-h-screen bg-[#fafbfc] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-900/30 transition-colors duration-300">
            <div className="max-w-[1600px] mx-auto p-6 md:p-10 space-y-8">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-2">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm">
                            <button
                                onClick={() => {
                                    const date = new Date(effectiveMonth + '-01');
                                    date.setMonth(date.getMonth() - 1);
                                    effectiveSetMonth(date.toISOString().slice(0, 7));
                                }}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
                                title="Mes Anterior"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight px-6 min-w-[200px] text-center uppercase tabular-nums">
                                {new Date(effectiveMonth + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                            </h2>
                            <button
                                onClick={() => {
                                    const date = new Date(effectiveMonth + '-01');
                                    date.setMonth(date.getMonth() + 1);
                                    effectiveSetMonth(date.toISOString().slice(0, 7));
                                }}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
                                title="Mes Siguiente"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>


                    <div className="flex items-center gap-3">
                        <WeatherWidget franchiseId={propId || context?.franchiseId} />
                        {/* Help Button */}
                        <button
                            onClick={() => setIsLegendOpen(true)}
                            className="group bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-900 hover:border-indigo-400 dark:hover:border-indigo-700 text-indigo-600 dark:text-indigo-400 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center gap-2"
                            title="Guía de Widgets"
                        >
                            <HelpCircle className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            <span className="hidden sm:inline">Ayuda</span>
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

                        {/* Simulator Trigger - Striking Amber Style */}
                        <button
                            onClick={() => setIsSimulatorOpen(true)}
                            className="relative group overflow-hidden bg-amber-500 hover:bg-amber-600 text-white px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:-translate-y-0.5 flex items-center gap-2 border border-amber-400/50"
                        >
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                            <PlayCircle className="w-4 h-4 text-amber-100 group-hover:rotate-12 transition-transform" />
                            <span>Simular</span>
                        </button>

                        <button
                            onClick={() => setIsHistoryView(!isHistoryView)}
                            className={`text-xs font-bold uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all shadow-sm ${isHistoryView
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
                                className={`px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm hover:shadow-md border ${rawData?.is_locked || rawData?.status === 'submitted' || rawData?.status === 'approved' || rawData?.status === 'locked'
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
                    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">

                        {/* ROW 1: CORE METRICS & WEALTH */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* 1. Ingresos */}
                            <KPICard
                                title="Ingresos"
                                value={formatMoney(revenue || 0) + '€'}
                                trend={Number(revenueTrend.toFixed(1))}
                                trendData={trendData.map((d: any) => d.revenue)}
                                icon={<TrendingUp />}
                                color="blue"
                                subtext={`${orders} pedidos`}
                                monthlyGoal={16000} // Objetivo mensual mock
                                lastYearValue={revenue > 0 ? revenue * 0.85 : undefined} // Mock: -15% YoY
                                showPrediction={true}
                            />

                            {/* 2. Tu Bolsillo (Replaces Gastos Totales) */}
                            <div className="h-full">
                                <TakeHomeProfitWidget
                                    revenue={revenue || 0}
                                    totalExpenses={totalExpenses}
                                    irpfPercent={rawData?.expenses?.irpfPercent || 20}
                                    trend={trendData.map((d: any) => d.profit || 0)}
                                />
                            </div>

                            {/* 3. La Hucha (Replaces Beneficio Neto) */}
                            <div className="h-full">
                                <TaxVaultWidget
                                    taxes={report?.taxes || {
                                        ivaRepercutido: 0,
                                        ivaSoportado: 0,
                                        ivaAPagar: 0,
                                        irpfPago: 0,
                                        totalReserve: 0
                                    }}
                                    minimal
                                />
                            </div>

                            {/* 4. Coste por Hora (Detailed) */}
                            <div className="h-full">
                                <HourlyCostWidget
                                    totalCost={totalExpenses}
                                    totalHours={totalHours}
                                    trend={previousMonthData ?
                                        ((costPerHour - (previousMonthData.totalExpenses / (previousMonthData.totalHours || 160))) /
                                            (previousMonthData.totalExpenses / (previousMonthData.totalHours || 160))) * 100
                                        : 0}
                                    laborCost={Number(rawData?.breakdown?.['Nóminas'] || rawData?.breakdown?.['Personal'] || 0)}
                                    otherCosts={totalExpenses - Number(rawData?.breakdown?.['Nóminas'] || rawData?.breakdown?.['Personal'] || 0)}
                                />
                            </div>
                        </div>

                        {/* ROW 2: DETAILED ANALYSIS & TOOLS */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Left Column: Historical Evolution */}
                            <div className="lg:col-span-8 h-[300px]">
                                <RevenueAreaChart data={formattedTrendData} />
                            </div>

                            {/* Right Column: Breakdown + Simulator (Stacked) */}
                            <div className="lg:col-span-4 flex flex-col gap-6">
                                {/* Expense Donut */}
                                <div className="h-[350px] w-full">
                                    <ExpenseBreakdownWidget breakdown={fullExpenseBreakdown} />
                                </div>

                            </div>

                        </div>

                    </div>
                ) : (
                    <FranchiseHistoryView franchiseId={activeFranchiseId || ''} />
                )}

                {isWizardOpen && (
                    <FinancialControlCenter
                        franchiseId={activeFranchiseId || ''}
                        month={selectedMonth}
                        onClose={() => setIsWizardOpen(false)}
                        onSave={async (data) => {
                            try {
                                await handleUpdate(data);
                                setIsWizardOpen(false);
                            } catch (error) {
                                console.error('Error saving financial data:', error);
                            }
                        }}
                        initialData={rawData}
                    />
                )}

                <ScenarioSimulator
                    isOpen={isSimulatorOpen}
                    onClose={() => setIsSimulatorOpen(false)}
                    currentData={{
                        ...report,
                        revenue: revenue || (report as any)?.totalIncome || 0,
                        orders: orders || 0,
                        totalExpenses: report?.totalExpenses || 0
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
        </div>
    );
};

export default FranchiseDashboard;
