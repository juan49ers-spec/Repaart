import React, { useState } from 'react';
import UserManagementPanel from '../../admin/users/UserManagementPanel';
import BannerManager from '../../admin/BannerManager';
import AuditTool from '../../admin/users/AuditTool';
import { Activity, Server, Database } from 'lucide-react';

interface AdminTabProps {
    setViewMode: (mode: string) => void;
}

const AdminTab: React.FC<AdminTabProps> = () => {
    const [activeSection, setActiveSection] = useState<'users' | 'system' | 'audit'>('users');

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 font-sans">

            {/* --- TOP HEADER (Apple Style) --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between px-8 py-8 md:py-10 shrink-0">
                <div>
                    <h1 className="text-3xl tracking-tight font-semibold text-slate-900 dark:text-white">
                        Gestión de Franquicias
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        Administración y control de red
                    </p>
                </div>

                {/* Segmented Control / Tabs */}
                <div className="mt-6 md:mt-0 bg-slate-200/50 dark:bg-white/5 p-1 rounded-lg inline-flex self-start md:self-center backdrop-blur-sm">
                    <button
                        onClick={() => setActiveSection('users')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeSection === 'users'
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                    >
                        Red
                    </button>
                    <button
                        onClick={() => setActiveSection('system')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeSection === 'system'
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                    >
                        Marketing
                    </button>
                    <button
                        onClick={() => setActiveSection('audit')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeSection === 'audit'
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                    >
                        Sistema
                    </button>
                </div>
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-1 px-8 pb-8 min-h-0 overflow-hidden">
                <div className="h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">

                    {/* Content Switcher */}
                    {activeSection === 'users' ? (
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <UserManagementPanel />
                        </div>
                    ) : activeSection === 'system' ? (
                        <div className="flex-1 overflow-auto p-8">
                            {/* Banner Manager */}
                            <BannerManager className="mb-8" />

                            {/* System Status Cards */}
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Estado del Sistema</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Simple Clean Cards */}
                                <StatusCard
                                    icon={Activity}
                                    title="Core Services"
                                    status="Operational"
                                    details="All APIs online (18ms latency)"
                                />
                                <StatusCard
                                    icon={Database}
                                    title="Database"
                                    status="Healthy"
                                    details="Firestore connections active"
                                />
                                <StatusCard
                                    icon={Server}
                                    title="Global CDN"
                                    status="Active"
                                    details="Cache hit rate 99%"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto p-8">
                            <div className="max-w-4xl space-y-12">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Registro de Seguridad</h3>
                                    <div className="space-y-0 text-sm font-mono border-l-2 border-slate-200 dark:border-slate-800 pl-4 py-2">
                                        <LogItem time="10:42 PM" text="System verification complete" />
                                        <LogItem time="10:40 PM" text="Admin session authenticated" />
                                        <LogItem time="10:38 PM" text="Database backup successful" />
                                    </div>
                                </div>
                                <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                                    <AuditTool />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Subcomponents for Clean UI ---

interface StatusCardProps {
    icon: React.ElementType;
    title: string;
    status: string;
    details: string;
}

const StatusCard = ({ icon: Icon, title, status, details }: StatusCardProps) => (
    <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600">
                <Icon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </div>
            <h3 className="font-medium text-slate-900 dark:text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{status}</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{details}</p>
    </div>
);

const LogItem = ({ time, text }: { time: string, text: string }) => (
    <div className="flex gap-4 py-1.5 opacity-70">
        <span className="text-slate-400 shrink-0">{time}</span>
        <span className="text-slate-600 dark:text-slate-300">{text}</span>
    </div>
);

export default AdminTab;
