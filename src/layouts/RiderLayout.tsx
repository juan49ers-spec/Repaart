import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, User, LayoutDashboard } from 'lucide-react';
import { useRiderStore } from '../store/useRiderStore';

export const RiderLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { myShifts } = useRiderStore();

    const activeShift = React.useMemo(() => {
        const now = new Date();
        return myShifts.find(s => {
            const start = new Date(s.startAt);
            const end = new Date(s.endAt);
            return now >= start && now <= end;
        });
    }, [myShifts]);

    const isActive = (path: string) => location.pathname === path;
    const isWorking = !!activeShift;

    return (
        <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 overflow-hidden relative selection:bg-emerald-500/30">
            {/* ATMOSPHERIC ORBS */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div
                    className={`absolute -top-24 -left-24 w-96 h-96 blur-[120px] rounded-full animate-orb transition-colors duration-1000 opacity-20
                        ${isWorking ? 'bg-emerald-500/40' : 'bg-blue-500/30'}`}
                />
                <div
                    className={`absolute top-1/2 -right-24 w-80 h-80 blur-[100px] rounded-full animate-orb transition-colors duration-1000 opacity-10 [animation-delay:2s]
                        ${isWorking ? 'bg-emerald-400/30' : 'bg-slate-500/20'}`}
                />
                <div
                    className={`absolute -bottom-24 left-1/4 w-96 h-96 blur-[120px] rounded-full animate-orb transition-colors duration-1000 opacity-20 [animation-delay:4s]
                        ${isWorking ? 'bg-emerald-600/40' : 'bg-indigo-500/30'}`}
                />
            </div>

            {/* Safe Area Top Spacer */}
            <div className="h-safe w-full bg-slate-950/20 backdrop-blur-sm sticky top-0 z-[60]" />

            {/* Main Content Area - Scrollable */}
            <main className="flex-1 relative overflow-y-auto overflow-x-hidden hide-scrollbar z-10">
                <div className="max-w-md mx-auto w-full min-h-full pb-safe px-4">
                    <div className="pt-4 pb-48">
                        <Outlet />
                    </div>
                </div>
            </main>

            {/* Bottom Navigation Bar - Floating Dock style */}
            <div className="fixed bottom-8 left-0 right-0 z-50 px-6">
                <nav className="max-w-md mx-auto glass-premium rounded-full p-2 py-3 px-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="flex justify-around items-center">
                        {/* Home Tab */}
                        <button
                            onClick={() => navigate('/rider/dashboard')}
                            className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-500 ${isActive('/rider/dashboard')
                                ? 'bg-emerald-500/10 text-emerald-400 scale-110'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                            title="Inicio"
                        >
                            <LayoutDashboard size={22} strokeWidth={isActive('/rider/dashboard') ? 2.5 : 2} />
                        </button>

                        {/* Agenda Tab */}
                        <button
                            onClick={() => navigate('/rider/schedule')}
                            className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-500 ${isActive('/rider/schedule')
                                ? 'bg-emerald-500/10 text-emerald-400 scale-110'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                            title="Agenda"
                        >
                            <Calendar size={22} strokeWidth={isActive('/rider/schedule') ? 2.5 : 2} />
                        </button>

                        {/* Profile Tab */}
                        <button
                            onClick={() => navigate('/rider/profile')}
                            className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-500 ${isActive('/rider/profile')
                                ? 'bg-emerald-500/10 text-emerald-400 scale-110'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                            title="Perfil"
                        >
                            <User size={22} strokeWidth={isActive('/rider/profile') ? 2.5 : 2} />
                        </button>
                    </div>
                </nav>
            </div>
        </div>
    );
};
