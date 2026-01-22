import React from 'react';
import { NavLink } from 'react-router-dom';
import { RepaartLogo } from '../../components/common/RepaartLogo';
import UserMenu from './UserMenu';
import { adminNavItems, franchiseNavItems } from '../constants/navigation';

export interface HeaderProps {
    isAdmin: boolean;
    isFranchise: boolean;
    targetFranchiseName?: string;
    onExport?: () => void;
    onOpenHelp?: (id: string) => void;
}

const Header: React.FC<HeaderProps> = ({ isAdmin, isFranchise }) => {
    const navItems = isAdmin ? adminNavItems : isFranchise ? franchiseNavItems : [];

    return (
        <header className="sticky top-0 z-50 w-full px-4 lg:px-8 py-5 pointer-events-none">
            <div className="max-w-[1920px] mx-auto flex items-center justify-between gap-4">

                {/* LEFT: Hyper-Premium Brand Island */}
                <div className="pointer-events-auto">
                    <div className="glass-premium brand-island-glow px-6 py-3 rounded-[24px] shadow-2xl hover:scale-[1.02] active:scale-[0.98] group transition-all duration-500">
                        <NavLink to="/" className="flex items-center">
                            <RepaartLogo
                                className="h-9 lg:h-8 w-auto text-slate-800 dark:text-white transition-all duration-500 group-hover:drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]"
                                iconOnly={false}
                            />
                        </NavLink>
                    </div>
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
                <div className="pointer-events-auto">
                    <div className="glass-card p-1.5 rounded-full border border-white/20 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300">
                        <UserMenu placement="bottom" />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
