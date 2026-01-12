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
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom">
            {/* Glassmorphism Tab Bar */}
            <div className="ios-blur-dark border-t border-slate-200/50 ios-shadow-lg">
                <div className="flex justify-around items-center px-2 py-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;

                        return (
                            <NavLink
                                key={tab.path}
                                to={tab.path}
                                className={({ isActive }: { isActive: boolean }) => `flex flex-col items-center justify-center flex-1 py-3 px-2 rounded-xl transition-all duration-200 active:scale-95 min-h-[56px] ${isActive
                                    ? 'text-blue-600'
                                    : 'text-slate-400'
                                    }`}
                            >
                                {({ isActive }: { isActive: boolean }) => (
                                    <>
                                        {/* Icon with background circle when active */}
                                        <div className={`relative mb-1 transition-all duration-300 ${isActive ? 'transform scale-110' : ''
                                            }`}>
                                            {isActive && (
                                                <div className="absolute inset-0 bg-blue-100 rounded-full scale-150 -z-10 animate-bounce-in" />
                                            )}
                                            <Icon
                                                className={`w-6 h-6 transition-all duration-200 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'
                                                    }`}
                                            />
                                        </div>

                                        {/* Label */}
                                        <span className={`text-[10px] font-semibold transition-all duration-200 ${isActive ? 'opacity-100' : 'opacity-70'
                                            }`}>
                                            {tab.label}
                                        </span>

                                        {/* Active indicator dot */}
                                        {isActive && (
                                            <div className="absolute bottom-0 w-1 h-1 bg-blue-600 rounded-full animate-bounce-in" />
                                        )}
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
