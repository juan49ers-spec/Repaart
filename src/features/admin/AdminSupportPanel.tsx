import { useState, lazy, Suspense } from 'react';
import { MessageSquare, BarChart3, Download, Loader2 } from 'lucide-react';
import { SupportProvider } from '../../context/SupportContext';
import { useSupport } from '../../hooks/useSupport';

// Sub-components
// These might still be JSX, let's assume they are fine for now or will be migrated later.
// We are importing from './support/...' 
import SupportMetrics from './support/SupportMetrics';
import TicketList from './support/TicketList';

// Lazy load TicketDetail to remove React Quill from main bundle
const TicketDetail = lazy(() => import('./support/TicketDetail'));

type ViewMode = 'cards' | 'analytics';

const AdminSupportContent = () => {
    // access useSupport hook safely
    const {
        loading,
        tickets,
        exportToCSV,
        handleClearAllTickets
    } = useSupport();

    const [viewMode, setViewMode] = useState<ViewMode>('cards');
    const [isClearing, setIsClearing] = useState(false);

    if (loading && tickets.length === 0) {
        return (
            <div className="h-screen flex items-center justify-center bg-white dark:bg-slate-950 transition-colors">
                <div className="flex flex-col items-center animate-pulse">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg">Cargando Centro de Soporte...</p>
                </div>
            </div>
        );
    }

    const handleClear = async () => {
        if (window.confirm('¿Estás seguro de que deseas reiniciar el Centro de Soporte? Se eliminarán TODOS los tickets y mensajes de forma permanente.')) {
            setIsClearing(true);
            try {
                await handleClearAllTickets();
                alert('Centro de soporte reiniciado correctamente.');
            } catch (error: any) {
                alert(error.message);
            } finally {
                setIsClearing(false);
            }
        }
    };

    return (
        <div className="p-8 min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 animate-in fade-in duration-500 transition-colors">
            {/* TOP BAR */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                        <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Support HQ</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center gap-2">
                            <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors">⌘K</span> Buscar
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            Gestión Centralizada
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleClear}
                        disabled={isClearing}
                        className="flex items-center space-x-2 px-4 py-2.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl font-semibold text-xs uppercase tracking-wider hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isClearing ? <Loader2 size={14} className="animate-spin" /> : <BarChart3 size={14} className="rotate-180" />}
                        <span>Reiniciar Centro</span>
                    </button>
                    <button
                        onClick={() => setViewMode(v => v === 'cards' ? 'analytics' : 'cards')}
                        className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border ${viewMode === 'analytics'
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        <span>{viewMode === 'cards' ? 'Analytics' : 'Tickets'}</span>
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:text-slate-900 dark:hover:text-white"
                    >
                        <Download className="w-4 h-4" />
                        <span>CSV</span>
                    </button>
                </div>
            </div>

            {/* METRICS / ANALYTICS */}
            <SupportMetrics viewMode={viewMode} />

            {/* MAIN CONTENT */}
            {viewMode === 'cards' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-280px)] min-h-[600px]">
                    {/* LEFT: LIST */}
                    <div className="lg:col-span-4 h-full">
                        <TicketList />
                    </div>

                    {/* RIGHT: DETAIL */}
                    <Suspense fallback={
                        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center h-full transition-colors">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        </div>
                    }>
                        <div className="lg:col-span-8 h-full">
                            <TicketDetail />
                        </div>
                    </Suspense>
                </div>
            )}
        </div>
    );
};

const AdminSupportPanel = () => {
    return (
        <SupportProvider>
            <AdminSupportContent />
        </SupportProvider>
    );
};

export default AdminSupportPanel;
