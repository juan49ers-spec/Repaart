import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ArrowLeft, LayoutDashboard, Bike, CalendarDays, GraduationCap, Settings, Wallet, Users, LucideIcon } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { franchiseService } from '../../services/franchiseService';
import { isOk } from '../../types/result';
import MonthlyHistoryTable from '../franchise/finance/MonthlyHistoryTable';
import Academy from '../academy/Academy';
import UserManagementPanel from './users/UserManagementPanel';

// Lazy load heavy components
const WeeklyScheduler = lazy(() => import('../operations/WeeklyScheduler'));
const FleetManager = lazy(() => import('../operations/FleetManager'));
const FranchiseProfile = lazy(() => import('./settings/FranchiseProfile'));
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

type TabId = 'dashboard' | 'operations' | 'team' | 'fleet' | 'academy' | 'finance' | 'settings';

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

    // Prioridad: Prop (si se usa como modal) > Param (si es ruta directa)
    // Ensure we have a string, defaulting to undefined if both are missing which handles the logic below
    const franchiseId = propId || paramId;
    const onBack = propOnBack || (() => navigate('/admin/dashboard'));

    const [activeTab, setActiveTab] = useState<TabId>('dashboard');
    const [franchiseData, setFranchiseData] = useState<FranchiseData | null>(null); // Empezamos en null para saber que carga
    const [loading, setLoading] = useState(true);

    // Navigation Tabs
    const TABS: TabConfig[] = [
        { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
        { id: 'operations', label: 'Turnos', icon: CalendarDays },
        { id: 'team', label: 'Personal', icon: Users },
        { id: 'fleet', label: 'Flota', icon: Bike },
        { id: 'academy', label: 'Academia', icon: GraduationCap },
        { id: 'finance', label: 'Finanzas', icon: Wallet },
        { id: 'settings', label: 'Configuración', icon: Settings },
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

            {/* Content Area - INYECCIÓN DE DEPENDENCIA DE ID */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {activeTab === 'operations' && (
                    <Suspense fallback={<div className="p-8 text-center text-slate-400">Cargando turnos...</div>}>
                        <WeeklyScheduler franchiseId={franchiseData?.id || franchiseId} readOnly={false} />
                    </Suspense>
                )}

                {activeTab === 'team' && (
                    <UserManagementPanel franchiseId={franchiseData?.id || franchiseId} readOnly={true} />
                )}

                {activeTab === 'fleet' && (
                    <Suspense fallback={<div className="p-8 text-center text-slate-400">Cargando flota...</div>}>
                        <FleetManager franchiseId={franchiseData?.id || franchiseId} readOnly={true} />
                    </Suspense>
                )}

                {activeTab === 'settings' && (
                    <Suspense fallback={<div className="p-8 text-center text-slate-400">Cargando configuración...</div>}>
                        <FranchiseProfile franchiseId={franchiseData?.id || franchiseId} readOnly={false} />
                    </Suspense>
                )}

                {activeTab === 'dashboard' && (
                    <Suspense fallback={<div className="p-12 text-center text-slate-400">Cargando dashboard...</div>}>
                        {/* We pass the resolved franchiseId (either from prop or param) */}
                        <FranchiseDashboard franchiseId={franchiseId} readOnly={true} />
                    </Suspense>
                )}

                {activeTab === 'finance' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">
                                Histórico Financiero
                            </h2>
                            <p className="text-slate-600 text-sm">
                                Vista de supervisor: Histórico mensual de {franchiseData?.name}
                            </p>
                        </div>
                        <MonthlyHistoryTable
                            franchiseId={franchiseData?.id || franchiseId}
                        />
                    </div>
                )}

                {activeTab === 'academy' && (
                    // Nota: Academy suele ser por usuario, pero aquí podríamos ver estadísticas globales de la franquicia
                    <Academy />
                )}
            </div>
        </div>
    );
};

export default AdminFranchiseView;
