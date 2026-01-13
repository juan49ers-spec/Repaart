import React from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import logo from '../../assets/logo.jpg'; // Import logo
import {
    Menu,
    LogOut,
    Calendar,
    Activity,
    LifeBuoy,
    FileText,
    ChevronRight,
    GraduationCap,
    LayoutGrid,
    Settings,
    HelpCircle,
    LucideIcon
} from 'lucide-react';
import Notifications from './Notifications';
import UserMenu from './UserMenu';
import ThemeToggle from '../../ui/buttons/ThemeToggle';

import { useAppStore } from '../../store/useAppStore';

export interface HeaderProps {
    isAdmin: boolean;
    isFranchise: boolean;
    targetFranchiseName?: string;
    onLogout: () => void;
    onExport?: () => void;
    onOpenHelp?: (id: string) => void;
}

interface Breadcrumb {
    label: string;
    to?: string | null;
    active: boolean;
}

interface NavItem {
    path: string;
    label: string;
    icon: LucideIcon;
}

const Header: React.FC<HeaderProps> = ({
    isAdmin,
    isFranchise,
    targetFranchiseName,
    onLogout,
    onOpenHelp
}) => {
    const {
        selectedMonth,
        setSelectedMonth,
        toggleSidebar
    } = useAppStore();


    const location = useLocation();
    const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';
    const isAdminFinanceDetail = location.pathname.includes('/admin/finance/');

    const getBreadcrumbs = (): Breadcrumb[] => {
        const crumbs: Breadcrumb[] = [];
        if (isAdmin) {
            crumbs.push({ label: 'Central', to: '/dashboard', active: isDashboard });
        } else {
            crumbs.push({ label: 'Mi Negocio', to: null, active: false });
        }

        if (isAdmin) {
            if (isAdminFinanceDetail) crumbs.push({ label: targetFranchiseName || 'Franquicia', active: true });
            if (location.pathname.includes('/admin/users')) crumbs.push({ label: 'Usuarios', active: true });
            if (location.pathname.includes('/admin/resources')) crumbs.push({ label: 'Recursos', active: true });
            if (location.pathname.includes('/admin/support')) crumbs.push({ label: 'Soporte', active: true });
            if (location.pathname.includes('/admin/audit')) crumbs.push({ label: 'Auditoría', active: true });
            if (location.pathname === '/profile') crumbs.push({ label: 'Configuración', active: true });
            if (location.pathname === '/academy') crumbs.push({ label: 'Academia', active: true });
        } else if (isFranchise) {
            if (isDashboard) crumbs.push({ label: 'Finanzas', active: true });
            if (location.pathname === '/support') crumbs.push({ label: 'Soporte', active: true });
            if (location.pathname === '/resources') crumbs.push({ label: 'Recursos', active: true });
            if (location.pathname === '/academy') crumbs.push({ label: 'Academia', active: true });
            if (location.pathname === '/operations') crumbs.push({ label: 'Operativa', active: true });
            if (location.pathname.includes('history')) crumbs.push({ label: 'Cierres', active: true });
        }
        return crumbs;
    };

    const getTitle = (): string => {
        const path = location.pathname;
        const searchParams = new URLSearchParams(location.search);
        const view = searchParams.get('view');

        if (isAdmin) {
            if (path === '/dashboard' || path === '/') {
                if (view === 'franchises') return 'Directorio de Sedes';
                return 'Panel Control Administrador';
            }
            if (path.includes('/admin/finance/')) return targetFranchiseName || 'Detalle Franquicia';
            if (path.includes('support')) return 'Centro de Soporte';
            if (path === '/profile') return 'Configuración';
            if (path.includes('audit')) return 'Auditoría';
            if (path.includes('communications')) return 'Comunicados';
            if (path.includes('resources')) return 'Recursos';
            if (path.includes('users')) return 'Usuarios';
            if (path === '/academy') return 'Academia';
        }

        if (isFranchise) {
            if (path === '/dashboard') return 'Financial Cockpit';
            if (path.includes('support')) return 'Soporte';
            if (path.includes('resources')) return 'Recursos';
            if (path === '/academy') return 'Academia';
            if (path.includes('history')) return 'Registro de Cierres';
            if (path === '/operations') return 'Operativa';
        }
        return 'Panel de Control';
    };

    return (
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl w-full transition-colors duration-300">
            <div className="max-w-[1920px] mx-auto px-3 md:px-6 h-16 md:h-20 flex items-center justify-between gap-3 md:gap-4">

                {/* LEFT: Logo & Breadcrumbs */}
                <div className="flex items-center gap-6">
                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => toggleSidebar()}
                        className="md:hidden p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                        title="Abrir menú"
                        aria-label="Abrir menú de navegación"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl shadow-lg shadow-blue-500/20 hidden md:flex overflow-hidden border border-slate-200 dark:border-slate-800 bg-white">
                            <img src={logo} alt="Repaart" className="w-full h-full object-cover" />
                        </div>
                        <div className="hidden md:block">
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight transition-colors">{getTitle()}</h1>
                                <button
                                    onClick={() => {
                                        const path = location.pathname;
                                        let helpId = 'dashboard';
                                        if (path.includes('operations')) helpId = 'operations';
                                        if (path.includes('operations')) helpId = 'operations';
                                        if (path.includes('academy')) helpId = 'academy';
                                        if (path.includes('profile')) helpId = 'profile';
                                        if (path.includes('support')) helpId = 'support';
                                        if (path.includes('resources')) helpId = 'resources';
                                        if (onOpenHelp) onOpenHelp(helpId);
                                    }}
                                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-500 transition-all active:scale-90"
                                    title="Ayuda de esta página"
                                >
                                    <HelpCircle className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                                {getBreadcrumbs().map((crumb, index) => (
                                    <React.Fragment key={index}>
                                        {index > 0 && <ChevronRight className="w-3 h-3 text-slate-600" />}
                                        <span className={crumb.active ? 'text-slate-700 dark:text-white font-semibold' : ''}>{crumb.label}</span>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CENTER: Navigation (Desktop) */}
                <div className="hidden xl:flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner transition-colors">
                    {/* ADMIN NAVIGATION */}
                    {isAdmin && (
                        <>
                            {(
                                [
                                    { path: '/dashboard', label: 'Finanzas', icon: Activity },

                                    { path: '/admin/resources', label: 'Recursos', icon: FileText },
                                    { path: '/admin/support', label: 'Soporte', icon: LifeBuoy },
                                    { path: '/academy', label: 'Academia', icon: GraduationCap },
                                    { path: '/admin/kanban', label: 'Kanban', icon: LayoutGrid },
                                    { path: '/profile', label: 'Configuración', icon: Settings },
                                ] as NavItem[]
                            ).map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => {
                                        // Custom styling for Kanban (Highlighted/Professional)
                                        if (item.path === '/admin/kanban') {
                                            return `
                                                flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 relative ml-2 group
                                                ${isActive
                                                    ? 'text-white bg-gradient-to-r from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/25 ring-1 ring-white/20'
                                                    : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 border border-indigo-200/50'
                                                }
                                            `;
                                        }

                                        return `
                                        flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 relative
                                        ${(isActive && !item.path.includes('?')) || (item.path.includes('?') && location.search.includes(item.path.split('?')[1]))
                                                ? 'text-white bg-blue-600 shadow-lg'
                                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                                            }
                                    `}}
                                >
                                    <item.icon className={`w-4 h-4 mr-2 ${item.path === '/admin/kanban' && !location.pathname.includes('kanban') ? 'text-indigo-500' : ''}`} />
                                    {item.label}
                                </NavLink>
                            ))}
                        </>
                    )}

                    {/* FRANCHISE NAVIGATION */}
                    {isFranchise && (
                        <>
                            {(
                                [
                                    { path: '/dashboard', label: 'Finanzas', icon: Activity },
                                    { path: '/operations', label: 'Horarios', icon: Calendar },
                                    { path: '/resources', label: 'Recursos', icon: FileText },
                                    { path: '/support', label: 'Soporte', icon: LifeBuoy },
                                    { path: '/academy', label: 'Academia', icon: GraduationCap }
                                ] as NavItem[]
                            ).map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => `
                                        flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 relative
                                        ${isActive
                                            ? 'text-white bg-emerald-600 shadow-lg'
                                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                                        }
                                    `}
                                >
                                    <item.icon className="w-4 h-4 mr-2" />
                                    {item.label}
                                </NavLink>
                            ))}
                        </>
                    )}
                </div>

                {/* RIGHT: Tools */}
                <div className="flex items-center gap-3">
                    <ThemeToggle />

                    {/* User Menu */}
                    <UserMenu />

                    <div className="hidden md:flex items-center justify-center">
                        < Notifications isAdmin={isAdmin} />
                    </div>

                    {/* Date Picker */}
                    <div className="hidden md:flex items-center bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 group hover:border-slate-300 dark:hover:border-slate-700 transition-colors focus-within:ring-2 focus-within:ring-blue-500/20 shadow-inner">
                        <Calendar className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors mr-2" />
                        <input
                            type="month"
                            value={selectedMonth || new Date().toISOString().slice(0, 7)}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent text-slate-600 dark:text-slate-300 text-sm font-bold uppercase tracking-wider outline-none border-none p-0 w-auto cursor-pointer dark:[color-scheme:dark]"
                            title="Seleccionar Mes"
                            aria-label="Seleccionar mes"
                        />
                    </div>

                    {/* Logout */}
                    <button
                        onClick={() => {
                            if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                                onLogout();
                            }
                        }}
                        className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 dark:hover:border-rose-500/30 transition-all shadow-sm active:scale-95"
                        title="Cerrar Sesión"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
