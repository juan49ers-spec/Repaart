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
    ], []);

    const adminMoreItems = useMemo<Tab[]>(() => [
        { path: '/admin/resources', label: 'Recursos', icon: FileText },
        { path: '/admin/support', label: 'Soporte', icon: LifeBuoy },
    ], []);

    const franchiseTabs = useMemo<Tab[]>(() => [
        { path: '/dashboard', label: 'Balance', icon: PieChart },
        { path: '/operations', label: 'Horas', icon: Activity },
        { path: '/fleet', label: 'Flota', icon: Bike },
    ], []);

    const franchiseMoreItems = useMemo<Tab[]>(() => [
        { path: '/resources', label: 'Recursos', icon: FileText },
        { path: '/support', label: 'Soporte', icon: LifeBuoy },
        { path: '/academy', label: 'Academia', icon: GraduationCap },
    ], []);

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
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            {/* Apple-style Floating Dock */}
            <div className="ios-dock pb-[env(safe-area-inset-bottom)]">
                <div className="flex justify-around items-end px-2 pt-2 pb-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;

                        return (
                            <NavLink
                                key={tab.path}
                                to={tab.path}
                                className={({ isActive }: { isActive: boolean }) => `flex flex-col items-center justify-center w-full py-1 transition-all duration-300 active:scale-95 ${isActive
                                    ? 'text-blue-500'
                                    : 'text-slate-500'
                                    }`}
                            >
                                {({ isActive }: { isActive: boolean }) => (
                                    <>
                                        <div className={`relative mb-1 transition-all duration-300 rounded-2xl px-4 py-1.5 ${isActive ? 'bg-blue-500/15' : 'bg-transparent'
                                            }`}>
                                            <Icon
                                                className={`w-6 h-6 transition-all duration-300 ${isActive ? 'stroke-[2.5] drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'stroke-[1.5]'
                                                    }`}
                                            />
                                        </div>

                                        <span className={`text-[10px] font-medium tracking-tight transition-all duration-300 ${isActive ? 'opacity-100 font-semibold' : 'opacity-60'
                                            }`}>
                                            {tab.label}
                                        </span>
                                    </>
                                )}
                            </NavLink>
                        );
                    })}

                    {/* "Más" Button */}
                    <button
                        onClick={() => setIsMoreOpen(true)}
                        className={`flex flex-col items-center justify-center w-full py-1 transition-all duration-300 active:scale-95 ${isMoreOpen ? 'text-blue-500' : 'text-slate-500'}`}
                    >
                        <div className={`relative mb-1 transition-all duration-300 rounded-2xl px-4 py-1.5 ${isMoreOpen ? 'bg-blue-500/15' : 'bg-transparent'}`}>
                            <MoreHorizontal className={`w-6 h-6 transition-all duration-300 ${isMoreOpen ? 'stroke-[2.5] drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'stroke-[1.5]'}`} />
                        </div>
                        <span className={`text-[10px] font-medium tracking-tight transition-all duration-300 ${isMoreOpen ? 'opacity-100 font-semibold' : 'opacity-60'}`}>
                            Más
                        </span>
                    </button>
                </div>
            </div>

            <MobileMoreMenu
                isOpen={isMoreOpen}
                onClose={() => setIsMoreOpen(false)}
                items={moreItems}
            />
        </div>
    );
};

export default React.memo(BottomTabBar);
