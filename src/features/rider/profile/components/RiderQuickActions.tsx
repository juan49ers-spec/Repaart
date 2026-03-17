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

/**
 * RiderQuickActions: Rediseño "Clean Apple"
 * Botones de acción táctiles, con micro-interacciones y diseño minimalista.
 */
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
                        className="group relative flex flex-col items-center gap-4 p-6 bg-slate-50 hover:bg-white rounded-[2rem] border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 active:scale-95"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-emerald-500 group-hover:bg-emerald-50 group-hover:shadow-emerald-100 transition-all duration-300 border border-slate-100">
                            <Icon size={24} />
                        </div>
                        <div className="text-center space-y-1">
                            <span className="block text-[10px] font-black text-slate-800 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">
                                {action.label}
                            </span>
                            {action.description && (
                                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                    {action.description}
                                </span>
                            )}
                        </div>
                        {action.badge && (
                            <span className="absolute top-4 right-4 px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded-full shadow-lg border-2 border-white animate-in zoom-in duration-300">
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