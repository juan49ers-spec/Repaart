import React from 'react';
import { Inbox, Ticket, Star, FileText, Bell, ArrowRight, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PendingAction {
    id: string;
    type: 'ticket' | 'premium' | 'record' | 'alert';
    title: string;
    subtitle: string;
    priority: 'low' | 'normal' | 'high' | 'critical';
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

const ControlPendingActionsWidget: React.FC<ControlPendingActionsWidgetProps> = ({ data, loading, onNavigate }) => {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-800/50 p-6 h-full animate-pulse">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-800/50 p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Inbox className="w-4 h-4 text-rose-500" />
                        Acciones Pendientes
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-tight mt-1">
                        {data.total} Tareas Requieren Atención
                    </p>
                </div>
                <div className="flex -space-x-1.5">
                    <CountLabel count={data.tickets} icon={Ticket} color="bg-indigo-500" />
                    <CountLabel count={data.premium} icon={Star} color="bg-amber-500" />
                    <CountLabel count={data.records} icon={FileText} color="bg-emerald-500" />
                </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                {data.list.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40 py-8">
                        <Inbox className="w-8 h-8 mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Todo al día</p>
                    </div>
                ) : (
                    data.list.map(action => (
                        <div
                            key={action.id}
                            onClick={() => {
                                if (action.type === 'ticket' || action.type === 'premium') navigate('/admin/support');
                                else if (action.type === 'record') {
                                    if (onNavigate) onNavigate('inbox');
                                    else navigate('/dashboard?view=inbox');
                                }
                            }}
                            className={`group flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border ${action.priority === 'critical'
                                ? 'bg-rose-50/80 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
                                : 'bg-white/50 dark:bg-slate-800/30 border-slate-100 dark:border-white/5 hover:border-indigo-500/30 hover:bg-white dark:hover:bg-slate-800'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${action.priority === 'critical' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' :
                                    action.type === 'ticket' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500' :
                                        action.type === 'premium' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500' :
                                            action.type === 'record' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' :
                                                'bg-slate-50 dark:bg-slate-500/10 text-slate-500'
                                    }`}>
                                    <IconForType type={action.type} priority={action.priority} />
                                </div>
                                <div className="min-w-0">
                                    <p className={`text-xs font-bold tracking-tight uppercase truncate ${action.priority === 'critical' ? 'text-rose-700 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                                        }`}>
                                        {action.title}
                                    </p>
                                    <p className={`text-[9px] font-semibold tracking-tighter uppercase truncate ${action.priority === 'critical' ? 'text-rose-600/70 dark:text-rose-400/70' : 'text-slate-500 opacity-70'
                                        }`}>
                                        {action.subtitle}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <PriorityBadge priority={action.priority} />
                                <ArrowRight className={`w-3.5 h-3.5 transition-all group-hover:translate-x-1 ${action.priority === 'critical' ? 'text-rose-400' : 'text-slate-300 dark:text-slate-600 group-hover:text-indigo-500'
                                    }`} />
                            </div>
                        </div>
                    ))
                )}
            </div>

            <button
                onClick={() => navigate('/admin/support')}
                className="mt-4 w-full py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400 transition-all"
            >
                Abrir Centro de Soporte
            </button>
        </div>
    );
};

const IconForType = ({ type, priority }: { type: string, priority?: string }) => {
    if (priority === 'critical') return <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />;

    switch (type) {
        case 'ticket': return <Ticket className="w-3.5 h-3.5" />;
        case 'premium': return <Star className="w-3.5 h-3.5" />;
        case 'record': return <FileText className="w-3.5 h-3.5" />;
        case 'alert': return <Bell className="w-3.5 h-3.5" />;
        default: return <Inbox className="w-3.5 h-3.5" />;
    }
}

const CountLabel = ({ count, icon: Icon, color }: { count: number, icon: any, color: string }) => (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${color} text-white border-2 border-white dark:border-slate-900 shadow-sm`}>
        <Icon className="w-2.5 h-2.5" />
        <span className="text-[10px] font-bold">{count}</span>
    </div>
);

const PriorityBadge = ({ priority }: { priority: string }) => {
    if (priority === 'high' || priority === 'critical') {
        return <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]" />;
    }
    return null;
};

export default ControlPendingActionsWidget;
