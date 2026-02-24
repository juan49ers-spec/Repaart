import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ArrowLeft, Bike, CalendarDays, Wallet, Users, LucideIcon, LogIn, FileText, Power } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { franchiseService } from '../../services/franchiseService';
import { isOk } from '../../types/result';
import { useInvoicingModule } from '../../hooks/useInvoicingModule';
import MonthlyHistoryTable from '../franchise/finance/MonthlyHistoryTable';
import UserManagementPanel from './users/UserManagementPanel';

// Lazy load heavy components
const DeliveryScheduler = lazy(() => import('../scheduler/DeliveryScheduler'));
const FleetManager = lazy(() => import('../operations/FleetManager'));
const FinanceHub = lazy(() => import('../finance/FinanceHub').then(module => ({ default: module.FinanceHub })));


// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface AdminFranchiseViewProps {
    franchiseId?: string;
    onBack?: () => void;
}

interface FranchiseData {
    id?: string;
    name?: string;
    status?: 'active' | 'inactive' | 'unknown';
    [key: string]: unknown;
}

type TabId = 'dashboard' | 'operations' | 'team' | 'fleet' | 'academy' | 'finance' | 'settings' | 'kanban';

interface TabConfig {
    id: TabId;
    label: string;
    icon: LucideIcon;
}

// =====================================================
// COMPONENT
// =====================================================

