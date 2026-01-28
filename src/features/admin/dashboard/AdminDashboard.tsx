import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import DevToolsPanel from '../../../layouts/components/dev/DevToolsPanel';
import {
    LogOut
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import FranchiseOnboarding from '../FranchiseOnboarding';
import CreateFranchiseModal from '../CreateFranchiseModal';
import { useAdminDashboardData } from '../../../hooks/useAdminDashboardData';
import { useAuth } from '../../../context/AuthContext';

// Components (Eager)
import DashboardSkeleton from '../../../components/ui/layout/DashboardSkeleton';
import ErrorBoundary from '../../../components/ui/feedback/ErrorBoundary';
import CommandPalette from '../../../components/ui/navigation/CommandPalette';
import PremiumDock from './components/PremiumDock';

// Lazy Components
const OperationsDashboard = React.lazy(() => import('../../operations/OperationsDashboard'));
const FleetManager = React.lazy(() => import('../../operations/FleetManager'));
const ShiftPlanner = React.lazy(() => import('../../operations/ShiftPlanner'));
const FranchiseProfile = React.lazy(() => import('../settings/FranchiseProfile'));
const AdminFinanceInbox = React.lazy(() => import('./AdminFinanceInbox'));
const UserManagementPanel = React.lazy(() => import('../users/UserManagementPanel'));
const KanbanBoard = React.lazy(() => import('../kanban/KanbanBoard')); // v2
const AdminNetworkDashboard = React.lazy(() => import('../finance/AdminNetworkDashboard'));
const OverviewTab = React.lazy(() => import('../overview/OverviewTab'));
const SystemReset = React.lazy(() => import('../components/SystemReset'));
const AuditPanel = React.lazy(() => import('../AuditPanel'));
const DashboardGuideModal = React.lazy(() => import('./components/DashboardGuideModal'));

interface AdminDashboardProps {
    onSelectFranchise?: (id: string) => void;
    selectedMonth?: string; // Format YYYY-MM
    onMonthChange?: (month: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
    onSelectFranchise: _onSelectFranchise,
    selectedMonth,
    onMonthChange: _onMonthChange
}) => {
    const { logout } = useAuth();
    const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

    // URL Persistence
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('view') || 'global';

    const setActiveTab = (tabId: string) => {
        setSearchParams({ view: tabId }, { replace: true });
    };

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    // Hooks
    const { refresh } = useAdminDashboardData(selectedMonth || '');

    // Local View State
    const [view, setView] = useState<'grid' | 'onboarding'>('grid');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // ONBOARDING RENDERER
    if (view === 'onboarding') {
        return (
            <div className="p-6">
                <button
                    onClick={() => setView('grid')}
                    className="mb-4 text-xs font-bold text-slate-500 hover:text-ruby-600 flex items-center gap-2 transition-colors uppercase tracking-widest"
                >
                    ← return.to.base
                </button>
                <div className="max-w-4xl mx-auto">
                    <FranchiseOnboarding
                        onCancel={() => setView('grid')}
                        onComplete={(_name) => {
                            setView('grid');
                        }}
                    />
                </div>
            </div>
        );
    }

    // Main Render Switch
    const renderActiveTabContent = () => {
        switch (activeTab) {
            case 'global': return (
                <Suspense fallback={<DashboardSkeleton />}>
                    <OverviewTab onNavigate={setActiveTab} selectedMonth={selectedMonth || ''} />
                </Suspense>
            );
            case 'finance': return <AdminNetworkDashboard selectedMonth={selectedMonth || ''} />;
            case 'operations': return <OperationsDashboard readOnly={true} />;
            case 'fleet': return <FleetManager />;
            case 'shifts': return <ShiftPlanner />;
            case 'onboarding': return (
                <FranchiseOnboarding
                    onCancel={() => setActiveTab('global')}
                    onComplete={() => setActiveTab('global')}
                />
            );
            case 'profile': return <FranchiseProfile />;
            case 'inbox': return <AdminFinanceInbox />;
            case 'users': return <UserManagementPanel />;
            case 'kanban': return <KanbanBoard />;
            case 'reset': return <SystemReset />;
            case 'audit': return <AuditPanel />;
            default: return <OverviewTab onNavigate={setActiveTab} selectedMonth={selectedMonth || ''} />;
        }
    };

    return (
        <div className="w-full font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
            <CommandPalette />

            {/* MAIN COCKPIT VIEW */}
            <div className="relative z-10 mx-auto max-w-[1700px] px-4 md:px-8 py-0">
                {/* PREMIUM FLOATING DOCK */}
                {activeTab !== 'kanban' && (
                    <PremiumDock 
                        activeTab={activeTab}
                        onGuideOpen={() => setIsGuideOpen(true)}
                        onAuditClick={() => setActiveTab('audit')}
                    />
                )}

                {/* DYNAMIC CONTENT AREA */}
                <div className={cn(
                    "transition-all duration-700 ease-in-out",
                    activeTab === 'kanban' ? 'w-full p-0' : 'relative z-10'
                )}>
                    <DevToolsPanel
                        isOpen={isDevToolsOpen}
                        onClose={() => setIsDevToolsOpen(false)}
                        onOpenReset={() => setActiveTab('reset')}
                    />

                    <ErrorBoundary>
                        <Suspense fallback={<DashboardSkeleton />}>
                            {renderActiveTabContent()}
                        </Suspense>
                    </ErrorBoundary>
                </div>
            </div>

            {/* MODALS - Premium Overlay */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 dark:bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="glass-premium-v2 rounded-[2.5rem] w-full max-w-sm shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300">
                        <div className="relative w-20 h-20 mx-auto mb-8">
                            <div className="absolute inset-0 bg-ruby-600/10 rounded-full animate-spin animate-pulse">
                                <div className="w-8 h-8 rounded-full border-2 border-ruby-500/50 flex items-center justify-center">
                                    <LogOut className="w-5 h-5 text-white" strokeWidth={2.5} />
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-ruby-600/20 via-ruby-500/5 to-transparent opacity-30 animate-spin" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase italic tracking-tight">TERMINATE <span className="text-ruby-600">SESSION</span></h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">¿Cerrar sesión del sistema?</p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => { setShowLogoutConfirm(false); logout(); }}
                                className="w-full py-4 rounded-2xl bg-ruby-600 hover:bg-ruby-700 text-white font-black uppercase tracking-widest transition-all duration-300 active:scale-95 shadow-lg shadow-ruby-500/50 hover:shadow-ruby-600/70"
                            >
                                CONFIRMAR Y SALIR
                            </button>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="w-full py-4 rounded-2xl bg-transparent hover:bg-white/10 dark:hover:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-400 font-medium transition-all duration-300 active:scale-95"
                            >
                                CANCELAR
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <CreateFranchiseModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    refresh();
                }}
            />

            <Suspense fallback={null}>
                <DashboardGuideModal
                    isOpen={isGuideOpen}
                    onClose={() => setIsGuideOpen(false)}
                />
            </Suspense>
        </div>
    );
};

export default React.memo(AdminDashboard);
