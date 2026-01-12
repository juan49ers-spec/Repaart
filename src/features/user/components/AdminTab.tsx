import React, { useState } from 'react';
import UserManagementPanel from '../../admin/users/UserManagementPanel';
import { Users, Activity, Server, Database, ShieldCheck, Cpu, type LucideIcon } from 'lucide-react';

interface AdminTabProps {
    setViewMode: (mode: string) => void;
}

const AdminTab: React.FC<AdminTabProps> = () => {
    const [activeSection, setActiveSection] = useState<'users' | 'system' | 'audit'>('users');

    return (
        <div className="animate-in fade-in duration-1000 flex flex-col h-full overflow-hidden">

            {/* --- TOP HUD (Heads-Up Display) --- */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-10 shrink-0">
                <div className="relative group">
                    <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition-all duration-700" />
                    <div className="relative flex items-center gap-4">
                        <div className="p-3 bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl shadow-indigo-500/20 ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-500">
                            <Cpu className="w-7 h-7 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-0.5">
                                Command Center
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                                    System Active • 100% Operational
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tactical Navigation Control */}
                <div className="p-1.5 bg-slate-950/80 backdrop-blur-xl rounded-[20px] border border-white/5 flex items-center gap-1 shadow-2xl ring-1 ring-white/10">
                    <TabButton
                        active={activeSection === 'users'}
                        onClick={() => setActiveSection('users')}
                        icon={Users}
                        label="Gestión de Red"
                    />
                    <TabButton
                        active={activeSection === 'system'}
                        onClick={() => setActiveSection('system')}
                        icon={Server}
                        label="Infraestructura"
                    />
                    <TabButton
                        active={activeSection === 'audit'}
                        onClick={() => setActiveSection('audit')}
                        icon={ShieldCheck}
                        label="Seguridad"
                    />
                </div>
            </div>

            {/* --- MAIN OPERATIONAL AREA --- */}
            <div className="flex-1 min-h-[500px] relative">

                {/* 👤 GESTIÓN DE RED (USERS) */}
                {activeSection === 'users' && (
                    <div className="h-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="h-full bg-slate-900/40 backdrop-blur-md rounded-[32px] border border-white/5 shadow-2xl overflow-hidden flex flex-col">
                            <div className="bg-slate-900/80 px-8 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Panel de Control de Acceso</span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-600">SOURCE: FIREBASE_AUTH_SYNC</span>
                            </div>
                            <div className="flex-1 overflow-auto custom-scrollbar">
                                <UserManagementPanel />
                            </div>
                        </div>
                    </div>
                )}

                {/* 🛰️ INFRAESTRUCTURA (SYSTEM) */}
                {activeSection === 'system' && (
                    <div className="h-full animate-in fade-in slide-in-from-bottom-8 duration-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 content-start">

                        {/* Vital Core Card */}
                        <div className="group relative bg-slate-950/90 rounded-[28px] p-8 border border-white/5 shadow-2xl hover:border-emerald-500/30 transition-all duration-500">
                            <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-5 group-hover:opacity-10 transition-opacity">
                                <Activity className="w-24 h-24" />
                            </div>

                            <div className="flex items-center justify-between mb-8">
                                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div className="px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/20">
                                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-tighter">Running</span>
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-white mb-2">Core API Cluster</h3>
                            <p className="text-slate-500 text-sm font-medium mb-8">Estado de los servicios principales y respuesta síncrona.</p>

                            <div className="space-y-4 pt-6 border-t border-white/5">
                                <MetricRow label="Node Performance" value="Optimal" status="good" />
                                <MetricRow label="Success Rate" value="99.98%" status="good" />
                                <MetricRow label="Avg Response" value="18ms" status="good" />
                            </div>
                        </div>

                        {/* Database Card */}
                        <div className="group relative bg-slate-950/90 rounded-[28px] p-8 border border-white/5 shadow-2xl hover:border-indigo-500/30 transition-all duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 group-hover:scale-110 transition-transform">
                                    <Database className="w-6 h-6" />
                                </div>
                                <button className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-[0.2em] px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                                    Sync
                                </button>
                            </div>

                            <h3 className="text-xl font-black text-white mb-2">Google Cloud DB</h3>
                            <p className="text-slate-500 text-sm font-medium mb-8">Instancias de Firebase Firestore y almacenamiento en tiempo real.</p>

                            <div className="space-y-4 pt-6 border-t border-white/5">
                                <MetricRow label="Active Connections" value="1,204" />
                                <MetricRow label="Read/Write Ops" value="Normal" />
                                <MetricRow label="Cache Hit Rate" value="94%" />
                            </div>
                        </div>

                        {/* Security Card */}
                        <div className="group relative bg-slate-950/90 rounded-[28px] p-8 border border-white/5 shadow-2xl hover:border-purple-500/30 transition-all duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 group-hover:scale-110 transition-transform">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-white mb-2">Security Shield</h3>
                            <p className="text-slate-500 text-sm font-medium mb-8">Monitorización de intentos de acceso y reglas de seguridad de datos.</p>

                            <div className="space-y-4 pt-6 border-t border-white/5">
                                <MetricRow label="Auth Guards" value="Active" />
                                <MetricRow label="Banned IPs" value="0" />
                                <MetricRow label="SSO Status" value="Enabled" />
                            </div>
                        </div>
                    </div>
                )}

                {/* 🛡️ SEGURIDAD (AUDIT/LOGS) */}
                {activeSection === 'audit' && (
                    <div className="h-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="bg-slate-950 rounded-[32px] border border-white/10 shadow-3xl h-full flex flex-col p-8 font-mono">
                            <div className="flex items-center justify-between mb-6 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                                    <span className="text-xs font-bold text-slate-300 tracking-[0.2em] uppercase">Live Audit Stream</span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-[10px] text-slate-600 uppercase tracking-widest">Buffer: 1024KB</span>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">Status: Monitoring</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto bg-black/40 rounded-2xl p-6 border border-white/5 shadow-inner custom-scrollbar">
                                <LogEntry time="23:31:04" type="INFO" msg="Security protocol: Alpha-7 engaged" />
                                <LogEntry time="23:31:05" type="SUCCESS" msg="Cloud function 'syncUsers' executed successfully [234ms]" />
                                <LogEntry time="23:31:08" type="INFO" msg="Admin session heartbeat detected: UID=...R8t2" />
                                <LogEntry time="23:31:12" type="WARN" msg="Unauthorized attempt prevented: Resource=financial_locks" color="text-amber-400" />
                                <LogEntry time="23:31:14" type="INFO" msg="System maintenance: Cache cleared for /dist/bundle.js" />
                                <div className="mt-4 flex items-center gap-2 text-indigo-500 animate-pulse">
                                    <span className="text-xs">_</span>
                                    <span className="text-xs">Listening for incoming events...</span>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-between items-center text-[10px] text-slate-600 border-t border-white/5 pt-4">
                                <p>© REP-AART OS V3.13.0 - KERNEL: REACT_FIREBASE_HYBRID</p>
                                <button className="hover:text-white transition-colors uppercase font-bold tracking-widest">Download Full History</button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

// --- HELPER COMPONENTS ---

export default AdminTab;

// --- HELPER COMPONENTS ---

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: LucideIcon, label: string }) => (
    <button
        onClick={onClick}
        className={`
            relative px-6 py-3 rounded-[15px] text-xs font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-2.5 select-none
            ${active
                ? 'bg-white text-slate-950 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }
        `}
    >
        <Icon className={`w-3.5 h-3.5 ${active ? 'text-indigo-600' : 'text-slate-500'}`} />
        <span className="whitespace-nowrap">{label}</span>
        {active && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500 rounded-full blur-[2px]" />
        )}
    </button>
);

const MetricRow = ({ label, value, status }: { label: string, value: string, status?: 'good' | 'bad' }) => (
    <div className="flex justify-between items-center py-1">
        <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">{label}</span>
        <div className="flex items-center gap-2">
            <span className={`text-[11px] font-black tracking-tight ${status === 'good' ? 'text-emerald-400' : 'text-slate-200'}`}>
                {value}
            </span>
            {status === 'good' && <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />}
        </div>
    </div>
);

const LogEntry = ({ time, type, msg, color = "text-slate-400" }: { time: string, type: string, msg: string, color?: string }) => {
    let typeColor = "text-indigo-400";
    if (type === 'SUCCESS') typeColor = "text-emerald-400";
    if (type === 'WARN') typeColor = "text-amber-400";
    if (type === 'ERROR') typeColor = "text-rose-400";

    return (
        <div className="flex gap-4 py-1.5 border-b border-white/[0.02] hover:bg-white/[0.03] transition-colors group">
            <span className="text-slate-600 text-[10px] w-20 shrink-0 font-medium">[{time}]</span>
            <span className={`${typeColor} text-[10px] font-black w-14 shrink-0`}>{type}</span>
            <span className={`${color} text-[11px] font-medium tracking-tight group-hover:text-white transition-colors`}>{msg}</span>
        </div>
    );
};
