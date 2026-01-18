import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { Users, FileText, LifeBuoy, Activity, GraduationCap, LucideIcon, Bike, PieChart, LayoutGrid, MoreHorizontal } from 'lucide-react';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import MobileMoreMenu from './MobileMoreMenu';

// =====================================================
// TYPES & INTERFACES
// =====================================================

interface Tab {
    path: string;
    label: string;
    icon: LucideIcon;
}

interface BottomTabBarProps {
    isAdmin?: boolean;
    isFranchise?: boolean;
}

// =====================================================
// COMPONENT
// =====================================================

const BottomTabBar: React.FC<BottomTabBarProps> = ({ isAdmin, isFranchise: _isFranchise }) => {
    // Memoize tab configurations to prevent recreation on every render
    const adminTabs = useMemo<Tab[]>(() => [
        { path: '/dashboard', label: 'Central', icon: Activity },
        { path: '/admin/kanban', label: 'Kanban', icon: LayoutGrid },
        { path: '/admin/users', label: 'Usuarios', icon: Users },
        { path: '/admin/resources', label: 'Recursos', icon: FileText },
        { path: '/admin/support', label: 'Soporte', icon: LifeBuoy },
    ], []);

    const adminMoreItems = useMemo<Tab[]>(() => [], []);

    const franchiseTabs = useMemo<Tab[]>(() => [
        { path: '/dashboard', label: 'Balance', icon: PieChart },
        { path: '/operations', label: 'Horas', icon: Activity },
        { path: '/fleet', label: 'Flota', icon: Bike },
        { path: '/academy', label: 'Academia', icon: GraduationCap },
        { path: '/resources', label: 'Recursos', icon: FileText },
        { path: '/support', label: 'Soporte', icon: LifeBuoy },
    ], []);

    const franchiseMoreItems = useMemo<Tab[]>(() => [], []);

    const [isMoreOpen, setIsMoreOpen] = React.useState(false);

    // Feature access for franchise users
    const { hasAccess } = useFeatureAccess();

    // Filter tabs based on permissions (only for franchise users)
    const tabs = useMemo<Tab[]>(() => {
        const baseTabs = isAdmin ? adminTabs : franchiseTabs;

        if (isAdmin) return baseTabs;

        return baseTabs;
    }, [isAdmin, adminTabs, franchiseTabs]);

    const moreItems = useMemo<Tab[]>(() => {
        const baseMore = isAdmin ? adminMoreItems : franchiseMoreItems;
        if (isAdmin) return baseMore;

        return baseMore.filter(item => {
            if (item.label === 'Recursos') return hasAccess('downloads');
            return true;
        });
    }, [isAdmin, adminMoreItems, franchiseMoreItems, hasAccess]);

    return (
        <>
            {/* Floating Dock Navigation - Glovo/Apple Style */}
            <nav className="xl:hidden tab-dock" aria-label="Navegación principal">
                <div className="flex justify-around items-center py-2 px-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;

                        return (
                            <NavLink
                                key={tab.path}
                                to={tab.path}
                                className="tab-item touch-feedback"
                                aria-label={tab.label}
                            >
                                {({ isActive }: { isActive: boolean }) => (
                                    <div className={`tab-pill transform transition-transform duration-200 active:scale-90 ${isActive ? 'tab-pill-active' : ''}`}>
                                        <Icon
                                            className={`w-6 h-6 transition-all duration-200 ${isActive
                                                ? 'text-blue-600 dark:text-blue-400 stroke-[2.5]'
                                                : 'text-slate-400 dark:text-slate-500 stroke-[1.5]'
                                                }`}
                                        />
                                    </div>
                                )}
                            </NavLink>
                        );
                    })}

                    {/* "Más" Button */}
                    {moreItems.length > 0 && (
                        <button
                            onClick={() => setIsMoreOpen(true)}
                            className="tab-item touch-feedback"
                            aria-label="Más opciones"
                            title="Más opciones"
                        >
                            <div className={`tab-pill ${isMoreOpen ? 'tab-pill-active' : ''}`}>
                                <MoreHorizontal
                                    className={`w-6 h-6 transition-all duration-200 ${isMoreOpen
                                        ? 'text-blue-600 dark:text-blue-400 stroke-[2.5]'
                                        : 'text-slate-400 dark:text-slate-500 stroke-[1.5]'
                                        }`}
                                />
                            </div>
                        </button>
                    )}
                </div>
            </nav>

            <MobileMoreMenu
                isOpen={isMoreOpen}
                onClose={() => setIsMoreOpen(false)}
                items={moreItems}
            />
        </>
    );
};

export default React.memo(BottomTabBar);
