import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Settings, LogOut } from 'lucide-react';
import { RepaartLogo } from '../../components/common/RepaartLogo';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../context/AuthContext';
import { adminNavItems, franchiseNavItems } from '../constants/navigation';

export interface HeaderProps {
    isAdmin: boolean;
    isFranchise: boolean;
    targetFranchiseName?: string;
    onExport?: () => void;
    onOpenHelp?: (id: string) => void;
}

const Header: React.FC<HeaderProps> = ({ isAdmin, isFranchise }) => {
    const { toggleSidebar } = useAppStore();
    const { logout } = useAuth();
    const navigate = useNavigate();

    const navItems = isAdmin ? adminNavItems : isFranchise ? franchiseNavItems : [];

    // Filter out duplicate Settings from the main list if present, to add it manually at the end
    const filteredNavItems = navItems.filter(item => item.path !== '/profile');

    const handleLogout = async () => {
        if (window.confirm('¿Cerrar sesión?')) {
            await logout();
            navigate('/login');
        }
    };

    return (
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl w-full transition-colors duration-300">
            <div className="max-w-[1920px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-4">

                {/* LEFT: Logo & Mobile Burger */}
                <div className="flex items-center gap-4">
                    {/* Mobile Hamburger */}
                    <button
                        onClick={() => toggleSidebar()}
                        className="hidden xl:hidden group p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 focus:outline-none"
                    >
                        <div className="flex flex-col gap-[5px] w-5">
                            <span className="w-full h-[2px] bg-slate-600 dark:text-white rounded-full transition-all group-hover:bg-indigo-600 group-hover:w-4 ml-auto"></span>
                            <span className="w-full h-[2px] bg-slate-600 dark:text-white rounded-full transition-all group-hover:bg-indigo-600"></span>
                            <span className="w-full h-[2px] bg-slate-600 dark:text-white rounded-full transition-all group-hover:bg-indigo-600 group-hover:w-3 ml-auto"></span>
                        </div>
                    </button>

                    <div className="flex items-center gap-3">
                        <RepaartLogo
                            className="h-10 lg:h-9 w-auto text-slate-700 dark:text-slate-200"
                            interactive
                        />
                    </div>
                </div>

                {/* CENTER: Desktop Horizontal Navigation */}
                {/* CENTER: Desktop Horizontal Navigation */}
                {/* CENTER: Desktop Horizontal Navigation (Premium Glass Dock) */}
                <nav className="hidden items-center gap-1 justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-full px-2 py-1.5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] mx-auto">
                    {filteredNavItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                group relative flex items-center justify-center gap-0 px-3 py-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] border border-transparent z-0
                                ${isActive
                                    ? 'bg-indigo-500 text-white shadow-[0_4px_12px_-2px_rgba(99,102,241,0.4)] ring-1 ring-white/20' // Active: Solid Indigo Pill with Glow
                                    : 'text-slate-500 hover:text-indigo-600 hover:bg-white/80 hover:shadow-sm'
                                }
                            `}
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                            <span className={`
                                overflow-hidden whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] max-w-0 opacity-0
                                group-hover:max-w-[120px] group-hover:opacity-100 group-hover:ml-2 group-hover:pr-1
                            `}>
                                {item.label}
                            </span>
                        </NavLink>
                    ))}

                    <div className="w-px h-5 bg-slate-300/50 mx-1.5" />

                    {/* Settings */}
                    <NavLink
                        to="/profile"
                        className={({ isActive }) => `
                            group relative flex items-center justify-center gap-0 px-3 py-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] border border-transparent z-0
                             ${isActive
                                ? 'bg-indigo-500 text-white shadow-[0_4px_12px_-2px_rgba(99,102,241,0.4)] ring-1 ring-white/20'
                                : 'text-slate-400 hover:text-slate-700 hover:bg-white/80 hover:shadow-sm'
                            }
                        `}
                    >
                        <Settings className="w-5 h-5 flex-shrink-0 transition-transform duration-500 group-hover:rotate-90" />
                        <span className="overflow-hidden whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 group-hover:ml-2 group-hover:pr-1">
                            Configuración
                        </span>
                    </NavLink>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="group relative flex items-center justify-center gap-0 px-3 py-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:shadow-sm border border-transparent transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] z-0"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:-translate-x-0.5" />
                        <span className="overflow-hidden whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 group-hover:ml-2 group-hover:pr-1">
                            Salir
                        </span>
                    </button>
                </nav>

                {/* RIGHT: Plain Spacer (formerly held tools) */}
                <div className="hidden lg:block w-8" />

                {/* Mobile Right Spacer (to balance logo) */}
                <div className="lg:hidden w-8" />
            </div>
        </header>
    );
};

export default Header;
