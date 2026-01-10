import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Save, Zap, Filter } from 'lucide-react';
import ShiftModal from './ShiftModal';
import ShiftCard from './ShiftCard';
import QuickFillModal from './QuickFillModal';

import { findMotoConflict, findRiderConflict } from '../../utils/schedulerValidation';
import { toLocalISOStringWithOffset, toLocalDateString, getStartOfWeek } from '../../utils/dateUtils';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import MobileAgendaView from './MobileAgendaView';
import { useWeeklySchedule, getWeekIdFromDate, type Shift, type WeekData } from '../../hooks/useWeeklySchedule';
import { WeekService } from '../../services/scheduler/weekService';
import { toFranchiseId, toWeekId } from '../../schemas/scheduler';
import { calculateDayLayout } from '../../utils/eventLayout';
import ConfirmationModal from '../../ui/feedback/ConfirmationModal';
import { getRiderColorMap } from '../../utils/riderColors';
import { useWeather } from '../../hooks/useWeather';
import { getWeatherIcon } from '../../utils/weather';
import { useAuth } from '../../context/AuthContext';
import { validateWeeklySchedule, generateScheduleFix, generateFullSchedule } from '../../lib/gemini';
import { BadgeCheck, AlertTriangle, ShieldCheck, XCircle, Wand2, Sparkles, Trophy, Calendar, CloudRain } from 'lucide-react';
import { useOperationsIntel, intelService } from '../../services/intelService';

