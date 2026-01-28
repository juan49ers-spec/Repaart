import React from 'react';
import { Calendar, Clock, Sun, Moon, Check, Loader2 } from 'lucide-react';
import { useRiderPreferences, DayOfWeek, PeriodOfDay } from '../hooks/useRiderPreferences';
import { format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

const RiderAvailabilityView: React.FC = () => {
    const {
        preferences,
        loading,
        toggleAvailability,
        updateWeeklyGoal,
        toggleAvailabilitySlot,
    } = useRiderPreferences();

    const daysConfig: { key: DayOfWeek; label: string }[] = [
        { key: 'monday', label: 'Lunes' },
        { key: 'tuesday', label: 'Martes' },
        { key: 'wednesday', label: 'Miércoles' },
        { key: 'thursday', label: 'Jueves' },
        { key: 'friday', label: 'Viernes' },
        { key: 'saturday', label: 'Sábado' },
        { key: 'sunday', label: 'Domingo' },
    ];

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

    const isAvailable = preferences?.availability === 'available';
    const weeklyHours = preferences?.weeklyGoalHours ?? 40;
    const weeklyAvailability = preferences?.weeklyAvailability;

    const handleToggleSlot = (day: DayOfWeek, period: PeriodOfDay) => {
        toggleAvailabilitySlot(day, period);
    };

    if (loading || !weeklyAvailability) {
        return (
            <div className="h-[calc(100vh-64px)] flex items-center justify-center">
                <div className="relative">
                    <Loader2 className="animate-spin text-emerald-500" size={48} />
                    <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col gap-6 overflow-y-auto scroll-smooth p-6">
            <div className="space-y-4">
                <h1 className="text-apple-h1 text-slate-900 dark:text-white">
                    Mi Disponibilidad
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Configura tu disponibilidad semanal para recibir asignaciones de turnos
                </p>
            </div>

            <div className="glass-premium rounded-[2rem] p-6 relative overflow-hidden">
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-emerald-400" />

                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isAvailable ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                            <Check size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                                Estado de Disponibilidad
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                {isAvailable ? 'Disponible para turnos' : 'No disponible temporalmente'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => toggleAvailability()}
                        className={`
                            relative w-16 h-8 rounded-full transition-all duration-300
                            ${isAvailable
                                ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                                : 'bg-slate-300 dark:bg-slate-600'
                            }
                        `}
                    >
                        <div className={`
                            absolute top-0.5 w-7 h-7 bg-white rounded-full shadow-md transition-all duration-300
                            ${isAvailable ? 'left-8.5' : 'left-0.5'}
                        `} />
                    </button>
                </div>
            </div>

            <div className="glass-premium rounded-[2rem] p-6 relative overflow-hidden">
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-indigo-500 to-indigo-400" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Clock size={16} className="text-indigo-500" />
                            Objetivo Semanal
                        </h3>
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                            {weeklyHours}h
                        </span>
                    </div>
                    <input
                        type="range"
                        min="20"
                        max="50"
                        value={weeklyHours}
                        onChange={(e) => updateWeeklyGoal(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                        <span>20h</span>
                        <span>35h</span>
                        <span>50h</span>
                    </div>
                </div>
            </div>

            <div className="glass-premium rounded-[2rem] p-6 relative overflow-hidden">
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-amber-500 to-amber-400" />

                <div className="relative z-10">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Calendar size={16} className="text-amber-500" />
                        Horario Semanal
                    </h3>

                    <div className="space-y-3">
                        {daysConfig.map((dayConfig, index) => {
                            const date = addDays(weekStart, index);
                            const slots = weeklyAvailability[dayConfig.key];
                            const dayId = dayConfig.key;

                            return (
                                <div
                                    key={dayId}
                                    className="flex flex-col gap-2 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-white/10 dark:border-white/5"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                                                {dayConfig.label}
                                            </span>
                                            <span className="text-[9px] text-slate-500 dark:text-slate-400 ml-2">
                                                {format(date, 'd MMM', { locale: es })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {slots.morning && <Sun size={12} className="text-amber-500" />}
                                            {slots.afternoon && <Clock size={12} className="text-indigo-500" />}
                                            {slots.evening && <Moon size={12} className="text-slate-500" />}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggleSlot(dayId, 'morning')}
                                            className={`
                                                flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                                                transition-all duration-300
                                                ${slots.morning
                                                    ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-600'
                                                }
                                            `}
                                        >
                                            <Sun size={14} />
                                            <span className="text-[10px] font-bold">Mañana</span>
                                        </button>
                                        <button
                                            onClick={() => handleToggleSlot(dayId, 'afternoon')}
                                            className={`
                                                flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                                                transition-all duration-300
                                                ${slots.afternoon
                                                    ? 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/30'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-600'
                                                }
                                            `}
                                        >
                                            <Clock size={14} />
                                            <span className="text-[10px] font-bold">Tarde</span>
                                        </button>
                                        <button
                                            onClick={() => handleToggleSlot(dayId, 'evening')}
                                            className={`
                                                flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                                                transition-all duration-300
                                                ${slots.evening
                                                    ? 'bg-slate-700 dark:bg-slate-600 text-slate-200 border border-slate-600 dark:border-slate-500'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-600'
                                                }
                                            `}
                                        >
                                            <Moon size={14} />
                                            <span className="text-[10px] font-bold">Noche</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiderAvailabilityView;