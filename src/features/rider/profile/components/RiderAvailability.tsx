import React from 'react';
import { Calendar, Sun, Moon, Check } from 'lucide-react';

export interface TimeSlot {
    id: string;
    day: string;
    slots: string[];
}

export interface RiderAvailabilityProps {
    availability: TimeSlot[];
    onUpdate: (slotId: string, time: string) => void;
}

const RiderAvailability: React.FC<RiderAvailabilityProps> = ({ availability }) => {

    return (
        <div className="rider-availability">
            <div className="px-6">
                <div className="glass-premium rounded-[2rem] p-6 relative overflow-hidden">
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-amber-500 to-amber-400" />

                    <div className="relative z-10">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <Calendar size={16} className="text-amber-500" />
                            Disponibilidad Semanal
                        </h3>

                        <div className="space-y-3">
                            {availability.map((day) => (
                                <div
                                    key={day.id}
                                    className="flex flex-col gap-2 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-white/10 dark:border-white/5"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                                            {day.day}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {day.slots.length > 0 ? (
                                                <span className="flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400">
                                                    <Check size={12} />
                                                    {day.slots.length} horarios
                                                </span>
                                            ) : (
                                                <span className="text-[9px] text-slate-500 dark:text-slate-400">
                                                    Sin horarios
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-white/5">
                                            <Sun size={12} className="text-amber-500" />
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                Mañana
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-white/5">
                                            <Moon size={12} className="text-indigo-500" />
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                Tarde
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiderAvailability;