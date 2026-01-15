import React from 'react';
import { useLocation } from 'react-router-dom';
import logo from '../../assets/logo.jpg';
import { LogOut } from 'lucide-react';
import UserMenu from './UserMenu';
import ThemeToggle from '../../ui/buttons/ThemeToggle';
import { useAppStore } from '../../store/useAppStore';

export interface HeaderProps {
    isAdmin: boolean;
    isFranchise: boolean;
    targetFranchiseName?: string;
    onLogout: () => void;
    onExport?: () => void;
    onOpenHelp?: (id: string) => void;
}

const Header: React.FC<HeaderProps> = ({
    onLogout
}) => {
    const { toggleSidebar } = useAppStore();
    const location = useLocation();

    const getTitle = () => {
        if (location.pathname.includes('/dashboard')) return 'Finanzas';
        if (location.pathname.includes('/operations')) return 'Horarios';
        if (location.pathname.includes('/academy')) return 'Academia';
        if (location.pathname.includes('/kanban')) return 'Kanban';
        if (location.pathname.includes('/profile')) return 'Configuración';
        if (location.pathname.includes('/resources')) return 'Recursos';
        if (location.pathname.includes('/support')) return 'Soporte';
        if (location.pathname.includes('/users')) return 'Usuarios';
        return 'Panel de Control';
    };

    return (
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl w-full transition-colors duration-300">
            <div className="max-w-[1920px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-4">

                {/* LEFT: Premium Aesthetics */}
                <div className="flex items-center gap-2 lg:gap-4">
                    {/* Modern Hamburger - Ghost Style */}
                    <button
                        onClick={() => toggleSidebar()}
                        className="group p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        title="Menú Principal"
                    >
                        <div className="flex flex-col gap-[5px] w-5">
                            <span className="w-full h-[2px] bg-slate-600 dark:text-white rounded-full transition-all group-hover:bg-indigo-600 group-hover:w-4 ml-auto"></span>
                            <span className="w-full h-[2px] bg-slate-600 dark:text-white rounded-full transition-all group-hover:bg-indigo-600"></span>
                            <span className="w-full h-[2px] bg-slate-600 dark:text-white rounded-full transition-all group-hover:bg-indigo-600 group-hover:w-3 ml-auto"></span>
                        </div>
                    </button>

                    {/* Logo & Brand Lockup */}
                    <div className="flex items-center gap-3">
                        {/* Logo Icon */}
                        <img
                            src={logo}
                            alt="Repaart"
                            className="h-9 w-auto object-contain rounded-lg shadow-sm"
                        />

                        {/* Divider - Visual Separator */}
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

                        {/* Section Title */}
                        <h1 className="text-lg font-medium text-slate-700 dark:text-slate-200 tracking-tight">
                            {getTitle()}
                        </h1>
                    </div>
                </div>

                {/* RIGHT: Tools (Minimalist) */}
                <div className="flex items-center gap-3">
                    <ThemeToggle />

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

                    <UserMenu />

                    {/* Logout */}
                    <button
                        onClick={() => {
                            if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                                onLogout();
                            }
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all active:scale-95 text-xs font-bold uppercase tracking-wider"
                        title="Cerrar Sesión"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:block">Salir</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
