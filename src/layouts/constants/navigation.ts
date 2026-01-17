import {
    Activity,
    FileText,
    LifeBuoy,
    GraduationCap,
    LayoutGrid,
    Settings
} from 'lucide-react';

export const adminNavItems = [
    { path: '/dashboard', label: 'Finanzas', icon: Activity },
    { path: '/admin/resources', label: 'Recursos', icon: FileText },
    { path: '/admin/support', label: 'Soporte', icon: LifeBuoy },
    { path: '/academy', label: 'Academia', icon: GraduationCap },
    { path: '/admin/kanban', label: 'Kanban', icon: LayoutGrid, highlight: true },
    { path: '/profile', label: 'Configuración', icon: Settings },
];

export const franchiseNavItems = [
    { path: '/dashboard', label: 'Finanzas', icon: Activity },
    { path: '/operations', label: 'Operativa', icon: LayoutGrid },
    { path: '/resources', label: 'Recursos', icon: FileText },
    { path: '/support', label: 'Soporte', icon: LifeBuoy },
    { path: '/academy', label: 'Academia', icon: GraduationCap },
];
