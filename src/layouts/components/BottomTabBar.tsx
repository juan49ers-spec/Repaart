import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { adminNavItems, franchiseNavItems } from '../constants/navigation';

// =====================================================
// TYPES & INTERFACES
// =====================================================

interface BottomTabBarProps {
    isAdmin?: boolean;
    isFranchise?: boolean;
}

// =====================================================
// COMPONENT
// =====================================================

const BottomTabBar: React.FC<BottomTabBarProps> = ({ isAdmin, isFranchise: _isFranchise }) => {
    // Standardize navigation items across all devices
    const tabs = useMemo(() => {
        const baseItems = isAdmin ? adminNavItems : franchiseNavItems;

        // Skip 'Configuración' in BottomBar as it's now in the Top Header UserMenu
        return baseItems.filter(item => item.path !== '/profile');
    }, [isAdmin]);

    return (
        <nav className="xl:hidden tab-dock" aria-label="Navegación principal">
            <div className="flex justify-around items-center py-2">
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
                                <div className={`tab-pill transform transition-transform duration-200 ${isActive ? 'tab-pill-active' : ''}`}>
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
            </div>
        </nav>
    );
};

export default React.memo(BottomTabBar);
