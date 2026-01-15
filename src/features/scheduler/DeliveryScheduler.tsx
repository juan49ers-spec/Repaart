import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Zap, Save, Loader2, BadgeCheck, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getRiderInitials } from '../../utils/colorPalette';
import { toLocalDateString, toLocalISOString, toLocalISOStringWithOffset } from '../../utils/dateUtils';
import ShiftModal from '../../features/operations/ShiftModal';
import QuickFillModal from '../../features/operations/QuickFillModal';
import MobileAgendaView from '../../features/operations/MobileAgendaView';
import { SchedulerStatusBar } from './SchedulerStatusBar';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter, DragStartEvent } from '@dnd-kit/core';
import { DraggableShift } from './DraggableShift';
import { DroppableCell } from './DroppableCell';
import { ShiftContextMenu } from '../../components/ui/ShiftContextMenu';
import { SchedulerGuideModal } from './SchedulerGuideModal';

import { useWeeklySchedule } from '../../hooks/useWeeklySchedule';
import { useAuth } from '../../context/AuthContext';
import { getRiderColor } from '../../utils/riderColors';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { format, startOfWeek, addDays, parseISO, setHours, differenceInMinutes, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFleetStore } from '../../store/useFleetStore';
import { useVehicleStore } from '../../store/useVehicleStore';
import { shiftService } from '../../services/shiftService';
import { notificationService } from '../../services/notificationService';
import { validateWeeklySchedule, generateScheduleFix } from '../../lib/gemini';



