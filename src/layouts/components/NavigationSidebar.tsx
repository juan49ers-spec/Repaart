import React from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { RepaartLogo } from '../../components/ui/RepaartLogo';
import UserMenu from './UserMenu';
import ThemeToggle from '../../ui/buttons/ThemeToggle';
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
            className={`lg:hidden fixed inset-y-0 left-0 flex flex-col bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800 shadow-2xl transform transition-all duration-300 ease-out z-50 
            w-80
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
            {/* Header - Fixed Top */}
            <div className="flex-none flex items-center justify-between p-4 lg:p-3 xl:p-4 border-b border-slate-100 dark:border-slate-800 h-[72px] lg:h-[64px] xl:h-[72px]">
                <div className="flex items-center gap-3">
                    <RepaartLogo
                        className="h-14 lg:h-10 xl:h-14 w-auto text-slate-800 dark:text-white"
                        interactive
                    />
                </div>
                <button
                    onClick={onClose}
                    className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    aria-label="Cerrar menú"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation Links - Scrollable Area */}
            <nav className="flex-1 overflow-y-auto min-h-0 p-4 lg:p-3 xl:p-4 space-y-1">
                <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 lg:mb-2 xl:mb-3">
                    Navegación
                </p>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-3 lg:py-2.5 xl:py-3 rounded-xl font-medium transition-all duration-200 group
                            ${(item as any).highlight && !isActive
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30'
                                : isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }
                        `}
                    >
                        <item.icon className="w-5 h-5 lg:w-4 lg:h-4 xl:w-5 xl:h-5 transition-transform group-hover:scale-110" />
                        <span className="lg:text-sm xl:text-base">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer - Fixed Bottom */}
            <div className="flex-none p-4 lg:p-3 xl:p-4 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <UserMenu placement="top" />
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:block text-[10px] font-bold text-slate-300 dark:text-slate-700">v4.1.0</div>
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NavigationSidebar;
