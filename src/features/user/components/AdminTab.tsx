import React, { useState } from 'react';
import UserManagementPanel from '../../admin/users/UserManagementPanel';
import { Users, Settings, Activity, Server, FileText, Database, ShieldCheck, Cpu } from 'lucide-react';

interface AdminTabProps {
    setViewMode: (mode: string) => void;
}

const AdminTab: React.FC<AdminTabProps> = () => {
    const [activeSection, setActiveSection] = useState<'users' | 'system' | 'audit'>('users');

    return (
        <div className="animate-in fade-in duration-700 space-y-6 h-full flex flex-col">

            {/* --- COMMAND CENTER HEADER --- */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 shrink-0 pb-2">
                <div className="relative">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30 ring-1 ring-white/10">
                            <Settings className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                            Command Center
                        </h2>
                    </div>
                    <p className="text-slate-500 font-medium ml-[50px] max-w-md text-sm leading-relaxed">
                        Control centralizado de usuarios, sistema y auditoría.
                    </p>
                </div>

                {/* Segmented Control Navigation - MATCHING APP STYLE (Indigo Active) */}
                <div className="p-1.5 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-1 shadow-inner">
                    <TabButton
                        active={activeSection === 'users'}
                        onClick={() => setActiveSection('users')}
                        icon={Users}
                        label="Usuarios"
                    />
                    <TabButton
                        active={activeSection === 'system'}
                        onClick={() => setActiveSection('system')}
                        icon={Server}
                        label="Sistema"
                    />
                    <TabButton
                        active={activeSection === 'audit'}
                        onClick={() => setActiveSection('audit')}
                        icon={FileText}
                        label="Logs"
                    />
                </div>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="flex-1 min-h-0 relative">

                {/* SECTION: USERS */}
                {activeSection === 'users' && (
                    <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Standard container style */}
                        <div className="h-full rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-slate-900">
                            <UserManagementPanel />
                        </div>
                    </div>
                )}

                {/* SECTION: SYSTEM */}
                {activeSection === 'system' && (
                    <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {/* Status Card - BOLDER */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col gap-6 hover:border-indigo-500/30 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">Operativo</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Estado del Sistema</h3>
                                <p className="text-slate-500 text-sm font-medium">Todos los servicios funcionando al 100%.</p>
                            </div>
                            <div className="mt-auto space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <InfoRow label="Versión Core" value="v4.2.0" monospace />
                                <InfoRow label="Base de Datos" value="Conectado" />
                                <InfoRow label="Latencia Media" value="24ms" monospace />
                            </div>
                        </div>

                        {/* Maintenance Card */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col gap-6 hover:border-indigo-500/30 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                                    <Database className="w-6 h-6" />
                                </div>
                                <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-wide">
                                    Gestionar
                                </button>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Mantenimiento</h3>
                                <p className="text-slate-500 text-sm font-medium">Herramientas de caché y optimización.</p>
                            </div>
                            <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
                                <button className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-xs uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-2">
                                    <ShieldCheck className="w-4 h-4" />
                                    Acciones Protegidas
                                </button>
                            </div>
                        </div>

                        {/* Infrastructure Card */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col gap-6 hover:border-indigo-500/30 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="p-3 bg-violet-500/10 rounded-xl text-violet-600 dark:text-violet-400">
                                    <Cpu className="w-6 h-6" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Infraestructura</h3>
                                <p className="text-slate-500 text-sm font-medium">Europe-West1 Cloud Functions.</p>
                            </div>
                            <div className="mt-auto space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <InfoRow label="Memoria" value="~128MB" monospace />
                                <InfoRow label="Escalado" value="Auto" />
                            </div>
                        </div>

                    </div>
                )}

                {/* SECTION: AUDIT */}
                {activeSection === 'audit' && (
                    <div className="h-full rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 animate-in fade-in slide-in-from-bottom-4 duration-300 bg-slate-50 dark:bg-slate-900/50">
                        <FileText className="w-16 h-16 mb-4 opacity-20" />
                        <p className="font-bold text-lg text-slate-600 dark:text-slate-400">Registro de Auditoría</p>
                        <span className="text-sm font-medium opacity-60 mt-1 max-w-xs text-center">Utilice la sección principal de Auditoría.</span>
                    </div>
                )}

            </div>
        </div>
    );
};

// --- HELPER COMPONENTS ---

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button
        onClick={onClick}
        className={`
            relative px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 select-none
            ${active
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-black/5'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800'
            }
        `}
    >
        <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
        <span>{label}</span>
    </button>
);

const InfoRow = ({ label, value, monospace }: any) => (
    <div className="flex justify-between items-center">
        <span className="text-slate-500 dark:text-slate-400 font-medium text-[10px] uppercase tracking-wider opacity-80">{label}</span>
        <span className={`text-slate-700 dark:text-slate-200 text-xs font-semibold ${monospace ? 'font-mono' : ''}`}>{value}</span>
    </div>
);

export default AdminTab;