const DeliveryScheduler: React.FC<{
    franchiseId: string;
    selectedDate: Date;
    onDateChange?: (date: Date) => void;
    readOnly?: boolean;
}> = ({ franchiseId, selectedDate, onDateChange, readOnly }) => {


    const { user } = useAuth();
    const safeFranchiseId = franchiseId || user?.uid || '';
    const isMobile = useMediaQuery('(max-width: 768px)');

    // --- UI STATE ---
    const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
    const [showPrime, setShowPrime] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // --- SHERIFF & MAGIC AI STATE ---
    const [sheriffResult, setSheriffResult] = useState<{
        score: number;
        status: 'optimal' | 'warning' | 'critical';
        feedback: string;
        missingCoverage: string[];
    } | null>(null);
    const [isAuditing, setIsAuditing] = useState(false);
    const [isFixing, setIsFixing] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    // Update time every minute for the Red Line
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // --- DATA HOOKS ---
    const {
        weekData,
        loading,
        navigateWeek,
        motos
    } = useWeeklySchedule(safeFranchiseId, readOnly, selectedDate);

    // --- DND SENSORS ---
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Prevent accidental drags
            },
        })
    );
    const [activeDragShift, setActiveDragShift] = useState<any | null>(null);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveDragShift(active.data.current?.shift);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragShift(null);

        if (!over) return;
        if (readOnly) return;

        const activeShift = active.data.current?.shift;
        const { dateIso, riderId } = over.data.current || {};

        if (activeShift && dateIso && riderId) {
            // Check if user moved to a different cell
            const oldDateIso = toLocalDateString(new Date(activeShift.startAt));
            const oldRiderId = activeShift.riderId;

            if (oldDateIso === dateIso && oldRiderId === riderId) {
                return; // No change
            }

            // Calculate new start/end times keeping duration
            const durationMs = new Date(activeShift.endAt).getTime() - new Date(activeShift.startAt).getTime();
            const originalStart = new Date(activeShift.startAt);
            const newStart = parseISO(dateIso);
            newStart.setHours(originalStart.getHours(), originalStart.getMinutes());

            const newEnd = new Date(newStart.getTime() + durationMs);

            // Create updated draft shift
            saveShift({
                ...activeShift,
                riderId: riderId,
                startAt: toLocalISOString(newStart),
                endAt: toLocalISOString(newEnd),
                date: dateIso
            });
        }
    };

    const changeWeek = (direction: number) => {
        if (onDateChange) {
            const newDate = addDays(selectedDate, direction * 7);
            onDateChange(newDate);
        } else {
            navigateWeek(direction);
        }
    };

    // --- DRAFT MODE STATE ---
    const [localShifts, setLocalShifts] = useState<any[]>([]);
    const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
    const hasUnsavedChanges = localShifts.length > 0 || deletedIds.size > 0;

    // --- STORES ---
    const { riders: rosterRiders, fetchRiders } = useFleetStore();
    const { vehicles, fetchVehicles } = useVehicleStore();

    useEffect(() => {
        if (safeFranchiseId) {
            fetchRiders(safeFranchiseId);
            fetchVehicles(safeFranchiseId);
        }
    }, [fetchRiders, fetchVehicles, safeFranchiseId]);

    // --- ACTIONS ---
    const saveShift = (shiftData: any) => {
        if (readOnly) {
            alert("Modo solo lectura: No se pueden guardar cambios.");
            return;
        }

        // VALIDATION: Check for Overlaps
        const newStart = new Date(shiftData.startAt).getTime();
        const newEnd = new Date(shiftData.endAt).getTime();
        const existingId = shiftData.id || shiftData.shiftId;

        // Check local + remote (mergedShifts covers both)
        const hasOverlap = mergedShifts.some(existing => {
            if (existing.riderId !== shiftData.riderId) return false; // Different rider

            // Exclude itself (if updating)
            const existId = existing.id || existing.shiftId;
            if (String(existId) === String(existingId)) return false;

            const exStart = new Date(existing.startAt).getTime();
            const exEnd = new Date(existing.endAt).getTime();

            // Overlap condition: StartA < EndB && EndA > StartB
            return (newStart < exEnd && newEnd > exStart);
        });

        if (hasOverlap) {
            alert("❌ COLISIÓN DETECTADA: Este rider ya tiene un turno asignado en ese horario. No se puede solapar.");
            return;
        }

        const isNewToken = !existingId || (typeof existingId === 'string' && existingId.startsWith('draft-'));

        const finalShift = {
            ...shiftData,
            id: existingId || `draft-${crypto.randomUUID()}`,
            isDraft: true,
            isNew: isNewToken
        };

        setLocalShifts(prev => {
            const filtered = prev.filter(s => String(s.id) !== String(finalShift.id));
            return [...filtered, finalShift];
        });
    };

    const deleteShift = (shiftId: string) => {
        if (readOnly) {
            alert("Modo solo lectura: No se pueden borrar turnos.");
            return;
        }
        const shiftIdStr = String(shiftId);
        if (shiftIdStr.startsWith('draft-')) {
            setLocalShifts(prev => prev.filter(s => String(s.id) !== shiftIdStr));
        } else {
            setDeletedIds(prev => {
                const newSet = new Set(prev);
                newSet.add(shiftIdStr);
                return newSet;
            });
            setLocalShifts(prev => prev.filter(s => String(s.id) !== shiftIdStr));
        }
    };

    const handlePublish = async () => {
        if (!safeFranchiseId || isPublishing || readOnly) return;
        setIsPublishing(true);
        try {
            for (const id of deletedIds) {
                await shiftService.deleteShift(id);
            }
            for (const s of localShifts) {
                const inputData = {
                    franchiseId: safeFranchiseId,
                    riderId: s.riderId,
                    riderName: s.riderName || rosterRiders.find(r => r.id === s.riderId)?.fullName || 'Rider',
                    motoId: s.motoId || null,
                    motoPlate: s.motoPlate || '',
                    startAt: s.startAt,
                    endAt: s.endAt
                };

                const isTrulyNew = (typeof s.id === 'string' && s.id.startsWith('draft-')) || !weekData?.shifts?.some(rs => rs.id === s.id);

                if (isTrulyNew) {
                    await shiftService.createShift(inputData);
                } else {
                    await shiftService.updateShift(s.id, inputData);
                }
            }

            // Notify Admin about the published schedule
            try {
                await notificationService.notify(
                    'SCHEDULE_PUBLISHED',
                    safeFranchiseId,
                    'Franquicia', // idealmente obtener el nombre real
                    {
                        title: 'Horario Publicado',
                        message: `La franquicia ha publicado su horario para la semana.`,
                        priority: 'normal',
                        metadata: { franchiseId: safeFranchiseId }
                    }
                );
                console.log("NOTIFICACIÓN DE PUBLICACIÓN ENVIADA");
            } catch (err) {
                console.warn("Error enviando notificación", err);
            }

            setLocalShifts([]);
            setDeletedIds(new Set());
            // alert("✅ Calendario publicado exitosamente.");
        } catch (error: any) {
            console.error(error);
            alert("Error al publicar.");
        } finally {
            setIsPublishing(false);
        }
    };

    // --- SHERIFF & AI LOGIC ---
    const handleAuditoria = async () => {
        // Audit merged shifts (remote + local drafts)
        if (!mergedShifts || mergedShifts.length === 0) {
            alert("El cuadrante está vacío. Añade turnos antes de auditar.");
            return;
        }
        setIsAuditing(true);
        setSheriffResult(null);
        try {
            const result = await validateWeeklySchedule(mergedShifts);
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

    const handleAutoFix = async () => {
        if (!sheriffResult || !weekData) return;

        setIsFixing(true);
        try {
            const fixResult = await generateScheduleFix(
                mergedShifts || [],
                rosterRiders || [],
                sheriffResult.missingCoverage
            );

            if (fixResult && fixResult.newShifts.length > 0) {
                const confirmed = window.confirm(
                    `El Sheriff sugiere ${fixResult.newShifts.length} nuevos turnos:\n\n` +
                    fixResult.explanation +
                    `\n\n¿Aplicar cambios ahora (como borradores)?`
                );

                if (confirmed) {
                    const newDrafts = fixResult.newShifts.map(s => {
                        const startD = new Date(s.startDay);
                        startD.setHours(s.startHour, 0, 0, 0);
                        const endD = new Date(startD);
                        endD.setHours(s.startHour + s.duration, 0, 0, 0);

                        return {
                            id: `draft-fix-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                            shiftId: `draft-fix-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                            riderId: s.riderId,
                            riderName: rosterRiders.find(r => r.id === s.riderId)?.fullName || 'Rider',
                            motoId: null,
                            motoPlate: null,
                            startAt: toLocalISOStringWithOffset(startD),
                            endAt: toLocalISOStringWithOffset(endD),
                            isDraft: true,
                            isNew: true
                        };
                    });

                    setLocalShifts(prev => [...prev, ...newDrafts]);

                    // Re-audit automatically
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

    // --- EVENT SIMULATION ---
    const days = useMemo(() => {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        return Array.from({ length: 7 }).map((_, i) => {
            const date = addDays(start, i);
            return {
                date,
                dateObj: date,
                isoDate: toLocalDateString(date),
                label: format(date, 'EEEE d', { locale: es }),
                shortLabel: format(date, 'EEE', { locale: es })
            };
        });
    }, [selectedDate]);

    // --- GRID CALCULATION ---
    const mergedShifts = useMemo(() => {
        const remote = weekData?.shifts || [];
        const liveRemote = remote.filter(s => !deletedIds.has(String(s.id || s.shiftId)));
        return [...liveRemote, ...localShifts];
    }, [weekData?.shifts, localShifts, deletedIds]);

    const ridersGrid = useMemo(() => {
        const ridersMap = new Map();
        rosterRiders.forEach(r => {
            if (r.status === 'active' || r.status === 'on_route') {
                ridersMap.set(r.id, {
                    id: r.id,
                    fullName: r.fullName,
                    shifts: [],
                    contractHours: r.contractHours || 40
                });
            }
        });

        mergedShifts.forEach(s => {
            const rid = s.riderId;
            if (ridersMap.has(rid)) {
                ridersMap.get(rid).shifts.push(s);
            }
        });

        return Array.from(ridersMap.values()).map(rider => {
            const totalHours = rider.shifts.reduce((acc: number, s: any) => {
                return acc + (differenceInMinutes(new Date(s.endAt), new Date(s.startAt))) / 60;
            }, 0);
            return { ...rider, totalWeeklyHours: totalHours };
        }).sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [mergedShifts, rosterRiders]);

    // --- LIQUID FLOW & DRAG AND DROP ---
    // In a full implementation, we would import DndContext here.
    // For this prototype, we simulate the 'Liquid' visuals first.

    // 1. Merge adjacent shifts into continuous blocks
    const processRiderShifts = (shifts: any[]) => {
        if (!shifts.length) return [];
        // Sort by start time
        const sorted = [...shifts].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

        const visualBlocks: any[] = [];
        let currentBlock: any = null;

        sorted.forEach((s) => {
            const sStart = new Date(s.startAt);
            const sEnd = new Date(s.endAt);

            // Check adjacency (gap < 15 mins counts as continuous)
            if (currentBlock &&
                Math.abs(differenceInMinutes(sStart, new Date(currentBlock.endAt))) < 15) {
                // Merge visual
                currentBlock.endAt = s.endAt;
                currentBlock.ids.push(s.id);
                currentBlock.shifts.push(s);
            } else {
                if (currentBlock) visualBlocks.push(currentBlock);
                currentBlock = {
                    startAt: s.startAt,
                    endAt: s.endAt,
                    ids: [s.id],
                    shifts: [s],
                    type: s.isConfirmed ? 'confirmed' : s.changeRequested ? 'request' : 'draft',
                    isNew: s.isNew
                };
            }
        });
        if (currentBlock) visualBlocks.push(currentBlock);
        return visualBlocks;
    };

    // 2. Real-time Cost Calculation (Simulation)
    const totalWeeklyCost = useMemo(() => {
        return ridersGrid.reduce((total, rider) => {
            // Approx 12€/hour cost + 30% social security simulated
            return total + (rider.totalWeeklyHours * 12 * 1.30);
        }, 0);
    }, [ridersGrid]);

    const totalHours = ridersGrid.reduce((acc, r) => acc + r.totalWeeklyHours, 0);

    const coverage = useMemo(() => {
        const res: Record<string, number[]> = {};
        days.forEach(d => res[d.isoDate] = Array(24).fill(0));
        mergedShifts.forEach(s => {
            const date = toLocalDateString(new Date(s.startAt));
            if (res[date]) {
                const sStart = new Date(s.startAt);
                const sEnd = new Date(s.endAt);
                const start = sStart.getHours();
                const end = sEnd.getHours();
                const endM = sEnd.getMinutes();
                const realEnd = (end === 0 && endM === 0) ? 24 : end;
                for (let h = start; h < realEnd; h++) {
                    if (h >= 0 && h < 24) res[date][h]++;
                }
            }
        });
        return res;
    }, [days, mergedShifts]);

    // --- TIME INDICATOR CALC ---
    const viewingToday = isToday(selectedDate);
    const redLinePosition = viewingToday ? (currentTime.getHours() * 60 + currentTime.getMinutes()) / 1440 * 100 : null;


    // --- SELECTION & KEYBOARD SHORTCUTS ---
    const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

    // Clear selection when clicking outside (handled by a global click listener or background click)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedShiftId) return;

            // Ignore if typing in an input
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                if (confirm('¿Eliminar el turno seleccionado?')) {
                    deleteShift(selectedShiftId);
                    setSelectedShiftId(null);
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                const shiftToDupe = mergedShifts.find(s => (s.id || s.shiftId) === selectedShiftId);
                if (shiftToDupe) {
                    handleDuplicateShift(shiftToDupe);
                }
            }

            if (e.key === 'Escape') {
                setSelectedShiftId(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedShiftId, mergedShifts, deleteShift]); // Dependencies for closure


    // --- CONTEXT MENU STATE ---
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, shift: any } | null>(null);

    const handleContextMenu = (e: React.MouseEvent, shift: any) => {
        e.preventDefault(); // Prevent native browser menu
        const sId = shift.id || shift.shiftId;
        setSelectedShiftId(sId); // Also select on right click
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            shift
        });
    };

    const handleDuplicateShift = (shift: any) => {
        const start = new Date(shift.startAt);
        const end = new Date(shift.endAt);
        const durationMs = end.getTime() - start.getTime();

        // New start is old end (contiguous)
        const newStart = new Date(end.getTime());
        const newEnd = new Date(newStart.getTime() + durationMs);

        // Prepare new shift data
        const newShiftData = {
            ...shift,
            id: undefined, // Force new ID
            shiftId: undefined,
            startAt: toLocalISOStringWithOffset(newStart),
            endAt: toLocalISOStringWithOffset(newEnd),
            // Reset status flags
            isConfirmed: false,
            changeRequested: false,
            isDraft: true
        };

        saveShift(newShiftData);
    };

    const handleValidateShift = (shift: any) => {
        // Just save it with confirmed flag - simplified for now
        // In a real app this might need a specific API endpoint or status field update
        const updatedShift = {
            ...shift,
            isConfirmed: true,
            isDraft: false // Usually validating means it's no longer draft if it was
        };
        saveShift(updatedShift);
    };

    // --- RENDER HELPERS ---
    // Pass handleContextMenu to DraggableShift via a wrapper or prop if possible.
    // Since DraggableShift is inside the map, we need to attach the handler there.

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<any | null>(null);
    const [selectedDateForNew, setSelectedDateForNew] = useState<string | null>(null);
    const [prefillHour, setPrefillHour] = useState<number | undefined>(undefined);
    const [isQuickFillOpen, setIsQuickFillOpen] = useState(false);

    // PRIME Filter Logic
    const hours = useMemo(() => {
        const fullDay = Array.from({ length: 24 }, (_, i) => i);
        if (!showPrime) return fullDay;
        return fullDay.filter(h => (h >= 13 && h < 16) || (h >= 20 && h < 24));
    }, [showPrime]);

    const handleQuickAdd = (dateIso: string, riderId: string, hour?: number) => {
        if (readOnly) return;
        const h = hour ?? 13;
        const baseDate = parseISO(dateIso);
        saveShift({
            riderId,
            startAt: toLocalISOString(setHours(baseDate, h)),
            endAt: toLocalISOString(setHours(baseDate, h + 4)),
            date: dateIso
        });
    };

    const handleAddShift = (dateIso: string, _riderId?: string, hour?: number) => {
        if (readOnly) return;
        setEditingShift(null);
        setSelectedDateForNew(dateIso);
        setPrefillHour(hour);
        setIsModalOpen(true);
    };

    const handleEditShift = (shift: any) => {
        if (readOnly) return;
        setEditingShift(shift);
        setIsModalOpen(true);
    };

    const simpleRiders = useMemo(() => rosterRiders.map(r => ({ id: r.id, fullName: r.fullName, name: r.fullName })), [rosterRiders]);

    if (loading) return <div className="p-8 text-center animate-pulse text-slate-400 font-medium h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
            <span>Cargando Matrix V3...</span>
        </div>
    </div>;

    if (isMobile) {
        return <MobileAgendaView
            days={days}
            visualEvents={mergedShifts.reduce((acc: any, s: any) => {
                const d = toLocalDateString(new Date(s.startAt));
                if (!acc[d]) acc[d] = [];
                acc[d].push({ ...s, visualStart: s.startAt, visualEnd: s.endAt, shiftId: s.id || s.shiftId });
                return acc;
            }, {})}
            onEditShift={handleEditShift}
            onDeleteShift={deleteShift}
            onAddShift={handleAddShift}
        />;
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden font-sans">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >

                {/* 1. STATUS BAR (Real-time Insights) */}
                <SchedulerStatusBar
                    totalCost={totalWeeklyCost}
                    hoursCount={totalHours}
                    sheriffScore={sheriffResult?.score || null}
                    hasChanges={false} // TODO: Track changes
                    onAutoFill={handleAutoFix}
                    onOpenGuide={() => setIsGuideOpen(true)}
                />

                <SchedulerGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

                {/* HEADER V3 (Simplified for Liquid Flow) */}
                <div className="bg-white border-b border-slate-200 shadow-sm z-30 flex-none">
                    <div className="px-6 py-3 flex items-center justify-between">
                        {/* Left: Navigation */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                <button onClick={() => changeWeek(-1)} title="Semana anterior" aria-label="Semana anterior" className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-500"><ChevronLeft size={16} /></button>
                                <span className="px-3 text-sm font-bold text-slate-700 capitalize min-w-[120px] text-center">
                                    {format(selectedDate, viewMode === 'day' ? 'd MMMM yyyy' : 'MMMM yyyy', { locale: es })}
                                </span>
                                <button onClick={() => changeWeek(1)} title="Siguiente semana" aria-label="Siguiente semana" className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-500"><ChevronRight size={16} /></button>
                            </div>

                            <div className="h-6 w-px bg-slate-200 mx-2" />

                            {/* View Toggles */}
                            <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                <button onClick={() => setViewMode('day')} className={cn("px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all", viewMode === 'day' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}>Día</button>
                                <button onClick={() => setViewMode('week')} className={cn("px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all", viewMode === 'week' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}>Semana</button>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-3">
                            <button onClick={() => setShowPrime(!showPrime)} className={cn("px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-2 transition-all", showPrime ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-white border-slate-200 text-slate-500")}>
                                <Zap size={14} className={showPrime ? "fill-amber-500" : ""} /> PRIME
                            </button>

                            <button
                                onClick={handleAuditoria}
                                className={cn("px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-2 transition-all",
                                    sheriffResult
                                        ? (sheriffResult.status === 'optimal' ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-amber-50 border-amber-200 text-amber-600")
                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                <BadgeCheck size={14} />
                                {sheriffResult ? `Sheriff: ${sheriffResult.score}` : "Auditar"}
                            </button>

                            {hasUnsavedChanges && (
                                <button
                                    onClick={handlePublish}
                                    disabled={isPublishing}
                                    className="ml-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-2"
                                >
                                    {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    PUBLICAR
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* SHERIFF OVERLAY REUSED */}
                {sheriffResult && (
                    <div className="absolute top-[130px] right-6 z-50 w-80 animate-in slide-in-from-right-10 fade-in duration-300 pointer-events-auto">
                        <div className={`
                        p-4 rounded-xl shadow-2xl border backdrop-blur-md
                        ${sheriffResult.status === 'optimal'
                                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900'
                                : 'bg-amber-50/95 border-amber-200 text-amber-900'
                            }
                    `}>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-black text-xs uppercase tracking-wider">Reporte Operativo</h3>
                                <button onClick={() => setSheriffResult(null)} title="Cerrar reporte" aria-label="Cerrar"><XCircle size={16} className="opacity-50" /></button>
                            </div>
                            <p className="text-xs font-medium mb-3">{sheriffResult.feedback}</p>
                        </div>
                    </div>
                )}

                {/* 2. DYNAMIC FLEX GRID CONTAINER (NO SCROLL) */}
                <div className="flex-1 overflow-hidden bg-white relative flex flex-col min-h-0">

                    {/* HEADER */}
                    <div className="flex-none flex w-full border-b border-slate-200 bg-slate-50/80 z-20 h-9">
                        {/* CORNER (Riders Label) */}
                        <div className="w-56 flex-none border-r border-slate-200 bg-slate-50/80 backdrop-blur-sm flex items-center px-4">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Riders</span>
                        </div>

                        {/* COLUMNS */}
                        <div className="flex-1 flex min-w-0">
                            {viewMode === 'week' ? (
                                days.map((d) => (
                                    <div key={d.isoDate} className="flex-1 border-r border-slate-200 flex items-center justify-center gap-1.5 min-w-0 last:border-r-0">
                                        <span className={cn("text-[10px] font-bold uppercase tracking-wider truncate", isToday(d.dateObj) ? "text-indigo-600" : "text-slate-500")}>{d.shortLabel}</span>
                                        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0", isToday(d.dateObj) ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500")}>
                                            {format(d.dateObj, 'd')}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex-1 flex relative">
                                    {/* Timeline Header Day View */}
                                    {Array.from({ length: 24 }).map((_, h) => (
                                        <div key={h} className="flex-1 border-r border-slate-200 flex items-end justify-center pb-0.5 relative group last:border-r-0">
                                            {((h >= 12 && h < 16) || (h >= 20 && h < 24)) && (
                                                <div className="absolute inset-0 bg-amber-50/50 -z-10" />
                                            )}
                                            <span className="text-[9px] font-medium text-slate-400 group-hover:text-slate-600">{h}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BODY (ROWS) */}
                    <div className="flex-1 flex flex-col min-h-0 bg-white relative">
                        {/* RED LINE INDICATOR (Absolute over the entire grid) */}
                        {viewMode === 'day' && redLinePosition !== null && (
                            <div
                                className="absolute top-0 bottom-0 w-px bg-rose-500 z-50 pointer-events-none shadow-[0_0_8px_1px_rgba(244,63,94,0.4)]"
                                style={{ left: `calc(14rem + ((100% - 14rem) * ${redLinePosition / 100}))` }} // 14rem is w-56
                            >
                                <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-rose-500" />
                            </div>
                        )}

                        {ridersGrid.map((rider, index) => (
                            <div
                                key={rider.id}
                                className={cn(
                                    "flex-1 flex w-full border-b border-slate-200 transition-colors group relative min-h-0",
                                    index % 2 === 0 ? "bg-white" : "bg-slate-50/40", // Zebra striping
                                    "hover:bg-indigo-50/10"
                                )}
                                style={{ minHeight: '32px' }} // Fallback min constraint
                            >
                                {/* RIDER META (LEFT COL) */}
                                <div className={cn(
                                    "w-56 flex-none border-r border-slate-200 flex items-center px-4 relative transition-colors z-10",
                                    index % 2 === 0 ? "bg-white" : "bg-slate-50/40",
                                    "group-hover:bg-slate-50/50"
                                )}>
                                    <div className="flex items-center gap-2 w-full">
                                        {/* Avatar */}
                                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0", getRiderColor(rider.id).bg)}>
                                            {getRiderInitials(rider.fullName)}
                                        </div>

                                        {/* Info */}
                                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                                            <p className="text-xs font-bold text-slate-700 truncate">{rider.fullName}</p>

                                            {/* Micro-meter */}
                                            {(() => {
                                                const current = rider.totalWeeklyHours;
                                                const max = rider.contractHours || 40;
                                                const ratio = current / max;
                                                const isOver = ratio > 1;
                                                const isUnder = ratio < 0.8;

                                                return (
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={cn("h-full rounded-full transition-all duration-500",
                                                                    isOver ? "bg-rose-500" : isUnder ? "bg-amber-400" : "bg-emerald-500"
                                                                )}
                                                                style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className={cn("text-[9px] font-bold w-8 text-right",
                                                            isOver ? "text-rose-600" : isUnder ? "text-amber-600" : "text-emerald-600"
                                                        )}>
                                                            {current.toFixed(0)}h
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                {/* SCHEDULE COLS (RIGHT) */}
                                <div className="flex-1 flex min-w-0 relative">
                                    {viewMode === 'week' ? (
                                        days.map(d => {
                                            const dayShifts = rider.shifts.filter((s: any) => toLocalDateString(new Date(s.startAt)) === d.isoDate);
                                            const visualBlocks = processRiderShifts(dayShifts);
                                            const isCurrentDay = d.isoDate === toLocalDateString(new Date());

                                            return (
                                                <DroppableCell
                                                    key={d.isoDate}
                                                    dateIso={d.isoDate}
                                                    riderId={rider.id}
                                                    isToday={isCurrentDay}
                                                    onQuickAdd={() => handleQuickAdd(d.isoDate, rider.id)}
                                                    onDoubleClick={() => handleAddShift(d.isoDate, rider.id)}
                                                    activeDragShift={activeDragShift}
                                                    className={cn(
                                                        "flex-1 border-r border-slate-200 last:border-r-0 relative p-0.5 min-w-0 h-full",
                                                        isCurrentDay ? "bg-indigo-50/5" : ""
                                                    )}
                                                >
                                                    <div className="w-full h-full flex flex-col justify-center gap-0.5">
                                                        {visualBlocks.map((block, idx) => {
                                                            const primaryShift = block.shifts[0];
                                                            // Calculate dynamic height if multiple shifts stack?
                                                            // For "Fit to Screen", ideally we don't stack many.
                                                            // We'll let them flex equally inside the cell.

                                                            return (
                                                                <div key={block.ids[0]} className="w-full relative group/shift flex-1 min-h-0">
                                                                    <DraggableShift
                                                                        shift={primaryShift}
                                                                        gridId={`shift-${primaryShift.id}-${idx}`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedShiftId(primaryShift.id);
                                                                        }}
                                                                        onDoubleClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleEditShift(primaryShift);
                                                                        }}
                                                                        onContextMenu={(e) => { e.preventDefault(); handleContextMenu(e, primaryShift); }}
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </DroppableCell>
                                            );
                                        })
                                    ) : (
                                        // DAY VIEW ROW
                                        <DroppableCell
                                            dateIso={toLocalDateString(selectedDate)}
                                            riderId={rider.id}
                                            isToday={isToday(selectedDate)}
                                            onQuickAdd={() => { }}
                                            onDoubleClick={() => handleAddShift(toLocalDateString(selectedDate), rider.id)}
                                            className="w-full h-full relative"
                                        >
                                            {/* Grid BGs */}
                                            <div className="absolute inset-0 flex pointer-events-none">
                                                {Array.from({ length: 24 }).map((_, h) => (
                                                    <div key={h} className={cn("flex-1 border-r border-slate-50 last:border-r-0 h-full",
                                                        ((h >= 13 && h < 16) || (h >= 20 && h < 24)) ? "bg-amber-50/20" : ""
                                                    )} />
                                                ))}
                                            </div>

                                            {/* Shifts Layer */}
                                            <div className="relative w-full h-full z-10">
                                                {rider.shifts.filter((s: any) => toLocalDateString(new Date(s.startAt)) === toLocalDateString(selectedDate)).map((shift: any) => {
                                                    const start = new Date(shift.startAt);
                                                    const end = new Date(shift.endAt);
                                                    const startMin = start.getHours() * 60 + start.getMinutes();
                                                    const durationMin = differenceInMinutes(end, start);
                                                    const leftPct = (startMin / 1440) * 100;
                                                    const widthPct = (durationMin / 1440) * 100;

                                                    return (
                                                        <div
                                                            key={shift.id}
                                                            className="absolute top-[10%] bottom-[10%] z-20 hover:z-30 transition-all rounded-md overflow-hidden shadow-sm hover:shadow-md"
                                                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                                        >
                                                            <DraggableShift
                                                                shift={shift}
                                                                gridId={`day-${shift.id}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedShiftId(shift.id); // Ensure day view also handles selection
                                                                }}
                                                                onDoubleClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEditShift(shift);
                                                                }}
                                                                onContextMenu={(e) => { e.preventDefault(); handleContextMenu(e, shift); }}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </DroppableCell>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                </div>

                <div className="bg-white border-t border-slate-100 px-8 py-2 flex items-center gap-8 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.02)] z-30 min-h-[40px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Cobertura Mínima
                    </span>
                    <div className="flex-1 flex gap-3">
                        {days.map(d => {
                            const min = Math.min(...(coverage[d.isoDate] || []));
                            return (
                                <div key={d.isoDate} className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden relative group/foot transition-all hover:h-2.5">
                                    <div className={cn("h-full transition-all duration-700", min < 4 ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]")} style={{ width: `${Math.min((min / 4) * 100, 100)}%` }} />
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1.5 rounded-xl opacity-0 group-hover/foot:opacity-100 pointer-events-none transition-all scale-95 group-hover/foot:scale-100 shadow-xl whitespace-nowrap">
                                        <span className="font-bold">{min}/4</span> riders activos en {d.shortLabel}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {
                    isModalOpen && (
                        <ShiftModal
                            isOpen={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                            onSave={saveShift}
                            onDelete={deleteShift}
                            initialData={editingShift}
                            selectedDate={selectedDateForNew || toLocalDateString(selectedDate)}
                            prefillHour={prefillHour}
                            riders={simpleRiders}
                            motos={vehicles.map(v => ({ id: (v.id || 'none') as string, licensePlate: (v.matricula || '') as string, model: (v.modelo || '') as string }))}
                        />
                    )
                }

                {
                    isQuickFillOpen && (
                        <QuickFillModal
                            isOpen={isQuickFillOpen}
                            onClose={() => setIsQuickFillOpen(false)}
                            onRefresh={() => { }}
                            franchiseId={safeFranchiseId}
                            riders={simpleRiders}
                            motos={motos}
                            weekDays={days}
                            existingShifts={mergedShifts}
                        />
                    )
                }

                {
                    hasUnsavedChanges && (
                        <div className="fixed bottom-28 right-10 z-[60] animate-in zoom-in-95 slide-in-from-bottom-5">
                            <button
                                onClick={handlePublish}
                                disabled={isPublishing}
                                className="flex items-center gap-4 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 ring-8 ring-indigo-50"
                            >
                                {isPublishing ? <Loader2 size={24} className="animate-spin" /> : <Save size={20} />}
                                <div className="flex flex-col items-start leading-tight">
                                    <span className="text-sm">Publicar Horario</span>
                                    <span className="text-[10px] opacity-70 italic">{localShifts.length + deletedIds.size} cambios pendientes</span>
                                </div>
                            </button>
                        </div>
                    )
                }
                <DragOverlay>
                    {activeDragShift ? (
                        <div className="w-full flex-1">
                            <DraggableShift
                                shift={activeDragShift}
                                gridId="overlay-item"
                                isOverlay
                            />
                        </div>
                    ) : null}
                </DragOverlay>

                {/* CONTEXT MENU */}
                {contextMenu && (
                    <ShiftContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        shift={contextMenu.shift}
                        onClose={() => setContextMenu(null)}
                        onValidate={() => handleValidateShift(contextMenu.shift)}
                        onDuplicate={() => handleDuplicateShift(contextMenu.shift)}
                        onEdit={() => handleEditShift(contextMenu.shift)}
                        onDelete={() => deleteShift(contextMenu.shift.id)}
                    />
                )}

            </DndContext>
        </div >
    );
};

export default DeliveryScheduler;
