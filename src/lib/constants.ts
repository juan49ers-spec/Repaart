import { ShieldAlert, Wrench, Users, PlayCircle, BookOpen, FileText, Zap, Heart, Star, Award, Info, AlertTriangle, CheckCircle, HelpCircle, Lightbulb, Target } from 'lucide-react';

export interface TicketStatus {
    id: 'open' | 'pending_user' | 'investigating' | 'resolved';
    label: string;
    color: string;
    bg: string;
    text: string;
    border: string;
}

export const TICKET_STATUSES: Record<string, TicketStatus> = {
    open: {
        id: 'open',
        label: 'Abierto',
        color: 'blue',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200'
    },
    pending_user: {
        id: 'pending_user',
        label: 'Pendiente Info',
        color: 'amber',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200'
    },
    investigating: {
        id: 'investigating',
        label: 'En Revisión',
        color: 'purple',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200'
    },
    resolved: {
        id: 'resolved',
        label: 'Resuelto',
        color: 'emerald',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200'
    }
};

// Cost item name mappings for display
export const COST_ITEM_NAMES: Record<string, string> = {
    salaries: 'Salarios',
    renting: 'Renting Motos',
    insurance: 'Seguros',
    services: 'Servicios Prof.',
    quota: 'Cuota Autónomo',
    other: 'Otros Costes',
    gasoline: 'Gasolina',
    repairs: 'Reparaciones',
    flyderFee: 'App Flyder',
    royalty: 'Royalty'
};

// Alert Thresholds
export const ALERT_THRESHOLDS = {
    // Critical thresholds
    MIN_PROFIT_MARGIN: 15, // %

    // Warning thresholds
    MAX_EXPENSE_RATIO: 65, // % of revenue
    MAX_COST_PER_KM: 0.40, // €
    MAX_REVENUE_DROP: -15, // %

    // Success thresholds
    EXCELLENT_MARGIN: 25, // %
    BREAKEVEN_MULTIPLIER: 1.2 // 20% above break-even
};

// Business Health Indicators
export const HEALTH_INDICATORS = {
    PROFIT_PER_ORDER: {
        EXCELLENT: 8, // €
        ACCEPTABLE: 5 // €
    },
    COST_PER_KM: {
        OPTIMAL: 0.30, // €
        NORMAL: 0.40 // €
    }
};

export const getStatusConfig = (status: string): TicketStatus =>
    TICKET_STATUSES[status as keyof typeof TICKET_STATUSES] || TICKET_STATUSES.open;

export interface RoleConfig {
    label: string;
    bg: string;
    text: string;
    border: string;
}

export const ROLE_CONFIG: Record<string, RoleConfig> = {
    admin: {
        label: 'Admin',
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        border: 'border-purple-200'
    },
    franchise: { // Fix for DB mismatch
        label: 'Franquicia',
        bg: 'bg-indigo-100',
        text: 'text-indigo-800',
        border: 'border-indigo-200'
    },
    franchisee: { // Legacy support
        label: 'Franquicia',
        bg: 'bg-indigo-100',
        text: 'text-indigo-800',
        border: 'border-indigo-200'
    },
    rider: {
        label: 'Rider',
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        border: 'border-blue-200'
    },
    user: {
        label: 'Usuario',
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        border: 'border-slate-200'
    }
};

export const getRoleConfig = (role: string): RoleConfig =>
    ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.user;

export const GUIDE_THEMES = {
    rose: { label: 'Crítico / Alerta', bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-500', border: 'border-rose-200 dark:border-rose-800' },
    amber: { label: 'Mantenimiento / Precaución', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-500', border: 'border-amber-200 dark:border-amber-800' },
    indigo: { label: 'Operativa / General', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-500', border: 'border-indigo-200 dark:border-indigo-800' },
    emerald: { label: 'Formación / Positivo', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-500', border: 'border-emerald-200 dark:border-emerald-800' },
    blue: { label: 'Información', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-500', border: 'border-blue-200 dark:border-blue-800' },
    violet: { label: 'Estrategia', bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-500', border: 'border-violet-200 dark:border-violet-800' },
};

export const GUIDE_ICONS = {
    ShieldAlert, Wrench, Users, PlayCircle, BookOpen, FileText, Zap, Heart, Star, Award, Info, AlertTriangle, CheckCircle, HelpCircle, Lightbulb, Target
};

// --- Support: Canned Responses ---
export interface CannedResponse {
    id: string;
    label: string;
    category: 'greeting' | 'info' | 'progress' | 'resolution' | 'escalation';
    text: string;
}

export const CANNED_RESPONSES: CannedResponse[] = [
    {
        id: 'ack',
        label: 'Acuse de recibo',
        category: 'greeting',
        text: 'Hola, hemos recibido tu solicitud y estamos revisándola. Te responderemos lo antes posible.'
    },
    {
        id: 'need_info',
        label: 'Necesitamos más info',
        category: 'info',
        text: 'Para poder ayudarte mejor, necesitamos que nos facilites más información sobre el problema. ¿Podrías indicarnos los pasos exactos que realizaste y el error que aparece?'
    },
    {
        id: 'need_screenshot',
        label: 'Pedir captura de pantalla',
        category: 'info',
        text: 'Para diagnosticar el problema correctamente, ¿podrías adjuntar una captura de pantalla del error? Esto nos ayudará a resolverlo más rápido.'
    },
    {
        id: 'investigating',
        label: 'En investigación',
        category: 'progress',
        text: 'Estamos investigando tu caso. Nuestro equipo técnico está trabajando en una solución. Te mantendremos informado de cualquier avance.'
    },
    {
        id: 'workaround',
        label: 'Solución temporal',
        category: 'progress',
        text: 'Hemos identificado el problema y estamos trabajando en una solución definitiva. Mientras tanto, te sugerimos la siguiente solución temporal:'
    },
    {
        id: 'resolved',
        label: 'Problema resuelto',
        category: 'resolution',
        text: 'El problema ha sido resuelto correctamente. Si vuelves a experimentar alguna incidencia, no dudes en contactarnos de nuevo. ¡Gracias por tu paciencia!'
    },
    {
        id: 'not_reproducible',
        label: 'No reproducible',
        category: 'resolution',
        text: 'Hemos intentado reproducir el problema pero no hemos conseguido replicarlo. ¿Podrías confirmar si el problema persiste? Si es así, necesitaríamos más detalles.'
    },
    {
        id: 'escalated',
        label: 'Escalado a desarrollo',
        category: 'escalation',
        text: 'Tu caso ha sido escalado al equipo de desarrollo para una revisión en profundidad. Te notificaremos en cuanto tengamos una actualización.'
    },
];

// SLA Configuration
export const SLA_CONFIG = {
    TARGET_HOURS: 24,    // SLA target in hours
    WARNING_HOURS: 18,   // Yellow zone
    CRITICAL_HOURS: 24,  // Red zone
};
