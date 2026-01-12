import React from 'react';
import { Bike, Clock } from 'lucide-react';
import { Rider, Shift } from '../../../hooks/useWeeklySchedule';

interface SchedulerSidebarProps {
    riders: Rider[];
    searchQuery: string;
    shifts: Shift[];
}

export const SchedulerSidebar: React.FC<SchedulerSidebarProps> = ({ riders, searchQuery, shifts }) => {
    // Mock Zone Grouping for Visual Demo
    // In real app, this would come from rider.zoneId
    const groupedRiders = riders.reduce((acc, rider) => {
        const zone = (rider as any).zone || 'Zona Centro'; // Fallback
        if (!acc[zone]) acc[zone] = [];
        acc[zone].push(rider);
        return acc;
    }, {} as Record<string, Rider[]>);

    const getRiderMetrics = (rider: Rider) => {
        const riderShifts = shifts.filter(s => s.riderId === rider.id);
        const scheduledHours = riderShifts.reduce((acc, s) => {
            const start = new Date(s.startAt).getTime();
            const end = new Date(s.endAt).getTime();
            return acc + ((end - start) / (1000 * 60 * 60));
        }, 0);

        const contractHours = rider.contractHours || 40; // Use dynamic contract hours
        const remaining = Math.max(0, contractHours - scheduledHours);

        return { scheduledHours, contractHours, remaining };
    };

    const getRiderColor = (id: string, name: string) => {
        let hash = 0;
        const str = id + name;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = Math.abs(hash) % 360;
        return `hsl(${h}, 70%, 45%)`; // Consistent with Scheduler
    };

    return (
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            {/* Header / Search Mock (Handled in Parent usually, but pure visual here) */}
            <div className="h-14 border-b border-slate-100 flex items-center px-4 font-bold text-slate-700 text-sm">
                Equipo ({riders.length})
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-20"> {/* pb-20 for sticky footer space */}
                {Object.entries(groupedRiders).map(([zone, zoneRiders]) => (
                    <div key={zone}>
                        <div className="px-4 py-2 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-y border-slate-100 sticky top-0 z-10">
                            {zone}
                        </div>
                        {zoneRiders
                            .filter(r => r.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map(rider => {
                                const { remaining, contractHours, scheduledHours } = getRiderMetrics(rider);
                                const isOvertime = scheduledHours > contractHours;
                                const riderColor = getRiderColor(rider.id, rider.fullName);

                                return (
                                    <div
                                        key={rider.id}
                                        className="h-16 border-b border-slate-50 flex items-center px-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                                    >
                                        <div
                                            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-white group-hover:ring-indigo-100 transition-all"
                                            style={{ backgroundColor: riderColor }}
                                        >
                                            {rider.fullName.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="ml-3 flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-slate-700 truncate">
                                                {rider.fullName}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                                    <Bike size={10} />
                                                    <span>Moto Propia</span>
                                                </span>
                                                <span className={`text-[10px] font-medium flex items-center gap-1 ${isOvertime ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    <Clock size={10} />
                                                    {remaining}h restan
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                    </div>
                ))}
            </div>
        </div>
    );
};
