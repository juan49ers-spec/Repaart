import { useState, useMemo } from 'react';

import { Loader2, PenLine } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getRiderInitials } from '../../utils/colorPalette';
import { toLocalDateString, toLocalISOString } from '../../utils/dateUtils';
import ShiftModal from '../../features/operations/ShiftModal';

import { SheriffReportModal } from './SheriffReportModal';
import { SchedulerGuideModal } from './SchedulerGuideModal';
import { useAuth } from '../../context/AuthContext';
import { Shift } from '../../schemas/scheduler';
import { addDays, isSameDay } from 'date-fns';

// --- REFAC: IMPORT NEW HOOKS ---
import { useSchedulerData } from './hooks/useSchedulerData';
import { useSchedulerState } from './hooks/useSchedulerState';
import { useSchedulerCalculations } from './hooks/useSchedulerCalculations';
import { useShiftActions } from './hooks/useShiftActions';
import { SchedulerStatusBar } from './SchedulerStatusBar';
import { SchedulerHeader } from './components/SchedulerHeader';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter, DragStartEvent } from '@dnd-kit/core';
import { DraggableShift } from './DraggableShift';
import { DroppableCell } from './DroppableCell';

// Optional props for context override (e.g., admin viewing a specific franchise)
interface DeliverySchedulerProps {
    franchiseId?: string;
    selectedDate?: Date;
    onDateChange?: (date: Date) => void;
    readOnly?: boolean;
}

