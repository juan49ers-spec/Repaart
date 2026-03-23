import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRiderStore } from '../../../store/useRiderStore';
import { useRiderPreferences } from '../hooks/useRiderPreferences';
import { 
    User, LogOut, ChevronRight, Bell, Shield, HelpCircle, Calendar, 
    Smartphone, Volume2, Loader2, Award,
    Mail, MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RiderStatsOverview from './components/RiderStatsOverview';
import RiderQuickActions from './components/RiderQuickActions';
import RiderPreferences from './components/RiderPreferences';
import RiderSupport from './components/RiderSupport';

/**
 * RiderProfileView: Redesign Pro-Max
 * Estilo "Clean Apple" con Mesh Gradient y Glassmorphism.
 * Versión estabilizada.
 */
export const RiderProfileView: React.FC = () => {
    const { user, logout, roleConfig } = useAuth();
    const { myShifts, fetchMyShifts, isLoading } = useRiderStore();
    const { 
        preferences: userPreferences, 
        loading: preferencesLoading, 
        updateNotificationPreference 
    } = useRiderPreferences();
    
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('perfil');

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

    // Dynamic Notifications Count
    const pendingNotifications = 0; // Placeholder

    if (!user) return <LoaderScreen />;

    return (
        <div className="relative min-h-[calc(100vh-64px)] overflow-y-auto bg-slate-50/50 pb-20">
            {/* --- PRO DESIGN: MESH GRADIENT & BACKGROUND --- */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-5%] right-[-10%] w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] md:w-[500px] md:h-[500px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] md:w-[600px] md:h-[600px] bg-sky-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
                
                {/* --- HERO SECTION --- */}
                <header className="flex flex-col md:flex-row items-center md:items-end gap-6 pb-2 border-b border-slate-200/50">
                    <div className="relative group perspective-1000">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-500 to-sky-500 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
                        <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-3xl font-black text-slate-300">
                                    {user.email?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-lg" />
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-1">
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">
                            {user.displayName || 'Rider Profesional'}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200/50">
                                <Mail size={12} className="text-slate-400" />
                                <span>{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-500/5 px-3 py-1.5 rounded-full border border-emerald-500/10 text-emerald-600">
                                <Award size={12} />
                                <span>{roleConfig?.role === 'rider' ? 'RIDER ELITE' : 'OPERATIVO'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleLogout}
                            className="p-3 bg-white hover:bg-rose-50 text-rose-500 border border-slate-200 rounded-2xl shadow-sm transition-all active:scale-95"
                            title="Cerrar Sesión"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>

                {/* --- NAVIGATION DOCK --- */}
                <nav className="sticky top-4 z-40 bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-slate-200/30 rounded-2xl p-1.5 flex items-center gap-1 max-w-fit mx-auto md:mx-0">
                    <NavButton active={activeTab === 'perfil'} onClick={() => setActiveTab('perfil')} icon={User} label="Dashboard" />
                    <NavButton active={activeTab === 'soporte'} onClick={() => setActiveTab('soporte')} icon={Award} label="Academia" />
                    <NavButton 
                        active={activeTab === 'notificaciones'} 
                        onClick={() => setActiveTab('notificaciones')} 
                        icon={Bell} 
                        label="Alertas" 
                        count={pendingNotifications} 
                    />
                    <NavButton active={activeTab === 'seguridad'} onClick={() => setActiveTab('seguridad')} icon={Shield} label="Seguridad" />
                </nav>

                {/* --- CONTENT AREA --- */}
                <main className="animate-in fade-in slide-in-from-bottom-8 duration-500 ease-out">
                    
                    {activeTab === 'perfil' && (
                        <div className="space-y-8">
                            {/* Performance Stats */}
                            <section className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
                                <div className="p-1 border-b border-slate-100 bg-slate-50/50">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-6 py-2">Métricas de Operación</h2>
                                </div>
                                <div className="p-6 md:p-8">
                                    {isLoading ? (
                                        <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>
                                    ) : (
                                        <RiderStatsOverview myShifts={myShifts} />
                                    )}
                                </div>
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Quick Access */}
                                <div className="md:col-span-2 space-y-6">
                                    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                            <Calendar size={14} /> Accesos Rápidos
                                        </h3>
                                        <RiderQuickActions actions={[
                                            { id: 'turnos', label: 'Ver Horarios', icon: Calendar, onClick: () => handleNavigation('/rider/schedule') },
                                            { id: 'disponibilidad', label: 'Mi Disponibilidad', icon: MapPin, onClick: () => handleNavigation('/rider/availability') },
                                        ]} />
                                    </div>

                                    {/* Settings Groups */}
                                    <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                                        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Personalización</h3>
                                        </div>
                                        <MenuItem icon={<User size={18} />} label="Datos de contacto" desc="Email, teléfono y dirección" onClick={() => handleNavigation("/rider/profile/personal")} />
                                        <MenuItem icon={<Bell size={18} />} label="Preferencias de mensajería" desc="Control de notificaciones push/email" onClick={() => handleNavigation("/rider/profile/notifications")} />
                                        <MenuItem icon={<Shield size={18} />} label="Centro de seguridad" desc="Contraseña y verificaciones" onClick={() => handleNavigation("/rider/profile/security")} />
                                    </div>
                                </div>

                                {/* Sidebar Info */}
                                <aside className="space-y-6">
                                    <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 transition-all group-hover:scale-150" />
                                        <HelpCircle className="text-emerald-400 mb-4" size={32} />
                                        <h4 className="font-black text-xl mb-2">Canal de Soporte</h4>
                                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">¿Tienes algún problema con un turno o vehículo? Estamos aquí para ayudarte 24/7.</p>
                                        <button 
                                            onClick={() => setActiveTab('soporte')}
                                            className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-colors"
                                        >
                                            Contactar ahora
                                        </button>
                                    </div>

                                    <div className="text-center opacity-40 py-4">
                                        <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1">Repaart Mobile</p>
                                        <p className="text-[9px] font-bold">Build v4.2.0 Stable</p>
                                    </div>
                                </aside>
                            </div>
                        </div>
                    )}

                    {activeTab === 'soporte' && (
                        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-8">
                            <RiderSupport skills={((user as { skills?: string[] })?.skills) || []} />
                        </div>
                    )}

                    {activeTab === 'notificaciones' && (
                        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-8">
                            {preferencesLoading ? (
                                <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-emerald-500" /></div>
                            ) : (
                                <RiderPreferences 
                                    preferences={[
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
                                            label: 'Canal Crítico SMS',
                                            icon: Smartphone,
                                            enabled: userPreferences?.notifications.newShift ?? true,
                                            onChange: (enabled) => updateNotificationPreference('newShift', enabled),
                                        },
                                    ]} 
                                />
                            )}
                        </div>
                    )}

                    {activeTab === 'seguridad' && (
                         <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-8">
                            <div className="text-center py-10 space-y-4">
                                <Shield size={48} className="mx-auto text-slate-300" />
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Opciones de Seguridad</h3>
                                <p className="text-slate-500 max-w-sm mx-auto">Gestiona tu acceso y protege tu cuenta desde aquí.</p>
                                <button 
                                    onClick={() => handleNavigation("/rider/profile/security")}
                                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                                >
                                    Abrir Panel
                                </button>
                            </div>
                         </div>
                    )}
                </main>
            </div>
        </div>
    );
};

