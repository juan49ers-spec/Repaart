import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    Home,
    Zap,
    Plus,
    Menu
} from 'lucide-react';
import { cn } from '../../lib/utils';

// =====================================================
// COMPONENT
// =====================================================

const BottomTabBar: React.FC<{ isAdmin?: boolean; isFranchise?: boolean }> = ({ isAdmin: _isAdmin, isFranchise: _isFranchise }) => {

    // We explicitly define the mobile tabs to match the "Premium App" look
    const tabs = [
        { path: '/dashboard', label: 'Inicio', icon: Home },
        { path: '/operations', label: 'Live', icon: Zap },
        { path: 'fab', label: 'Acción', icon: Plus, isFab: true },
        { path: '/profile', label: 'Menú', icon: Menu },
    ];

    return (
        <nav className="xl:hidden tab-dock" aria-label="Navegación principal">
            <div className="flex justify-between items-end relative px-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;

                    if (tab.isFab) {
                        return (
                            <div key="fab-container" className="flex-1 flex flex-col items-center justify-end pb-3 -mt-6">
                                <button
                                    className="w-14 h-14 rounded-full bg-ruby-600 shadow-[0_8px_25px_rgba(225,29,72,0.4)] flex items-center justify-center text-white active:scale-90 transition-all duration-300 ring-4 ring-white dark:ring-slate-900 border border-ruby-500"
                                    onClick={() => {/* Open Quick Actions or Search */ }}
                                >
                                    <Icon size={28} strokeWidth={3} />
                                </button>
                                <span className="text-[10px] font-bold text-ruby-600 mt-1 uppercase tracking-tighter">Acción</span>
                            </div>
                        );
                    }

                    return (
                        <NavLink
                            key={tab.path}
                            to={tab.path}
                            className={({ isActive }) => cn(
                                "tab-item group relative h-16",
                                isActive ? "text-ruby-600" : "text-slate-400 dark:text-slate-500"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={cn(
                                        "flex flex-col items-center justify-center gap-1 transition-all duration-300",
                                        isActive ? "translate-y-[-2px]" : ""
                                    )}>
                                        <div className={cn(
                                            "p-1.5 rounded-xl transition-all duration-300",
                                            isActive ? "bg-ruby-50 dark:bg-ruby-600/10" : ""
                                        )}>
                                            <Icon
                                                size={24}
                                                className={cn(
                                                    "transition-all duration-300",
                                                    isActive ? "stroke-[2.5]" : "stroke-[1.8] group-hover:scale-110"
                                                )}
                                            />
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-tight transition-all duration-300",
                                            isActive ? "opacity-100" : "opacity-60"
                                        )}>
                                            {tab.label}
                                        </span>
                                    </div>
                                    {isActive && (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-ruby-600 rounded-b-full shadow-[0_2px_10px_rgba(225,29,72,0.3)] animate-in fade-in slide-in-from-top-1" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
};

export default React.memo(BottomTabBar);

