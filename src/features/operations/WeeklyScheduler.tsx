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
import ConfirmationModal from '../../ui/feedback/ConfirmationModal';
import { getRiderColorMap } from '../../utils/riderColors';
import { useWeather } from '../../hooks/useWeather';
import { useAuth } from '../../context/AuthContext';
import { validateWeeklySchedule, generateScheduleFix, generateFullSchedule } from '../../lib/gemini';
import { BadgeCheck, AlertTriangle, ShieldCheck, Wand2, Sparkles, CheckCircle2 } from 'lucide-react';
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
    riderId: string;
    riderName: string;
    franchiseId: string;
}

// --- V13 SUB-COMPONENTS ---

const ShiftPill: React.FC<{
    event: ShiftEvent;
    onClick: (e: React.MouseEvent) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    riderColor?: { bg: string, border: string, text: string };
    readOnly?: boolean;
}> = ({ event, onClick, onDelete, riderColor, readOnly }) => {
    const isConfirmed = event.isConfirmed;
    const changeRequested = event.changeRequested;
    const changeReason = event.changeReason;
    const duration = getShiftDuration(event.startAt, event.endAt);
    const startTime = event.visualStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = event.visualEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Premium Gradient Logic based on duration/type
    const getGradientClass = () => {
        if (changeRequested) return "bg-gradient-to-r from-amber-400 to-amber-500 border-amber-300 shadow-amber-500/30 ring-amber-200/50";
        if (riderColor?.bg?.includes('rose')) return "bg-gradient-to-r from-rose-500 to-rose-600 border-rose-400/50 shadow-rose-500/20";
        if (riderColor?.bg?.includes('amber')) return "bg-gradient-to-r from-amber-500 to-amber-600 border-amber-400/50 shadow-amber-500/20";
        if (riderColor?.bg?.includes('emerald')) return "bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-400/50 shadow-emerald-500/20";
        if (riderColor?.bg?.includes('indigo')) return "bg-gradient-to-r from-indigo-500 to-indigo-600 border-indigo-400/50 shadow-indigo-500/20";
        if (riderColor?.bg?.includes('slate')) return "bg-gradient-to-r from-slate-500 to-slate-600 border-slate-400/50 shadow-slate-500/20";
        return "bg-gradient-to-r from-indigo-500 to-indigo-600 border-indigo-400/50 shadow-indigo-500/20";
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                "group/pill relative h-8 rounded-md border shadow-sm transition-all duration-300 cursor-pointer overflow-hidden flex items-center px-1.5",
                getGradientClass(),
                "hover:scale-[1.02] hover:shadow-lg hover:z-50 active:scale-95 hover:brightness-110",
                "ring-1 ring-white/10"
            )}
            title={`${event.riderName} | ${startTime} - ${endTime} (${duration}h)${changeRequested ? ` | MOTIVO: ${changeReason || 'Sin motivo'}` : ''}`}
        >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

            <div className="flex items-center gap-1.5 min-w-0 relative z-10">
                <span className="text-[9px] font-black truncate uppercase tracking-tight text-white/95 drop-shadow-sm">
                    {duration}h
                </span>
                <div className="w-0.5 h-3 bg-white/20 rounded-full" />
                <span className="text-[8px] font-bold text-white/80 truncate">
                    {startTime}-{endTime}
                </span>
                {isConfirmed && (
                    <div className="w-3 h-3 bg-white/20 rounded-full flex items-center justify-center ml-1">
                        <CheckCircle2 className="w-2 h-2 text-white" />
                    </div>
                )}
                {changeRequested && (
                    <div className="w-3 h-3 bg-white/20 rounded-full flex items-center justify-center ml-1 animate-pulse">
                        <AlertTriangle className="w-2 h-2 text-white" />
                    </div>
                )}
            </div>

            {/* Hover Delete Action */}
            {!readOnly && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(event.shiftId || '', e); }}
                    className="absolute right-0.5 opacity-0 group-hover/pill:opacity-100 transition-opacity bg-white/20 hover:bg-white/40 rounded p-0.5"
                >
                    <XCircle className="w-3 h-3 text-white" />
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
    const [editingShift, setEditingShift] = useState<any | null>(null); // Ideally narrow down ShiftData
    const [selectedDateForNew, setSelectedDateForNew] = useState<string | null>(null);
    const [isQuickFillOpen, setIsQuickFillOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null); // Filter by rider

    // PRIME MODE STATE - Horario Prime: 12:00-16:00 (comidas) y 19:00-24:00 (cenas)

    const { user } = useAuth();
    // Fetch weather for this franchise context (Franchises are in 'users' collection)
    const { daily: weatherDaily } = useWeather((franchiseId || user?.uid || '') as string, 'users');

    const [viewMode, setViewMode] = useState<'full' | 'prime'>('full');

    const { events: intelEvents } = useOperationsIntel(referenceDate, weatherDaily);
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
    const [isAuditing, setIsAuditing] = useState(false);
    const [isFixing, setIsFixing] = useState(false); // Auto-Fix State
    const [isGenerating, setIsGenerating] = useState(false);
    const [showGenModal, setShowGenModal] = useState(false);
    const [genPrompt, setGenPrompt] = useState('');

    // Helpers
    const changeWeek = (dir: number) => navigateWeek(dir);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isSaving = loading || isProcessing || isFixing;
    const closeConfirm = () => setConfirmDialog(prev => ({ ...prev, isOpen: false }));

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

    // eslint-disable-next-line no-unused-vars
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

    const handleQuickFillCreate = async (shifts: any[]) => {
        if (!weekData) return;
        setIsProcessing(true);
        try {
            const newShifts = shifts.map(shift => {
                const startDate = new Date(`${shift.date}T${shift.startTime}:00`);
                const endDate = new Date(`${shift.date}T${shift.endTime}:00`);
                return {
                    id: `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    shiftId: `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    riderId: shift.riderId,
                    riderName: shift.riderName,
                    motoId: shift.motoId || null,
                    motoPlate: shift.motoId ? motos.find((m: any) => m.id === shift.motoId)?.licensePlate : null,
                    startAt: toLocalISOStringWithOffset(startDate),
                    endAt: toLocalISOStringWithOffset(endDate),
                    notes: 'Creado con Relleno Rápido'
                };
            });

            const updatedShifts: Shift[] = [...(weekData.shifts || []), ...newShifts];
            const updatedWeekData: WeekData = {
                ...weekData,
                shifts: updatedShifts,
                id: currentWeekId,
                startDate: toLocalDateString(getStartOfWeek(referenceDate))
            } as WeekData;
            await WeekService.saveWeek(toFranchiseId(franchiseId), toWeekId(currentWeekId), updatedWeekData);
            updateWeekData(updatedWeekData);
            alert(`✅ ${newShifts.length} turno(s) creado(s)!`);
        } catch (error) {
            console.error("Error creating bulk shifts:", error);
            alert("Error al crear los turnos.");
        } finally {
            setIsProcessing(false);
        }
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
                    visualDate: startDay,
                    visualStart: start,
                    visualEnd: end,
                    isConfirmed: shift.isConfirmed || false,
                    changeRequested: shift.changeRequested || false,
                    changeReason: shift.changeReason || null,
                    franchiseId: shift.franchiseId,
                    isContinuation: false
                });
            } else {
                // Cross-Midnight Split
                const endOfDay = new Date(start);
                endOfDay.setHours(23, 59, 59, 999);
                pushToDay(startDay, {
                    ...shift,
                    visualDate: startDay,
                    visualStart: start,
                    visualEnd: endOfDay,
                    isConfirmed: shift.isConfirmed || false,
                    changeRequested: shift.changeRequested || false,
                    changeReason: shift.changeReason || null,
                    franchiseId: shift.franchiseId,
                    isContinuation: false
                });

                const startOfNextDay = new Date(end);
                startOfNextDay.setHours(0, 0, 0, 0);
                pushToDay(endDay, {
                    ...shift,
                    visualDate: endDay,
                    visualStart: startOfNextDay,
                    visualEnd: end,
                    isConfirmed: shift.isConfirmed || false,
                    changeRequested: shift.changeRequested || false,
                    changeReason: shift.changeReason || null,
                    franchiseId: shift.franchiseId,
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

        return sortedRiders.map(rider => ({
            ...rider,
            days: days.map(day => ({
                ...day,
                shifts: riderShiftsMap[rider.id][day.isoDate] || []
            }))
        }));
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
                            "{sheriffResult.feedback}"
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
                    <h2 className="text-lg font-black text-slate-900 flex items-center tracking-tight">
                        <span className="bg-gradient-to-r from-indigo-900 to-slate-800 bg-clip-text text-transparent mr-2">
                            {(() => {
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
                            <button onClick={onSaveAll} disabled={isSaving || readOnly} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md transition-all disabled:opacity-50 text-[10px] font-bold shadow-sm hover:shadow-md active:scale-95">
                                <Save className="w-3 h-3" />
                                {isSaving ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button
                                onClick={handleAuditoria}
                                disabled={isAuditing || isSaving}
                                className={`
                                    flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-[10px] font-bold shadow-sm hover:shadow-md active:scale-95 border
                                    ${sheriffResult ? (sheriffResult.status === 'optimal' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200') : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}
                                `}
                            >
                                {isAuditing ? <div className="animate-spin w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full" /> : <BadgeCheck className="w-3 h-3" />}
                                {sheriffResult ? `Sheriff: ${sheriffResult.score}/100` : 'Auditar Turnos'}
                            </button>
                            <button onClick={() => setIsQuickFillOpen(true)} disabled={readOnly} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md transition-all disabled:opacity-50 text-[10px] font-bold active:scale-95 shadow-sm">
                                <Zap className="w-3 h-3" />
                                Relleno Rápido
                            </button>
                            <button
                                onClick={() => setShowGenModal(true)}
                                disabled={readOnly}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border border-indigo-400/20 rounded-md transition-all disabled:opacity-50 text-[10px] font-black active:scale-95 shadow-sm hover:shadow-indigo-500/25 ml-2"
                            >
                                <Sparkles className="w-3 h-3 text-amber-200" />
                                IA Mágica
                            </button>
                        </>
                    )}
                    {isMobile && !readOnly && (
                        <button onClick={() => setIsQuickFillOpen(true)} aria-label="Auto-Rellenar" className="p-2 bg-indigo-600 text-white rounded-lg shadow-md">
                            <Zap className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

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
                                <div className="w-48 shrink-0 border-r border-slate-200 p-3 flex items-center justify-between">
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
                                        "flex border-b border-slate-100/80 items-center transition-all duration-200 group/row h-[52px]", // Fixed taller height for Pro feel
                                        rIdx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                                    )}>
                                        {/* Rider Info Side - Sticky Glass */}
                                        <div className="w-48 shrink-0 border-r border-slate-100/80 p-3 flex items-center gap-3 sticky left-0 z-30 transition-colors backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
                                            <div className="relative">
                                                <div className={cn(
                                                    "w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black border-[3px] border-white shadow-sm ring-1 ring-slate-100 transition-transform group-hover/row:scale-105",
                                                    riderColorMap.get(row.id)?.bg || 'bg-slate-200'
                                                )}>
                                                    {getRiderInitials(row.fullName)}
                                                </div>
                                                {row.status === 'active' && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex flex-col">
                                                <div className="text-xs font-bold text-slate-700 truncate group-hover/row:text-indigo-600 transition-colors">{row.fullName}</div>
                                                <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">{row.status}</div>
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
                                                                    onClick={(e) => { e.stopPropagation(); handleEditShift(ev); }}
                                                                    onDelete={handleDeleteShift}
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

            <QuickFillModal
                isOpen={isQuickFillOpen}
                onClose={() => setIsQuickFillOpen(false)}
                onRefresh={refresh}
                franchiseId={toFranchiseId(franchiseId)}
                onCreateShifts={handleQuickFillCreate as any}
                riders={riders}
                motos={motos as any}
                weekDays={days}
            />

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

            {/* Generative Scheduling Modal */}
            {showGenModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-indigo-100">
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
                                    className="w-full h-32 p-3 rounded-xl border border-slate-200 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-slate-50 placeholder:text-slate-400 focus:outline-none"
                                    autoFocus
                                />
                            </div>

                            <div className="bg-indigo-50 p-3 rounded-lg flex items-start gap-3">
                                <div className="bg-white p-1.5 rounded-full shadow-sm mt-0.5">
                                    <Wand2 className="w-4 h-4 text-indigo-600" />
                                </div>
                                <p className="text-xs text-indigo-800 leading-relaxed font-medium">
                                    La IA analizará tus riders disponibles y creará turnos óptimos respetando las reglas de descanso y cobertura.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowGenModal(false)}
                                className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold text-sm transition-colors"
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
