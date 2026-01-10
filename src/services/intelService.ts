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
        team?: 'Real Madrid' | 'FC Barcelona' | 'Atlético Madrid';
        opponent?: string;
        opponentLogo?: string;
        teamLogo?: string;
        isHome?: boolean;
        isLive?: boolean;
        score?: { home: number; away: number };
        minute?: number;
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

// Reliable high-res logos from luukhopman/football-logos
const BASE_LOGO_URL = 'https://raw.githubusercontent.com/luukhopman/football-logos/master/logos';

const TEAM_LOGOS = {
    'Real Madrid': `${BASE_LOGO_URL}/ESP/Real%20Madrid.png`,
    'FC Barcelona': `${BASE_LOGO_URL}/ESP/FC%20Barcelona.png`,
    'Atlético Madrid': `${BASE_LOGO_URL}/ESP/Atletico%20Madrid.png`,
    'Sevilla FC': `${BASE_LOGO_URL}/ESP/Sevilla.png`,
    'Valencia CF': `${BASE_LOGO_URL}/ESP/Valencia.png`,
    'Villarreal CF': `${BASE_LOGO_URL}/ESP/Villarreal.png`,
    'Real Sociedad': `${BASE_LOGO_URL}/ESP/Real%20Sociedad.png`,
    'Athletic Club': `${BASE_LOGO_URL}/ESP/Athletic%20Club.png`,
    'Girona FC': `${BASE_LOGO_URL}/ESP/Girona.png`,
    'Real Betis': `${BASE_LOGO_URL}/ESP/Real%20Betis.png`,
    'Celta Vigo': `${BASE_LOGO_URL}/ESP/Celta%20Vigo.png`,
    'RCD Osasuna': `${BASE_LOGO_URL}/ESP/Osasuna.png`,
    'Getafe CF': `${BASE_LOGO_URL}/ESP/Getafe.png`,
    'Liverpool FC': `${BASE_LOGO_URL}/ENG/Liverpool.png`,
    'Bayern Munich': `${BASE_LOGO_URL}/GER/Bayern%20Munchen.png`,
    'Manchester City': `${BASE_LOGO_URL}/ENG/Manchester%20City.png`,
    'PSG': `${BASE_LOGO_URL}/FRA/Paris%20Saint-Germain.png`,
    'Manchester United': `${BASE_LOGO_URL}/ENG/Manchester%20United.png`,
    'Arsenal FC': `${BASE_LOGO_URL}/ENG/Arsenal.png`,
    'Inter Milan': `${BASE_LOGO_URL}/ITA/Inter%20Milan.png`,
};

const getWeatherRisk = (code: number): { title: string; severity: 'warning' | 'critical' } | null => {
    if ([95, 96, 99].includes(code)) return { title: 'Tormenta Eléctrica', severity: 'critical' };
    if ([65, 82].includes(code)) return { title: 'Lluvia Muy Fuerte', severity: 'critical' };
    if ([55, 61, 63, 80, 81].includes(code)) return { title: 'Lluvia Moderada', severity: 'warning' };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { title: 'Nieve/Granizo', severity: 'critical' };
    return null;
};

