import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ArrowLeft, Bike, CalendarDays, Wallet, Users, LucideIcon } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { franchiseService } from '../../services/franchiseService';
import { isOk } from '../../types/result';
import MonthlyHistoryTable from '../franchise/finance/MonthlyHistoryTable';
import UserManagementPanel from './users/UserManagementPanel';

// Lazy load heavy components
const WeeklyScheduler = lazy(() => import('../operations/WeeklyScheduler'));
const FleetManager = lazy(() => import('../operations/FleetManager'));
const FranchiseDashboard = lazy(() => import('../franchise/FranchiseDashboard'));


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

    const franchiseId = propId || paramId;
    const onBack = propOnBack || (() => navigate('/admin/dashboard'));

    // Default to finance
    const [activeTab, setActiveTab] = useState<TabId>('finance');
    const [franchiseData, setFranchiseData] = useState<FranchiseData | null>(null);
    const [loading, setLoading] = useState(true);

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
    }, [franchiseId]);

    if (!franchiseId) return null;

    return (
        <div className="min-h-screen bg-slate-50 relative animate-in fade-in zoom-in-95 duration-300">
            {/* Header (God Mode Indicator) */}
            <div className="bg-slate-900 border-b border-indigo-500/30 text-white sticky top-0 z-50 shadow-xl">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            title="Volver al Panel Global"
                        >
                            <ArrowLeft size={20} className="text-indigo-400" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xs uppercase tracking-widest text-indigo-400 font-bold">Modo Supervisor</h2>
                                {franchiseData?.status === 'active' && (
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                        ACTIVO
                                    </span>
                                )}
                            </div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                {loading ? (
                                    <span className="animate-pulse bg-white/20 h-6 w-48 rounded" />
                                ) : (
                                    <span>{franchiseData?.name || franchiseId}</span>
                                )}
                            </h1>
                        </div>
                    </div>

                    <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0">
                        {TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${isActive
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Icon size={16} />
                                    <span className="hidden md:inline">{tab.label}</span>
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
                            <FranchiseDashboard franchiseId={franchiseId} readOnly={true} />
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
                                <WeeklyScheduler franchiseId={franchiseData?.id || franchiseId} readOnly={true} />
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
