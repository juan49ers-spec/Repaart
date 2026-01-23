import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import DevToolsPanel from '../../../layouts/components/dev/DevToolsPanel';
import {
    LogOut,
    ShieldCheck
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
import ThemeToggle from '../../../components/ui/buttons/ThemeToggle';

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

                {/* GLOBAL ACTION CONTROL - Subtle Integrated Dock */}
                {activeTab !== 'kanban' && (
                    <div className="flex justify-end items-center gap-3 mb-2 sticky top-20 z-20">
                        <div className="flex items-center gap-1 p-1 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/5 shadow-xl glass-premium">
                            <button
                                onClick={() => setIsGuideOpen(true)}
                                className="px-4 py-2 hover:bg-white/60 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                            >
                                Guía
                            </button>
                            <button
                                onClick={() => setActiveTab('audit')}
                                className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
                            >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Auditoría
                            </button>
                            <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />
                            <ThemeToggle />
                        </div>
                    </div>
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

            {/* MODALS - Minimalist Translucent Overlay */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="glass-premium rounded-[2.5rem] w-full max-w-sm shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-ruby-600/10 text-ruby-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-ruby-600/20">
                            <LogOut className="w-8 h-8" strokeWidth={3} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase italic tracking-tight">TERMINATE <span className="text-ruby-600">SESSION</span></h3>
                        <p className="text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em] mb-8">Confirm system logout protocol?</p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => { setShowLogoutConfirm(false); logout(); }}
                                className="ruby-button w-full mechanical-press"
                            >
                                YES, DISCONNECT
                            </button>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors mechanical-press"
                            >
                                CANCEL PROTOCOL
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
