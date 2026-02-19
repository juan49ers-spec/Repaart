import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useInvoicing, InvoiceDTO, FranchiseRestaurant } from '../../hooks/useInvoicing';
import { FileText, DollarSign, Plus, Users, Clock, Search, Filter, AlertCircle, ArrowRight, X } from 'lucide-react';
import { CreateRestaurantModal } from './components/CreateRestaurantModal';
import { CreateInvoiceModal } from './components/CreateInvoiceModal';
import FranchiseRateConfigurator from '../franchise/FranchiseRateConfigurator';
import { InvoicingStatCard } from './components/InvoicingStatCard';
import { DashboardInvoiceTable } from './components/DashboardInvoiceTable';
import { RevenueTrendChart } from './components/RevenueTrendChart';
import { TariffSnapshot } from './components/TariffSnapshot';
import { formatCurrency } from '../../utils/formatters';

type ActiveTab = 'overview' | 'invoices' | 'clients';

// Helper function to convert Firestore Timestamp to Date object
const convertFirestoreTimestampToDate = (timestamp: { _seconds: number; _nanoseconds: number } | Date | string): Date => {
    if (timestamp && typeof timestamp === 'object' && '_seconds' in timestamp && '_nanoseconds' in timestamp) {
        return new Date(timestamp._seconds * 1000);
    }
    return new Date(timestamp as Date | string);
};


