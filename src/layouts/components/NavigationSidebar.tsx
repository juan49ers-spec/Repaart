import React from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { RepaartLogo } from '../../components/common/RepaartLogo';
import UserMenu from './UserMenu';
import ThemeToggle from '../../components/ui/buttons/ThemeToggle';
import { adminNavItems, franchiseNavItems } from '../constants/navigation';

interface NavigationSidebarProps {
    isAdmin: boolean;
    isFranchise: boolean;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ isAdmin, isFranchise }) => {
    const { isSidebarOpen, toggleSidebar } = useAppStore();

    const onClose = () => toggleSidebar(false);

    const navItems = isAdmin ? adminNavItems : isFranchise ? franchiseNavItems : [];

    return (
        <div
            className={`
                fixed inset-y-0 left-0 z-50 transform transition-all duration-500 cubic-bezier(0.25, 0.8, 0.25, 1) px-4 py-6
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
        >
            {/* Glass Dock Container */}
            <div className="h-full w-72 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-3xl flex flex-col overflow-hidden relative">

                {/* Decorative gradients */}
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-blue-500/10 to-transparent pointer-events-none" />

                {/* Header */}
                <div className="flex-none flex items-center justify-between p-6 pb-2 relative z-10">
                    <RepaartLogo
                        className="h-10 w-auto text-slate-900 dark:text-white drop-shadow-sm"
                        interactive
                    />
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors backdrop-blur-md"
                        aria-label="Cerrar menú"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1 my-2 scrollbar-hide">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            className={({ isActive }) => `
                                relative group flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300
                                ${isActive
                                    ? 'text-white'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }
                            `}
                        >
                            {({ isActive }) => (
                                <>
                                    {/* Active "Glow Orb" Background */}
                                    {isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30 -z-10 animate-in fade-in zoom-in-95 duration-200" />
                                    )}

                                    {/* Hover "Glass" Background */}
                                    {!isActive && (
                                        <div className="absolute inset-0 bg-slate-100/0 group-hover:bg-slate-100/50 dark:group-hover:bg-slate-800/50 rounded-2xl -z-10 transition-colors duration-200" />
                                    )}

                                    <item.icon className={`
                                        w-5 h-5 transition-transform duration-300 group-hover:scale-110
                                        ${isActive ? 'text-white/90 drop-shadow-sm' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}
                                    `} />
                                    <span className="font-semibold tracking-wide text-sm">{item.label}</span>

                                    {/* Active Indicator Dot */}
                                    {isActive && (
                                        <div className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="flex-none p-4 mx-2 mb-2 bg-gradient-to-br from-white/40 to-white/10 dark:from-slate-800/40 dark:to-slate-900/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm relative z-10">
                    <div className="flex items-center justify-between">
                        <UserMenu placement="top" />
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200/20 dark:border-slate-700/30">
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NavigationSidebar;
