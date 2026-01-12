import { useState, useEffect } from 'react';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { toLocalDateString } from '../utils/dateUtils';

export interface IntellectualEvent {
    id: string;
    type: 'holiday' | 'match' | 'weather' | 'custom';
    title: string;
    subtitle?: string;
    date: Date;
    severity: 'info' | 'warning' | 'critical';
    impact: string;
    metadata?: {
        weatherCode?: number;
    };
}

// 2026 Spanish National Holidays (Simplified)
const HOLIDAYS_2026 = [
    { date: new Date(2026, 0, 1), title: 'Año Nuevo' },
    { date: new Date(2026, 0, 6), title: 'Epifanía del Señor' },
    { date: new Date(2026, 3, 2), title: 'Jueves Santo' },
    { date: new Date(2026, 3, 3), title: 'Viernes Santo' },
    { date: new Date(2026, 4, 1), title: 'Fiesta del Trabajo' },
    { date: new Date(2026, 7, 15), title: 'Asunción de la Virgen' },
    { date: new Date(2026, 9, 12), title: 'Fiesta Nacional de España' },
    { date: new Date(2026, 10, 1), title: 'Todos los Santos' },
    { date: new Date(2026, 11, 6), title: 'Día de la Constitución' },
    { date: new Date(2026, 11, 8), title: 'Inmaculada Concepción' },
    { date: new Date(2026, 11, 25), title: 'Natividad del Señor' },
];


export const intelService = {
    getIntelForWeek: async (dateInRange: Date): Promise<IntellectualEvent[]> => {
        const start = startOfWeek(dateInRange, { weekStartsOn: 1 });
        const end = endOfWeek(dateInRange, { weekStartsOn: 1 });
        const events: IntellectualEvent[] = [];

        // 1. Process Holidays
        HOLIDAYS_2026.forEach(h => {
            if (isWithinInterval(h.date, { start, end })) {
                events.push({
                    id: `holiday-${h.date.getTime()}`,
                    type: 'holiday',
                    title: `Festivo: ${h.title}`,
                    subtitle: 'Aumento de demanda esperado',
                    date: h.date,
                    severity: 'warning',
                    impact: 'increase_fleet'
                });
            }
        });

        // 2. Weather Risks - Disabled (per user request)

        // Mock sports removed by user request (non-real data)
        return events; // Return only events already in the array (e.g. weather)
    },

    getEventsByDay: (events: IntellectualEvent[]): Record<string, IntellectualEvent[]> => {
        const grouped: Record<string, IntellectualEvent[]> = {};
        events.forEach(event => {
            const dateKey = toLocalDateString(event.date);
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(event);
        });
        return grouped;
    }
};

export const useOperationsIntel = (referenceDate: Date) => {
    const [events, setEvents] = useState<IntellectualEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadIntel = async () => {
            setLoading(true);
            const data = await intelService.getIntelForWeek(referenceDate);
            setEvents(data);
            setLoading(false);
        };
        loadIntel();
    }, [referenceDate]);

    return {
        events,
        loading
    };
};
