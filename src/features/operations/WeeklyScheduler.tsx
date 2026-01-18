import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Save, Zap, Filter, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getShiftDuration, getRiderInitials } from '../../utils/colorPalette';
import ShiftModal from './ShiftModal';
import QuickFillModal from './QuickFillModal';

import { findMotoConflict, findRiderConflict } from '../../utils/schedulerValidation';
import { toLocalISOStringWithOffset, toLocalDateString, getStartOfWeek } from '../../utils/dateUtils';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import MobileAgendaView from './MobileAgendaView';
import { useWeeklySchedule, getWeekIdFromDate, type Shift, type WeekData } from '../../hooks/useWeeklySchedule';
import { WeekService } from '../../services/scheduler/weekService';
import { toFranchiseId, toWeekId } from '../../schemas/scheduler';
import ConfirmationModal from '../../components/ui/feedback/ConfirmationModal';
import { getRiderColorMap } from '../../utils/riderColors';
import { validateWeeklySchedule, generateScheduleFix, generateFullSchedule } from '../../lib/gemini';
import { BadgeCheck, AlertTriangle, ShieldCheck, Wand2, Sparkles } from 'lucide-react';
import { useOperationsIntel, intelService } from '../../services/intelService';



const getDayDemandLevel = (dayDate: string, dayIntel: any[]) => {
    const hasCritical = dayIntel.some(e => e.severity === 'critical');
    const hasWarning = dayIntel.some(e => e.severity === 'warning');
    const dayOfWeek = new Date(dayDate).getDay(); // 0: Sun, 5: Fri, 6: Sat

    // Friday to Sunday are naturally "warning" (Medium) unless "critical" exists
    if (hasCritical) return 'critical';
    if (hasWarning || [0, 5, 6].includes(dayOfWeek)) return 'warning';
    return 'normal';
};

// ... (Existing types and constants)



interface WeeklySchedulerProps {
    franchiseId: string;
    readOnly?: boolean;
}

interface VisualEvent extends Shift {
    shiftId: string;
    riderId: string;
    riderName: string;
    visualDate: string;
    visualStart: Date;
    visualEnd: Date;
    isContinuation: boolean;
    isConfirmed?: boolean;
    changeRequested?: boolean;
    changeReason?: string | null;
    layout?: any;
}

interface ShiftEvent extends VisualEvent {
    franchiseId: string;
}

// --- V13 SUB-COMPONENTS ---

const ShiftPill: React.FC<{
    event: ShiftEvent;
    onClick: (e: React.MouseEvent) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    riderColor?: { bg: string, border: string, text: string }; // Kept for future optional use
    readOnly?: boolean;
    isSelected?: boolean;
    isHovered?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}> = ({ event, onClick, onDelete, readOnly, isSelected, isHovered, onMouseEnter, onMouseLeave }) => {
    const isConfirmed = event.isConfirmed;
    const changeRequested = event.changeRequested;
    const changeReason = event.changeReason;
    const duration = getShiftDuration(event.startAt, event.endAt);
    const startTime = event.visualStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = event.visualEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isNight = event.visualStart.getHours() >= 19;

    // --- NEW VISUAL LOGIC: Status Borders + Neutral Backgrounds ---
    const getBaseStyle = () => {
        // 1. Critical Errors (Conflicts) -> Red Border
        // TODO: Pass 'isConflict' prop if available. For now, assuming standard logic.

        // 2. Change Requested -> Amber Border
        if (changeRequested) {
            return "bg-slate-100 border-l-[3px] border-l-amber-400 border-t border-b border-r border-slate-200 text-slate-700";
        }

        // 3. Normal / Confirmed -> Neutral Identity
        // Day shifts: Lighter / Night shifts: Darker
        if (isNight) {
            return "bg-slate-800 border border-slate-700 text-slate-100 shadow-sm";
        }

        return "bg-white border border-slate-200 text-slate-600 shadow-sm";
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                "group/pill relative h-[26px] rounded-md transition-all duration-200 cursor-pointer overflow-hidden flex items-center px-2 select-none",
                getBaseStyle(),
                "hover:brightness-95 hover:scale-[1.01] hover:shadow-md hover:z-50 active:scale-95",
                changeRequested && "hover:bg-amber-50",
                isSelected && "ring-2 ring-indigo-500 ring-offset-1 z-50 shadow-lg",
                isHovered && "brightness-95 scale-[1.01]"
            )}
            style={changeRequested ? {
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(251, 191, 36, 0.1) 5px, rgba(251, 191, 36, 0.1) 10px)',
                maskImage: 'linear-gradient(to right, black, black)'
            } : {}}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClick(e); // Select it
                (window as any).showSchedulerContextMenu?.(e, event);
            }}
            title={`${event.riderName} | ${startTime} - ${endTime} (${duration}h)${changeRequested ? ` | MOTIVO: ${changeReason || 'Sin motivo'}` : ''}`}
        >
            <div className="flex items-center gap-1.5 min-w-0 w-full relative z-10">
                {/* Status Icons */}
                {changeRequested && <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 animate-pulse" />}
                {isConfirmed && !changeRequested && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}

                <span className="text-[10px] font-bold tracking-tight truncate flex-1">
                    {startTime} - {endTime}
                </span>

                <span className="text-[9px] font-medium opacity-70 shrink-0">
                    {duration}h
                </span>
            </div>

            {/* Delete Action */}
            {!readOnly && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(event.shiftId || '', e); }}
                    className="absolute right-0.5 opacity-0 group-hover/pill:opacity-100 transition-opacity p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-rose-500"
                    title="Eliminar turno"
                    aria-label="Eliminar turno"
                >
                    <XCircle className="w-3 h-3" />
                </button>
            )}
        </div>
    );
};

const CurrentTimeIndicator: React.FC<{ startHour: number, endHour: number }> = ({ startHour, endHour }) => {
    const [now, setNow] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const hour = now.getHours();
    const minute = now.getMinutes();

    if (hour < startHour || hour >= endHour) return null;

    const percent = ((hour - startHour) * 60 + minute) / ((endHour - startHour) * 60) * 100;

    return (
        <div
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-40 pointer-events-none shadow-[0_0_12px_rgba(244,63,94,0.8)]"
            style={{ left: `${percent}%` }}
        >
            <div className="absolute top-0 -left-1.5 w-3.5 h-3.5 bg-rose-500 rounded-full border-[3px] border-white shadow-md animate-pulse" />
        </div>
    );
};

