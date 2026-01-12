import React, { useRef } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface WeekStripProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
}

export const WeekStrip: React.FC<WeekStripProps> = ({ selectedDate, onSelectDate }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const today = new Date();

    // Generate dates: Today - 2 days ... Today + 14 days
    const dates: Date[] = [];
    const startDate = addDays(today, -2); // Start a bit behind
    for (let i = 0; i < 14; i++) {
        dates.push(addDays(startDate, i));
    }

    const handleSelect = (date: Date) => {
        onSelectDate(date);
        // Optional: Smooth scroll to center
    };

    return (
        <div className="w-full bg-transparent z-10">
            <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto py-2 px-6 hide-scrollbar gap-3 snap-x"
            >
                {dates.map((date, index) => {
                    const isSelected = isSameDay(date, selectedDate);
                    const isToday = isSameDay(date, today);

                    return (
                        <button
                            key={index}
                            onClick={() => handleSelect(date)}
                            className={`
                                flex-shrink-0 flex flex-col items-center justify-center
                                w-14 h-18 rounded-2xl transition-all duration-300 snap-center
                                ${isSelected
                                    ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 transform scale-110'
                                    : 'bg-slate-900/60 text-slate-500 border border-white/5'
                                }
                                ${isToday && !isSelected ? 'ring-1 ring-emerald-500/30' : ''}
                            `}
                        >
                            <span className={`text-[10px] uppercase font-black tracking-tighter mb-1 ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                                {format(date, 'EEE', { locale: es }).replace('.', '')}
                            </span>
                            <span className={`text-xl font-black tracking-tighter ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                {format(date, 'd')}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
