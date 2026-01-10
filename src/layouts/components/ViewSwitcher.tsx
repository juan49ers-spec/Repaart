import { Suspense, lazy, type FC } from 'react';
import { useAuth } from '../../context/AuthContext'; // <--- EL PUENTE MÁGICO
import { DollarSign, Landmark, Gauge, Target } from 'lucide-react';
import { formatMoney } from '../../lib/finance';

// Lazy load heavy components
const DashboardCharts = lazy(() => import('../../features/franchise/dashboard/widgets/DashboardCharts'));
const FinancialAdvisorWidget = lazy(() => import('../../features/franchise/dashboard/widgets/FinancialAdvisorWidget'));

// Layout & UI
import DashboardSkeleton from '../../ui/layout/DashboardSkeleton';
import KPICard from '../../features/franchise/dashboard/widgets/KPICard';
import ErrorBoundary from '../../ui/feedback/ErrorBoundary';

// Components
import AdminDashboard from '../../features/admin/dashboard/AdminDashboard';
import AdminSupportPanel from '../../features/admin/AdminSupportPanel';
import UserManagementPanel from '../../features/admin/users/UserManagementPanel';
import AdminResourcesPanel from '../../features/admin/AdminResourcesPanel';
import SupportHub from '../../features/franchise/SupportHub';
import ResourcesPanel from '../../features/franchise/ResourcesPanel';
import Academy from '../../features/academy/Academy';
import UserProfile from '../../features/user/UserProfile';
import AnnouncementSystem from '../../features/admin/AnnouncementSystem';
// @ts-ignore - Legacy component or simple TSX import
import FranchiseFinancialHistory from '../../features/franchise/finance/FranchiseHistoryView';

import AlertsWidget from '../../features/franchise/dashboard/widgets/AlertsWidget';
import NewsFeedWidget from '../../features/franchise/dashboard/widgets/NewsFeedWidget';
import MonthlyTrendChart from '../../features/franchise/dashboard/widgets/MonthlyTrendChart';
import MonthlyTaxWidget from '../../features/franchise/dashboard/widgets/MonthlyTaxWidget';
import TaxVaultWidget from '../../features/franchise/dashboard/widgets/TaxVaultWidget';
import UpdatePrompt from '../../ui/overlays/UpdatePrompt';
import NetworkStatus from './NetworkStatus';
import TariffEditor from '../../features/admin/finance/TariffEditor';

interface ViewSwitcherProps {
    viewMode: string;
    setViewMode: (mode: string) => void;
    franchiseView?: string;
    isAdmin?: boolean;
    isFranchise?: boolean;
    selectedMonth?: string;
    setSelectedMonth?: (month: string) => void;
    currentData?: any;
    report?: any;
    handleAdminSelectFranchise?: (id: string) => void;
    user?: any;
}

