import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSupportHub } from '../../hooks/useSupportHub';
import TicketHistory from './support/TicketHistory';
import NewTicketForm from './support/NewTicketForm';

import UserProfileModal from '../user/UserProfileModal'; // Import modal
import PremiumServicesPanel from './support/PremiumServicesPanel';
import { Activity, HelpCircle, BadgePercent, Ticket } from 'lucide-react'; // Import icons

import { useLocation } from 'react-router-dom';

const SupportHub: React.FC = () => {
    const { user } = useAuth(); // Get logout
    const location = useLocation();
    const [isProfileOpen, setIsProfileOpen] = useState(false); // Local state for modal
    const [showInfo, setShowInfo] = useState(false); // Toggle for FAQ info

    // Default to ticket, but check location state for override
    const [activeTab, setActiveTab] = useState<'ticket' | 'services'>(() => {
        return (location.state as any)?.activeTab === 'services' ? 'services' : 'ticket';
    });

    // Logic Hook
    const {
        tickets,
        allTicketsCount,
        loading,
        sending,
        success,
        suggestions,
        file,
        uploading,
        ticketFilter,
        setTicketFilter,
        handleSubjectChange,
        createTicket,
        setSuccess,
        setFile,
    } = useSupportHub(user);

    // Derived counts for UI badges
    const filteredCount = tickets.length;



    return (
        <div className="p-6 h-screen max-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden relative">

            {/* Top Bar Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-6 shrink-0 gap-4 sm:gap-0">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1">Soporte & Ayuda</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest pl-0.5">Centro de Control de Incidencias</p>
                </div>
            </div>

            {/* Main Split Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">

                {/* LEFT PANEL: History (4 cols) */}
                <div className="lg:col-span-4 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    {/* Mini-Dashboard Header */}
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Actividad Reciente</h2>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Resumen de Soporte</p>
                            </div>
                        </div>

                        {/* KPI Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Abiertos</div>
                                <div className="text-xl font-black text-slate-800 dark:text-white flex items-end gap-1">
                                    {tickets.filter(t => t.status === 'open' || t.status === 'investigating').length}
                                    <span className="text-[10px] text-indigo-500 mb-1 font-bold">Activos</span>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total</div>
                                <div className="text-xl font-black text-slate-800 dark:text-white flex items-end gap-1">
                                    {allTicketsCount}
                                    <span className="text-[10px] text-slate-400 mb-1 font-bold">Histórico</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        <TicketHistory
                            tickets={tickets}
                            loading={loading}
                            filter={ticketFilter}
                            setFilter={setTicketFilter}
                            allCount={allTicketsCount}
                            filteredCount={filteredCount}
                        />
                    </div>
                </div>

                {/* RIGHT PANEL: New Ticket Form (8 cols) */}
                <div className="lg:col-span-8 flex flex-col overflow-hidden relative rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">

                    {/* Quick Actions Header */}
                    <div className="absolute top-5 right-6 z-30 flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                            {/* FAQ / Info Button */}
                            <button
                                onClick={() => setShowInfo(!showInfo)}
                                className={`
                                    flex items-center gap-2 px-3 py-1.5 backdrop-blur-md border rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm
                                    ${showInfo
                                        ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                                        : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }
                                `}
                            >
                                <HelpCircle className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">FAQ / Normas</span>
                            </button>
                        </div>

                        {/* Info Card Popover */}
                        {showInfo && (
                            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-xl w-64 animate-in fade-in slide-in-from-top-2 duration-200 text-right sm:text-left">
                                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                    Información Importante
                                </h4>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                                        <span>Horario: Lunes a Viernes de <b>10:00</b> a <b>15:00</b>.</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
                                        <span>Comunicación <b>exclusiva</b> vía Tickets.</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                                        <span>Tiempo respuesta estimado: <b>&lt; 24h</b>.</span>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Tab Switcher - Absolute positioned in header */}
                    <div className="absolute top-5 left-6 z-30 flex gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl backdrop-blur-md border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setActiveTab('ticket')}
                            className={`
                                    px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all
                                    ${activeTab === 'ticket'
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                }
                                `}
                        >
                            <Ticket className="w-3.5 h-3.5" />
                            <span>Incidencia</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('services')}
                            className={`
                                    px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all
                                    ${activeTab === 'services'
                                    ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                }
                                `}
                        >
                            <BadgePercent className="w-3.5 h-3.5" />
                            <span>Servicios</span>
                        </button>
                    </div>


                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden mt-16"> {/* Add top margin to clear absolute headers if needed, or use flex w/ padding */}
                        {activeTab === 'ticket' ? (
                            <NewTicketForm
                                onSubmit={createTicket}
                                onSubjectChange={handleSubjectChange}
                                sending={sending}
                                success={success}
                                setSuccess={(v) => setSuccess(v)}
                                suggestions={suggestions}
                                file={file}
                                setFile={setFile}
                                uploading={uploading}
                            />
                        ) : (
                            <PremiumServicesPanel />
                        )}
                    </div>
                </div>

            </div>

            {/* Profile Modal */}
            <UserProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                user={user}
            />
        </div>
    );
};

export default SupportHub;
