import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, LifeBuoy, Activity, GraduationCap, LucideIcon, Bike } from 'lucide-react';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';

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
        { path: '/dashboard?view=franchises', label: 'Sedes', icon: LayoutDashboard },
        { path: '/admin/users', label: 'Usuarios', icon: Users },
        { path: '/admin/resources', label: 'Recursos', icon: FileText },
        { path: '/admin/support', label: 'Soporte', icon: LifeBuoy },
        { path: '/academy', label: 'Academia', icon: GraduationCap },
    ], []);

    const franchiseTabs = useMemo<Tab[]>(() => [
        { path: '/dashboard', label: 'Finanzas', icon: LayoutDashboard },
        { path: '/operations', label: 'Horarios', icon: Activity }, // Or Calendar if imported
        { path: '/resources', label: 'Recursos', icon: FileText },
        { path: '/support', label: 'Soporte', icon: LifeBuoy },
        { path: '/fleet', label: 'Flota', icon: Bike },
        { path: '/academy', label: 'Academia', icon: GraduationCap },
    ], []);

    // Feature access for franchise users
    const { hasAccess } = useFeatureAccess();

    // Filter tabs based on permissions (only for franchise users)
    const tabs = useMemo<Tab[]>(() => {
        const baseTabs = isAdmin ? adminTabs : franchiseTabs;

        if (isAdmin) return baseTabs;

        // Filter franchise tabs based on feature access
        return baseTabs.filter(tab => {
            // Check path or label to identify 'resources'
            if (tab.label === 'Recursos') return hasAccess('downloads');
            return true;
        });
    }, [isAdmin, adminTabs, franchiseTabs, hasAccess]);

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
                                        {/* Icon Container with Glow */}
                                        <div className={`relative mb-1 transition-all duration-300 rounded-2xl px-4 py-1.5 ${isActive ? 'bg-blue-500/15' : 'bg-transparent'
                                            }`}>
                                            <Icon
                                                className={`w-6 h-6 transition-all duration-300 ${isActive ? 'stroke-[2.5] drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'stroke-[1.5]'
                                                    }`}
                                            />
                                        </div>

                                        {/* Label */}
                                        <span className={`text-[10px] font-medium tracking-tight transition-all duration-300 ${isActive ? 'opacity-100 font-semibold' : 'opacity-60'
                                            }`}>
                                            {tab.label}
                                        </span>
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default React.memo(BottomTabBar);
