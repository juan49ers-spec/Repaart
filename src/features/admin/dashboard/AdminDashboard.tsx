import React, { useState, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DevToolsPanel from '../../../layouts/components/dev/DevToolsPanel';
import {
    Search,
    Plus,
    LogOut
} from 'lucide-react';
import FranchiseOnboarding from '../FranchiseOnboarding';
import CreateFranchiseModal from '../CreateFranchiseModal';
import { useAdminDashboardData } from '../../../hooks/useAdminDashboardData';
import { useAuth } from '../../../context/AuthContext';

// Components (Eager)
import DashboardSkeleton from '../../../ui/layout/DashboardSkeleton';
import ErrorBoundary from '../../../ui/feedback/ErrorBoundary';
import CommandPalette from '../../../ui/navigation/CommandPalette';
import ThemeToggle from '../../../ui/buttons/ThemeToggle';

// Lazy Components
const OperationsDashboard = React.lazy(() => import('../../operations/OperationsDashboard'));
const FleetManager = React.lazy(() => import('../../operations/FleetManager'));
const ShiftPlanner = React.lazy(() => import('../../operations/ShiftPlanner'));
// const FranchiseOnboarding = React.lazy(() => import('../FranchiseOnboarding')); // Removed due to eager import
const FranchiseGrid = React.lazy(() => import('./FranchiseGrid'));
const FranchiseProfile = React.lazy(() => import('../settings/FranchiseProfile'));
const AdminFinanceInbox = React.lazy(() => import('./AdminFinanceInbox'));
const UserManagementPanel = React.lazy(() => import('../users/UserManagementPanel'));
const KanbanBoard = React.lazy(() => import('../kanban/KanbanBoard')); // v2
const AdminNetworkDashboard = React.lazy(() => import('../finance/AdminNetworkDashboard'));
const OverviewTab = React.lazy(() => import('../overview/OverviewTab'));

interface AdminDashboardProps {
    onSelectFranchise?: (id: string) => void;
    selectedMonth?: string; // Format YYYY-MM
    onMonthChange?: (month: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
    onSelectFranchise,
    selectedMonth,
    // onMonthChange is unused in local scope but part of props
    onMonthChange: _onMonthChange
}) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

    // URL Persistence
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('view') || 'global';

    const setActiveTab = (tabId: string) => {
        setSearchParams({ view: tabId }, { replace: true });
    };

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Hooks
    const { franchises, loading, refresh } = useAdminDashboardData(selectedMonth || '');

    // Local View State
    const [view, setView] = useState<'grid' | 'onboarding'>('grid');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // ONBOARDING RENDERER
    if (view === 'onboarding') {
        return (
            <div className="p-6">
                <button
                    onClick={() => setView('grid')}
                    className="mb-4 text-sm text-slate-500 hover:text-slate-200 flex items-center gap-2 transition-colors"
                >
                    ← Volver al Dashboard
                </button>
                <div className="max-w-4xl mx-auto">
                    <FranchiseOnboarding
                        onCancel={() => setView('grid')}
                        onComplete={(_name) => {
                            // alert(`Franquicia ${name} creada!`); // Optional feedback
                            setView('grid');
                        }}
                    />
                </div>
            </div>
        );
    }

    const handleFranchiseClick = (id: string) => {
        navigate(`/admin/franchise/${id}`);
        if (onSelectFranchise) onSelectFranchise(id);
    };

    // --- RENDERERS ---

    const renderGlobalView = () => {
        return (
            <div className="animate-in fade-in duration-500 relative">
                {/* DEVELOPER TOOLS BUTTON - DISCRETE */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsDevToolsOpen(true)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm dark:shadow-none"
                        title="Herramientas de desarrollo y diagnóstico"
                    >
                        <span className="text-sm">🛠️</span>
                        <span>Dev Tools</span>
                    </button>
                    <ThemeToggle />
                </div>

                <DevToolsPanel isOpen={isDevToolsOpen} onClose={() => setIsDevToolsOpen(false)} />

                <OverviewTab
                    onNavigate={setActiveTab}
                    selectedMonth={selectedMonth || ''}
                />
            </div>
        );
    };

    const renderFranchiseList = () => {
        if (loading) return <DashboardSkeleton />;
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Directorio de Franquicias</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestión y acceso rápido a sedes activas.</p>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        Nueva Franquicia
                    </button>
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Buscar sede..."
                            className="w-64 pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                        />
                        <div className="absolute right-3 top-2.5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                            <Search className="w-5 h-5" />
                        </div>
                    </div>
                </div>
                <Suspense fallback={<DashboardSkeleton />}>
                    <FranchiseGrid franchises={franchises || []} onSelect={handleFranchiseClick} />
                </Suspense>
            </div>
        );
    };

    // Main Render Switch
    const renderActiveTabContent = () => {
        switch (activeTab) {
            case 'global': return renderGlobalView();
            case 'franchises': return renderFranchiseList();
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
            default: return renderGlobalView();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
            <CommandPalette />

            {/* MAIN CONTENT WRAPPER WITH ERROR BOUNDARY & SUSPENSE */}
            <div className={`
                mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500
                ${activeTab === 'kanban' ? 'w-full p-0' : 'max-w-[1600px] p-6 md:p-8'}
            `}>
                <ErrorBoundary>
                    <Suspense fallback={<DashboardSkeleton />}>
                        {renderActiveTabContent()}
                    </Suspense>
                </ErrorBoundary>
            </div>

            {/* MODALS */}


            {/* LOGOUT CONFIRMATION (Inline for portability) */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center transition-colors">
                        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <LogOut className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">¿Cerrar Sesión?</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">¿Estás seguro de que quieres salir del sistema?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => { setShowLogoutConfirm(false); logout(); }}
                                className="flex-1 px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-500 transition-colors shadow-lg shadow-rose-900/20"
                            >
                                Sí, salir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Renderizado Condicional del Modal */}
            <CreateFranchiseModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    console.log("Franquicia creada exitosamente. Actualizando lista...");
                    refresh();
                }}
            />
        </div>
    );
};

export default React.memo(AdminDashboard);
