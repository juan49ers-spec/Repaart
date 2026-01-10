import React, { useState, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isWeekend, startOfWeek, endOfWeek, isFriday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Check } from 'lucide-react';

interface BookingCalendarProps {
    onSelectSlot: (date: Date, time: string) => void;
    onCancel: () => void;
}

const TIME_SLOTS = [
    '17:00', '17:30', '18:00', '18:30'
];

const BookingCalendar: React.FC<BookingCalendarProps> = ({ onSelectSlot, onCancel }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // Generate days for the grid
    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const handleDateClick = (day: Date) => {
        if (!isWeekend(day)) {
            setSelectedDate(day);
            setSelectedTime(null);
        }
    };

    const handleConfirm = () => {
        if (selectedDate && selectedTime) {
            onSelectSlot(selectedDate, selectedTime);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-950 overflow-hidden relative rounded-3xl selection:bg-indigo-500/30">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-500/10 rounded-full blur-[80px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

            {/* Header */}
            <div className="px-8 py-6 flex items-center justify-between z-10 shrink-0">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
                    <div className="p-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl shadow-lg shadow-slate-900/20">
                        <CalendarIcon className="w-5 h-5" />
                    </div>
                    <span>Agenda tu Sesión</span>
                </h2>
                <div className="hidden md:flex flex-col items-end mr-4">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">
                        Lun - Jue • 17:00 - 19:00
                    </span>
                </div>
                <button
                    onClick={onCancel}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all transform hover:rotate-90 duration-300"
                >
                    <div className="w-6 h-6 flex items-center justify-center font-bold text-xl mb-1">×</div>
                </button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10 px-8 pb-8 gap-8">
                {/* Calendar Side */}
                <div className="flex-1 flex flex-col">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-8 px-2">
                        <button
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            disabled={isSameMonth(currentMonth, new Date())}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm hover:shadow-md transition-all disabled:opacity-0"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white capitalize tracking-tighter cursor-default select-none">
                            {format(currentMonth, 'MMMM yyyy', { locale: es })}
                        </h3>
                        <button
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm hover:shadow-md transition-all"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 mb-4 px-2">
                        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
                            <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-3 flex-1 overflow-y-auto custom-scrollbar content-start px-2">
                        {days.map((day) => {
                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isDayWeekend = isWeekend(day);
                            const isDayToday = isToday(day);
                            const isDayFriday = isFriday(day);
                            const isDisabled = isDayWeekend || isDayFriday || (!isCurrentMonth && false) || (isSameMonth(day, new Date()) && day < new Date());

                            return (
                                <button
                                    key={day.toString()}
                                    onClick={() => !isDisabled && handleDateClick(day)}
                                    disabled={isDisabled}
                                    className={`
                                        aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 group
                                        ${!isCurrentMonth ? 'opacity-0 pointer-events-none' : ''}
                                        ${isSelected
                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl shadow-slate-900/30 dark:shadow-white/20 scale-110 z-10'
                                            : isDisabled
                                                ? 'text-slate-200 dark:text-slate-800 cursor-not-allowed'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:scale-105 hover:text-indigo-600 dark:hover:text-indigo-400'
                                        }
                                    `}
                                >
                                    <span className={`text-sm ${isSelected || isDayToday ? 'font-black' : 'font-medium'}`}>
                                        {format(day, 'd')}
                                    </span>
                                    {isDayToday && !isSelected && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 absolute bottom-3 shadow-sm group-hover:bg-indigo-600" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Time Selection Side */}
                <div className={`
                    w-full lg:w-80 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-2xl border border-white/50 dark:border-slate-800 rounded-3xl p-6 flex flex-col transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
                    ${selectedDate ? 'translate-x-0 opacity-100 shadow-2xl shadow-indigo-500/10' : 'translate-x-[20%] opacity-0 pointer-events-none absolute right-8 hidden lg:flex'}
                `}>
                    <div className="mb-6">
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1 pl-1">Horarios Disponibles</p>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white capitalize leading-tight">
                            {selectedDate ? format(selectedDate, 'EEEE d', { locale: es }) : ''}
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 space-y-2.5">
                        {TIME_SLOTS.map(time => (
                            <button
                                key={time}
                                onClick={() => setSelectedTime(time)}
                                className={`
                                    w-full p-4 rounded-xl flex items-center justify-between group transition-all duration-300 border
                                    ${selectedTime === time
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/30 scale-[1.02]'
                                        : 'bg-white dark:bg-slate-800 border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 text-slate-600 dark:text-slate-300 hover:shadow-md'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <Clock className={`w-4 h-4 ${selectedTime === time ? 'text-indigo-200' : 'text-slate-300'}`} />
                                    <span className={`text-sm font-bold tracking-tight ${selectedTime === time ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{time}</span>
                                </div>
                                {selectedTime === time && <Check className="w-4 h-4 text-white" />}
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedDate || !selectedTime}
                            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-900/20 hover:shadow-slate-900/40"
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingCalendar;
