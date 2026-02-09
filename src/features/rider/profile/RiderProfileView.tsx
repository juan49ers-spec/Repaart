import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRiderStore } from '../../../store/useRiderStore';
import { useRiderPreferences } from '../hooks/useRiderPreferences';
import { User, LogOut, ChevronRight, Bell, Shield, HelpCircle, Clock, Calendar, Smartphone, Volume2, Loader2, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RiderStatsOverview from './components/RiderStatsOverview';
import RiderHeader from './components/RiderHeader';
import RiderTabs, { RiderTab } from './components/RiderTabs';
import RiderQuickActions, { QuickAction } from './components/RiderQuickActions';
import RiderPreferences, { NotificationPreference } from './components/RiderPreferences';
import RiderSupport from './components/RiderSupport';

export const RiderProfileView: React.FC = () => {
    const { user, logout } = useAuth();
    const { myShifts, fetchMyShifts, isLoading } = useRiderStore();
    const { preferences: userPreferences, loading: preferencesLoading, updateNotificationPreference } = useRiderPreferences();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('perfil');
    const [loadError, setLoadError] = useState<string | null>(null);
    const [loadTimeout, setLoadTimeout] = useState(false);

    useEffect(() => {
        if (user?.uid) {
            setLoadError(null);
            setLoadTimeout(false);

            const timeoutId = setTimeout(() => {
                if (isLoading) {
                    setLoadError('Tiempo de espera agotado al cargar turnos');
                    setLoadTimeout(true);
                }
            }, 5000);

            fetchMyShifts(user.uid);

            return () => clearTimeout(timeoutId);
        }
    }, [user, fetchMyShifts]);

    const handleNavigation = (path: string) => {
        navigate(path);
    };

    const handleSupport = () => {
        setActiveTab('soporte');
    };

    const handleLogout = async () => {
        if (confirm('¿Cerrar sesión?')) {
            await logout();
            navigate('/login');
        }
    };

    const tabs: RiderTab[] = [
        { id: 'perfil', label: 'Perfil', icon: User },
        { id: 'soporte', label: 'Soporte y Habilidades', icon: Award },
        { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
        { id: 'seguridad', label: 'Seguridad', icon: Shield },
    ];

    const quickActions: QuickAction[] = [
        { id: 'turnos', label: 'Mis Turnos', icon: Calendar, onClick: () => handleNavigation('/rider/schedule') },
        { id: 'disponibilidad', label: 'Disponibilidad', icon: Clock, onClick: () => handleNavigation('/rider/availability') },
    ];

    const preferences: NotificationPreference[] = [
        {
            id: 'push',
            label: 'Notificaciones Push',
            icon: Bell,
            enabled: userPreferences?.notifications.push ?? true,
            onChange: (enabled) => updateNotificationPreference('push', enabled),
        },
        {
            id: 'email',
            label: 'Notificaciones Email',
            icon: Volume2,
            enabled: userPreferences?.notifications.email ?? false,
            onChange: (enabled) => updateNotificationPreference('email', enabled),
        },
        {
            id: 'sms',
            label: 'Notificaciones SMS',
            icon: Smartphone,
            enabled: userPreferences?.notifications.newShift ?? true,
            onChange: (enabled) => updateNotificationPreference('newShift', enabled),
        },
    ];

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col overflow-y-auto scroll-smooth pb-32">
            <div className="flex-1 px-6 py-8 space-y-8">
                {/* Always Show Header & Tabs */}
                <div className="text-center relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl" />
                    <div className="relative">
                        <RiderHeader
                            displayName={user?.displayName || undefined}
                            photoURL={user?.photoURL || undefined}
                            role={user?.role}
                            onEditProfile={() => handleNavigation("/rider/profile/personal")}
                            onSettings={() => handleNavigation("/rider/profile/security")}
                        />
                    </div>
                </div>

                <RiderTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

                {/* Content based on Active Tab */}
                {activeTab === 'perfil' && (
                    <>
                        {/* Loading / Error State for Shifts only affects Profile Dashboard */}
                        {isLoading && !loadTimeout && (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="animate-spin text-emerald-500" size={32} />
                            </div>
                        )}

                        {loadError && (
                            <div className="flex items-center justify-center py-6 px-4">
                                <div className="text-center">
                                    <p className="text-rose-500 font-bold mb-2 text-sm">{loadError}</p>
                                    <button
                                        onClick={() => {
                                            setLoadError(null);
                                            setLoadTimeout(false);
                                            if (user?.uid) fetchMyShifts(user.uid);
                                        }}
                                        className="px-4 py-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all text-xs uppercase font-bold tracking-wider"
                                    >
                                        Reintentar
                                    </button>
                                </div>
                            </div>
                        )}

                        {!isLoading && !loadError && (
                            <>
                                {/* OPERATIONS SUMMARY */}
                                <div className="relative">
                                    <RiderStatsOverview myShifts={myShifts} />
                                </div>

                                {/* Quick Actions */}
                                {quickActions.length > 0 && (
                                    <div>
                                        <RiderQuickActions actions={quickActions} />
                                    </div>
                                )}

                                {/* Menu Sections */}
                                <div className="space-y-6">
                                    {/* Account Settings */}
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 ml-2">Configuración de cuenta</h3>
                                        <div className="bg-slate-900/40 border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-md shadow-2xl">
                                            <MenuItem icon={<User size={20} />} label="Datos Personales" onClick={() => handleNavigation("/rider/profile/personal")} />
                                            <MenuItem icon={<Bell size={20} />} label="Notificaciones" onClick={() => handleNavigation("/rider/profile/notifications")} />
                                            <MenuItem icon={<Shield size={20} />} label="Seguridad y Acceso" onClick={() => handleNavigation("/rider/profile/security")} />
                                        </div>
                                    </div>

                                    {/* Support & Others */}
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 ml-2">Soporte</h3>
                                        <div className="bg-slate-900/40 border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-md shadow-2xl">
                                            <MenuItem icon={<HelpCircle size={20} />} label="Centro de Ayuda" onClick={handleSupport} />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Support Tab (Includes Skills) */}
                {activeTab === 'soporte' && (
                    <RiderSupport skills={(user as any)?.skills || []} />
                )}

                {/* Preferences */}
                {activeTab === 'notificaciones' && (
                    <div>
                        {preferencesLoading ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="animate-spin text-emerald-500" size={24} />
                            </div>
                        ) : (
                            <RiderPreferences preferences={preferences} />
                        )}
                    </div>
                )}
            </div>

            {/* Logout Button - Always visible at bottom or after error */}
            <div className="px-6 pb-6">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between p-6 px-8 rounded-[2rem] bg-rose-500/5 border border-rose-500/10 text-rose-400 font-black uppercase text-xs tracking-[0.2em] transition-all duration-300 active:scale-[0.98] shadow-xl hover:shadow-2xl hover:bg-rose-500/10 group"
                >
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300">
                            <LogOut size={24} />
                        </div>
                        <span className="group-hover:translate-x-1 transition-transform">Cerrar Sesión</span>
                    </div>
                    <ChevronRight size={20} className="opacity-30 group-hover:opacity-100 transition-opacity group-hover:translate-x-1" />
                </button>

                <div className="flex flex-col items-center py-8 opacity-10">
                    <p className="text-[10px] font-black tracking-[0.4em] uppercase">Project Cockpit</p>
                    <p className="text-[9px] font-bold mt-2">Sagan Build v3.12.2</p>
                </div>
            </div>
        </div>
    );
};

interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-6 px-8 border-b border-white/5 last:border-0 hover:bg-white/5 transition-all duration-300 group first:rounded-t-[2rem] last:rounded-b-[2rem]"
    >
        <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-slate-700 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all duration-300 border border-white/5 shadow-lg">
                {icon}
            </div>
            <span className="font-black text-slate-400 group-hover:text-white transition-colors uppercase tracking-[0.15em] text-[10px]">{label}</span>
        </div>
        <ChevronRight size={18} className="text-slate-800 group-hover:text-slate-400 transition-all duration-300 group-hover:translate-x-1" />
    </button>
);