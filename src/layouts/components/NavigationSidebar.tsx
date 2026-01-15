import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    Activity,
    FileText,
    LifeBuoy,
    GraduationCap,
    LayoutGrid,
    Settings,
    X,
    LucideIcon
} from 'lucide-react';
import logo from '../../assets/logo.jpg';
import { useAppStore } from '../../store/useAppStore';

interface NavItem {
    path: string;
    label: string;
    icon: LucideIcon;
    highlight?: boolean;
}

interface NavigationSidebarProps {
    isAdmin: boolean;
    isFranchise: boolean;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ isAdmin, isFranchise }) => {
    const { isSidebarOpen, toggleSidebar } = useAppStore();

    const onClose = () => toggleSidebar(false);

    const adminNavItems: NavItem[] = [
        { path: '/dashboard', label: 'Finanzas', icon: Activity },
        { path: '/admin/resources', label: 'Recursos', icon: FileText },
        { path: '/admin/support', label: 'Soporte', icon: LifeBuoy },
        { path: '/academy', label: 'Academia', icon: GraduationCap },
        { path: '/admin/kanban', label: 'Kanban', icon: LayoutGrid, highlight: true },
        { path: '/profile', label: 'Configuración', icon: Settings },
    ];

    const franchiseNavItems: NavItem[] = [
        { path: '/dashboard', label: 'Finanzas', icon: Activity },
        { path: '/operations', label: 'Operativa', icon: LayoutGrid },
        { path: '/resources', label: 'Recursos', icon: FileText },
        { path: '/support', label: 'Soporte', icon: LifeBuoy },
        { path: '/academy', label: 'Academia', icon: GraduationCap },
    ];

    const navItems = isAdmin ? adminNavItems : isFranchise ? franchiseNavItems : [];

    return (
        <div
            className={`fixed inset-y-0 left-0 w-80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800 shadow-2xl transform transition-transform duration-300 ease-out z-50 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="Repaart" className="w-10 h-10 rounded-xl shadow-lg" />
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">REPAART</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Panel de Control</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    aria-label="Cerrar menú"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation Links */}
            <nav className="p-4 space-y-1">
                <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Navegación
                </p>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                            ${item.highlight && !isActive
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30'
                                : isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }
                        `}
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100 dark:border-slate-800">
                <div className="text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold tracking-widest">
                        v4.1.0
                    </span>
                </div>
            </div>
        </div>
    );
};

export default NavigationSidebar;
