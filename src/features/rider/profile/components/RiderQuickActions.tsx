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
                        className="group relative flex flex-col items-center gap-4 p-5 bg-white rounded-xl border-2 border-slate-200 hover:border-slate-900 transition-colors active:bg-slate-50"
                    >
                        <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                            <Icon size={24} strokeWidth={2.5}/>
                        </div>
                        <div className="text-center space-y-1">
                            <span className="block text-sm font-bold text-slate-900">
                                {action.label}
                            </span>
                            {action.description && (
                                <span className="block text-xs font-semibold text-slate-500">
                                    {action.description}
                                </span>
                            )}
                        </div>
                        {action.badge && (
                            <span className="absolute top-3 right-3 px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black tracking-wider rounded-md border-2 border-white">
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