export const InvoicingDashboard: React.FC<{ showHeader?: boolean }> = ({ showHeader = true }) => {
    const { user } = useAuth();
    const { getInvoices, getRestaurants } = useInvoicing();

    const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
    const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
    const [restaurants, setRestaurants] = useState<FranchiseRestaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modals State
    const [showCreateRestaurant, setShowCreateRestaurant] = useState(false);
    const [showCreateInvoice, setShowCreateInvoice] = useState(false);
    const [showRateConfig, setShowRateConfig] = useState(false);

    // Calculated Stats
    const currentMonthTotal = invoices
        .filter(inv => {
            const date = convertFirestoreTimestampToDate(inv.issueDate);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        })
        .reduce((acc: number, inv: InvoiceDTO) => acc + inv.total, 0);

    const outstandingAmount = invoices
        .filter(inv => inv.status === 'issued')
        .reduce((acc: number, inv: InvoiceDTO) => acc + inv.total, 0);

    const stats = {
        totalIssued: invoices.reduce((acc: number, inv: InvoiceDTO) => acc + inv.total, 0),
        count: invoices.length,
        pending: invoices.filter((i: InvoiceDTO) => i.status === 'issued').length
    };

    // Load Data
    const loadData = useCallback(async () => {
        if (!user?.franchiseId && user?.role !== 'admin') return;
        setLoading(true);
        try {
            const franchiseId = user.franchiseId || user.uid; // Fallback
            const [invs, rests] = await Promise.all([
                getInvoices(franchiseId),
                getRestaurants(franchiseId)
            ]);
            setInvoices(invs);
            setRestaurants(rests);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            console.error('Error loading invoicing data:', err);
            const errorDetails = (err as any)?.code || (err as any)?.message || errorMessage;
            setError(`Error cargando datos de facturación: ${errorDetails}`);
        } finally {
            setLoading(false);
        }
    }, [user, getInvoices, getRestaurants]);

    // Initial Load
    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, loadData]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Loading Overlay */}
            {loading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}

            {/* Header */}
            {showHeader && (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FileText className="w-8 h-8 text-blue-600" />
                            Facturación B2B
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Gestión de facturas a restaurantes clientes
                        </p>
                    </div>
                </div>
            )}

            {/* Action Bar - Always visible */}
            <div className="flex justify-end">
                <button
                    onClick={() => setShowCreateInvoice(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all transform hover:scale-105"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Factura
                </button>
            </div>



            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Facturado (Año)</p>
                    <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-2 truncate">
                        {stats.totalIssued.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Facturas Emitidas</p>
                    <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-2">
                        {stats.count}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pendientes de Cobro</p>
                    <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-2">
                        {stats.pending}
                    </p>
                </div>
            </div>

            {/* Navigation Tabs - Centeered for better UX */}
            <div className="flex justify-center">
                <div className="inline-flex gap-1 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    {(['overview', 'invoices', 'clients'] as const).map((tabKey) => (
                        <button
                            key={tabKey}
                            onClick={() => setActiveTab(tabKey)}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tabKey
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                } `}
                        >
                            {tabKey === 'overview' && 'Resumen'}
                            {tabKey === 'invoices' && 'Facturas'}
                            {tabKey === 'clients' && 'Clientes'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {
                activeTab === 'overview' && (
                    <>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Visión General</h2>

                        {/* Main Grid: Charts & Tariffs */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            {/* Revenue Trend Chart - Takes 2 cols */}
                            <div className="lg:col-span-2">
                                <RevenueTrendChart invoices={invoices} />
                            </div>

                            {/* Tariff Snapshot - Takes 1 col */}
                            <div className="lg:col-span-1">
                                <TariffSnapshot
                                    franchiseId={user?.franchiseId || user?.uid || ''}
                                    onConfigure={() => setShowRateConfig(true)}
                                />
                            </div>
                        </div>

                        {/* Secondary Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
                            <InvoicingStatCard
                                title="Desglose Mensual"
                                value={formatCurrency(currentMonthTotal)}
                                icon={DollarSign}
                                trend="+12.5%"
                                color="emerald"
                            />
                            <InvoicingStatCard
                                title="Deuda Pendiente"
                                value={formatCurrency(outstandingAmount)}
                                icon={Clock}
                                color="amber"
                            />
                            <InvoicingStatCard
                                title="Volumen Facturas"
                                value={invoices.length.toString()}
                                icon={FileText}
                                color="blue"
                            />
                            <InvoicingStatCard
                                title="Cartera Activa"
                                value={restaurants.length.toString()}
                                icon={Users}
                                color="purple"
                            />
                        </div>

                        {/* Recent Invoices Table */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-slate-400" />
                                    Actividad Reciente
                                </h3>
                                <button
                                    onClick={() => setActiveTab('invoices')}
                                    className="text-sm text-emerald-600 font-bold hover:underline"
                                >
                                    Ver todas las facturas
                                </button>
                            </div>
                            <DashboardInvoiceTable invoices={invoices.slice(0, 5)} />
                        </div>
                    </>
                )
            }

            {
                activeTab === 'invoices' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Historial de Facturas</h3>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar factura..."
                                        className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-64"
                                    />
                                </div>
                                <button aria-label="Filtrar facturas" className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                                    <Filter className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <DashboardInvoiceTable invoices={invoices} />
                        </div>
                    </div>
                )
            }

            {
                activeTab === 'clients' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Cartera de Clientes</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {restaurants.map((rest: FranchiseRestaurant) => (
                                <div key={rest.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-all cursor-pointer group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                                            {rest.fiscalName.charAt(0)}
                                        </div>
                                        <button
                                            className="text-slate-400 hover:text-emerald-500 transition-colors"
                                            aria-label={`Ver detalles de ${rest.fiscalName}`}
                                            title="Ver detalles"
                                        >
                                            <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    </div>
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">{rest.fiscalName}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate mb-4">{rest.address.street}</p>
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500">
                                        <span>CIF: {rest.cif}</span>
                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Activo</span>
                                    </div>
                                </div>
                            ))}
                            {restaurants.length === 0 && (
                                <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No hay clientes registrados.</p>
                                    <button
                                        onClick={() => setShowCreateRestaurant(true)}
                                        className="mt-4 text-emerald-500 font-bold hover:underline"
                                    >
                                        Crear el primero
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Rate Config Modal Integration */}
            {showRateConfig && user?.uid && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Configuración de Tarifas</h2>
                            <button
                                onClick={() => setShowRateConfig(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                title="Cerrar"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <FranchiseRateConfigurator franchiseId={user.uid} />
                        </div>
                    </div>
                </div>
            )}

            {
                error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )
            }

            <CreateRestaurantModal
                isOpen={showCreateRestaurant}
                onClose={() => setShowCreateRestaurant(false)}
                onSuccess={loadData}
            />

            <CreateInvoiceModal
                isOpen={showCreateInvoice}
                onClose={() => setShowCreateInvoice(false)}
                onSuccess={loadData}
                restaurants={restaurants}
            />
        </div >
    );
};