const AdminFranchiseView: React.FC<AdminFranchiseViewProps> = ({ franchiseId: propId, onBack: propOnBack }) => {
    const { franchiseId: paramId } = useParams<{ franchiseId: string }>();
    const navigate = useNavigate();

    const { startImpersonation } = useAuth();
    const { toggleModule, getModuleStatus } = useInvoicingModule();
    const franchiseId = propId || paramId;
    const onBack = propOnBack || (() => navigate('/dashboard'));

    // Default to finance
    const [activeTab, setActiveTab] = useState<TabId>('finance');
    const [franchiseData, setFranchiseData] = useState<FranchiseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [invoicingEnabled, setInvoicingEnabled] = useState(false);
    const [togglingInvoicing, setTogglingInvoicing] = useState(false);

    // Simplified Tabs
    const TABS: TabConfig[] = [
        { id: 'finance', label: 'Finanzas', icon: Wallet },
        { id: 'operations', label: 'Horarios', icon: CalendarDays },
        { id: 'team', label: 'Riders', icon: Users },
        { id: 'fleet', label: 'Flota', icon: Bike },
    ];

    // FETCH REAL FRANCHISE DATA
    useEffect(() => {
        if (!franchiseId) return;

        const fetchFranchiseDetails = async () => {
            try {
                setLoading(true);
                const result = await franchiseService.getFranchiseMeta(franchiseId);

                if (isOk(result)) {
                    setFranchiseData({
                        id: result.data.id,
                        name: result.data.name,
                        status: (result.data as any).status || 'active'
                    } as FranchiseData);

                    // Fetch invoicing module status
                    const invoicingStatus = await getModuleStatus(franchiseId);
                    setInvoicingEnabled(invoicingStatus.enabled);
                } else {
                    console.warn("Franquicia no encontrada en BD, usando ID visual");
                    setFranchiseData({ name: `Franquicia: ${franchiseId}`, status: 'unknown' });
                }
            } catch (error) {
                console.error("Error cargando franquicia:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFranchiseDetails();
    }, [franchiseId, getModuleStatus]);

    const handleToggleInvoicing = async () => {
        if (!franchiseId) return;
        try {
            setTogglingInvoicing(true);
            const newState = !invoicingEnabled;
            console.log('[AdminFranchiseView] Toggling invoicing:', {
                franchiseId,
                currentState: invoicingEnabled,
                newState
            });
            await toggleModule(franchiseId, newState);
            setInvoicingEnabled(newState);
            console.log('[AdminFranchiseView] Invoicing toggled successfully:', newState);
        } catch (error) {
            console.error('Error toggling invoicing module:', error);
        } finally {
            setTogglingInvoicing(false);
        }
    };

    if (!franchiseId) return null;

    return (
        <div className="min-h-screen bg-slate-50 relative animate-in fade-in zoom-in-95 duration-300">
            {/* Header - Clean Apple Style */}
            <div className="bg-white/95 backdrop-blur-xl border-b border-slate-200/80 text-slate-900 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    {/* Left: Back + Title */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                            title="Volver"
                        >
                            <ArrowLeft size={18} className="text-slate-500" />
                        </button>

                        <div className="flex flex-col">
                            <span className="text-[8px] uppercase tracking-widest text-indigo-400 font-medium">Supervisor</span>
                            <h1 className="text-sm font-medium text-slate-700 tracking-tight">
                                {loading ? (
                                    <span className="animate-pulse bg-slate-200 h-4 w-32 rounded inline-block" />
                                ) : (
                                    franchiseData?.name || 'Franquicia'
                                )}
                            </h1>
                        </div>

                        <button
                            onClick={() => {
                                if (franchiseId) {
                                    startImpersonation(franchiseId);
                                    navigate('/dashboard');
                                }
                            }}
                            className="ml-2 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-medium transition-all"
                            title="Entrar como franquicia"
                        >
                            <LogIn size={12} />
                            <span>Entrar</span>
                        </button>

                        <button
                            onClick={handleToggleInvoicing}
                            disabled={togglingInvoicing}
                            className={`ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                invoicingEnabled
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                            } ${togglingInvoicing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={invoicingEnabled ? 'Desactivar módulo de facturación' : 'Activar módulo de facturación'}
                        >
                            <FileText size={12} />
                            <Power size={12} className={invoicingEnabled ? 'text-emerald-600' : 'text-slate-400'} />
                            <span className="hidden sm:inline">{invoicingEnabled ? 'Facturación ON' : 'Facturación OFF'}</span>
                        </button>
                    </div>

                    {/* Right: Tabs */}
                    <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl">
                        {TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <Icon size={14} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">

                {/* 1. FINANZAS: KPIs + History */}
                {activeTab === 'finance' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* KPI SECTION */}
                        <Suspense fallback={<div className="h-64 bg-white/50 rounded-xl animate-pulse" />}>
                            {/* FinanceHub handles context. If it needs franchiseId override, we need to add it. */}
                            {/* Assuming FinanceHub uses useFranchiseFinance which uses dataHookFranchiseId or params? */}
                            {/* FinanceHub uses useAuth -> user.franchiseId. */}
                            {/* AdminFranchiseView provides IMPERSONATION context? No, it's just a view. */}
                            {/* We need to IMPERSONATE or pass ID to FinanceHub. */}
                            <FinanceHub />
                        </Suspense>

                        {/* HISTORY SECTION */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <Wallet className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Histórico de Cierres</h2>
                                    <p className="text-sm text-slate-500">Registro mensual de estados financieros.</p>
                                </div>
                            </div>
                            <MonthlyHistoryTable franchiseId={franchiseData?.id || franchiseId} />
                        </div>
                    </div>
                )}

                {activeTab === 'operations' && (
                    <div className="h-[calc(100vh-180px)] min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Suspense fallback={<div className="h-full w-full flex items-center justify-center bg-white/50 rounded-2xl animate-pulse"><div className="text-slate-400 font-medium">Cargando planificador...</div></div>}>
                            <div className="h-full w-full bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden flex flex-col">
                                <DeliveryScheduler franchiseId={franchiseData?.id || franchiseId} selectedDate={new Date()} readOnly={true} />
                            </div>
                        </Suspense>
                    </div>
                )}

                {/* 3. TEAM: Riders */}
                {activeTab === 'team' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                <Users className="w-6 h-6 text-indigo-600" />
                                Equipo de Riders
                            </h2>
                            <p className="text-slate-500">Gestión de personal asociado a la franquicia.</p>
                        </div>
                        <UserManagementPanel franchiseId={franchiseData?.id || franchiseId} readOnly={true} />
                    </div>
                )}

                {/* 4. FLEET: Motos */}
                {activeTab === 'fleet' && (
                    <Suspense fallback={<div className="p-8 text-center text-slate-400">Cargando flota...</div>}>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                <Bike className="w-6 h-6 text-indigo-600" />
                                Flota
                            </h2>
                            <p className="text-slate-500">Estado de vehículos y asignaciones.</p>
                        </div>
                        <FleetManager franchiseId={franchiseData?.id || franchiseId} readOnly={true} />
                    </Suspense>
                )}
            </div>
        </div>
    );
};

export default AdminFranchiseView;
