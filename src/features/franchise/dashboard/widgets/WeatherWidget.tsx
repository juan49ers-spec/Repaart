import React from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useWeather } from '../../../../hooks/useWeather';
import { getWeatherIcon } from '../../../../utils/weather';

interface WeatherWidgetProps {
    franchiseId?: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ franchiseId }) => {
    const { user } = useAuth();
    // In this system, Franchises are stored as Users with role='franchise', so they live in the 'users' collection.
    // Therefore, we always query 'users', whether using franchiseId (Admin view) or user.uid (Franchisee view).

    const targetId = franchiseId || user?.uid;
    const { current, loading, error } = useWeather(targetId, 'users');

    if (loading) return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 rounded-full border border-slate-200 shadow-sm animate-pulse">
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
            <span className="text-xs text-slate-400 font-medium">Clima...</span>
        </div>
    );

    if (error || !current) return null;

    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-default">
            <div className="group-hover:scale-110 transition-transform duration-300">
                {getWeatherIcon(current.weatherCode, "w-14 h-14")}
            </div>
            <div className="flex flex-col leading-none">
                <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                    {Math.round(current.temperature)}°C
                </span>
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5 mt-0.5 max-w-[100px] truncate">
                    <MapPin className="w-3 h-3 text-slate-300" /> {current.city}
                </span>
            </div>
        </div>
    );
};

export default WeatherWidget;
