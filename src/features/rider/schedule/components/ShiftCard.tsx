import React from 'react';
import { format } from 'date-fns';
import { MapPin, Bike, Clock } from 'lucide-react';
import { Shift } from '../../../../services/shiftService';

interface ShiftCardProps {
    shift: Shift;
    isPast?: boolean;
}

export const ShiftCard: React.FC<ShiftCardProps> = ({ shift, isPast }) => {
    const start = new Date(shift.startAt);
    const end = new Date(shift.endAt);

    return (
        <div className={`
            relative overflow-hidden rounded-2xl p-4 transition-all active:scale-[0.98] cursor-pointer
            ${isPast
                ? 'bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 opacity-60'
                : 'bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700'
            }
        `}>
            {/* Status Indicator Bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-2 ${isPast ? 'bg-slate-300 dark:bg-slate-700' : 'bg-blue-600 shadow-[2px_0_10px_rgba(37,99,235,0.2)]'}`} />

            <div className="flex gap-4 pl-2">
                {/* Time Block */}
                <div className="flex flex-col items-center justify-center min-w-[3.5rem] border-r border-slate-100 dark:border-slate-700 pr-4">
                    <span className="text-lg font-bold text-slate-900 dark:text-white leading-none">
                        {format(start, 'HH:mm')}
                    </span>
                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-600 my-1"></div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {format(end, 'HH:mm')}
                    </span>
                </div>

                {/* Info Block */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            <Clock size={12} strokeWidth={3} />
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Turno Regular
                        </span>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <MapPin size={14} className="text-slate-400 flex-shrink-0" />
                            <span className="truncate">Base Principal - Madrid</span>
                        </div>

                        {shift.motoPlate && (
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                                <Bike size={14} className="text-slate-400 flex-shrink-0" />
                                <span>{shift.motoPlate}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
