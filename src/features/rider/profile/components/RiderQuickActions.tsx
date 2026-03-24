import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface RiderQuickAction {
    id: string;
    label: string;
    icon: LucideIcon;
    description?: string;
    onClick?: () => void;
    badge?: string | number;
}

export interface RiderQuickActionsProps {
    actions: RiderQuickAction[];
}

const RiderQuickActions: React.FC<RiderQuickActionsProps> = ({ actions }) => {
    if (actions.length === 0) return null;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {actions.map((action) => {
                const Icon = action.icon;
                return (
                    <button
                        key={action.id}
                        onClick={action.onClick}
                        className="group relative flex flex-col items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500/50 hover:shadow-md transition-all active:scale-95"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors border border-slate-100 group-hover:border-emerald-100">
                            <Icon size={24} strokeWidth={2}/>
                        </div>
                        <div className="text-center space-y-1">
                            <span className="block text-xs font-black uppercase tracking-wider text-slate-800 group-hover:text-emerald-600 transition-colors">
                                {action.label}
                            </span>
                            {action.description && (
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    {action.description}
                                </span>
                            )}
                        </div>
                        {action.badge && (
                            <span className="absolute top-3 right-3 px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black tracking-wider rounded-md border-2 border-white shadow-sm">
                                {action.badge}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default RiderQuickActions;