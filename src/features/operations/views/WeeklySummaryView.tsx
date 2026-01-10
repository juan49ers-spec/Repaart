import { useMemo, FC } from 'react';
import { Clock, Users, AlertTriangle, ShieldCheck } from 'lucide-react';
import WeeklyCalendarGrid from '../WeeklyCalendarGrid'; // Asegúrate de la ruta correcta
// import { useWeeklySchedule } from '../../../hooks/useWeeklySchedule'; // Movido a Dashboard
import KpiCard from '../components/KpiCard';
import { calculateWeeklyMetrics } from '../../../utils/operationalMetrics';

interface WeeklySummaryViewProps {
    currentDate: Date;
    onSlotClick: (slot: any) => void;
    weekData: any; // Allow full WeekData or partial
    loading?: boolean;
    franchiseId?: string | null;
}

const WeeklySummaryView: FC<WeeklySummaryViewProps> = ({ currentDate, onSlotClick, weekData, loading = false }) => {
    // 1. Fetch de Datos (Ahora via Props)
    // const { weekData, loading } = useWeeklySchedule(franchiseId, true, currentDate);

    // Memoize shifts extraction to stabilize dependencies
    const shifts = useMemo(() => {
        const rawShifts = weekData?.shifts || [];
        return rawShifts.map((s: any) => ({
            ...s,
            id: s.shiftId || s.id,
            riderName: s.riderName || 'Sin asignar',
            day: s.day || (s.startAt ? new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(new Date(s.startAt)) : ''),
            startTime: s.startTime || (s.startAt ? new Date(s.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
            endTime: s.endTime || (s.endAt ? new Date(s.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')
        }));
    }, [weekData]);

    // 2. Cálculo de Métricas en Tiempo Real (Memoizado) 🧠
    // Solo se recalcula si 'shifts' cambia.
    const metrics = useMemo(() => calculateWeeklyMetrics(shifts), [shifts]);

    return (

        <div className="flex flex-col h-full bg-slate-50">
            {/* PANEL DE CONTROL (KPIs) */}
            <div className="grid grid-cols-1 md://grid-cols-2 lg:grid-cols-4 gap-4 p-6 border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
                <KpiCard
                    title="Carga Horaria"
                    value={`${metrics.totalHours}h`}
                    subtext="Volumen total esta semana"
                    icon={Clock}
                    color="indigo"
                />
                <KpiCard
                    title="Fuerza Operativa"
                    value={metrics.activeRiders}
                    subtext="Riders únicos asignados"
                    icon={Users}
                    color="blue"
                />
                <KpiCard
                    title="Turnos Libres"
                    value={metrics.unassigned}
                    subtext={metrics.unassigned > 0 ? "⚠️ Requiere asignación" : "Todo cubierto"}
                    icon={AlertTriangle}
                    // Semáforo visual: Rojo si hay huecos, Gris si está limpio
                    color={metrics.unassigned > 0 ? "rose" : "slate"}
                />
                <KpiCard
                    title="Nivel Cobertura"
                    value={`${metrics.coverage}%`}
                    subtext="Eficiencia de planificación"
                    icon={ShieldCheck}
                    // Semáforo visual: Verde si > 90%, Ámbar si > 75%, Rojo si crítico
                    color={metrics.coverage >= 90 ? "emerald" : metrics.coverage >= 75 ? "amber" : "rose"}
                    // Simulamos una tendencia basada en la cobertura (puedes refinar esto)
                    trend={metrics.coverage >= 95 ? 2.5 : metrics.coverage < 80 ? -5 : 0}
                />
            </div>

            {/* ÁREA DE VISUALIZACIÓN (GRID) */}
            <div className="flex-1 p-6 relative flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm relative flex flex-col">

                    {/* Overlay de Carga */}
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-[2px]">
                            <div className="flex flex-col items-center gap-3 animate-in fade-in duration-300">
                                <div className="animate-spin h-8 w-8 border-3 border-indigo-500 rounded-full border-t-transparent shadow-lg shadow-indigo-500/20" />
                                <span className="text-sm font-bold text-slate-500 tracking-wide uppercase">Analizando operativa...</span>
                            </div>
                        </div>
                    )}

                    {/* Grid Interactivo */}
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <WeeklyCalendarGrid
                            shifts={shifts}
                            currentDate={currentDate}
                            onSlotClick={onSlotClick}
                            readOnly={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeeklySummaryView;
