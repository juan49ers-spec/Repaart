import { ShieldCheck, BookOpen, Briefcase, Layout, Folder } from 'lucide-react';

export const FOLDERS = [
    { id: 'contracts', label: 'Marco Legal & Contratos', icon: ShieldCheck, color: 'text-indigo-500' },
    { id: 'manuals', label: 'Manuales Operativos', icon: BookOpen, color: 'text-emerald-500' },
    { id: 'commercial', label: 'Dossiers Comerciales', icon: Briefcase, color: 'text-amber-500' },
    { id: 'marketing', label: 'Activos de Marca', icon: Layout, color: 'text-rose-500' },
    { id: 'general', label: 'Documentación General', icon: Folder, color: 'text-slate-500' },
];

export const MAX_STORAGE_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB
