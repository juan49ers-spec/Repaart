import React from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { RepaartLogo } from '../../components/common/RepaartLogo';
import UserMenu from './UserMenu';
import ThemeToggle from '../../components/ui/buttons/ThemeToggle';
import { adminNavItems, franchiseNavItems } from '../constants/navigation';

import { motion, AnimatePresence } from 'framer-motion';

interface NavigationSidebarProps {
    isAdmin: boolean;
    isFranchise: boolean;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ isAdmin, isFranchise }) => {
    const { isSidebarOpen, toggleSidebar } = useAppStore();

    const onClose = () => toggleSidebar(false);

    const navItems = isAdmin ? adminNavItems : isFranchise ? franchiseNavItems : [];

    return (
        <>
            {/* --- MOBILE OVERLAY SIDEBAR (< 1024px) --- */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-120%' }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30
                        }}
                        className="fixed inset-y-0 left-0 z-[100] flex items-center pl-4 pointer-events-none lg:hidden"
                    >
                        {/* Glass Dock Container - Mobile */}
                        <div className="h-[calc(100svh-2rem)] w-72 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-3xl flex flex-col overflow-hidden relative pointer-events-auto">
                            {/* ... Mobile Content Matches Previous Implementation ... */}
                            <SidebarContent navItems={navItems} onClose={onClose} isMobile={true} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- DESKTOP SMART RAIL SIDEBAR (>= 1280px) --- */}
            <div className={`
                hidden xl:flex fixed inset-y-0 left-0 z-40 flex-col
                transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]
                group/sidebar
                w-20 hover:w-72 2xl:w-72
            `}>
                {/* Visual Background Container */}
                <div className="h-full w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden relative shadow-sm">

                    {/* Header Logo Area */}
                    <div className="flex-none h-16 flex items-center justify-center 2xl:justify-start 2xl:px-6 relative z-10">
                        {/* Rail Mode Logo (Icon only) */}
                        <div className="2xl:hidden group-hover/sidebar:hidden">
                            <RepaartLogo className="h-8 w-auto text-indigo-600" interactive iconOnly />
                        </div>
                        {/* Full Logo (Expanded/2xl) */}
                        <div className="hidden 2xl:block group-hover/sidebar:block">
                            <RepaartLogo className="h-8 w-auto text-indigo-600" interactive />
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-2 px-3 scrollbar-hide">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `
                                    relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group/item
                                    ${isActive
                                        ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }
                                `}
                            >
                                <item.icon className={`
                                    w-6 h-6 shrink-0 transition-transform duration-300
                                    ${isFranchise ? 'text-slate-400' : ''} 
                                    group-hover/item:scale-110
                                `} />

                                <span className="font-medium whitespace-nowrap opacity-0 2xl:opacity-100 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">
                                    {item.label}
                                </span>

                                {/* Tooltip for Rail Mode */}
                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover/item:opacity-100 2xl:hidden group-hover/sidebar:hidden pointer-events-none whitespace-nowrap z-50">
                                    {item.label}
                                </div>
                            </NavLink>
                        ))}
                    </nav>

                    {/* Footer / User */}
                    <div className="flex-none p-4 border-t border-slate-200/50">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <UserMenu placement="right" />
                            {/* Theme Toggle etc could go here */}
                            <div className="opacity-0 2xl:opacity-100 group-hover/sidebar:opacity-100 transition-opacity duration-200">
                                <ThemeToggle />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

// Extracted Content Component for reuse/cleanliness if needed, or kept inline for speed. 
// For this refactor, I'll keep the mobile part largely as is but wrapped.
const SidebarContent = ({ navItems, onClose }: any) => (
    /* ... Re-insert the mobile specific content structure here or reuse logic ... */
    <div className="flex flex-col h-full w-full">
        {/* Decorative gradients */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex-none flex items-center justify-between p-6 pb-2 relative z-10">
            <RepaartLogo className="h-10 w-auto text-slate-900 dark:text-white drop-shadow-sm" interactive />
            <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-black/5 text-slate-400"
                aria-label="Cerrar menú"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1 my-2 scrollbar-hide">
            {navItems.map((item: any) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) => `
                        relative group flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300
                        ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400'}
                    `}
                >
                    {({ isActive }) => (
                        <>
                            {isActive && <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl -z-10" />}
                            <item.icon className="w-5 h-5" />
                            <span className="font-semibold">{item.label}</span>
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    </div>
);

export default NavigationSidebar;
