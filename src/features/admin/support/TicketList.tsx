
import { Search, Inbox, Eye, EyeOff, CheckCircle, Clock, AlertTriangle, CheckSquare, AlertOctagon } from 'lucide-react';
import { getStatusConfig } from '../../../lib/constants';
import { useSupport } from '../../../hooks/useSupport';
import { formatDate } from '../../../utils/formatDate';
import { Ticket, SupportMetrics } from '../../../hooks/useSupportManager';

// Define the context shape used by TicketList
interface SupportContextValue {
    filteredTickets: Ticket[];
    loading: boolean;
    selectedTicketId: string | null;
    handleSelectTicket: (id: string) => void;
    handleToggleRead: (e: React.MouseEvent, id: string, currentReadStatus: boolean) => void;
    filterTab: string;
    setFilterTab: (tab: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    metrics: SupportMetrics;
}

// Helper for skeletal loading
const TicketSkeleton = () => (
    <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3 animate-pulse">
        <div className="flex justify-between">
            <div className="w-16 h-5 bg-slate-100 dark:bg-slate-800 rounded-md" />
            <div className="w-12 h-4 bg-slate-100 dark:bg-slate-800 rounded-md" />
        </div>
        <div className="w-3/4 h-5 bg-slate-100 dark:bg-slate-800 rounded-md" />
        <div className="w-1/2 h-4 bg-slate-100 dark:bg-slate-800 rounded-md" />
    </div>
);

const TicketList = () => {
    const {
        filteredTickets: tickets,
        loading,
        selectedTicketId,
        handleSelectTicket: onSelectTicket,
        handleToggleRead: onToggleRead,
        filterTab,
        setFilterTab,
        searchQuery,
        setSearchQuery,
        metrics
    } = useSupport() as unknown as SupportContextValue;

    const TABS = [
        { id: 'all', label: 'Todos', icon: Inbox, count: metrics.total },
        { id: 'unread', label: 'No Leídos', icon: Eye, count: metrics.unread },
        { id: 'open', label: 'Abiertos', icon: Clock, count: metrics.open },
        { id: 'pending_user', label: 'Pendientes Info', icon: AlertTriangle, count: metrics.pending },
        { id: 'investigating', label: 'En Revisión', icon: Search, count: metrics.investigating },
        { id: 'resolved', label: 'Resueltos', icon: CheckSquare, count: metrics.resolved },
        { id: 'high', label: 'Urgentes', icon: AlertOctagon, count: metrics.critical + metrics.high },
    ];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden h-full transition-colors">
            {/* Search & Tabs */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="relative mb-3">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                        id="ticket-search"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por asunto, sede o email..."
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
                    />
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterTab(tab.id)}
                            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${filterTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <span>{tab.label}</span>
                            <span className={`px-1.5 py-0.5 rounded-md ${filterTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}>{tab.count}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* List Items */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 bg-slate-50/30 dark:bg-slate-950/20">
                {loading ? (
                    <>
                        <TicketSkeleton />
                        <TicketSkeleton />
                        <TicketSkeleton />
                    </>
                ) : tickets.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 p-8 text-center">
                        <Inbox className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm font-bold">No se encontraron tickets</p>
                    </div>
                ) : (
                    tickets.map(t => {
                        const isSelected = selectedTicketId === t.id;
                        const isUnread = !t.read;
                        const dateStr = formatDate(t.createdAt);
                        const status = getStatusConfig(t.status);

                        return (
                            <div
                                key={t.id}
                                onClick={() => onSelectTicket(t.id)}
                                className={`group relative p-4 rounded-xl cursor-pointer border transition-all duration-200 ${isSelected
                                    ? 'bg-white dark:bg-slate-800 border-indigo-500 dark:border-indigo-400 shadow-md ring-1 ring-indigo-500/30 z-10'
                                    : 'bg-white dark:bg-slate-900 border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm'
                                    } ${isUnread && !isSelected ? 'bg-indigo-50/10 dark:bg-indigo-500/5' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        {isUnread && <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />}
                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${t.urgency === 'critical' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400' :
                                            t.urgency === 'high' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' :
                                                'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}>
                                            {t.urgency === 'critical' ? 'Urgente' : t.urgency === 'high' ? 'Aviso' : 'Normal'}
                                        </span>

                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase border transition-colors ${status.bg} ${status.text} ${status.border} dark:bg-opacity-20`}>
                                            {status.label}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{dateStr}</span>
                                </div>

                                <h4 className={`text-sm font-bold mb-1 line-clamp-1 transition-colors ${isSelected ? 'text-indigo-900 dark:text-white' : isUnread ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'
                                    }`}>
                                    {t.subject}
                                </h4>

                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-500 truncate flex-1 pr-2 uppercase">
                                        {t.email ? t.email.split('@')[0] : 'Sin Email'}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleRead(e, t.id, !!t.read);
                                            }}
                                            className={`p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${t.read ? 'text-slate-300 dark:text-slate-600' : 'text-indigo-500'}`}
                                        >
                                            {t.read ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                        </button>
                                        {t.status === 'resolved' && <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default TicketList;
