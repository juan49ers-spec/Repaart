import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Sun, Moon, Save, Loader2, BadgeCheck, XCircle, PenLine, Bike } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getRiderInitials } from '../../utils/colorPalette';
import { toLocalDateString, toLocalISOString, toLocalISOStringWithOffset } from '../../utils/dateUtils';
import ShiftModal from '../../features/operations/ShiftModal';
import QuickFillModal from '../../features/operations/QuickFillModal';
import MobileAgendaView from '../../features/operations/MobileAgendaView';
import { ShiftEvent } from '../../features/operations/ShiftCard';
import { SchedulerStatusBar } from './SchedulerStatusBar';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter, DragStartEvent } from '@dnd-kit/core';
import { DraggableShift } from './DraggableShift';
import { DroppableCell } from './DroppableCell';
import { ShiftContextMenu, ContextMenuShift } from './components/ShiftContextMenu';
import { SchedulerGuideModal } from './SchedulerGuideModal';
import ConfirmationModal from '../../components/ui/feedback/ConfirmationModal';
import { SheriffReportModal } from './SheriffReportModal';
import { RecurringShiftModal } from './components/RecurringShiftModal';
import { Shift } from '../../schemas/scheduler';
import { ShiftInput } from '../../services/shiftService';

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


    const { user, impersonatedFranchiseId, roleConfig } = useAuth();
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
    const [riderSearchQuery, setRiderSearchQuery] = useState('');
    const [compactMode, setCompactMode] = useState(false);

    // --- DRAFT MODE STATE ---
    const [localShifts, setLocalShifts] = useState<Shift[]>([]);
    const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
    const hasUnsavedChanges = localShifts.length > 0 || deletedIds.size > 0;

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
    const [sheriffResult, setSheriffResult] = useState<{
        score?: number;
        status?: 'optimal' | 'warning' | 'critical';
        feedback?: string[];
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<Shift | null>(null);

    // --- WEEK TEMPLATES STATE ---
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [templateMode, setTemplateMode] = useState<'save' | 'load'>('save');
    const [templateName, setTemplateName] = useState('');
    const [templateType, setTemplateType] = useState<'verano' | 'invierno' | 'especial'>('verano');
    const [savedTemplates, setSavedTemplates] = useState<Array<{
        id: string;
        name: string;
        type: 'verano' | 'invierno' | 'especial';
        shifts: Shift[];
        createdAt: Date;
    }>>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
    const [applyMode, setApplyMode] = useState<'overwrite' | 'fill_only'>('fill_only');

    // --- RECURRING SHIFTS STATE ---
    const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
    const [selectedShiftForRecurring, setSelectedShiftForRecurring] = useState<Shift | null>(null);

    // --- DATA HOOKS ---
    const { riders: rosterRiders } = useFleetStore();
    const { vehicles, fetchVehicles } = useVehicleStore();
    const { weekData, loading, motos, riders: weeklyRiders } = useWeeklySchedule(safeFranchiseId, readOnly, selectedDate);

    // Single source of truth: prefer real-time subscription from useWeeklySchedule
    // Fall back to store riders if weekly riders are empty (e.g., during initial load)
    const activeRiders = weeklyRiders.length > 0 ? weeklyRiders : rosterRiders;

    // --- DND SENSORS ---
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
    const [activeDragShift, setActiveDragShift] = useState<Shift | null>(null);

    // Load templates on mount
    useEffect(() => {
        if (safeFranchiseId) {
            loadTemplates();
        }
    }, [safeFranchiseId]);

    const loadTemplates = async () => {
        setIsLoadingTemplates(true);
        try {
            const templates = await shiftService.getWeekTemplates(safeFranchiseId);
            setSavedTemplates(templates);
        } catch (error) {
            console.error('Error loading templates:', error);
        } finally {
            setIsLoadingTemplates(false);
        }
    };

    const saveCurrentWeekAsTemplate = async () => {
        if (!templateName.trim()) {
            alert('Por favor, introduce un nombre para la plantilla');
            return;
        }

        const shiftsToSave = (weekData?.shifts || []).filter((s): s is Shift => !!s.id);
        if (shiftsToSave.length === 0) {
            alert('No hay turnos en la semana actual para guardar');
            return;
        }

        try {
            await shiftService.saveWeekTemplate(
                safeFranchiseId,
                templateName.trim(),
                templateType,
                shiftsToSave
            );
            await loadTemplates();
            setTemplateName('');
            setIsTemplateModalOpen(false);
            alert('Plantilla guardada correctamente');
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Error al guardar la plantilla');
        }
    };

    const applyTemplate = async (templateId: string) => {
        try {
            const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
            const appliedCount = await shiftService.applyWeekTemplate(
                safeFranchiseId,
                templateId,
                weekStart,
                applyMode
            );

            if (appliedCount > 0) {
                alert(`Se aplicaron ${appliedCount} turnos de la plantilla`);
            } else {
                alert('No se aplicaron turnos (todos los huecos estaban ocupados)');
            }
            setIsTemplateModalOpen(false);
        } catch (error) {
            console.error('Error applying template:', error);
            alert('Error al aplicar la plantilla');
        }
    };



    // Filter riders based on search query
    const filteredRiders = useMemo(() => {
        const source = activeRiders.map(r => ({
            ...r,
            // Normalize: useWeeklySchedule riders have minimal interface, enrich if needed
            fullName: r.fullName || (r as { fullName?: string }).fullName || 'Rider',
            email: (r as { email?: string }).email || '',
            phone: (r as { phone?: string }).phone || '',
        }));
        if (!riderSearchQuery.trim()) return source;
        const query = riderSearchQuery.toLowerCase();
        return source.filter(r =>
            r.fullName?.toLowerCase().includes(query) ||
            r.email?.toLowerCase().includes(query) ||
            r.phone?.includes(query)
        );
    }, [activeRiders, riderSearchQuery]);

    const simpleRiders = useMemo(() => filteredRiders.map(r => ({ id: String(r.id), fullName: r.fullName, name: r.fullName })), [filteredRiders]);

    const days = useMemo(() => {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        return Array.from({ length: 7 }).map((_, i) => {
            const date = addDays(new Date(start), i);
            const iso = toLocalDateString(date);
            return {
                date,
                dateObj: date,
                isoDate: iso,
                dayName: format(date, 'EEEE', { locale: es }),
                dayNum: format(date, 'd'),
                label: format(date, 'EEEE d', { locale: es }),
                shortLabel: format(date, 'EEE', { locale: es }),
                isToday: toLocalDateString(new Date()) === iso
            };
        });
    }, [selectedDate]);

    // --- DATA MEMOIZATIONS (Ordered for dependency flow) ---
    const mergedShifts = useMemo(() => {
        const remote = weekData?.shifts || [];
        const filtered = remote.filter(s => !deletedIds.has(String(s.id || s.shiftId)));
        const final = [...filtered];

        localShifts.forEach(ls => {
            const idx = final.findIndex(s => String(s.id || s.shiftId) === String(ls.id || ls.shiftId));
            if (idx >= 0) {
                final[idx] = ls;
            } else {
                final.push(ls);
            }
        });
        return final;
    }, [weekData, localShifts, deletedIds]);

    const isFiltered = useCallback((startStr: string, endStr: string) => {
        if (!showLunch && !showDinner && !showPrime) return true;

        const start = new Date(startStr);
        const end = new Date(endStr);
        const startMin = start.getHours() * 60 + start.getMinutes();
        const endMin = end.getHours() * 60 + end.getMinutes();
        // Handle midnight wrap or multi-day shifts for visual filtering
        const crossesMidnight = end.getTime() > start.getTime() && end.getDate() !== start.getDate();
        const adjustedEndMin = crossesMidnight ? 1440 : (endMin === 0 ? 1440 : endMin);

        if (showPrime) {
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
            if (startMin < lEnd && adjustedEndMin > lStart) visible = true;
        }
        if (showDinner && !visible) {
            const dStart = 1200;
            const dEnd = 1440;
            if (startMin < dEnd && adjustedEndMin > dStart) visible = true;
        }
        return visible;
    }, [showLunch, showDinner, showPrime]);

    const processRiderShifts = useCallback((shifts: Shift[]) => {
        if (!shifts.length) return [];
        const sorted = [...shifts].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

        const visualBlocks: {
            startAt: string;
            endAt: string;
            ids: string[];
            shifts: Shift[];
            type: 'confirmed' | 'request' | 'draft';
            isNew?: boolean;
        }[] = [];
        let currentBlock: typeof visualBlocks[number] | null = null;

        sorted.forEach((s) => {
            const sStart = new Date(s.startAt);
            if (currentBlock &&
                Math.abs(differenceInMinutes(sStart, new Date(currentBlock.endAt))) < 15) {
                currentBlock.endAt = s.endAt;
                currentBlock.ids.push(String(s.id));
                currentBlock.shifts.push(s);
            } else {
                if (currentBlock) visualBlocks.push(currentBlock);
                currentBlock = {
                    startAt: s.startAt,
                    endAt: s.endAt,
                    ids: [String(s.id)],
                    shifts: [s],
                    type: s.isConfirmed ? 'confirmed' : s.changeRequested ? 'request' : 'draft',
                    isNew: s.isNew
                };
            }
        });
        if (currentBlock) visualBlocks.push(currentBlock);
        return visualBlocks;
    }, []);

    const ridersGrid = useMemo(() => {
        const activeRiders = filteredRiders.filter(r => r.status === 'active' || r.status === 'on_route');
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = addDays(new Date(weekStart), 7);
        const weekStartTs = weekStart.getTime();
        const weekEndTs = weekEnd.getTime();

        return activeRiders.map(rider => {
            const riderIdStr = String(rider.id);
            const allRiderShifts = mergedShifts.filter(s => String(s.riderId) === riderIdStr);
            const displayedShifts = allRiderShifts.filter(s => isFiltered(s.startAt, s.endAt));
            const visualBlocks = processRiderShifts(displayedShifts);

            const totalHoursCount = allRiderShifts.reduce((acc, s) => {
                const start = new Date(s.startAt);
                if (start.getTime() < weekStartTs || start.getTime() >= weekEndTs) return acc;
                const end = new Date(s.endAt);
                return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            }, 0);

            return {
                ...rider,
                totalWeeklyHours: totalHoursCount,
                visualBlocks,
                shifts: displayedShifts
            };
        }).sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [filteredRiders, mergedShifts, isFiltered, selectedDate, processRiderShifts]);

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
            const sStart = new Date(s.startAt);
            const sEnd = new Date(s.endAt);

            // Loop through each hour between start and end
            const temp = new Date(sStart);
            temp.setMinutes(0, 0, 0); // Start of the hour

            while (temp.getTime() < sEnd.getTime()) {
                const dateIso = toLocalDateString(temp);
                const hour = temp.getHours();

                // If the shift covers at least part of this hour
                if (res[dateIso]) {
                    res[dateIso][hour]++;
                }
                temp.setHours(temp.getHours() + 1);
            }
        });
        return res;
    }, [days, mergedShifts]);

    const dayViewMinWidth = 1400;

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveDragShift(active.data.current?.shift as Shift);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragShift(null);

        if (!over) return;
        if (readOnly) return;

        const activeShift = active.data.current?.shift as Shift;
        const { dateIso, riderId } = over.data.current || {};

        if (activeShift && dateIso && riderId) {
            // [FIX] Find the rider name for the new riderId to keep it in sync
            const targetRider = rosterRiders.find((r) => String(r.id) === String(riderId));

            saveShift({
                ...activeShift,
                startAt: dateIso + activeShift.startAt.slice(10),
                endAt: dateIso + activeShift.endAt.slice(10),
                riderId: String(riderId),
                riderName: targetRider?.fullName || activeShift.riderName,
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


    // --- MERGE LOGIC REMOVED FROM HERE (MOVED UP) ---

    useEffect(() => {
        if (safeFranchiseId) {
            fetchVehicles(safeFranchiseId);
        }
    }, [fetchVehicles, safeFranchiseId]);

    // Moved up to fix declaration order

    // --- ACTIONS ---
    const saveShift = useCallback(async (shiftData: Partial<Shift>) => {
        if (readOnly) {
            alert("Modo solo lectura: No se pueden guardar cambios.");
            return;
        }

        // VALIDATION: Check for Overlaps
        const newStart = new Date(shiftData.startAt!).getTime();
        const newEnd = new Date(shiftData.endAt!).getTime();
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
            const timeStr = `${format(new Date(shiftData.startAt!), 'HH:mm')} - ${format(new Date(shiftData.endAt!), 'HH:mm')}`;
            const dateStr = format(new Date(shiftData.startAt!), 'dd/MM');

            // 1. Notify Original Rider (if it was an amber shift/change request)
            if (editingShift.changeRequested) {
                await notificationService.notifyFranchise(editingShift.franchiseId, {
                    title: 'Solicitud de Cambio Procesada',
                    message: `Tu solicitud para el turno del ${dateStr} (${timeStr}) ha sido aceptada y el turno reasignado.`,
                    type: 'SYSTEM',
                    priority: 'normal'
                });
            } else {
                // Regular reassignment
                await notificationService.notifyFranchise(editingShift.franchiseId, {
                    title: 'Turno Eliminado/Reasignado',
                    message: `El turno del ${dateStr} (${timeStr}) ha sido asignado a otro rider.`,
                    type: 'SYSTEM',
                    priority: 'normal'
                });
            }

            // 2. Notify New Rider
            await notificationService.notifyFranchise(String(shiftData.riderId!), {
                title: 'Nuevo Turno Asignado',
                message: `Se te ha asignado un nuevo turno para el ${dateStr} de ${timeStr}.`,
                type: 'shift_confirmed',
                priority: 'high'
            });
        }

        const isNewToken = !existingId || (typeof existingId === 'string' && existingId.startsWith('draft-'));

        // [FIX] Get current rider name if not provided
        const finalRiderId = String(shiftData.riderId!);
        const currentRider = simpleRiders.find(r => String(r.id) === finalRiderId);

        const finalShift: Shift = {
            ...shiftData,
            id: existingId || `draft-${crypto.randomUUID()}`,
            isDraft: true,
            isNew: isNewToken,
            changeRequested: false, // Reset change requested if reassigned or edited
            changeReason: null,
            franchiseId: safeFranchiseId,
            riderId: finalRiderId,
            riderName: currentRider?.fullName || shiftData.riderName || 'Rider',
            startAt: shiftData.startAt!,
            endAt: shiftData.endAt!,
            date: shiftData.date || toLocalDateString(new Date(shiftData.startAt!))
        };

        setLocalShifts(prev => {
            const filtered = prev.filter(s => String(s.id) !== String(finalShift.id));
            return [...filtered, finalShift];
        });

        setIsModalOpen(false); // Ensure modal closes
    }, [readOnly, mergedShifts, editingShift, safeFranchiseId, setIsModalOpen, simpleRiders]);

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
    }, [readOnly, setLocalShifts, setDeletedIds]);

    const handlePublish = async () => {
        if (!safeFranchiseId || isPublishing || readOnly) return;
        setIsPublishing(true);
        try {
            for (const id of deletedIds) {
                await shiftService.deleteShift(id);
            }
            for (const s of localShifts) {
                const shiftData: ShiftInput = {
                    franchiseId: safeFranchiseId,
                    riderId: String(s.riderId),
                    riderName: s.riderName || rosterRiders.find((r) => String(r.id) === String(s.riderId))?.fullName || 'Rider',
                    motoId: s.motoId || null,
                    motoPlate: s.motoPlate || '',
                    startAt: s.startAt,
                    endAt: s.endAt,
                    isConfirmed: s.isConfirmed
                };

                const isTrulyNew = (typeof s.id === 'string' && s.id.startsWith('draft-')) || !(weekData?.shifts || []).some(rs => rs.id === s.id);

                if (isTrulyNew) {
                    await shiftService.createShift(shiftData as ShiftInput);
                } else {
                    await shiftService.updateShift(String(s.id), shiftData as Partial<ShiftInput>);
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
        } catch (error) {
            const err = error as Error;
            console.error(err);
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

        const report = {
            score,
            status: (score > 90 ? 'optimal' : score > 70 ? 'warning' : 'critical') as 'optimal' | 'warning' | 'critical',
            feedback: insights,
            details: {
                totalHours,
                overtimeCount: overtimeRiders.length,
                underutilizedCount: underRiders.length,
                coverageScore,
                costEfficiency
            }
        };

        setSheriffData(report);
        setSheriffResult(report);
        setIsSheriffOpen(true);
    };



    const handleCreateShifts = async (shifts: Partial<Shift>[]) => {
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
                    } as Shift);
                }
            });
            return newShifts;
        });
        setIsQuickFillOpen(false);
    };

    // --- EVENT SIMULATION ---
    // --- DAYS REMOVED FROM HERE (MOVED UP) ---

    // --- LIQUID FLOW & DRAG AND DROP ---
    // mergedShifts moved up to fix declaration order



    // --- LIQUID FLOW & DRAG AND DROP ---
    // In a full implementation, we would import DndContext here.
    // For this prototype, we simulate the 'Liquid' visuals first.

    // --- DAY VIEW HELPERS ---
    const getDayViewPosition = (minutes: number) => {
        // [MOD] Optimización de línea de tiempo: Ocultamos de 02:00 a 07:00 (120-420 mins)
        // Esto permite ver más horas útiles en pantalla y reduce drásticamente el scroll horizontal.
        const HIDDEN_START = 120; // 02:00
        const HIDDEN_END = 420;   // 07:00
        const HIDDEN_DUR = 300;   // 5 horas ocultas (300 mins)
        const TOTAL_VISIBLE = 1440 - HIDDEN_DUR; // 1140 minutos totales visibles

        let adjustedMinutes = minutes;
        if (minutes >= HIDDEN_START && minutes < HIDDEN_END) {
            adjustedMinutes = HIDDEN_START; // Colapsar el bloque oculto en un punto
        } else if (minutes >= HIDDEN_END) {
            adjustedMinutes = minutes - HIDDEN_DUR;
        }

        return (adjustedMinutes / TOTAL_VISIBLE) * 100;
    };

    const dayStructure = useMemo(() => {
        // [MOD] Estructura de 24 horas, pero omitiendo el bloque no operativo (02:00-07:00)
        const hours = Array.from({ length: 24 })
            .map((_, h) => h)
            .filter(h => h < 2 || h >= 7) // Mantenemos [0, 1] y [7, 8, ..., 23]
            .map((h) => {
                const slots = Array.from({ length: 4 }).map((_, m) => {
                    const i = h * 4 + m;
                    const minute = m * 15;
                    return {
                        i,
                        h: h + (minute / 60),
                        hour: h,
                        minute,
                        isFullHour: minute === 0,
                        isHalfHour: minute === 30
                    };
                });
                return { hour: h, slots };
            });

        return hours;
    }, []);

    // Note: dayCols was previously used for flattened slot iteration, now replaced by dayStructure
    // Kept this comment for reference in case legacy code needs it

    // --- HELPERS REMOVED FROM HERE (MOVED UP) ---






    // --- CONTEXT MENU STATE ---
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, shift: Shift } | null>(null);

    const handleContextMenu = (e: React.MouseEvent, shift: Shift) => {
        e.preventDefault(); // Prevent native browser menu
        const sId = shift.id || shift.shiftId;
        setSelectedShiftId(sId || null); // Also select on right click
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
    // --- RENDER HELPERS ---
    // Pass handleContextMenu to DraggableShift via a wrapper or prop if possible.
    // Since DraggableShift is inside the map, we need to attach the handler there.

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

    const handleEditShift = (shift: Shift) => {
        if (readOnly) return;
        setEditingShift(shift);
        setIsModalOpen(true);
    };


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
            visualEvents={mergedShifts.reduce((acc: Record<string, ShiftEvent[]>, s: Shift) => {
                // Apply Filters to Mobile View as well
                if (!isFiltered(s.startAt, s.endAt)) return acc;

                const d = toLocalDateString(new Date(s.startAt));
                if (!acc[d]) acc[d] = [];

                // Ensure all mandatory fields for ShiftEvent are present
                acc[d].push({
                    shiftId: s.id || s.shiftId || `mob_${Math.random()}`,
                    riderId: s.riderId || 'unassigned',
                    riderName: s.riderName || 'Sin Asignar',
                    startAt: s.startAt,
                    endAt: s.endAt,
                    visualStart: new Date(s.startAt),
                    visualEnd: new Date(s.endAt),
                    isConfirmed: s.isConfirmed,
                    swapRequested: s.swapRequested,
                    changeRequested: s.changeRequested,
                    changeReason: s.changeReason,
                    isDraft: s.isDraft,
                    franchiseId: s.franchiseId,
                });
                return acc;
            }, {})}
            onEditShift={(shift) => handleEditShift(shift as Shift)}
            onDeleteShift={deleteShift}
            onAddShift={handleAddShift}
            isRiderMode={true} // Enable Premium HUD/Animations for Admins on Mobile too!
            isManagerView={roleConfig?.role !== 'rider'} // Show rider names if not a rider
        />;
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden font-sans @container">
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
                    hasChanges={hasUnsavedChanges}
                    onAutoFill={() => setIsQuickFillOpen(true)}
                    onOpenGuide={() => setIsGuideOpen(true)}
                />

                <SchedulerGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
                <QuickFillModal
                    isOpen={isQuickFillOpen}
                    onClose={() => setIsQuickFillOpen(false)}
                    franchiseId={safeFranchiseId}
                    weekDays={days}
                    riders={activeRiders.map(r => ({ id: r.id, name: r.fullName, email: '' }))}
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

                            <div className="h-6 w-px bg-slate-200 mx-2" />

                            {/* Rider Search */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar rider..."
                                    value={riderSearchQuery}
                                    onChange={(e) => setRiderSearchQuery(e.target.value)}
                                    className="w-40 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                {riderSearchQuery && (
                                    <button
                                        onClick={() => setRiderSearchQuery('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        title="Limpiar búsqueda"
                                        aria-label="Limpiar búsqueda"
                                    >
                                        <XCircle size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Compact Mode Toggle */}
                            <button
                                onClick={() => setCompactMode(!compactMode)}
                                title={compactMode ? "Modo expandido" : "Modo compacto"}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-normal rounded-lg border flex items-center gap-1.5 transition-all",
                                    compactMode
                                        ? "bg-indigo-100 border-indigo-300 text-indigo-700 shadow-sm"
                                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                                )}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    {compactMode ? (
                                        <><path d="M4 6h16M4 10h16M4 14h16M4 18h16" /></>
                                    ) : (
                                        <><path d="M4 6h16M4 12h16M4 18h16" /></>
                                    )}
                                </svg>
                                <span className="hidden sm:inline">{compactMode ? 'Compacto' : 'Normal'}</span>
                            </button>
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

                            {!readOnly && (
                                <>
                                    <button
                                        onClick={() => {
                                            setTemplateMode('save');
                                            setIsTemplateModalOpen(true);
                                        }}
                                        title="Guardar semana actual como plantilla"
                                        className="px-3 py-1.5 text-xs font-normal rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition-all"
                                    >
                                        <Save size={14} />
                                        <span className="hidden sm:inline">Guardar Plantilla</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setTemplateMode('load');
                                            loadTemplates();
                                            setIsTemplateModalOpen(true);
                                        }}
                                        title="Cargar plantilla guardada"
                                        className="px-3 py-1.5 text-xs font-normal rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-1.5 transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                                        <span className="hidden sm:inline">Cargar Plantilla</span>
                                    </button>
                                </>
                            )}

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
                                <button
                                    onClick={() => setSheriffResult(null)}
                                    className="p-1 hover:bg-black/5 rounded-full transition-colors"
                                    title="Cerrar reporte"
                                >
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
                <div className="flex-1 overflow-x-auto overflow-y-hidden bg-white relative flex flex-col min-h-0 touch-pan-x">

                    {/* SINGLE SCROLL CONTEXT WRAPPER - Forces unified width */}
                    <div className="flex flex-col min-w-full h-full relative">

                        {/* HEADER - Floating Glass Effect */}
                        <div className="flex-none flex w-full border-b border-indigo-100 bg-white/95 backdrop-blur-sm z-30 h-10 shadow-sm sticky top-0">
                            {/* CORNER (Riders Label) */}
                            <div className="w-52 lg:w-52 xl:w-64 flex-none border-r border-slate-200 bg-slate-50 flex items-center px-4 sticky left-0 z-[60] shadow-[4px_0_24px_-4px_rgba(0,0,0,0.1)]">
                                <span className="text-xs uppercase font-medium tracking-widest text-slate-400">Riders</span>
                            </div>

                            {/* COLUMNS */}
                            <div className="flex-1 flex min-w-0">
                                {viewMode === 'week' ? (
                                    days.map((d) => {
                                        const isHighVolume = ['vie', 'sáb', 'dom', 'fri', 'sat', 'sun'].some(day => d.shortLabel.toLowerCase().includes(day));
                                        return (
                                            <div key={d.isoDate} className={cn(
                                                "flex-1 border-r border-slate-200 flex items-center justify-center gap-1 min-w-[80px] md:min-w-[100px] last:border-r-0 relative overflow-hidden",
                                                isHighVolume ? "bg-indigo-50/40" : ""
                                            )}>
                                                {isHighVolume && (
                                                    <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-bl-full z-10 opacity-80" title="Volumen Alto" />
                                                )}
                                                <span className={cn("text-xs font-medium uppercase tracking-wide truncate px-1", isToday(d.dateObj) ? "text-indigo-600" : (isHighVolume ? "text-slate-700 font-medium" : "text-slate-400"))}>{d.shortLabel}</span>
                                                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-xs font-normal shrink-0", isToday(d.dateObj) ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400")}>
                                                    {format(d.dateObj, 'd')}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex-1 flex transition-all" style={{ minWidth: `${dayViewMinWidth}px` }}>
                                        {/* Timeline Header Day View - 24h with 15-min intervals */}
                                        {dayStructure.map((hObj) => {
                                            return (
                                                <div key={hObj.hour} className="flex-1 flex border-l-2 border-slate-400 relative group h-full">
                                                    {/* 15-min Slots with Labels */}
                                                    {hObj.slots.map((slot) => {
                                                        const isHour = slot.minute === 0;
                                                        const isHalfHour = slot.minute === 30;


                                                        return (
                                                            <div
                                                                key={slot.i}
                                                                className={cn(
                                                                    "flex-1 h-full relative flex items-center justify-center",
                                                                    // Border styling based on interval
                                                                    isHour ? "" : isHalfHour
                                                                        ? "border-l border-slate-300 border-dashed"
                                                                        : "border-l border-slate-200/60",
                                                                    // Prime time highlight
                                                                    ((slot.h >= 12 && slot.h < 16.5) || (slot.h >= 20 && slot.h < 24))
                                                                        ? "bg-amber-50/20"
                                                                        : "bg-white"
                                                                )}
                                                            >
                                                                {/* Time Label - Mostramos solo :00 y :30 para evitar solapamientos en vista fluida */}
                                                                <span className={cn(
                                                                    "text-[9px] font-medium pointer-events-none select-none",
                                                                    isHour
                                                                        ? "text-slate-700 font-bold"
                                                                        : isHalfHour
                                                                            ? "text-slate-500/60"
                                                                            : "hidden"
                                                                )}>
                                                                    {isHour ? `${hObj.hour}:00` : ":30"}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* BODY (ROWS) */}
                        <div className="flex-1 flex flex-col min-h-0 bg-white relative">
                            {ridersGrid.map((rider, index) => (
                                <div
                                    key={rider.id}
                                    className={cn(
                                        "flex-1 flex w-full border-b border-indigo-50 transition-all duration-200 group relative",
                                        compactMode ? "min-h-[40px]" : "min-h-[64px]",
                                        "hover:z-20 overflow-visible"
                                    )}
                                >
                                    <div className="absolute inset-0 pointer-events-none bg-indigo-50/0 group-hover:bg-indigo-50/30 transition-colors z-20 border-y border-transparent group-hover:border-indigo-200/50" />
                                    <div className="absolute top-1/2 left-0 w-full h-px bg-slate-100 z-0 pointer-events-none border-t border-dashed border-slate-200/50" />

                                    {/* RIDER META (LEFT COL) - Sticky */}
                                    <div className={cn(
                                        "w-full md:w-52 lg:w-52 xl:w-64 flex-none border-r border-slate-200 flex items-center px-4 py-1 relative transition-colors sticky left-0 z-[60] shadow-[4px_0_24px_-4px_rgba(0,0,0,0.1)]",
                                        index % 2 === 0 ? "bg-white group-hover:bg-[#F8FAFC]" : "bg-[#F8FAFC] group-hover:bg-[#F8FAFC]"
                                    )}>
                                        <div className="flex items-center gap-3 w-full">
                                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium text-white shadow-sm shrink-0 ring-1 ring-white/50 transition-transform group-hover:scale-105", getRiderColor(rider.id).bg)}>
                                                {getRiderInitials(rider.fullName)}
                                            </div>
                                            <div className="min-w-0 flex-1 flex flex-col justify-center gap-1 overflow-hidden">
                                                <p className="text-sm font-normal text-slate-700 truncate group-hover:text-indigo-700 transition-colors">{rider.fullName}</p>
                                                <div className="flex items-center gap-2 xl:gap-1">
                                                    <span className="text-[10px] xl:text-[9.5px] font-normal text-slate-400 bg-slate-100 px-2 xl:px-1.5 py-0.5 xl:py-0 rounded-full border border-slate-200/50 whitespace-nowrap flex items-center gap-1">
                                                        <PenLine size={12} className="text-slate-400 xl:scale-90" /> <span className="font-normal text-slate-600">{rider.contractHours || 40}h</span>
                                                    </span>
                                                    <span className={cn(
                                                        "text-[10px] xl:text-[9.5px] font-normal px-2 xl:px-1.5 py-0.5 xl:py-0 rounded-full border whitespace-nowrap flex items-center gap-1 transition-colors",
                                                        (rider.totalWeeklyHours || 0) > (rider.contractHours || 40)
                                                            ? "bg-rose-50 text-rose-600 border-rose-200"
                                                            : ((rider.contractHours || 40) - (rider.totalWeeklyHours || 0)) > 5
                                                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                                : "bg-amber-50 text-amber-600 border-amber-200"
                                                    )}>
                                                        <Bike size={12} className="xl:scale-90" /> <span className="font-normal">{(rider.totalWeeklyHours || 0).toFixed(1)}h</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SCHEDULE COLS (RIGHT) */}
                                    <div className="flex-1 flex min-w-0 relative" >
                                        {viewMode === 'week' ? (
                                            days.map(d => {
                                                const dayShifts = (rider.shifts as Shift[]).filter((s: Shift) => toLocalDateString(new Date(s.startAt)) === d.isoDate);
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
                                                        onClick={() => {
                                                            if (visualBlocks.length === 0) {
                                                                handleAddShift(d.isoDate, rider.id);
                                                            }
                                                        }}
                                                        activeDragShift={activeDragShift}
                                                        className={cn(
                                                            "flex-1 border-r border-slate-200 last:border-r-0 relative p-0.5 min-w-[100px] h-full",
                                                            isCurrentDay ? "bg-indigo-50/5" : ""
                                                        )}
                                                    >
                                                        <div className="w-full h-full flex flex-col justify-center gap-0.5">
                                                            {visualBlocks.map((block, idx) => {
                                                                const primaryShift = block.shifts[0];
                                                                return (
                                                                    <div key={block.ids[0]} className="w-full relative group/shift flex-1 min-h-0">
                                                                        <DraggableShift
                                                                            shift={primaryShift}
                                                                            gridId={`shift-${primaryShift.id}-${idx}`}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleEditShift(primaryShift);
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
                                            <div className="w-full h-full relative" style={{ minWidth: `${dayViewMinWidth}px` }}>
                                                {/* Grid Background - Nested Structure */}
                                                <div className="absolute inset-0 flex pointer-events-none">
                                                    {dayStructure.map((hObj) => (
                                                        <div key={hObj.hour} className="flex-1 flex border-l-2 border-slate-400 h-full">
                                                            {hObj.slots.map((slot) => {
                                                                const isHour = slot.minute === 0;
                                                                const isHalfHour = slot.minute === 30;

                                                                return (
                                                                    <DroppableCell
                                                                        key={slot.i}
                                                                        dateIso={toLocalDateString(selectedDate)}
                                                                        riderId={rider.id}
                                                                        onQuickAdd={(qh) => handleQuickAdd(toLocalDateString(selectedDate), rider.id, qh)}
                                                                        onDoubleClick={() => handleAddShift(toLocalDateString(selectedDate), rider.id, slot.h)}
                                                                        onClick={() => handleAddShift(toLocalDateString(selectedDate), rider.id, slot.h)}
                                                                        isToday={isToday(selectedDate)}
                                                                        className={cn(
                                                                            "flex-1 h-full transition-all duration-300 min-w-0",
                                                                            // Border styling matching header
                                                                            isHour ? "" : isHalfHour
                                                                                ? "border-l border-slate-300 border-dashed"
                                                                                : "border-l border-slate-200/60",
                                                                            // Prime time highlight
                                                                            ((slot.h >= 12 && slot.h < 16.5) || (slot.h >= 20 && slot.h < 24))
                                                                                ? "bg-amber-50/20"
                                                                                : "bg-white"
                                                                        )}
                                                                        hour={slot.h}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="relative w-full h-full z-10 pointer-events-none">
                                                    {(rider.shifts as Shift[]).filter((s: Shift) => toLocalDateString(new Date(s.startAt)) === toLocalDateString(selectedDate)).map((shift: Shift) => {
                                                        const start = new Date(shift.startAt);
                                                        const end = new Date(shift.endAt);
                                                        const startMin = start.getHours() * 60 + start.getMinutes();
                                                        const durationMin = differenceInMinutes(end, start);
                                                        const leftPct = getDayViewPosition(startMin);
                                                        const widthPct = getDayViewPosition(startMin + durationMin) - leftPct;

                                                        if (widthPct <= 0 || leftPct >= 100 || (leftPct + widthPct) <= 0) return null;

                                                        return (
                                                            <div
                                                                key={shift.id}
                                                                className="absolute top-[2px] bottom-[2px] z-20 hover:z-50 transition-all duration-200 ease-out rounded-md overflow-hidden shadow-sm hover:shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.02] hover:brightness-105 cursor-pointer ring-0 hover:ring-1 hover:ring-white/50 pointer-events-auto"
                                                                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                                            >
                                                                <DraggableShift
                                                                    shift={shift}
                                                                    gridId={`shift-${shift.id}-day`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleEditShift(shift);
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

                        {/* FOOTER */}
                        <div className="bg-white border-t border-slate-200 flex items-stretch shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.02)] z-30 min-h-[40px] flex-none sticky bottom-0">
                            <div className="w-52 lg:w-52 xl:w-64 flex-none flex items-center px-4 border-r border-slate-200 bg-slate-50/90 backdrop-blur-sm sticky left-0 z-40 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.1)]">
                                <span className="text-xs font-normal text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500" /> Riders / Turno
                                </span>
                            </div>
                            <div className="flex-1 flex min-w-0">
                                {viewMode === 'week' ? (
                                    days.map(d => {
                                        const counts = coverage[d.isoDate] || Array(24).fill(0);
                                        const noonCount = counts[14] || 0;
                                        const nightCount = counts[21] || 0;
                                        return (
                                            <div key={d.isoDate} className="flex-1 border-r border-slate-100 last:border-r-0 flex justify-center items-center py-2 min-w-[100px]">
                                                <div className="flex items-center gap-4 opacity-100">
                                                    <div className="flex items-center gap-1.5" title="Mediodía (14:00)">
                                                        <Sun className="w-5 h-5 text-amber-500" />
                                                        <span className="text-sm font-normal text-slate-600 w-5 text-center">{noonCount}</span>
                                                    </div>
                                                    <div className="w-px h-4 bg-slate-200" />
                                                    <div className="flex items-center gap-1.5" title="Noche (21:00)">
                                                        <Moon className="w-5 h-5 text-indigo-500" />
                                                        <span className="text-sm font-normal text-slate-600 w-5 text-center">{nightCount}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex-1 flex items-center px-6 py-2" style={{ minWidth: `${dayViewMinWidth}px` }}>
                                        {(() => {
                                            const iso = toLocalDateString(selectedDate);
                                            const counts = coverage[iso] || Array(24).fill(0);
                                            const noonCount = counts[14] || 0;
                                            const nightCount = counts[21] || 0;
                                            return (
                                                <div className="flex items-center gap-8">
                                                    <div className="flex items-center gap-2">
                                                        <Sun className="w-5 h-5 text-amber-500 shrink-0" />
                                                        <span className="text-xs font-medium text-slate-500 uppercase tracking-tight">Mediodía:</span>
                                                        <span className="text-sm font-bold text-slate-700">{noonCount}</span>
                                                    </div>
                                                    <div className="w-px h-4 bg-slate-200" />
                                                    <div className="flex items-center gap-2">
                                                        <Moon className="w-5 h-5 text-indigo-500 shrink-0" />
                                                        <span className="text-xs font-medium text-slate-500 uppercase tracking-tight">Noche:</span>
                                                        <span className="text-sm font-bold text-slate-700">{nightCount}</span>
                                                    </div>
                                                    <div className="ml-auto text-[10px] text-slate-400 font-medium italic">
                                                        Cobertura para el {format(selectedDate, 'd MMMM', { locale: es })}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {
                    isModalOpen && (
                        <ShiftModal
                            isOpen={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                            onSave={saveShift}
                            onDelete={(sId) => deleteShift(sId)}
                            initialData={editingShift ? {
                                shiftId: String(editingShift.id),
                                riderId: editingShift.riderId,
                                startAt: editingShift.startAt,
                                endAt: editingShift.endAt,
                                changeRequested: editingShift.changeRequested,
                                changeReason: editingShift.changeReason
                            } : null}
                            selectedDate={selectedDateForNew || toLocalDateString(selectedDate)}
                            prefillHour={prefillHour}
                            riders={simpleRiders}
                            motos={vehicles.map(v => ({ id: String(v.id || 'none'), licensePlate: String(v.plate || ''), model: String(v.model || '') }))}
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
                {
                    createPortal(
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
                    )
                }

                {/* CONTEXT MENU */}
                {
                    contextMenu && (
                        <ShiftContextMenu
                            x={contextMenu.x}
                            y={contextMenu.y}
                            shift={contextMenu.shift as unknown as ContextMenuShift}
                            onClose={() => setContextMenu(null)}
                            onValidate={(s) => {
                                setLocalShifts(prev => prev.map(ls =>
                                    String(ls.id) === String(s.id) ? { ...ls, isConfirmed: true } : ls
                                ));
                            }}
                            onDuplicate={(s) => handleDuplicateShift(s as Shift)}
                            onEdit={() => {
                                setEditingShift(contextMenu.shift as Shift);
                                setIsModalOpen(true);
                            }}
                            onDelete={(s) => deleteShift(String(s.id))}
                            onMakeRecurring={(s) => {
                                setSelectedShiftForRecurring(s as Shift);
                                setIsRecurringModalOpen(true);
                            }}
                        />

                    )
                }

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

            </DndContext >

            {/* SHERIFF REPORT MODAL (AUDIT 3.0) */}
            < SheriffReportModal
                isOpen={isSheriffOpen}
                onClose={() => setIsSheriffOpen(false)}
                data={sheriffData}
            />

            {/* WEEK TEMPLATES MODAL */}
            {isTemplateModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                            <h3 className="font-bold text-slate-900">
                                {templateMode === 'save' ? '💾 Guardar Plantilla' : '📋 Cargar Plantilla'}
                            </h3>
                            <button
                                onClick={() => setIsTemplateModalOpen(false)}
                                className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                                title="Cerrar"
                                aria-label="Cerrar modal de plantillas"
                            >
                                <XCircle size={20} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {templateMode === 'save' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Nombre de la plantilla
                                        </label>
                                        <input
                                            type="text"
                                            value={templateName}
                                            onChange={(e) => setTemplateName(e.target.value)}
                                            placeholder="Ej: Semana Tipo Verano"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Tipo de plantilla
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: 'verano', label: '☀️ Verano', color: 'bg-amber-100 text-amber-700 border-amber-300' },
                                                { id: 'invierno', label: '❄️ Invierno', color: 'bg-blue-100 text-blue-700 border-blue-300' },
                                                { id: 'especial', label: '⭐ Especial', color: 'bg-purple-100 text-purple-700 border-purple-300' }
                                            ].map((type) => (
                                                <button
                                                    key={type.id}
                                                    onClick={() => setTemplateType(type.id as 'verano' | 'invierno' | 'especial')}
                                                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${templateType === type.id
                                                        ? type.color + ' ring-2 ring-offset-1'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600">
                                        <p>Se guardarán <strong>{weekData?.shifts?.length || 0} turnos</strong> de la semana actual.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {isLoadingTemplates ? (
                                        <div className="text-center py-8">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400 mb-2" />
                                            <p className="text-sm text-slate-500">Cargando plantillas...</p>
                                        </div>
                                    ) : savedTemplates.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500">
                                            <p>No tienes plantillas guardadas.</p>
                                            <p className="text-sm mt-1">Guarda una semana como plantilla primero.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                {savedTemplates.map((template) => (
                                                    <div
                                                        key={template.id}
                                                        className="p-4 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all cursor-pointer group"
                                                        onClick={() => applyTemplate(template.id)}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h4 className="font-semibold text-slate-900">{template.name}</h4>
                                                                <p className="text-xs text-slate-500 mt-1">
                                                                    {template.type === 'verano' && '☀️ Verano'}
                                                                    {template.type === 'invierno' && '❄️ Invierno'}
                                                                    {template.type === 'especial' && '⭐ Especial'}
                                                                    {' • '}
                                                                    {template.shifts.length} turnos
                                                                    {' • '}
                                                                    {template.createdAt.toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (confirm('¿Eliminar esta plantilla?')) {
                                                                        shiftService.deleteWeekTemplate(template.id).then(() => loadTemplates());
                                                                    }
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all"
                                                                title="Eliminar plantilla"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="border-t border-slate-200 pt-4">
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Modo de aplicación
                                                </label>
                                                <div className="space-y-2">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="applyMode"
                                                            checked={applyMode === 'fill_only'}
                                                            onChange={() => setApplyMode('fill_only')}
                                                            className="text-indigo-600"
                                                        />
                                                        <span className="text-sm text-slate-700">Solo llenar huecos vacíos (recomendado)</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="applyMode"
                                                            checked={applyMode === 'overwrite'}
                                                            onChange={() => setApplyMode('overwrite')}
                                                            className="text-indigo-600"
                                                        />
                                                        <span className="text-sm text-slate-700">Sobrescribir toda la semana</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
                            <button
                                onClick={() => setIsTemplateModalOpen(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            {templateMode === 'save' && (
                                <button
                                    onClick={saveCurrentWeekAsTemplate}
                                    disabled={!templateName.trim()}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Guardar Plantilla
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* RECURRING SHIFTS MODAL */}
            <RecurringShiftModal
                isOpen={isRecurringModalOpen}
                onClose={() => {
                    setIsRecurringModalOpen(false);
                    setSelectedShiftForRecurring(null);
                }}
                onSuccess={() => {
                    // Refresh the schedule
                    console.log('Turnos recurrentes creados exitosamente');
                }}
                baseShift={selectedShiftForRecurring ? {
                    franchiseId: safeFranchiseId,
                    riderId: selectedShiftForRecurring.riderId,
                    riderName: selectedShiftForRecurring.riderName || 'Sin asignar',
                    motoId: selectedShiftForRecurring.motoId,
                    motoPlate: selectedShiftForRecurring.motoPlate || '',
                    startAt: selectedShiftForRecurring.startAt,
                    endAt: selectedShiftForRecurring.endAt,
                    isDraft: true
                } : null}
                franchiseId={safeFranchiseId}
            />
        </div>
    );
};

export default DeliveryScheduler;
