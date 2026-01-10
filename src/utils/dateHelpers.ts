import { differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';

/**
 * Formats a date into a human-readable "time ago" string
 * Examples: "Hace 5 minutos", "Hace 3 horas", "Hace 2 días"
 */
export const formatTimeAgo = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();

    const minutes = differenceInMinutes(now, dateObj);
    const hours = differenceInHours(now, dateObj);
    const days = differenceInDays(now, dateObj);

    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    if (days < 30) {
        const weeks = Math.floor(days / 7);
        return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    }
    const months = Math.floor(days / 30);
    return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
};

/**
 * Formats a date for display in tables
 * Example: "15 Ene 2024"
 */
export const formatShortDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(dateObj);
};
