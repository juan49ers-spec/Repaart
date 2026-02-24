import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, PieChart, Wallet, Lock, CreditCard } from 'lucide-react';
import { BillingDashboard } from '../billing/BillingDashboard';
import FranchiseDashboard from '../franchise/FranchiseDashboard';
import { useInvoicingModule } from '../../hooks/useInvoicingModule';

type ActiveTab = 'invoicing' | 'results';

export const FinanceHub: React.FC = () => {
    const { user } = useAuth();
    const { getModuleStatus } = useInvoicingModule();
    const [activeTab, setActiveTab] = useState<ActiveTab>('invoicing');
    const [invoicingEnabled, setInvoicingEnabled] = useState<boolean | null>(null);
    const [loadingStatus, setLoadingStatus] = useState(true);

    // Check if invoicing module is enabled for this franchise
    useEffect(() => {
        const checkInvoicingStatus = async () => {
            if (!user?.uid) return;

            try {
                // Always use the Firebase Auth UID (which is the document ID)
                const franchiseId = user.uid;
                console.log('[FinanceHub] Checking invoicing status for:', {
                    userFranchiseId: user?.franchiseId,
                    userUid: user?.uid,
                    finalId: franchiseId,
                    userEmail: user?.email
                });
                const status = await getModuleStatus(franchiseId);
                console.log('[FinanceHub] Invoicing status response:', status);
                setInvoicingEnabled(status.enabled);
            } catch (error) {
                console.error('Error checking invoicing status:', error);
                setInvoicingEnabled(false);
            } finally {
                setLoadingStatus(false);
            }
        };

        checkInvoicingStatus();
    }, [user, getModuleStatus]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto p-6">
            {/* Unified Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <Wallet className="w-8 h-8 text-emerald-600" />
                        Finanzas & Facturación
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                        Control integral de ingresos, gastos y contabilidad
                    </p>
                </div>
            </div>

            {/* Navigation Tabs - Solo 2 pestañas */}
            <div className="flex justify-center mb-8">
                <div className="inline-flex bg-emerald-50/50 dark:bg-slate-800 p-1.5 rounded-2xl border border-emerald-100 dark:border-slate-700 shadow-sm">
                    <button
                        onClick={() => setActiveTab('results')}
                        className={`
                            flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300
                            ${activeTab === 'results'
                                ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-100 shadow-sm border border-emerald-300 dark:border-emerald-800'
                                : 'text-emerald-600/70 hover:text-emerald-800 dark:text-slate-400 dark:hover:text-emerald-300 hover:bg-emerald-100/50 dark:hover:bg-slate-700/50'}
                        `}
                    >
                        <PieChart className="w-4 h-4" />
                        Resultados y Cierres
                    </button>
                    <button
                        onClick={() => setActiveTab('invoicing')}
                        className={`
                            flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300
                            ${activeTab === 'invoicing'
                                ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-100 shadow-sm border border-emerald-300 dark:border-emerald-800'
                                : 'text-emerald-600/70 hover:text-emerald-800 dark:text-slate-400 dark:hover:text-emerald-300 hover:bg-emerald-100/50 dark:hover:bg-slate-700/50'}
                        `}
                    >
                        <FileText className="w-4 h-4" />
                        Facturación
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[600px] px-2">
                {activeTab === 'invoicing' && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500 fade-in">
                        {loadingStatus ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                            </div>
                        ) : invoicingEnabled ? (
                            <BillingDashboard franchiseId={user?.uid || ''} />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 px-6">
                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Lock className="w-10 h-10 text-slate-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                                        Módulo de Facturación No Activado
                                    </h2>
                                    <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                                        El módulo de facturación no está activado para tu franquicia. Contacta con el administrador para activar esta funcionalidad y poder crear y gestionar facturas.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                                            <CreditCard className="w-6 h-6 text-emerald-600" />
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">Funcionalidades Premium</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Gestión completa de facturas</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                                            <FileText className="w-6 h-6 text-blue-600" />
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">Facturación B2B</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Clientes y restaurantes</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'results' && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500 fade-in">
                        <FranchiseDashboard franchiseId={user?.franchiseId || user?.uid} />
                    </div>
                )}
            </div>
        </div>
    );
};