const WeeklyScheduler: React.FC<WeeklySchedulerProps> = ({ franchiseId, readOnly = false }) => {

    // 🔥 CRITICAL LOG: Start of Render


    // --- STATE MANAGEMENT (HOOK) ---
    const {
        weekData,
        loading,
        referenceDate,
        currentWeekId,
        riders,
        motos,
        navigateWeek,
        saveWeek,
        updateWeekData,
        refresh
    } = useWeeklySchedule(franchiseId, readOnly);

    // --- UI Local State ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<any | null>(null);
    const [selectedDateForNew, setSelectedDateForNew] = useState<string | null>(null);
    const [isQuickFillOpen, setIsQuickFillOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
    const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
    const [hoveredShiftId, setHoveredShiftId] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, event: ShiftEvent } | null>(null);
    const [viewMode, setViewMode] = useState<'full' | 'prime'>('full');
    const [isAuditing, setIsAuditing] = useState(false);
    const [isFixing, setIsFixing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showGenModal, setShowGenModal] = useState(false);
    const [genPrompt, setGenPrompt] = useState('');
    const isMobile = useMediaQuery("(max-width: 1024px)");

    const isSaving = loading || isProcessing || isFixing;

    const changeWeek = (offset: number) => {
        navigateWeek(offset);
    };

    // Helpers
    const closeConfirm = () => setConfirmDialog(prev => ({ ...prev, isOpen: false }));

    // PRIME MODE STATE - Horario Prime: 12:00-16:00 (comidas) y 19:00-24:00 (cenas)

    const { events: intelEvents } = useOperationsIntel(referenceDate);
    const intelByDay = useMemo(() => intelService.getEventsByDay(intelEvents), [intelEvents]);

    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDestructive: false,
        confirmText: 'Confirmar'
    });

    // SHERIFF STATE
    const [sheriffResult, setSheriffResult] = useState<{
        score: number;
        status: 'optimal' | 'warning' | 'critical';
        feedback: string;
        missingCoverage: string[];
    } | null>(null);

    // Coverage calculation
    const coverageMetrics = useMemo(() => {
        const slots = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
        weekData?.shifts?.forEach(s => {
            const start = new Date(s.startAt);
            const end = new Date(s.endAt);
            const day = (start.getDay() + 6) % 7; // Mon=0
            const startH = start.getHours();
            const endH = end.getHours() === 0 ? 24 : end.getHours();
            for (let h = startH; h < endH; h++) {
                if (h >= 0 && h < 24) slots[day][h]++;
            }
        });
        return slots;
    }, [weekData?.shifts]);

    // --- LOGIC: Shift Operations ---

    // ... (Existing logic) ...

    const handleAutoFix = async () => {
        if (!sheriffResult || !weekData) return;

        setIsFixing(true);
        try {
            const fixResult = await generateScheduleFix(
                weekData.shifts || [],
                riders || [],
                sheriffResult.missingCoverage
            );

            if (fixResult && fixResult.newShifts.length > 0) {
                // Confirm before applying
                const confirmed = window.confirm(
                    `El Sheriff sugiere ${fixResult.newShifts.length} nuevos turnos:\n\n` +
                    fixResult.explanation +
                    `\n\n¿Aplicar cambios ahora?`
                );

                if (confirmed) {
                    const newShiftsObjects: Shift[] = fixResult.newShifts.map(s => {
                        // Parse "YYYY-MM-DD" and startHour to ISO
                        const startD = new Date(s.startDay);
                        startD.setHours(s.startHour, 0, 0, 0);

                        const endD = new Date(startD);
                        endD.setHours(s.startHour + s.duration, 0, 0, 0);

                        // Find rider name
                        const rider = riders?.find(r => r.id === s.riderId);

                        return {
                            id: `fix_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                            shiftId: `fix_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                            riderId: s.riderId,
                            riderName: rider ? (rider.fullName || 'Rider') : 'Desconocido',
                            motoId: null,
                            motoPlate: null,
                            startAt: toLocalISOStringWithOffset(startD),
                            endAt: toLocalISOStringWithOffset(endD),
                            notes: `Sheriff Auto-Fix: ${s.reason}`
                        };
                    });

                    // Merge and Save
                    const currentShifts = weekData.shifts || [];
                    const updatedShifts = [...currentShifts, ...newShiftsObjects];

                    const updatedWeekData: WeekData = {
                        ...(weekData),
                        shifts: updatedShifts,
                        id: currentWeekId,
                        startDate: toLocalDateString(getStartOfWeek(referenceDate))
                    } as WeekData;

                    await WeekService.saveWeek(toFranchiseId(franchiseId), toWeekId(currentWeekId), updatedWeekData);
                    updateWeekData(updatedWeekData);

                    // Re-audit automatically to show improved score
                    setTimeout(() => handleAuditoria(), 1000);

                }
            } else {
                alert("El Sheriff no encontró una solución automática viable. Intenta mover turnos manualmente.");
            }
        } catch (error) {
            console.error("Auto-Fix Error:", error);
            alert("Error al aplicar la corrección automática.");
        } finally {
            setIsFixing(false);
        }
    };

    const handleGeneration = async () => {
        if (!genPrompt.trim()) return;
        setIsGenerating(true);
        try {
            const startDate = weekData?.startDate || (referenceDate instanceof Date ? referenceDate.toISOString() : referenceDate).split('T')[0];
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 6);

            const result = await generateFullSchedule(
                genPrompt,
                riders || [],
                startDate,
                endDate.toISOString().split('T')[0]
            );

            if (result && result.shifts.length > 0) {
                const apply = window.confirm(`He generado ${result.shifts.length} turnos:\n\n${result.explanation}\n\n¿Aplicar al cuadrante?`);

                if (apply) {
                    const newShiftsObjects = result.shifts.map(s => {
                        const startD = new Date(s.startDay);
                        startD.setHours(s.startHour, 0, 0, 0);
                        const endD = new Date(startD);
                        endD.setHours(s.startHour + s.duration, 0, 0, 0);

                        const rider = riders?.find(r => r.id === s.riderId);

                        return {
                            id: `gen_${Date.now()}_${Math.random()}`,
                            shiftId: `gen_${Date.now()}_${Math.random()}`,
                            riderId: s.riderId,
                            riderName: rider ? rider.fullName : 'Rider IA',
                            motoId: null,
                            motoPlate: null,
                            startAt: toLocalISOStringWithOffset(startD),
                            endAt: toLocalISOStringWithOffset(endD),
                            notes: `IA: ${s.reason}`
                        };
                    });

                    // Adding to existing
                    const updatedWeek = {
                        ...weekData,
                        shifts: [...(weekData?.shifts || []), ...newShiftsObjects]
                    } as WeekData;

                    await WeekService.saveWeek(toFranchiseId(franchiseId), toWeekId(currentWeekId), updatedWeek);
                    updateWeekData(updatedWeek);
                    setShowGenModal(false);
                    setGenPrompt('');
                }
            }
        } catch (e) {
            console.error(e);
            alert("Error generando horario");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleOpenNew = (dateIsoString?: string) => {
        if (readOnly) return;
        setEditingShift(null);
        if (dateIsoString) {
            setSelectedDateForNew(dateIsoString);
        } else {
            const today = toLocalDateString(new Date());
            const isTodayInWeek = weekData && weekData.startDate && weekData.endDate && today >= weekData.startDate && today <= weekData.endDate;
            setSelectedDateForNew(isTodayInWeek ? today : (weekData?.startDate || today));
        }
        setIsModalOpen(true);
    };


    // const handleCopyWeek = async () => { ... } // Kept commented as in original if not used

    const handleSaveShift = async (shiftPayload: any) => {
        // Internal save logic extracted for reuse in callbacks
        const saveInternal = async (payload: any) => {
            try {
                setIsProcessing(true);
                const currentShifts = weekData?.shifts || [];
                let updatedShifts: Shift[];

                if (editingShift) {
                    updatedShifts = currentShifts.map((s: any) => (s.shiftId === payload.shiftId || s.id === payload.shiftId) ? payload : s);
                } else {
                    updatedShifts = [...currentShifts, payload];
                }

                const updatedWeekData: WeekData = {
                    ...(weekData || {}),
                    shifts: updatedShifts,
                    id: currentWeekId,
                    startDate: toLocalDateString(getStartOfWeek(referenceDate)),
                    status: weekData?.status || 'draft',
                    metrics: weekData?.metrics || { totalHours: 0, activeRiders: 0, motosInUse: 0 }
                } as WeekData;
                await WeekService.saveWeek(toFranchiseId(franchiseId), toWeekId(currentWeekId), updatedWeekData);
                updateWeekData(updatedWeekData);
                setIsModalOpen(false);
            } catch (error: any) {
                console.error("Error saving shift:", error);
                alert("Error al guardar el turno.");
            } finally {
                setIsProcessing(false);
            }
        };

        const currentShifts = weekData?.shifts || [];

        // A. Moto Conflict
        const motoConflict = findMotoConflict(shiftPayload, currentShifts, editingShift?.shiftId);
        if (motoConflict) {
            setConfirmDialog({
                isOpen: true,
                title: 'Conflicto de Moto',
                message: `La moto ya está asignada a ${motoConflict.riderName} en este horario. ¿Quieres asignarla de todas formas?`,
                confirmText: 'Asignar Igualmente',
                isDestructive: true,
                onConfirm: () => saveInternal(shiftPayload)
            });
            return;
        }

        // B. Rider Conflict
        const riderConflict = findRiderConflict(shiftPayload, currentShifts, editingShift?.shiftId);
        if (riderConflict) {
            setConfirmDialog({
                isOpen: true,
                title: 'Conflicto de Rider',
                message: `${shiftPayload.riderName} ya tiene turno. ¿Crear igual?`,
                confirmText: 'Crear Igualmente',
                isDestructive: true,
                onConfirm: () => saveInternal(shiftPayload)
            });
            return;
        }

        // No conflicts
        await saveInternal(shiftPayload);
    };


    const handleDeleteShift = async (shiftId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();

        const performDelete = async () => {
            try {
                setIsProcessing(true);
                const currentShifts = weekData?.shifts || [];
                const updatedShifts = currentShifts.filter((s) => (s.shiftId !== shiftId && (s.id as string) !== shiftId));
                if (!weekData) return;
                const updatedWeekData: Partial<WeekData> = { ...weekData, shifts: updatedShifts, id: currentWeekId };
                await WeekService.saveWeek(toFranchiseId(franchiseId), toWeekId(currentWeekId), updatedWeekData);
                updateWeekData(updatedWeekData as WeekData);
                setIsModalOpen(false);
            } catch (error) {
                console.error("Error deleting shift:", error);
                alert("Error al eliminar.");
            } finally {
                setIsProcessing(false);
            }
        };

        setConfirmDialog({
            isOpen: true,
            title: 'Eliminar Turno',
            message: '¿Seguro que quieres eliminar este turno? Esta acción no se puede deshacer.',
            confirmText: 'Eliminar',
            isDestructive: true,
            onConfirm: performDelete
        });
    };

    // KEYBOARD SHORTCUTS
    React.useEffect(() => {
        (window as any).showSchedulerContextMenu = (e: React.MouseEvent, event: ShiftEvent) => {
            setContextMenu({ x: e.clientX, y: e.clientY, event });
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            const targetId = selectedShiftId || hoveredShiftId;
            if (!targetId || isSaving || readOnly) return;

            // Delete / Backspace
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const target = weekData?.shifts.find(s => s.shiftId === targetId || s.id === targetId);
                if (target) {
                    handleDeleteShift(targetId);
                }
            }

            // Ctrl + D (Duplicate)
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                const target = weekData?.shifts.find(s => s.shiftId === targetId || s.id === targetId);
                if (target) {
                    const startD = new Date(target.startAt);
                    const endD = new Date(target.endAt);
                    const newStart = new Date(startD);
                    newStart.setDate(newStart.getDate() + 1);
                    const newEnd = new Date(endD);
                    newEnd.setDate(newEnd.getDate() + 1);

                    const payload = {
                        ...target,
                        id: `clon_${Date.now()}`,
                        shiftId: `clon_${Date.now()}`,
                        startAt: toLocalISOStringWithOffset(newStart),
                        endAt: toLocalISOStringWithOffset(newEnd),
                        isConfirmed: false,
                        changeRequested: false
                    };
                    handleSaveShift(payload);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedShiftId, hoveredShiftId, weekData, isSaving, readOnly, handleDeleteShift, handleSaveShift]);

    // --- HELPERS FOR RENDERING ---

    const getDays = () => {
        // ALWAYS calculate Monday from referenceDate to ensure strict Weekly View (Mon-Mon)
        const startString = getStartOfWeek(referenceDate);
        const [y, m, d] = startString.split('-').map(Number);
        const start = new Date(y, m - 1, d);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const dateObj = new Date(start);
            dateObj.setDate(start.getDate() + i);
            days.push({
                dateObj: dateObj,
                label: dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
                isoDate: toLocalDateString(dateObj),
                shortLabel: dateObj.toLocaleDateString('es-ES', { weekday: 'short' })
            });
        }
        return days;
    };

    const days = getDays();

    // --- OPTIMIZATION: GROUP BY DAY DICTIONARY (O(N)) ---
    const visualEvents = useMemo(() => {
        if (!weekData?.shifts) return {} as Record<string, VisualEvent[]>;

        const groupedEvents: Record<string, VisualEvent[]> = {}; // Dictionary: { 'YYYY-MM-DD': [events...] }

        // Helper to push to dictionary safely
        const pushToDay = (dateKey: string, eventObj: VisualEvent) => {
            if (!groupedEvents[dateKey]) groupedEvents[dateKey] = [];
            groupedEvents[dateKey].push(eventObj);
        };

        weekData.shifts.forEach((shift: Shift) => {
            const startISO = shift.startAt;
            const endISO = shift.endAt;

            // WARNING: INTENTIONAL TIMEZONE STRIPPING FOR VISUAL CONSISTENCY
            const parseDateManual = (isoStr: string) => {
                if (!isoStr) return new Date();
                const cleanStr = isoStr.replace('Z', '').split('.')[0];
                const [datePart, timePart] = cleanStr.split('T');
                const [y, m, d] = datePart.split('-').map(Number);
                const [h, min] = timePart.split(':').map(Number);
                return new Date(y, m - 1, d, h, min, 0);
            };

            const start = parseDateManual(startISO);
            const end = parseDateManual(endISO);
            const startDay = startISO.split('T')[0];
            const endDay = endISO.split('T')[0];

            if (startDay === endDay) {
                pushToDay(startDay, {
                    ...shift,
                    shiftId: shift.shiftId || shift.id || `unknown_${Math.random()}`,
                    riderId: shift.riderId || 'unassigned',
                    riderName: shift.riderName || 'Sin Asignar',
                    visualDate: startDay,
                    visualStart: start,
                    visualEnd: end,
                    isConfirmed: shift.isConfirmed === true,
                    changeRequested: shift.changeRequested === true,
                    changeReason: shift.changeReason || null,
                    franchiseId: shift.franchiseId || '',
                    isContinuation: false
                });
            } else {
                // Cross-Midnight Split
                const endOfDay = new Date(start);
                endOfDay.setHours(23, 59, 59, 999);
                pushToDay(startDay, {
                    ...shift,
                    shiftId: shift.shiftId || shift.id || `unknown_${Math.random()}`,
                    riderId: shift.riderId || 'unassigned',
                    riderName: shift.riderName || 'Sin Asignar',
                    visualDate: startDay,
                    visualStart: start,
                    visualEnd: endOfDay,
                    isConfirmed: shift.isConfirmed === true,
                    changeRequested: shift.changeRequested === true,
                    changeReason: shift.changeReason || null,
                    franchiseId: shift.franchiseId || '',
                    isContinuation: false
                });

                const startOfNextDay = new Date(end);
                startOfNextDay.setHours(0, 0, 0, 0);
                pushToDay(endDay, {
                    ...shift,
                    shiftId: shift.shiftId || shift.id || `unknown_${Math.random()}`,
                    riderId: shift.riderId || 'unassigned',
                    riderName: shift.riderName || 'Sin Asignar',
                    visualDate: endDay,
                    visualStart: startOfNextDay,
                    visualEnd: end,
                    isConfirmed: shift.isConfirmed === true,
                    changeRequested: shift.changeRequested === true,
                    changeReason: shift.changeReason || null,
                    franchiseId: shift.franchiseId || '',
                    isContinuation: true
                });
            }
        });

        return groupedEvents;
    }, [weekData?.shifts]);

    // Color map for riders
    const riderColorMap = useMemo(() => {
        return getRiderColorMap(riders || []);
    }, [riders]);

    // --- V13 CORE LOGIC: GROUPING BY RIDER ---
    const ridersGrid = useMemo(() => {
        if (!riders) return [];

        // Sort riders: Active first, then alphabet
        const sortedRiders = [...riders].sort((a, b) => {
            if (a.status === 'active' && b.status !== 'active') return -1;
            if (a.status !== 'active' && b.status === 'active') return 1;
            return a.fullName.localeCompare(b.fullName);
        });

        // Group shifts by rider
        const riderShiftsMap: Record<string, Record<string, ShiftEvent[]>> = {};

        // Initialize map
        sortedRiders.forEach(r => {
            riderShiftsMap[r.id] = {};
            days.forEach(d => riderShiftsMap[r.id][d.isoDate] = []);
        });

        // Fill map with Merging Logic
        Object.keys(visualEvents).forEach(dayKey => {
            visualEvents[dayKey].forEach(ev => {
                if (ev.riderId && riderShiftsMap[ev.riderId]) {
                    const riderDayShifts = riderShiftsMap[ev.riderId][dayKey];

                    // Visual Merging: If this shift starts exactly when the last one ended
                    const lastShift = riderDayShifts[riderDayShifts.length - 1];
                    if (lastShift && lastShift.endAt === ev.startAt && !ev.isContinuation) {
                        // Merge!
                        lastShift.endAt = ev.endAt;
                        lastShift.visualEnd = ev.visualEnd;
                        // Keep the original id, but update data
                    } else {
                        riderDayShifts.push({ ...ev } as ShiftEvent);
                    }
                }
            });
        });

        return sortedRiders.map(rider => {
            const totalMinutes = days.reduce((acc, day) => {
                const dayShifts = riderShiftsMap[rider.id][day.isoDate] || [];
                const dayMinutes = dayShifts.reduce((dAcc, s) => {
                    const start = new Date(s.startAt);
                    const end = new Date(s.endAt);
                    return dAcc + (end.getTime() - start.getTime()) / (1000 * 60);
                }, 0);
                return acc + dayMinutes;
            }, 0);

            return {
                ...rider,
                workedHours: Math.round((totalMinutes / 60) * 10) / 10,
                days: days.map(day => ({
                    ...day,
                    shifts: riderShiftsMap[rider.id][day.isoDate] || []
                }))
            };
        });
    }, [riders, visualEvents, days]);

    // Position calc constants
    const START_HOUR = 8;
    const END_HOUR = 24;
    const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

    const getShiftPosition = (start: Date, end: Date) => {
        const sHour = start.getHours();
        const sMin = start.getMinutes();
        const eHour = end.getHours();
        const eMin = end.getMinutes();

        // Clamp to grid range
        const safeStart = Math.max(sHour * 60 + sMin, START_HOUR * 60);
        const safeEnd = Math.min(eHour * 60 + eMin, END_HOUR * 60);

        const leftPercent = ((safeStart - START_HOUR * 60) / TOTAL_MINUTES) * 100;
        const widthPercent = ((safeEnd - safeStart) / TOTAL_MINUTES) * 100;

        return { left: `${leftPercent}%`, width: `${widthPercent}%` };
    };

    // Drag & Drop
    const handleDrop = async (e: React.DragEvent, targetDay: { isoDate: string }) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-blue-500/10', 'border-blue-400/50');
        if (readOnly) return;

        try {
            const rawData = e.dataTransfer.getData('application/json');
            if (!rawData) return;
            const shiftData = JSON.parse(rawData);

            setIsProcessing(true);

            const originalStart = new Date(shiftData.startAt);
            const originalEnd = new Date(shiftData.endAt);
            const duration = originalEnd.getTime() - originalStart.getTime();

            const newStart = new Date(targetDay.isoDate);
            const newEnd = new Date(targetDay.isoDate);
            newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
            newEnd.setHours(originalEnd.getHours(), originalEnd.getMinutes(), 0, 0);
            newEnd.setTime(newStart.getTime() + duration);

            const updatedShift = {
                ...shiftData,
                startAt: newStart.toISOString(),
                endAt: newEnd.toISOString()
            };

            // Basic conflict check
            const hasConflict = weekData?.shifts.some((s: Shift) => {
                if (s.shiftId === shiftData.shiftId) return false;
                const sameRider = s.riderId === updatedShift.riderId;
                const sameMoto = s.motoId && updatedShift.motoId && s.motoId === updatedShift.motoId;
                const sStart = new Date(s.startAt);
                const sEnd = new Date(s.endAt);
                const timeOverlap = !(newEnd <= sStart || newStart >= sEnd);
                return timeOverlap && (sameRider || sameMoto);
            });

            if (hasConflict) {
                alert('⚠️ ¡Conflicto detectado! El turno no puede moverse a ese horario.');
                setIsProcessing(false);
                return;
            }

            if (!weekData) return;
            const currentShifts = weekData.shifts || [];
            const updatedShifts = currentShifts.map((s: Shift) =>
                s.shiftId === shiftData.shiftId ? updatedShift : s
            );
            const updatedWeekData: WeekData = {
                ...weekData,
                shifts: updatedShifts,
                id: currentWeekId,
                startDate: weekData.startDate || (referenceDate instanceof Date ? referenceDate.toISOString() : referenceDate).split('T')[0]
            } as WeekData;
            await WeekService.saveWeek(toFranchiseId(franchiseId), toWeekId(currentWeekId), updatedWeekData);
            updateWeekData(updatedWeekData);

        } catch (error) {
            console.error('Error dropping shift:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.currentTarget.classList.add('bg-blue-500/10', 'border-blue-400/50'); };
    const handleDragLeave = (e: React.DragEvent) => { e.currentTarget.classList.remove('bg-blue-500/10', 'border-blue-400/50'); };
    const handleEditShift = (shift: any) => { setEditingShift(shift); setSelectedDateForNew(null); setIsModalOpen(true); };
    const handleColumnClick = (e: React.MouseEvent, dateIso: string) => { if (e.target === e.currentTarget) handleOpenNew(dateIso); };

    const onSaveAll = () => saveWeek(franchiseId, currentWeekId, weekData as WeekData);

    const handleAuditoria = async () => {
        if (!weekData?.shifts || weekData.shifts.length === 0) {
            alert("El cuadrante está vacío. Añade turnos antes de auditar.");
            return;
        }
        setIsAuditing(true);
        setSheriffResult(null);
        try {
            const result = await validateWeeklySchedule(weekData.shifts);
            if (result) {
                setSheriffResult(result);
            } else {
                alert("El Sheriff no ha podido validar el cuadrante. Inténtalo de nuevo.");
            }
        } catch (error) {
            console.error("Error en auditoría:", error);
            alert("Error de conexión con el Sheriff.");
        } finally {
            setIsAuditing(false);
        }
    };


    const handleQuickFillCreate = async (newShifts: Partial<any>[]) => {
        if (!newShifts.length) return;
        setIsProcessing(true);
        try {
            // Prepare shifts with IDs and data
            const shiftsToSave = newShifts.map(s => {
                // Find rider to get name
                const rider = riders.find(r => r.id === s.riderId);

                return {
                    id: `qf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    shiftId: `qf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    riderId: s.riderId,
                    riderName: rider ? rider.fullName : 'Rider',
                    motoId: s.motoId || null,
                    motoPlate: s.motoPlate || null,
                    startAt: s.startAt,
                    endAt: s.endAt,
                    notes: 'Auto-Relleno',
                    isConfirmed: true // Auto-approve quick fill shifts? Or draft? Let's say draft but valid.
                };
            });

            // Add to current week shifts
            const currentShifts = weekData?.shifts || [];
            const updatedShifts = [...currentShifts, ...shiftsToSave];

            const updatedWeekData: WeekData = {
                ...(weekData!),
                shifts: updatedShifts,
                id: currentWeekId,
                startDate: toLocalDateString(getStartOfWeek(referenceDate))
            } as WeekData;

            await WeekService.saveWeek(toFranchiseId(franchiseId), toWeekId(currentWeekId), updatedWeekData);
            updateWeekData(updatedWeekData);
            setIsQuickFillOpen(false);

        } catch (error) {
            console.error("Error QuickFill:", error);
            alert("Error al guardar los turnos automáticos.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-indigo-50/30 font-sans text-slate-900 overflow-hidden relative selection:bg-indigo-100 selection:text-indigo-900">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

            {/* Inline Intelligence Injection Points are in the Day Headers below */}

            {/* SHERIFF RESULT OVERLAY */}
            {sheriffResult && (
                <div className="absolute top-16 right-4 z-50 w-80 animate-in slide-in-from-right-10 fade-in duration-300">
                    <div className={`
                        p-4 rounded-xl shadow-2xl border backdrop-blur-md
                        ${sheriffResult.status === 'optimal'
                            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                            : sheriffResult.status === 'critical'
                                ? 'bg-rose-50/90 border-rose-200 text-rose-900'
                                : 'bg-amber-50/90 border-amber-200 text-amber-900'
                        }
                    `}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                {sheriffResult.status === 'optimal'
                                    ? <ShieldCheck className="w-6 h-6 text-emerald-600" />
                                    : <AlertTriangle className="w-6 h-6" />
                                }
                                <div>
                                    <h3 className="font-black text-sm uppercase tracking-wider">Reporte del Sheriff</h3>
                                    <span className="text-xs font-bold opacity-80">Puntuación: {sheriffResult.score}/100</span>
                                </div>
                            </div>
                            <button onClick={() => setSheriffResult(null)} className="opacity-50 hover:opacity-100" title="Cerrar reporte">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs font-medium mb-3 leading-relaxed">
                            &quot;{sheriffResult.feedback}&quot;
                        </p>

                        {sheriffResult.missingCoverage.length > 0 && (
                            <div className="bg-white/50 rounded-lg p-2 text-[10px] font-mono mb-2">
                                <strong className="block mb-1 opacity-70">ALERTAS DE COBERTURA:</strong>
                                <ul className="list-disc pl-4 space-y-0.5">
                                    {sheriffResult.missingCoverage.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* AUTO-FIX ACTION */}
                        {sheriffResult.status !== 'optimal' && (
                            <button
                                onClick={handleAutoFix}
                                disabled={isFixing}
                                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded-lg text-xs font-bold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {isFixing ? (
                                    <>
                                        <div className="animate-spin w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />
                                        Generando Solución...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-3 h-3" />
                                        Corregir con IA
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* --- HEADER --- */}
            <div className="flex items-center justify-between p-2 border-b border-white/50 bg-white/60 backdrop-blur-xl sticky top-0 z-30 shadow-sm supports-[backdrop-filter]:bg-white/40 h-14">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center tracking-tight">
                        <span className="bg-gradient-to-r from-indigo-900 to-slate-800 bg-clip-text text-transparent mr-2">        {(() => {
                            const d = new Date(referenceDate);
                            const month = d.toLocaleDateString('es-ES', { month: 'long' });
                            const year = d.getFullYear();
                            return <span className="capitalize">{month} <span className="text-slate-400 font-light text-base">{year}</span></span>;
                        })()}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-white/50 text-slate-500 text-[10px] font-bold border border-slate-200/60 shadow-sm backdrop-blur-sm">
                            S{getWeekIdFromDate(new Date(referenceDate)).split('_')[1]}
                        </span>
                    </h2>
                    <div className="flex gap-1 bg-slate-100/50 p-0.5 rounded-lg border border-slate-200/50">
                        <button onClick={() => changeWeek(-1)} aria-label="Semana anterior" className="p-1 rounded-md hover:bg-white text-slate-400 hover:text-indigo-600 transition-all shadow-sm hover:shadow-md active:scale-95">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => changeWeek(1)} aria-label="Semana siguiente" className="p-1 rounded-md hover:bg-white text-slate-400 hover:text-indigo-600 transition-all shadow-sm hover:shadow-md active:scale-95">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* VIEW MODE TOGGLES */}
                    <div className="bg-white p-1 rounded-lg border-2 border-slate-200 dark:border-slate-700 flex gap-0.5 mr-2 shadow-sm scale-90 origin-right">
                        <button
                            onClick={() => setViewMode('prime')}
                            className={`group relative px-3 py-1.5 rounded-md text-[10px] font-bold transition-all duration-300 flex items-center gap-1.5 overflow-hidden ${viewMode === 'prime'
                                ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:shadow-md'
                                }`}
                        >
                            <div className="relative z-10 flex items-center gap-1.5">
                                <Filter className={`w-3 h-3 transition-transform group-hover:scale-110 ${viewMode === 'prime' ? 'text-white' : 'text-amber-500'}`} />
                                <div className="flex flex-col items-start leading-none">
                                    <span className={`tracking-wide font-black ${viewMode === 'prime' ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>PRIME</span>
                                </div>
                            </div>
                            {viewMode === 'prime' && (
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer" />
                            )}
                        </button>
                        <button
                            onClick={() => setViewMode('full')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold tracking-wider transition-all duration-300 ${viewMode === 'full'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            TODO EL DÍA
                        </button>
                    </div>

                    {!isMobile && (
                        <>
                            {/* Rider Filter Selector */}
                            <div className="flex items-center gap-2 mr-2">
                                <select
                                    value={selectedRiderId || ''}
                                    onChange={(e) => setSelectedRiderId(e.target.value || null)}
                                    className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                                    aria-label="Filtrar por rider"
                                >
                                    <option value="">🏍️ Riders</option>
                                    {riders?.map((rider) => (
                                        <option key={rider.id} value={rider.id}>
                                            {rider.fullName || rider.id}
                                        </option>
                                    ))}
                                </select>
                                {/* Color Legend - Only show riders that exist */}
                                {selectedRiderId === null && riders && riders.length > 0 && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md shadow-sm">
                                        <span className="text-[9px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">Riders:</span>
                                        {riders.map((rider) => {
                                            const color = riderColorMap.get(rider.id);
                                            return (
                                                <div
                                                    key={rider.id}
                                                    className={`w-2 h-2 rounded-full ${color?.bg} border ${color?.border} shadow-sm transition-transform hover:scale-125 cursor-help`}
                                                    title={rider.fullName || rider.id}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            {!readOnly && (
                                <>
                                    <button onClick={onSaveAll} disabled={isSaving} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md transition-all disabled:opacity-50 text-[10px] font-bold shadow-sm hover:shadow-md active:scale-95 ring-1 ring-white/10">
                                        <Save className="w-3 h-3" />
                                        {isSaving ? 'Guardando...' : 'Guardar'}
                                    </button>
                                    <button
                                        onClick={handleAuditoria}
                                        disabled={isAuditing || isSaving}
                                        className={`
                                            flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-[10px] font-bold shadow-sm hover:shadow-md active:scale-95 border backdrop-blur-sm
                                            ${sheriffResult ? (sheriffResult.status === 'optimal' ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200' : 'bg-amber-50/80 text-amber-700 border-amber-200') : 'bg-white/80 text-slate-600 border-slate-200 hover:bg-slate-50'}
                                        `}
                                    >
                                        {isAuditing ? <div className="animate-spin w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full" /> : <BadgeCheck className="w-3 h-3" />}
                                        {sheriffResult ? `Sheriff: ${sheriffResult.score}/100` : 'Auditar'}
                                    </button>

                                    {/* Tools Group */}
                                    <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                                        <button onClick={() => setIsQuickFillOpen(true)} className="flex items-center gap-1.5 px-2 py-1 hover:bg-white text-slate-600 hover:text-indigo-600 rounded-md transition-all disabled:opacity-50 text-[10px] font-bold active:scale-95">
                                            <Zap className="w-3 h-3" />
                                            <span className="hidden md:inline">Autocompletar</span>
                                        </button>
                                        <div className="w-px h-3 bg-slate-300 mx-0.5" />
                                        <button
                                            onClick={() => setShowGenModal(true)}
                                            className="flex items-center gap-1.5 px-2 py-1 hover:bg-white text-slate-600 hover:text-violet-600 rounded-md transition-all disabled:opacity-50 text-[10px] font-bold active:scale-95"
                                        >
                                            <Sparkles className="w-3 h-3" />
                                            <span className="hidden xl:inline">IA Mágica</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                    {isMobile && !readOnly && (
                        <button onClick={() => setIsQuickFillOpen(true)} aria-label="Auto-Rellenar" className="p-2 bg-indigo-600 text-white rounded-lg shadow-md">
                            <Zap className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div >

            {loading || isProcessing ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-50">
                    <div className="animate-spin mr-3 h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
                    <span className="font-medium text-slate-500">Cargando semana...</span>
                </div>
            ) : (
                <div className="flex-1 overflow-hidden bg-slate-50 relative flex flex-col">
                    {isMobile ? (
                        <div className="flex-1 overflow-auto p-4">
                            <MobileAgendaView
                                days={days}
                                visualEvents={visualEvents}
                                intelByDay={intelByDay}
                                onEditShift={handleEditShift}
                                onDeleteShift={handleDeleteShift}
                                onAddShift={handleOpenNew}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col bg-white overflow-hidden rounded-tl-2xl border-l border-slate-200/50 shadow-xl shadow-slate-200/30">
                            {/* V13 GANTT HEADER (Days) - Glassmorphic */}
                            <div className="flex bg-white/80 border-b border-slate-200/80 sticky top-0 z-40 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
                                <div className="w-56 shrink-0 border-r border-slate-200 p-2 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">RIDER</span>
                                    <Filter className="w-3 h-3 text-slate-300" />
                                </div>
                                <div className="flex-1 grid grid-cols-7 divide-x divide-slate-200">
                                    {days.map((day, i) => {
                                        const isToday = new Date().toISOString().split('T')[0] === day.isoDate;
                                        const intel = intelByDay[day.isoDate] || [];
                                        const demand = getDayDemandLevel(day.isoDate, intel);

                                        return (
                                            <div key={i} className={cn(
                                                "p-2 flex flex-col gap-1 transition-all",
                                                isToday ? "bg-indigo-50/50" : "bg-white/80",
                                                demand === 'critical' ? "border-b-2 border-b-rose-500" :
                                                    demand === 'warning' ? "border-b-2 border-b-amber-500" : ""
                                            )}>
                                                <div className="flex items-center justify-between">
                                                    <span className={cn("text-[9px] font-bold uppercase tracking-tighter", isToday ? "text-indigo-600" : "text-slate-400")}>
                                                        {day.shortLabel}
                                                    </span>
                                                    <span className={cn("text-xs font-black", isToday ? "text-indigo-700" : "text-slate-800")}>
                                                        {day.label.split(' ')[1]}
                                                    </span>
                                                </div>
                                                {/* Mini Timeline Grid for Day Header */}
                                                <div className="flex justify-between px-0.5 opacity-30">
                                                    {[8, 12, 16, 20, 24].map(h => (
                                                        <span key={h} className="text-[7px] font-black font-mono">{h}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* V13 GANTT ROWS - With improved spacing and separation */}
                            <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50/50">
                                {ridersGrid.map((row, rIdx) => (
                                    <div key={row.id} className={cn(
                                        "flex border-b border-slate-100/80 items-center transition-all duration-200 group/row h-[38px]",
                                        rIdx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                                    )}>
                                        {/* Rider Info Side - Sticky Glass */}
                                        <div className="w-56 shrink-0 border-r border-slate-100/80 p-2 flex items-center gap-3 sticky left-0 z-30 transition-colors backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
                                            <div className="relative">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm ring-1 ring-slate-100 transition-transform group-hover/row:scale-105",
                                                    riderColorMap.get(row.id)?.bg || 'bg-slate-200'
                                                )}>
                                                    {getRiderInitials(row.fullName)}
                                                </div>
                                                {row.status === 'active' && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex flex-col flex-1">
                                                <div className="text-[11px] font-bold text-slate-700 truncate group-hover/row:text-indigo-600 transition-colors leading-tight mb-0.5">{row.fullName}</div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1.5 py-px rounded-full border border-slate-200/50 whitespace-nowrap">
                                                        C: <span className="font-bold text-slate-600">{row.contractHours || 40}h</span>
                                                    </span>
                                                    <span className={cn(
                                                        "text-[9px] font-medium px-1.5 py-px rounded-full border whitespace-nowrap",
                                                        (row.workedHours || 0) > (row.contractHours || 40) ? "bg-amber-50 text-amber-600 border-amber-200" :
                                                            (row.workedHours || 0) < ((row.contractHours || 40) - 5) ? "bg-indigo-50 text-indigo-600 border-indigo-200" :
                                                                "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                    )}>
                                                        R: <span className="font-bold">{(row.workedHours || 0)}h</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Days Grid - Subtle grid lines */}
                                        <div className="flex-1 grid grid-cols-7 divide-x divide-slate-100/80 h-full">
                                            {row.days.map((day, dIdx) => (
                                                <div
                                                    key={dIdx}
                                                    className="h-12 relative flex items-center px-1 overflow-hidden cursor-crosshair group/cell"
                                                    onClick={(e) => handleColumnClick(e, day.isoDate)}
                                                    onDragOver={handleDragOver}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={(e) => handleDrop(e, day)}
                                                >
                                                    {/* Background Timeline Ticks (Subtle dashed) */}
                                                    <div className="absolute inset-0 flex justify-between px-0.5 opacity-[0.04] pointer-events-none">
                                                        {Array.from({ length: 9 }).map((_, i) => (
                                                            <div key={i} className="w-[1px] h-full border-r border-dashed border-slate-900" />
                                                        ))}
                                                    </div>

                                                    {/* Current Time Indicator (Only today, Only in this day cells) */}
                                                    {new Date().toISOString().split('T')[0] === day.isoDate && (
                                                        <CurrentTimeIndicator startHour={START_HOUR} endHour={END_HOUR} />
                                                    )}

                                                    {/* Shifts Container */}
                                                    <div className="relative w-full h-full flex items-center">
                                                        {day.shifts.map((ev) => (
                                                            <div
                                                                key={ev.shiftId}
                                                                className="absolute"
                                                                style={getShiftPosition(ev.visualStart, ev.visualEnd)}
                                                            >
                                                                <ShiftPill
                                                                    event={ev}
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedShiftId(ev.shiftId || ev.id || null); handleEditShift(ev); }}
                                                                    onDelete={handleDeleteShift}
                                                                    isSelected={selectedShiftId === (ev.shiftId || ev.id)}
                                                                    isHovered={hoveredShiftId === (ev.shiftId || ev.id)}
                                                                    onMouseEnter={() => setHoveredShiftId((ev.shiftId || ev.id) || null)}
                                                                    onMouseLeave={() => setHoveredShiftId(null)}
                                                                    riderColor={riderColorMap.get(row.id)}
                                                                    readOnly={readOnly}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Add Trigger (Hidden until hover) */}
                                                    {!readOnly && (
                                                        <div className="absolute inset-0 bg-indigo-500/0 group-hover/cell:bg-indigo-500/[0.03] transition-colors pointer-events-none" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* V13 COVERAGE BAR - Bottom Sticky */}
            <div className="flex bg-slate-900 border-t border-slate-800 h-8 shrink-0">
                <div className="w-56 shrink-0 border-r border-slate-800 flex items-center px-4 bg-slate-950">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cobertura</span>
                </div>
                <div className="flex-1 grid grid-cols-7 divide-x divide-slate-800">
                    {days.map((_, dIdx) => (
                        <div key={dIdx} className="relative h-full flex items-center px-1 gap-px overflow-hidden">
                            {coverageMetrics[dIdx].slice(START_HOUR, END_HOUR).map((count, hIdx) => {
                                const currentH = START_HOUR + hIdx;
                                const isPrime = (currentH >= 12 && currentH < 16) || (currentH >= 19 && currentH < 24);
                                const minRequired = isPrime ? 4 : 2;
                                const status = count >= minRequired ? 'optimal' : count > 0 ? 'warning' : 'critical';

                                return (
                                    <div
                                        key={hIdx}
                                        className={cn(
                                            "flex-1 h-3 rounded-[1px] transition-all relative group/cov",
                                            status === 'optimal' ? "bg-emerald-500/40" :
                                                status === 'warning' ? "bg-amber-500/40" : "bg-slate-800"
                                        )}
                                    >
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-[8px] font-bold text-white px-1.5 py-0.5 rounded opacity-0 group-hover/cov:opacity-100 transition-opacity z-50 whitespace-nowrap border border-slate-700 pointer-events-none">
                                            {currentH}:00 | {count} Riders
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Context Menu Component */}
            {contextMenu && (
                <div
                    className="fixed z-[999] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-xl p-1.5 w-48 animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones Turno</div>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{contextMenu.event.riderName}</div>
                    </div>

                    <button
                        onClick={() => {
                            const updated = { ...contextMenu.event, isConfirmed: true, changeRequested: false };
                            handleSaveShift(updated);
                            setContextMenu(null);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <BadgeCheck className="w-4 h-4" /> Validar Turno
                    </button>

                    <button
                        onClick={() => {
                            const startD = new Date(contextMenu.event.startAt);
                            const endD = new Date(contextMenu.event.endAt);
                            const newStart = new Date(startD);
                            newStart.setDate(newStart.getDate() + 1);
                            const newEnd = new Date(endD);
                            newEnd.setDate(newEnd.getDate() + 1);

                            const payload = {
                                ...contextMenu.event,
                                id: `clon_${Date.now()}`,
                                shiftId: `clon_${Date.now()}`,
                                startAt: toLocalISOStringWithOffset(newStart),
                                endAt: toLocalISOStringWithOffset(newEnd),
                                isConfirmed: false,
                                changeRequested: false
                            };
                            handleSaveShift(payload);
                            setContextMenu(null);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Save className="w-4 h-4" /> Duplicar Mañana
                    </button>

                    <button
                        onClick={() => {
                            handleEditShift(contextMenu.event);
                            setContextMenu(null);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Zap className="w-4 h-4" /> Editar Detalles
                    </button>

                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                    <button
                        onClick={() => {
                            const idToDelete = contextMenu.event.shiftId || contextMenu.event.id;
                            if (idToDelete) {
                                handleDeleteShift(idToDelete);
                            }
                            setContextMenu(null);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <XCircle className="w-4 h-4" /> Eliminar
                    </button>

                    {/* Backdrop closer */}
                    <div className="fixed inset-0 -z-10" onClick={() => setContextMenu(null)} />
                </div>
            )}



            <ShiftModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveShift}
                initialData={editingShift}
                riders={riders}
                motos={motos}
                selectedDate={selectedDateForNew || undefined}
                onDelete={handleDeleteShift}
            />

            <ConfirmationModal
                isOpen={confirmDialog.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                isDestructive={confirmDialog.isDestructive}
                confirmText={confirmDialog.confirmText}
            />



            <QuickFillModal
                isOpen={isQuickFillOpen}
                onClose={() => setIsQuickFillOpen(false)}
                onRefresh={refresh}
                franchiseId={franchiseId}
                onCreateShifts={handleQuickFillCreate as any}
                riders={riders}
                motos={motos}
                weekDays={days}
                existingShifts={(weekData?.shifts || [])
                    .filter(s => s.riderId)
                    .map(s => ({
                        id: s.id,
                        shiftId: s.id,
                        riderId: s.riderId!,
                        startAt: s.startAt,
                        endAt: s.endAt
                    }))}
            />

            {/* Generative Scheduling Modal */}
            {showGenModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-indigo-100 dark:border-slate-800">
                        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-xl font-black flex items-center gap-2">
                                    <Sparkles className="w-6 h-6 text-amber-300" />
                                    Generador de Horarios IA
                                </h3>
                                <p className="text-indigo-100 text-sm mt-1 font-medium">Describe qué necesitas y la IA creará el cuadrante.</p>
                            </div>
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Wand2 className="w-24 h-24 rotate-12" />
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Instrucción para la IA</label>
                                <textarea
                                    value={genPrompt}
                                    onChange={(e) => setGenPrompt(e.target.value)}
                                    placeholder="Ej: Necesito 4 riders cada noche, y refuerzo el sábado. Lunes y Martes solo 2 riders al mediodía..."
                                    className="w-full h-32 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-slate-50 dark:bg-slate-800/50 placeholder:text-slate-400 focus:outline-none"
                                    autoFocus
                                />
                            </div>

                            <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-lg flex items-start gap-3">
                                <div className="bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm mt-0.5">
                                    <Wand2 className="w-4 h-4 text-indigo-600" />
                                </div>
                                <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed font-medium">
                                    La IA analizará tus riders disponibles y creará turnos óptimos respetando las reglas de descanso y cobertura.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                            <button
                                onClick={() => setShowGenModal(false)}
                                className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold text-sm transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleGeneration}
                                disabled={isGenerating || !genPrompt.trim()}
                                className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                                        Generando...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Generar Magia
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeeklyScheduler;
