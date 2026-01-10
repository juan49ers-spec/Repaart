import { parseISO, differenceInMinutes } from 'date-fns';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface Shift {
    startAt: string;
    endAt: string;
    riderId?: string | null;
    riderName?: string;
    shiftId?: string;
    id?: string;
    day?: string;
    startTime?: string;
    endTime?: string;
    [key: string]: any;
}

export interface WeeklyMetrics {
    totalHours: number;
    activeRiders: number;
    unassigned: number;
    coverage: number;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Calcula las métricas operativas de la semana basándose en los turnos raw.
 * @param shifts - Array de objetos turno (start, end, riderId, etc.)
 * @returns Métricas semanales calculadas
 */
export const calculateWeeklyMetrics = (shifts: Shift[] = []): WeeklyMetrics => {
    // 1. Caso base: Sin datos
    if (!shifts || shifts.length === 0) {
        return {
            totalHours: 0,
            activeRiders: 0,
            unassigned: 0,
            coverage: 0
        };
    }

    // 2. Calcular Horas Reales (Suma de duraciones)
    const totalMinutes = shifts.reduce((acc, shift) => {
        // Aseguramos que trabajamos con objetos Date
        const start = typeof shift.startAt === 'string' ? parseISO(shift.startAt) : shift.startAt;
        const end = typeof shift.endAt === 'string' ? parseISO(shift.endAt) : shift.endAt;

        // Calculamos diferencia. Si hay error en fechas, sumamos 0.
        const duration = differenceInMinutes(end as Date, start as Date);
        return acc + (isNaN(duration) ? 0 : duration);
    }, 0);

    // 3. Riders Únicos (Fuerza laboral activa)
    // Filtramos turnos que tengan riderId asignado
    const activeRiders = new Set(
        shifts
            .filter(s => s.riderId)
            .map(s => s.riderId)
    ).size;

    // 4. Huecos (Turnos sin asignar)
    const unassigned = shifts.filter(s => !s.riderId).length;

    // 5. Cobertura (Turnos Cubiertos / Total Turnos)
    const totalSlots = shifts.length;
    const assignedSlots = totalSlots - unassigned;
    const coverage = totalSlots > 0
        ? Math.round((assignedSlots / totalSlots) * 100)
        : 0;

    return {
        totalHours: Math.round(totalMinutes / 60), // Convertimos a horas enteras
        activeRiders,
        unassigned,
        coverage
    };
};
