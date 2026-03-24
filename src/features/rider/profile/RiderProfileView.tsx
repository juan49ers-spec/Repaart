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
        <div className="min-h-[calc(100vh-64px)] overflow-y-auto bg-[#f5f5f7] pb-24 font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif]">
            
            <div className="max-w-md mx-auto px-5 py-6 flex flex-col gap-6">
                
                {/* HERO SECTION */}
                {!showSupport && (
                    <header className="flex flex-col items-center mt-6 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                        <div className="relative mb-5">
                            <div className="w-[104px] h-[104px] rounded-full overflow-hidden bg-white shadow-sm border border-slate-200/60 p-1">
                                <div className="w-full h-full rounded-full overflow-hidden bg-slate-100">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-3xl font-medium text-slate-500">
                                            {user.email?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <h1 className="text-[26px] font-bold text-slate-900 tracking-tight leading-tight">
                            {user.displayName || 'Rider Profesional'}
                        </h1>
                        <p className="text-[14px] font-medium text-slate-500 mt-1">
                            {user.email}
                        </p>
                    </header>
                )}

                {/* CONTENT AREA */}
                <main className="animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
                    
                    {!showSupport ? (
                        <div className="space-y-6">
                            
                            {/* Stats Overview Card */}
                            <section className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-[#e5e5ea] overflow-hidden">
                                <div className="p-5">
                                    {isLoading ? (
                                        <div className="h-32 flex items-center justify-center">
                                            <Loader2 className="animate-spin text-slate-300" size={24} />
                                        </div>
                                    ) : (
                                        <RiderStatsOverview myShifts={myShifts} />
                                    )}
                                </div>
                            </section>

                            {/* Settings Groups */}
                            <div className="space-y-5">
                                {/* Group 1: General Info */}
                                <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-[#e5e5ea] overflow-hidden">
                                    <div className="divide-y divide-slate-100">
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
                                <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-[#e5e5ea] overflow-hidden">
                                    <div className="divide-y divide-slate-100">
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
                                <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-[#e5e5ea] overflow-hidden">
                                    <MenuItem 
                                        icon={<div className="w-7 h-7 rounded-md bg-purple-500 flex items-center justify-center"><HelpCircle size={16} className="text-white" /></div>} 
                                        label="Soporte y Ayuda" 
                                        onClick={() => setShowSupport(true)} 
                                        isFirst
                                        isLast
                                    />
                                </div>
                                
                                {/* Action Group: Logout */}
                                <div className="mt-8 mb-4">
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-[#e5e5ea] py-3.5 text-center text-rose-500 font-medium text-[16px] active:scale-[0.98] transition-all focus:outline-none"
                                    >
                                        Cerrar Sesión
                                    </button>
                                </div>
                            </div>
                            
                            <div className="text-center opacity-40 py-2">
                                <p className="text-[12px] font-medium tracking-wide">Repaart Mobile v4.3.0</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[20px] shadow-sm border border-[#e5e5ea] p-4 sm:p-6 min-h-[50vh] animate-in fade-in slide-in-from-right-4 duration-300">
                            <button 
                                onClick={() => setShowSupport(false)}
                                className="mb-6 flex items-center gap-1.5 text-blue-500 hover:text-blue-600 transition-colors font-medium text-[16px] active:scale-95 origin-left"
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
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <Loader2 className="animate-spin text-slate-300" size={32} />
    </div>
);

const MenuItem = ({ icon, label, onClick, isFirst, isLast }: { icon: React.ReactNode; label: string; onClick: () => void; isFirst?: boolean; isLast?: boolean }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-4 py-3.5 bg-white hover:bg-slate-50 active:bg-slate-100 transition-colors ${isFirst ? 'rounded-t-[20px]' : ''} ${isLast ? 'rounded-b-[20px]' : ''}`}
    >
        <div className="flex items-center gap-4">
            {icon}
            <span className="font-medium text-slate-900 text-[16px]">{label}</span>
        </div>
        <ChevronRight size={20} className="text-slate-300" />
    </button>
);

export default RiderProfileView;