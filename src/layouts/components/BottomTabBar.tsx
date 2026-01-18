import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { adminNavItems, franchiseNavItems } from '../constants/navigation';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import MobileMoreMenu from './MobileMoreMenu';
import { MoreHorizontal } from 'lucide-react';

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
    const [isMoreOpen, setIsMoreOpen] = React.useState(false);
    const { hasAccess } = useFeatureAccess();

    // Standardize navigation items across all devices
    const { visibleTabs, overflowItems } = useMemo(() => {
        let baseItems = isAdmin ? adminNavItems : franchiseNavItems;

        // Skip 'Configuración' in BottomBar as it's now in the Top Header UserMenu
        baseItems = baseItems.filter(item => item.path !== '/profile');

        // Feature access filtering for franchise users
        const allowedItems = isAdmin ? baseItems : baseItems.filter(item => {
            if (item.label === 'Recursos') return hasAccess('downloads');
            if (item.label === 'Academia') return hasAccess('academy');
            return true;
        });

        // Split into visible (max 5) and overflow
        const splitIndex = 5;
        return {
            visibleTabs: allowedItems.slice(0, splitIndex),
            overflowItems: allowedItems.slice(splitIndex)
        };
    }, [isAdmin, hasAccess]);

    return (
        <>
            {/* Floating Dock Navigation - Glovo/Apple Style */}
            <nav className="xl:hidden tab-dock" aria-label="Navegación principal">
                <div className="flex justify-around items-center py-2 px-1">
                    {visibleTabs.map((tab) => {
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

                    {/* "Más" Button if overflow exists */}
                    {overflowItems.length > 0 && (
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
                items={overflowItems}
            />
        </>
    );
};

export default React.memo(BottomTabBar);
