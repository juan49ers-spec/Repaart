import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Sun, Moon, Save, Loader2, BadgeCheck, XCircle, PenLine, Bike } from 'lucide-react'; // Cleaned imports
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
import { ShiftContextMenu } from './components/ShiftContextMenu';
import { SchedulerGuideModal } from './SchedulerGuideModal';
import ConfirmationModal from '../../components/ui/feedback/ConfirmationModal';
import { SheriffReportModal } from './SheriffReportModal';
import { Shift } from '../../schemas/scheduler';

import { useWeeklySchedule } from '../../hooks/useWeeklySchedule';
import { useAuth } from '../../context/AuthContext';
import { getRiderColor } from '../../utils/riderColors';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { format, startOfWeek, addDays, parseISO, setHours, setMinutes, differenceInMinutes, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFleetStore } from '../../store/useFleetStore';
import { useVehicleStore } from '../../store/useVehicleStore';
import { shiftService } from '../../services/shiftService';
import { notificationService } from '../../services/notificationService';




const DeliveryScheduler: React.FC<{
    franchiseId: string;
    selectedDate: Date;
    onDateChange?: (date: Date) => void;
    readOnly?: boolean;
}> = ({ franchiseId, selectedDate, onDateChange, readOnly }) => {


    const { user, impersonatedFranchiseId } = useAuth();
    // FIX: Prioritize impersonatedFranchiseId (admin mode) -> explicit franchiseId -> user.franchiseId -> user.uid
    // This ensures correct data loading when admin is viewing a franchise
    const safeFranchiseId = impersonatedFranchiseId || franchiseId || user?.franchiseId || user?.uid || '';
    const isMobile = useMediaQuery('(max-width: 768px)');

    // --- UI STATE ---
    const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
    const [showLunch, setShowLunch] = useState(false);
    const [showDinner, setShowDinner] = useState(false);
    const [showPrime, setShowPrime] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);


    // --- SHERIFF & MAGIC AI STATE ---
    const [isSheriffOpen, setIsSheriffOpen] = useState(false);
    const [sheriffData, setSheriffData] = useState<{
        score: number;
        status: 'optimal' | 'warning' | 'critical';
        feedback: string[];
        details: {
            totalHours: number;
            overtimeCount: number;
            underutilizedCount: number;
            coverageScore: number;
            costEfficiency: number;
        };
    } | null>(null);
    // Legacy state used by inline status bar display (TODO: migrate to SheriffReportModal only)
    const [sheriffResult, setSheriffResult] = useState<{
        score?: number;
        status?: string;
        feedback?: string;
        details?: {
            totalHours: number;
            overtimeCount: number;
            underutilizedCount: number;
            coverageScore: number;
            costEfficiency: number;
        };
    } | null>(null);

    // [INTERACTIVE NOTIFICATION STATE]
    const [isOvertimeConfirmOpen, setIsOvertimeConfirmOpen] = useState(false);
    const [pendingShiftParams, setPendingShiftParams] = useState<{ dateIso: string, riderId?: string, hour?: number } | null>(null);
    const [overtimeDetails, setOvertimeDetails] = useState<{ current: number, projected: number, limit: number, riderName: string } | null>(null);

    const [isGuideOpen, setIsGuideOpen] = useState(false);



    // --- DATA HOOKS ---
    const { weekData, loading, motos, riders } = useWeeklySchedule(safeFranchiseId, readOnly, selectedDate);

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
        const { dateIso, riderId, hour } = over.data.current || {};

        if (activeShift && dateIso && riderId) {
            // Calculate new start/end times
            const durationMs = new Date(activeShift.endAt).getTime() - new Date(activeShift.startAt).getTime();
            const originalStart = new Date(activeShift.startAt);
            const newStart = parseISO(dateIso);

            if (hour !== undefined) {
                // Day View Snapping
                const h = Math.floor(hour);
                const m = (hour % 1) >= 0.5 ? 30 : 0;
                newStart.setHours(h, m, 0, 0);
            } else {
                // Weekly View: Keep original minutes
                newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
            }

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
        const step = viewMode === 'day' ? 1 : 7;
        const newDate = addDays(selectedDate, direction * step);
        if (onDateChange) {
            onDateChange(newDate);
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
    const saveShift = async (shiftData: any) => {
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

        // --- REASSIGNMENT NOTIFICATIONS ---
        // If we are editing an existing shift and the rider has changed
        if (editingShift && editingShift.riderId !== shiftData.riderId) {
            const timeStr = `${format(new Date(shiftData.startAt), 'HH:mm')} - ${format(new Date(shiftData.endAt), 'HH:mm')}`;
            const dateStr = format(new Date(shiftData.startAt), 'dd/MM');

            // 1. Notify Original Rider (if it was an amber shift/change request)
            if (editingShift.changeRequested) {
                await notificationService.notifyFranchise(editingShift.riderId, {
                    title: 'Solicitud de Cambio Procesada',
                    message: `Tu solicitud para el turno del ${dateStr} (${timeStr}) ha sido aceptada y el turno reasignado.`,
                    type: 'SYSTEM',
                    priority: 'normal'
                });
            } else {
                // Regular reassignment
                await notificationService.notifyFranchise(editingShift.riderId, {
                    title: 'Turno Eliminado/Reasignado',
                    message: `El turno del ${dateStr} (${timeStr}) ha sido asignado a otro rider.`,
                    type: 'SYSTEM',
                    priority: 'normal'
                });
            }

            // 2. Notify New Rider
            await notificationService.notifyFranchise(shiftData.riderId, {
                title: 'Nuevo Turno Asignado',
                message: `Se te ha asignado un nuevo turno para el ${dateStr} de ${timeStr}.`,
                type: 'shift_confirmed',
                priority: 'high'
            });
        }

        const isNewToken = !existingId || (typeof existingId === 'string' && existingId.startsWith('draft-'));

        const finalShift = {
            ...shiftData,
            id: existingId || `draft-${crypto.randomUUID()}`,
            isDraft: true,
            isNew: isNewToken,
            changeRequested: false, // Reset change requested if reassigned or edited
            changeReason: null
        };

        setLocalShifts(prev => {
            const filtered = prev.filter(s => String(s.id) !== String(finalShift.id));
            return [...filtered, finalShift];
        });

        setIsModalOpen(false); // Ensure modal closes
    };

    const deleteShift = useCallback((shiftId: string) => {
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
    }, [readOnly]);

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

        setSheriffData({
            score,
            status: score > 90 ? 'optimal' : score > 70 ? 'warning' : 'critical',
            feedback: insights,
            details: {
                totalHours,
                overtimeCount: overtimeRiders.length,
                underutilizedCount: underRiders.length,
                coverageScore,
                costEfficiency
            }
        });
        setIsSheriffOpen(true);
    };



    const handleCreateShifts = async (shifts: Partial<any>[]) => {
        if (readOnly) return;
        setLocalShifts(prev => {
            const newShifts = [...prev];
            shifts.forEach(s => {
                // Determine ID: if it has one, use it (update), else generate draft ID
                const id = s.id || `draft-${crypto.randomUUID()}`;

                // Remove existing if any (simplistic upser logic)
                const existsIdx = newShifts.findIndex(ex => ex.id === id);
                if (existsIdx >= 0) {
                    newShifts[existsIdx] = { ...newShifts[existsIdx], ...s };
                } else {
                    newShifts.push({
                        ...s,
                        id,
                        isDraft: true,
                        isNew: true,
                        franchiseId: safeFranchiseId,
                        riderId: s.riderId!,
                        startAt: s.startAt!,
                        endAt: s.endAt!,
                        date: s.date!
                    } as any);
                }
            });
            return newShifts;
        });
        setIsQuickFillOpen(false);
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



    // --- LIQUID FLOW & DRAG AND DROP ---
    // In a full implementation, we would import DndContext here.
    // For this prototype, we simulate the 'Liquid' visuals first.

    // --- DAY VIEW HELPERS ---
    const getDayViewPosition = (minutes: number) => {
        if (!showPrime) return (minutes / 1440) * 100;

        // Prime: 12:00-16:30 (720-990) & 20:00-24:00 (1200-1440)
        // Total visible: 510 mins
        // Gap: 990-1200 (210 mins) hidden

        if (minutes < 720) return -100; // Too early
        if (minutes >= 720 && minutes <= 990) return ((minutes - 720) / 510) * 100;
        if (minutes > 990 && minutes < 1200) return (270 / 510) * 100; // In gap
        if (minutes >= 1200) return ((270 + (minutes - 1200)) / 510) * 100;
        return 100; // Too late
    };

    const dayCols = useMemo(() => {
        // 15-minute intervals: 24h * 4 = 96 slots
        const all = Array.from({ length: 96 }).map((_, i) => {
            const h = i / 4;
            const hour = Math.floor(h);
            const minute = (i % 4) * 15;
            return {
                i,
                h, // 13.0, 13.25, 13.5, 13.75
                hour,
                minute,
                isFullHour: minute === 0,
                isHalfHour: minute === 30,
            };
        });

        if (!showPrime) return all;

        // Prime: 12:00-16:30 (Indexes 48 to 66) & 20:00-24:00 (Indexes 80 to 96)
        // 12*4=48, 16.5*4=66, 20*4=80, 24*4=96
        return all.filter(s => (s.i >= 48 && s.i < 66) || (s.i >= 80 && s.i < 96));
    }, [showPrime]);



    // 1. Merge adjacent shifts into continuous blocks
    const processRiderShifts = (shifts: any[]) => {
        if (!shifts.length) return [];
        // Sort by start time
        const sorted = [...shifts].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

        const visualBlocks: any[] = [];
        let currentBlock: any = null;

        sorted.forEach((s) => {
            const sStart = new Date(s.startAt);
            new Date(s.endAt);

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

    // --- PRIME HELPERS ---
    const isFiltered = useCallback((startStr: string, endStr: string) => {
        // If no filter active, show all
        if (!showLunch && !showDinner && !showPrime) return true;

        const start = new Date(startStr);
        const end = new Date(endStr);
        // Start/End in minutes of day
        const startMin = start.getHours() * 60 + start.getMinutes();
        const endMin = end.getHours() * 60 + end.getMinutes();
        // Handle midnight wrap (simple assumption for visual filtering)
        const adjustedEndMin = endMin === 0 ? 1440 : endMin;

        // Logic: Shift must overlap with the active ranges
        // Overlap Condition: (ShiftStart < RangeEnd) AND (ShiftEnd > RangeStart)

        if (showPrime) {
            // Prime ranges: 12:00-16:30 (720-990) AND 20:00-24:00 (1200-1440)
            const p1Start = 720, p1End = 990;
            const p2Start = 1200, p2End = 1440;

            const overlapP1 = startMin < p1End && adjustedEndMin > p1Start;
            const overlapP2 = startMin < p2End && adjustedEndMin > p2Start;

            if (overlapP1 || overlapP2) return true;
        }

        let visible = false;

        if (showLunch) {
            const lStart = 720;
            const lEnd = 990;
            // Overlap: Start < RangeEnd && End > RangeStart
            if (startMin < lEnd && adjustedEndMin > lStart) visible = true;
        }

        if (showDinner && !visible) {
            const dStart = 1200;
            const dEnd = 1440;
            // Special case: If shift goes past midnight, endMin might be small, but here we assume day view context logic or shifts split at midnight.
            // If split at midnight, adjustedEndMin handle 24:00.
            if (startMin < dEnd && adjustedEndMin > dStart) visible = true;
        }

        return visible;
    }, [showLunch, showDinner, showPrime]);

    const ridersGrid = useMemo(() => {
        const activeRiders = rosterRiders.filter(r => r.status === 'active' || r.status === 'on_route');
        return activeRiders.map(rider => {
            const allRiderShifts = mergedShifts.filter(s => s.riderId === rider.id);

            // APPLY FILTERS
            const displayedShifts = allRiderShifts.filter(s => isFiltered(s.startAt, s.endAt));

            const visualBlocks = processRiderShifts(displayedShifts);

            const totalHours = displayedShifts.reduce((acc, s) => {
                const start = new Date(s.startAt);
                const end = new Date(s.endAt);
                const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                return acc + duration;
            }, 0);

            return {
                ...rider,
                totalWeeklyHours: totalHours,
                visualBlocks,
                shifts: displayedShifts
            };

        }).sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [rosterRiders, mergedShifts, isFiltered]);

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
                const realEnd = (end === 0 && sEnd.getMinutes() === 0) ? 24 : end;
                for (let h = start; h < realEnd; h++) {
                    if (h >= 0 && h < 24) res[date][h]++;
                }
            }
        });
        return res;
    }, [days, mergedShifts]);





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

    const handleDuplicateShift = useCallback((shift: Shift) => {
        const start = new Date(shift.startAt);
        const end = new Date(shift.endAt);


        // New start is same time, next day (+24h)
        const newStart = new Date(start.getTime());
        newStart.setDate(newStart.getDate() + 1);

        const newEnd = new Date(end.getTime());
        newEnd.setDate(newEnd.getDate() + 1);

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
    }, [saveShift]);

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


    const handleQuickAdd = (dateIso: string, riderId: string, hour?: number) => {
        if (readOnly) return;
        const h = hour ?? 13;
        const baseDate = parseISO(dateIso);
        const hours = Math.floor(h);
        const mins = Math.round((h % 1) * 60); // 15-min precision
        // Default 4 hour shift?
        const startAt = toLocalISOString(setMinutes(setHours(baseDate, hours), mins)) as string;
        const endAt = toLocalISOString(setMinutes(setHours(baseDate, hours + 4), mins)) as string;

        saveShift({
            riderId,
            startAt,
            endAt,
            date: dateIso
        });
    };

    const handleAddShift = (dateIso: string, riderId?: string, hour?: number) => {
        if (readOnly) return;

        // [MOD] Overtime Pre-Check (Blocking Interactive)
        if (riderId) {
            const riderStats = ridersGrid.find(r => r.id === riderId);
            if (riderStats) {
                const current = riderStats.totalWeeklyHours || 0;
                const contract = riderStats.contractHours || 40;
                const projected = current + 4; // Assume 4h default shift

                if (projected > contract) {
                    // BLOCK: Open Confirmation Modal
                    setPendingShiftParams({ dateIso, riderId, hour });
                    setOvertimeDetails({
                        current,
                        projected,
                        limit: contract,
                        riderName: riderStats.fullName
                    });
                    setIsOvertimeConfirmOpen(true);
                    return; // STOP EXECUTION
                }
            }
        }

        setEditingShift(null);
        setSelectedDateForNew(dateIso);
        setPrefillHour(hour);
        setIsModalOpen(true);
    };

    const confirmOvertimeShift = () => {
        if (!pendingShiftParams) return;
        setIsOvertimeConfirmOpen(false);
        setEditingShift(null);
        setSelectedDateForNew(pendingShiftParams.dateIso);
        setPrefillHour(pendingShiftParams.hour);
        setIsModalOpen(true);
        setPendingShiftParams(null);
    };

    const handleEditShift = (shift: any) => {
        if (readOnly) return;
        setEditingShift(shift);
        setIsModalOpen(true);
    };

    const simpleRiders = useMemo(() => rosterRiders.map(r => ({ id: r.id, fullName: r.fullName, name: r.fullName })), [rosterRiders]);

    // --- KEYBOARD SHORTCUTS & SELECTION ---
    const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

            if (e.key === 'Escape') {
                if (contextMenu) {
                    setContextMenu(null);
                    return;
                }

                const isAnyModalOpen = isModalOpen || isQuickFillOpen || isGuideOpen;
                if (!isAnyModalOpen) {
                    if (selectedShiftId) {
                        const shift = mergedShifts.find(s => String(s.id || s.shiftId) === String(selectedShiftId));
                        if (shift?.isDraft) {
                            deleteShift(String(selectedShiftId));
                            setSelectedShiftId(null);
                            return;
                        }
                        setSelectedShiftId(null);
                        return;
                    }

                    if (localShifts.length > 0) {
                        const lastDraft = localShifts[localShifts.length - 1];
                        deleteShift(String(lastDraft.id));
                        return;
                    }
                }
            }

            if (!selectedShiftId) return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                if (confirm('¿Eliminar el turno seleccionado?')) {
                    deleteShift(selectedShiftId);
                    setSelectedShiftId(null);
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                const shiftToDupe = mergedShifts.find(s => String(s.id || s.shiftId) === String(selectedShiftId));
                if (shiftToDupe) {
                    handleDuplicateShift(shiftToDupe);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedShiftId, mergedShifts, deleteShift, contextMenu, isModalOpen, isQuickFillOpen, isGuideOpen, localShifts, handleDuplicateShift]);
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
                // Apply Filters to Mobile View as well
                if (!isFiltered(s.startAt, s.endAt)) return acc;

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
                    onAutoFill={() => setIsQuickFillOpen(true)}
                    onOpenGuide={() => setIsGuideOpen(true)}
                />

                <SchedulerGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
                <QuickFillModal
                    isOpen={isQuickFillOpen}
                    onClose={() => setIsQuickFillOpen(false)}
                    franchiseId={safeFranchiseId}
                    weekDays={days}
                    riders={riders.map(r => ({ id: r.id, name: r.fullName, email: '' }))}
                    motos={motos}
                    existingShifts={mergedShifts}
                    onRefresh={() => { }}
                    onCreateShifts={handleCreateShifts}
                />

                {/* HEADER V3 (Simplified for Liquid Flow) */}
                <div className="bg-white border-b border-slate-200 shadow-sm z-30 flex-none">
                    <div className="px-6 py-3 flex items-center justify-between">
                        {/* Left: Navigation */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                <button onClick={() => changeWeek(-1)} title={viewMode === 'day' ? "Día anterior" : "Semana anterior"} aria-label={viewMode === 'day' ? "Día anterior" : "Semana anterior"} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-500"><ChevronLeft size={18} /></button>
                                <span className="px-3 text-sm font-medium text-slate-600 capitalize min-w-[140px] text-center">
                                    {format(selectedDate, viewMode === 'day' ? 'd MMMM yyyy' : 'MMMM yyyy', { locale: es })}
                                </span>
                                <button onClick={() => changeWeek(1)} title={viewMode === 'day' ? "Día siguiente" : "Siguiente semana"} aria-label={viewMode === 'day' ? "Día siguiente" : "Siguiente semana"} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-500"><ChevronRight size={18} /></button>
                            </div>

                            <div className="h-6 w-px bg-slate-200 mx-2" />

                            {/* View Toggles */}
                            <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                <button onClick={() => setViewMode('day')} className={cn("px-4 py-1.5 text-xs font-medium uppercase rounded-md transition-all", viewMode === 'day' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}>Día</button>
                                <button onClick={() => setViewMode('week')} className={cn("px-4 py-1.5 text-xs font-medium uppercase rounded-md transition-all", viewMode === 'week' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}>Semana</button>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2">
                            {viewMode === 'day' && (
                                <button
                                    onClick={() => {
                                        const next = !showPrime;
                                        setShowPrime(next);
                                        if (next) {
                                            setShowLunch(true);
                                            setShowDinner(true);
                                        }
                                    }}
                                    title="Modo PRIME: Resalta horas punta y muestra todos los turnos"
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-normal rounded-lg border flex items-center gap-2 transition-all tracking-wide uppercase",
                                        showPrime ? "bg-indigo-600 border-indigo-700 text-white shadow-lg scale-105" : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
                                    )}
                                >
                                    <BadgeCheck size={14} className={showPrime ? "text-amber-400" : ""} />
                                    <span>PRIME</span>
                                </button>
                            )}

                            <button
                                onClick={() => setShowLunch(!showLunch)}
                                title="Filtrar Turno Mediodía (12:00 - 16:30)"
                                className={cn(
                                    "px-3 py-1.5 text-xs font-normal rounded-lg border flex items-center gap-1.5 transition-all text-slate-500",
                                    showLunch ? "bg-amber-100 border-amber-300 text-amber-700 shadow-sm" : "bg-white border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                <Sun size={16} className={showLunch ? "fill-amber-500 text-amber-600" : ""} />
                                <span className="hidden sm:inline">Mediodía</span>
                            </button>

                            <button
                                onClick={() => setShowDinner(!showDinner)}
                                title="Filtrar Turno Noche (20:00 - 24:00)"
                                className={cn(
                                    "px-3 py-1.5 text-xs font-normal rounded-lg border flex items-center gap-1.5 transition-all text-slate-500",
                                    showDinner ? "bg-indigo-100 border-indigo-300 text-indigo-700 shadow-sm" : "bg-white border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                <Moon size={16} className={showDinner ? "fill-indigo-500 text-indigo-600" : ""} />
                                <span className="hidden sm:inline">Noche</span>
                            </button>

                            <div className="h-6 w-px bg-slate-200 mx-1" />

                            <button
                                onClick={handleAuditoria}
                                className={cn("px-3 py-1.5 text-xs font-normal rounded-lg border flex items-center gap-1.5 transition-all",
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
                                    className="ml-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-medium rounded-lg shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                                >
                                    {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    PUBLICAR
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* SHERIFF OVERLAY REUSED (REPORT 2.0) */}
                {sheriffResult && (
                    <div className="absolute top-[80px] right-6 z-50 w-96 animate-in slide-in-from-right-10 fade-in duration-300 pointer-events-auto filter drop-shadow-2xl">
                        <div className={cn(
                            "rounded-2xl shadow-2xl border backdrop-blur-xl overflow-hidden flex flex-col",
                            sheriffResult.status === 'optimal'
                                ? 'bg-emerald-50/95 border-emerald-200'
                                : 'bg-white/95 border-amber-200'
                        )}>
                            {/* Header */}
                            <div className={cn(
                                "p-4 flex justify-between items-start border-b",
                                sheriffResult.status === 'optimal' ? "bg-emerald-100/50 border-emerald-200" : "bg-amber-100/50 border-amber-200"
                            )}>
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm text-xl font-black border",
                                        sheriffResult.status === 'optimal'
                                            ? "bg-emerald-500 text-white border-emerald-600"
                                            : "bg-amber-400 text-amber-900 border-amber-500"
                                    )}>
                                        {sheriffResult.score}
                                    </div>
                                    <div>
                                        <h3 className={cn("font-black text-sm uppercase tracking-wider", sheriffResult.status === 'optimal' ? "text-emerald-900" : "text-amber-900")}>
                                            Reporte Sheriff
                                        </h3>
                                        <p className="text-[10px] font-medium opacity-80">
                                            {sheriffResult.status === 'optimal' ? "Operativa Aprobada" : "Atención Requerida"}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setSheriffResult(null)} className="p-1 hover:bg-black/5 rounded-full transition-colors">
                                    <XCircle size={20} className="opacity-40 hover:opacity-100" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-5 space-y-4">
                                {/* Feedback Text */}
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 text-xs font-medium leading-relaxed">
                                    {sheriffResult.feedback}
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-100 flex flex-col items-center">
                                        <span className="text-lg font-black text-rose-600">{sheriffResult.details?.overtimeCount || 0}</span>
                                        <span className="text-[9px] font-bold text-rose-400 uppercase tracking-tight">Overtime</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 flex flex-col items-center">
                                        <span className="text-lg font-black text-emerald-600">{sheriffResult.details?.underutilizedCount || 0}</span>
                                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tight">Libres</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 flex flex-col items-center">
                                        <span className="text-lg font-black text-indigo-600">{Math.round(sheriffResult.details?.totalHours || 0)}h</span>
                                        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-tight">Total</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-2">
                                    <button
                                        onClick={() => setSheriffResult(null)}
                                        className="w-full py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                                    >
                                        Entendido, gracias sheriff
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. DYNAMIC FLEX GRID CONTAINER (SCROLLABLE X, FIXED Y) */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden bg-white relative flex flex-col min-h-0">

                    {/* HEADER - Floating Glass Effect */}
                    <div className="flex-none flex w-full border-b border-indigo-100 bg-white/95 backdrop-blur-sm z-30 h-10 shadow-sm min-w-[1000px] lg:min-w-[900px] xl:min-w-[1000px]">
                        {/* CORNER (Riders Label) */}
                        <div className="w-48 lg:w-40 xl:w-48 flex-none border-r border-slate-200 bg-slate-50/80 backdrop-blur-sm flex items-center px-4">
                            <span className="text-xs uppercase font-medium tracking-widest text-slate-400">Riders</span>
                        </div>

                        {/* COLUMNS */}
                        <div className="flex-1 flex min-w-0">
                            {viewMode === 'week' ? (
                                days.map((d) => {
                                    const isHighVolume = ['vie', 'sáb', 'dom', 'fri', 'sat', 'sun'].some(day => d.shortLabel.toLowerCase().includes(day));
                                    return (
                                        <div key={d.isoDate} className={cn(
                                            "flex-1 border-r border-slate-200 flex items-center justify-center gap-1 min-w-0 last:border-r-0 relative overflow-hidden",
                                            isHighVolume ? "bg-indigo-50/40" : ""
                                        )}>
                                            {isHighVolume && (
                                                <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-bl-full z-10 opacity-80" title="Volumen Alto" />
                                            )}
                                            <span className={cn("text-xs font-medium uppercase tracking-wide truncate", isToday(d.dateObj) ? "text-indigo-600" : (isHighVolume ? "text-slate-700 font-medium" : "text-slate-400"))}>{d.shortLabel}</span>
                                            <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-xs font-normal shrink-0", isToday(d.dateObj) ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400")}>
                                                {format(d.dateObj, 'd')}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex-1 flex relative">
                                    {/* Timeline Header Day View */}
                                    {/* Timeline Header Day View */}
                                    {dayCols.map((slot) => {
                                        // Minimalist: No Zebra logic needed

                                        return (
                                            <div key={slot.i} className={cn(
                                                "flex-1 flex items-end justify-start pb-1 pl-1 relative group overflow-visible h-full border-l",
                                                // Border Hierarchy (Header)
                                                slot.isFullHour ? "border-slate-200" :
                                                    slot.isHalfHour ? "border-slate-100 border-dashed" : "border-slate-50 border-dotted",
                                                // Minimalist: No Zebra
                                                "bg-white",
                                            )}>
                                                {/* Prime bg */}
                                                {!showPrime && ((slot.h >= 12 && slot.h < 16.5) || (slot.h >= 20 && slot.h < 24)) && (
                                                    <div className="absolute inset-0 -z-10 bg-amber-50/30" />
                                                )}

                                                {/* Label - Clean, Floating Number, Vertically Centered - Indigo Tone */}
                                                {slot.isFullHour && (
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center z-20 pointer-events-none">
                                                        <span className="text-[10px] font-semibold text-indigo-400/90 tracking-wide px-1">
                                                            {slot.h}:00
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BODY (ROWS) */}
                    <div className="flex-1 flex flex-col min-h-0 bg-white relative overflow-y-auto min-w-[1000px] lg:min-w-[900px] xl:min-w-[1000px]">
                        {/* RED LINE INDICATOR REMOVED */}

                        {ridersGrid.map((rider, index) => (
                            <div
                                key={rider.id}
                                className={cn(
                                    // Row Container
                                    "flex-1 flex w-full border-b border-indigo-50 transition-all duration-200 group relative",
                                    // Zebra for sidebar is handled in inner div. Grid cells cover the rest. 
                                    // row-hover effect is handled by group-hover in children or overlays?
                                    // Let's add an overlay for hover to ensure it's visible across everything
                                    "hover:z-20 overflow-visible"
                                )}
                                style={{ minHeight: '64px' }} // Expanded Vertical Mode
                            >
                                {/* Hover Overlay Guide for the whole row */}
                                <div className="absolute inset-0 pointer-events-none bg-indigo-50/0 group-hover:bg-indigo-50/30 transition-colors z-20 border-y border-transparent group-hover:border-indigo-200/50" />

                                {/* Horizontal Divider Line - Separates Midday from Night - Keeping it subtle */}
                                <div className="absolute top-1/2 left-0 w-full h-px bg-slate-100 z-0 pointer-events-none border-t border-dashed border-slate-200/50" />

                                {/* RIDER META (LEFT COL) - Compact */}
                                <div className={cn(
                                    "w-48 lg:w-40 xl:w-48 flex-none border-r border-slate-200 flex items-center px-4 py-1 relative transition-colors z-10",
                                    index % 2 === 0 ? "bg-white group-hover:bg-indigo-50/30" : "bg-indigo-50/30 group-hover:bg-indigo-50/30"
                                )}>
                                    <div className="flex items-center gap-3 w-full">
                                        {/* Avatar */}
                                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium text-white shadow-sm shrink-0 ring-1 ring-white/50 transition-transform group-hover:scale-105", getRiderColor(rider.id).bg)}>
                                            {getRiderInitials(rider.fullName)}
                                        </div>

                                        {/* Info */}
                                        <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                                            <p className="text-sm font-normal text-slate-700 truncate group-hover:text-indigo-700 transition-colors">{rider.fullName}</p>

                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/50 whitespace-nowrap flex items-center gap-1">
                                                    <PenLine size={12} className="text-slate-400" /> <span className="font-normal text-slate-600">{rider.contractHours || 40}h</span>
                                                </span>
                                                <span className={cn(
                                                    "text-[10px] font-normal px-2 py-0.5 rounded-full border whitespace-nowrap flex items-center gap-1 transition-colors",
                                                    (rider.totalWeeklyHours || 0) > (rider.contractHours || 40)
                                                        ? "bg-rose-50 text-rose-600 border-rose-200" // Red: Overtime
                                                        : ((rider.contractHours || 40) - (rider.totalWeeklyHours || 0)) > 5
                                                            ? "bg-emerald-50 text-emerald-600 border-emerald-200" // Green: Underutilized (>5h left)
                                                            : "bg-amber-50 text-amber-600 border-amber-200" // Amber: Optimal (Within 5h)
                                                )}>
                                                    <Bike size={12} /> <span className="font-normal">{(rider.totalWeeklyHours || 0).toFixed(1)}h</span>
                                                </span>
                                            </div>
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
                                                    onQuickAdd={(h) => handleQuickAdd(d.isoDate, rider.id, h)}

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
                                        <div className="w-full h-full relative">
                                            {/* Grid BGs (48 slots for 30m granularity) */}
                                            <div className="absolute inset-0 flex pointer-events-none">
                                                {dayCols.map((slot) => {
                                                    const isFullHO = slot.isFullHour;

                                                    return (
                                                        <DroppableCell
                                                            key={slot.i}
                                                            dateIso={toLocalDateString(selectedDate)}
                                                            riderId={rider.id}
                                                            onQuickAdd={(qh) => handleQuickAdd(toLocalDateString(selectedDate), rider.id, qh)}
                                                            onDoubleClick={() => handleAddShift(toLocalDateString(selectedDate), rider.id, slot.h)}
                                                            isToday={isToday(selectedDate)}
                                                            className={cn(
                                                                "flex-1 h-full transition-all duration-300 min-w-0 border-l",
                                                                // Borders: Clean Slate Hierarchy
                                                                isFullHO ? "border-slate-200" :
                                                                    slot.isHalfHour ? "border-slate-100 border-dashed" : "border-slate-50 border-dotted",
                                                                // Minimalist: No Zebra stripes
                                                                "bg-white",
                                                                // Prime Highlight
                                                                ((slot.h >= 12 && slot.h < 16) || (slot.h >= 20 && slot.h < 24))
                                                                    ? (showPrime ? "bg-amber-100/10" : "bg-amber-50/10")
                                                                    : ""
                                                            )}
                                                            hour={slot.h}
                                                        />
                                                    );
                                                })}    </div>
                                            {/* Shifts Layer */}
                                            <div className="relative w-full h-full z-10 pointer-events-none">
                                                {rider.shifts.filter((s: any) => toLocalDateString(new Date(s.startAt)) === toLocalDateString(selectedDate)).map((shift: any) => {
                                                    const start = new Date(shift.startAt);
                                                    const end = new Date(shift.endAt);
                                                    const startMin = start.getHours() * 60 + start.getMinutes();
                                                    const durationMin = differenceInMinutes(end, start);
                                                    const leftPct = getDayViewPosition(startMin);
                                                    const widthPct = getDayViewPosition(startMin + durationMin) - leftPct;

                                                    // Hide if completely out of view
                                                    if (widthPct <= 0 || leftPct >= 100 || (leftPct + widthPct) <= 0) return null;

                                                    return (
                                                        <div
                                                            key={shift.id}
                                                            // Interactive "Pop & Glow" effects - Tighter constraints for Compact Mode
                                                            className="absolute top-[2px] bottom-[2px] z-20 hover:z-50 transition-all duration-200 ease-out rounded-md overflow-hidden shadow-sm hover:shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.02] hover:brightness-105 cursor-pointer ring-0 hover:ring-1 hover:ring-white/50"
                                                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                                        >
                                                            <DraggableShift
                                                                shift={shift}
                                                                gridId={`shift-${shift.id}-day`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedShiftId(shift.id);
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
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>



                    {/* FOOTER: Coverage Aligned with Grid */}
                    <div className="bg-white border-t border-slate-200 flex items-stretch shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.02)] z-30 min-h-[40px] flex-none min-w-[1000px] lg:min-w-[900px] xl:min-w-[1000px]">
                        {/* LEFT COL: Matches Rider Column Width (w-56) */}
                        <div className="w-48 lg:w-40 xl:w-48 flex-none flex items-center px-4 border-r border-slate-200 bg-slate-50/50">
                            <span className="text-xs font-normal text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500" /> Riders / Turno
                            </span>
                        </div>

                        {/* RIGHT COLS: Match Day Columns */}
                        <div className="flex-1 flex min-w-0">
                            {days.map(d => {
                                const counts = coverage[d.isoDate] || Array(24).fill(0);
                                const noonCount = counts[14] || 0;
                                const nightCount = counts[21] || 0;

                                return (
                                    <div key={d.isoDate} className="flex-1 border-r border-slate-100 last:border-r-0 flex justify-center items-center py-2">
                                        <div className="flex items-center gap-4 opacity-100">
                                            {/* Mediodía */}
                                            <div className="flex items-center gap-1.5" title="Mediodía (14:00)">
                                                <Sun className="w-5 h-5 text-amber-500" />
                                                <span className="text-sm font-normal text-slate-600 w-5 text-center">{noonCount}</span>
                                            </div>

                                            <div className="w-px h-4 bg-slate-200" />

                                            {/* Noche */}
                                            <div className="flex items-center gap-1.5" title="Noche (21:00)">
                                                <Moon className="w-5 h-5 text-indigo-500" />
                                                <span className="text-sm font-normal text-slate-600 w-5 text-center">{nightCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
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
                            motos={vehicles.map(v => ({ id: (v.id || 'none') as string, licensePlate: (v.plate || '') as string, model: (v.model || '') as string }))}
                            existingShifts={mergedShifts}
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
                {createPortal(
                    <DragOverlay dropAnimation={null}>
                        {activeDragShift ? (
                            <DraggableShift
                                shift={activeDragShift}
                                gridId="overlay-shift"
                                isOverlay
                            />
                        ) : null}
                    </DragOverlay>,
                    document.body
                )}

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

                {/* OVERTIME CONFIRMATION MODAL (INTERACTIVE) */}
                <ConfirmationModal
                    isOpen={isOvertimeConfirmOpen}
                    onClose={() => {
                        setIsOvertimeConfirmOpen(false);
                        setPendingShiftParams(null);
                    }}
                    onConfirm={confirmOvertimeShift}
                    title="⚠️ Alerta de Overtime"
                    message={
                        overtimeDetails ? (
                            <div className="space-y-2 text-sm text-slate-600">
                                <p>
                                    El rider <span className="font-bold text-slate-900">{overtimeDetails.riderName}</span> ya acumula <span className="font-bold">{overtimeDetails.current.toFixed(1)}h</span>.
                                </p>
                                <p>
                                    Con este turno, pasará a <span className="font-bold text-rose-600">{overtimeDetails.projected.toFixed(1)}h</span>, superando su límite de contrato ({overtimeDetails.limit}h).
                                </p>
                                <p className="pt-2 italic text-xs">
                                    ¿Deseas aplicar una excepción de manager y proceder?
                                </p>
                            </div>
                        ) : "Rider en overtime."
                    }
                    confirmText="Sí, crear igualmente"
                    cancelText="Cancelar"
                    variant="warning"
                />

            </DndContext>
            {/* OVERTIME CONFIRMATION MODAL (INTERACTIVE) */}
            <ConfirmationModal
                isOpen={isOvertimeConfirmOpen}
                onClose={() => {
                    setIsOvertimeConfirmOpen(false);
                    setPendingShiftParams(null);
                }}
                onConfirm={confirmOvertimeShift}
                title="⚠️ Alerta de Overtime"
                message={
                    overtimeDetails ? (
                        <div className="space-y-2 text-sm text-slate-600">
                            <p>
                                El rider <span className="font-bold text-slate-900">{overtimeDetails.riderName}</span> ya acumula <span className="font-bold">{overtimeDetails.current.toFixed(1)}h</span>.
                            </p>
                            <p>
                                Con este turno, pasará a <span className="font-bold text-rose-600">{overtimeDetails.projected.toFixed(1)}h</span>, superando su límite de contrato ({overtimeDetails.limit}h).
                            </p>
                            <p className="pt-2 italic text-xs">
                                ¿Deseas aplicar una excepción de manager y proceder?
                            </p>
                        </div>
                    ) : "Rider en overtime."
                }
                confirmText="Sí, crear igualmente"
                cancelText="Cancelar"
                variant="warning"
            />

            {/* SHERIFF REPORT MODAL (AUDIT 3.0) */}
            <SheriffReportModal
                isOpen={isSheriffOpen}
                onClose={() => setIsSheriffOpen(false)}
                data={sheriffData}
            />
        </div >
    );
};


export default DeliveryScheduler;
