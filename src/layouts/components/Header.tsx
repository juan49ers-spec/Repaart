import React from 'react';
import { NavLink } from 'react-router-dom';
import { RepaartLogo } from '../../components/common/RepaartLogo';
import UserMenu from './UserMenu';
import Notifications from './Notifications';
import { adminNavItems, franchiseNavItems, riderNavItems } from '../constants/navigation';

export interface HeaderProps {
    isAdmin: boolean;
    isFranchise?: boolean;
    isRider?: boolean;
    targetFranchiseName?: string;
    onExport?: () => void;
    onOpenHelp?: (id: string) => void;
}

const Header: React.FC<HeaderProps> = ({ isAdmin, isFranchise, isRider }) => {
    const navItems = isAdmin ? adminNavItems : isFranchise ? franchiseNavItems : isRider ? riderNavItems : [];

    return (
        <header className="sticky top-0 z-40 w-full px-4 lg:px-8 py-5 pointer-events-none">
            <div className="max-w-[1920px] mx-auto flex items-center justify-between gap-4">

                {/* LEFT: Hyper-Premium Brand Island */}
                <div className="pointer-events-auto">
                    <NavLink to="/" className="group flex items-center">
                        <div className="relative glass-premium-dark border border-white/20 px-5 py-2.5 rounded-[20px] shadow-2xl transition-all duration-500 ease-out 
                            group-hover:scale-[1.03] group-hover:-translate-y-0.5 group-active:scale-[0.97]
                            flex items-center gap-3 overflow-hidden">
                            
                            {/* Animated Background Highlight */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            
                            <div className="relative flex items-center justify-center">
                                <RepaartLogo
                                    className="h-8 lg:h-9 w-auto transition-all duration-500 group-hover:drop-shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                                    iconOnly={false}
                                />
                            </div>
                        </div>
                    </NavLink>
                </div>

                {/* CENTER: Desktop Horizontal Navigation Island */}
                <div className="hidden xl:flex pointer-events-auto">
                    <nav className="glass-card px-2 py-1.5 rounded-full border border-white/20 dark:border-white/10 shadow-xl flex items-center gap-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `
                                    group relative flex items-center justify-center gap-0 px-3.5 py-2.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] border border-transparent z-0
                                    ${isActive
                                        ? 'bg-ruby-600 text-white shadow-[0_8px_20px_-6px_rgba(225,29,72,0.5)] ring-1 ring-white/20'
                                        : 'text-slate-500 hover:text-ruby-600 dark:text-zinc-400 dark:hover:text-ruby-400 hover:bg-slate-100 dark:hover:bg-white/5'
                                    }
                                    active:scale-95
                                `}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0 transition-all duration-300 group-hover:scale-110" />
                                <span className={`
                                    overflow-hidden whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] max-w-0 opacity-0
                                    group-hover:max-w-[140px] group-hover:opacity-100 group-hover:ml-3 group-hover:pr-2 font-semibold text-sm tracking-tight
                                `}>
                                    {item.label}
                                </span>
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* RIGHT: User Island */}
                <div className="pointer-events-auto flex items-center gap-3">
                    <div className="glass-card p-1.5 rounded-full border border-white/20 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300">
                        <Notifications isAdmin={isAdmin} />
                    </div>

                    <div className="glass-card p-1.5 rounded-full border border-white/20 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300">
                        <UserMenu
                            isFranchise={isFranchise}
                            isRider={isRider}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