const ViewSwitcher: FC<ViewSwitcherProps> = ({
    viewMode, setViewMode,
    franchiseView,
    isAdmin: propIsAdmin, // Renombramos la prop antigua
    isFranchise,
    selectedMonth, setSelectedMonth,
    report,
    handleAdminSelectFranchise,
    user: propUser
}) => {
    // 🔥 AUTODETERMINACIÓN DE RANGO 🔥
    // Ignoramos lo que diga el componente padre. Preguntamos directamente al AuthContext.
    const { isAdmin: contextIsAdmin, user: contextUser, roleConfig } = useAuth();

    // La Verdad Absoluta
    const realIsAdmin = contextIsAdmin || propIsAdmin || (contextUser?.role === 'admin');
    const currentUser = contextUser || propUser;

    // Determine Franchise ID for History Component
    // If Admin viewing detail -> use selected franchise
    // If Franchisee -> use their own ID (from config or uid)
    const historyFranchiseId = (realIsAdmin && viewMode === 'franchise_detail')
        ? null // Admin logic usually handles ID selection differently, but for simplicity let's say they don't see this view yet or we need a prop
        : (roleConfig?.franchiseId || currentUser?.uid);

    console.log("🕵️‍♂️ VIEW SWITCHER (MODO SEGURO):", {
        viewMode,
        realIsAdmin,
        role: currentUser?.role
    });

    // --- ADMIN VIEWS (Prioridad Total) ---
    if (realIsAdmin) {
        if (viewMode === 'support') return <AdminSupportPanel />;
        if (viewMode === 'users') return <UserManagementPanel />; // <--- AQUÍ DEBERÍAS ENTRAR
        // audit view removed - now handled by protected route in App.jsx (/admin/audit)
        if (viewMode === 'tariffs') return <TariffEditor onClose={() => setViewMode('dashboard')} />;
        if (viewMode === 'resources') return <AdminResourcesPanel />;
        if (viewMode === 'communications') {
            return (
                <div className="p-5 md:p-8 space-y-6">
                    <Suspense fallback={<DashboardSkeleton />}>
                        <AnnouncementSystem />
                    </Suspense>
                </div>
            );
        }
        if (viewMode === 'academy') return <Academy />;

        // Vista por defecto Admin: Dashboard Global
        if (viewMode === 'dashboard' || viewMode === 'franchise_detail') {
            // Si el Admin quiere ver detalles de una franquicia específica, mostramos el dashboard detallado
            if (viewMode === 'franchise_detail') {
                // FALLTHROUGH: Cae hacia abajo al renderizado del Dashboard Franchise (Line 107+)
            } else {
                return (
                    <AdminDashboard
                        onSelectFranchise={handleAdminSelectFranchise!}
                        selectedMonth={selectedMonth}
                        onMonthChange={setSelectedMonth}
                    />
                );
            }
        }
    }

    // --- FRANCHISE / COMMON VIEWS ---
    if (isFranchise && franchiseView === 'support') return <SupportHub />;
    if (isFranchise && franchiseView === 'resources') return <ResourcesPanel />;
    if (isFranchise && franchiseView === 'academy') return <Academy />;

    // 🔥 NUEVA VISTA: HISTORIAL FINANCIERO 🔥
    if (isFranchise && franchiseView === 'history') {
        return (
            <div className="p-4 md:p-8">
                <FranchiseFinancialHistory franchiseId={historyFranchiseId} />
            </div>
        );
    }
    if (viewMode === 'profile') return <UserProfile setViewMode={setViewMode} />;

    // --- MAIN COCKPIT / FRANCHISE DETAIL / ADMIN INSPECTION ---
    // Esta sección se renderiza si:
    // 1. Es una franquicia viendo su dashboard ('cockpit')
    // 2. Es un Admin inspeccionando una franquicia ('franchise_detail')
    if ((isFranchise && franchiseView === 'cockpit') || (realIsAdmin && viewMode === 'franchise_detail')) {
        return (
            <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-fade-in-up">

                {/* 1. TOP ROW: KPI TICKER */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <KPICard
                        title="Ingresos"
                        value={`${formatMoney(report?.revenue || 0)}€`}
                        icon={DollarSign}
                        colorClass="text-blue-500"
                        tooltip="Facturación sin IVA"
                        delta={undefined}
                        deltaPercent={undefined}
                    />
                    <KPICard
                        title="Beneficio Neto"
                        value={`${formatMoney(report?.taxes?.netProfitPostTax || 0)}€`}
                        icon={Landmark}
                        colorClass="text-emerald-500"
                        tooltip="Beneficio real estimado"
                        delta={undefined}
                        deltaPercent={undefined}
                    />
                    <KPICard
                        title="Margen Seguridad"
                        value={`${(report?.metrics?.safetyMargin || 0).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
                        icon={Gauge}
                        colorClass={(report?.metrics?.safetyMargin || 0) > 15 ? 'text-emerald-500' : 'text-amber-500'}
                        tooltip="Colchón ante caídas. Objetivo: >20%"
                    />
                    <KPICard
                        title="Pedidos"
                        value={report?.orders || 0}
                        icon={Target}
                        colorClass="text-indigo-500"
                        tooltip="Volumen mensual"
                        delta={undefined}
                    />
                </div>

                {/* 2. MAIN BENTO GRID */}
                <div className="bento-grid">

                    {/* A. FINANCIAL ADVISOR (HERO SPOT) - Span 4 on Desktop */}
                    <div className="col-span-12 lg:col-span-4 h-full min-h-[280px]">
                        <ErrorBoundary>
                            <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" /></div>}>
                                <FinancialAdvisorWidget
                                    analysisData={report?.analysisData || null}
                                />
                            </Suspense>
                        </ErrorBoundary>
                    </div>

                    {/* B. MAIN CHART (Span 8) */}
                    <div className="col-span-12 lg:col-span-8 h-full min-h-[350px]" >
                        <ErrorBoundary>
                            <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" /></div>}>
                                <DashboardCharts report={report} />
                            </Suspense>
                        </ErrorBoundary>
                    </div>

                    {/* C. MONTHLY TRENDS (Span 6) */}
                    <div className="col-span-12 lg:col-span-6 h-full">
                        <ErrorBoundary>
                            <MonthlyTrendChart last6Months={[]} />
                        </ErrorBoundary>
                    </div>

                    {/* D. TAX VAULT (Span 6) */}
                    <div className="col-span-12 lg:col-span-6 h-full">
                        <ErrorBoundary>
                            <TaxVaultWidget taxes={report?.taxes} />
                        </ErrorBoundary>
                    </div>

                    {/* E. NEWS & ALERTS (Span 4) */}
                    <div className="col-span-12 lg:col-span-4 h-full">
                        <ErrorBoundary>
                            <AlertsWidget report={report} />
                        </ErrorBoundary>
                        <div className="mt-4">
                            <ErrorBoundary>
                                <NewsFeedWidget />
                            </ErrorBoundary>
                        </div>
                    </div>

                    {/* F. COST BREAKDOWN (Span 8) */}
                    <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['fixed', 'variable'].map((type) => {
                            const items = (report?.breakdown || [])
                                .filter((i: any) => i.type === type && i.value > 0)
                                .sort((a: any, b: any) => b.value - a.value);

                            if (items.length === 0) return null;
                            const totalTypeExpenses = items.reduce((sum: number, item: any) => sum + item.value, 0);

                            return (
                                <div key={type} className="glass-panel-exec p-5 rounded-2xl">
                                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center ${type === 'fixed' ? 'text-blue-400' : 'text-rose-400'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${type === 'fixed' ? 'bg-blue-400' : 'bg-rose-400'}`} />
                                        Costes {type === 'fixed' ? 'Estructurales' : 'Operativos'}
                                    </h3>
                                    <div className="space-y-4">
                                        {items.slice(0, 5).map((item: any, idx: number) => {
                                            const relativePercent = totalTypeExpenses > 0 ? (item.value / totalTypeExpenses) * 100 : 0;
                                            return (
                                                <div key={idx} className="group">
                                                    <div className="flex justify-between items-end mb-1">
                                                        <span className="text-sm font-medium text-slate-400 truncate pr-4">{item.name}</span>
                                                        <span className="text-sm font-mono font-bold text-slate-200">{formatMoney(item.value)}€</span>
                                                    </div>
                                                    <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all duration-1000 ${type === 'fixed' ? 'bg-blue-500' : 'bg-rose-500'}`} style={{ width: `${relativePercent}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ErrorBoundary>
                        <MonthlyTaxWidget taxes={report?.taxes} />
                    </ErrorBoundary>
                </div>

                <UpdatePrompt />
                <NetworkStatus />

                {/* Footer simple */}
                <div className="flex justify-center pt-8 pb-4">
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Antigravity Financial OS v3.2</p>
                </div>
            </div>
        );
    }

    return null;
};

export default ViewSwitcher;