export const intelService = {
    getIntelForWeek: async (dateInRange: Date, weatherDaily?: any): Promise<IntellectualEvent[]> => {
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

        // 2. Weather Risks
        if (weatherDaily?.time) {
            weatherDaily.time.forEach((t: string, i: number) => {
                const date = new Date(t);
                if (isWithinInterval(date, { start, end })) {
                    const code = weatherDaily.weathercode[i];
                    const risk = getWeatherRisk(code);
                    if (risk) {
                        events.push({
                            id: `weather-${date.getTime()}`,
                            type: 'weather',
                            title: risk.title,
                            subtitle: 'Riesgo Seguridad / Demanda Delivery',
                            date: date,
                            severity: risk.severity,
                            impact: risk.severity === 'critical' ? 'reduce_fleet_safety' : 'increase_fleet_weather',
                            metadata: { weatherCode: code }
                        });
                    }
                }
            });
        }

        // 3. Mock Sports Events (Jan 2026 - Supercopa de España)
        const mockMatches: IntellectualEvent[] = [
            {
                id: 'match-barca-super-1',
                type: 'match',
                title: 'Athletic Club vs FC Barcelona',
                subtitle: 'Supercopa de España - Semifinal 1',
                date: new Date(2026, 0, 7, 20, 0), // Wednesday Jan 7th
                severity: 'critical',
                impact: 'Alto impacto en demanda delivery durante la semifinal.',
                metadata: {
                    team: 'FC Barcelona',
                    teamLogo: TEAM_LOGOS['FC Barcelona'],
                    opponent: 'Athletic Club',
                    opponentLogo: TEAM_LOGOS['Athletic Club'],
                    isHome: false
                }
            },
            {
                id: 'match-rm-super-1',
                type: 'match',
                title: 'Atlético de Madrid vs Real Madrid',
                subtitle: 'Supercopa de España - Semifinal 2',
                date: new Date(2026, 0, 8, 20, 0), // Thursday Jan 8th
                severity: 'critical',
                impact: 'Derbi madrileño con impacto crítico (+40%) en logística.',
                metadata: {
                    team: 'Real Madrid',
                    teamLogo: TEAM_LOGOS['Real Madrid'],
                    opponent: 'Atlético Madrid',
                    opponentLogo: TEAM_LOGOS['Atlético Madrid'],
                    isHome: false
                }
            },
            {
                id: 'match-final-super-1',
                type: 'match',
                title: 'Real Madrid vs FC Barcelona',
                subtitle: 'Supercopa de España - Gran Final',
                date: new Date(2026, 0, 11, 20, 0), // Sunday Jan 11th
                severity: 'critical',
                impact: 'El CLÁSICO. Máximo impacto histórico en demanda y logística.',
                metadata: {
                    team: 'Real Madrid',
                    teamLogo: TEAM_LOGOS['Real Madrid'],
                    opponent: 'FC Barcelona',
                    opponentLogo: TEAM_LOGOS['FC Barcelona'],
                    isHome: true
                }
            }
        ];

        mockMatches.forEach(m => {
            // Check if match belongs to the current week
            if (isWithinInterval(m.date, { start, end })) {
                events.push(m);
            }
        });

        // Final Filter: Only return matches involving Real Madrid or FC Barcelona
        const filteredEvents = events.filter(e => {
            if (e.type !== 'match') return false;
            const teams = [e.metadata?.team, e.metadata?.opponent];
            return teams.includes('Real Madrid') || teams.includes('FC Barcelona');
        });

        return filteredEvents;
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

export const useOperationsIntel = (referenceDate: Date, weatherDaily?: any) => {
    const [events, setEvents] = useState<IntellectualEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSimulatingLive, setIsSimulatingLive] = useState(false);

    const loadIntel = async () => {
        setLoading(true);
        const data = await intelService.getIntelForWeek(referenceDate, weatherDaily);
        setEvents(data);
        setLoading(false);
    };

    useEffect(() => {
        loadIntel();
    }, [referenceDate.getTime(), weatherDaily ? JSON.stringify(weatherDaily.time) : 'none']);

    // ... (Simulation logic remains same)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isSimulatingLive) {
            setEvents((prev: IntellectualEvent[]) => prev.map((e: IntellectualEvent) => {
                if (e.type === 'match' && e.metadata?.team === 'Real Madrid') {
                    return {
                        ...e,
                        metadata: {
                            ...e.metadata,
                            isLive: true,
                            minute: 1,
                            score: { home: 0, away: 0 }
                        }
                    };
                }
                return e;
            }));

            interval = setInterval(() => {
                setEvents((prev: IntellectualEvent[]) => prev.map((e: IntellectualEvent) => {
                    if (e.type === 'match' && e.metadata?.isLive) {
                        const newMin = (e.metadata.minute || 0) + 1;
                        const newScore = { ...(e.metadata.score || { home: 0, away: 0 }) };
                        if (Math.random() > 0.95) newScore.home++;
                        if (newMin > 90) {
                            setIsSimulatingLive(false);
                            return { ...e, metadata: { ...e.metadata, isLive: false, minute: 90, score: newScore } };
                        }
                        return { ...e, metadata: { ...e.metadata, minute: newMin, score: newScore } };
                    }
                    return e;
                }));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isSimulatingLive]);

    return {
        events,
        loading,
        isSimulatingLive,
        toggleSimulation: () => setIsSimulatingLive(!isSimulatingLive)
    };
};
