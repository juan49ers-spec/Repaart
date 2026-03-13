import React from 'react';
import { RefreshCw } from 'lucide-react';

export type AdminResourceTab = 'vault' | 'guides' | 'requests' | 'services';

interface AdminResourceHeaderProps {
    activeTab: AdminResourceTab;
    setActiveTab: (tab: AdminResourceTab) => void;
    pendingRequestsCount: number;
    onForceTokenRefresh?: () => void;
}

export const AdminResourceHeader: React.FC<AdminResourceHeaderProps> = ({
    activeTab,
    setActiveTab,
    pendingRequestsCount,
    onForceTokenRefresh
}) => {
    return (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 shrink-0">
            <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    Conocimiento
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold border border-indigo-500/20 uppercase tracking-widest">Admin</span>
                </h2>
                <p className="hidden md:block text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Gestión integral de documentación y guías.</p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl whitespace-nowrap min-w-max">
                    <button
                        onClick={() => setActiveTab('vault')}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'vault' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Bóveda Digital
                    </button>
                    <button
                        onClick={() => setActiveTab('guides')}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'guides' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Guías Interactivas
                    </button>

                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all relative flex items-center gap-2 ${activeTab === 'requests' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Solicitudes
                        {pendingRequestsCount > 0 && (
                            <span className="flex items-center justify-center bg-rose-500 text-white text-[10px] h-5 min-w-5 px-1 rounded-full border-2 border-slate-100 dark:border-slate-800">
                                {pendingRequestsCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('services')}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'services' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Servicios Premium
                    </button>
                </div>

                {onForceTokenRefresh && (
                    <button
                        onClick={onForceTokenRefresh}
                        className="shrink-0 flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Actualizar token de autenticación"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span className="hidden sm:inline">Actualizar Token</span>
                    </button>
                )}
            </div>
        </div>
    );
};
