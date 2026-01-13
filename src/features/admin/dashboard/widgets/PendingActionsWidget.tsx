import React from 'react';
import { Inbox, Ticket, Star, FileText, Bell, ArrowRight, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
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

    if (loading) {
        return (
            <div className="bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 h-full">
                <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    const getRelativeTime = (date?: Date) => {
        if (!date) return '2h';
        return '2h';
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col h-full shadow-sm">

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <Inbox className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        Acciones Pendientes
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                        {data.total} tareas requieren atención
                    </p>
                </div>
                <div className="flex -space-x-2">
                    <CountLabel count={data.tickets} icon={Ticket} color="bg-indigo-500" />
                    <CountLabel count={data.premium} icon={Star} color="bg-amber-500" />
                    <CountLabel count={data.records} icon={FileText} color="bg-emerald-500" />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
                {data.list.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-8 text-slate-400">
                        <CheckCircle2 className="w-10 h-10 mb-3 text-emerald-500/50" />
                        <p className="text-sm font-medium">Todo al día</p>
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
                            className={`group relative flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${action.priority === 'critical'
                                ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/20'
                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900'
                                }`}
                        >
                            <div className="flex items-center gap-4 w-full">
                                <div className={`p-2 rounded-lg shrink-0 ${action.priority === 'critical' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' :
                                    action.type === 'ticket' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' :
                                        action.type === 'premium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                                            action.type === 'record' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                                                'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                    }`}>
                                    <IconForType type={action.type} priority={action.priority} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <p className={`text-sm font-medium tracking-tight truncate ${action.priority === 'critical' ? 'text-rose-700 dark:text-rose-300' : 'text-slate-900 dark:text-white'
                                            }`}>
                                            {action.title}
                                        </p>
                                        <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                                            <Clock className="w-3 h-3" />
                                            {getRelativeTime(action.timestamp)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-slate-500 truncate max-w-[180px]">
                                            {action.subtitle}
                                        </p>
                                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <button
                onClick={() => navigate('/admin/support')}
                className="mt-4 w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center justify-center gap-2 group"
            >
                Ir al Centro de Soporte
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
};

const IconForType = ({ type, priority }: { type: string, priority?: string }) => {
    if (priority === 'critical') return <AlertTriangle className="w-4 h-4" />;

    switch (type) {
        case 'ticket': return <Ticket className="w-4 h-4" />;
        case 'premium': return <Star className="w-4 h-4" />;
        case 'record': return <FileText className="w-4 h-4" />;
        case 'alert': return <Bell className="w-4 h-4" />;
        default: return <Inbox className="w-4 h-4" />;
    }
}

const CountLabel = ({ count, icon: _Icon, color }: { count: number, icon: any, color: string }) => (
    <div className={`flex items-center justify-center w-7 h-7 rounded-full ${color} text-white ring-2 ring-white dark:ring-slate-900 shadow-sm`} title={`${count} ítems`}>
        <span className="text-xs font-bold tracking-tight">{count}</span>
    </div>
);

export default PendingActionsWidget;