// --- PRIVATE HELPERS ---

const LoaderScreen = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
            <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 animate-pulse" />
                <Loader2 className="animate-spin text-emerald-500 relative" size={40} />
            </div>
            <div className="text-slate-400 font-black uppercase text-[10px] tracking-[0.4em]">Cargando Dashboard...</div>
        </div>
    </div>
);

const NavButton = ({ active, onClick, icon: Icon, label, count = 0 }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string; count?: number }) => (
    <button
        onClick={onClick}
        className={`
            relative z-10 px-4 md:px-5 py-2.5 text-xs md:text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap duration-300
            ${active 
                ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}
        `}
    >
        <Icon className={`w-3.5 h-3.5 ${active ? 'text-emerald-400' : 'text-slate-400'}`} />
        <span className="hidden sm:inline">{label}</span>
        {count > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[8px] border-2 border-white shadow-lg">
                {count}
            </span>
        )}
    </button>
);

const MenuItem = ({ icon, label, desc, onClick }: { icon: React.ReactNode; label: string; desc: string; onClick: () => void }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center justify-between px-8 py-6 hover:bg-emerald-50/30 transition-all group border-b border-slate-50 last:border-0"
    >
        <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-emerald-500 group-hover:shadow-lg transition-all duration-300 border border-slate-100">
                {icon}
            </div>
            <div className="text-left">
                <p className="font-black text-slate-800 uppercase text-[10px] tracking-widest group-hover:text-emerald-600 transition-colors">{label}</p>
                <p className="text-xs text-slate-400 font-medium">{desc}</p>
            </div>
        </div>
        <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
    </button>
);