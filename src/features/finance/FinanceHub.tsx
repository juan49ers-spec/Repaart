
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, PieChart, Settings, Wallet } from 'lucide-react';
import { InvoicingDashboard } from '../invoicing/InvoicingDashboard';
import FranchiseDashboard from '../franchise/FranchiseDashboard';
import FranchiseRateConfigurator from '../franchise/FranchiseRateConfigurator';

type ActiveTab = 'invoicing' | 'results' | 'config';

export const FinanceHub: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<ActiveTab>('invoicing');

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

            {/* Navigation Tabs */}
            <div className="flex justify-center mb-8">
                <div className="inline-flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <button
                        onClick={() => setActiveTab('invoicing')}
                        className={`
                            flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300
                            ${activeTab === 'invoicing'
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105'
                                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'}
                        `}
                    >
                        <FileText className="w-4 h-4" />
                        Facturación
                    </button>
                    <button
                        onClick={() => setActiveTab('results')}
                        className={`
                            flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300
                            ${activeTab === 'results'
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105'
                                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'}
                        `}
                    >
                        <PieChart className="w-4 h-4" />
                        Resultados y Cierres
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`
                            flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300
                            ${activeTab === 'config'
                                ? 'bg-slate-800 text-white shadow-lg shadow-slate-800/30 scale-105'
                                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'}
                        `}
                    >
                        <Settings className="w-4 h-4" />
                        Configuración
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[600px]">
                {activeTab === 'invoicing' && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500 fade-in">
                        {/* Wrapper to hide Invoicing internal header if needed, or we adapt InvoicingDashboard */}
                        <InvoicingDashboard showHeader={false} />
                    </div>
                )}

                {activeTab === 'results' && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500 fade-in">
                        {/* We pass a specific prop or context to FranchiseDashboard to act as a Tab content */}
                        <FranchiseDashboard franchiseId={user?.franchiseId || user?.uid} />
                    </div>
                )}

                {activeTab === 'config' && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500 fade-in max-w-4xl mx-auto">
                        <FranchiseRateConfigurator franchiseId={user?.franchiseId || user?.uid || ''} />
                    </div>
                )}
            </div>
        </div>
    );
};
