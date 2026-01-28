import React, { useState, type FC } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Activity,
    LayoutGrid,
    FileText,
    LifeBuoy,
    GraduationCap,
    Settings,
    MoreHorizontal,
    X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNotificationBadge } from '../../features/layouts/hooks/useNotificationBadge';

// =====================================================
// COMPONENT
// =====================================================

interface TabItem {
    path?: string;
    label: string;
    icon: any;
    isMenu?: boolean;
    subItems?: Array<{ label: string; icon: any; path: string }>;
    badge?: number;
}

const BottomTabBar: FC<{ isAdmin?: boolean; isFranchise?: boolean; isRider?: boolean }> = ({ isAdmin, isFranchise, isRider }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { unreadCount } = useNotificationBadge();

    const adminTabs: TabItem[] = [
        { path: '/dashboard', label: 'Finanzas', icon: Activity },
        { path: '/admin/resources', label: 'Recursos', icon: FileText },
        { path: 'menu', label: 'Más', icon: MoreHorizontal, isMenu: true, subItems: [
            { label: 'Soporte', icon: LifeBuoy, path: '/admin/support' },
            { label: 'Academia', icon: GraduationCap, path: '/admin/academy' },
            { label: 'Kanban', icon: LayoutGrid, path: '/admin/kanban' },
        ]},
        { path: '/profile', label: 'Config', icon: Settings },
    ];

    const franchiseTabs: TabItem[] = [
        { path: '/dashboard', label: 'Finanzas', icon: Activity },
        { path: '/operations', label: 'Operativa', icon: LayoutGrid },
        { path: 'menu', label: 'Más', icon: MoreHorizontal, isMenu: true, subItems: [
            { label: 'Recursos', icon: FileText, path: '/resources' },
            { label: 'Soporte', icon: LifeBuoy, path: '/support' },
            { label: 'Academia', icon: GraduationCap, path: '/academy' },
        ]},
        { path: '/profile', label: 'Config', icon: Settings },
    ];

    const riderTabs: TabItem[] = [
        { path: '/rider/profile', label: 'Perfil', icon: Activity },
        { path: '/rider/profile/notifications', label: 'Notificaciones', icon: MoreHorizontal, badge: unreadCount },
        { path: '/rider/profile/security', label: 'Seguridad', icon: Settings },
    ];

    const tabs = isAdmin ? adminTabs : isFranchise ? franchiseTabs : isRider ? riderTabs : [];

    return (
        <>
            <nav className="xl:hidden tab-dock" aria-label="Navegación principal">
                <div className="flex justify-between items-end relative px-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;

                        if (tab.isMenu && tab.subItems) {
                            return (
                                <div key="menu-container" className="flex-1 flex flex-col items-center justify-end py-2 relative">
                                    <button
                                        className="relative flex flex-col items-center justify-center gap-1 transition-all duration-300 text-slate-400 dark:text-slate-500 hover:text-ruby-600"
                                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    >
                                        <div className={cn(
                                            "p-1.5 rounded-xl transition-all duration-300 relative",
                                            isMenuOpen ? "bg-gradient-to-br from-ruby-500 to-ruby-600 shadow-lg shadow-ruby-500/30" : "bg-transparent"
                                        )}>
                                            {isMenuOpen ? <X size={24} strokeWidth={2.5} className="text-white" /> : <Icon size={24} strokeWidth={2} />}
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-tight transition-all duration-300",
                                            isMenuOpen ? "opacity-100 text-ruby-600" : "opacity-60"
                                        )}>
                                            {tab.label}
                                        </span>
                                        {isMenuOpen && (
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-ruby-600 rounded-b-full shadow-[0_2px_10px_rgba(225,29,72,0.3)] animate-in fade-in slide-in-from-top-1" />
                                        )}
                                    </button>

                                    {/* Expanded Menu */}
                                    {isMenuOpen && (
                                        <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-56 glass-card rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-300">
                                            <div className="p-3 space-y-1">
                                                <div className="px-3 py-2 mb-2">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                        Secciones
                                                    </p>
                                                </div>
                                                {tab.subItems.map((subItem) => {
                                                    const SubIcon = subItem.icon;
                                                    return (
                                                        <NavLink
                                                            key={subItem.path}
                                                            to={subItem.path}
                                                            onClick={() => setIsMenuOpen(false)}
                                                            className={({ isActive: subIsActive }) => cn(
                                                                "flex items-center gap-3 px-3.5 py-3.5 rounded-2xl transition-all duration-200",
                                                                subIsActive ? "bg-gradient-to-r from-ruby-50 to-ruby-100/50 dark:from-ruby-600/20 dark:to-ruby-600/10 text-ruby-600 dark:text-ruby-400 ring-1 ring-ruby-200 dark:ring-ruby-600/30" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                                                            )}
                                                        >
                                                            {({ isActive: subIsActive }) => (
                                                                <>
                                                                    <div className={cn(
                                                                        "p-2 rounded-xl transition-all",
                                                                        subIsActive ? "bg-ruby-100 dark:bg-ruby-600/20" : "bg-slate-100 dark:bg-slate-800"
                                                                    )}>
                                                                        <SubIcon size={18} className={cn("shrink-0", subIsActive ? "text-ruby-600 dark:text-ruby-400" : "text-slate-600 dark:text-slate-400")} />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <span className="text-sm font-semibold">{subItem.label}</span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </NavLink>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <NavLink
                                key={tab.path || 'tab'}
                                to={tab.path || '#'}
                                className={({ isActive }) => cn("tab-item group relative h-16 flex-1", isActive ? "text-ruby-600" : "text-slate-400 dark:text-slate-500")}
                            >
                                {({ isActive }) => (
                                    <>
                                        <div className={cn("flex flex-col items-center justify-center gap-1 py-2 transition-all duration-300", isActive ? "scale-105" : "")}>
                                            <div className={cn("p-1.5 rounded-xl transition-all duration-300", isActive ? "bg-ruby-50 dark:bg-ruby-600/10" : "")}>
                                                <Icon size={24} className={cn("transition-all duration-300", isActive ? "stroke-[2.5]" : "stroke-[1.8] group-hover:scale-110")} />
                                            </div>
                                            <span className={cn("text-[10px] font-bold uppercase tracking-tight transition-all duration-300", isActive ? "opacity-100" : "opacity-60")}>
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

            {/* Overlay for menu */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 animate-in fade-in duration-300 xl:hidden"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}
        </>
    );
};

export default React.memo(BottomTabBar);
