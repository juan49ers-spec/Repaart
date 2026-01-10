import React, { useState, useCallback, useMemo, Suspense, lazy } from 'react';
import { addDays, subDays } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useWeeklySchedule, Shift } from '../../hooks/useWeeklySchedule';
import OperationsHeader from './OperationsHeader';
import OperationsTabs from './components/OperationsTabs';
import WeeklySummaryView from './views/WeeklySummaryView';
import ShiftManagerView from './views/ShiftManagerView';
import OperationsFranchiseSelector from './OperationsFranchiseSelector';
import OperationsTutorialModal from './OperationsTutorialModal';
import { ShieldAlert } from 'lucide-react';
import FinancialDashboard from '../../legacy/FinancialDashboard';
import UserManagementPanel from '../admin/users/UserManagementPanel';

// Lazy load heavy components
const FleetManager = lazy(() => import('./FleetManager'));

type OperationsTab = 'summary' | 'scheduler' | 'finance' | 'riders' | 'motos';
type TimeFilter = 'all' | 'morning' | 'afternoon' | 'night';

interface OperationsDashboardProps {
    readOnly?: boolean;
}

const OperationsDashboard: React.FC<OperationsDashboardProps> = () => {
    const { user, isAdmin } = useAuth();
    const userFranchiseId = user?.uid;
    const [selectedFranchiseId, setSelectedFranchiseId] = useState<string | null | undefined>(userFranchiseId);
    const activeFranchiseId = isAdmin ? (selectedFranchiseId || userFranchiseId) : userFranchiseId;

    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [activeTab, setActiveTab] = useState<OperationsTab>('summary');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
    const [showTutorial, setShowTutorial] = useState<boolean>(false);

    // LIFTED DATA STATE: Sync across tabs 🧠
    const scheduleState = useWeeklySchedule(activeFranchiseId ?? null, isAdmin ? false : true, currentDate);

    // FILTER LOGIC 🔍
    const filteredShifts = useMemo(() => {
        if (!scheduleState.weekData?.shifts) return [];
        if (timeFilter === 'all') return scheduleState.weekData.shifts;

        return scheduleState.weekData.shifts.filter((shift: Shift) => {
            if (!shift.startAt) return false;
            const shiftDate = new Date(shift.startAt);
            const hour = shiftDate.getHours();
            if (timeFilter === 'morning') return hour >= 6 && hour < 14;
            if (timeFilter === 'afternoon') return hour >= 14 && hour < 20;
            if (timeFilter === 'night') return hour >= 20 || hour < 6;
            return true;
        });
    }, [scheduleState.weekData, timeFilter]);

    const filteredScheduleState = {
        ...scheduleState,
        weekData: {
            ...scheduleState.weekData,
            shifts: filteredShifts
        }
    };

    // Handlers
    const handleDateChange = useCallback((newDate: Date) => setCurrentDate(newDate), []);

    const handleNavigateWeek = (direction: 'next' | 'prev') => {
        setCurrentDate(prev => direction === 'next' ? addDays(prev, 7) : subDays(prev, 7));
    };

    const handleJumpToToday = () => {
        setCurrentDate(new Date());
    };

    const handleSlotClick = (date: Date) => {
        setCurrentDate(date);
        setActiveTab('scheduler');
    };

    if (!activeFranchiseId && !isAdmin) return (
        <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-400 animate-pulse">
            Inicializando Command Center...
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 min-h-screen text-slate-900 font-sans">

            {/* Header Area */}
            <div className="bg-white sticky top-0 z-30 shadow-sm border-b border-slate-200">
                {isAdmin && (
                    <div className="bg-slate-50 px-6 py-1.5 flex justify-between items-center border-b border-slate-200">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                            <ShieldAlert size={12} /> Admin Mode
                        </span>
                        <div className="scale-90 origin-right opacity-80 hover:opacity-100 transition-opacity">
                            <OperationsFranchiseSelector
                                selectedFranchiseId={activeFranchiseId}
                                onSelect={setSelectedFranchiseId}
                            />
                        </div>
                    </div>
                )}

                {/* GLOBAL FILTERS */}
                <div className="px-6 py-2 bg-white flex justify-center border-b border-slate-100">
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                        {(['all', 'morning', 'afternoon', 'night'] as TimeFilter[]).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setTimeFilter(filter)}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all capitalize ${timeFilter === filter
                                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                                    }`}
                            >
                                {filter === 'all' ? 'Todo' : filter === 'morning' ? 'Mañana' : filter === 'afternoon' ? 'Tarde' : 'Noche'}
                            </button>
                        ))}
                    </div>
                </div>

                <OperationsHeader
                    currentDate={currentDate}
                    onNavigate={handleNavigateWeek}
                    onToday={handleJumpToToday}
                />

                <OperationsTabs activeTab={activeTab} onTabChange={(tab: any) => setActiveTab(tab)} />
            </div>

            {/* Content Area */}
            <div className="flex-1 px-4 py-4 md:px-6 md:py-6 overflow-hidden flex flex-col">
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative">

                    {activeTab === 'summary' && (
                        <WeeklySummaryView
                            currentDate={currentDate}
                            onSlotClick={handleSlotClick}
                            franchiseId={activeFranchiseId || ''}
                            weekData={filteredScheduleState.weekData}
                            loading={filteredScheduleState.loading}
                        />
                    )}

                    {activeTab === 'scheduler' && (
                        <div className="h-full bg-white">
                            <ShiftManagerView
                                franchiseId={activeFranchiseId || ''}
                                readOnly={isAdmin}
                                selectedDate={currentDate}
                                onDateChange={handleDateChange}
                                overrideScheduleState={filteredScheduleState}
                            />
                        </div>
                    )}

                    {activeTab === 'finance' && (
                        <div className="h-full bg-white p-6 overflow-y-auto custom-scrollbar">
                            <FinancialDashboard franchiseId={activeFranchiseId || ''} />
                        </div>
                    )}

                    {/* Empty States for future tabs */}
                    {activeTab === 'riders' && (
                        <div className="h-full bg-white overflow-hidden">
                            <UserManagementPanel
                                franchiseId={activeFranchiseId}
                                readOnly={isAdmin} // Admin uses readOnly here too
                            />
                        </div>
                    )}

                    {activeTab === 'motos' && (
                        <div className="h-full bg-white p-6 overflow-y-auto custom-scrollbar">
                            <Suspense fallback={<div className="p-8 text-center text-slate-400">Cargando flota...</div>}>
                                <FleetManager
                                    franchiseId={activeFranchiseId}
                                    readOnly={isAdmin}
                                />
                            </Suspense>
                        </div>
                    )}
                </div>
            </div>

            <OperationsTutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
        </div>
    );
};

export default OperationsDashboard;
