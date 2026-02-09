import {
    Activity,
    FileText,
    LifeBuoy,
    GraduationCap,
    LayoutGrid,
    Settings,
    Zap
} from 'lucide-react';

export const adminNavItems = [
    { path: '/dashboard', label: 'Finanzas', icon: Activity },
    { path: '/admin/flyder', label: 'Flyder', icon: Zap, highlight: true },
    { path: '/admin/resources', label: 'Recursos', icon: FileText },
    { path: '/admin/support', label: 'Soporte', icon: LifeBuoy },
    { path: '/admin/academy', label: 'Academia', icon: GraduationCap },
    { path: '/admin/kanban', label: 'Kanban', icon: LayoutGrid },
    { path: '/profile', label: 'Configuracion', icon: Settings },
];

export const franchiseNavItems = [
    { path: '/dashboard', label: 'Finanzas', icon: Activity },
    { path: '/operations', label: 'Operativa', icon: LayoutGrid },
    { path: '/resources', label: 'Recursos', icon: FileText },
    { path: '/support', label: 'Soporte', icon: LifeBuoy },
    { path: '/academy', label: 'Academia', icon: GraduationCap },
];

export const riderNavItems = [
    { path: '/rider/dashboard', label: 'Inicio', icon: Activity },
    { path: '/rider/schedule', label: 'Agenda', icon: LayoutGrid },
    { path: '/rider/profile', label: 'Configuración', icon: Settings },
    { path: '/academy', label: 'Academia', icon: GraduationCap },
];
