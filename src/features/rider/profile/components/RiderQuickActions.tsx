import React from 'react';
import { Clock } from 'lucide-react';

export interface QuickAction {
    id: string;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
    description?: string;
    onClick?: () => void;
    badge?: string | number;
}

export interface RiderQuickActionsProps {
    actions: QuickAction[];
}

const RiderQuickActions: React.FC<RiderQuickActionsProps> = ({ actions }) => {
    if (actions.length === 0) return null;

    return (
        <div className="rider-quick-actions">
            <div className="glass-premium rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                <div className="absolute bottom-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 via-indigo-400 to-indigo-500/20" />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent" />

                <div className="relative z-10">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
                        <Clock size={18} className="text-indigo-500" />
                        Acciones Rápidas
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {actions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={action.id}
                                    onClick={action.onClick}
                                    className={`
                                        relative flex flex-col items-center gap-3 p-5 rounded-2xl
                                        transition-all duration-300 hover:scale-105 active:scale-95
                                        bg-slate-50/50 dark:bg-slate-800/30 border border-white/10 dark:border-white/5
                                        hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-700/30
                                        hover:shadow-xl group
                                    `}
                                >
                                    <div className={`
                                        w-12 h-12 rounded-xl flex items-center justify-center
                                        transition-all duration-300
                                        bg-white dark:bg-slate-700
                                        group-hover:bg-indigo-500 dark:group-hover:bg-indigo-600
                                        text-slate-600 dark:text-slate-400
                                        group-hover:text-white dark:group-hover:text-white
                                        shadow-md
                                    `}>
                                        <Icon size={20} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-[0.15em]">
                                        {action.label}
                                    </span>
                                    {action.badge && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center shadow-lg">
                                            {action.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiderQuickActions;