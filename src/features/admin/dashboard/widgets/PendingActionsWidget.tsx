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
            <div className="bg-[#12141A] rounded-xl border border-white/5 p-4 h-full flex flex-col space-y-3">
                <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
                <div className="space-y-2 flex-1">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    const getRelativeTime = (_date?: Date) => {
        return '2h';
    };

    return (
        <div className="bg-[#12141A] rounded-xl border border-white/5 shadow-2xl flex flex-col h-full overflow-hidden transition-all group/card hover:border-rose-500/30 relative">
            {/* Ambient Base Layer */}
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-transparent pointer-events-none" />

            {/* HEADER */}
            <div className="p-5 pb-3 relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 border border-white/10 group-hover/card:border-rose-500/30 transition-colors rounded-lg">
                            <Inbox className="w-4 h-4 text-rose-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                                Acciones Pendientes
                            </h3>
                            <div className="text-xs font-medium text-slate-400">{data.total} tareas en cola</div>
                        </div>
                    </div>

                    <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5">
                        {(['all', 'premium', 'support'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={(e) => { e.stopPropagation(); setFilter(tab); }}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${filter === tab
                                    ? 'bg-white/10 shadow-sm text-white'
                                    : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {tab === 'all' ? 'Todo' : tab === 'premium' ? 'VIP' : 'Soporte'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ACTION LIST */}
            <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar px-3 pb-3 relative z-10">
                {filteredList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-6 text-slate-400">
                        <CheckCircle2 className="w-10 h-10 mb-3 opacity-20" />
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Todo al día</p>
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
                                    ? 'bg-rose-500/10 border-rose-500/20'
                                    : 'hover:bg-white/5 border-white/5'
                                }
                            `}
                        >
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors border
                                ${action.priority === 'critical' 
                                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                                    : 'bg-white/5 text-slate-400 border-white/10 group-hover:bg-white/10'
                                }
                            `}>
                                <IconForType type={action.type} priority={action.priority} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex justify-between items-center mb-0.5">
                                    <h4 className={`text-xs font-bold truncate ${action.priority === 'critical' ? 'text-rose-400' : 'text-slate-200'
                                        }`}>
                                        {action.title}
                                    </h4>
                                    <span className="text-[10px] font-medium text-slate-500 ml-2 font-mono">
                                        {getRelativeTime(action.timestamp)}
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-400 truncate font-sans">
                                    {action.subtitle}
                                </p>
                            </div>
                            {action.priority === 'critical' && (
                                <div className="absolute left-0 top-0 w-1 h-full bg-rose-500/50" />
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* FOOTER ACTION */}
            <div className="p-3 bg-transparent border-t border-white/5 relative z-10">
                <button
                    onClick={(e) => { e.stopPropagation(); navigate('/admin/support'); }}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-wide text-[10px] py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 group shadow-sm hover:shadow-md"
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
