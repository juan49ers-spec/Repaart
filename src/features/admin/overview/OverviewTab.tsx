import React, { Suspense } from 'react';
import {
    DollarSign,
    Wallet,
    Store,
    Activity,
    TrendingUp,
    AlertTriangle,
    Calendar
} from 'lucide-react';
import BentoCard from '../../../ui/data-display/BentoCard';
import DashboardSkeleton from '../../../ui/layout/DashboardSkeleton';
import EmptyState from '../../../ui/feedback/EmptyState';
import { useAdminDashboardData } from '../../../hooks/useAdminDashboardData';
import { useIntelligence } from '../../../hooks/useIntelligence';
import PendingTasksWidgetSimple from '../dashboard/widgets/PendingTasksWidget';
import SmartInsightsWidget from '../../franchise/finance/SmartInsightsWidget';

// Lazy load heavy charts
const TrendsSection = React.lazy(() => import('../dashboard/TrendsSection'));

interface OverviewTabProps {
    onNavigate: (view: string) => void;
    selectedMonth: string;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ onNavigate, selectedMonth }) => {
    const { stats, trendData, franchises, loading, error } = useAdminDashboardData(selectedMonth);

    // Intelligence Hooks (Health Score)
    const { alerts } = useIntelligence({
        tickets: [],
        users: [],
        dashboardData: stats
    });

    if (loading) return <DashboardSkeleton />;
    if (error) return <EmptyState title="Error de conexión" description={error || 'Unknown error'} icon={AlertTriangle} />;

    const safeStats = stats || { totalRevenue: 0, totalProfit: 0, margin: 0, franchiseCount: 0 };

    // Get top 3 active franchises for display
    const activeFranchises = franchises?.filter(f => f.status === 'active' || f.status === 'warning').slice(0, 3) || [];

    return (
        <div className="space-y-6">
            {/* Header / Welcome (Optional, or handled by Layout) */}

            {/* BENTO GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[minmax(180px,auto)]">

                {/* 1. Facturación (Primary KPI) */}
                <BentoCard
                    title="Facturación Red"
                    subtitle="Mes actual"
                    value={`${safeStats.totalRevenue.toLocaleString()}€`}
                    icon={DollarSign}
                    variant="primary"
                    trend="up"
                    trendValue="+12.5%" // Mocked for design
                    onClick={() => onNavigate('finance')}
                    description="Ingresos brutos agregados de todas las franquicias."
                />

                {/* 2. Beneficio Neto */}
                <BentoCard
                    title="Beneficio Neto"
                    subtitle="Mes actual"
                    value={`${safeStats.totalProfit.toLocaleString()}€`}
                    icon={Wallet}
                    variant="success"
                    trend="up"
                    trendValue={`${safeStats.margin.toFixed(1)}% margen`}
                    onClick={() => onNavigate('finance')}
                />

                {/* 3. Franquicias Activas */}
                <BentoCard
                    title="Red de Franquicias"
                    subtitle="Operativas"
                    value={safeStats.franchiseCount}
                    icon={Store}
                    variant="purple"
                    trend="neutral"
                    trendValue="En funcionamiento"
                    onClick={() => onNavigate('franchises')}
                >
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 space-y-2">
                        {activeFranchises.length > 0 ? activeFranchises.map((f, i) => (
                            <div key={i} className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 px-2 rounded-lg transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); onNavigate('franchises'); }}>
                                <span className="font-medium text-slate-700 dark:text-slate-300">{f.name}</span>
                                <span className={f.status === 'active' ? "text-emerald-500 dark:text-emerald-400" : "text-amber-500 dark:text-amber-400"}>●</span>
                            </div>
                        )) : (
                            <div className="text-center py-2 text-slate-500">No hay franquicias activas</div>
                        )}
                        {franchises && franchises.length > 3 && (
                            <div className="text-center pt-1 text-[10px] text-indigo-400 font-bold">
                                +{franchises.length - 3} más...
                            </div>
                        )}
                    </div>
                </BentoCard>

                {/* 4. Tareas Pendientes (Moved to Top Row for visibility) */}
                <BentoCard
                    colSpan={1}
                    title="Tareas Pendientes"
                    subtitle="Acciones"
                    icon={Calendar}
                    variant="default"
                    onClick={() => onNavigate('tasks')}
                >
                    <div className="mt-3">
                        <PendingTasksWidgetSimple limit={2} compact />
                    </div>
                </BentoCard>

                {/* ROW 2 */}

                {/* 5. Financial Trend (Main Graph) */}
                <BentoCard
                    colSpan={3}
                    rowSpan={2}
                    title="Tendencia Financiera"
                    subtitle="Últimos 6 meses"
                    icon={TrendingUp}
                    className="min-h-[400px]"
                >
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-600" /></div>}>
                        <div className="h-full w-full mt-4">
                            <TrendsSection trendData={trendData || []} />
                        </div>
                    </Suspense>
                </BentoCard>

                {/* 6. Smart Insights (Replaces Quick Actions - Taking Vertical Sidebar Slot) */}
                <BentoCard
                    colSpan={1}
                    rowSpan={2}
                    title="Smart Insights"
                    subtitle="Analista AI"
                    icon={Activity}
                    className="p-0 border-0 bg-transparent overflow-visible"
                >
                    <div className="-m-4 h-[calc(100%+2rem)]">
                        <SmartInsightsWidget
                            mode="admin"
                            stats={stats}
                            trendData={trendData || []}
                            alerts={alerts}
                        />
                    </div>
                </BentoCard>

            </div>
        </div>
    );
};

export default OverviewTab;
