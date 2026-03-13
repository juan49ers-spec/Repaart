import React, { useState } from 'react';
import { Plus, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import ContractAnalyticsDashboard from '../ContractAnalyticsDashboard';

interface FolderDef {
    id: string;
    label: string;
    icon: React.ElementType;
    color: string;
}

interface AdminResourceSidebarProps {
    folders: FolderDef[];
    activeCategory: string;
    setActiveCategory: (cat: string) => void;
    folderCounts: Record<string, number>;
    storageStats: { formatted: string; percentage: number };
    onUploadClick: () => void;
    onOpenWizard: () => void;
}

export const AdminResourceSidebar: React.FC<AdminResourceSidebarProps> = ({
    folders,
    activeCategory,
    setActiveCategory,
    folderCounts,
    storageStats,
    onUploadClick,
    onOpenWizard
}) => {
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

    return (
        <aside className="hidden md:flex w-72 bg-white dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800 flex-col pt-6 pb-4">
            <div className="px-6 mb-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Estructura de Archivos</h3>
            </div>
            
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                {folders.map(folder => {
                    const isActive = activeCategory === folder.id;
                    return (
                        <button
                            key={folder.id}
                            onClick={() => setActiveCategory(folder.id)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-800'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <folder.icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                {folder.label}
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isActive ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                {folderCounts[folder.id] || 0}
                            </span>
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Almacenamiento</span>
                        <span className="text-[10px] font-bold text-indigo-500">{storageStats.formatted} / 10 GB</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(storageStats.percentage, 1)}%` }}
                        />
                    </div>
                </div>

                <button
                    onClick={onUploadClick}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all font-bold text-sm flex items-center justify-center gap-2 group"
                >
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                    Subir Nuevo Recurso
                </button>
                
                <button
                    onClick={onOpenWizard}
                    className="w-full py-3 bg-slate-900 dark:bg-black text-white rounded-xl shadow-lg shadow-slate-900/10 transition-all font-black text-sm flex items-center justify-center gap-2 group border border-slate-800"
                >
                    <Sparkles className="w-4 h-4 text-indigo-400 group-hover:animate-pulse" />
                    Generar Inteligente
                </button>

                {/* Analytics Dashboard — Collapsible */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
                        className="w-full flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 dark:hover:text-slate-300 transition-colors px-1 py-1"
                    >
                        <span>Analytics</span>
                        {isAnalyticsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                    {isAnalyticsOpen && (
                        <div className="mt-3 animate-in slide-in-from-top-2 fade-in duration-200">
                            <ContractAnalyticsDashboard />
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};
