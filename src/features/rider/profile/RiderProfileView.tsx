import React, { useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRiderStore } from '../../../store/useRiderStore';
import { User, LogOut, ChevronRight, Bell, Shield, HelpCircle, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

export const RiderProfileView: React.FC = () => {
    const { user, logout } = useAuth();
    const { myShifts, fetchMyShifts } = useRiderStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.uid) {
            fetchMyShifts(user.uid);
        }
    }, [user, fetchMyShifts]);

    const stats = useMemo(() => {
        const now = new Date();
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const end = endOfWeek(now, { weekStartsOn: 1 });

        const currentShifts = myShifts.filter(s =>
            isWithinInterval(new Date(s.startAt), { start, end })
        );

        const totalHours = currentShifts.reduce((acc, s) => {
            const duration = new Date(s.endAt).getTime() - new Date(s.startAt).getTime();
            return acc + (duration / (1000 * 60 * 60));
        }, 0);

        return {
            hours: totalHours.toFixed(1),
            target: 40,
            percent: Math.min((totalHours / 40) * 100, 100)
        };
    }, [myShifts]);

    const handleNavigation = (path: string) => {
        navigate(path);
    };

    const handleSupport = () => {
        window.open('mailto:soporte@repaart.com', '_blank');
    };

    const handleLogout = async () => {
        if (confirm('¿Cerrar sesión?')) {
            await logout();
            navigate('/login');
        }
    };

    return (
        <div className="flex flex-col gap-12 py-6">
            {/* Header Area */}
            <div className="text-center py-4">
                <div className="flex flex-col items-center gap-8">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden ring-4 ring-white/5">
                            {user?.photoURL ? (
                                <img src={user.photoURL || ''} alt={user.displayName || 'Avatar'} className="w-full h-full object-cover" />
                            ) : (
                                <User size={56} className="text-slate-800" />
                            )}
                        </div>
                        <div className="absolute bottom-2 right-2 w-7 h-7 bg-emerald-500 border-4 border-slate-950 rounded-full shadow-lg" />
                    </div>

                    <div>
                        <h2 className="text-apple-h1">{user?.displayName || 'Rider'}</h2>
                        <span className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-500/10 px-6 py-2 rounded-full mt-4 inline-block border border-emerald-500/20 shadow-lg">
                            {user?.role === 'rider' ? 'PROFESIONAL LOGÍSTICA' : user?.role || 'Rider'}
                        </span>
                    </div>
                </div>

                {/* OPERATIONS SUMMARY */}
                <div className="px-6 mt-10">
                    <div className="glass-premium rounded-[2rem] p-6 relative overflow-hidden">
                        <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-emerald-400" />

                        <div className="flex justify-between items-end mb-6">
                            <div className="flex flex-col items-start gap-1">
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={12} /> Rendimiento Semanal
                                </span>
                                <span className="text-2xl font-bold text-white tracking-tighter">
                                    {stats.hours}
                                    <span className="text-lg text-slate-500 font-bold ml-1">/{stats.target}h</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-white/5">
                                <TrendingUp size={14} className="text-emerald-400" />
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">En Curso</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                <span>Progreso</span>
                                <span>{stats.percent.toFixed(0)}%</span>
                            </div>
                            <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-all duration-1000"
                                    style={{ width: `calc(${stats.percent} * 1%)` } as any}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu Sections */}
            <div className="space-y-10">
                {/* Account Settings */}
                <div className="space-y-4">
                    <h3 className="text-apple-sub px-6">Configuración de cuenta</h3>
                    <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-xl">
                        <MenuItem icon={<User size={20} />} label="Datos Personales" onClick={() => handleNavigation("/rider/profile/personal")} />
                        <MenuItem icon={<Bell size={20} />} label="Notificaciones" onClick={() => handleNavigation("/rider/profile/notifications")} />
                        <MenuItem icon={<Shield size={20} />} label="Seguridad y Acceso" onClick={() => handleNavigation("/rider/profile/security")} />
                    </div>
                </div>

                {/* Support & Others */}
                <div className="space-y-4">
                    <h3 className="text-apple-sub px-6">Soporte</h3>
                    <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-xl">
                        <MenuItem icon={<HelpCircle size={20} />} label="Centro de Ayuda" onClick={handleSupport} />
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between p-8 rounded-[2.5rem] bg-rose-500/5 border border-rose-500/10 text-rose-400 font-black uppercase text-xs tracking-[0.2em] transition-all active:scale-[0.98] shadow-lg group"
                >
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-500">
                            <LogOut size={24} />
                        </div>
                        <span className="group-hover:translate-x-1 transition-transform">Cerrar Sesión</span>
                    </div>
                    <ChevronRight size={20} className="opacity-30 group-hover:opacity-100 transition-opacity" />
                </button>

                <div className="flex flex-col items-center py-12 opacity-10">
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
        className="w-full flex items-center justify-between p-8 px-10 border-b border-white/5 last:border-0 hover:bg-white/5 transition-all group"
    >
        <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-slate-700 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all border border-white/5 shadow-inner">
                {icon}
            </div>
            <span className="font-black text-slate-400 group-hover:text-white transition-colors uppercase tracking-[0.15em] text-[11px]">{label}</span>
        </div>
        <ChevronRight size={18} className="text-slate-800 group-hover:text-slate-400 transition-all group-hover:translate-x-1" />
    </button>
);