export default function DeliveryScheduler(props: DeliverySchedulerProps = {}) {
    const { user } = useAuth();
    // Use props if provided, otherwise fallback to auth context
    const safeFranchiseId = props.franchiseId || user?.franchiseId || user?.uid || 'unknown-franchise';
    const readOnly = props.readOnly ?? (user?.role === 'rider'); // Riders only view

    // --- UI STATE ---
    // --- STATE HOOK ---
    const [internalSelectedDate, setInternalSelectedDate] = useState<Date>(new Date());
    const selectedDate = props.selectedDate ?? internalSelectedDate;
    const setSelectedDate = props.onDateChange ?? setInternalSelectedDate;

    // --- STATE HOOK ---
    const {
        viewMode, setViewMode,
        isPublishing, setIsPublishing,
        showLunch, setShowLunch,
        showDinner, setShowDinner,
        showPrime, setShowPrime,
        localShifts, setLocalShifts,
        deletedIds, setDeletedIds,
        editingShift, setEditingShift,
        isModalOpen, setIsModalOpen,
        setIsQuickFillOpen,
        isGuideOpen, setIsGuideOpen,
        isSheriffOpen, setIsSheriffOpen,
        hasUnsavedChanges,
        addLocalShift
    } = useSchedulerState();

    // --- DATA HOOKS ---
    const { rosterRiders, weekData, loading } = useSchedulerData(safeFranchiseId, selectedDate, readOnly);

    // --- CALCULATIONS HOOK ---
    const {
        days,
        mergedShifts,
        ridersGrid,
        totalWeeklyCost,
        totalHours
    } = useSchedulerCalculations(
        weekData,
        localShifts,
        deletedIds,
        rosterRiders,
        selectedDate,
        { showLunch, showDinner, showPrime }
    );

    // --- DND SENSORS ---
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
    const [activeDragShift, setActiveDragShift] = useState<Shift | null>(null);
    const [sheriffResult, setSheriffResult] = useState<any>(null);

    const simpleRiders = useMemo(() => rosterRiders.map(r => ({ id: String(r.id), fullName: r.fullName, name: r.fullName })), [rosterRiders]);

    // --- ACTIONS HOOK ---
    const { saveShift, deleteShift, handlePublish } = useShiftActions({
        franchiseId: safeFranchiseId,
        readOnly,
        localShifts,
        deletedIds,
        mergedShifts,
        rosterRiders,
        setLocalShifts,
        setDeletedIds,
        setIsPublishing,
        setIsModalOpen,
        simpleRiders,
        weekData
    });

    // --- SHERIFF & AI LOGIC ---
    const handleAuditoria = async () => {
        // Audit merged shifts (remote + local drafts)
        if (!mergedShifts || mergedShifts.length === 0) {
            alert("El cuadrante está vacío. Añade turnos antes de auditar.");
            return;
        }

        // [AUDITORIA 3.0] Advanced Local Calculation
        const totalHours = ridersGrid.reduce((acc, r) => acc + (r.totalWeeklyHours || 0), 0);
        const overtimeRiders = ridersGrid.filter(r => (r.totalWeeklyHours || 0) > (r.contractHours || 40));
        const underRiders = ridersGrid.filter(r => ((r.contractHours || 40) - (r.totalWeeklyHours || 0)) > 5);

        // Coverage heuristic (simple: 1 point per hour covered vs needed)
        // Just a mock calc for now
        const coverageScore = 85;
        const costEfficiency = 12.5; // Calculated simulated cost per hour

        const insights = [];
        if (overtimeRiders.length > 0) insights.push(`⚠️ ${overtimeRiders.length} riders en Overtime (+${overtimeRiders.reduce((acc, r) => acc + (r.totalWeeklyHours - (r.contractHours || 40)), 0).toFixed(1)}h excedentarias).`);
        if (underRiders.length > 0) insights.push(`📉 ${underRiders.length} riders infrautilizados (se está pagando por horas no trabajadas).`);
        if (totalHours < 100) insights.push("⚠️ Cobertura global peligrosamente baja (<100h).");
        if (overtimeRiders.length === 0 && underRiders.length === 0) insights.push("✅ Distribución de horas perfecta.");

        const score = Math.max(0, 100 - (overtimeRiders.length * 5) - (underRiders.length * 2));

        const report = {
            score,
            status: (score > 90 ? 'optimal' : score > 70 ? 'warning' : 'critical') as 'optimal' | 'warning' | 'critical',
            feedback: insights,
            details: {
                totalHours,
                costEfficiency,
                coverageScore,
                overtimeCount: overtimeRiders.length,
                underutilizedCount: underRiders.length
            }
        };

        // Update state to show in modal/header
        setSheriffResult(report);
        setIsSheriffOpen(true);
    };





    const changeWeek = (offset: number) => {
        const newDate = addDays(selectedDate, offset * 7);
        setSelectedDate(newDate);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveDragShift(active.data.current?.shift as Shift);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragShift(null);

        if (!over) return;

        const activeShift = active.data.current?.shift as Shift;
        if (!activeShift) return;

        // Drop target ID format: "cell-RIDERID-DATE-HOUR"
        const dropId = String(over.id);
        if (!dropId.startsWith('cell-')) return;


        // Parts: ["cell", riderId, dateStr, hourStr]
        // But dateStr might contain dashes? toLocalDateString is usually YYYY-MM-DD
        // So parts length might satisfy >= 4
        // Let's assume riderId doesn't have dashes for safety or use regex?
        // safer:
        // cell-{riderId}-{date}-{hour}
        // if riderId is UUID, it has dashes.
        // We used: `cell-${rider.id}-${toLocalDateString(day)}-${hour}` in DroppableCell
        // So we need to parse carefully.

        // We can parse from back:
        // last part is hour
        // 2nd to 4th last is date (YYYY-MM-DD)?
        // Remainder is riderId.

        // Actually, we can assume the format is robust or use a separator.
        // Let's rely on data attributes if we had them, but DND kit gives ID.
        // Let's try to reconstruction:
        // id is `cell-RIDER-YYYY-MM-DD-HH`
        // 12:00 -> 12

        // Quick hack: split by "cell-" then parse
        const content = dropId.substring(5); // Remove "cell-"
        const lastDash = content.lastIndexOf('-');
        const hourStr = content.substring(lastDash + 1);
        const rest = content.substring(0, lastDash);

        // Date is usually 10 chars at end: YYYY-MM-DD
        const dateStr = rest.substring(rest.length - 10);
        const newRiderId = rest.substring(0, rest.length - 11); // Remove "-YYYY-MM-DD"

        const newHour = parseInt(hourStr, 10);
        const newDate = new Date(dateStr);

        // Calculate new times
        const oldStart = new Date(activeShift.startAt);
        const oldEnd = new Date(activeShift.endAt);
        const durationMin = (oldEnd.getTime() - oldStart.getTime()) / 1000 / 60;

        const newStart = new Date(newDate);
        newStart.setHours(newHour, oldStart.getMinutes(), 0, 0);

        const newEnd = new Date(newStart);
        newEnd.setMinutes(newStart.getMinutes() + durationMin);

        // Update shift
        const updatedShift = {
            ...activeShift,
            riderId: newRiderId,
            startAt: toLocalISOString(newStart),
            endAt: toLocalISOString(newEnd),
            date: toLocalDateString(newStart)
        };

        saveShift(updatedShift);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 h-96">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500 font-medium">Cargando cuadrante...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                {/* --- HEADER --- */}
                <SchedulerHeader
                    selectedDate={selectedDate}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    onChangeWeek={changeWeek}
                    showLunch={showLunch}
                    setShowLunch={setShowLunch}
                    showDinner={showDinner}
                    setShowDinner={setShowDinner}
                    showPrime={showPrime}
                    setShowPrime={setShowPrime}
                    sheriffResult={sheriffResult}
                    onAudit={handleAuditoria}
                    hasUnsavedChanges={hasUnsavedChanges}
                    isPublishing={isPublishing}
                    onPublish={handlePublish}
                    readOnly={readOnly}
                />

                {/* Status Bar */}
                <div className="max-w-[1920px] mx-auto px-4 pb-3">
                    <SchedulerStatusBar
                        totalCost={totalWeeklyCost}
                        hoursCount={totalHours}
                        sheriffScore={sheriffResult?.score || null}
                        hasChanges={hasUnsavedChanges}
                        onAutoFill={() => setIsQuickFillOpen(true)}
                        onOpenGuide={() => setIsGuideOpen(true)}
                    />
                </div>

                {/* --- MAIN GRID --- */}
                <div className="flex-1 overflow-auto bg-slate-100 p-4">
                    <div className="max-w-[1920px] mx-auto bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="grid grid-cols-[280px_1fr] divide-x">
                            {/* Left Column: Riders Header */}
                            <div className="bg-slate-50/80 p-4 border-b flex items-center justify-between sticky top-0 z-20 backdrop-blur-sm">
                                <span className="font-bold text-slate-700">Rider / Recurso</span>
                                <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border">
                                    {ridersGrid.length} activos
                                </span>
                            </div>

                            {/* Days Header */}
                            <div className="grid grid-cols-7 divide-x sticky top-0 z-20 bg-white shadow-sm">
                                {days.map(day => {
                                    const isToday = day.isToday;
                                    return (
                                        <div key={day.isoDate} className={cn(
                                            "p-3 text-center border-b transition-colors",
                                            isToday ? "bg-blue-50/50" : "bg-slate-50/50"
                                        )}>
                                            <div className={cn("text-xs font-bold uppercase mb-1", isToday ? "text-blue-600" : "text-slate-500")}>
                                                {day.dayName}
                                            </div>
                                            <div className={cn(
                                                "text-lg font-bold w-10 h-10 flex items-center justify-center rounded-full mx-auto",
                                                isToday ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-800"
                                            )}>
                                                {day.dayNum}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* --- RIDERS ROWS --- */}
                            <div className="divide-y bg-white">
                                {ridersGrid.map(rider => (
                                    <div key={rider.id} className="h-24 p-4 flex flex-col justify-center hover:bg-slate-50 transition-colors group relative">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 shadow-sm",
                                                getRiderColor(rider.id)
                                            )}>
                                                {getRiderInitials(rider.fullName)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-slate-900 truncate">{rider.fullName}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                                    <span className={cn(
                                                        "px-1.5 py-0.5 rounded text-[10px] font-medium border",
                                                        rider.contractHours ? "bg-slate-100 border-slate-200" : "bg-orange-50 text-orange-600 border-orange-100"
                                                    )}>
                                                        {rider.contractHours || 40}h
                                                    </span>
                                                    <span>•</span>
                                                    <span className={cn(
                                                        "font-medium tabular-nums",
                                                        (rider.totalWeeklyHours || 0) > (rider.contractHours || 40) ? "text-red-600" : "text-slate-600"
                                                    )}>
                                                        {rider.totalWeeklyHours?.toFixed(1)}h esta semana
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row Actions (Hover) */}
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full">
                                                <PenLine className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* --- GRID CELLS --- */}
                            <div className="divide-y relative">
                                {ridersGrid.map(rider => (
                                    <div key={rider.id} className="grid grid-cols-7 divide-x h-24">
                                        {days.map(day => {
                                            const dayShifts = mergedShifts.filter(s =>
                                                String(s.riderId) === String(rider.id) &&
                                                isSameDay(new Date(s.startAt), day.date)
                                            );

                                            return (
                                                <DroppableCell
                                                    key={`${rider.id}-${day.isoDate}`}
                                                    dateIso={day.isoDate}
                                                    riderId={String(rider.id)}
                                                    isToday={day.isToday}
                                                    onQuickAdd={(hour) => {
                                                        const date = new Date(day.date);
                                                        date.setHours(hour, 0, 0, 0);
                                                        addLocalShift({
                                                            id: `temp-${Date.now()}`,
                                                            riderId: String(rider.id),
                                                            startAt: date.toISOString(),
                                                            endAt: new Date(date.getTime() + 4 * 60 * 60 * 1000).toISOString(),
                                                            isConfirmed: false
                                                        } as any);
                                                    }}
                                                    onDoubleClick={() => {
                                                        const date = new Date(day.date);
                                                        date.setHours(12, 0, 0, 0);
                                                        setEditingShift({
                                                            id: `temp-${Date.now()}`,
                                                            riderId: String(rider.id),
                                                            startAt: date.toISOString(),
                                                            endAt: new Date(date.getTime() + 4 * 60 * 60 * 1000).toISOString(),
                                                            isConfirmed: false
                                                        } as any);
                                                        setIsModalOpen(true);
                                                    }}
                                                    activeDragShift={activeDragShift}
                                                >
                                                    {dayShifts.map(shift => (
                                                        <DraggableShift
                                                            key={shift.id}
                                                            shift={shift}
                                                            gridId={`shift-${shift.id}`}
                                                            onClick={() => {
                                                                setEditingShift(shift);
                                                                setIsModalOpen(true);
                                                            }}
                                                        />
                                                    ))}
                                                </DroppableCell>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <DragOverlay>
                    {activeDragShift ? (
                        <div className="opacity-80 scale-105 rotate-3 pointer-events-none">
                            <DraggableShift shift={activeDragShift} gridId={`overlay-${activeDragShift.id}`} isOverlay onClick={() => { }} />
                        </div>
                    ) : null}
                </DragOverlay>

                {/* --- MODALS --- */}
                {editingShift && (
                    <ShiftModal
                        isOpen={isModalOpen} // Controls visibility
                        onClose={() => {
                            setIsModalOpen(false);
                            setEditingShift(null);
                        }}
                        onSave={saveShift}
                        onDelete={deleteShift}
                        initialData={editingShift}
                    />
                )}

                <SheriffReportModal
                    isOpen={isSheriffOpen}
                    onClose={() => setIsSheriffOpen(false)}
                    data={sheriffResult || {
                        score: 0,
                        status: 'warning',
                        feedback: ["Realiza una auditoría para ver resultados."],
                        details: { totalHours: 0, overtimeCount: 0, underutilizedCount: 0, coverageScore: 0, costEfficiency: 0 }
                    }}
                />

                <SchedulerGuideModal
                    isOpen={isGuideOpen}
                    onClose={() => setIsGuideOpen(false)}
                />
            </DndContext>
        </div>
    );
}

// Helper for Initials Color
function getRiderColor(id: string) {
    const colors = [
        'bg-red-100 text-red-700 border-red-200',
        'bg-orange-100 text-orange-700 border-orange-200',
        'bg-amber-100 text-amber-700 border-amber-200',
        'bg-green-100 text-green-700 border-green-200',
        'bg-emerald-100 text-emerald-700 border-emerald-200',
        'bg-teal-100 text-teal-700 border-teal-200',
        'bg-cyan-100 text-cyan-700 border-cyan-200',
        'bg-sky-100 text-sky-700 border-sky-200',
        'bg-blue-100 text-blue-700 border-blue-200',
        'bg-indigo-100 text-indigo-700 border-indigo-200',
        'bg-violet-100 text-violet-700 border-violet-200',
        'bg-purple-100 text-purple-700 border-purple-200',
        'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
        'bg-pink-100 text-pink-700 border-pink-200',
        'bg-rose-100 text-rose-700 border-rose-200',
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
}