// --- PREMIUM UI UTILS ---
const TeamLogo: React.FC<{ src?: string, name?: string, size?: number }> = ({ src, name = '?', size = 24 }) => {
    const [error, setError] = useState(false);
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    if (!src || error) {
        return (
            <div
                style={{ width: size, height: size }}
                className="rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center border border-white/20 shadow-inner"
            >
                <span className="text-[10px] font-black text-white/90 tracking-tighter">{initials}</span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={name}
            style={{ width: size, height: size }}
            className="object-contain drop-shadow-md rounded-full bg-white/10 p-0.5"
            onError={() => setError(true)}
        />
    );
};

const getDayDemandLevel = (dayDate: string, dayIntel: any[]) => {
    const hasCritical = dayIntel.some(e => e.severity === 'critical');
    const hasWarning = dayIntel.some(e => e.severity === 'warning');
    const dayOfWeek = new Date(dayDate).getDay(); // 0: Sun, 5: Fri, 6: Sat

    // Friday to Sunday are naturally "warning" (Medium) unless "critical" exists
    if (hasCritical) return 'critical';
    if (hasWarning || [0, 5, 6].includes(dayOfWeek)) return 'warning';
    return 'normal';
};

const getDayStyling = (level: string, isToday: boolean, isWeekend: boolean) => {
    const base = `relative px-2 py-3 transition-all duration-300 hover:z-30 group/dayhead border-r h-full flex flex-col justify-between cursor-default hover:scale-[1.01] hover:shadow-2xl hover:shadow-slate-200/50`;
    const weekendBorder = isWeekend ? 'border-r-4 border-slate-300' : 'border-slate-100';

    const colors = {
        critical: 'bg-rose-500/[0.04] border-l-rose-500/20',
        warning: 'bg-amber-500/[0.04] border-l-amber-500/20',
        normal: 'bg-emerald-500/[0.02] border-l-emerald-500/10'
    };

    const outLine = {
        critical: 'ring-1 ring-inset ring-rose-500/30',
        warning: 'ring-1 ring-inset ring-amber-500/30',
        normal: 'ring-1 ring-inset ring-emerald-500/20'
    };

    const focusStyles = `group-hover/daygrid:opacity-60 hover:!opacity-100 hover:backdrop-saturate-[1.8] hover:backdrop-blur-2xl`;

    return `${base} ${weekendBorder} ${isToday ? 'bg-indigo-50/60 shadow-inner' : colors[level as keyof typeof colors]} ${outLine[level as keyof typeof outLine]} ${focusStyles}`;
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
    layout?: any;
}

interface ShiftEvent extends VisualEvent {
    // Ensuring it has all properties needed by ShiftCard/Layout
    riderId: string;
    riderName: string;
}

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
        updateWeekData
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
    const { daily: weatherDaily } = useWeather(franchiseId || user?.uid, 'users');

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
    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
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

    const handleCloneShift = async (shift: Shift, e: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            setIsProcessing(true);
            const clonedShift = {
                ...shift,
                shiftId: `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                id: `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            const currentShifts = weekData?.shifts || [];
            const updatedShifts = [...currentShifts, clonedShift];
            const updatedWeekData: WeekData = {
                status: 'draft',
                metrics: { totalHours: 0, activeRiders: 0, motosInUse: 0 },
                ...(weekData || {}),
                shifts: updatedShifts,
                id: currentWeekId,
                startDate: toLocalDateString(getStartOfWeek(referenceDate))
            } as WeekData;
            await WeekService.saveWeek(toFranchiseId(franchiseId), toWeekId(currentWeekId), updatedWeekData);
            updateWeekData(updatedWeekData);
        } catch (error) {
            console.error("Error cloning shift:", error);
            alert("Error al duplicar turno.");
        } finally {
            setIsProcessing(false);
        }
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
                    isContinuation: false
                });

                const startOfNextDay = new Date(end);
                startOfNextDay.setHours(0, 0, 0, 0);
                pushToDay(endDay, {
                    ...shift,
                    visualDate: endDay,
                    visualStart: startOfNextDay,
                    visualEnd: end,
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
                <div className="flex-1 overflow-auto bg-slate-50 relative">
                    {isMobile ? (
                        // --- MOBILE VIEW ---
                        <div className="flex-1 overflow-auto bg-slate-50 relative pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
                            <div className="p-4">
                                <MobileAgendaView
                                    days={days}
                                    // Optimized: Pass dictionary directly for O(1) access
                                    visualEvents={visualEvents}
                                    intelByDay={intelByDay}
                                    onEditShift={handleEditShift}
                                    onDeleteShift={handleDeleteShift}
                                    onAddShift={handleOpenNew}
                                />
                            </div>
                        </div>
                    ) : (
                        // --- DESKTOP VIEW ---
                        <div className="min-w-[1000px] h-full flex flex-col bg-white/40 border-l border-white/20">
                            {/* Days Header */}
                            <div className="grid grid-cols-7 border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-20 shadow-sm pl-9 group/daygrid">
                                {days.map((day, i) => {
                                    const isToday = new Date().toISOString().split('T')[0] === day.isoDate;
                                    const dayIntel = intelByDay[day.isoDate] || [];
                                    const demandLevel = getDayDemandLevel(day.isoDate, dayIntel);
                                    const dayDate = new Date(day.isoDate);
                                    const isWeekend = [0, 5, 6].includes(dayDate.getDay());

                                    return (
                                        <div key={i} className={getDayStyling(demandLevel, isToday, isWeekend)}>
                                            {/* Accent Top Border for Events */}
                                            {demandLevel === 'critical' && (
                                                <>
                                                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)] z-10" />
                                                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500/[0.03] via-transparent to-rose-500/[0.05] opacity-50 animate-pulse pointer-events-none" />
                                                </>
                                            )}
                                            {demandLevel === 'warning' && <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 z-10" />}
                                            {demandLevel === 'normal' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500/40 z-10" />}

                                            <div className="flex flex-col gap-2 relative z-0">
                                                <div className="flex items-center justify-between gap-1 w-full">
                                                    <div className="flex items-baseline gap-1.5 min-w-0">
                                                        <div className={`text-[10px] font-semibold uppercase tracking-[0.15em] truncate ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                            {day.label.split(' ')[0]}
                                                        </div>
                                                        <div className={`text-2xl font-bold tracking-tight leading-none ${isToday ? 'text-indigo-700 drop-shadow-sm' : 'text-slate-800'}`}>
                                                            {day.label.split(' ')[1]}
                                                        </div>
                                                    </div>

                                                    {/* Weather Forecast Mini-Pill (Always visible if available) */}
                                                    {weatherDaily && (
                                                        <div className="opacity-60 group-hover/dayhead:opacity-100 transition-opacity flex items-center gap-1 bg-white/40 px-1.5 py-0.5 rounded-lg border border-white/40 shadow-sm shrink-0">
                                                            {(() => {
                                                                const idx = weatherDaily.time.findIndex((t: string) => t === day.isoDate);
                                                                if (idx !== -1) {
                                                                    const max = Math.round(weatherDaily.temperature_2m_max[idx]);
                                                                    const code = weatherDaily.weathercode[idx];
                                                                    return (
                                                                        <>
                                                                            <div className="scale-100">{getWeatherIcon(code, "w-4 h-4")}</div>
                                                                            <span className="text-[10px] font-black text-slate-500">{max}°</span>
                                                                        </>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* High-Impact Intel Badges */}
                                                <div className="flex flex-col gap-2">
                                                    {dayIntel.map((event) => {
                                                        const isMatch = event.type === 'match';
                                                        const isLive = event.metadata?.isLive;

                                                        return (
                                                            <div
                                                                key={event.id}
                                                                className={`
                                                                    flex flex-col gap-1.5 p-2 rounded-2xl border backdrop-blur-xl transition-all hover:scale-[1.03] cursor-help relative group/badge overflow-hidden
                                                                    shadow-[0_4px_12px_rgba(0,0,0,0.03),0_1px_2px_rgba(0,0,0,0.02)]
                                                                    hover:shadow-[0_8px_20px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.03)]
                                                                    ${event.severity === 'critical' ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 ring-1 ring-rose-500/10' :
                                                                        event.severity === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 ring-1 ring-amber-500/10' :
                                                                            'bg-indigo-500/5 border-indigo-500/20 text-indigo-800 ring-1 ring-indigo-500/5'}
                                                                `}
                                                                title={`${event.title}: ${event.impact}`}
                                                            >
                                                                {/* Live Pulse Glow */}
                                                                {isLive && (
                                                                    <div className="absolute inset-0 bg-rose-500/5 animate-pulse pointer-events-none" />
                                                                )}

                                                                {isMatch ? (
                                                                    <div className="flex flex-col gap-2 relative z-10">
                                                                        <div className="flex items-center justify-between gap-2 bg-white/40 p-1 rounded-xl border border-white/20">
                                                                            <TeamLogo src={event.metadata?.teamLogo} name={event.metadata?.team} size={28} />
                                                                            <div className="flex flex-col items-center gap-0.5">
                                                                                <span className="text-[8px] font-black text-slate-400 font-mono leading-none">VS</span>
                                                                                {isLive && (
                                                                                    <div className="flex flex-col items-center">
                                                                                        <span className="text-[9px] font-black text-rose-600 animate-pulse">{event.metadata?.score?.home} - {event.metadata?.score?.away}</span>
                                                                                        <span className="text-[7px] font-bold text-rose-500/70">{event.metadata?.minute}'</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <TeamLogo src={event.metadata?.opponentLogo} name={event.metadata?.opponent} size={28} />
                                                                        </div>
                                                                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-tighter px-0.5">
                                                                            <span className="flex items-center gap-1 opacity-70">
                                                                                <Trophy size={9} />
                                                                                {event.subtitle?.includes('Champions') ? 'UCL' : 'Liga'}
                                                                            </span>
                                                                            <span className="bg-slate-950/80 text-white px-1.5 py-0.5 rounded-lg text-[8px] shadow-sm">
                                                                                {event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-2.5 relative z-10">
                                                                        <div className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center shadow-sm border border-white">
                                                                            {event.type === 'weather' ? <CloudRain size={12} className="text-slate-600" /> : <Calendar size={12} className="text-slate-600" />}
                                                                        </div>
                                                                        <span className="text-[10px] font-black leading-tight truncate pr-1">{event.title}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Scrollable Timeline Area (Fixed CSS) */}
                            <div className="flex-1 overflow-y-auto relative no-scrollbar bg-slate-50/30">
                                {/* Current Time Indicator Line (if functional requirement, strictly visual here) */}

                                {/* Time Lines */}
                                <div className="absolute inset-0 pointer-events-none z-0">
                                    {(() => {
                                        // Filtrar horas según modo
                                        const hoursToShow = viewMode === 'prime'
                                            ? hours.filter(h => {
                                                const hourNum = parseInt(h);
                                                return (hourNum >= 12 && hourNum <= 15) || (hourNum >= 19 && hourNum <= 23);
                                            })
                                            : hours;

                                        return hoursToShow.map((hour, i) => {
                                            const hourNum = parseInt(hour);
                                            const isPrimeComida = hourNum >= 12 && hourNum <= 15;
                                            const isPrimeCena = hourNum >= 19 && hourNum <= 23;
                                            const isPrimeBlock = isPrimeComida || isPrimeCena;

                                            // En modo prime, recalcular posición para que sea contiguo
                                            const topPos = viewMode === 'prime'
                                                ? i * 60 // Posiciones consecutivas
                                                : hourNum * 60; // Posiciones absolutas

                                            return (
                                                <div key={i} className={`absolute w-full flex items-start group ${isPrimeBlock
                                                    ? 'border-t border-amber-200/40 bg-gradient-to-r from-amber-50/50 to-transparent'
                                                    : 'border-t border-slate-100/60'
                                                    }`} style={{ top: `${topPos}px`, height: '60px' } as React.CSSProperties}>

                                                    {/* Hour Label */}
                                                    <div className="flex flex-col pl-2 pt-2 w-9 shrink-0 items-center relative">
                                                        <span className={`text-[10px] font-bold tracking-tighter ${isPrimeBlock ? 'text-amber-600' : 'text-slate-300'
                                                            }`}>{hour}</span>

                                                        {/* Professional Vertical Indicators */}
                                                        {isPrimeComida && hourNum === 12 && (
                                                            <div className="absolute top-8 left-2 flex flex-col items-center gap-1 opacity-70">
                                                                <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">
                                                                    COMIDA
                                                                </span>
                                                                <div className="w-0.5 h-6 bg-amber-300/50 rounded-full" />
                                                            </div>
                                                        )}
                                                        {isPrimeCena && hourNum === 19 && (
                                                            <div className="absolute top-8 left-2 flex flex-col items-center gap-1 opacity-70">
                                                                <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">
                                                                    CENA
                                                                </span>
                                                                <div className="w-0.5 h-6 bg-amber-300/50 rounded-full" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Subtle Block Divider for Prime */}
                                                    {isPrimeBlock && (
                                                        <div className="absolute inset-0 border-l border-amber-100/30 pointer-events-none" />
                                                    )}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>

                                {/* Columns Container */}
                                <div className={`grid grid-cols-7 relative z-10 pl-9 ${viewMode === 'prime' ? 'h-[540px]' : 'h-[1440px]'}`}>
                                    {days.map((day, colIndex) => {
                                        // O(1) Lookup - No more .filter()
                                        const dayEvents = visualEvents[day.isoDate] || [];
                                        // Improved: Min card width 80px triggers Deck Mode earlier (smart stacking)
                                        const layoutEvents = calculateDayLayout(dayEvents as any[], 140, 80);
                                        const isToday = new Date().toISOString().split('T')[0] === day.isoDate;

                                        return (
                                            <div
                                                key={colIndex}
                                                className={`relative border-r border-slate-200/60 last:border-r-0 h-full group transition-colors ${isToday ? 'bg-indigo-50/10 ring-inset ring-2 ring-indigo-500/10' : 'hover:bg-indigo-50/10'}`}
                                                onClick={(e) => handleColumnClick(e, day.isoDate)}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={(e) => handleDrop(e, day)}
                                            >
                                                {!readOnly && (
                                                    <div className="hidden group-hover:flex items-center justify-center absolute w-full h-12 bg-indigo-50/40 border-y border-indigo-100 pointer-events-none z-0 backdrop-blur-[2px] top-0 shadow-sm">
                                                        <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                                            Añadir Turno
                                                        </span>
                                                    </div>
                                                )}

                                                {layoutEvents.map((ev: any) => {
                                                    const style = ev.layout;
                                                    const shiftEvent = ev as ShiftEvent;

                                                    // Calcular posición ajustada para modo Prime
                                                    let adjustedTop = style.top;
                                                    if (viewMode === 'prime' && shiftEvent.visualStart) {
                                                        const startHour = shiftEvent.visualStart.getHours();
                                                        const startMinutes = shiftEvent.visualStart.getMinutes();

                                                        // Mapear horas Prime a posiciones consecutivas
                                                        if (startHour >= 12 && startHour <= 15) {
                                                            // Comida: 12-15 → posiciones 0-3 (0-240px)
                                                            adjustedTop = (startHour - 12) * 60 + startMinutes;
                                                        } else if (startHour >= 19 && startHour <= 23) {
                                                            // Cena: 19-23 → posiciones 4-8 (240-540px)
                                                            adjustedTop = ((startHour - 19) + 4) * 60 + startMinutes;
                                                        } else {
                                                            // Turno fuera de Prime (ocultar)
                                                            adjustedTop = -9999;
                                                        }
                                                    }

                                                    return (
                                                        <div
                                                            key={ev.id + (ev.isContinuation ? '-c' : '')}
                                                            className={`absolute transition-all duration-300 pr-0.5 pl-0.5 ${style.isDeck ? 'hover:z-50' : 'hover:z-50'}`}
                                                            style={{
                                                                top: `${adjustedTop}px`,
                                                                height: `${style.height}px`,
                                                                left: style.left,
                                                                width: style.width,
                                                                zIndex: style.zIndex
                                                            } as React.CSSProperties}
                                                        >
                                                            <div className="h-full w-full relative drop-shadow-sm hover:drop-shadow-md transition-shadow">
                                                                <ShiftCard
                                                                    event={shiftEvent as any}
                                                                    onClick={(e) => { e.stopPropagation(); handleEditShift(shiftEvent); }}
                                                                    onClone={(ev: any, e: any) => handleCloneShift(ev as Shift, e)}
                                                                    onDelete={handleDeleteShift}
                                                                    readOnly={readOnly}
                                                                    style={{ height: '100%' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <QuickFillModal
                isOpen={isQuickFillOpen}
                onClose={() => setIsQuickFillOpen(false)}
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
