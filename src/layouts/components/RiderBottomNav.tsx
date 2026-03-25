import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, User, LayoutDashboard, Bot } from 'lucide-react';

// Haptic feedback simulator
const triggerHaptic = () => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50); // Light haptic feedback
    }
};

const NavButton = ({ 
    icon: Icon, 
    label, 
    isActive,
    onClick,
    isSpecial = false 
}: { 
    icon: any; 
    label: string; 
    isActive: boolean;
    onClick: () => void;
    isSpecial?: boolean;
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 select-none outline-none -webkit-tap-highlight-transparent ${
                isSpecial 
                    ? isActive 
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-[1.15]'
                        : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 hover:scale-105 active:scale-95'
                    : isActive
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-110'
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 active:bg-slate-200 dark:active:bg-slate-800 active:scale-95'
            }`}
            aria-label={label}
        >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'drop-shadow-sm' : ''} />
        </button>
    );
};

export const RiderBottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActiveCurrent = (path: string) => location.pathname === path;

    const navigateTo = (path: string) => {
        triggerHaptic();
        navigate(path);
    };

    return (
        <div className="fixed left-0 right-0 bottom-0 z-[100] pointer-events-none">
            <nav className="max-w-md mx-auto relative pointer-events-auto">
                {/* Background Glass Plate - Docked at the bottom */}
                <div className="absolute inset-x-0 bottom-0 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-xl border-t border-white/20 dark:border-white/10 rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.04)]"
                     style={{ height: 'calc(68px + env(safe-area-inset-bottom, 0px))' }} />
                
                {/* Icons Container - Properly centered above safe area */}
                <div className="relative flex justify-around items-center h-[68px] px-4" 
                     style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                    <NavButton onClick={() => navigateTo('/rider/dashboard')} isActive={isActiveCurrent('/rider/dashboard')} icon={LayoutDashboard} label="Inicio" />
                    <NavButton onClick={() => navigateTo('/rider/schedule')} isActive={isActiveCurrent('/rider/schedule')} icon={Calendar} label="Agenda" />
                    <NavButton onClick={() => navigateTo('/rider/advisor')} isActive={isActiveCurrent('/rider/advisor')} icon={Bot} label="Asesor IA" isSpecial />
                    <NavButton onClick={() => navigateTo('/rider/profile')} isActive={isActiveCurrent('/rider/profile')} icon={User} label="Perfil" />
                </div>
            </nav>
        </div>
    );
};
