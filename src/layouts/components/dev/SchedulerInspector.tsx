import React, { useState } from 'react';
import { useWeeklySchedule } from '../../../hooks/useWeeklySchedule';
import { Calendar, RefreshCw, Database, User, Bike } from 'lucide-react';

interface SchedulerInspectorProps {
    isOpen: boolean;
    onClose: () => void;
}

const SchedulerInspector: React.FC<SchedulerInspectorProps> = ({ isOpen, onClose }) => {
    const [franchiseId, setFranchiseId] = useState('franchise-1'); // Default for quick testing
    const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);

    // Derived Date object
    const currentDate = new Date(dateStr);

    // Use the hook directly to inspect its state
    const {
        weekData,
        loading,
        riders,
        motos,
        currentWeekId,
        refresh
    } = useWeeklySchedule(franchiseId, true, currentDate);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-gradient-to-r from-teal-900/20 to-emerald-900/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <Calendar className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Scheduler Inspector</h2>
                            <p className="text-xs text-slate-400 font-mono">ID: {currentWeekId}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                {/* Controls */}
                <div className="p-4 border-b border-slate-800 flex items-center gap-4 bg-slate-900/50">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500 uppercase font-bold">Franchise ID</label>
                        <input
                            type="text"
                            value={franchiseId}
                            onChange={(e) => setFranchiseId(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500"
                            title="Franchise ID"
                            placeholder="franchise-1"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500 uppercase font-bold">Target Date</label>
                        <input
                            type="date"
                            value={dateStr}
                            onChange={(e) => setDateStr(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500"
                            title="Fecha de Inspección"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500 uppercase font-bold">Actions</label>
                        <button
                            onClick={() => refresh()}
                            className="flex items-center gap-2 px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded text-sm transition-colors"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Force Refresh
                        </button>
                    </div>
                    <div className="ml-auto">
                        {loading ? (
                            <span className="flex items-center gap-2 text-amber-400 text-xs font-mono bg-amber-900/20 px-2 py-1 rounded">
                                <RefreshCw className="w-3 h-3 animate-spin" /> Fetching...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2 text-emerald-400 text-xs font-mono bg-emerald-900/20 px-2 py-1 rounded">
                                <Database className="w-3 h-3" /> Live
                            </span>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-auto p-4 grid grid-cols-12 gap-4">

                    {/* Left Column: Context (Riders & Motos) */}
                    <div className="col-span-4 space-y-4">
                        {/* Riders Card */}
                        <div className="bg-slate-800/50 rounded-xl border border-slate-700 flex flex-col max-h-[40vh] overflow-hidden">
                            <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-400" />
                                    Active Riders ({riders.length})
                                </h3>
                            </div>
                            <div className="overflow-auto p-2 space-y-1">
                                {riders.map(r => (
                                    <div key={r.id} className="text-xs p-2 rounded bg-slate-900/50 flex justify-between group hover:bg-slate-700 transition-colors">
                                        <span className="text-slate-300 font-medium">{r.fullName}</span>
                                        <span className="text-slate-500 font-mono text-[10px]">{r.role}</span>
                                    </div>
                                ))}
                                {riders.length === 0 && <div className="text-xs text-slate-500 p-4 text-center">No active riders found</div>}
                            </div>
                        </div>

                        {/* Motos Card */}
                        <div className="bg-slate-800/50 rounded-xl border border-slate-700 flex flex-col max-h-[40vh] overflow-hidden">
                            <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <Bike className="w-4 h-4 text-orange-400" />
                                    Active Motos ({motos.length})
                                </h3>
                            </div>
                            <div className="overflow-auto p-2 space-y-1">
                                {motos.map(m => (
                                    <div key={m.id} className="text-xs p-2 rounded bg-slate-900/50 flex justify-between group hover:bg-slate-700 transition-colors">
                                        <span className="text-slate-300 font-medium">{m.licensePlate}</span>
                                        <span className="text-slate-500 font-mono text-[10px]">{m.model}</span>
                                    </div>
                                ))}
                                {motos.length === 0 && <div className="text-xs text-slate-500 p-4 text-center">No active motos found</div>}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Week Data JSON */}
                    <div className="col-span-8 flex flex-col bg-slate-950 rounded-xl border border-slate-700 overflow-hidden">
                        <div className="p-3 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-slate-300">WeekData JSON Tree</h3>
                            <div className="text-xs text-slate-500">
                                Shifts: <span className="text-white">{weekData?.shifts?.length || 0}</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-4 font-mono text-xs">
                            {weekData ? (
                                <pre className="text-emerald-400/90 whitespace-pre-wrap break-all">
                                    {JSON.stringify(weekData, null, 2)}
                                </pre>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                    <Database className="w-8 h-8 mb-2 opacity-50" />
                                    <p>No week data loaded directly from hook.</p>
                                    <p className="text-[10px] mt-2">Check console for raw Firestore snapshots.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchedulerInspector;
