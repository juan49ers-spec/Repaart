import React from 'react';
import { Inbox, Ticket, Star, FileText, Bell, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PendingAction {
    id: string;
    type: 'ticket' | 'premium' | 'record' | 'alert';
    title: string;
    subtitle: string;
    priority: 'low' | 'normal' | 'high' | 'critical';
    timestamp?: Date;
}

interface ControlPendingActionsWidgetProps {
    data: {
        total: number;
        tickets: number;
        premium: number;
        records: number;
        alerts: number;
        list: PendingAction[];
    };
    loading?: boolean;
    onNavigate?: (tab: string) => void;
}

const PendingActionsWidget: React.FC<ControlPendingActionsWidgetProps> = ({ data, loading, onNavigate }) => {
    const navigate = useNavigate();
    const [filter, setFilter] = React.useState<'all' | 'premium' | 'support'>('all');

    const filteredList = data.list.filter(item => {
        if (filter === 'all') return true;
        if (filter === 'premium') return item.type === 'premium';
        if (filter === 'support') return item.type === 'ticket';
        return true;
    });

    if (loading) {
        return (
            <div className="workstation-card p-4 h-full flex flex-col space-y-3">
                <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                <div className="space-y-2 flex-1">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-10 bg-slate-50 dark:bg-slate-800/40 rounded animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    const getRelativeTime = (_date?: Date) => {
        return '2h';
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full overflow-hidden transition-all hover:shadow-md">
            {/* HEADER */}
            <div className="p-5 pb-3">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                            <Inbox className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                                Acciones Pendientes
                            </h3>
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{data.total} tareas en cola</div>
                        </div>
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        {(['all', 'premium', 'support'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={(e) => { e.stopPropagation(); setFilter(tab); }}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${filter === tab
                                    ? 'bg-white dark:bg-slate-700 shadow-sm text-rose-600 dark:text-white'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                    }`}
                            >
                                {tab === 'all' ? 'Todo' : tab === 'premium' ? 'VIP' : 'Soporte'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ACTION LIST */}
            <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar px-3 pb-3">
                {filteredList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-6 text-slate-400">
                        <CheckCircle2 className="w-10 h-10 mb-3 opacity-20" />
                        <p className="text-xs font-bold text-slate-500">Todo al día</p>
                    </div>
                ) : (
                    filteredList.slice(0, 6).map(action => (
                        <div
                            key={action.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (action.type === 'ticket' || action.type === 'premium') navigate('/admin/support');
                                else if (action.type === 'record') {
                                    if (onNavigate) onNavigate('inbox');
                                    else navigate('/dashboard?view=inbox');
                                }
                            }}
                            className={`
                                flex items-center gap-3 p-3 rounded-lg border border-transparent transition-all cursor-pointer relative overflow-hidden group
                                ${action.priority === 'critical'
                                    ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/30'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-50 dark:border-slate-800/50'
                                }
                            `}
                        >
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors
                                ${action.priority === 'critical' 
                                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-800 dark:text-rose-100' 
                                    : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm dark:bg-slate-800 dark:text-slate-400'
                                }
                            `}>
                                <IconForType type={action.type} priority={action.priority} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex justify-between items-center mb-0.5">
                                    <h4 className={`text-xs font-bold truncate ${action.priority === 'critical' ? 'text-rose-700 dark:text-rose-300' : 'text-slate-800 dark:text-slate-200'
                                        }`}>
                                        {action.title}
                                    </h4>
                                    <span className="text-[10px] font-medium text-slate-400 ml-2">
                                        {getRelativeTime(action.timestamp)}
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                    {action.subtitle}
                                </p>
                            </div>
                            {action.priority === 'critical' && (
                                <div className="absolute left-0 top-0 w-1 h-full bg-rose-500" />
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* FOOTER ACTION */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                <button
                    onClick={(e) => { e.stopPropagation(); navigate('/admin/support'); }}
                    className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold uppercase tracking-wide text-[10px] py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 group shadow-sm hover:shadow-md"
                >
                    Centro de Soporte
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};

const IconForType = ({ type, priority }: { type: string, priority?: string }) => {
    if (priority === 'critical') return <AlertTriangle className="w-3.5 h-3.5" />;

    switch (type) {
        case 'ticket': return <Ticket className="w-3.5 h-3.5" />;
        case 'premium': return <Star className="w-3.5 h-3.5" />;
        case 'record': return <FileText className="w-3.5 h-3.5" />;
        case 'alert': return <Bell className="w-3.5 h-3.5" />;
        default: return <Inbox className="w-3.5 h-3.5" />;
    }
};

export default PendingActionsWidget;
