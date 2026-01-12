import React, { useMemo } from 'react';
import { Shift } from '../../../hooks/useWeeklySchedule';

interface CoverageFooterProps {
    shifts: Shift[];
    selectedDate: Date; // To filter shifts for the day
}

export const CoverageFooter: React.FC<CoverageFooterProps> = ({ shifts, selectedDate }) => {
    // HARDCODED DEMAND CURVE (Mock for now, should come from settings)
    const demandCurve: Record<number, number> = {
        12: 2, 13: 4, 14: 5, 15: 4, 16: 2, // Lunch
        19: 2, 20: 5, 21: 7, 22: 6, 23: 3  // Dinner
    };

    const coverage = useMemo(() => {
        const counts = Array(24).fill(0);
        const dateStr = selectedDate.toISOString().split('T')[0];

        shifts.forEach(shift => {
            if (!shift.startAt.startsWith(dateStr)) return;
            const startH = new Date(shift.startAt).getHours();
            const endH = new Date(shift.endAt).getHours();

            for (let h = startH; h < endH; h++) {
                if (h >= 0 && h < 24) counts[h]++;
            }
        });
        return counts;
    }, [shifts, selectedDate]);

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 z-50 flex items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)] ml-64"> {/* ml-64 to offset sidebar */}
            <div className="flex-1 flex items-center h-full px-4 overflow-x-hidden">
                <div className="w-24 shrink-0 font-bold text-slate-400 text-xs uppercase tracking-widest border-r border-slate-100 pr-4 mr-4">
                    Cobertura
                </div>

                <div className="flex-1 flex h-full">
                    {Array.from({ length: 24 }).map((_, hour) => {
                        const count = coverage[hour];
                        const required = demandCurve[hour] || 0;

                        // Status Color
                        let bgClass = "bg-slate-50";
                        let textClass = "text-slate-300";

                        if (required > 0) {
                            if (count >= required) {
                                bgClass = "bg-emerald-50 border-t-2 border-emerald-400";
                                textClass = "text-emerald-700 font-bold";
                            } else if (count >= required - 1) {
                                bgClass = "bg-amber-50 border-t-2 border-amber-400";
                                textClass = "text-amber-700 font-bold";
                            } else {
                                bgClass = "bg-rose-50 border-t-2 border-rose-500 animate-pulse";
                                textClass = "text-rose-600 font-black";
                            }
                        }

                        // Only render Prime Hours + adjacent to keep visualization clean? 
                        // Or all hours for timeline alignment? Timeline alignment is crucial.
                        // Assuming Timeline has equal width cells.

                        return (
                            <div
                                key={hour}
                                className={`flex-1 min-w-[60px] flex flex-col items-center justify-center border-r border-slate-100 text-xs transition-colors duration-300 ${bgClass}`}
                            >
                                <span className={textClass}>
                                    {count}/{required}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
