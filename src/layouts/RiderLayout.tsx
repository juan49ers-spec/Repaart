import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, User, LayoutDashboard, Bot } from 'lucide-react';

export const RiderLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex flex-col h-[100dvh] w-full bg-[#f4f7fb] text-slate-900 overflow-hidden relative selection:bg-cyan-500/30">
            {/* Safe Area Top Spacer */}
            <div className="h-safe w-full bg-[#f4f7fb]/80 backdrop-blur-md sticky top-0 z-[60]" />

            {/* Main Content Area - Scrollable */}
            <main className="flex-1 min-h-0 relative overflow-y-auto overflow-x-hidden hide-scrollbar z-10">
                <div className="max-w-md mx-auto w-full min-h-full pb-safe px-0">
                    <div className="pb-40">
                        <Outlet />
                    </div>
                </div>
            </main>

            {/* Bottom Navigation Bar - Floating Neumorphic Pill */}
            <div className="absolute bottom-8 left-0 right-0 z-50 px-6 pointer-events-none">
                <nav className="max-w-md mx-auto bg-white rounded-[2.5rem] p-2 shadow-[0_8px_30px_rgb(0,0,0,0.06)] pointer-events-auto border border-white/60">
                    <div className="flex justify-around items-center h-16">
                        {/* Home Tab */}
                        <button
                            onClick={() => navigate('/rider/dashboard')}
                            className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                                isActive('/rider/dashboard')
                                    ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-md shadow-cyan-500/20 scale-105'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                            title="Inicio"
                        >
                            <LayoutDashboard size={22} strokeWidth={isActive('/rider/dashboard') ? 2.5 : 2} />
                        </button>

                        {/* Agenda Tab */}
                        <button
                            onClick={() => navigate('/rider/schedule')}
                            className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                                isActive('/rider/schedule')
                                    ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-md shadow-cyan-500/20 scale-105'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                            title="Agenda"
                        >
                            <Calendar size={22} strokeWidth={isActive('/rider/schedule') ? 2.5 : 2} />
                        </button>

                        {/* Profile Tab */}
                        <button
                            onClick={() => navigate('/rider/profile')}
                            className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                                isActive('/rider/profile')
                                    ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-md shadow-cyan-500/20 scale-105'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                            title="Perfil"
                        >
                            <User size={22} strokeWidth={isActive('/rider/profile') ? 2.5 : 2} />
                        </button>

                        {/* Asesor Tab */}
                        <button
                            onClick={() => navigate('/rider/advisor')}
                            className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-500 ${isActive('/rider/advisor')
                                ? 'bg-orange-500/10 text-orange-400 scale-110'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                            title="Asesor IA"
                        >
                            <Bot size={22} strokeWidth={isActive('/rider/advisor') ? 2.5 : 2} />
                        </button>
                    </div>
                </nav>
            </div>
        </div>
    );
};
