import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRiderStore } from '../../../store/useRiderStore';

import {
    User, ChevronRight, Bell, Shield, HelpCircle,
    Loader2, MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RiderStatsOverview } from './components/RiderStatsOverview';
import RiderSupport from './components/RiderSupport';

export const RiderProfileView: React.FC = () => {
    const { user, logout } = useAuth();
    const { myShifts, fetchMyShifts, isLoading } = useRiderStore();
    const navigate = useNavigate();
    const [showSupport, setShowSupport] = useState(false);

    useEffect(() => {
        if (user?.uid) {
            fetchMyShifts(user.uid);
        }
    }, [user?.uid, fetchMyShifts]);

    const handleLogout = async () => {
        if (confirm('¿Cerrar sesión definitivamente?')) {
            await logout();
            navigate('/login');
        }
    };

    const handleNavigation = (path: string) => navigate(path);

    if (!user) return <LoaderScreen />;

    return (
        <div className="relative min-h-[calc(100vh-64px)] overflow-y-auto bg-[#f5f5f7] dark:bg-[#0B0F19] transition-colors duration-300 pb-24 font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif]">
            
            {/* Dynamic Background Mesh (Premium dark/light feel) */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[80px]" />
                <div className="absolute top-[10%] left-[-10%] w-[250px] h-[250px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10 max-w-md mx-auto px-5 py-6 flex flex-col gap-6">
                
                {/* HERO SECTION */}
                {!showSupport && (
                    <header className="flex flex-col items-center mt-6 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                        <div className="relative mb-5 group">
                            <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full blur opacity-30 dark:opacity-40 transition duration-500"></div>
                            <div className="relative w-[104px] h-[104px] rounded-full overflow-hidden bg-white dark:bg-slate-900 shadow-xl border-4 border-white dark:border-[#111827]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-3xl font-medium text-slate-500 dark:text-slate-400">
                                            {user.email?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <h1 className="text-[26px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                            {user.displayName || 'Rider Profesional'}
                        </h1>
                        <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                            {user.email}
                        </p>
                    </header>
                )}

                {/* CONTENT AREA */}
                <main className="animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
                    
                    {!showSupport ? (
                        <div className="space-y-6">
                            
                            {/* Stats Overview Card */}
                            <section className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md rounded-[20px] shadow-[0_4px_24px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-200/50 dark:border-white/5 overflow-hidden transition-all duration-300">
                                <div className="p-5">
                                    {isLoading ? (
                                        <div className="h-32 flex items-center justify-center">
                                            <Loader2 className="animate-spin text-slate-300 dark:text-slate-600" size={24} />
                                        </div>
                                    ) : (
                                        <RiderStatsOverview myShifts={myShifts} />
                                    )}
                                </div>
                            </section>

                            {/* Settings Groups */}
                            <div className="space-y-5">
                                {/* Group 1: General Info */}
                                <div className="bg-white dark:bg-[#111827] rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] dark:shadow-none border border-slate-200/60 dark:border-white/5 overflow-hidden">
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        <MenuItem 
                                            icon={<div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center"><MapPin size={16} className="text-white" /></div>} 
                                            label="Disponibilidad y Zonas" 
                                            onClick={() => handleNavigation('/rider/availability')} 
                                            isFirst
                                        />
                                        <MenuItem 
                                            icon={<div className="w-7 h-7 rounded-md bg-slate-400 flex items-center justify-center"><User size={16} className="text-white" /></div>} 
                                            label="Datos Personales" 
                                            onClick={() => handleNavigation("/rider/profile/personal")} 
                                        />
                                    </div>
                                </div>

                                {/* Group 2: Preferences & Security */}
                                <div className="bg-white dark:bg-[#111827] rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] dark:shadow-none border border-slate-200/60 dark:border-white/5 overflow-hidden">
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        <MenuItem 
                                            icon={<div className="w-7 h-7 rounded-md bg-red-500 flex items-center justify-center"><Bell size={16} className="text-white fill-current" /></div>} 
                                            label="Notificaciones" 
                                            onClick={() => handleNavigation("/rider/profile/notifications")} 
                                            isFirst
                                        />
                                        <MenuItem 
                                            icon={<div className="w-7 h-7 rounded-md bg-green-500 flex items-center justify-center"><Shield size={16} className="text-white" /></div>} 
                                            label="Centro de Seguridad" 
                                            onClick={() => handleNavigation("/rider/profile/security")} 
                                        />
                                    </div>
                                </div>

                                {/* Group 3: Support */}
                                <div className="bg-white dark:bg-[#111827] rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] dark:shadow-none border border-slate-200/60 dark:border-white/5 overflow-hidden">
                                    <MenuItem 
                                        icon={<div className="w-7 h-7 rounded-md bg-purple-500 flex items-center justify-center"><HelpCircle size={16} className="text-white" /></div>} 
                                        label="Soporte y Ayuda" 
                                        onClick={() => setShowSupport(true)} 
                                        isFirst
                                        isLast
                                    />
                                </div>
                                
                                {/* Action Group: Logout (Destructive Ghost Button) */}
                                <div className="mt-8 mb-4">
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full bg-rose-500/5 hover:bg-rose-500/10 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-[20px] shadow-sm border border-rose-500/20 py-3.5 text-center text-rose-600 dark:text-rose-400 font-semibold text-[16px] active:scale-[0.96] transition-all focus:outline-none flex items-center justify-center gap-2"
                                    >
                                        <User size={18} className="opacity-50" />
                                        Cerrar Sesión
                                    </button>
                                </div>
                            </div>
                            
                            <div className="text-center opacity-40 dark:opacity-30 py-2">
                                <p className="text-[12px] font-medium tracking-wide dark:text-slate-400">Repaart Mobile v4.3.0</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-[#111827] rounded-[20px] shadow-sm border border-slate-200/60 dark:border-white/5 p-4 sm:p-6 min-h-[50vh] animate-in fade-in slide-in-from-right-4 duration-300">
                            <button 
                                onClick={() => setShowSupport(false)}
                                className="mb-6 flex items-center gap-1.5 text-blue-500 dark:text-blue-400 hover:text-blue-600 transition-colors font-medium text-[16px] active:scale-95 origin-left"
                            >
                                <ChevronRight size={22} className="rotate-180" />
                                Volver
                            </button>
                            <RiderSupport skills={((user as { skills?: string[] })?.skills) || []} />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

// --- PRIVATE HELPERS ---

const LoaderScreen = () => (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] dark:bg-[#0B0F19]">
        <Loader2 className="animate-spin text-slate-300 dark:text-slate-600" size={32} />
    </div>
);

const MenuItem = ({ icon, label, onClick, isFirst, isLast }: { icon: React.ReactNode; label: string; onClick: () => void; isFirst?: boolean; isLast?: boolean }) => (
    <button
        onClick={onClick}
        className={`group w-full flex items-center justify-between px-4 py-3.5 bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 transition-colors ${isFirst ? 'rounded-t-[20px]' : ''} ${isLast ? 'rounded-b-[20px]' : ''}`}
    >
        <div className="flex items-center gap-4">
            {icon}
            <span className="font-medium text-slate-900 dark:text-white text-[16px]">{label}</span>
        </div>
        <ChevronRight size={20} className="text-slate-300 dark:text-slate-600 group-active:translate-x-1 transition-transform" />
    </button>
);

export default RiderProfileView;