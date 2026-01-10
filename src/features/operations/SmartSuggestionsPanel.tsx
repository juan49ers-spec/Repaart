import React, { useMemo } from 'react';
import { Lightbulb, X, AlertTriangle } from 'lucide-react';

interface Shift {
    startAt: string | Date;
    [key: string]: any;
}

interface WeekData {
    shifts?: Shift[];
}

interface SmartSuggestionsPanelProps {
    weekData: WeekData | null;
    onClose: () => void;
}

const SmartSuggestionsPanel: React.FC<SmartSuggestionsPanelProps> = ({ weekData, onClose }) => {
    const suggestions = useMemo(() => {
        if (!weekData?.shifts) return [];

        const items: { type: string; icon: any; title: string; color: string }[] = [];
        const dayGroups: Record<string, number> = {};

        weekData.shifts.forEach(shift => {
            const day = new Date(shift.startAt as string | Date).toISOString().split('T')[0];
            dayGroups[day] = (dayGroups[day] || 0) + 1;
        });

        Object.entries(dayGroups).forEach(([day, count]) => {
            if (count < 3) {
                items.push({
                    type: 'warning',
                    icon: AlertTriangle,
                    title: `${new Date(day).toLocaleDateString('es-ES', { weekday: 'short' })}: Solo ${count} turnos`,
                    color: 'text-amber-400'
                });
            }
        });

        return items.slice(0, 5);
    }, [weekData]);

    if (suggestions.length === 0) return null;

    return (
        <div className="bg-slate-800/20 border border-slate-600/20 rounded px-2 py-1 mb-1">
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 flex-shrink-0">
                    <Lightbulb className="w-3 h-3 text-amber-400" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{suggestions.length} Tips</span>
                </div>

                <div className="flex gap-2 overflow-x-auto custom-scrollbar flex-1">
                    {suggestions.map((suggestion, idx) => {
                        const Icon = suggestion.icon;
                        return (
                            <div key={idx} className="flex items-center gap-1 text-[9px] text-slate-400 whitespace-nowrap bg-slate-900/30 px-2 py-0.5 rounded">
                                <Icon className={`w-2.5 h-2.5 ${suggestion.color}`} />
                                <span>{suggestion.title}</span>
                            </div>
                        );
                    })}
                </div>

                <button onClick={onClose} className="p-0.5 hover:bg-white/10 rounded transition-colors flex-shrink-0">
                    <X size={10} className="text-slate-400" />
                </button>
            </div>
        </div>
    );
};

export default SmartSuggestionsPanel;
